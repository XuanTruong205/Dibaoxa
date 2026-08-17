import { ENV } from '../config/env.js';
import { httpError } from '../utils/httpError.js';

const normalizeAccount = (value) => String(value || '').replace(/\s+/g, '');

export function isVietQrConfigured() {
  return Boolean(ENV.VIETQR_BANK_ID && ENV.VIETQR_ACCOUNT_NO && ENV.VIETQR_ACCOUNT_NAME);
}

export function assertVietQrConfigured() {
  if (!isVietQrConfigured()) {
    throw httpError(503, 'Thanh toán VietQR chưa được cấu hình.', 'VIETQR_NOT_CONFIGURED');
  }
}

export function buildVietQrImageUrl({ amount, transactionRef }) {
  assertVietQrConfigured();
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw httpError(400, 'Số tiền thanh toán không hợp lệ.', 'INVALID_PAYMENT_AMOUNT');
  }
  const description = String(transactionRef || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 50);
  if (!description) throw httpError(400, 'Mã thanh toán không hợp lệ.', 'INVALID_PAYMENT_REFERENCE');

  const bank = encodeURIComponent(ENV.VIETQR_BANK_ID);
  const account = encodeURIComponent(normalizeAccount(ENV.VIETQR_ACCOUNT_NO));
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: description,
    accountName: ENV.VIETQR_ACCOUNT_NAME,
  });
  return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?${query.toString()}`;
}

export function buildVietQrPayment(payment, expiresAt) {
  if (!payment || payment.payment_method !== 'VietQR' || !isVietQrConfigured()) return null;
  return {
    provider: 'VietQR',
    bank_name: 'MB Bank',
    bank_id: ENV.VIETQR_BANK_ID,
    account_number: normalizeAccount(ENV.VIETQR_ACCOUNT_NO),
    account_name: ENV.VIETQR_ACCOUNT_NAME,
    amount: payment.amount,
    transfer_content: payment.transaction_ref,
    transaction_ref: payment.transaction_ref,
    qr_image_url: buildVietQrImageUrl({ amount: payment.amount, transactionRef: payment.transaction_ref }),
    expires_at: expiresAt,
    auto_confirmation: Boolean(ENV.SEPAY_WEBHOOK_API_KEY),
  };
}
