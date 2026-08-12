import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import {
  deleteReview,
  listHotels,
  listPayments,
  listTravelOrders,
} from '../src/services/adminService.js';
import { deleteCruise } from '../src/services/cruiseService.js';

const fixture = {
  adminId: randomUUID(),
  receptionistId: randomUUID(),
  customerId: randomUUID(),
  cruiseId: `admin-audit-${randomUUID()}`,
  travelOrderId: randomUUID(),
};

const adminActor = { userId: fixture.adminId, role: 'admin' };
const receptionistActor = { userId: fixture.receptionistId, role: 'receptionist', assigned_hotel: null };

describe.sequential('admin audit regressions', () => {
  let receptionistToken;

  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        {
          id: fixture.adminId,
          email: `admin-audit-${randomUUID()}@example.com`,
          password_hash: await bcrypt.hash('StrongPass123!', 4),
          full_name: 'Audit Admin',
          role: 'admin',
        },
        {
          id: fixture.receptionistId,
          email: `receptionist-audit-${randomUUID()}@example.com`,
          password_hash: await bcrypt.hash('StrongPass123!', 4),
          full_name: 'Audit Receptionist',
          role: 'receptionist',
        },
        {
          id: fixture.customerId,
          email: `customer-audit-${randomUUID()}@example.com`,
          password_hash: await bcrypt.hash('StrongPass123!', 4),
          full_name: 'Audit Customer',
          role: 'customer',
        },
      ],
    });

    const receptionist = await prisma.user.findUnique({ where: { id: fixture.receptionistId } });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: receptionist.email,
      password: 'StrongPass123!',
    });
    receptionistToken = login.body.data.token;

    await prisma.cruise.create({
      data: {
        id: fixture.cruiseId,
        name: 'Audit Cruise',
        operator: 'Dibaoxa Audit',
        destination: 'Ha Long',
        departure_port: 'Tuan Chau',
        duration_days: 2,
        price: 4_000_000,
        image: '/images/audit-cruise.webp',
        description: 'Cruise fixture for Admin deletion safeguards.',
      },
    });
    await prisma.travelOrder.create({
      data: {
        id: fixture.travelOrderId,
        order_code: `MVV-AUDIT-${randomUUID()}`,
        client_request_id: `audit-${randomUUID()}`,
        user_id: fixture.customerId,
        product_type: 'cruise',
        product_ref: fixture.cruiseId,
        title: 'Audit Cruise',
        summary: 'Pending cruise order',
        product_snapshot: '{}',
        traveler_name: 'Audit Customer',
        traveler_email: 'audit@example.com',
        traveler_phone: '0905123456',
        quantity: 1,
        unit_price: 4_000_000,
        total_price: 4_000_000,
        status: 'pending_payment',
        payment_expires_at: new Date(Date.now() + 60_000),
      },
    });
  });

  afterAll(async () => {
    await prisma.travelOrder.deleteMany({ where: { id: fixture.travelOrderId } });
    await prisma.cruise.deleteMany({ where: { id: fixture.cruiseId } });
    await prisma.user.deleteMany({ where: { id: { in: [fixture.adminId, fixture.receptionistId, fixture.customerId] } } });
  });

  it('blocks deletion of a cruise referenced by an active order', async () => {
    await expect(deleteCruise(fixture.cruiseId)).rejects.toMatchObject({
      statusCode: 409,
      code: 'CRUISE_HAS_ACTIVE_ORDERS',
    });
    expect(await prisma.cruise.findUnique({ where: { id: fixture.cruiseId } })).not.toBeNull();
  });

  it('sets baseline HTTP security headers', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('rate limits repeated failed login attempts per account', async () => {
    const email = `brute-force-${randomUUID()}@example.com`;
    let response;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await request(app).post('/api/v1/auth/login').send({ email, password: 'wrong-password' });
      if (response.status === 429) break;
    }
    expect(response.status).toBe(429);
    expect(response.body.code).toBe('RATE_LIMITED');
  });

  it('bounds payment reads to the requested page instead of loading every row', async () => {
    const rawPage = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([
      { id: 'hotel-payment', source_type: 'hotel', created_at: new Date('2026-01-02') },
      { id: 'travel-payment', source_type: 'travel', created_at: new Date('2026-01-01') },
    ]);
    const hotelFind = vi.spyOn(prisma.payment, 'findMany').mockResolvedValue([{
      id: 'hotel-payment', created_at: new Date('2026-01-02'), booking: { booking_code: 'B-1', hotel: { name: 'Hotel' }, room: { name: 'Room' }, user: {} },
    }]);
    const travelFind = vi.spyOn(prisma.travelOrderPayment, 'findMany').mockResolvedValue([{
      id: 'travel-payment', created_at: new Date('2026-01-01'), order: { product_type: 'flight', order_code: 'T-1', title: 'Flight', user: {} },
    }]);
    vi.spyOn(prisma.payment, 'count').mockResolvedValue(7);
    vi.spyOn(prisma.travelOrderPayment, 'count').mockResolvedValue(3);

    try {
      const result = await listPayments(adminActor, { page: 2, limit: 5 });
      expect(rawPage).toHaveBeenCalledOnce();
      expect(hotelFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['hotel-payment'] } } }));
      expect(travelFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['travel-payment'] } } }));
      expect(result.payments.map((payment) => payment.id)).toEqual(['hotel-payment', 'travel-payment']);
      expect(result.pagination.total).toBe(10);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('rejects an unassigned receptionist with an actionable error', async () => {
    await expect(listHotels(receptionistActor)).rejects.toMatchObject({
      statusCode: 403,
      code: 'HOTEL_ASSIGNMENT_REQUIRED',
    });
  });

  it('does not expose travel orders to receptionists', async () => {
    const serviceResult = listTravelOrders(receptionistActor, { page: 1, limit: 10 });
    await expect(serviceResult).rejects.toMatchObject({ statusCode: 403, code: 'ADMIN_ONLY' });

    const response = await request(app)
      .get('/api/v1/admin/travel-orders')
      .set('Authorization', `Bearer ${receptionistToken}`);
    expect(response.status).toBe(403);
  });

  it('returns a domain-specific error when deleting a missing review', async () => {
    await expect(deleteReview(randomUUID())).rejects.toMatchObject({
      statusCode: 404,
      code: 'REVIEW_NOT_FOUND',
    });
  });
});
