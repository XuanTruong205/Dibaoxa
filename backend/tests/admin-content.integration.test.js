import { randomUUID } from 'crypto';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { addRoom, createHotel, updateHotel } from '../src/services/adminService.js';
import { createCruise } from '../src/services/cruiseService.js';

const fixture = {
  cruiseId: `hidden-cruise-${randomUUID()}`,
  scheduledCruiseId: `scheduled-cruise-${randomUUID()}`,
  hotelIds: [],
};

function room(name) {
  return {
    name,
    room_type: 'Double',
    price_per_night: 1_500_000,
    max_occupancy: 2,
    bed_type: 'King',
    area_sqm: 36,
    view_type: 'Ocean view',
    images: ['/images/test-room.webp'],
    room_services: ['Wi-Fi'],
    total_rooms: 5,
    is_available: true,
  };
}

function hotelInput(name) {
  return {
    name,
    city: 'Đà Nẵng',
    address: '01 Đường kiểm thử',
    star_rating: 5,
    description: 'Khách sạn dùng riêng cho kiểm thử đồng bộ nội dung Admin.',
    cover_image: '/images/test-hotel.webp',
    operator_company: 'Dibaoxa Test',
    amenities: ['Wi-Fi'],
    gallery_images: [],
    highlights: ['Gần biển'],
    highlight_bullets: [],
    policies: ['Không hút thuốc'],
    faqs: [{ question: 'Giờ nhận phòng?', answer: 'Từ 14:00.' }],
    rooms: [room('Deluxe'), room('Suite')],
    services: [
      { name: 'Đưa đón sân bay', price: 350_000, description: 'Xe riêng một chiều.' },
      { name: 'Bữa tối', price: 500_000, description: 'Thực đơn cho hai khách.' },
    ],
  };
}

describe.sequential('admin content synchronization', () => {
  afterAll(async () => {
    await prisma.cruise.deleteMany({ where: { id: { in: [fixture.cruiseId, fixture.scheduledCruiseId] } } });
    await prisma.hotel.deleteMany({ where: { id: { in: fixture.hotelIds } } });
  });

  it('deletes room types and services omitted by Admin when they are unused', async () => {
    const input = hotelInput(`Hotel admin sync ${randomUUID()}`);
    const created = await createHotel(input);
    fixture.hotelIds.push(created.id);

    const removedRoomId = created.rooms[1].id;
    const removedServiceId = created.services[1].id;
    const updated = await updateHotel(created.id, {
      ...input,
      rooms: [{ ...input.rooms[0], id: created.rooms[0].id }],
      services: [{ ...input.services[0], id: created.services[0].id }],
    });

    expect(updated.rooms).toHaveLength(1);
    expect(updated.services).toHaveLength(1);
    expect(await prisma.room.findUnique({ where: { id: removedRoomId } })).toBeNull();
    expect(await prisma.service.findUnique({ where: { id: removedServiceId } })).toBeNull();

    const quickRoom = await addRoom(created.id, room('Quick Family'));
    expect(quickRoom.name).toBe('Quick Family');
    expect(await prisma.room.count({ where: { hotel_id: created.id } })).toBe(2);
  });

  it('creates a cruise and its recurring departures atomically', async () => {
    await createCruise({
      id: fixture.scheduledCruiseId,
      name: 'Du thuyền mở bán nhanh',
      operator: 'Dibaoxa Test',
      destination: 'Lan Hạ',
      departure_port: 'Bến Gót',
      duration_days: 2,
      price: 4_500_000,
      rating: 9,
      review_count: 0,
      ship_class: 5,
      image: '/images/test-cruise.webp',
      gallery_images: [],
      features: ['Kayak'],
      cabins: ['Deluxe', 'Suite'],
      itinerary: ['Ngày 1', 'Ngày 2'],
      description: 'Dữ liệu kiểm thử tạo nhanh du thuyền và lịch mở bán.',
      policies: [],
      faqs: [],
      status: 'active',
      launch_schedule: {
        first_departure_date: '2099-07-01',
        departure_time: '11:30',
        departure_count: 3,
        interval_days: 7,
        units_per_cabin: 6,
      },
    });

    const departures = await prisma.cruiseDeparture.findMany({ where: { cruise_id: fixture.scheduledCruiseId }, orderBy: { departure_date: 'asc' } });
    expect(departures.map((item) => item.departure_date)).toEqual(['2099-07-01', '2099-07-08', '2099-07-15']);
    expect(JSON.parse(departures[0].inventory)).toEqual([
      { cabin_name: 'Deluxe', total_units: 6, price_override: null },
      { cabin_name: 'Suite', total_units: 6, price_override: null },
    ]);
  });

  it('never exposes an inactive cruise through the public catalog or detail API', async () => {
    await prisma.cruise.create({
      data: {
        id: fixture.cruiseId,
        name: 'Du thuyền đang ẩn',
        operator: 'Dibaoxa Test',
        destination: 'Hạ Long',
        departure_port: 'Cảng Tuần Châu',
        duration_days: 2,
        price: 3_500_000,
        image: '/images/test-cruise.webp',
        gallery_images: '[]',
        features: '[]',
        cabins: '["Deluxe"]',
        itinerary: '["Ngày 1"]',
        description: 'Dữ liệu kiểm thử trạng thái ẩn của du thuyền.',
        policies: '[]',
        faqs: '[]',
        status: 'inactive',
      },
    });

    const [catalog, detail] = await Promise.all([
      request(app).get('/api/v1/cruises'),
      request(app).get(`/api/v1/cruises/${fixture.cruiseId}`),
    ]);

    expect(catalog.status).toBe(200);
    expect(catalog.body.data.some((item) => item.id === fixture.cruiseId)).toBe(false);
    expect(detail.status).toBe(404);
    expect(detail.body.code).toBe('CRUISE_NOT_FOUND');
  });
});
