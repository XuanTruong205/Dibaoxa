const MEDIA_ROOT = '/images/cruises/ambassador-halong';

export const AMBASSADOR_CRUISE_ID = 'cruise-ambassador-ha-long';

export const ambassadorCruiseFixture = {
  id: AMBASSADOR_CRUISE_ID,
  name: 'Du thuyền Ambassador Hạ Long',
  operator: 'Ambassador Cruise',
  destination: 'Hạ Long',
  departure_port: 'Cảng tàu khách quốc tế Hạ Long, Bãi Cháy',
  duration_days: 2,
  price: 3_850_000,
  rating: 9.6,
  review_count: 126,
  ship_class: 5,
  image: `${MEDIA_ROOT}/ambassador-sunset.png`,
  gallery_images: [
    `${MEDIA_ROOT}/ambassador-sunset.png`,
    `${MEDIA_ROOT}/ambassador-front.png`,
    `${MEDIA_ROOT}/ambassador-aerial.png`,
    `${MEDIA_ROOT}/ambassador-suite.png`,
    `${MEDIA_ROOT}/ambassador-suite-bath.png`,
    `${MEDIA_ROOT}/ambassador-private-terrace.png`,
    `${MEDIA_ROOT}/ambassador-bath-view.png`,
    `${MEDIA_ROOT}/ambassador-suite-dining.png`,
    `${MEDIA_ROOT}/ambassador-wine-cellar.png`,
    `${MEDIA_ROOT}/ambassador-restaurant-service.png`,
    `${MEDIA_ROOT}/ambassador-buffet.png`,
    `${MEDIA_ROOT}/ambassador-restaurant.png`,
    `${MEDIA_ROOT}/ambassador-jacuzzi-01.png`,
    `${MEDIA_ROOT}/ambassador-jacuzzi-02.png`,
    `${MEDIA_ROOT}/ambassador-jacuzzi-03.png`,
    `${MEDIA_ROOT}/ambassador-jacuzzi-04.png`,
    `${MEDIA_ROOT}/ambassador-cave-dinner.png`,
    `${MEDIA_ROOT}/ambassador-sunset-dinner.png`,
    `${MEDIA_ROOT}/ambassador-deck-event.png`,
  ],
  features: [
    'Bể sục jacuzzi ngoài trời',
    'Ban công riêng',
    'Nhà hàng cao cấp',
    'Quầy bar',
    'Chèo kayak',
    'Lớp Thái Cực Quyền',
    'Bữa ăn trọn gói',
    'Sự kiện trên boong tàu',
  ],
  cabins: [
    'Ambassador Deluxe Balcony',
    'Ambassador Premium Balcony',
    'Ambassador Suite',
    "Captain's View Suite",
  ],
  itinerary: [
    'Ngày 1 · Đón khách tại Hạ Long, dùng bữa trưa và khám phá hang Luồn bằng kayak hoặc đò nan',
    'Chiều · Tham quan đảo Ti Tốp, ngắm hoàng hôn và dùng bữa tối trên du thuyền',
    'Ngày 2 · Tập Thái Cực Quyền, tham quan hang Sửng Sốt và trở về cảng Hạ Long',
  ],
  description: 'Ambassador Hạ Long là du thuyền nghỉ dưỡng 5 sao với thiết kế hiện đại, không gian rộng và hệ thống cabin hướng vịnh. Hành trình kết hợp các biểu tượng của vịnh Hạ Long với trải nghiệm ẩm thực, thư giãn tại bể sục ngoài trời và dịch vụ được chuẩn bị riêng cho từng nhóm khách.',
  policies: [
    'Giá bao gồm cabin theo hạng đã chọn, các bữa ăn trong chương trình, vé tham quan theo lịch trình, hoạt động kayak hoặc đò nan và bảo hiểm hành khách.',
    'Giá chưa bao gồm đồ uống gọi riêng, dịch vụ spa, phương tiện di chuyển đến cảng, tiền tip và các chi phí cá nhân ngoài chương trình.',
    'Khách cần cung cấp thông tin định danh trước ngày khởi hành và có mặt tại điểm đón ít nhất 30 phút trước giờ làm thủ tục.',
    'Lịch trình có thể thay đổi theo thời tiết hoặc yêu cầu của Ban quản lý vịnh; Dibaoxa sẽ thông báo và hỗ trợ phương án phù hợp.',
  ],
  faqs: [
    {
      question: 'Du thuyền Ambassador Hạ Long khởi hành từ đâu?',
      answer: 'Tàu làm thủ tục tại Cảng tàu khách quốc tế Hạ Long, khu vực Bãi Cháy. Điểm tập trung chi tiết được gửi trong xác nhận đặt chỗ.',
    },
    {
      question: 'Trẻ em có thể tham gia hành trình không?',
      answer: 'Có. Giá và sức chứa được tính theo độ tuổi, hạng cabin và ngày khởi hành; hãy nhập đúng số khách để Dibaoxa xác nhận phương án phù hợp.',
    },
    {
      question: 'Có phục vụ món chay hoặc thực đơn dị ứng không?',
      answer: 'Có thể chuẩn bị khi được báo trước. Bạn nên ghi rõ nhu cầu ăn uống trong bước đặt chỗ để đội ngũ vận hành xác nhận.',
    },
  ],
  specifications: {
    launchedYear: 2018,
    cabinCount: 46,
    hullMaterial: 'Kim loại',
    route: 'Vịnh Hạ Long · Hang Luồn · đảo Ti Tốp · hang Sửng Sốt',
  },
  status: 'active',
};

export const ambassadorCabinInventory = [
  { cabin_name: 'Ambassador Deluxe Balcony', total_units: 18, price_override: 3_850_000 },
  { cabin_name: 'Ambassador Premium Balcony', total_units: 14, price_override: 4_300_000 },
  { cabin_name: 'Ambassador Suite', total_units: 8, price_override: 4_800_000 },
  { cabin_name: "Captain's View Suite", total_units: 2, price_override: 5_300_000 },
];

export function getAmbassadorDepartureDates({ count = 12, intervalDays = 7, from = new Date() } = {}) {
  const firstDate = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 7));
  const daysUntilSaturday = (6 - firstDate.getUTCDay() + 7) % 7;
  firstDate.setUTCDate(firstDate.getUTCDate() + daysUntilSaturday);

  return Array.from({ length: count }, (_, index) => {
    const departure = new Date(firstDate);
    departure.setUTCDate(firstDate.getUTCDate() + index * intervalDays);
    return departure.toISOString().slice(0, 10);
  });
}

export function serializeAmbassadorCruise(fixture = ambassadorCruiseFixture) {
  return {
    ...fixture,
    gallery_images: JSON.stringify(fixture.gallery_images),
    features: JSON.stringify(fixture.features),
    cabins: JSON.stringify(fixture.cabins),
    itinerary: JSON.stringify(fixture.itinerary),
    policies: JSON.stringify(fixture.policies),
    faqs: JSON.stringify(fixture.faqs),
    specifications: JSON.stringify(fixture.specifications),
  };
}
