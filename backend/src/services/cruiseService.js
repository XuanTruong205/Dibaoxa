import { randomUUID } from 'crypto';
import { prisma } from '../config/db.js';
import { parseJsonArray } from './hotelService.js';
import { httpError } from '../utils/httpError.js';

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeCruise(cruise) {
  return {
    id: cruise.id,
    name: cruise.name,
    operator: cruise.operator,
    destination: cruise.destination,
    departurePort: cruise.departure_port,
    durationDays: cruise.duration_days,
    price: cruise.price,
    rating: cruise.rating,
    reviews: cruise.review_count,
    shipClass: cruise.ship_class,
    image: cruise.image,
    galleryImages: parseJsonArray(cruise.gallery_images),
    features: parseJsonArray(cruise.features),
    cabins: parseJsonArray(cruise.cabins),
    itinerary: parseJsonArray(cruise.itinerary),
    description: cruise.description,
    policies: parseJsonArray(cruise.policies),
    faqs: parseJsonArray(cruise.faqs),
    specifications: parseJsonObject(cruise.specifications),
    status: cruise.status,
    created_at: cruise.created_at,
    updated_at: cruise.updated_at,
  };
}

function cruiseWriteData(input) {
  return {
    id: input.id,
    name: input.name,
    operator: input.operator,
    destination: input.destination,
    departure_port: input.departure_port,
    duration_days: input.duration_days,
    price: input.price,
    rating: input.rating,
    review_count: input.review_count,
    ship_class: input.ship_class,
    image: input.image,
    gallery_images: JSON.stringify(input.gallery_images || []),
    features: JSON.stringify(input.features || []),
    cabins: JSON.stringify(input.cabins || []),
    itinerary: JSON.stringify(input.itinerary || []),
    description: input.description,
    policies: JSON.stringify(input.policies || []),
    faqs: JSON.stringify(input.faqs || []),
    specifications: JSON.stringify(input.specifications || {}),
    status: input.status,
  };
}

export async function listCruises({ includeInactive = false } = {}) {
  const cruises = await prisma.cruise.findMany({
    where: includeInactive ? {} : { status: 'active' },
    orderBy: [{ rating: 'desc' }, { price: 'asc' }],
  });
  return cruises.map(serializeCruise);
}

export async function getCruise(id, { includeInactive = false } = {}) {
  const cruise = await prisma.cruise.findFirst({ where: { id, ...(includeInactive ? {} : { status: 'active' }) } });
  if (!cruise) throw httpError(404, 'Không tìm thấy du thuyền.', 'CRUISE_NOT_FOUND');
  return serializeCruise(cruise);
}

export async function createCruise(input) {
  const createInput = { ...input, id: input.id || randomUUID() };
  const cruise = await prisma.$transaction(async (tx) => {
    const created = await tx.cruise.create({ data: cruiseWriteData(createInput) });
    if (createInput.launch_schedule) {
      const firstDate = new Date(`${createInput.launch_schedule.first_departure_date}T00:00:00.000Z`);
      if (Number.isNaN(firstDate.getTime()) || firstDate.toISOString().slice(0, 10) !== createInput.launch_schedule.first_departure_date) {
        throw httpError(400, 'Ngày khởi hành đầu tiên không hợp lệ.', 'INVALID_DEPARTURE_DATE');
      }
      const configuredInventory = createInput.launch_schedule.cabin_inventory?.length
        ? createInput.launch_schedule.cabin_inventory
        : createInput.cabins.map((cabinName) => ({
          cabin_name: cabinName,
          total_units: createInput.launch_schedule.units_per_cabin,
          price_override: null,
        }));
      const inventory = JSON.stringify(configuredInventory);
      const departures = Array.from({ length: createInput.launch_schedule.departure_count }, (_, index) => {
        const date = new Date(firstDate);
        date.setUTCDate(date.getUTCDate() + index * createInput.launch_schedule.interval_days);
        return {
          cruise_id: created.id,
          departure_date: date.toISOString().slice(0, 10),
          departure_time: createInput.launch_schedule.departure_time,
          status: 'open',
          inventory,
          notes: 'Lịch mở bán tự động khi tạo du thuyền',
        };
      });
      await tx.cruiseDeparture.createMany({ data: departures });
    }
    return created;
  });
  return serializeCruise(cruise);
}

export async function updateCruise(id, input) {
  const existing = await prisma.cruise.findUnique({ where: { id } });
  if (!existing) throw httpError(404, 'Không tìm thấy du thuyền.', 'CRUISE_NOT_FOUND');
  const data = cruiseWriteData(input);
  delete data.id;
  return serializeCruise(await prisma.cruise.update({ where: { id }, data }));
}

export async function deleteCruise(id) {
  await prisma.$transaction(async (tx) => {
    const cruise = await tx.cruise.findUnique({ where: { id }, select: { id: true } });
    if (!cruise) throw httpError(404, 'Không tìm thấy du thuyền.', 'CRUISE_NOT_FOUND');

    const activeOrders = await tx.travelOrder.count({
      where: {
        product_type: 'cruise',
        product_ref: id,
        status: { in: ['pending_payment', 'confirmed'] },
      },
    });
    if (activeOrders > 0) {
      throw httpError(
        409,
        'Không thể xóa du thuyền đang có đơn chờ thanh toán hoặc đã xác nhận. Hãy chuyển du thuyền sang trạng thái ẩn.',
        'CRUISE_HAS_ACTIVE_ORDERS',
      );
    }
    await tx.cruise.delete({ where: { id } });
  });
  return { id };
}
