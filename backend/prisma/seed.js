import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAmbassadorDepartureDates, serializeAmbassadorCruise } from './ambassador-cruise.js';

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

const MEDIA_HALONG = '/images/cruises/ambassador-halong';

const cruiseRawFixtures = [
  {
    id: 'cruise-heritage-binh-chuan-cat-ba',
    name: 'Du thuyền Heritage Bình Chuẩn Cát Bà',
    operator: 'Heritage Cruises',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Tuần Châu / Bến Gót, Cát Hải, Hải Phòng',
    duration_days: 2,
    price: 3650000,
    rating: 9.6,
    review_count: 185,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-sunset.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-sunset.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-private-terrace.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
      `${MEDIA_HALONG}/ambassador-jacuzzi-01.png`,
    ],
    features: [
      'Phong cách Indochine',
      'Bể bơi 4 mùa',
      '100% phòng có ban công',
      'Thư viện nghệ thuật Bạch Thái Bưởi',
      'Chèo kayak hang Sáng Tối',
      'Ẩm thực Bắc Bộ thượng hạng',
    ],
    cabins: ['Delta Suite Balcony', 'Ocean Suite Balcony', 'Captain Suite', 'Regal Family Suite'],
    itinerary: [
      'Ngày 1 · Đón khách tại Cảng Tuần Châu, thưởng thức bữa trưa và ngắm vịnh Lan Hạ hoang sơ',
      'Chiều · Khám phá hang Sáng Tối bằng kayak hoặc thuyền nan, tắm biển tại bãi Ba Trái Đào',
      'Tối · Tiệc trà chiều ngắm hoàng hôn, thưởng thức bữa tối fine dining và câu mực đêm',
      'Ngày 2 · Đón bình minh, lớp học Vovinam/Tai Chi, tham quan làng chài Trà Báu và trở về bến',
    ],
    description: 'Du thuyền Heritage Bình Chuẩn Cát Bà mang đậm phong cách kiến trúc Đông Dương thế kỷ 20, tôn vinh huyền thoại "Vua tàu thủy" Bạch Thái Bưởi. Không gian nghệ thuật độc bản, bể bơi 4 mùa giữa biển và hải trình nguyên sơ tại vịnh Lan Hạ mang lại kỳ nghỉ sang trọng bậc nhất.',
    policies: [
      'Giá bao gồm phòng nghỉ theo hạng, trọn gói 4 bữa ăn cao cấp, vé tham quan và hoạt động kayak',
      'Lịch trình có thể thay đổi tùy thuộc vào điều kiện thời tiết và quy định của Ban quản lý Vịnh',
      'Trẻ em dưới 5 tuổi miễn phí 01 bé theo tiêu chuẩn phòng',
    ],
    faqs: [
      { question: 'Du thuyền khởi hành từ đâu?', answer: 'Du thuyền đón khách tại Lô 28, Cảng quốc tế Tuần Châu, Hạ Long hoặc hỗ trợ đón tại Bến Phà Gót Hải Phòng.' },
      { question: 'Trên tàu có phục vụ ăn chay không?', answer: 'Tàu có thực đơn chay và món ăn kiêng theo yêu cầu nếu được báo trước khi nhận phòng.' },
    ],
    specifications: { launchedYear: 2019, cabinCount: 20, hullMaterial: 'Vỏ thép đóng mới', route: 'Tuần Châu · Vịnh Lan Hạ · Hang Sáng Tối · Ba Trái Đào' },
  },
  {
    id: 'cruise-indochine',
    name: 'Du thuyền Indochine Cruise',
    operator: 'Indochina Sails',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Quốc tế Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 3350000,
    rating: 9.5,
    review_count: 168,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-aerial.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-aerial.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-restaurant-service.png`,
      `${MEDIA_HALONG}/ambassador-jacuzzi-02.png`,
    ],
    features: [
      'Thiết kế Đông Dương cổ điển',
      'Bể sục Jacuzzi bốn mùa',
      'Sundeck ngắm hoàng hôn 360°',
      'Nhà hàng Cochinchine sang trọng',
      'Lớp học Tai Chi & Nấu ăn',
      'Chèo kayak vịnh Lan Hạ',
    ],
    cabins: ['Junior Suite Balcony', 'Suite Balcony', 'Executive Suite', 'President Suite'],
    itinerary: [
      'Ngày 1 · Làm thủ tục tại Tuần Châu, khởi hành qua Vịnh Hạ Long tiến vào Vịnh Lan Hạ',
      'Chiều · Trải nghiệm chèo kayak tại Hang Sáng Tối, tắm biển và thư giãn bồn sục Jacuzzi',
      'Tối · Thưởng thức tiệc ẩm thực Á-Âu tại nhà hàng Tonkin, xem phim hoặc câu mực đêm',
      'Ngày 2 · Tập dưỡng sinh Tai Chi, khám phá hang Trung Trang (Cát Bà) và cập bến Tuần Châu',
    ],
    description: 'Du thuyền 5 sao Indochine Cruise là biểu tượng của sự kết hợp tinh tế giữa vẻ đẹp truyền thống Indochine và tiêu chuẩn xa hoa quốc tế. Với 43 cabin rộng rãi ngập tràn ánh sáng cùng 2 nhà hàng lớn, Indochine mang đến trải nghiệm khám phá vịnh Lan Hạ đẳng cấp.',
    policies: [
      'Giá đã bao gồm 3 bữa ăn chính + 1 bữa sáng nhẹ, vé thắng cảnh và bảo hiểm trên tàu',
      'Nhận phòng lúc 12:15 và trả phòng lúc 11:00 hôm sau',
      'Chính sách hoàn hủy linh hoạt trước 7 ngày không tính phí',
    ],
    faqs: [
      { question: 'Tàu có cabin thông nhau cho gia đình không?', answer: 'Có, Indochine Cruise có hạng phòng Connecting Suite dành riêng cho gia đình từ 4-5 người.' },
    ],
    specifications: { launchedYear: 2019, cabinCount: 43, hullMaterial: 'Vỏ thép chuẩn quốc tế', route: 'Tuần Châu · Vịnh Lan Hạ · Hang Sáng Tối · Động Trung Trang' },
  },
  {
    id: 'cruise-le-theatre',
    name: 'Du thuyền Le Théâtre Cruises',
    operator: 'Le Théâtre Cruise Line',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 3450000,
    rating: 9.5,
    review_count: 142,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-front.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
      `${MEDIA_HALONG}/ambassador-jacuzzi-03.png`,
    ],
    features: [
      'Kiến trúc Nhà Hát Opera Pháp độc đáo',
      'Bể sục vô cực ngoài trời',
      'Nhà hàng Le Opera phong cách Art Deco',
      'Ban công riêng 100% phòng',
      'Chèo kayak tại Ao Ếch',
      'Bar & Lounge ngắm vịnh',
    ],
    cabins: ['Junior Suite', 'Executive Suite', 'Panorama Suite', 'Le Théâtre Suite'],
    itinerary: [
      'Ngày 1 · Đón khách tại bến Tuần Châu, thưởng thức bữa trưa tại nhà hàng Opera độc đáo',
      'Chiều · Tham quan khu vực Ao Ếch, chèo kayak lướt qua những ngọn núi đá vôi kỳ vĩ',
      'Tối · Tiệc Sunset Party tại quầy bar Sundeck, thưởng thức bữa tối kiểu Pháp thượng hạng',
      'Ngày 2 · Ngắm bình minh, lớp học làm nem cuốn Việt Nam, ghé Hang Sáng Tối trước khi về bến',
    ],
    description: 'Được mệnh danh là "Du thuyền Nhà hát trên biển", Le Théâtre Cruises tạo ấn tượng mạnh mẽ với lối kiến trúc tân cổ điển sang trọng lấy cảm hứng từ nhà hát Opera. Không gian mở ngập tràn nghệ thuật và ẩm thực xuất sắc giúp mỗi khoảnh khắc đều trở nên thi vị.',
    policies: [
      'Bao gồm toàn bộ bữa ăn, vé tham quan, nước suối trong phòng và bảo hiểm du lịch',
      'Phụ thu người thứ 3 hoặc trẻ em tính theo chính sách du thuyền',
    ],
    faqs: [
      { question: 'Phòng Panorama Suite có gì đặc biệt?', answer: 'Panorama Suite nằm ở mũi tàu với tầm nhìn 180 độ không góc chết hướng thẳng ra vịnh Lan Hạ.' },
    ],
    specifications: { launchedYear: 2020, cabinCount: 21, hullMaterial: 'Thép mạ kẽm cao cấp', route: 'Tuần Châu · Vịnh Lan Hạ · Vũng Ao Ếch · Hang Sáng Tối' },
  },
  {
    id: 'cruise-azalea',
    name: 'Du thuyền Azalea Cruise',
    operator: 'Azalea Cruise Group',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Tuần Châu / Bến Gót, Hải Phòng',
    duration_days: 2,
    price: 3150000,
    rating: 9.3,
    review_count: 120,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-bath-view.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-bath-view.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
      `${MEDIA_HALONG}/ambassador-jacuzzi-04.png`,
    ],
    features: [
      'Phong cách Boutique sang trọng',
      'Bồn tắm view kính toàn cảnh vịnh',
      'Thực đơn Halal & Vegetarian theo yêu cầu',
      'Chèo Kayak & tắm biển tự do',
      'Tiệc ngắm hoàng hôn với Cocktail',
    ],
    cabins: ['Deluxe Balcony Cabin', 'Premium Balcony Cabin', 'Azalea Exclusive Suite', 'Family Connecting Room'],
    itinerary: [
      'Ngày 1 · Lên tàu tại bến Tuần Châu, ăn trưa ngắm cảnh kỳ vĩ của hàng nghìn hòn đảo',
      'Chiều · Khám phá hang Sáng Tối bằng đò nan, chèo kayak tại Ba Trái Đào',
      'Tối · Trải nghiệm lớp học nấu ăn truyền thống, tiệc cocktail hoàng hôn và dạ tiệc hải sản',
      'Ngày 2 · Thể dục Tai Chi, khám phá hang Trung Trang và trở về bến trả phòng',
    ],
    description: 'Azalea Cruise là dòng du thuyền boutique cao cấp chú trọng vào sự riêng tư và trải nghiệm nghỉ dưỡng thư thái. Mỗi cabin đều được trang bị bồn tắm kính nhìn thẳng ra vịnh biển xanh ngọc, mang lại không gian thư giãn tuyệt đối.',
    policies: [
      'Miễn phí trà, cà phê và 2 chai nước khoáng mỗi ngày trong phòng',
      'Áp dụng phụ thu mùa cao điểm và các ngày lễ Tết theo quy định',
    ],
    faqs: [
      { question: 'Tàu có cung cấp đồ ăn cho khách đạo Hồi không?', answer: 'Có, Azalea Cruise cung cấp thực đơn Halal đạt chuẩn khi khách thông báo trước 24h.' },
    ],
    specifications: { launchedYear: 2018, cabinCount: 20, hullMaterial: 'Kim loại', route: 'Tuần Châu · Vịnh Lan Hạ · Hang Sáng Tối · Ba Trái Đào' },
  },
  {
    id: 'cruise-pelican-halong',
    name: 'Du thuyền Pelican Hạ Long Cruise',
    operator: 'Pelican Group',
    destination: 'Hạ Long',
    departure_port: 'Cảng Quốc tế Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 2650000,
    rating: 9.1,
    review_count: 215,
    ship_class: 4,
    image: `${MEDIA_HALONG}/ambassador-sunset-dinner.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-sunset-dinner.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-buffet.png`,
    ],
    features: [
      'Vỏ thép tiêu chuẩn an toàn cao',
      'Ban công riêng đón gió biển',
      'Thăm Hang Sửng Sốt & Đảo Ti Tốp',
      'Lớp tập dưỡng sinh Tai Chi buổi sáng',
      'Bữa tối BBQ hải sản tươi ngon',
    ],
    cabins: ['Deluxe Ocean View', 'Suite Balcony', 'Family Suite', 'Royal Suite'],
    itinerary: [
      'Ngày 1 · Xuất bến Tuần Châu, ăn trưa buffet và chiêm ngưỡng Vịnh Hạ Long',
      'Chiều · Khám phá Hang Sửng Sốt - hang động lớn nhất vịnh, leo núi Ti Tốp ngắm toàn cảnh',
      'Tối · Thưởng thức tiệc BBQ hải sản Hạ Long tươi sống, câu mực đêm cùng thủy thủ đoàn',
      'Ngày 2 · Tập Thái Cực Quyền trên boong, thăm trang trại nuôi cấy ngọc trai Tùng Sâu',
    ],
    description: 'Pelican Hạ Long Cruise là sự lựa chọn hoàn hảo cho du khách mong muốn trải nghiệm trọn vẹn vẻ đẹp di sản vịnh Hạ Long với mức giá vô cùng hợp lý. Đội ngũ thủy thủ dày dặn kinh nghiệm cùng các hoạt động tham quan biểu tượng mang lại chuyến đi đáng nhớ.',
    policies: [
      'Bao gồm vé thắng cảnh tuyến 2 Hạ Long, bữa ăn và hướng dẫn viên song ngữ',
      'Hủy phòng trước 5 ngày khởi hành không mất phí',
    ],
    faqs: [
      { question: 'Tàu có đón trả khách tại Hà Nội không?', answer: 'Có hỗ trợ xe Limousine đưa đón khứ hồi Hà Nội - Hạ Long (có phụ phí).' },
    ],
    specifications: { launchedYear: 2016, cabinCount: 22, hullMaterial: 'Vỏ thép đôi an toàn', route: 'Tuần Châu · Hang Sửng Sốt · Đảo Ti Tốp · Ngọc Trai Tùng Sâu' },
  },
  {
    id: 'cruise-paradise-elegance',
    name: 'Du thuyền Paradise Elegance Hạ Long',
    operator: 'Paradise Vietnam Group',
    destination: 'Hạ Long',
    departure_port: 'Cảng Quốc tế Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 4150000,
    rating: 9.7,
    review_count: 320,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-deck-event.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-deck-event.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
      `${MEDIA_HALONG}/ambassador-wine-cellar.png`,
    ],
    features: [
      'Du thuyền vỏ thép sang trọng bậc nhất Hạ Long',
      'Nhà hàng Le Marin phục vụ thực đơn Á-Âu thượng hạng',
      'Piano Bar biểu diễn nhạc sống',
      'Spa chuyên nghiệp phong cách Thái',
      'Ban công riêng biệt cho mọi hạng phòng',
    ],
    cabins: ['Deluxe Balcony', 'Executive Balcony', 'Elegance Balcony Suite', 'Captain Suite'],
    itinerary: [
      'Ngày 1 · Đón khách tại Paradise Lounge Tuần Châu, thưởng thức bữa trưa tự chọn cao cấp',
      'Chiều · Tham quan Hang Sửng Sốt, chèo kayak tại Hang Luồn và tắm biển đảo Ti Tốp',
      'Tối · Thưởng thức ẩm thực fine dining tại Le Marin, nghe nhạc sống tại Piano Bar',
      'Ngày 2 · Lớp Thái Cực Quyền đón bình minh, tham quan Động Thiên Cung và trở về bến',
    ],
    description: 'Paradise Elegance là tuyệt tác du thuyền 5 sao của tập đoàn Paradise Vietnam, nổi danh với dịch vụ đẳng cấp hoàng gia, không gian nhà hàng lộng lẫy và ban nhạc sống trình diễn mỗi tối. Đây là chuẩn mực của sự xa hoa giữa lòng vịnh kỳ quan.',
    policies: [
      'Trọn gói ẩm thực cao cấp, vé tham quan, trải nghiệm kayak và dịch vụ biểu diễn',
      'Nhận phòng tại sảnh chờ máy lạnh cao cấp riêng biệt tại Cảng Tuần Châu',
    ],
    faqs: [
      { question: 'Piano Bar hoạt động vào khung giờ nào?', answer: 'Piano Bar phục vụ nhạc sống từ 20:30 đến 22:30 mỗi tối trên du thuyền.' },
    ],
    specifications: { launchedYear: 2017, cabinCount: 31, hullMaterial: 'Thép cao cấp', route: 'Tuần Châu · Hang Sửng Sốt · Đảo Ti Tốp · Hang Luồn' },
  },
  {
    id: 'cruise-paradise-peak',
    name: 'Du thuyền Paradise Peak Hạ Long',
    operator: 'Paradise Vietnam Group',
    destination: 'Hạ Long',
    departure_port: 'Cảng Quốc tế Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 5850000,
    rating: 9.8,
    review_count: 110,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-suite-dining.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-suite-dining.png`,
      `${MEDIA_HALONG}/ambassador-suite-bath.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-wine-cellar.png`,
    ],
    features: [
      'Du thuyền siêu sang chuẩn Private Luxury (chỉ 8 cabin)',
      'Quản gia riêng (Butler Service) phục vụ 24/7',
      'Phòng xông hơi Sauna & Jacuzzi riêng trong phòng',
      'Bữa tối fine dining 5 món phục vụ tại ban công riêng',
      'Lịch trình thiết kế riêng linh hoạt',
    ],
    cabins: ['Junior Suite', 'Superior Suite', 'Premium Suite', 'Paradise Peak Suite'],
    itinerary: [
      'Ngày 1 · Dịch vụ đón tiếp VIP tại Paradise Lounge, quản gia nhận phòng và tư vấn lịch trình',
      'Chiều · Du ngoạn qua các vùng vịnh tĩnh lặng, chèo kayak hang Trinh Nữ, thư giãn sauna tại phòng',
      'Tối · Thưởng thức bữa tối 5 món do Bếp trưởng chuẩn bị riêng kèm rượu vang hảo hạng',
      'Ngày 2 · Bữa sáng phục vụ tại giường hoặc ban công riêng, khám phá hang động kỳ bí trước khi về cảng',
    ],
    description: 'Paradise Peak được xem là du thuyền đỉnh cao xa xỉ tại Vịnh Hạ Long với số lượng giới hạn chỉ 8 cabin siêu rộng. Tích hợp quản gia riêng, phòng gym, spa và bồn sục jacuzzi ngay trong từng phòng ngủ, đem lại sự riêng tư tối thượng cho giới thượng lưu.',
    policies: [
      'Toàn bộ dịch vụ quản gia, ẩm thực theo yêu cầu và đồ uống không cồn đều được bao gồm',
      'Yêu cầu đặt cọc trước để bảo đảm lịch khởi hành và giữ phòng riêng',
    ],
    faqs: [
      { question: 'Khách có thể yêu cầu bữa ăn phục vụ tại phòng không?', answer: 'Có, quản gia sẽ phục vụ bữa trưa và bữa tối ngay tại ban công riêng tư của phòng bạn.' },
    ],
    specifications: { launchedYear: 2016, cabinCount: 8, hullMaterial: 'Gỗ quý bọc thép cao cấp', route: 'Tuần Châu · Hang Trinh Nữ · Hồ Động Tiên · Tuyến đảo riêng tư' },
  },
  {
    id: 'cruise-aspira',
    name: 'Du thuyền Aspira Cruises',
    operator: 'Aspira Cruise Hospitality',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Tuần Châu / Bến Gót, Hải Phòng',
    duration_days: 2,
    price: 3250000,
    rating: 9.4,
    review_count: 145,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-jacuzzi-01.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-jacuzzi-01.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
    ],
    features: [
      'Thiết kế hiện đại phong cách hoàng gia',
      'Hồ bơi vô cực dát vàng trên Sundeck',
      'Phòng Gym & Spa hướng biển',
      'Trang thiết bị nội thất nhập khẩu châu Âu',
      'Bữa tối nướng BBQ hải sản Hạ Long',
    ],
    cabins: ['Junior Suite Balcony', 'Senior Suite Balcony', 'Executive Suite Private Terrace', 'President Suite'],
    itinerary: [
      'Ngày 1 · Lên tàu tại bến Tuần Châu, ăn trưa ngắm cảnh thiên nhiên vịnh Lan Hạ',
      'Chiều · Trải nghiệm chèo kayak tại khu vực Trà Báu hoặc bơi lội giữa làn nước xanh biếc',
      'Tối · Tiệc Sunset Party trên Sundeck, thưởng thức tiệc BBQ hải sản và câu mực đêm',
      'Ngày 2 · Khám phá Hang Sáng Tối bằng thuyền đò chèo tay người dân địa phương và trở về bến',
    ],
    description: 'Aspira Cruises sở hữu phong cách thiết kế đương đại trẻ trung và lãng mạn. Điểm nhấn nổi bật của du thuyền là bể bơi vô cực trên tầng thượng nhìn ngắm toàn cảnh non nước Lan Hạ cùng hệ thống phòng suite ban công tràn ngập ánh nắng.',
    policies: [
      'Bao gồm phòng nghỉ, 4 bữa ăn tiêu chuẩn, vé thắng cảnh, chèo thuyền kayak',
      'Trẻ em dưới 4 tuổi miễn phí đi cùng bố mẹ',
    ],
    faqs: [
      { question: 'Bể bơi trên Sundeck mở cửa lúc nào?', answer: 'Bể bơi mở cửa tự do phục vụ du khách từ 06:00 đến 22:00 hàng ngày.' },
    ],
    specifications: { launchedYear: 2020, cabinCount: 22, hullMaterial: 'Vỏ thép hiện đại', route: 'Tuần Châu · Vịnh Lan Hạ · Trà Báu · Hang Sáng Tối' },
  },
  {
    id: 'cruise-la-pandora',
    name: 'Du thuyền La Pandora Cruise',
    operator: 'La Pandora Cruises',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 2850000,
    rating: 9.2,
    review_count: 160,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-cave-dinner.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-cave-dinner.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
    ],
    features: [
      'Du thuyền 5 sao giá tốt nhất phân khúc',
      'Phòng nghỉ ốp gỗ cao cấp ấm cúng',
      'Ban công riêng ngắm vịnh toàn cảnh',
      'Chèo kayak tại khu vực Ao Ếch',
      'Câu mực đêm và tiệc Cocktail ngắm hoàng hôn',
    ],
    cabins: ['Deluxe Balcony', 'Executive Balcony', 'La Pandora Suite', 'Family Connecting Cabin'],
    itinerary: [
      'Ngày 1 · Khởi hành từ Cảng Tuần Châu, ăn trưa với thực đơn hải sản tươi ngon',
      'Chiều · Khám phá vụng Ao Ếch yên bình, chèo thuyền kayak và thỏa sức bơi lội',
      'Tối · Thưởng thức tiệc nướng BBQ, giao lưu âm nhạc và thử tài câu mực đêm',
      'Ngày 2 · Lớp tập dưỡng sinh buổi sáng, thăm Hang Sáng Tối trước khi làm thủ tục trả phòng',
    ],
    description: 'La Pandora Cruise là lựa chọn 5 sao được yêu thích hàng đầu nhờ dịch vụ tận tâm, giá cả hợp lý và các phòng nghỉ rộng rãi ốp gỗ tự nhiên sang trọng. Không gian ấm cúng rất thích hợp cho kỳ nghỉ của gia đình và cặp đôi.',
    policies: [
      'Bao gồm đầy đủ bữa ăn theo chương trình, kayak, vé tham quan và hướng dẫn viên',
      'Đổi ngày khởi hành miễn phí trước 5 ngày',
    ],
    faqs: [
      { question: 'Du thuyền có đón khách tại các khách sạn ở Bãi Cháy không?', answer: 'Có, xe buýt đưa đón có thể đón khách tại các khách sạn khu vực trung tâm Bãi Cháy.' },
    ],
    specifications: { launchedYear: 2019, cabinCount: 24, hullMaterial: 'Thép mạ kẽm', route: 'Tuần Châu · Vịnh Lan Hạ · Vũng Ao Ếch · Hang Sáng Tối' },
  },
  {
    id: 'cruise-orchid-premium',
    name: 'Du thuyền Orchid Premium Cruises Hạ Long',
    operator: 'Orchid Cruises (Pelican Group)',
    destination: 'Lan Hạ',
    departure_port: 'Cảng Quốc tế Tuần Châu, Hạ Long',
    duration_days: 2,
    price: 4650000,
    rating: 9.7,
    review_count: 175,
    ship_class: 5,
    image: `${MEDIA_HALONG}/ambassador-suite-bath.png`,
    gallery_images: [
      `${MEDIA_HALONG}/ambassador-suite-bath.png`,
      `${MEDIA_HALONG}/ambassador-suite.png`,
      `${MEDIA_HALONG}/ambassador-front.png`,
      `${MEDIA_HALONG}/ambassador-jacuzzi-01.png`,
      `${MEDIA_HALONG}/ambassador-restaurant.png`,
    ],
    features: [
      'Cảm hứng hoa lan Đông Dương quý phái',
      'Chỉ 5 phòng VIP bồn tắm view kính vô cực',
      'Đầu bếp riêng chuẩn Michelin phục vụ tôm hùm',
      'Hải trình biệt lập không đông đúc',
      'Chèo kayak vịnh Lan Hạ & Ba Trái Đào',
    ],
    cabins: ['Premium Suite Balcony', 'Exclusive Orchid Suite', 'Master Orchid Suite'],
    itinerary: [
      'Ngày 1 · Đón khách tại nhà chờ riêng Tuần Châu, dùng bữa trưa thịnh soạn ngắm cảnh vịnh',
      'Chiều · Chèo thuyền kayak khám phá Ba Trái Đào, tắm biển và thư giãn bồn tắm hoa hồng',
      'Tối · Thưởng thức tiệc tối fine dining với tôm hùm và rượu vang, ngắm sao trên boong tàu',
      'Ngày 2 · Lớp Thái Cực Quyền sáng sớm, tham quan Hang Sáng Tối và trở về bến Tuần Châu',
    ],
    description: 'Orchid Premium Cruises là siêu du thuyền nghỉ dưỡng riêng tư bậc nhất chỉ với 5 phòng suite thượng hạng. Lấy cảm hứng từ nét quyến rũ của loài hoa lan Đông Dương, du thuyền mang đến dịch vụ tinh tế, ẩm thực cao cấp và hải trình biệt lập thoát khỏi đám đông xô bồ.',
    policies: [
      'Bao gồm trọn gói thực đơn cao cấp (có tôm hùm), rượu vang chào mừng, vé tham quan và hoạt động trải nghiệm',
      'Phòng nghỉ trang bị bồn tắm ngâm thảo mộc view biển',
    ],
    faqs: [
      { question: 'Orchid Premium có bao nhiêu phòng nghỉ?', answer: 'Du thuyền chỉ có đúng 5 phòng Suite cao cấp, mang lại không gian yên tĩnh và riêng tư tối đa.' },
    ],
    specifications: { launchedYear: 2021, cabinCount: 5, hullMaterial: 'Thép cao cấp đóng mới', route: 'Tuần Châu · Vịnh Lan Hạ · Ba Trái Đào · Hang Sáng Tối' },
  },
];

const cruiseFixtures = cruiseRawFixtures.map((cruise) => ({
  ...cruise,
  gallery_images: toJson(cruise.gallery_images),
  features: toJson(cruise.features),
  cabins: toJson(cruise.cabins),
  itinerary: toJson(cruise.itinerary),
  policies: toJson(cruise.policies),
  faqs: toJson(cruise.faqs),
  specifications: toJson(cruise.specifications),
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
  const departureDates = getAmbassadorDepartureDates({ count: 10, intervalDays: 4 });

  for (const cruise of cruiseFixtures) {
    await prisma.cruise.upsert({ where: { id: cruise.id }, update: cruise, create: cruise });

    const cabins = JSON.parse(cruise.cabins || '[]');
    const inventory = JSON.stringify(
      cabins.map((cabinName, idx) => ({
        cabin_name: cabinName,
        total_units: idx === 0 ? 12 : 6,
        price_override: idx === 0 ? cruise.price : cruise.price + idx * 450000,
      }))
    );

    for (const departureDate of departureDates) {
      const departureData = {
        cruise_id: cruise.id,
        departure_date: departureDate,
        departure_time: '11:30',
        status: 'open',
        inventory,
        notes: `Lịch khởi hành định kỳ của ${cruise.name}`,
      };
      await prisma.cruiseDeparture.upsert({
        where: { cruise_id_departure_date: { cruise_id: cruise.id, departure_date: departureDate } },
        update: departureData,
        create: departureData,
      });
    }
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
