import { createHmac, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { getTodayDateString, parseStayDates } from '../src/utils/dateUtils.js';
import { createVnpayCanonicalPayload, verifyVnpaySignature } from '../src/services/paymentService.js';

describe('Security and validation contracts', () => {
  it('rejects privileged APIs without authentication', async () => {
    const response = await request(app).get('/api/v1/admin/bookings');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rejects unsupported payment methods before touching booking data', async () => {
    const token = jwt.sign(
      { userId: randomUUID(), role: 'customer', email: 'test@dibaoxa.vn' },
      ENV.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '5m' }
    );
    const response = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        hold_id: `HOLD-${randomUUID()}`,
        room_id: randomUUID(),
        check_in_date: '2099-01-01',
        check_out_date: '2099-01-02',
        guest_name: 'Test Guest',
        guest_phone: '0905123456',
        total_guests: 1,
        quantity: 1,
        services: [],
        payment_method: 'Cash',
      });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('validates VNPAY HMAC SHA512 and rejects a changed signature', () => {
    const secret = 'test-vnpay-secret';
    const payload = {
      vnp_Amount: '150000000',
      vnp_ResponseCode: '00',
      vnp_TxnRef: 'VNPAY-test-reference',
    };
    const signature = createHmac('sha512', secret)
      .update(createVnpayCanonicalPayload(payload), 'utf8')
      .digest('hex');
    expect(verifyVnpaySignature({ ...payload, vnp_SecureHash: signature }, secret)).toBe(true);
    const changedSignature = `${signature.slice(0, -1)}${signature.endsWith('0') ? '1' : '0'}`;
    expect(verifyVnpaySignature({ ...payload, vnp_SecureHash: changedSignature }, secret)).toBe(false);
  });

  it('rejects check-in dates in the past', () => {
    const today = getTodayDateString();
    const yesterday = new Date(`${today}T00:00:00.000Z`);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    expect(() => parseStayDates(yesterday.toISOString().slice(0, 10), today)).toThrowError(
      expect.objectContaining({ code: 'PAST_CHECK_IN' })
    );
  });

  it('requires both availability dates together', async () => {
    const response = await request(app).get('/api/v1/hotels?check_in=2099-01-01');
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
