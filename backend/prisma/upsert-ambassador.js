import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import {
  AMBASSADOR_CRUISE_ID,
  ambassadorCabinInventory,
  getAmbassadorDepartureDates,
  serializeAmbassadorCruise,
} from './ambassador-cruise.js';

const prisma = new PrismaClient();

async function main() {
  const cruise = serializeAmbassadorCruise();
  await prisma.cruise.upsert({ where: { id: cruise.id }, update: cruise, create: cruise });

  const inventory = JSON.stringify(ambassadorCabinInventory);
  const departureDates = getAmbassadorDepartureDates();
  for (const departureDate of departureDates) {
    const data = {
      cruise_id: AMBASSADOR_CRUISE_ID,
      departure_date: departureDate,
      departure_time: '11:30',
      status: 'open',
      inventory,
      notes: 'Lịch mở bán định kỳ của Ambassador Hạ Long',
    };
    await prisma.cruiseDeparture.upsert({
      where: { cruise_id_departure_date: { cruise_id: AMBASSADOR_CRUISE_ID, departure_date: departureDate } },
      update: data,
      create: data,
    });
  }

  console.log(`Ambassador Hạ Long đã sẵn sàng với ${departureDates.length} lịch khởi hành.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
