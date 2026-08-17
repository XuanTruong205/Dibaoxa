import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { getVipTier } from '../config/loyalty.js';
import { createBankTransferRef, createBookingCode, createTransactionRef } from '../utils/secureIds.js';
import { getTodayDateString } from '../utils/dateUtils.js';
import { httpError } from '../utils/httpError.js';
import { verifyFlightQuoteToken } from './flightService.js';
import { assertCruiseInventory, withCruiseDepartureLock } from './cruiseInventoryService.js';
import { assertVietQrConfigured, buildVietQrPayment } from './vietqrService.js';

const PAYMENT_WINDOW_MS = 15 * 60 * 1000;

function parseSnapshot(value) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
}

export function serializeTravelOrder(order) {
  const payments = order.payments || [];
  return {
    id: order.id,
    order_code: order.order_code,
    product_type: order.product_type,
    product_ref: order.product_ref,
    title: order.title,
    summary: order.summary,
    product_snapshot: parseSnapshot(order.product_snapshot),
    traveler: {
      full_name: order.traveler_name,
      email: order.traveler_email,
      phone: order.traveler_phone,
      note: order.traveler_note || '',
    },
    quantity: order.quantity,
    unit_price: order.unit_price,
    total_price: order.total_price,
    status: order.status,
    payment_expires_at: order.payment_expires_at,
    earned_points: order.earned_points,
    payments,
    payment_qr: buildVietQrPayment(payments[0], order.payment_expires_at),
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}

async function buildCruisePricing(input) {
  const cruise = await prisma.cruise.findFirst({ where: { id: input.product_id, status: 'active' } });
  if (!cruise) throw httpError(404, 'Du thuyền không còn mở bán.', 'CRUISE_NOT_AVAILABLE');
  if (input.depart_date < getTodayDateString()) {
    throw httpError(400, 'Ngày khởi hành không được nằm trong quá khứ.', 'INVALID_DEPARTURE_DATE');
  }

  const parsedCabins = parseSnapshot(cruise.cabins);
  const availableCabins = new Set(Array.isArray(parsedCabins) ? parsedCabins : []);
  const selectedCabins = [...new Set(input.selected_cabins)];
  if (!selectedCabins.length || selectedCabins.some((cabin) => !availableCabins.has(cabin))) {
    throw httpError(400, 'Loại cabin đã chọn không còn hợp lệ.', 'INVALID_CRUISE_CABIN');
  }
  const selectedCabinQuantities = input.cabin_quantities || Object.fromEntries(selectedCabins.map((cabin, index) => [cabin, index === 0 ? input.cabin_count : 0]));
  const cabinCount = Object.values(selectedCabinQuantities).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
  if (cabinCount !== input.cabin_count || Object.keys(selectedCabinQuantities).some((cabin) => !availableCabins.has(cabin))) {
    throw httpError(400, 'Số lượng cabin không khớp lựa chọn.', 'INVALID_CRUISE_CABIN_QUANTITY');
  }
  const departure = await assertCruiseInventory(cruise.id, input.depart_date, selectedCabinQuantities);
  const priceByCabin = new Map(departure.inventory.map((item) => [item.cabin_name, item.price_override ?? cruise.price]));
  const totalPrice = Object.entries(selectedCabinQuantities).reduce((sum, [cabin, cabinQuantity]) => sum + priceByCabin.get(cabin) * Number(cabinQuantity) * input.guests, 0);
  const quantity = input.guests * cabinCount;
  if (!Number.isSafeInteger(totalPrice) || totalPrice <= 0) {
    throw httpError(400, 'Tổng tiền du thuyền không hợp lệ.', 'INVALID_ORDER_TOTAL');
  }

  return {
    productRef: cruise.id,
    title: `${cruise.name}, ${selectedCabins.join(', ')}`,
    summary: `${cruise.destination}, ${cruise.duration_days} ngày ${cruise.duration_days - 1} đêm. Khởi hành ${input.depart_date} cho ${input.guests} khách.`,
    snapshot: {
      cruiseId: cruise.id,
      name: cruise.name,
      operator: cruise.operator,
      destination: cruise.destination,
      departurePort: cruise.departure_port,
      departureDate: input.depart_date,
      durationDays: cruise.duration_days,
      guests: input.guests,
      cabinCount: input.cabin_count,
      selectedCabins,
      selectedCabinQuantities,
      image: cruise.image,
    },
    quantity,
    unitPrice: cruise.price,
    totalPrice,
  };
}

function buildFlightPricing(input) {
  const quote = verifyFlightQuoteToken(input.quote_token);
  const totalPrice = quote.unitPrice * quote.quantity;
  if (!Number.isSafeInteger(totalPrice) || totalPrice <= 0) {
    throw httpError(400, 'Tổng tiền chuyến bay không hợp lệ.', 'INVALID_ORDER_TOTAL');
  }
  return {
    productRef: quote.productRef,
    title: quote.title,
    summary: quote.summary,
    snapshot: quote.snapshot,
    quantity: quote.quantity,
    unitPrice: quote.unitPrice,
    totalPrice,
  };
}

async function getExistingRequest(clientRequestId, userId) {
  const existing = await prisma.travelOrder.findUnique({
    where: { client_request_id: clientRequestId },
    include: { payments: true },
  });
  if (existing && existing.user_id !== userId) {
    throw httpError(409, 'Mã yêu cầu đã được sử dụng.', 'ORDER_REQUEST_CONFLICT');
  }
  return existing;
}

export async function createTravelOrder(userId, input) {
  if (input.payment_method === 'Demo' && (ENV.PAYMENT_MODE !== 'demo' || ENV.NODE_ENV === 'production')) {
    throw httpError(400, 'Hiện chỉ hỗ trợ thanh toán mô phỏng trong môi trường phát triển.', 'PAYMENT_METHOD_UNAVAILABLE');
  }
  if (input.payment_method === 'VietQR') assertVietQrConfigured();

  const existing = await getExistingRequest(input.client_request_id, userId);
  if (existing) return { order: serializeTravelOrder(existing), already_created: true };

  const persistOrder = async () => {
    const pricing = input.product_type === 'flight' ? buildFlightPricing(input) : await buildCruisePricing(input);
    const paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MS);
    try {
      const created = await prisma.$transaction(async (tx) => {
      const order = await tx.travelOrder.create({
        data: {
          order_code: createBookingCode(),
          client_request_id: input.client_request_id,
          user_id: userId,
          product_type: input.product_type,
          product_ref: pricing.productRef,
          title: pricing.title,
          summary: pricing.summary,
          product_snapshot: JSON.stringify(pricing.snapshot),
          traveler_name: input.traveler.full_name,
          traveler_email: input.traveler.email,
          traveler_phone: input.traveler.phone,
          traveler_note: input.traveler.note || null,
          quantity: pricing.quantity,
          unit_price: pricing.unitPrice,
          total_price: pricing.totalPrice,
          status: 'pending_payment',
          payment_expires_at: paymentExpiresAt,
        },
      });
      const payment = await tx.travelOrderPayment.create({
        data: {
          order_id: order.id,
          amount: pricing.totalPrice,
          payment_method: input.payment_method,
          status: 'pending',
          transaction_ref: input.payment_method === 'VietQR'
            ? createBankTransferRef()
            : createTransactionRef('TRAVEL-DEMO'),
        },
      });
      return { ...order, payments: [payment] };
      });
      return { order: serializeTravelOrder(created), already_created: false };
    } catch (error) {
      if (error.code === 'P2002') {
        const duplicate = await getExistingRequest(input.client_request_id, userId);
        if (duplicate) return { order: serializeTravelOrder(duplicate), already_created: true };
      }
      throw error;
    }
  };
  return input.product_type === 'cruise'
    ? withCruiseDepartureLock(input.product_id, input.depart_date, persistOrder)
    : persistOrder();
}

async function settleTravelOrder({ orderId, userId, transactionRef, expectedAmount, requiredMethod }) {
  if (requiredMethod === 'Demo' && (ENV.PAYMENT_MODE !== 'demo' || ENV.NODE_ENV === 'production')) {
    throw httpError(404, 'Thanh toán mô phỏng không khả dụng.', 'DEMO_PAYMENT_DISABLED');
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.travelOrder.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order || (userId && order.user_id !== userId)) throw httpError(404, 'Không tìm thấy đơn dịch vụ.', 'TRAVEL_ORDER_NOT_FOUND');
    const payment = transactionRef
      ? order.payments.find((item) => item.transaction_ref === transactionRef)
      : order.payments.find((item) => item.status === 'pending') || order.payments[0];
    if (!payment || payment.payment_method !== requiredMethod) {
      throw httpError(409, 'Phương thức thanh toán không khớp.', 'PAYMENT_PROVIDER_MISMATCH');
    }
    if (expectedAmount !== undefined && payment.amount !== expectedAmount) {
      throw httpError(400, 'Số tiền thanh toán không khớp.', 'PAYMENT_AMOUNT_MISMATCH');
    }
    if (order.status === 'confirmed' && payment.status === 'completed') {
      return { order, payment, already_completed: true };
    }
    if (order.status !== 'pending_payment' || payment.status !== 'pending') {
      throw httpError(409, 'Trạng thái đơn không còn hợp lệ để thanh toán.', 'INVALID_ORDER_STATE');
    }
    if (order.payment_expires_at <= new Date()) {
      await tx.travelOrder.update({ where: { id: order.id }, data: { status: 'expired' } });
      await tx.travelOrderPayment.update({ where: { id: payment.id }, data: { status: 'cancelled' } });
      return { expired: true };
    }

    const earnedPoints = Math.floor(order.total_price / 10_000);
    const transition = await tx.travelOrder.updateMany({
      where: { id: order.id, status: 'pending_payment' },
      data: { status: 'confirmed', earned_points: earnedPoints },
    });
    if (transition.count !== 1) {
      throw httpError(409, 'Đơn vừa được xử lý bởi một yêu cầu khác.', 'ORDER_ALREADY_PROCESSED');
    }
    const paid = await tx.travelOrderPayment.update({ where: { id: payment.id }, data: { status: 'completed' } });
    const user = await tx.user.update({ where: { id: order.user_id }, data: { reward_points: { increment: earnedPoints } } });
    const tier = getVipTier(user.reward_points);
    if (tier !== user.vip_tier) await tx.user.update({ where: { id: order.user_id }, data: { vip_tier: tier } });
    const updatedOrder = await tx.travelOrder.findUnique({ where: { id: order.id } });
    return { order: updatedOrder, payment: paid, already_completed: false };
  });

  if (result.expired) {
    throw httpError(409, 'Phiên thanh toán đã hết hạn. Vui lòng tạo đơn mới.', 'PAYMENT_EXPIRED');
  }

  return {
    ...serializeTravelOrder({ ...result.order, payments: [result.payment] }),
    already_completed: result.already_completed,
  };
}

export function confirmDemoTravelOrder(orderId, userId) {
  return settleTravelOrder({ orderId, userId, requiredMethod: 'Demo' });
}

export function completePaidTravelOrder({ orderId, transactionRef, expectedAmount }) {
  return settleTravelOrder({ orderId, transactionRef, expectedAmount, requiredMethod: 'VietQR' });
}

export async function getUserTravelOrders(userId) {
  const expiredOrders = await prisma.travelOrder.findMany({
    where: { user_id: userId, status: 'pending_payment', payment_expires_at: { lte: new Date() } },
    select: { id: true },
  });
  if (expiredOrders.length) {
    const ids = expiredOrders.map((order) => order.id);
    await prisma.$transaction([
      prisma.travelOrder.updateMany({ where: { id: { in: ids } }, data: { status: 'expired' } }),
      prisma.travelOrderPayment.updateMany({ where: { order_id: { in: ids }, status: 'pending' }, data: { status: 'cancelled' } }),
    ]);
  }
  const orders = await prisma.travelOrder.findMany({
    where: { user_id: userId },
    include: { payments: { orderBy: { created_at: 'desc' } } },
    orderBy: { created_at: 'desc' },
  });
  return orders.map(serializeTravelOrder);
}

export async function cancelTravelOrder(orderId, userId) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.travelOrder.findFirst({
      where: { id: orderId, user_id: userId },
      include: { payments: true },
    });
    if (!order) throw httpError(404, 'Không tìm thấy đơn dịch vụ.', 'TRAVEL_ORDER_NOT_FOUND');
    if (order.status === 'cancelled') return order;
    if (!['pending_payment', 'confirmed'].includes(order.status)) {
      throw httpError(409, 'Đơn ở trạng thái này không thể hủy.', 'ORDER_CANNOT_BE_CANCELLED');
    }

    const snapshot = parseSnapshot(order.product_snapshot);
    const departureDate = snapshot.departureDate;
    if (departureDate && departureDate <= getTodayDateString()) {
      throw httpError(409, 'Không thể hủy đơn từ ngày khởi hành.', 'DEPARTURE_ALREADY_STARTED');
    }

    const paid = order.payments.find((payment) => payment.status === 'completed');
    await tx.travelOrder.update({ where: { id: order.id }, data: { status: 'cancelled', earned_points: 0 } });
    await tx.travelOrderPayment.updateMany({
      where: { order_id: order.id, status: { in: ['pending', 'completed'] } },
      data: paid ? { status: 'refunded', refunded_at: new Date() } : { status: 'cancelled' },
    });
    if (order.earned_points > 0) {
      const user = await tx.user.findUnique({ where: { id: userId } });
      const nextPoints = Math.max(0, user.reward_points - order.earned_points);
      await tx.user.update({ where: { id: userId }, data: { reward_points: nextPoints, vip_tier: getVipTier(nextPoints) } });
    }
    return tx.travelOrder.findUnique({ where: { id: order.id }, include: { payments: true } });
  });
  return serializeTravelOrder(result);
}
