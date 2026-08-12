import { prisma } from '../config/db.js';
import { httpError } from '../utils/httpError.js';
import { withKeyedMutex } from '../utils/keyedMutex.js';

function parseArray(value) {
  try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function parseObject(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function cabinQuantities(snapshot) {
  if (snapshot.selectedCabinQuantities && typeof snapshot.selectedCabinQuantities === 'object') return snapshot.selectedCabinQuantities;
  return (snapshot.selectedCabins || []).reduce((result, cabin) => ({ ...result, [cabin]: (result[cabin] || 0) + 1 }), {});
}

async function reservedCabins(cruiseId, departureDate) {
  const orders = await prisma.travelOrder.findMany({
    where: {
      product_type: 'cruise', product_ref: cruiseId,
      OR: [{ status: 'confirmed' }, { status: 'pending_payment', payment_expires_at: { gt: new Date() } }],
    },
    select: { product_snapshot: true },
  });
  const result = {};
  for (const order of orders) {
    const snapshot = parseObject(order.product_snapshot);
    if (snapshot.departureDate !== departureDate) continue;
    for (const [cabin, quantity] of Object.entries(cabinQuantities(snapshot))) result[cabin] = (result[cabin] || 0) + Number(quantity || 0);
  }
  return result;
}

async function serializeDeparture(departure) {
  const inventory = parseArray(departure.inventory);
  const reserved = await reservedCabins(departure.cruise_id, departure.departure_date);
  const cabins = inventory.map((item) => ({
      cabin_name: item.cabin_name,
      total_units: Number(item.total_units || 0),
      reserved_units: Number(reserved[item.cabin_name] || 0),
      available_units: Math.max(0, Number(item.total_units || 0) - Number(reserved[item.cabin_name] || 0)),
      price_override: item.price_override ?? null,
    }));
  return { ...departure, inventory: cabins };
}

export async function listDepartures(cruiseId, { includeClosed = false } = {}) {
  const departures = await prisma.cruiseDeparture.findMany({
    where: { cruise_id: cruiseId, ...(!includeClosed && { status: 'open', departure_date: { gte: new Date().toISOString().slice(0, 10) } }) },
    orderBy: { departure_date: 'asc' },
  });
  return Promise.all(departures.map(serializeDeparture));
}

export async function listAllDepartures() {
  const departures = await prisma.cruiseDeparture.findMany({ include: { cruise: { select: { id: true, name: true } } }, orderBy: { departure_date: 'asc' } });
  return Promise.all(departures.map(serializeDeparture));
}

export async function createDeparture(input) {
  const cruise = await prisma.cruise.findUnique({ where: { id: input.cruise_id } });
  if (!cruise) throw httpError(404, 'Không tìm thấy du thuyền.', 'CRUISE_NOT_FOUND');
  const cabins = new Set(parseArray(cruise.cabins));
  if (input.inventory.some((item) => !cabins.has(item.cabin_name))) throw httpError(400, 'Tồn kho chứa cabin không thuộc du thuyền.', 'INVALID_CRUISE_CABIN');
  const departure = await prisma.cruiseDeparture.create({ data: { cruise_id: input.cruise_id, departure_date: input.departure_date, departure_time: input.departure_time, status: input.status, inventory: JSON.stringify(input.inventory), notes: input.notes || null } });
  return serializeDeparture(departure);
}

export async function updateDeparture(departureId, input) {
  const existing = await prisma.cruiseDeparture.findUnique({ where: { id: departureId }, include: { cruise: true } });
  if (!existing) throw httpError(404, 'Không tìm thấy lịch khởi hành.', 'CRUISE_DEPARTURE_NOT_FOUND');
  const cabins = new Set(parseArray(existing.cruise.cabins));
  if (input.inventory.some((item) => !cabins.has(item.cabin_name))) throw httpError(400, 'Tồn kho chứa cabin không thuộc du thuyền.', 'INVALID_CRUISE_CABIN');
  const departure = await prisma.cruiseDeparture.update({ where: { id: departureId }, data: { departure_date: input.departure_date, departure_time: input.departure_time, status: input.status, inventory: JSON.stringify(input.inventory), notes: input.notes || null } });
  return serializeDeparture(departure);
}

export async function deleteDeparture(departureId) {
  const existing = await prisma.cruiseDeparture.findUnique({ where: { id: departureId } });
  if (!existing) throw httpError(404, 'Không tìm thấy lịch khởi hành.', 'CRUISE_DEPARTURE_NOT_FOUND');
  const orders = await prisma.travelOrder.findMany({ where: { product_type: 'cruise', product_ref: existing.cruise_id, status: { in: ['pending_payment', 'confirmed'] } }, select: { product_snapshot: true } });
  if (orders.some((order) => parseObject(order.product_snapshot).departureDate === existing.departure_date)) throw httpError(409, 'Không thể xóa chuyến đã có đơn giữ chỗ.', 'DEPARTURE_HAS_ORDERS');
  await prisma.cruiseDeparture.delete({ where: { id: departureId } });
  return { id: departureId };
}

export function withCruiseDepartureLock(cruiseId, departureDate, operation) {
  return withKeyedMutex(`cruise-departure:${cruiseId}:${departureDate}`, operation);
}

export async function assertCruiseInventory(cruiseId, departureDate, requestedCabins) {
  const departure = await prisma.cruiseDeparture.findUnique({ where: { cruise_id_departure_date: { cruise_id: cruiseId, departure_date: departureDate } } });
  if (!departure || departure.status !== 'open') throw httpError(409, 'Ngày khởi hành chưa mở bán hoặc đã đóng.', 'CRUISE_DEPARTURE_NOT_AVAILABLE');
  const serialized = await serializeDeparture(departure);
  const inventory = new Map(serialized.inventory.map((item) => [item.cabin_name, item]));
  for (const [cabinName, quantity] of Object.entries(requestedCabins)) {
    const cabin = inventory.get(cabinName);
    if (!cabin || quantity < 1 || quantity > cabin.available_units) throw httpError(409, `Cabin "${cabinName}" chỉ còn ${cabin?.available_units || 0}.`, 'CRUISE_CABIN_UNAVAILABLE');
  }
  return serialized;
}
