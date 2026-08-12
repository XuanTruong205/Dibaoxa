import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/config/db.js';

const command = process.argv[2] || 'inspect';
const confirmation = process.argv.find((argument) => argument.startsWith('--confirm='))?.split('=')[1];

async function counts() {
  return {
    hotels: await prisma.hotel.count(),
    rooms: await prisma.room.count(),
    services: await prisma.service.count(),
    hotel_bookings: await prisma.booking.count(),
    hotel_payments: await prisma.payment.count(),
    hotel_reviews: await prisma.review.count(),
    cruises: await prisma.cruise.count(),
    cruise_departures: await prisma.cruiseDeparture.count(),
    cruise_orders: await prisma.travelOrder.count({ where: { product_type: 'cruise' } }),
    cruise_payments: await prisma.travelOrderPayment.count({ where: { order: { product_type: 'cruise' } } }),
    flight_orders_preserved: await prisma.travelOrder.count({ where: { product_type: 'flight' } }),
  };
}

async function backupAndClear() {
  if (confirmation !== 'DELETE_HOTELS_AND_CRUISES') throw new Error('Thiếu xác nhận --confirm=DELETE_HOTELS_AND_CRUISES');
  const hotelIds = (await prisma.hotel.findMany({ select: { id: true } })).map((item) => item.id);
  const cruiseOrderIds = (await prisma.travelOrder.findMany({ where: { product_type: 'cruise' }, select: { id: true } })).map((item) => item.id);
  const backup = {
    created_at: new Date().toISOString(),
    reason: 'Catalog reset before rebuilding the internal accommodation catalog',
    hotels: await prisma.hotel.findMany({ include: { rooms: true, services: true, reviews: true, bookings: { include: { booking_services: true, payments: true } } } }),
    cruises: await prisma.cruise.findMany({ include: { departures: true } }),
    cruise_orders: await prisma.travelOrder.findMany({ where: { product_type: 'cruise' }, include: { payments: true } }),
  };
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const backupDirectory = path.resolve(scriptDirectory, '../prisma/backups');
  await fs.mkdir(backupDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDirectory, `catalog-before-sync-${stamp}.json`);
  await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), { encoding: 'utf8', flag: 'wx' });

  await prisma.$transaction(async (tx) => {
    if (cruiseOrderIds.length) {
      await tx.travelOrderPayment.deleteMany({ where: { order_id: { in: cruiseOrderIds } } });
      await tx.travelOrder.deleteMany({ where: { id: { in: cruiseOrderIds } } });
    }
    await tx.bookingService.deleteMany();
    await tx.payment.deleteMany();
    await tx.booking.deleteMany();
    await tx.review.deleteMany();
    await tx.service.deleteMany();
    await tx.room.deleteMany();
    await tx.cruiseDeparture.deleteMany();
    await tx.cruise.deleteMany();
    await tx.hotel.deleteMany();
    if (hotelIds.length) {
      await tx.user.updateMany({ where: { assigned_hotel: { in: hotelIds } }, data: { assigned_hotel: null } });
      await tx.staffDirectory.updateMany({ where: { assigned_hotel: { in: hotelIds } }, data: { assigned_hotel: 'unassigned', status: 'inactive' } });
    }
  });
  return { backup_path: backupPath, after: await counts() };
}

try {
  if (command === 'inspect') console.log(JSON.stringify(await counts(), null, 2));
  else if (command === 'backup-and-clear') console.log(JSON.stringify(await backupAndClear(), null, 2));
  else throw new Error(`Lệnh không hỗ trợ: ${command}`);
} finally {
  await prisma.$disconnect();
}
