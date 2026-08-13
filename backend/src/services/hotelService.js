import { prisma } from '../config/db.js';
import { getRoomActiveHolds } from './bookingService.js';
import { dateRangesOverlap, validateOptionalStayRange } from '../utils/dateUtils.js';
import { httpError } from '../utils/httpError.js';

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeHotel(hotel) {
  return {
    ...hotel,
    amenities: parseJsonArray(hotel.amenities),
    gallery_images: parseJsonArray(hotel.gallery_images),
    highlights: parseJsonArray(hotel.highlights),
    highlight_bullets: parseJsonArray(hotel.highlight_bullets),
    policies: parseJsonArray(hotel.policies),
    faqs: parseJsonArray(hotel.faqs),
    ...(hotel.rooms && {
      rooms: hotel.rooms.map((room) => ({
        ...room,
        images: parseJsonArray(room.images),
        room_services: parseJsonArray(room.room_services),
      })),
    }),
    ...(hotel.reviews && {
      reviews: hotel.reviews.map((review) => ({
        ...review,
        media_urls: parseJsonArray(review.media_urls),
      })),
    }),
  };
}

export const STAY_TYPES = ['resort', 'villa', 'boutique', 'family', 'nature', 'beach'];

function deriveStayTypes(hotel, rooms) {
  const searchableText = [
    hotel.name,
    hotel.description,
    hotel.city,
    ...parseJsonArray(hotel.amenities),
    ...parseJsonArray(hotel.highlights),
    ...rooms.flatMap((room) => [room.name, room.room_type, room.view_type]),
  ].join(' ').toLocaleLowerCase('vi');
  const types = new Set();

  if (/resort|khu nghỉ dưỡng/.test(searchableText)) types.add('resort');
  if (/villa/.test(searchableText)) types.add('villa');
  if (/boutique|heritage|di sản|phố cổ/.test(searchableText)) types.add('boutique');
  if (/family|gia đình/.test(searchableText) || rooms.some((room) => room.max_occupancy >= 4)) types.add('family');
  if (/rừng|vườn|pine|thiên nhiên|đồi|núi/.test(searchableText)) types.add('nature');
  if (/biển|bãi biển|beach|ocean|sea view|vịnh/.test(searchableText)) types.add('beach');

  if (types.size === 0) types.add('boutique');
  return [...types];
}

async function getRoomReservedCount(roomId, checkIn, checkOut) {
  const aggregate = await prisma.booking.aggregate({
    where: {
      room_id: roomId,
      AND: [
        { check_in_date: { lt: checkOut } },
        { check_out_date: { gt: checkIn } },
      ],
      OR: [
        { status: { in: ['confirmed', 'checked_in'] } },
        { status: 'pending_payment', payment_expires_at: { gt: new Date() } },
      ],
    },
    _sum: { room_quantity: true },
  });
  return aggregate._sum.room_quantity || 0;
}

async function serializeRoomAvailability(room, checkIn, checkOut) {
  let reservedCount = 0;
  let heldCount = 0;
  if (checkIn && checkOut) {
    [reservedCount, heldCount] = await Promise.all([
      getRoomReservedCount(room.id, checkIn, checkOut),
      getRoomActiveHolds(room.id).then((holds) => holds
        .filter((hold) => dateRangesOverlap(hold.check_in_date, hold.check_out_date, checkIn, checkOut))
        .reduce((sum, hold) => sum + hold.quantity, 0)),
    ]);
  }
  return {
    ...room,
    images: parseJsonArray(room.images),
    room_services: parseJsonArray(room.room_services),
    available_count: Math.max(0, room.total_rooms - reservedCount - heldCount),
    is_held_temp: heldCount > 0,
  };
}

export async function searchHotels(query) {
  const {
    city,
    min_price,
    max_price,
    stars,
    stay_type,
    search,
    check_in,
    check_out,
    page = 1,
    limit = 20,
  } = query;
  validateOptionalStayRange(check_in, check_out);

  const where = {};
  if (city && city !== 'all') where.city = { contains: city };
  if (stars) where.star_rating = stars;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { city: { contains: search } },
      { address: { contains: search } },
    ];
  }

  const hotels = await prisma.hotel.findMany({
    where,
    include: { rooms: { where: { is_available: true } }, reviews: { select: { rating: true } } },
    orderBy: { created_at: 'desc' },
  });

  const transformed = await Promise.all(hotels.map(async (hotel) => {
    const rooms = await Promise.all(hotel.rooms.map((room) => serializeRoomAvailability(room, check_in, check_out)));
    const sellableRooms = rooms.filter((room) => room.available_count > 0);
    const avgRating = hotel.reviews.length
      ? hotel.reviews.reduce((sum, review) => sum + review.rating, 0) / hotel.reviews.length
      : null;
    return {
      ...serializeHotel(hotel),
      rooms: undefined,
      reviews: undefined,
      stay_types: deriveStayTypes(hotel, rooms),
      room_preview: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        room_type: room.room_type,
        max_occupancy: room.max_occupancy,
        price_per_night: room.price_per_night,
        bed_type: room.bed_type,
        area_sqm: room.area_sqm,
        view_type: room.view_type,
      })),
      min_price: sellableRooms.length ? Math.min(...sellableRooms.map((room) => room.price_per_night)) : null,
      avg_rating: avgRating === null ? null : Number(avgRating.toFixed(1)),
      review_count: hotel.reviews.length,
      total_rooms_count: rooms.reduce((sum, room) => sum + room.total_rooms, 0),
      available_rooms_count: sellableRooms.reduce((sum, room) => sum + room.available_count, 0),
    };
  }));

  const filtered = transformed.filter((hotel) => {
    if (check_in && check_out && hotel.available_rooms_count === 0) return false;
    if (stay_type && !hotel.stay_types.includes(stay_type)) return false;
    if (min_price !== undefined && (hotel.min_price === null || hotel.min_price < min_price)) return false;
    if (max_price !== undefined && (hotel.min_price === null || hotel.min_price > max_price)) return false;
    return true;
  });
  const start = (page - 1) * limit;
  return {
    hotels: filtered.slice(start, start + limit),
    pagination: { page, limit, total: filtered.length, total_pages: Math.ceil(filtered.length / limit) },
  };
}

export async function getHotelDetail(hotelId) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      rooms: true,
      services: true,
      reviews: {
        include: { user: { select: { full_name: true, vip_tier: true } } },
        orderBy: { created_at: 'desc' },
      },
    },
  });
  if (!hotel) throw httpError(404, 'Không tìm thấy thông tin khách sạn.', 'HOTEL_NOT_FOUND');

  const avgRating = hotel.reviews.length
    ? hotel.reviews.reduce((sum, review) => sum + review.rating, 0) / hotel.reviews.length
    : null;
  return {
    ...serializeHotel(hotel),
    avg_rating: avgRating === null ? null : Number(avgRating.toFixed(1)),
    review_count: hotel.reviews.length,
  };
}

export async function getHotelRoomsWithRealtimeAvailability(hotelId, checkIn, checkOut) {
  validateOptionalStayRange(checkIn, checkOut);
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, select: { id: true } });
  if (!hotel) throw httpError(404, 'Không tìm thấy khách sạn.', 'HOTEL_NOT_FOUND');

  const rooms = await prisma.room.findMany({
    where: { hotel_id: hotelId, is_available: true },
    orderBy: { price_per_night: 'asc' },
  });
  return Promise.all(rooms.map((room) => serializeRoomAvailability(room, checkIn, checkOut)));
}
