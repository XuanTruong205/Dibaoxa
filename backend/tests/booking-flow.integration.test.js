import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { getTodayDateString } from '../src/utils/dateUtils.js';

const fixture = {
  userId: randomUUID(),
  hotelId: randomUUID(),
  roomId: randomUUID(),
  serviceId: randomUUID(),
  email: `booking-flow-${randomUUID()}@example.com`,
  password: 'StrongPass123!',
};

function dateAfter(days) {
  const date = new Date(`${getTodayDateString()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe.sequential('booking and payment integration flow', () => {
  let token;
  let holdId;
  let bookingId;

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        id: fixture.userId,
        email: fixture.email,
        password_hash: await bcrypt.hash(fixture.password, 4),
        full_name: 'Integration Guest',
        phone: '0905123456',
      },
    });
    await prisma.hotel.create({
      data: {
        id: fixture.hotelId,
        name: 'Integration Hotel',
        city: 'Đà Nẵng',
        address: '1 Test Street',
        description: 'Isolated integration fixture',
        cover_image: '/images/hotels/hotel-1.jpg',
      },
    });
    await prisma.room.create({
      data: {
        id: fixture.roomId,
        hotel_id: fixture.hotelId,
        name: 'Integration Room',
        room_type: 'Double',
        price_per_night: 1_000_000,
        max_occupancy: 2,
        bed_type: 'Queen',
        area_sqm: 30,
        total_rooms: 1,
      },
    });
    await prisma.service.create({
      data: {
        id: fixture.serviceId,
        hotel_id: fixture.hotelId,
        name: 'Airport transfer',
        price: 100_000,
        description: 'Integration service',
      },
    });
  });

  afterAll(async () => {
    await prisma.booking.deleteMany({ where: { user_id: fixture.userId } });
    await prisma.service.deleteMany({ where: { hotel_id: fixture.hotelId } });
    await prisma.room.deleteMany({ where: { hotel_id: fixture.hotelId } });
    await prisma.hotel.deleteMany({ where: { id: fixture.hotelId } });
    await prisma.user.deleteMany({ where: { id: fixture.userId } });
  });

  it('moves through pending, paid, QR-ready, refunded, and points-reverted states', async () => {
    const checkIn = dateAfter(2);
    const checkOut = dateAfter(4);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: fixture.email.toUpperCase(),
      password: fixture.password,
    });
    expect(login.status).toBe(200);
    token = login.body.data.token;

    const hold = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_id: fixture.roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        quantity: 1,
      });
    expect(hold.status).toBe(200);
    holdId = hold.body.data.hold_id;

    const repeatedHold = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${token}`)
      .send({
        room_id: fixture.roomId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        quantity: 1,
      });
    expect(repeatedHold.body.data.hold_id).toBe(holdId);

    const confirmationPayload = {
      hold_id: holdId,
      room_id: fixture.roomId,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guest_name: 'Integration Guest',
      guest_phone: '0905123456',
      total_guests: 2,
      quantity: 1,
      services: [{ service_id: fixture.serviceId, quantity: 1 }],
      payment_method: 'Demo',
    };
    const pending = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send(confirmationPayload);
    expect(pending.status).toBe(201);
    expect(pending.body.data.status).toBe('pending_payment');
    expect(pending.body.data.payment.status).toBe('pending');
    expect(pending.body.data.total_price).toBe(2_100_000);
    bookingId = pending.body.data.booking_id;

    const pendingList = await request(app)
      .get('/api/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(pendingList.body.data[0].qr_code).toBeNull();
    expect(pendingList.body.data[0].qr_data_url).toBeNull();

    const repeatedConfirmation = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send(confirmationPayload);
    expect(repeatedConfirmation.body.data.booking_id).toBe(bookingId);
    expect(await prisma.booking.count({ where: { hold_id: holdId } })).toBe(1);

    const paid = await request(app)
      .post(`/api/v1/payments/demo-confirm/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(paid.status).toBe(200);
    expect(paid.body.data.status).toBe('confirmed');
    expect(paid.body.data.payment_status).toBe('completed');
    expect(paid.body.data.qr_code_url).toMatch(/^data:image\/png;base64,/);
    expect(paid.body.data.earned_points).toBe(210);

    const paidAgain = await request(app)
      .post(`/api/v1/payments/demo-confirm/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(paidAgain.status).toBe(200);
    expect(paidAgain.body.data.already_completed).toBe(true);

    const profileAfterPayment = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(profileAfterPayment.body.data.reward_points).toBe(210);

    const confirmedList = await request(app)
      .get('/api/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(confirmedList.body.data[0].qr_code).toBeTruthy();
    expect(confirmedList.body.data[0].qr_data_url).toMatch(/^data:image\/png;base64,/);

    const cancelled = await request(app)
      .post(`/api/v1/bookings/cancel/${bookingId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('cancelled');
    expect(cancelled.body.data.payments[0].status).toBe('refunded');

    const profileAfterCancellation = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(profileAfterCancellation.body.data.reward_points).toBe(0);

    const cancelledList = await request(app)
      .get('/api/v1/bookings/my-bookings')
      .set('Authorization', `Bearer ${token}`);
    expect(cancelledList.body.data[0].qr_code).toBeNull();
    expect(cancelledList.body.data[0].qr_data_url).toBeNull();
  });
});
