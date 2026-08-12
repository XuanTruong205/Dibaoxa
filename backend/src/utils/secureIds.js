import { randomBytes, randomUUID } from 'crypto';

export function createHoldId() {
  return `HOLD-${randomUUID()}`;
}

export function createBookingCode(now = new Date()) {
  const month = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return `DBX-${month}-${randomBytes(6).toString('hex').toUpperCase()}`;
}

export function createTransactionRef(prefix = 'PAY') {
  return `${prefix}-${randomUUID()}`;
}

export function createCheckinToken() {
  return `DIBAOXA_CHECKIN_${randomBytes(24).toString('base64url')}`;
}
