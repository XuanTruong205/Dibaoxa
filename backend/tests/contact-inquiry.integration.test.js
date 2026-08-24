import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';

const createdIds = [];
const adminId = randomUUID();
const adminEmail = `contact-admin-${randomUUID()}@dibaoxa.vn`;
const adminToken = jwt.sign(
  { userId: adminId, role: 'admin', email: adminEmail },
  ENV.JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '5m' },
);

beforeAll(async () => {
  await prisma.user.create({
    data: {
      id: adminId,
      email: adminEmail,
      password_hash: await bcrypt.hash('StrongPass123!', 4),
      full_name: 'Contact Admin',
      role: 'admin',
    },
  });
});

afterAll(async () => {
  if (createdIds.length) await prisma.contactInquiry.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.user.deleteMany({ where: { id: adminId } });
});

describe('Contact inquiry flow', () => {
  it('validates, persists and lets Admin resolve a public inquiry', async () => {
    const invalid = await request(app).post('/api/v1/contact-inquiries').send({ name: 'A' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');

    const created = await request(app).post('/api/v1/contact-inquiries').send({
      name: 'Nguyễn Minh Anh',
      email: 'MINHANH@example.com',
      phone: '0905123456',
      service: 'cruise',
      message: 'Tôi cần tư vấn chuyến du thuyền cho gia đình bốn người.',
    });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('new');
    expect(created.body.data.email).toBeUndefined();
    createdIds.push(created.body.data.id);

    const list = await request(app)
      .get('/api/v1/admin/contact-inquiries?status=new')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((item) => item.id === created.body.data.id)).toBe(true);

    const resolved = await request(app)
      .patch(`/api/v1/admin/contact-inquiries/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'resolved' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe('resolved');
    expect(resolved.body.data.resolved_at).toBeTruthy();
  });
});
