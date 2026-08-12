import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { completePaidBooking } from './bookingService.js';
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
