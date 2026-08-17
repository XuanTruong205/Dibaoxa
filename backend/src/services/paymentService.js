import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { completePaidBooking } from './bookingService.js';
import { completePaidTravelOrder } from './travelOrderService.js';
import { httpError } from '../utils/httpError.js';

function encodeVnpayValue(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, '+');
}

export function createVnpayCanonicalPayload(payload) {
  return Object.entries(payload)
    .filter(([key, value]) => (
      key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' &&
      value !== undefined && value !== null && value !== ''
    ))
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${encodeVnpayValue(key)}=${encodeVnpayValue(value)}`)
    .join('&');
}

export function verifyVnpaySignature(payload, secret = ENV.VNPAY_HASH_SECRET) {
  if (!secret) throw httpError(503, 'Chưa cấu hình khóa xác thực VNPAY.', 'VNPAY_NOT_CONFIGURED');
  const received = String(payload.vnp_SecureHash || '').toLowerCase();
  if (!/^[a-f0-9]{128}$/.test(received)) return false;

  const canonicalPayload = createVnpayCanonicalPayload(payload);
  const expected = createHmac('sha512', secret).update(canonicalPayload, 'utf8').digest('hex');
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

export async function confirmDemoPayment(bookingId, userId) {
  if (ENV.PAYMENT_MODE !== 'demo' || ENV.NODE_ENV === 'production') {
    throw httpError(404, 'Thanh toán mô phỏng không khả dụng.', 'DEMO_PAYMENT_DISABLED');
  }
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, user_id: userId },
    include: { payments: true },
  });
  if (!booking) throw httpError(404, 'Không tìm thấy đơn đặt phòng.', 'BOOKING_NOT_FOUND');
  const payment = booking.payments[0];
  if (!payment || payment.payment_method !== 'Demo') {
    throw httpError(409, 'Đơn này không sử dụng phương thức thanh toán mô phỏng.', 'NOT_A_DEMO_PAYMENT');
  }
  return completePaidBooking({
    bookingId: booking.id,
    transactionRef: payment.transaction_ref,
    expectedAmount: payment.amount,
    userId,
  });
}

export async function processVnpayWebhook(payload) {
  if (!verifyVnpaySignature(payload)) {
    throw httpError(400, 'Chữ ký giao dịch VNPAY không hợp lệ.', 'INVALID_PAYMENT_SIGNATURE');
  }

  const transactionRef = String(payload.vnp_TxnRef || '');
  const payment = await prisma.payment.findUnique({
    where: { transaction_ref: transactionRef },
    include: { booking: true },
  });
  if (!payment) throw httpError(404, 'Không tìm thấy giao dịch.', 'PAYMENT_NOT_FOUND');
  if (payment.payment_method !== 'VNPAY') {
    throw httpError(409, 'Giao dịch không thuộc cổng VNPAY.', 'PAYMENT_PROVIDER_MISMATCH');
  }

  const receivedAmount = Number(payload.vnp_Amount);
  const expectedAmount = payment.amount * 100;
  if (!Number.isSafeInteger(receivedAmount) || receivedAmount !== expectedAmount) {
    throw httpError(400, 'Số tiền VNPAY không khớp với đơn đặt phòng.', 'PAYMENT_AMOUNT_MISMATCH');
  }
  if (payment.booking.status === 'cancelled' || payment.status === 'refunded') {
    throw httpError(409, 'Đơn đã hủy không thể được xác nhận lại.', 'BOOKING_CANCELLED');
  }
  if (payload.vnp_ResponseCode !== '00' || (payload.vnp_TransactionStatus && payload.vnp_TransactionStatus !== '00')) {
    if (payment.status === 'pending') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
    }
    return { status: 'FAILED', transaction_ref: transactionRef };
  }

  const result = await completePaidBooking({
    bookingId: payment.booking_id,
    transactionRef,
    expectedAmount: payment.amount,
  });
  return { status: 'SUCCESS', transaction_ref: transactionRef, data: result };
}

function parseSepayAuthorization(header) {
  const match = /^Apikey\s+(.+)$/i.exec(String(header || '').trim());
  return match?.[1] || '';
}

export function verifySepayApiKey(header, secret = ENV.SEPAY_WEBHOOK_API_KEY) {
  if (!secret) throw httpError(503, 'Webhook SePay chưa được cấu hình.', 'SEPAY_NOT_CONFIGURED');
  const received = parseSepayAuthorization(header);
  const left = Buffer.from(received);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

function normalizeAccount(value) {
  return String(value || '').replace(/\s+/g, '');
}

function extractReferenceTokens(payload) {
  return new Set([payload.code, payload.content, payload.description]
    .filter(Boolean)
    .flatMap((value) => String(value).toUpperCase().match(/[A-Z0-9]+/g) || [])
    .filter((token) => token.startsWith('DBX') && token.length >= 8 && token.length <= 50)
    .slice(0, 50));
}

async function claimSepayEvent(payload) {
  const providerId = String(payload.id);
  try {
    const event = await prisma.bankWebhookEvent.create({
      data: {
        provider: 'SePay',
        provider_transaction_id: providerId,
        reference_code: payload.code || null,
        amount: Number(payload.transferAmount),
        status: 'processing',
        raw_payload: JSON.stringify(payload),
      },
    });
    return { event, claimed: true };
  } catch (error) {
    if (error.code !== 'P2002') throw error;
    const event = await prisma.bankWebhookEvent.findUnique({
      where: { provider_provider_transaction_id: { provider: 'SePay', provider_transaction_id: providerId } },
    });
    return { event, claimed: false };
  }
}

async function updateSepayEvent(eventId, status, referenceCode) {
  return prisma.bankWebhookEvent.update({
    where: { id: eventId },
    data: { status, ...(referenceCode && { reference_code: referenceCode }) },
  });
}

export async function processSepayWebhook(payload, authorizationHeader) {
  if (!verifySepayApiKey(authorizationHeader)) {
    throw httpError(401, 'Khóa xác thực webhook không hợp lệ.', 'INVALID_SEPAY_API_KEY');
  }
  if (payload.transferType !== 'in') return { matched: false, reason: 'NOT_INCOMING' };
  if (normalizeAccount(payload.accountNumber) !== normalizeAccount(ENV.VIETQR_ACCOUNT_NO)) {
    return { matched: false, reason: 'ACCOUNT_MISMATCH' };
  }

  const claim = await claimSepayEvent(payload);
  const { event } = claim;
  if (!claim.claimed) {
    return { matched: event.status === 'completed', already_processed: true, status: event.status };
  }

  const tokens = extractReferenceTokens(payload);
  const [bookingPayments, travelPayments] = await Promise.all([
    prisma.payment.findMany({ where: { payment_method: 'VietQR', transaction_ref: { in: [...tokens] } }, include: { booking: true } }),
    prisma.travelOrderPayment.findMany({ where: { payment_method: 'VietQR', transaction_ref: { in: [...tokens] } }, include: { order: true } }),
  ]);
  const payment = bookingPayments[0] || travelPayments[0];
  if (!payment) {
    await updateSepayEvent(event.id, 'unmatched');
    return { matched: false, reason: 'PAYMENT_NOT_FOUND' };
  }
  const amount = Number(payload.transferAmount);
  if (!Number.isSafeInteger(amount) || amount !== payment.amount) {
    await updateSepayEvent(event.id, 'amount_mismatch', payment.transaction_ref);
    return { matched: false, reason: 'AMOUNT_MISMATCH', transaction_ref: payment.transaction_ref };
  }

  try {
    const isBooking = Boolean(payment.booking_id);
    const data = isBooking
      ? await completePaidBooking({ bookingId: payment.booking_id, transactionRef: payment.transaction_ref, expectedAmount: amount })
      : await completePaidTravelOrder({ orderId: payment.order_id, transactionRef: payment.transaction_ref, expectedAmount: amount });
    await updateSepayEvent(event.id, 'completed', payment.transaction_ref);
    return { matched: true, kind: isBooking ? 'booking' : 'travel_order', transaction_ref: payment.transaction_ref, data };
  } catch (error) {
    await updateSepayEvent(event.id, 'rejected', payment.transaction_ref);
    throw error;
  }
}

export async function getPaymentStatus(transactionRef, userId) {
  const bookingPayment = await prisma.payment.findUnique({
    where: { transaction_ref: transactionRef },
    include: { booking: true },
  });
  if (bookingPayment) {
    if (bookingPayment.booking.user_id !== userId) throw httpError(404, 'Không tìm thấy giao dịch.', 'PAYMENT_NOT_FOUND');
    const data = bookingPayment.status === 'completed'
      ? await completePaidBooking({ bookingId: bookingPayment.booking_id, transactionRef, expectedAmount: bookingPayment.amount, userId })
      : null;
    return { kind: 'booking', transaction_ref: transactionRef, status: bookingPayment.status, order_status: bookingPayment.booking.status, data };
  }

  const travelPayment = await prisma.travelOrderPayment.findUnique({
    where: { transaction_ref: transactionRef },
    include: { order: true },
  });
  if (!travelPayment || travelPayment.order.user_id !== userId) {
    throw httpError(404, 'Không tìm thấy giao dịch.', 'PAYMENT_NOT_FOUND');
  }
  const data = travelPayment.status === 'completed'
    ? await completePaidTravelOrder({ orderId: travelPayment.order_id, transactionRef, expectedAmount: travelPayment.amount })
    : null;
  return { kind: 'travel_order', transaction_ref: transactionRef, status: travelPayment.status, order_status: travelPayment.order.status, data };
}
