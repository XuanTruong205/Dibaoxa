import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';

const fixture = {
  userId: randomUUID(),
  packageId: randomUUID(),
  email: `customer-features-${randomUUID()}@example.com`,
  password: 'StrongPass123!',
};

describe.sequential('customer package catalog and profile', () => {
  let token;

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: fixture.userId,
        email: fixture.email,
        password_hash: await bcrypt.hash(fixture.password, 4),
        full_name: 'Customer Feature Test',
        phone: '0905123456',
      },
    });
    await prisma.travelPackage.create({
      data: {
        id: fixture.packageId,
        title: 'Gói kiểm thử Đà Nẵng',
        destination: 'Đà Nẵng',
        duration: '3 ngày 2 đêm',
        price: 4_990_000,
        included: JSON.stringify(['2 đêm phòng', 'Bữa sáng']),
        status: 'active',
      },
    });
  });

  afterAll(async () => {
    await prisma.travelPackage.deleteMany({ where: { id: fixture.packageId } });
    await prisma.user.deleteMany({ where: { id: fixture.userId } });
  });

  it('publishes active admin packages to the customer catalog', async () => {
    const response = await request(app)
      .get('/api/v1/packages')
      .query({ destination: 'Đà Nẵng' });

    expect(response.status).toBe(200);
    const travelPackage = response.body.data.find((item) => item.id === fixture.packageId);
    expect(travelPackage).toMatchObject({
      destination: 'Đà Nẵng',
      status: 'active',
      included: ['2 đêm phòng', 'Bữa sáng'],
    });
  });

  it('lets an authenticated customer update their own public profile fields', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      email: fixture.email,
      password: fixture.password,
    });
    token = login.body.data.token;

    const response = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ full_name: 'Tên Khách Mới', phone: '0912345678' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: fixture.userId,
      full_name: 'Tên Khách Mới',
      phone: '0912345678',
      email: fixture.email,
    });
    expect(response.body.data).not.toHaveProperty('password_hash');
  });
});
