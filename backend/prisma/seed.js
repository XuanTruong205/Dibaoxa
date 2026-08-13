import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { serializeAmbassadorCruise } from './ambassador-cruise.js';

const prisma = new PrismaClient();

const COASTAL_IMAGE = '/images/dibaoxa-coastal-resort.webp';
const DALAT_IMAGE = '/images/dibaoxa-dalat-retreat.webp';

const HOTEL_IDS = {
  danang: 'hotel-demo-danang-coastal',
  dalat: 'hotel-demo-dalat-pine',
  phuquoc: 'hotel-demo-phuquoc-sunset',
  hanoi: 'hotel-demo-hanoi-old-quarter',
};

const toJson = (value) => JSON.stringify(value);

const cruiseFixtures = [
  { id: 'cruise-heritage-binh-chuan-cat-ba', name: 'Heritage Bình Chuẩn Cát Bà', operator: 'Heritage Cruises', destination: 'Lan Hạ', departure_port: 'Bến Gót, Cát Hải, Hải Phòng', duration_days: 2, price: 5050000, rating: 9.4, review_count: 128, ship_class: 5, image: '/images/dibaoxa-cruise-hero.png', features: ['Ban công riêng', 'Bể bơi', 'Spa', 'Bữa ăn trọn gói', 'Phòng gia đình'], cabins: ['Delta Suite', 'Ocean Suite', 'Captain Suite', 'Heritage Family'], itinerary: ['Đón khách tại Cát Hải', 'Vịnh Lan Hạ và hang Sáng Tối', 'Làng Việt Hải, trả khách'] },
  { id: 'cruise-heritage-dawn', name: 'Heritage Dawn Hạ Long', operator: 'Dibaoxa Select', destination: 'Hạ Long', departure_port: 'Cảng Tuần Châu', duration_days: 2, price: 4850000, rating: 9.3, review_count: 186, ship_class: 5, image: '/images/dibaoxa-cruise-hero.png', features: ['Ban công riêng', 'Chèo kayak', 'Bể bơi', 'Bữa ăn trọn gói'], cabins: ['Deluxe Ocean', 'Suite Balcony', 'Family Connecting'], itinerary: ['Đón khách tại Tuần Châu', 'Hang Sửng Sốt và chèo kayak', 'Ngắm bình minh, trả khách'] },
  { id: 'cruise-lanha-serenity', name: 'Lan Hạ Serenity', operator: 'Emerald Passage', destination: 'Lan Hạ', departure_port: 'Bến Gót, Cát Hải', duration_days: 3, price: 7290000, rating: 9.5, review_count: 142, ship_class: 5, image: '/images/dibaoxa-cruise-hero.png', features: ['Ban công riêng', 'Chèo kayak', 'Spa', 'Bữa ăn trọn gói'], cabins: ['Junior Suite', 'Executive Suite', 'Lan Hạ Signature'], itinerary: ['Khởi hành từ Cát Hải', 'Làng Việt Hải và đảo Cát Bà', 'Ao Ếch, trả khách'] },
  { id: 'cruise-sapphire-passage', name: 'Sapphire Passage', operator: 'Northern Sails', destination: 'Hạ Long', departure_port: 'Cảng quốc tế Hạ Long', duration_days: 2, price: 3590000, rating: 8.8, review_count: 264, ship_class: 4, image: '/images/dibaoxa-discover-vietnam.webp', features: ['Chèo kayak', 'Lớp nấu ăn', 'Bữa ăn trọn gói'], cabins: ['Ocean View', 'Premium Bay View'], itinerary: ['Đón khách tại Bãi Cháy', 'Đảo Ti Tốp và hang Luồn', 'Trả khách tại Hạ Long'] },
  { id: 'cruise-mekong-horizon', name: 'Mekong Horizon', operator: 'Southern River Co.', destination: 'Mekong', departure_port: 'Bến Ninh Kiều, Cần Thơ', duration_days: 3, price: 6120000, rating: 9.1, review_count: 97, ship_class: 5, image: '/images/dibaoxa-coastal-resort.webp', features: ['Ban công riêng', 'Lớp nấu ăn', 'Xe đạp làng quê', 'Bữa ăn trọn gói'], cabins: ['River Deluxe', 'Mekong Suite'], itinerary: ['Chợ nổi Cái Răng', 'Cù lao An Bình', 'Trả khách tại Cần Thơ'] },
  { id: 'cruise-nhatrang-blue', name: 'Nha Trang Blue Voyage', operator: 'Coastal Journey', destination: 'Nha Trang', departure_port: 'Cảng Cầu Đá', duration_days: 1, price: 1890000, rating: 8.6, review_count: 211, ship_class: 4, image: '/images/dibaoxa-coastal-resort.webp', features: ['Lặn ống thở', 'Bữa trưa hải sản', 'Ván chèo đứng'], cabins: ['Day Lounge', 'Private Lounge'], itinerary: ['Đón khách tại Cầu Đá', 'Hòn Mun và làng chài', 'Hoàng hôn trên vịnh'] },
  { id: 'cruise-condao-voyager', name: 'Côn Đảo Voyager', operator: 'Island Passage', destination: 'Côn Đảo', departure_port: 'Cảng Bến Đầm', duration_days: 2, price: 5380000, rating: 9, review_count: 78, ship_class: 5, image: '/images/dibaoxa-cruise-hero.png', features: ['Ban công riêng', 'Lặn ống thở', 'Bữa ăn trọn gói'], cabins: ['Island View', 'Voyager Suite'], itinerary: ['Khởi hành từ Bến Đầm', 'Hòn Bảy Cạnh và lặn ống thở', 'Trả khách tại Côn Đảo'] },
].map((cruise) => ({
  ...cruise,
  gallery_images: toJson([cruise.image, COASTAL_IMAGE, DALAT_IMAGE]),
  features: toJson(cruise.features),
  cabins: toJson(cruise.cabins),
  itinerary: toJson(cruise.itinerary),
  description: `${cruise.name} mang đến hành trình nghỉ dưỡng giàu trải nghiệm tại ${cruise.destination}, với cabin tiện nghi, ẩm thực chọn lọc và lịch trình được Dibaoxa xác nhận rõ ràng.`,
  policies: toJson(['Giá bao gồm cabin, bữa ăn và hoạt động trong lịch trình', 'Lịch trình có thể điều chỉnh theo thời tiết', 'Điều kiện hoàn hủy áp dụng theo hạng giá']),
  faqs: toJson([{ question: 'Tôi cần có mặt tại bến trước bao lâu?', answer: 'Bạn nên có mặt trước giờ đón khoảng 30 phút.' }]),
  specifications: toJson({}),
  status: 'active',
})).concat(serializeAmbassadorCruise());

function getDemoPassword() {
  const configuredPassword = process.env.DEMO_PASSWORD?.trim();
  if (configuredPassword) return configuredPassword;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEMO_PASSWORD is required when seeding in production.');
  }

  return '123456';
}

async function upsertDemoUsers(passwordHash) {
  const customer = await prisma.user.upsert({
    where: { email: 'customer@dibaoxa.vn' },
    update: {
      password_hash: passwordHash,
      full_name: 'Nguyễn Văn Minh',
      phone: '0905123456',
      assigned_hotel: null,
      reward_points: 2300,
      vip_tier: 'gold',
      role: 'customer',
    },
    create: {
      id: 'user-demo-customer',
      email: 'customer@dibaoxa.vn',
      password_hash: passwordHash,
      full_name: 'Nguyễn Văn Minh',
      phone: '0905123456',
      assigned_hotel: null,
      reward_points: 2300,
      vip_tier: 'gold',
      role: 'customer',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dibaoxa.vn' },
    update: {
      password_hash: passwordHash,
      full_name: 'Trần Thị Thu Hà',
      phone: '0912987654',
      assigned_hotel: null,
      reward_points: 0,
      vip_tier: 'silver',
      role: 'admin',
    },
    create: {
      id: 'user-demo-admin',
      email: 'admin@dibaoxa.vn',
      password_hash: passwordHash,
      full_name: 'Trần Thị Thu Hà',
      phone: '0912987654',
      assigned_hotel: null,
      reward_points: 0,
      vip_tier: 'silver',
      role: 'admin',
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@dibaoxa.vn' },
    update: {
      password_hash: passwordHash,
      full_name: 'Lê Hoàng Nam',
      phone: '0988776655',
      assigned_hotel: HOTEL_IDS.danang,
      reward_points: 0,
      vip_tier: 'silver',
      role: 'receptionist',
    },
    create: {
      id: 'user-demo-receptionist',
      email: 'reception@dibaoxa.vn',
      password_hash: passwordHash,
      full_name: 'Lê Hoàng Nam',
      phone: '0988776655',
      assigned_hotel: HOTEL_IDS.danang,
      reward_points: 0,
      vip_tier: 'silver',
      role: 'receptionist',
    },
  });

  return { customer, admin, receptionist };
}

const hotelFixtures = [
  {
    id: HOTEL_IDS.danang,
    name: 'Dibaoxa Coastal Đà Nẵng',
    city: 'Đà Nẵng',
    address: '118 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng',
    star_rating: 5,
    description: 'Khu nghỉ dưỡng bên biển Mỹ Khê với không gian mở, hồ bơi vô cực và dịch vụ phù hợp cho cả kỳ nghỉ đôi lẫn gia đình.',
    cover_image: COASTAL_IMAGE,
    operator_company: 'Dibaoxa Hospitality',
    amenities: toJson(['Hồ bơi vô cực', 'Bãi biển riêng', 'Nhà hàng', 'Spa', 'Wifi miễn phí', 'Đưa đón sân bay']),
    gallery_images: toJson([COASTAL_IMAGE, DALAT_IMAGE]),
    highlights: toJson(['Bãi biển riêng', 'Hồ bơi vô cực', 'Lễ tân 24h', 'Spa & Massage', 'Nhà hàng']),
    highlight_bullets: toJson([
      'Cách bãi biển Mỹ Khê vài phút đi bộ',
      'Hồ bơi nhìn thẳng ra vịnh và khu thư giãn ngoài trời',
      'Có phòng gia đình và suite rộng rãi cho kỳ nghỉ dài ngày',
    ]),
  },
  {
    id: HOTEL_IDS.dalat,
    name: 'Dibaoxa Pine Retreat Đà Lạt',
    city: 'Đà Lạt',
    address: '27 Đường Hoa Hồng, Phường 4, Đà Lạt',
    star_rating: 4,
    description: 'Khu lưu trú giữa rừng thông với thiết kế ấm áp, ban công riêng và không khí yên tĩnh dành cho những chuyến nghỉ dưỡng chậm.',
    cover_image: DALAT_IMAGE,
    operator_company: 'Dibaoxa Highland Collection',
    amenities: toJson(['Vườn thông', 'Lò sưởi', 'Nhà hàng', 'Quầy cà phê', 'Wifi miễn phí', 'Xe đưa đón trung tâm']),
    gallery_images: toJson([DALAT_IMAGE, COASTAL_IMAGE]),
    highlights: toJson(['View rừng thông', 'Lò sưởi trong phòng', 'Bữa sáng địa phương', 'Xe đưa đón trung tâm']),
    highlight_bullets: toJson([
      'Không gian riêng tư giữa rừng thông Đà Lạt',
      'Ban công đón sương sớm và khu đọc sách yên tĩnh',
      'Thực đơn sử dụng nông sản địa phương theo mùa',
    ]),
  },
  {
    id: HOTEL_IDS.phuquoc,
    name: 'Dibaoxa Sunset Bay Phú Quốc',
    city: 'Phú Quốc',
    address: 'Bãi Trường, Dương Tơ, Phú Quốc, Kiên Giang',
    star_rating: 5,
    description: 'Resort hướng hoàng hôn tại Bãi Trường, có villa gần biển, hồ bơi và các hoạt động phù hợp cho gia đình.',
    cover_image: COASTAL_IMAGE,
    operator_company: 'Dibaoxa Island Resorts',
    amenities: toJson(['Bãi biển riêng', 'Hồ bơi', 'Câu lạc bộ trẻ em', 'Nhà hàng hải sản', 'Spa', 'Đưa đón sân bay']),
    gallery_images: toJson([COASTAL_IMAGE, DALAT_IMAGE]),
    highlights: toJson(['Ngắm hoàng hôn', 'Villa gần biển', 'Câu lạc bộ trẻ em', 'Đưa đón sân bay']),
    highlight_bullets: toJson([
      'Vị trí trực diện hướng hoàng hôn trên Bãi Trường',
      'Có villa hai phòng ngủ cho gia đình và nhóm bạn',
      'Lịch hoạt động biển được cập nhật hàng ngày',
    ]),
  },
  {
    id: HOTEL_IDS.hanoi,
    name: 'Dibaoxa Heritage Hà Nội',
    city: 'Hà Nội',
    address: '36 Hàng Trống, Hoàn Kiếm, Hà Nội',
    star_rating: 4,
    description: 'Khách sạn boutique gần Hồ Gươm, kết hợp nét kiến trúc Hà Nội với tiện nghi hiện đại cho chuyến công tác hoặc khám phá phố cổ.',
    cover_image: DALAT_IMAGE,
    operator_company: 'Dibaoxa Heritage Hotels',
    amenities: toJson(['Nhà hàng', 'Rooftop lounge', 'Phòng họp', 'Wifi miễn phí', 'Lễ tân 24h', 'Đưa đón sân bay']),
    gallery_images: toJson([DALAT_IMAGE, COASTAL_IMAGE]),
    highlights: toJson(['Gần Hồ Gươm', 'Rooftop lounge', 'Phòng họp', 'Lễ tân 24h']),
    highlight_bullets: toJson([
      'Đi bộ thuận tiện đến Hồ Gươm và khu phố cổ',
      'Không gian boutique yên tĩnh giữa trung tâm thành phố',
      'Có phòng làm việc và phòng họp cho khách công tác',
    ]),
  },
];

const roomFixtures = [
  {
    id: 'room-danang-deluxe-ocean', hotel_id: HOTEL_IDS.danang, name: 'Deluxe Ocean', room_type: 'Deluxe',
    price_per_night: 2400000, max_occupancy: 2, bed_type: '1 giường King', area_sqm: 42,
    view_type: 'Ocean view', images: toJson([COASTAL_IMAGE]),
    room_services: toJson(['Điều hòa', 'Minibar', 'Bồn tắm', 'Máy pha cà phê', 'Wifi miễn phí']), total_rooms: 8,
  },
  {
    id: 'room-danang-family-sea', hotel_id: HOTEL_IDS.danang, name: 'Family Sea View', room_type: 'Family',
    price_per_night: 3600000, max_occupancy: 4, bed_type: '2 giường Queen', area_sqm: 58,
    view_type: 'Ocean view', images: toJson([COASTAL_IMAGE, DALAT_IMAGE]),
    room_services: toJson(['Điều hòa', 'Minibar', 'Ban công', 'Bồn tắm', 'Khu tiếp khách']), total_rooms: 5,
  },
  {
    id: 'room-danang-signature-suite', hotel_id: HOTEL_IDS.danang, name: 'Signature Suite', room_type: 'Suite',
    price_per_night: 4900000, max_occupancy: 3, bed_type: '1 giường King', area_sqm: 72,
    view_type: 'Ocean view', images: toJson([COASTAL_IMAGE]),
    room_services: toJson(['Phòng khách riêng', 'Máy pha cà phê', 'Minibar', 'Bồn tắm', 'Ban công']), total_rooms: 3,
  },
  {
    id: 'room-dalat-pine-studio', hotel_id: HOTEL_IDS.dalat, name: 'Pine Studio', room_type: 'Double',
    price_per_night: 1650000, max_occupancy: 2, bed_type: '1 giường Queen', area_sqm: 34,
    view_type: 'Pine view', images: toJson([DALAT_IMAGE]),
    room_services: toJson(['Lò sưởi', 'Ấm đun nước', 'Ban công', 'Wifi miễn phí']), total_rooms: 10,
  },
  {
    id: 'room-dalat-garden-deluxe', hotel_id: HOTEL_IDS.dalat, name: 'Garden Deluxe', room_type: 'Deluxe',
    price_per_night: 2450000, max_occupancy: 3, bed_type: '1 giường King', area_sqm: 46,
    view_type: 'Garden view', images: toJson([DALAT_IMAGE, COASTAL_IMAGE]),
    room_services: toJson(['Lò sưởi', 'Bồn tắm', 'Ban công', 'Máy pha cà phê']), total_rooms: 6,
  },
  {
    id: 'room-dalat-family-loft', hotel_id: HOTEL_IDS.dalat, name: 'Family Pine Loft', room_type: 'Family',
    price_per_night: 3200000, max_occupancy: 4, bed_type: '2 giường Queen', area_sqm: 62,
    view_type: 'Pine view', images: toJson([DALAT_IMAGE]),
    room_services: toJson(['Lò sưởi', 'Khu tiếp khách', 'Bếp nhỏ', 'Ban công']), total_rooms: 4,
  },
  {
    id: 'room-phuquoc-deluxe-sunset', hotel_id: HOTEL_IDS.phuquoc, name: 'Deluxe Sunset', room_type: 'Deluxe',
    price_per_night: 2850000, max_occupancy: 2, bed_type: '1 giường King', area_sqm: 45,
    view_type: 'Sunset ocean view', images: toJson([COASTAL_IMAGE]),
    room_services: toJson(['Điều hòa', 'Minibar', 'Ban công', 'Bồn tắm']), total_rooms: 12,
  },
  {
    id: 'room-phuquoc-beach-villa', hotel_id: HOTEL_IDS.phuquoc, name: 'Beach Villa', room_type: 'Villa',
    price_per_night: 5900000, max_occupancy: 3, bed_type: '1 giường King', area_sqm: 78,
    view_type: 'Beach view', images: toJson([COASTAL_IMAGE, DALAT_IMAGE]),
    room_services: toJson(['Hồ bơi riêng', 'Minibar', 'Máy pha cà phê', 'Bồn tắm']), total_rooms: 5,
  },
  {
    id: 'room-phuquoc-family-villa', hotel_id: HOTEL_IDS.phuquoc, name: 'Family Pool Villa', room_type: 'Villa',
    price_per_night: 7900000, max_occupancy: 6, bed_type: '2 giường King', area_sqm: 118,
    view_type: 'Garden and pool view', images: toJson([COASTAL_IMAGE]),
    room_services: toJson(['Hồ bơi riêng', 'Bếp nhỏ', 'Phòng khách', 'Minibar']), total_rooms: 3,
  },
  {
    id: 'room-hanoi-heritage-queen', hotel_id: HOTEL_IDS.hanoi, name: 'Heritage Queen', room_type: 'Double',
    price_per_night: 1750000, max_occupancy: 2, bed_type: '1 giường Queen', area_sqm: 30,
    view_type: 'Old Quarter view', images: toJson([DALAT_IMAGE]),
    room_services: toJson(['Điều hòa', 'Bàn làm việc', 'Minibar', 'Wifi miễn phí']), total_rooms: 14,
  },
  {
    id: 'room-hanoi-lake-suite', hotel_id: HOTEL_IDS.hanoi, name: 'Lake View Suite', room_type: 'Suite',
    price_per_night: 3350000, max_occupancy: 3, bed_type: '1 giường King', area_sqm: 52,
    view_type: 'Lake view', images: toJson([DALAT_IMAGE, COASTAL_IMAGE]),
    room_services: toJson(['Phòng khách riêng', 'Bồn tắm', 'Máy pha cà phê', 'Bàn làm việc']), total_rooms: 6,
  },
];

const serviceFixtures = [
  { id: 'service-danang-breakfast', hotel_id: HOTEL_IDS.danang, name: 'Buffet sáng', price: 450000, description: 'Buffet sáng quốc tế tại nhà hàng hướng biển.' },
  { id: 'service-danang-airport', hotel_id: HOTEL_IDS.danang, name: 'Đưa đón sân bay', price: 650000, description: 'Xe riêng một chiều từ hoặc đến sân bay Đà Nẵng.' },
  { id: 'service-danang-spa', hotel_id: HOTEL_IDS.danang, name: 'Trị liệu spa 60 phút', price: 1200000, description: 'Liệu trình thư giãn 60 phút dành cho một khách.' },
  { id: 'service-dalat-breakfast', hotel_id: HOTEL_IDS.dalat, name: 'Bữa sáng cao nguyên', price: 280000, description: 'Bữa sáng sử dụng nguyên liệu địa phương theo mùa.' },
  { id: 'service-dalat-tea', hotel_id: HOTEL_IDS.dalat, name: 'Trà chiều bên rừng thông', price: 390000, description: 'Set trà chiều dành cho hai khách.' },
  { id: 'service-dalat-city-transfer', hotel_id: HOTEL_IDS.dalat, name: 'Xe đưa đón trung tâm', price: 250000, description: 'Xe khứ hồi theo lịch giữa retreat và chợ Đà Lạt.' },
  { id: 'service-phuquoc-breakfast', hotel_id: HOTEL_IDS.phuquoc, name: 'Buffet sáng', price: 420000, description: 'Buffet sáng tại nhà hàng hướng biển.' },
  { id: 'service-phuquoc-airport', hotel_id: HOTEL_IDS.phuquoc, name: 'Đưa đón sân bay', price: 500000, description: 'Xe riêng một chiều từ hoặc đến sân bay Phú Quốc.' },
  { id: 'service-phuquoc-snorkeling', hotel_id: HOTEL_IDS.phuquoc, name: 'Tour lặn ngắm san hô', price: 1350000, description: 'Tour nửa ngày đã gồm thiết bị và hướng dẫn viên.' },
  { id: 'service-hanoi-breakfast', hotel_id: HOTEL_IDS.hanoi, name: 'Bữa sáng Hà Nội', price: 320000, description: 'Thực đơn sáng Việt Nam và quốc tế.' },
  { id: 'service-hanoi-airport', hotel_id: HOTEL_IDS.hanoi, name: 'Đưa đón Nội Bài', price: 550000, description: 'Xe riêng một chiều từ hoặc đến sân bay Nội Bài.' },
];

const reviewFixtures = [
  { id: 'review-danang-01', hotel_id: HOTEL_IDS.danang, rating: 5, comment: 'Phòng sạch, hồ bơi đẹp và nhân viên hỗ trợ rất nhanh.' },
  { id: 'review-danang-02', hotel_id: HOTEL_IDS.danang, rating: 4, comment: 'Vị trí gần biển, bữa sáng đa dạng và phù hợp cho gia đình.' },
  { id: 'review-dalat-01', hotel_id: HOTEL_IDS.dalat, rating: 5, comment: 'Không gian yên tĩnh, buổi sáng nhìn ra rừng thông rất dễ chịu.' },
  { id: 'review-dalat-02', hotel_id: HOTEL_IDS.dalat, rating: 4, comment: 'Phòng ấm áp và trà chiều đáng thử, xe trung tâm khá tiện.' },
  { id: 'review-phuquoc-01', hotel_id: HOTEL_IDS.phuquoc, rating: 5, comment: 'Hoàng hôn đẹp, bãi biển sạch và villa rộng rãi.' },
  { id: 'review-phuquoc-02', hotel_id: HOTEL_IDS.phuquoc, rating: 5, comment: 'Dịch vụ sân bay đúng giờ và khu trẻ em rất hữu ích.' },
  { id: 'review-hanoi-01', hotel_id: HOTEL_IDS.hanoi, rating: 4, comment: 'Đi bộ ra Hồ Gươm thuận tiện, phòng yên tĩnh dù ở trung tâm.' },
  { id: 'review-hanoi-02', hotel_id: HOTEL_IDS.hanoi, rating: 5, comment: 'Nhân viên nhiệt tình, rooftop có góc nhìn phố cổ đẹp.' },
];

const packageFixtures = [
  {
    id: 'package-demo-danang-3d2n',
    title: 'Đà Nẵng nghỉ biển 3 ngày 2 đêm',
    destination: 'Đà Nẵng',
    duration: '3 ngày 2 đêm',
    price: 4990000,
    included: toJson(['2 đêm phòng Deluxe Ocean', 'Buffet sáng', 'Đưa đón sân bay một chiều']),
    status: 'active',
  },
  {
    id: 'package-demo-dalat-3d2n',
    title: 'Đà Lạt rừng thông 3 ngày 2 đêm',
    destination: 'Đà Lạt',
    duration: '3 ngày 2 đêm',
    price: 3890000,
    included: toJson(['2 đêm phòng Pine Studio', 'Bữa sáng cao nguyên', 'Một set trà chiều']),
    status: 'active',
  },
];

const staffFixtures = [
  {
    id: 'staff-demo-reception-danang',
    full_name: 'Lê Hoàng Nam',
    email: 'reception@dibaoxa.vn',
    job_title: 'Nhân viên lễ tân',
    phone: '0988776655',
    assigned_hotel: HOTEL_IDS.danang,
    status: 'active',
  },
  {
    id: 'staff-demo-guide-dalat',
    full_name: 'Phạm Thu An',
    email: 'guide.dalat@dibaoxa.vn',
    job_title: 'Hướng dẫn viên du lịch',
    phone: '0977336688',
    assigned_hotel: HOTEL_IDS.dalat,
    status: 'active',
  },
];

async function upsertFixtures(customerId) {
  for (const cruise of cruiseFixtures) {
    await prisma.cruise.upsert({ where: { id: cruise.id }, update: cruise, create: cruise });
  }

  for (const hotel of hotelFixtures) {
    await prisma.hotel.upsert({
      where: { id: hotel.id },
      update: hotel,
      create: hotel,
    });
  }

  for (const room of roomFixtures) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: { ...room, is_available: true },
      create: { ...room, is_available: true },
    });
  }

  for (const service of serviceFixtures) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: service,
      create: service,
    });
  }

  for (const review of reviewFixtures) {
    const data = { ...review, user_id: customerId, media_urls: '[]' };
    await prisma.review.upsert({
      where: { id: review.id },
      update: data,
      create: data,
    });
  }

  for (const travelPackage of packageFixtures) {
    await prisma.travelPackage.upsert({
      where: { id: travelPackage.id },
      update: travelPackage,
      create: travelPackage,
    });
  }

  for (const staffMember of staffFixtures) {
    await prisma.staffDirectory.upsert({
      where: { id: staffMember.id },
      update: staffMember,
      create: staffMember,
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(getDemoPassword(), 10);
  const users = await upsertDemoUsers(passwordHash);
  await upsertFixtures(users.customer.id);

  console.log(
    `Dibaoxa demo data is ready: ${hotelFixtures.length} hotels, ${cruiseFixtures.length} cruises, ${roomFixtures.length} room types, ` +
    `${serviceFixtures.length} services, ${reviewFixtures.length} reviews, ${packageFixtures.length} packages, ` +
    `${staffFixtures.length} staff profiles. No existing rows were deleted.`
  );
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
