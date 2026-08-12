import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { cancelBooking, completePaidBooking, withRoomInventoryLock } from './bookingService.js';
import { parseJsonArray, serializeHotel } from './hotelService.js';
import { ENV } from '../config/env.js';
import { getTodayDateString, parseStayDates } from '../utils/dateUtils.js';
import { httpError } from '../utils/httpError.js';
import { createBookingCode, createCheckinToken, createTransactionRef } from '../utils/secureIds.js';
import { cancelTravelOrder, confirmDemoTravelOrder, serializeTravelOrder } from './travelOrderService.js';

const STATUS_LABELS = {
  pending_payment: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked-In',
  checked_out: 'Checked-Out',
  cancelled: 'Cancelled',
};

function assertHotelScope(actor, hotelId) {
  if (actor.role === 'receptionist' && (!actor.assigned_hotel || actor.assigned_hotel !== hotelId)) {
    throw httpError(403, 'Bạn không được phân quyền cho khách sạn này.', 'HOTEL_SCOPE_FORBIDDEN');
  }
}

function scopedHotelId(actor) {
  if (actor.role !== 'receptionist') return undefined;
  if (!actor.assigned_hotel) {
    throw httpError(403, 'Tài khoản lễ tân chưa được gán khách sạn. Vui lòng liên hệ quản trị viên.', 'HOTEL_ASSIGNMENT_REQUIRED');
  }
  return actor.assigned_hotel;
}

function paymentStatusLabel(status) {
  return {
    completed: 'Đã thanh toán',
    refunded: 'Đã hoàn tiền',
    failed: 'Thất bại',
    cancelled: 'Đã hủy',
    pending: 'Đang chờ',
  }[status] || status;
}

export function serializeAdminBooking(booking) {
  const payment = booking.payments?.[0];
  return {
    id: booking.id,
    booking_code: booking.booking_code,
    qr_code: booking.qr_code,
    traveler_name: booking.guest_name || booking.user?.full_name,
    traveler_email: booking.user?.email,
    traveler_phone: booking.guest_phone || booking.user?.phone,
    hotel_id: booking.hotel_id,
    hotel_name: booking.hotel?.name,
    destination: booking.hotel?.city,
    room_id: booking.room_id,
    room_name: booking.room?.name,
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    total_guests: booking.total_guests,
    room_quantity: booking.room_quantity,
    total_price: booking.total_price,
    payment_method: payment?.payment_method,
    payment_status: paymentStatusLabel(payment?.status),
    status: STATUS_LABELS[booking.status] || booking.status,
    created_at: booking.created_at,
    updated_at: booking.updated_at,
  };
}

const bookingIncludes = {
  user: { select: { id: true, full_name: true, email: true, phone: true } },
  hotel: { select: { id: true, name: true, city: true } },
  room: { select: { id: true, name: true, room_type: true } },
  payments: { orderBy: { created_at: 'desc' } },
};

function hotelWriteData(input) {
  return {
    name: input.name,
    city: input.city,
    address: input.address,
    star_rating: input.star_rating,
    description: input.description,
    cover_image: input.cover_image,
    operator_company: input.operator_company || null,
    amenities: JSON.stringify(input.amenities || []),
    gallery_images: JSON.stringify(input.gallery_images || []),
    highlights: JSON.stringify(input.highlights || []),
    highlight_bullets: JSON.stringify(input.highlight_bullets || []),
    policies: JSON.stringify(input.policies || []),
    faqs: JSON.stringify(input.faqs || []),
  };
}

function roomWriteData(room) {
  return {
    name: room.name,
    room_type: room.room_type,
    price_per_night: room.price_per_night,
    max_occupancy: room.max_occupancy,
    bed_type: room.bed_type,
    area_sqm: room.area_sqm,
    view_type: room.view_type,
    images: JSON.stringify(room.images || []),
    room_services: JSON.stringify(room.room_services || []),
    total_rooms: room.total_rooms,
    is_available: room.is_available,
  };
}

export async function listHotels(actor) {
  const hotelId = scopedHotelId(actor);
  const hotels = await prisma.hotel.findMany({
    where: hotelId ? { id: hotelId } : {},
    include: { rooms: true, services: true, reviews: { include: { user: { select: { id: true, full_name: true, email: true } } }, orderBy: { created_at: 'desc' } } },
    orderBy: { created_at: 'desc' },
  });
  return hotels.map(serializeHotel);
}

export async function createHotel(input) {
  const hotel = await prisma.hotel.create({
    data: {
      ...hotelWriteData(input),
      rooms: { create: (input.rooms || []).map(roomWriteData) },
      services: { create: (input.services || []).map((service) => ({
        name: service.name,
        price: service.price,
        description: service.description,
      })) },
    },
    include: { rooms: true, services: true, reviews: { include: { user: { select: { id: true, full_name: true, email: true } } }, orderBy: { created_at: 'desc' } } },
  });
  return serializeHotel(hotel);
}

export async function updateHotel(hotelId, input) {
  const existing = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!existing) throw httpError(404, 'Không tìm thấy khách sạn.', 'HOTEL_NOT_FOUND');

  await prisma.$transaction(async (tx) => {
    await tx.hotel.update({ where: { id: hotelId }, data: hotelWriteData(input) });

    const [storedRooms, storedServices] = await Promise.all([
      tx.room.findMany({ where: { hotel_id: hotelId }, select: { id: true, name: true } }),
      tx.service.findMany({ where: { hotel_id: hotelId }, select: { id: true, name: true } }),
    ]);
    const requestedRoomIds = new Set((input.rooms || []).map((room) => room.id).filter(Boolean));
    const requestedServiceIds = new Set((input.services || []).map((service) => service.id).filter(Boolean));

    for (const room of storedRooms.filter((item) => !requestedRoomIds.has(item.id))) {
      const bookingCount = await tx.booking.count({ where: { room_id: room.id } });
      if (bookingCount > 0) {
        throw httpError(409, `Không thể xóa phòng "${room.name}" vì đã có đơn đặt phòng. Hãy tắt trạng thái bán phòng thay thế.`, 'ROOM_HAS_BOOKINGS');
      }
      await tx.room.delete({ where: { id: room.id } });
    }

    for (const service of storedServices.filter((item) => !requestedServiceIds.has(item.id))) {
      const usageCount = await tx.bookingService.count({ where: { service_id: service.id } });
      if (usageCount > 0) {
        throw httpError(409, `Không thể xóa dịch vụ "${service.name}" vì đã được sử dụng trong đơn đặt phòng.`, 'SERVICE_HAS_BOOKINGS');
      }
      await tx.service.delete({ where: { id: service.id } });
    }

    for (const room of input.rooms || []) {
      if (room.id) {
        const result = await tx.room.updateMany({ where: { id: room.id, hotel_id: hotelId }, data: roomWriteData(room) });
        if (!result.count) throw httpError(404, 'Không tìm thấy phòng cần cập nhật.', 'ROOM_NOT_FOUND');
      } else {
        await tx.room.create({ data: { hotel_id: hotelId, ...roomWriteData(room) } });
      }
    }
    for (const service of input.services || []) {
      const data = { name: service.name, price: service.price, description: service.description };
      if (service.id) {
        const result = await tx.service.updateMany({ where: { id: service.id, hotel_id: hotelId }, data });
        if (!result.count) throw httpError(404, 'Không tìm thấy dịch vụ cần cập nhật.', 'SERVICE_NOT_FOUND');
      } else {
        await tx.service.create({ data: { hotel_id: hotelId, ...data } });
      }
    }
  });
  return serializeHotel(await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: { rooms: true, services: true, reviews: { include: { user: { select: { id: true, full_name: true, email: true } } }, orderBy: { created_at: 'desc' } } },
  }));
}

export async function deleteReview(reviewId) {
  const deleted = await prisma.review.deleteMany({ where: { id: reviewId } });
  if (!deleted.count) throw httpError(404, 'Không tìm thấy đánh giá cần xóa.', 'REVIEW_NOT_FOUND');
  return { id: reviewId };
}

export async function deleteHotel(hotelId) {
  const bookings = await prisma.booking.count({ where: { hotel_id: hotelId } });
  if (bookings > 0) throw httpError(409, 'Không thể xóa khách sạn đã có đơn đặt phòng.', 'HOTEL_HAS_BOOKINGS');
  await prisma.hotel.delete({ where: { id: hotelId } });
  return { id: hotelId };
}

export async function addRoom(hotelId, roomData) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw httpError(404, 'Không tìm thấy khách sạn.', 'HOTEL_NOT_FOUND');
  const room = await prisma.room.create({ data: { hotel_id: hotelId, ...roomWriteData(roomData) } });
  return { ...room, images: parseJsonArray(room.images), room_services: parseJsonArray(room.room_services) };
}

export async function listBookings(actor, { status, page = 1, limit = 50 }) {
  const hotelId = scopedHotelId(actor);
  const where = { ...(hotelId && { hotel_id: hotelId }), ...(status && { status }) };
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingIncludes,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings: bookings.map(serializeAdminBooking), pagination: { page, limit, total } };
}

export async function listTravelOrders(actor, { status, page = 1, limit = 50 }) {
  if (actor.role !== 'admin') {
    throw httpError(403, 'Chỉ quản trị viên hệ thống được xem đơn vé máy bay và du thuyền.', 'ADMIN_ONLY');
  }
  const expiredOrders = await prisma.travelOrder.findMany({
    where: { status: 'pending_payment', payment_expires_at: { lte: new Date() } },
    select: { id: true },
  });
  if (expiredOrders.length) {
    const expiredIds = expiredOrders.map((order) => order.id);
    await prisma.$transaction([
      prisma.travelOrder.updateMany({ where: { id: { in: expiredIds } }, data: { status: 'expired' } }),
      prisma.travelOrderPayment.updateMany({ where: { order_id: { in: expiredIds }, status: 'pending' }, data: { status: 'cancelled' } }),
    ]);
  }
  const where = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.travelOrder.findMany({
      where,
      include: {
        payments: { orderBy: { created_at: 'desc' } },
        user: { select: { id: true, full_name: true, email: true, phone: true } },
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.travelOrder.count({ where }),
  ]);
  return {
    orders: orders.map((order) => ({ ...serializeTravelOrder(order), customer: order.user })),
    pagination: { page, limit, total },
  };
}

export async function confirmTravelOrderByAdmin(orderId) {
  const order = await prisma.travelOrder.findUnique({ where: { id: orderId }, select: { user_id: true } });
  if (!order) throw httpError(404, 'Không tìm thấy đơn dịch vụ.', 'TRAVEL_ORDER_NOT_FOUND');
  return confirmDemoTravelOrder(orderId, order.user_id);
}

export async function cancelTravelOrderByAdmin(orderId) {
  const order = await prisma.travelOrder.findUnique({ where: { id: orderId }, select: { user_id: true } });
  if (!order) throw httpError(404, 'Không tìm thấy đơn dịch vụ.', 'TRAVEL_ORDER_NOT_FOUND');
  return cancelTravelOrder(orderId, order.user_id);
}

export async function createBookingByAdmin(actor, input) {
  const room = await prisma.room.findUnique({ where: { id: input.room_id }, include: { hotel: true } });
  if (!room || !room.is_available) throw httpError(404, 'Không tìm thấy phòng đang bán.', 'ROOM_NOT_FOUND');
  assertHotelScope(actor, room.hotel_id);
  const user = input.user_id
    ? await prisma.user.findUnique({ where: { id: input.user_id } })
    : await prisma.user.findUnique({ where: { email: input.traveler_email.toLowerCase() } });
  if (!user) throw httpError(404, 'Khách hàng chưa có tài khoản. Hãy tạo tài khoản trước.', 'USER_NOT_FOUND');
  if (input.payment_method === 'Demo' && (ENV.PAYMENT_MODE !== 'demo' || ENV.NODE_ENV === 'production')) {
    throw httpError(400, 'Thanh toán mô phỏng không được bật trên môi trường này.', 'DEMO_PAYMENT_DISABLED');
  }
  if (input.mark_paid && (actor.role !== 'admin' || !['Cash', 'Manual'].includes(input.payment_method))) {
    throw httpError(403, 'Thanh toán tại quầy chỉ được quản trị viên ghi nhận bằng Cash hoặc Manual.', 'MARK_PAID_FORBIDDEN');
  }
  if (['Cash', 'Manual'].includes(input.payment_method) && !input.mark_paid) {
    throw httpError(400, 'Cash hoặc Manual chỉ dùng khi đã thu tiền tại quầy.', 'INVALID_MANUAL_PAYMENT');
  }
  const { nights } = parseStayDates(input.check_in_date, input.check_out_date);

  const created = await withRoomInventoryLock(room.id, async () => prisma.$transaction(async (tx) => {
    const reserved = await tx.booking.aggregate({
      where: {
        room_id: room.id,
        AND: [
          { check_in_date: { lt: input.check_out_date } },
          { check_out_date: { gt: input.check_in_date } },
        ],
        OR: [
          { status: { in: ['confirmed', 'checked_in'] } },
          { status: 'pending_payment', payment_expires_at: { gt: new Date() } },
        ],
      },
      _sum: { room_quantity: true },
    });
    if ((reserved._sum.room_quantity || 0) + input.room_quantity > room.total_rooms) {
      throw httpError(409, 'Không đủ phòng trống cho khoảng thời gian đã chọn.', 'ROOM_UNAVAILABLE');
    }
    const total = room.price_per_night * nights * input.room_quantity;
    const booking = await tx.booking.create({
      data: {
        hotel_id: room.hotel_id,
        room_id: room.id,
        user_id: user.id,
        guest_name: input.guest_name,
        guest_phone: input.guest_phone,
        check_in_date: input.check_in_date,
        check_out_date: input.check_out_date,
        total_guests: input.total_guests,
        room_quantity: input.room_quantity,
        total_price: total,
        status: 'pending_payment',
        payment_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        booking_code: createBookingCode(),
        qr_code: createCheckinToken(),
      },
    });
    const payment = await tx.payment.create({
      data: {
        booking_id: booking.id,
        amount: total,
        payment_method: input.payment_method,
        status: 'pending',
        transaction_ref: createTransactionRef(input.payment_method.toUpperCase()),
      },
    });
    return { booking, payment };
  }));

  if (input.mark_paid) {
    await completePaidBooking({
      bookingId: created.booking.id,
      transactionRef: created.payment.transaction_ref,
      expectedAmount: created.payment.amount,
    });
  }
  const booking = await prisma.booking.findUnique({ where: { id: created.booking.id }, include: bookingIncludes });
  return serializeAdminBooking(booking);
}

export async function cancelBookingByAdmin(actor, bookingId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw httpError(404, 'Không tìm thấy đơn đặt phòng.', 'BOOKING_NOT_FOUND');
  assertHotelScope(actor, booking.hotel_id);
  await cancelBooking(booking.id, booking.user_id);
  return serializeAdminBooking(await prisma.booking.findUnique({ where: { id: booking.id }, include: bookingIncludes }));
}

export async function checkinWithQR(qrCode, actor) {
  const booking = await prisma.booking.findFirst({
    where: actor.role === 'admin'
      ? { OR: [{ qr_code: qrCode }, { booking_code: qrCode }] }
      : { qr_code: qrCode },
    include: { ...bookingIncludes, booking_services: { include: { service: true } } },
  });
  if (!booking) throw httpError(404, 'Mã check-in không hợp lệ.', 'BOOKING_NOT_FOUND');
  assertHotelScope(actor, booking.hotel_id);
  if (booking.status === 'checked_in') throw httpError(409, 'Đơn đã được check-in trước đó.', 'ALREADY_CHECKED_IN');
  if (booking.status !== 'confirmed') throw httpError(409, 'Chỉ đơn đã xác nhận mới được check-in.', 'INVALID_CHECKIN_STATUS');
  if (!booking.payments.some((payment) => payment.status === 'completed')) {
    throw httpError(409, 'Đơn chưa hoàn tất thanh toán.', 'PAYMENT_NOT_COMPLETED');
  }
  const today = getTodayDateString();
  if (today < booking.check_in_date || today >= booking.check_out_date) {
    throw httpError(409, 'Hôm nay nằm ngoài thời gian lưu trú của đơn.', 'CHECKIN_DATE_NOT_ALLOWED');
  }

  const transition = await prisma.booking.updateMany({
    where: { id: booking.id, status: 'confirmed' },
    data: { status: 'checked_in', checked_in_at: new Date(), checked_in_by: actor.userId },
  });
  if (!transition.count) throw httpError(409, 'Đơn vừa được xử lý bởi yêu cầu khác.', 'BOOKING_ALREADY_PROCESSED');
  return serializeAdminBooking(await prisma.booking.findUnique({ where: { id: booking.id }, include: bookingIncludes }));
}

export async function listPayments(actor, { page = 1, limit = 50, status }) {
  const hotelId = scopedHotelId(actor);
  const where = { ...(status && { status }), ...(hotelId && { booking: { hotel_id: hotelId } }) };
  const travelWhere = status ? { status } : {};
  const offset = (page - 1) * limit;
  const hotelStatusSql = status ? Prisma.sql`AND p.status = ${status}` : Prisma.empty;
  const hotelScopeSql = hotelId ? Prisma.sql`AND b.hotel_id = ${hotelId}` : Prisma.empty;
  const travelStatusSql = status ? Prisma.sql`AND tp.status = ${status}` : Prisma.empty;
  const hotelPageSql = Prisma.sql`
    SELECT p.id AS id, 'hotel' AS source_type, p.created_at AS created_at
    FROM payments p
    INNER JOIN bookings b ON b.id = p.booking_id
    WHERE 1 = 1 ${hotelStatusSql} ${hotelScopeSql}
  `;
  const travelPageSql = Prisma.sql`
    SELECT tp.id AS id, 'travel' AS source_type, tp.created_at AS created_at
    FROM travel_order_payments tp
    WHERE 1 = 1 ${travelStatusSql}
  `;
  const pageSql = actor.role === 'admin'
    ? Prisma.sql`${hotelPageSql} UNION ALL ${travelPageSql} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`
    : Prisma.sql`${hotelPageSql} ORDER BY created_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`;

  const [pageRows, hotelTotal, travelTotal] = await Promise.all([
    prisma.$queryRaw(pageSql),
    prisma.payment.count({ where }),
    actor.role === 'admin' ? prisma.travelOrderPayment.count({ where: travelWhere }) : Promise.resolve(0),
  ]);

  const hotelIds = pageRows.filter((row) => row.source_type === 'hotel').map((row) => row.id);
  const travelIds = pageRows.filter((row) => row.source_type === 'travel').map((row) => row.id);
  const [hotelPayments, travelPayments] = await Promise.all([
    hotelIds.length ? prisma.payment.findMany({
      where: { id: { in: hotelIds } },
      include: { booking: { include: {
        user: { select: { id: true, full_name: true, email: true, phone: true } },
        hotel: { select: { id: true, name: true, city: true } },
        room: { select: { id: true, name: true, room_type: true } },
      } } },
    }) : Promise.resolve([]),
    travelIds.length ? prisma.travelOrderPayment.findMany({
      where: { id: { in: travelIds } },
      include: { order: { include: { user: { select: { id: true, full_name: true, email: true, phone: true } } } } },
    }) : Promise.resolve([]),
  ]);

  const normalized = new Map([
    ...hotelPayments.map((payment) => [`hotel:${payment.id}`, {
      ...payment,
      source_type: 'hotel',
      booking_code: payment.booking.booking_code,
      product_title: `${payment.booking.hotel.name} - ${payment.booking.room.name}`,
      user: payment.booking.user,
    }]),
    ...travelPayments.map((payment) => [`travel:${payment.id}`, {
      ...payment,
      source_type: payment.order.product_type,
      booking_code: payment.order.order_code,
      product_title: payment.order.title,
      user: payment.order.user,
      order: undefined,
    }]),
  ]);
  const payments = pageRows.map((row) => normalized.get(`${row.source_type}:${row.id}`)).filter(Boolean);
  const total = hotelTotal + travelTotal;
  return { payments, pagination: { page, limit, total } };
}

export async function listUsers(actor, { page = 1, limit = 50, role, group }) {
  const hotelId = scopedHotelId(actor);
  const roleFilter = role
    ? { role }
    : group === 'customers'
      ? { role: 'customer' }
      : group === 'staff'
        ? { role: { in: ['admin', 'receptionist'] } }
        : {};
  const where = {
    ...roleFilter,
    ...(hotelId && { bookings: { some: { hotel_id: hotelId } } }),
  };
  const select = {
    id: true, email: true, full_name: true, phone: true, assigned_hotel: true,
    reward_points: true, vip_tier: true, role: true, created_at: true,
    _count: { select: {
      bookings: hotelId ? { where: { hotel_id: hotelId } } : true,
      travel_orders: actor.role === 'admin',
    } },
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, select, orderBy: { created_at: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.user.count({ where }),
  ]);
  return { users, pagination: { page, limit, total } };
}

export async function createUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: input.full_name,
      phone: input.phone || null,
      role: input.role,
      assigned_hotel: input.assigned_hotel || null,
    },
    select: {
      id: true, email: true, full_name: true, phone: true, assigned_hotel: true,
      reward_points: true, vip_tier: true, role: true, created_at: true,
      _count: { select: { bookings: true, travel_orders: true } },
    },
  });
}

export async function updateUser(actor, userId, input) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw httpError(404, 'Không tìm thấy tài khoản.', 'USER_NOT_FOUND');

  const effectiveRole = input.role || existing.role;
  const effectiveHotel = Object.hasOwn(input, 'assigned_hotel') ? input.assigned_hotel : existing.assigned_hotel;
  if (effectiveRole === 'receptionist' && !effectiveHotel) {
    throw httpError(400, 'Lễ tân phải được gán khách sạn.', 'HOTEL_ASSIGNMENT_REQUIRED');
  }
  if (actor.userId === userId && input.role && input.role !== 'admin') {
    throw httpError(409, 'Không thể tự hạ quyền tài khoản quản trị đang đăng nhập.', 'CANNOT_CHANGE_OWN_ROLE');
  }

  const data = {
    ...(input.email && { email: input.email.toLowerCase() }),
    ...(input.full_name && { full_name: input.full_name }),
    ...(Object.hasOwn(input, 'phone') && { phone: input.phone || null }),
    ...(input.role && { role: input.role }),
    ...(input.role && input.role !== 'receptionist'
      ? { assigned_hotel: null }
      : Object.hasOwn(input, 'assigned_hotel') && { assigned_hotel: input.assigned_hotel || null }),
    ...(input.password && { password_hash: await bcrypt.hash(input.password, 12) }),
  };

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, email: true, full_name: true, phone: true, assigned_hotel: true,
      reward_points: true, vip_tier: true, role: true, created_at: true,
      _count: { select: { bookings: true, travel_orders: true } },
    },
  });
}

export async function deleteUser(actor, userId) {
  if (actor.userId === userId) {
    throw httpError(409, 'Không thể xóa tài khoản đang đăng nhập.', 'CANNOT_DELETE_SELF');
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, _count: { select: { bookings: true, reviews: true, travel_orders: true } } },
  });
  if (!user) throw httpError(404, 'Không tìm thấy tài khoản.', 'USER_NOT_FOUND');
  const linkedRecords = user._count.bookings + user._count.reviews + user._count.travel_orders;
  if (linkedRecords > 0) {
    throw httpError(409, 'Không thể xóa tài khoản đã phát sinh đơn hoặc đánh giá. Hãy giữ tài khoản để bảo toàn lịch sử.', 'USER_HAS_HISTORY');
  }
  await prisma.user.delete({ where: { id: userId } });
  return { id: userId };
}

export async function listPackages() {
  const packages = await prisma.travelPackage.findMany({ orderBy: { created_at: 'desc' } });
  return packages.map((item) => ({ ...item, included: parseJsonArray(item.included) }));
}

export async function createPackage(input) {
  const item = await prisma.travelPackage.create({ data: { ...input, included: JSON.stringify(input.included) } });
  return { ...item, included: parseJsonArray(item.included) };
}

export async function updatePackage(id, input) {
  const item = await prisma.travelPackage.update({
    where: { id },
    data: { ...input, included: JSON.stringify(input.included) },
  });
  return { ...item, included: parseJsonArray(item.included) };
}

export async function deletePackage(id) {
  await prisma.travelPackage.delete({ where: { id } });
  return { id };
}

export async function listStaff(actor) {
  const hotelId = scopedHotelId(actor);
  return prisma.staffDirectory.findMany({
    where: hotelId ? { assigned_hotel: hotelId } : {},
    orderBy: { created_at: 'desc' },
  });
}

export async function createStaff(input) {
  return prisma.staffDirectory.create({ data: input });
}

export async function updateStaff(id, input) {
  return prisma.staffDirectory.update({ where: { id }, data: input });
}

export async function deleteStaff(id) {
  await prisma.staffDirectory.delete({ where: { id } });
  return { id };
}

export async function getOccupancyReport(actor, checkInDate, checkOutDate) {
  const checkIn = checkInDate || getTodayDateString();
  const defaultOut = new Date(`${checkIn}T00:00:00.000Z`);
  defaultOut.setUTCDate(defaultOut.getUTCDate() + 1);
  const checkOut = checkOutDate || defaultOut.toISOString().slice(0, 10);
  const { nights } = parseStayDates(checkIn, checkOut, { allowPast: true });
  const hotelId = scopedHotelId(actor);
  const hotelWhere = hotelId ? { id: hotelId } : {};
  const bookingWhere = {
    ...(hotelId && { hotel_id: hotelId }),
    status: { in: ['confirmed', 'checked_in', 'checked_out'] },
    AND: [{ check_in_date: { lt: checkOut } }, { check_out_date: { gt: checkIn } }],
  };
  const reportStart = new Date(new Date(`${checkIn}T00:00:00.000Z`).getTime() - 24 * 60 * 60 * 1000);
  const reportEnd = new Date(`${checkOut}T00:00:00.000Z`);
  const [hotels, bookings, payments, totalHotelBookings, travelOrders, travelPayments] = await Promise.all([
    prisma.hotel.findMany({ where: hotelWhere, include: { rooms: true } }),
    prisma.booking.findMany({ where: bookingWhere, include: { hotel: true } }),
    prisma.payment.findMany({
      where: { status: 'completed', booking: bookingWhere },
      include: { booking: { include: { hotel: true } } },
    }),
    prisma.booking.count({ where: { ...(hotelId && { hotel_id: hotelId }) } }),
    actor.role === 'admin' ? prisma.travelOrder.findMany({
      where: checkInDate || checkOutDate ? { created_at: { gte: reportStart, lt: reportEnd } } : {},
      select: { id: true, product_type: true, status: true, total_price: true },
    }) : Promise.resolve([]),
    actor.role === 'admin' ? prisma.travelOrderPayment.findMany({
      where: {
        status: 'completed',
        ...(checkInDate || checkOutDate ? {
          OR: [
            { created_at: { gte: reportStart, lt: reportEnd } },
            { updated_at: { gte: reportStart, lt: reportEnd } },
          ],
        } : {}),
      },
      include: { order: { select: { product_type: true } } },
    }) : Promise.resolve([]),
  ]);

  const totalRooms = hotels.reduce((sum, hotel) => sum + hotel.rooms.reduce((roomSum, room) => roomSum + room.total_rooms, 0), 0);
  const occupiedRoomNights = bookings.reduce((sum, booking) => {
    const start = booking.check_in_date > checkIn ? booking.check_in_date : checkIn;
    const end = booking.check_out_date < checkOut ? booking.check_out_date : checkOut;
    const overlap = parseStayDates(start, end, { allowPast: true }).nights;
    return sum + overlap * booking.room_quantity;
  }, 0);
  const availableRoomNights = totalRooms * nights;
  const hotelRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const travelRevenue = travelPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRevenue = hotelRevenue + travelRevenue;
  const totalTravelOrders = actor.role === 'admin' ? await prisma.travelOrder.count() : 0;

  const cityStats = new Map();
  for (const hotel of hotels) {
    const current = cityStats.get(hotel.city) || { city: hotel.city, hotel_count: 0, booking_count: 0, revenue: 0 };
    current.hotel_count += 1;
    cityStats.set(hotel.city, current);
  }
  for (const booking of bookings) cityStats.get(booking.hotel.city).booking_count += 1;
  for (const payment of payments) cityStats.get(payment.booking.hotel.city).revenue += payment.amount;

  return {
    period: { check_in: checkIn, check_out: checkOut, nights },
    summary: {
      total_hotels: hotels.length,
      total_rooms: totalRooms,
      total_bookings: totalHotelBookings + totalTravelOrders,
      total_hotel_bookings: totalHotelBookings,
      total_travel_orders: totalTravelOrders,
      active_bookings: bookings.length + travelOrders.filter((order) => order.status === 'confirmed').length,
      occupancy_rate: availableRoomNights ? Number(((occupiedRoomNights / availableRoomNights) * 100).toFixed(1)) : 0,
      occupied_room_nights: occupiedRoomNights,
      available_room_nights: availableRoomNights,
      total_revenue_vnd: totalRevenue,
      hotel_revenue_vnd: hotelRevenue,
      travel_revenue_vnd: travelRevenue,
    },
    city_breakdown: [...cityStats.values()],
    service_breakdown: [
      { type: 'hotel', label: 'Khách sạn', order_count: bookings.length, revenue: hotelRevenue },
      { type: 'cruise', label: 'Du thuyền', order_count: travelOrders.filter((order) => order.product_type === 'cruise').length, revenue: travelPayments.filter((payment) => payment.order.product_type === 'cruise').reduce((sum, payment) => sum + payment.amount, 0) },
      { type: 'flight', label: 'Vé máy bay', order_count: travelOrders.filter((order) => order.product_type === 'flight').length, revenue: travelPayments.filter((payment) => payment.order.product_type === 'flight').reduce((sum, payment) => sum + payment.amount, 0) },
    ],
  };
}
