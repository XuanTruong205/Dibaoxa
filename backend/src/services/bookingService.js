import QRCode from 'qrcode';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { ENV } from '../config/env.js';
import { getVipTier } from '../config/loyalty.js';
import { dateRangesOverlap, getTodayDateString, parseStayDates } from '../utils/dateUtils.js';
import { httpError } from '../utils/httpError.js';
import { withKeyedMutex } from '../utils/keyedMutex.js';
import { createBankTransferRef, createBookingCode, createCheckinToken, createHoldId, createTransactionRef } from '../utils/secureIds.js';
import { assertVietQrConfigured, buildVietQrPayment } from './vietqrService.js';

const HOLD_TTL_SECONDS = 600;
const ACTIVE_INVENTORY_STATUSES = ['confirmed', 'checked_in'];

function roomMutexKey(roomId) {
  return `room:${roomId}`;
}

export function withRoomInventoryLock(roomId, operation) {
  const key = roomMutexKey(roomId);
  return withKeyedMutex(key, () => redisClient.withLock(key, operation));
}

function holdListKey(roomId) {
  return `room_holds:${roomId}`;
}

function holdLookupKey(holdId) {
  return `hold_lookup:${holdId}`;
}

export async function getRoomActiveHolds(roomId) {
  const raw = await redisClient.get(holdListKey(roomId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Invalid hold collection');
    const now = Date.now();
    return parsed.filter((hold) => Number(hold.expires_at) > now);
  } catch {
    await redisClient.del(holdListKey(roomId));
    return [];
  }
}

async function saveActiveHolds(roomId, holds) {
  const key = holdListKey(roomId);
  if (holds.length === 0) return redisClient.del(key);

  const maxExpiry = Math.max(...holds.map((hold) => Number(hold.expires_at) || 0));
  const ttl = Math.max(1, Math.ceil((maxExpiry - Date.now()) / 1000));
  return redisClient.set(key, JSON.stringify(holds), 'EX', ttl);
}

async function saveHoldLookup(hold) {
  const ttl = Math.max(1, Math.ceil((hold.expires_at - Date.now()) / 1000));
  await redisClient.set(holdLookupKey(hold.holdId), hold.room_id, 'EX', ttl);
}

async function getReservedRoomCount(tx, roomId, checkInDate, checkOutDate, excludeBookingId) {
  const now = new Date();
  const aggregate = await tx.booking.aggregate({
    where: {
      room_id: roomId,
      ...(excludeBookingId && { id: { not: excludeBookingId } }),
      AND: [
        { check_in_date: { lt: checkOutDate } },
        { check_out_date: { gt: checkInDate } },
      ],
      OR: [
        { status: { in: ACTIVE_INVENTORY_STATUSES } },
        { status: 'pending_payment', payment_expires_at: { gt: now } },
      ],
    },
    _sum: { room_quantity: true },
  });
  return aggregate._sum.room_quantity || 0;
}

function assertRoomQuantity(room, quantity, reservedCount, heldCount = 0) {
  if (quantity > room.total_rooms || reservedCount + heldCount + quantity > room.total_rooms) {
    throw httpError(409, 'Số phòng còn lại không đủ cho yêu cầu này.', 'ROOM_UNAVAILABLE');
  }
}

function buildPendingBookingResponse(booking, payment, room, hotel) {
  return {
    booking_id: booking.id,
    booking_code: booking.booking_code,
    status: booking.status,
    hotel_name: hotel?.name,
    room_name: room?.name,
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    total_price: booking.total_price,
    payment: payment ? {
      transaction_ref: payment.transaction_ref,
      payment_method: payment.payment_method,
      status: payment.status,
      amount: payment.amount,
      expires_at: booking.payment_expires_at,
    } : null,
    payment_qr: buildVietQrPayment(payment, booking.payment_expires_at),
  };
}

export async function holdRoom({ room_id, check_in_date, check_out_date, userId, quantity = 1 }) {
  parseStayDates(check_in_date, check_out_date);

  const holdResult = await withRoomInventoryLock(room_id, async () => {
    const room = await prisma.room.findUnique({ where: { id: room_id }, include: { hotel: true } });
    if (!room || !room.is_available) {
      throw httpError(404, 'Phòng này không tồn tại hoặc đang ngừng bán.', 'ROOM_NOT_AVAILABLE');
    }

    const holds = await getRoomActiveHolds(room_id);
    const existingHold = holds.find((hold) => (
      hold.userId === userId &&
      hold.check_in_date === check_in_date &&
      hold.check_out_date === check_out_date &&
      hold.quantity === quantity
    ));
    if (existingHold) return { hold: existingHold, room };

    const otherHolds = holds.filter((hold) => !(
      hold.userId === userId &&
      hold.check_in_date === check_in_date &&
      hold.check_out_date === check_out_date
    ));
    const overlappingHolds = otherHolds.filter((hold) => dateRangesOverlap(
      hold.check_in_date,
      hold.check_out_date,
      check_in_date,
      check_out_date
    ));
    const heldCount = overlappingHolds.reduce((sum, hold) => sum + hold.quantity, 0);
    const reservedCount = await getReservedRoomCount(prisma, room_id, check_in_date, check_out_date);
    assertRoomQuantity(room, quantity, reservedCount, heldCount);

    const hold = {
      holdId: createHoldId(),
      userId,
      room_id,
      hotel_id: room.hotel_id,
      check_in_date,
      check_out_date,
      quantity,
      expires_at: Date.now() + HOLD_TTL_SECONDS * 1000,
    };
    await saveActiveHolds(room_id, [...otherHolds, hold]);
    await saveHoldLookup(hold);
    return { hold, room };
  });

  const { hold, room } = holdResult;
  const demoPaymentQrUrl = ENV.PAYMENT_MODE === 'demo' && ENV.NODE_ENV !== 'production'
    ? await QRCode.toDataURL(`DIBAOXA_DEMO_PAYMENT_${hold.holdId}`)
    : null;
  return {
    hold_id: hold.holdId,
    room_id,
    hotel_id: room.hotel_id,
    room_name: room.name,
    hotel_name: room.hotel.name,
    price_per_night: room.price_per_night,
    quantity: hold.quantity,
    ttl_seconds: Math.max(0, Math.ceil((hold.expires_at - Date.now()) / 1000)),
    expires_at: new Date(hold.expires_at).toISOString(),
    demo_payment_qr_url: demoPaymentQrUrl,
  };
}

export async function releaseHold(holdId, userId) {
  const roomId = await redisClient.get(holdLookupKey(holdId));
  if (!roomId) throw httpError(404, 'Phiên giữ phòng không tồn tại hoặc đã hết hạn.', 'HOLD_NOT_FOUND');

  return withRoomInventoryLock(roomId, async () => {
    const holds = await getRoomActiveHolds(roomId);
    const hold = holds.find((item) => item.holdId === holdId);
    if (!hold) {
      await redisClient.del(holdLookupKey(holdId));
      throw httpError(404, 'Phiên giữ phòng không tồn tại hoặc đã hết hạn.', 'HOLD_NOT_FOUND');
    }
    if (hold.userId !== userId) {
      throw httpError(403, 'Bạn không có quyền giải phóng phiên giữ phòng này.', 'HOLD_FORBIDDEN');
    }

    await saveActiveHolds(roomId, holds.filter((item) => item.holdId !== holdId));
    await redisClient.del(holdLookupKey(holdId));
    return { hold_id: holdId, room_id: roomId, hotel_id: hold.hotel_id };
  });
}

async function getVerifiedServices(tx, serviceSelections, hotelId) {
  const quantities = new Map();
  for (const selection of serviceSelections) {
    if (quantities.has(selection.service_id)) {
      throw httpError(400, 'Mỗi dịch vụ chỉ được xuất hiện một lần.', 'DUPLICATE_SERVICE');
    }
    quantities.set(selection.service_id, selection.quantity);
  }
  if (quantities.size === 0) return [];

  const services = await tx.service.findMany({ where: { id: { in: [...quantities.keys()] }, hotel_id: hotelId } });
  if (services.length !== quantities.size) {
    throw httpError(400, 'Có dịch vụ không thuộc khách sạn này.', 'INVALID_SERVICE');
  }
  return services.map((service) => ({
    service_id: service.id,
    quantity: quantities.get(service.id),
    price: service.price,
  }));
}

export async function confirmBooking({
  userId,
  room_id,
  check_in_date,
  check_out_date,
  guest_name,
  guest_phone,
  total_guests,
  quantity = 1,
  services = [],
  payment_method,
  hold_id,
}) {
  const { nights } = parseStayDates(check_in_date, check_out_date);
  if (payment_method === 'Demo' && (ENV.PAYMENT_MODE !== 'demo' || ENV.NODE_ENV === 'production')) {
    throw httpError(400, 'Thanh toán mô phỏng không được bật trên môi trường này.', 'DEMO_PAYMENT_DISABLED');
  }
  if (payment_method === 'VietQR') assertVietQrConfigured();

  const existing = await prisma.booking.findUnique({
    where: { hold_id },
    include: { payments: true, room: true, hotel: true },
  });
  if (existing) {
    if (existing.user_id !== userId) throw httpError(409, 'Phiên giữ phòng đã được sử dụng.', 'HOLD_ALREADY_USED');
    const payment = existing.payments[0];
    return buildPendingBookingResponse(existing, payment, existing.room, existing.hotel);
  }

  return withRoomInventoryLock(room_id, async () => {
    const duplicate = await prisma.booking.findUnique({
      where: { hold_id },
      include: { payments: true, room: true, hotel: true },
    });
    if (duplicate) {
      if (duplicate.user_id !== userId) throw httpError(409, 'Phiên giữ phòng đã được sử dụng.', 'HOLD_ALREADY_USED');
      return buildPendingBookingResponse(duplicate, duplicate.payments[0], duplicate.room, duplicate.hotel);
    }

    const room = await prisma.room.findUnique({ where: { id: room_id }, include: { hotel: true } });
    if (!room || !room.is_available) throw httpError(404, 'Không tìm thấy thông tin phòng.', 'ROOM_NOT_FOUND');
    if (total_guests > room.max_occupancy * quantity) {
      throw httpError(400, `Số khách tối đa là ${room.max_occupancy * quantity} người.`, 'TOO_MANY_GUESTS');
    }

    const holds = await getRoomActiveHolds(room_id);
    const ownedHold = holds.find((hold) => (
      hold.holdId === hold_id && hold.userId === userId &&
      hold.check_in_date === check_in_date && hold.check_out_date === check_out_date &&
      hold.quantity === quantity
    ));
    if (!ownedHold) {
      throw httpError(409, 'Phiên giữ phòng không tồn tại, đã hết hạn hoặc không thuộc tài khoản này.', 'HOLD_INVALID');
    }

    const verifiedServices = await getVerifiedServices(prisma, services, room.hotel_id);
    const roomTotal = room.price_per_night * nights * quantity;
    const servicesTotal = verifiedServices.reduce((sum, service) => sum + service.price * service.quantity, 0);
    const grandTotal = roomTotal + servicesTotal;
    if (!Number.isSafeInteger(grandTotal) || grandTotal < 0) {
      throw httpError(400, 'Tổng tiền không hợp lệ.', 'INVALID_TOTAL');
    }

    const result = await prisma.$transaction(async (tx) => {
      const reservedCount = await getReservedRoomCount(tx, room_id, check_in_date, check_out_date);
      assertRoomQuantity(room, quantity, reservedCount);

      const booking = await tx.booking.create({
        data: {
          hotel_id: room.hotel_id,
          room_id: room.id,
          user_id: userId,
          guest_name,
          guest_phone,
          hold_id,
          check_in_date,
          check_out_date,
          total_guests,
          room_quantity: quantity,
          total_price: grandTotal,
          earned_points: 0,
          status: 'pending_payment',
          payment_expires_at: new Date(ownedHold.expires_at),
          booking_code: createBookingCode(),
          qr_code: createCheckinToken(),
        },
      });

      if (verifiedServices.length > 0) {
        await tx.bookingService.createMany({
          data: verifiedServices.map((service) => ({ ...service, booking_id: booking.id })),
        });
      }

      const payment = await tx.payment.create({
        data: {
          booking_id: booking.id,
          amount: grandTotal,
          payment_method,
          status: 'pending',
          transaction_ref: payment_method === 'VietQR'
            ? createBankTransferRef()
            : createTransactionRef(payment_method.toUpperCase()),
        },
      });
      return { booking, payment };
    });

    try {
      const currentHolds = await getRoomActiveHolds(room_id);
      await saveActiveHolds(room_id, currentHolds.filter((hold) => hold.holdId !== hold_id));
      await redisClient.del(holdLookupKey(hold_id));
    } catch (error) {
      console.error('Unable to release converted room hold:', error);
    }

    return buildPendingBookingResponse(result.booking, result.payment, room, room.hotel);
  });
}

export async function completePaidBooking({ bookingId, transactionRef, expectedAmount, userId }) {
  const settled = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true, hotel: true, room: true },
    });
    if (!booking || (userId && booking.user_id !== userId)) {
      throw httpError(404, 'Không tìm thấy đơn đặt phòng.', 'BOOKING_NOT_FOUND');
    }
    if (booking.status === 'cancelled') {
      throw httpError(409, 'Đơn đã hủy không thể được xác nhận thanh toán.', 'BOOKING_CANCELLED');
    }

    const payment = transactionRef
      ? booking.payments.find((item) => item.transaction_ref === transactionRef)
      : booking.payments.find((item) => item.status === 'pending') || booking.payments[0];
    if (!payment) throw httpError(404, 'Không tìm thấy giao dịch thanh toán.', 'PAYMENT_NOT_FOUND');
    if (expectedAmount !== undefined && payment.amount !== expectedAmount) {
      throw httpError(400, 'Số tiền thanh toán không khớp với đơn đặt phòng.', 'PAYMENT_AMOUNT_MISMATCH');
    }

    if (booking.status === 'confirmed' && payment.status === 'completed') {
      return { booking, payment, already_completed: true };
    }
    if (booking.status !== 'pending_payment' || payment.status !== 'pending') {
      throw httpError(409, 'Trạng thái đơn hoặc thanh toán không còn hợp lệ.', 'INVALID_PAYMENT_STATE');
    }
    if (booking.payment_expires_at && booking.payment_expires_at <= new Date()) {
      throw httpError(409, 'Phiên thanh toán đã hết hạn.', 'PAYMENT_EXPIRED');
    }

    const earnedPoints = Math.floor(booking.total_price / 10_000);
    const transition = await tx.booking.updateMany({
      where: { id: booking.id, status: 'pending_payment' },
      data: { status: 'confirmed', earned_points: earnedPoints },
    });
    if (transition.count !== 1) {
      throw httpError(409, 'Đơn vừa được xử lý bởi một yêu cầu khác.', 'BOOKING_ALREADY_PROCESSED');
    }
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });

    if (earnedPoints > 0) {
      const updatedUser = await tx.user.update({
        where: { id: booking.user_id },
        data: { reward_points: { increment: earnedPoints } },
      });
      const tier = getVipTier(updatedUser.reward_points);
      if (updatedUser.vip_tier !== tier) {
        await tx.user.update({ where: { id: booking.user_id }, data: { vip_tier: tier } });
      }
    }

    const updatedBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      include: { hotel: true, room: true },
    });
    return { booking: updatedBooking, payment: updatedPayment, already_completed: false };
  });

  return {
    booking_id: settled.booking.id,
    booking_code: settled.booking.booking_code,
    status: settled.booking.status,
    hotel_id: settled.booking.hotel_id,
    room_id: settled.booking.room_id,
    hotel_name: settled.booking.hotel.name,
    room_name: settled.booking.room.name,
    check_in_date: settled.booking.check_in_date,
    check_out_date: settled.booking.check_out_date,
    total_price: settled.booking.total_price,
    payment_method: settled.payment.payment_method,
    payment_status: settled.payment.status,
    transaction_ref: settled.payment.transaction_ref,
    qr_code_url: await QRCode.toDataURL(settled.booking.qr_code),
    earned_points: settled.booking.earned_points,
    already_completed: settled.already_completed,
  };
}

export async function getUserBookings(userId) {
  const bookings = await prisma.booking.findMany({
    where: { user_id: userId },
    include: {
      hotel: { select: { name: true, city: true, address: true, cover_image: true } },
      room: { select: { name: true, room_type: true, bed_type: true } },
      booking_services: { include: { service: true } },
      payments: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return Promise.all(bookings.map(async (booking) => {
    const canUseCheckinQr = ['confirmed', 'checked_in'].includes(booking.status);
    return {
      ...booking,
      qr_code: canUseCheckinQr ? booking.qr_code : null,
      qr_data_url: canUseCheckinQr ? await QRCode.toDataURL(booking.qr_code) : null,
    };
  }));
}

export async function cancelBooking(bookingId, userId) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, user_id: userId },
      include: { payments: true },
    });
    if (!booking) throw httpError(404, 'Không tìm thấy đơn đặt phòng.', 'BOOKING_NOT_FOUND');
    if (booking.status === 'cancelled') throw httpError(409, 'Đơn đã được hủy trước đó.', 'BOOKING_CANCELLED');
    if (booking.status === 'checked_in') throw httpError(409, 'Không thể hủy đơn sau khi đã check-in.', 'ALREADY_CHECKED_IN');
    if (booking.check_in_date <= getTodayDateString()) {
      throw httpError(409, 'Không thể hủy đơn từ ngày nhận phòng trở đi.', 'CANCELLATION_WINDOW_CLOSED');
    }

    const now = new Date();
    const transition = await tx.booking.updateMany({
      where: { id: booking.id, status: { not: 'cancelled' } },
      data: { status: 'cancelled', cancelled_at: now },
    });
    if (transition.count !== 1) throw httpError(409, 'Đơn vừa được xử lý bởi yêu cầu khác.', 'BOOKING_ALREADY_PROCESSED');

    await tx.payment.updateMany({
      where: { booking_id: booking.id, status: 'completed' },
      data: { status: 'refunded', refunded_at: now },
    });
    await tx.payment.updateMany({
      where: { booking_id: booking.id, status: 'pending' },
      data: { status: 'cancelled' },
    });

    if (booking.earned_points > 0) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const newPoints = Math.max(0, user.reward_points - booking.earned_points);
      await tx.user.update({
        where: { id: userId },
        data: { reward_points: newPoints, vip_tier: getVipTier(newPoints) },
      });
    }

    return tx.booking.findUnique({ where: { id: booking.id }, include: { payments: true } });
  });
}
