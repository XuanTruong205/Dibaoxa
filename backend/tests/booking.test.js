import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { holdRoom } from '../src/services/bookingService.js';

describe('Dibaoxa Backend API Tests', () => {
  it('GET /api/v1/health should return status OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('POST /api/v1/auth/login with invalid credentials should return 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@dibaoxa.vn',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects a stay whose checkout is not after check-in', async () => {
    await expect(holdRoom({
      room_id: 'unused',
      check_in_date: '2026-08-10',
      check_out_date: '2026-08-09',
      userId: 'unused',
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects impossible calendar dates instead of normalizing them', async () => {
    await expect(holdRoom({
      room_id: 'unused',
      check_in_date: '2026-02-30',
      check_out_date: '2026-03-02',
      userId: 'unused',
    })).rejects.toMatchObject({ statusCode: 400 });
  });
});
