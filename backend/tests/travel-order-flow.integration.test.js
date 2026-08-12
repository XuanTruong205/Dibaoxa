import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { createFlightQuoteToken } from '../src/services/flightService.js';
import { getTodayDateString } from '../src/utils/dateUtils.js';

const fixture = {
  userId: randomUUID(),
  adminId: randomUUID(),
  cruiseId: `travel-order-cruise-${randomUUID()}`,
  email: `travel-order-${randomUUID()}@example.com`,
  adminEmail: `travel-order-admin-${randomUUID()}@example.com`,
  password: 'StrongPass123!',
};

function dateAfter(days) {
  const date = new Date(`${getTodayDateString()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const traveler = {
  full_name: 'Khách Kiểm Thử',
  email: 'traveler@example.com',
  phone: '0905123456',
  note: 'Ăn chay',
};

describe.sequential('travel order and payment flow', () => {
  let token;
  let adminToken;
  let flightOrderId;

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: fixture.userId,
        email: fixture.email,
        password_hash: await bcrypt.hash(fixture.password, 4),
        full_name: 'Travel Order Test',
        phone: '0905123456',
      },
    });
    await prisma.user.create({
      data: {
        id: fixture.adminId,
        email: fixture.adminEmail,
        password_hash: await bcrypt.hash(fixture.password, 4),
        full_name: 'Travel Order Admin Test',
        role: 'admin',
      },
    });
    await prisma.cruise.create({
      data: {
        id: fixture.cruiseId,
        name: 'Du thuyền kiểm thử thanh toán',
        operator: 'Dibaoxa Test',
        destination: 'Hạ Long',
        departure_port: 'Cảng Tuần Châu',
        duration_days: 2,
        price: 2_500_000,
        image: '/images/test-cruise.webp',
        gallery_images: '[]',
        features: '[]',
        cabins: '["Deluxe","Suite"]',
        itinerary: '["Ngày 1"]',
        description: 'Dữ liệu kiểm thử luồng đặt và thanh toán du thuyền.',
        policies: '[]',
        faqs: '[]',
        status: 'active',
      },
    });
    await prisma.cruiseDeparture.create({
      data: {
        cruise_id: fixture.cruiseId,
        departure_date: dateAfter(10),
        departure_time: '11:30',
        status: 'open',
        inventory: JSON.stringify([
          { cabin_name: 'Deluxe', total_units: 4, price_override: null },
          { cabin_name: 'Suite', total_units: 2, price_override: null },
        ]),
      },
    });
    const login = await request(app).post('/api/v1/auth/login').send({ email: fixture.email, password: fixture.password });
    token = login.body.data.token;
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: fixture.adminEmail, password: fixture.password });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.travelOrder.deleteMany({ where: { user_id: fixture.userId } });
    await prisma.cruise.deleteMany({ where: { id: fixture.cruiseId } });
    await prisma.user.deleteMany({ where: { id: fixture.userId } });
    await prisma.user.deleteMany({ where: { id: fixture.adminId } });
  });

  it('recalculates cruise price, prevents duplicate orders, pays idempotently, and refunds on cancellation', async () => {
    const clientRequestId = randomUUID();
    const payload = {
      client_request_id: clientRequestId,
      product_type: 'cruise',
      product_id: fixture.cruiseId,
      depart_date: dateAfter(10),
      guests: 2,
      cabin_count: 1,
      selected_cabins: ['Deluxe'],
      traveler,
      payment_method: 'Demo',
    };

    const created = await request(app).post('/api/v1/travel-orders').set('Authorization', `Bearer ${token}`).send(payload);
    expect(created.status).toBe(201);
    expect(created.body.data.total_price).toBe(5_000_000);
    expect(created.body.data.status).toBe('pending_payment');
    const orderId = created.body.data.id;

    const repeated = await request(app).post('/api/v1/travel-orders').set('Authorization', `Bearer ${token}`).send(payload);
    expect(repeated.status).toBe(200);
    expect(repeated.body.data.id).toBe(orderId);
    expect(await prisma.travelOrder.count({ where: { client_request_id: clientRequestId } })).toBe(1);

    const paid = await request(app).post(`/api/v1/travel-orders/${orderId}/demo-confirm`).set('Authorization', `Bearer ${token}`);
    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('confirmed');
    expect(paid.body.data.payments[0].status).toBe('completed');
    expect(paid.body.data.earned_points).toBe(500);

    const paidAgain = await request(app).post(`/api/v1/travel-orders/${orderId}/demo-confirm`).set('Authorization', `Bearer ${token}`);
    expect(paidAgain.status).toBe(200);
    expect(paidAgain.body.data.already_completed).toBe(true);

    const cancelled = await request(app).post(`/api/v1/travel-orders/${orderId}/cancel`).set('Authorization', `Bearer ${token}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('cancelled');
    expect(cancelled.body.data.payments[0].status).toBe('refunded');

    const profile = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(profile.body.data.reward_points).toBe(0);
  });

  it('keeps the VIP tier consistent when a travel order crosses the hotel Platinum threshold', async () => {
    await prisma.user.update({
      where: { id: fixture.userId },
      data: { reward_points: 4_500, vip_tier: 'gold' },
    });

    const created = await request(app)
      .post('/api/v1/travel-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client_request_id: randomUUID(),
        product_type: 'cruise',
        product_id: fixture.cruiseId,
        depart_date: dateAfter(10),
        guests: 2,
        cabin_count: 1,
        selected_cabins: ['Deluxe'],
        traveler,
        payment_method: 'Demo',
      });
    expect(created.status).toBe(201);

    const paid = await request(app)
      .post(`/api/v1/travel-orders/${created.body.data.id}/demo-confirm`)
      .set('Authorization', `Bearer ${token}`);
    expect(paid.status).toBe(200);

    const profileAfterPayment = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(profileAfterPayment.body.data.reward_points).toBe(5_000);
    expect(profileAfterPayment.body.data.vip_tier).toBe('platinum');

    await request(app)
      .post(`/api/v1/travel-orders/${created.body.data.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    const profileAfterCancellation = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(profileAfterCancellation.body.data.reward_points).toBe(4_500);
    expect(profileAfterCancellation.body.data.vip_tier).toBe('gold');

    await prisma.user.update({
      where: { id: fixture.userId },
      data: { reward_points: 0, vip_tier: 'silver' },
    });
  });

  it('uses a signed flight quote and rejects a modified quote', async () => {
    const offer = {
      id: `offer-${randomUUID()}`,
      price: 1_200_000,
      code: 'VN 123',
      airline: 'Vietnam Airlines',
      origin: 'SGN',
      destination: 'DAD',
      depart: '08:00',
      arrive: '09:30',
      departAt: `${dateAfter(12)} 08:00`,
      arriveAt: `${dateAfter(12)} 09:30`,
      durationMinutes: 90,
      stops: 0,
      baggage: 'Đã bao gồm',
      refundable: true,
      cabin: 'Economy',
    };
    const query = { adults: 2, children: 1, infants: 1, departure_date: dateAfter(12), return_date: undefined, travel_class: 'ECONOMY' };
    const quoteToken = createFlightQuoteToken(offer, query);
    const payload = {
      client_request_id: randomUUID(),
      product_type: 'flight',
      quote_token: quoteToken,
      traveler,
      payment_method: 'Demo',
    };

    const created = await request(app).post('/api/v1/travel-orders').set('Authorization', `Bearer ${token}`).send(payload);
    expect(created.status).toBe(201);
    flightOrderId = created.body.data.id;
    expect(created.body.data.quantity).toBe(3);
    expect(created.body.data.total_price).toBe(3_600_000);

    const tampered = await request(app).post('/api/v1/travel-orders').set('Authorization', `Bearer ${token}`).send({
      ...payload,
      client_request_id: randomUUID(),
      quote_token: `${quoteToken.slice(0, -1)}x`,
    });
    expect(tampered.status).toBe(400);
    expect(tampered.body.code).toBe('INVALID_FLIGHT_QUOTE_SIGNATURE');
  });

  it('lets Admin manage global travel orders, payments and reports without granting customers access', async () => {
    const customerAttempt = await request(app)
      .post(`/api/v1/admin/travel-orders/${flightOrderId}/confirm`)
      .set('Authorization', `Bearer ${token}`);
    expect(customerAttempt.status).toBe(403);

    const orders = await request(app).get('/api/v1/admin/travel-orders').set('Authorization', `Bearer ${adminToken}`);
    expect(orders.status).toBe(200);
    expect(orders.body.data.some((order) => order.id === flightOrderId && order.product_type === 'flight')).toBe(true);

    const confirmed = await request(app)
      .post(`/api/v1/admin/travel-orders/${flightOrderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe('confirmed');

    const payments = await request(app).get('/api/v1/admin/payments').set('Authorization', `Bearer ${adminToken}`);
    expect(payments.status).toBe(200);
    expect(payments.body.data.some((payment) => payment.booking_code === confirmed.body.data.order_code && payment.source_type === 'flight' && payment.status === 'completed')).toBe(true);

    const report = await request(app).get('/api/v1/admin/reports/occupancy').set('Authorization', `Bearer ${adminToken}`);
    expect(report.status).toBe(200);
    expect(report.body.data.service_breakdown.map((item) => item.type)).toEqual(expect.arrayContaining(['hotel', 'cruise', 'flight']));
    expect(report.body.data.summary.travel_revenue_vnd).toBeGreaterThanOrEqual(3_600_000);
  });
});
