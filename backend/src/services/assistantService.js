import { ENV } from '../config/env.js';
import { searchHotels } from './hotelService.js';
import { listActivePackages } from './packageService.js';
import { listCruises } from './cruiseService.js';
import { AIRPORTS, FLIGHTS } from '../../../frontend/src/data/travelCatalog.js';

const BLOG_POSTS = [
  {
    id: 1,
    category: 'Du thuyền',
    title: 'Chọn hành trình 2 ngày 1 đêm hay 3 ngày 2 đêm?',
    summary: 'So sánh thời lượng nghỉ, điểm tham quan và nhịp trải nghiệm phù hợp cho từng nhóm khách.',
    date: '08/08/2026',
    advice: 'Hành trình 2 ngày 1 đêm phù hợp với cuối tuần và nhóm muốn tập trung điểm nổi bật. Hành trình 3 ngày 2 đêm nghỉ sâu hơn, khám phá trọn vẹn các vịnh Hạ Long - Lan Hạ.',
  },
  {
    id: 2,
    category: 'Du lịch',
    title: 'Chuẩn bị gì cho chuyến đi Hạ Long đầu tiên',
    summary: 'Giấy tờ, hành lý, giờ có mặt tại cảng và những lưu ý trước khi lên tàu.',
    date: '02/08/2026',
    advice: 'Nên mang CCCD/Hộ chiếu, trang phục nhẹ và có mặt tại cảng trước giờ xuất bến 30-45 phút. Thông báo trước nếu có nhu cầu ăn chay/ăn kiêng.',
  },
  {
    id: 3,
    category: 'Khách sạn',
    title: 'Kết hợp du thuyền và nghỉ dưỡng ven biển',
    summary: 'Sắp xếp khách sạn trước hoặc sau hành trình để chuyến đi bớt gấp.',
    date: '25/07/2026',
    advice: 'Nghỉ 1 đêm khách sạn gần bến cảng trước ngày lên tàu giúp chuyến đi chủ động, tránh rủi ro trễ giờ bay.',
  },
  {
    id: 4,
    category: 'Vé máy bay',
    title: 'Chọn giờ bay phù hợp với giờ lên du thuyền',
    summary: 'Tính khoảng đệm giữa giờ hạ cánh và thời gian tập trung tại cảng.',
    date: '18/07/2026',
    advice: 'Nên chọn chuyến bay hạ cánh trước giờ tập trung tại cảng ít nhất 3.5 - 4 tiếng để tính thời gian lấy hành lý và di chuyển đường bộ.',
  },
  {
    id: 5,
    category: 'Du lịch',
    title: 'Lịch trình dành cho gia đình có trẻ nhỏ',
    summary: 'Chọn cabin, hoạt động và thời gian nghỉ phù hợp với nhịp sinh hoạt của trẻ.',
    date: '12/07/2026',
    advice: 'Ưu tiên chọn cabin gia đình hoặc cabin thông nhau, chọn du thuyền có bể bơi hoặc khu vui chơi riêng cho trẻ.',
  },
];

const CITY_ALIASES = {
  'da nang': 'Đà Nẵng',
  danang: 'Đà Nẵng',
  'da lat': 'Đà Lạt',
  dalat: 'Đà Lạt',
  'phu quoc': 'Phú Quốc',
  phuquoc: 'Phú Quốc',
  'ha noi': 'Hà Nội',
  hanoi: 'Hà Nội',
  'ha long': 'Hạ Long',
  halong: 'Hạ Long',
  'lan ha': 'Lan Hạ',
  lanha: 'Lan Hạ',
  'sai gon': 'TP. Hồ Chí Minh',
  'tp hcm': 'TP. Hồ Chí Minh',
  hcm: 'TP. Hồ Chí Minh',
  nhatrang: 'Nha Trang',
  'nha trang': 'Nha Trang',
  'can tho': 'Cần Thơ',
  cantho: 'Cần Thơ',
  'quy nhon': 'Quy Nhơn',
  quynhon: 'Quy Nhơn',
  'vung tau': 'Vũng Tàu',
  vungtau: 'Vũng Tàu',
  hue: 'Huế',
  'con dao': 'Côn Đảo',
  condao: 'Côn Đảo',
  mekong: 'Mekong',
};

const INTENT_RULES = [
  { key: 'cruise', patterns: ['du thuyen', 'cruise', 'tau', 'hai trinh', 'lan ha', 'ha long', 'vinh', 'cabin', 'khoi hanh', 'cang'], label: 'du thuyền' },
  { key: 'flight', patterns: ['ve may bay', 'may bay', 'sang bay', 've bay', 'flight', 'hang bay', 'vietnam airlines', 'vietjet', 'bamboo', 'vietravel', 'chuyen bay', 'san bay', 'gio bay'], label: 'vé máy bay' },
  { key: 'hotel', patterns: ['khach san', 'resort', 'villa', 'cho nghi', 'hotel', 'nghi duong', 'luu tru'], label: 'khách sạn & resort' },
  { key: 'room', patterns: ['phong', 'gia phong', 'loai phong', 'phong don', 'phong doi', 'suite', 'deluxe', 'dien tich', 'view', 'giuong'], label: 'phòng & loại phòng' },
  { key: 'beach', patterns: ['bien', 'beach', 'dao', 'ocean', 'tam bien', 'gan bien'], label: 'gần biển' },
  { key: 'family', patterns: ['gia dinh', 'tre em', 'nhom', 'family', 'bo me', 'con nho', 'con truyen', 'tre nho', 'con cai'], label: 'gia đình' },
  { key: 'couple', patterns: ['cap doi', 'hai nguoi', '2 nguoi', 'vo chồng', 'lang man', 'honeymoon', 'trang mật', 'hen ho'], label: 'cặp đôi / lãng mạn' },
  { key: 'package', patterns: ['goi nghi', 'goi du lich', 'combo', 'tron goi', 'staycation', 'uu dai'], label: 'gói combo trọn gói' },
  { key: 'booking', patterns: ['thanh toan', 'vietqr', 'vnpay', 'momo', 'qr', 'dat phong', 'huy phong', 'don cua toi', 'tich diem', 'xu', 'dat cho', 'giu cho'], label: 'thủ tục & thanh toán' },
  { key: 'corporate', patterns: ['doanh nghiep', 'cong ty', 'doan', 'mice', 'team building', 'hoi thao'], label: 'du lịch doanh nghiệp' },
  { key: 'contact', patterns: ['hotline', 'lien he', 'so dien thoai', 'tong dai', 'dia chi', 'ho tro'], label: 'liên hệ & hỗ trợ' },
  { key: 'compare', patterns: ['so sanh', 'khac nhau', 'nao tot hon', 'chon gi', 'hay la', 'nen chon', 'uu diem', 'khuyen nghi'], label: 'so sánh' },
  { key: 'policy', patterns: ['chinh sach', 'quy dinh', 'huy don', 'huy phong', 'huy dat', 'hoan tien', 'dieu kien', 'luu y'], label: 'chính sách' },
  { key: 'airport', patterns: ['san bay', 'airport', 'noi bai', 'tan son nhat', 'da nang airport', 'cam ranh'], label: 'sân bay' },
  { key: 'feature', patterns: ['tien ich', 'dich vu', 'spa', 'be boi', 'kayak', 'gym', 'wifi', 'bua an', 'buffet', 'nau an', 'ban cong', 'view bien', 'an sang'], label: 'tiện ích & dịch vụ' },
  { key: 'price', patterns: ['gia', 're nhat', 'dat nhat', 'bao nhieu', 'chi phi', 'ngan sach', 'budget', 'tong tien', 'tiet kiem'], label: 'giá cả' },
  { key: 'itinerary', patterns: ['lich trinh', 'choi gi', 'di dau', 'may ngay', 'goi y', 'giao luu', 'trai nghiem'], label: 'lịch trình du lịch' },
];

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN').format(value || 0);
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function extractBudget(message) {
  const normalized = normalize(message);
  const millionMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:trieu|tr\b)/);
  if (millionMatch) return Math.round(Number(millionMatch[1].replace(',', '.')) * 1_000_000);
  const currencyMatch = normalized.match(/(\d[\d.,]{4,})\s*(?:vnd|dong|đ)/);
  if (!currencyMatch) return null;
  return Number(currencyMatch[1].replace(/[.,]/g, '')) || null;
}

/* ────────────────────── MULTI-TURN CONTEXT AGGREGATION ────────────────────── */

function extractTripProfile(message, history = []) {
  // Combine historical messages + current message to retain context across multi-turn chat
  const historyText = history.map((item) => normalize(item.content)).join(' ');
  const currentNormalized = normalize(message);
  const combinedText = `${historyText} ${currentNormalized}`;

  const city = Object.entries(CITY_ALIASES).find(([alias]) => combinedText.includes(alias))?.[1] || null;
  const budget = extractBudget(message) || extractBudget(historyText);

  const intents = INTENT_RULES
    .filter((rule) => includesAny(currentNormalized, rule.patterns))
    .map((rule) => rule.key);

  const nightsMatch = combinedText.match(/(\d+)\s*(?:dem|ngay)/);
  const guestsMatch = combinedText.match(/(\d+)\s*(?:nguoi|khach|ban|nguoi lon)/);

  return {
    normalized: currentNormalized,
    combinedText,
    city,
    budget,
    intents: [...new Set(intents)],
    nights: nightsMatch ? Number(nightsMatch[1]) : null,
    guests: guestsMatch ? Number(guestsMatch[1]) : null,
    isFamily: includesAny(combinedText, ['gia dinh', 'tre em', 'con nho', 'bo me']),
    isCouple: includesAny(combinedText, ['cap doi', '2 nguoi', 'vo chong', 'honeymoon']),
    isLuxury: includesAny(combinedText, ['cao cap', '5 sao', 'sang trong', 'luxury']),
  };
}

/* ────────────────────── SMART RANKING ALGORITHMS ────────────────────── */

function rankHotels(hotels, message, profile) {
  const scoredHotels = hotels
    .map((hotel) => {
      let score = 0;
      if (profile.city && hotel.city === profile.city) score += 16;
      if (profile.guests && hotel.room_preview?.some((r) => r.max_occupancy >= profile.guests)) score += 6;
      if (profile.budget && hotel.min_price && hotel.min_price <= profile.budget) score += 8;
      if (profile.isFamily && (hotel.stay_types?.includes('family') || hotel.highlights?.some((h) => normalize(h).includes('gia dinh')))) score += 6;
      if (profile.isCouple && (hotel.stay_types?.includes('boutique') || hotel.stay_types?.includes('villa'))) score += 4;
      if (profile.isLuxury && hotel.star_rating === 5) score += 6;
      if (hotel.avg_rating) score += hotel.avg_rating / 10;

      return { hotel, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score || (a.hotel.min_price || Infinity) - (b.hotel.min_price || Infinity));

  return scoredHotels.slice(0, 3).map(({ hotel, score }) => ({
    id: hotel.id,
    name: hotel.name,
    city: hotel.city,
    min_price: hotel.min_price,
    cover_image: hotel.cover_image,
    star_rating: hotel.star_rating,
    avg_rating: hotel.avg_rating,
    score,
  }));
}

function rankCruises(cruises, profile) {
  const scored = cruises
    .map((cruise) => {
      let score = 0;
      if (profile.city && (cruise.destination.includes(profile.city) || profile.city.includes(cruise.destination))) score += 14;
      if (profile.budget && cruise.price <= profile.budget) score += 10;
      if (profile.nights && cruise.durationDays === profile.nights) score += 6;
      if (profile.isFamily && cruise.features?.some((f) => normalize(f).includes('gia dinh') || normalize(f).includes('tre em') || normalize(f).includes('be boi'))) score += 6;
      if (cruise.rating) score += cruise.rating;
      return { cruise, score };
    })
    .sort((a, b) => b.score - a.score || a.cruise.price - b.cruise.price);

  return scored.slice(0, 3).map(({ cruise, score }) => ({
    id: cruise.id,
    name: cruise.name,
    operator: cruise.operator,
    destination: cruise.destination,
    departurePort: cruise.departurePort,
    durationDays: cruise.durationDays,
    price: cruise.price,
    rating: cruise.rating,
    features: cruise.features,
    score,
  }));
}

function rankPackages(packages, profile) {
  return packages
    .filter((item) => !profile.budget || item.price <= profile.budget)
    .slice(0, 2)
    .map((item) => ({
      id: item.id,
      title: item.title,
      destination: item.destination,
      duration: item.duration,
      price: item.price,
      included: item.included,
    }));
}

function rankFlights(message, profile) {
  const text = profile.combinedText;

  return FLIGHTS.filter((flight) => {
    if (profile.budget && flight.price > profile.budget) return false;
    const originMatch = text.includes(flight.origin.toLowerCase()) ||
      AIRPORTS.find((a) => a.code === flight.origin && normalize(a.city).split(' ').some((w) => w.length > 2 && text.includes(w)));
    const destMatch = text.includes(flight.destination.toLowerCase()) ||
      AIRPORTS.find((a) => a.code === flight.destination && normalize(a.city).split(' ').some((w) => w.length > 2 && text.includes(w)));
    if (originMatch && destMatch) return true;
    if (originMatch || destMatch) return true;
    return true;
  }).slice(0, 5);
}

function rankArticles(message) {
  const text = normalize(message);
  return BLOG_POSTS.filter((post) => {
    const postText = normalize(`${post.title} ${post.summary} ${post.category}`);
    return text.split(' ').some((word) => word.length > 3 && postText.includes(word));
  }).slice(0, 2);
}

/* ────────────────────── ENHANCED LOCAL ANSWER ────────────────────── */

function buildLocalAnswer(message, profile, matches, packageMatches, cruiseMatches, flightMatches, articleMatches, hotels, cruises) {
  if (/(^|\s)(xin chao|chao|hello|hi)(\s|$)/.test(profile.normalized)) {
    return '👋 Chào bạn, mình là Vi - chuyên viên tư vấn du lịch thông minh của Dibaoxa!\n\nMình có thể giúp bạn thiết kế chuyến đi hoàn hảo: tìm **Du thuyền 5 sao Hạ Long/Lan Hạ**, săn **Vé máy bay giá tốt**, chọn **Khách sạn & Resort**, gợi ý **Gói combo trọn gói**, hay hỗ trợ quy trình **Thanh toán VietQR**. Bạn muốn khám phá điểm đến nào hôm nay?';
  }

  if (profile.intents.includes('contact')) {
    return '📞 **Thông tin CSKH Dibaoxa:**\n- **Hotline tư vấn (8:00 - 21:00):** 1900 8899\n- **Hỗ trợ trực tuyến:** Bấm nút "Liên hệ" trên thanh menu website.\n- **Email:** cskh@dibaoxa.vn\n\nĐội ngũ chuyên viên sẵn sàng hỗ trợ bạn lựa chọn dịch vụ và xử lý đơn đặt 24/7!';
  }

  if (profile.intents.includes('corporate')) {
    return '🏢 **Giải pháp Du lịch Doanh nghiệp MICE & Team Building Dibaoxa:**\n- Thiết kế chương trình trọn gói bao gồm Du thuyền, Khách sạn 5 sao, Vé máy bay đoàn.\n- Hỗ trợ tổ chức Hội thảo, Gala Dinner, và hoạt động Teambuilding cho đoàn từ 10 đến hơn 200 khách.\n- Chiết khấu hấp dẫn và xuất hóa đơn VAT đầy đủ.\n\n👉 Hãy chuyển sang tab **"Doanh nghiệp"** để gửi thông tin đoàn và nhận báo giá ưu đãi trong 30 phút!';
  }

  if (profile.intents.includes('booking')) {
    return '💳 **Quy trình Đặt chỗ & Thanh toán VietQR trên Dibaoxa:**\n1. **Chọn dịch vụ:** Lựa chọn phòng khách sạn, vé máy bay hoặc hải trình du thuyền.\n2. **Giữ chỗ 10 phút:** Hệ thống khóa chỗ giữ giá cho bạn.\n3. **Thanh toán tức thì:** Quét mã **VietQR** hoặc qua **VNPay**.\n4. **Nhận vé & Check-in:** Mã đặt chỗ kèm **QR Check-in tự động** sẽ hiển thị trong mục **"Đơn của tôi"**.\n🎁 *Đặc biệt:* Bạn sẽ nhận được điểm thưởng **Xu thành viên** (1 Xu = 10.000đ) ngay sau khi đơn được xác nhận!';
  }

  if (profile.intents.includes('airport')) {
    const text = profile.normalized;
    const regionKeywords = { 'mien bac': 'Miền Bắc', 'mien trung': 'Miền Trung', 'mien nam': 'Miền Nam', 'tay nguyen': 'Tây Nguyên' };
    const matchedRegion = Object.entries(regionKeywords).find(([alias]) => text.includes(alias));
    if (matchedRegion) {
      const regionAirports = AIRPORTS.filter((a) => a.region === matchedRegion[1]);
      const list = regionAirports.map((a) => `• **${a.code}** - ${a.name} (${a.city})`).join('\n');
      return `✈️ **Danh sách Cảng hàng không khu vực ${matchedRegion[1]}:**\n\n${list}\n\nBạn muốn tìm đường bay từ/đến sân bay nào?`;
    }
    return `✈️ Dibaoxa kết nối **${AIRPORTS.length} cảng hàng không toàn quốc**. Bạn có thể tra cứu theo khu vực (Miền Bắc, Miền Trung, Miền Nam, Tây Nguyên) hoặc theo mã sân bay (Nội Bài HAN, Tân Sơn Nhất SGN, Đà Nẵng DAD...).`;
  }

  // Feature-based search (e.g. "du thuyền nào có spa?")
  if (profile.intents.includes('feature')) {
    const text = profile.normalized;
    const featureSynonyms = [
      { key: 'Spa & Bể sục', patterns: ['spa', 'jacuzzi', 'be suc', 'massage'] },
      { key: 'Bể bơi', patterns: ['be boi', 'pool', 'jacuzzi'] },
      { key: 'Chèo Kayak', patterns: ['kayak', 'cheo thuyen', 'cheo kayak'] },
      { key: 'Nhà hàng & Bữa ăn', patterns: ['bua an', 'buffet', 'nha hang', 'thuc don'] },
      { key: 'Ban công riêng', patterns: ['ban cong', 'balcony'] },
    ];
    const matchedFeature = featureSynonyms.find((item) => item.patterns.some((p) => text.includes(p)));
    if (matchedFeature && cruises?.length) {
      const matching = cruises.filter((c) =>
        c.features?.some((f) => matchedFeature.patterns.some((p) => normalize(f).includes(p)))
      );
      if (matching.length) {
        const list = matching.map((c) => `• **${c.name}** (${c.destination}) - Giá từ **${formatPrice(c.price)}đ/khách**`).join('\n');
        return `⚓ **Các du thuyền trang bị ${matchedFeature.key}:**\n\n${list}\n\n👉 Chọn thẻ sản phẩm bên dưới hoặc tab **"Du thuyền"** để xem hải trình chi tiết!`;
      }
    }
  }

  if (profile.intents.includes('policy')) {
    const relevantCruise = cruises?.find((c) => profile.normalized.includes(normalize(c.name)) || profile.normalized.includes(normalize(c.destination)));
    if (relevantCruise?.policies?.length) {
      const policiesList = relevantCruise.policies.slice(0, 3).map((p) => `• ${p}`).join('\n');
      return `📋 **Chính sách du thuyền "${relevantCruise.name}":**\n\n${policiesList}\n\nXem chi tiết tại trang sản phẩm hoặc liên hệ 1900 8899.`;
    }
    return '📋 **Chính sách đặt & hủy phòng:**\n- Hầu hết sản phẩm giữ chỗ miễn phí 10 phút trước thanh toán.\n- Điều kiện đổi/hủy chi tiết tùy thuộc vào từng khách sạn, du thuyền hoặc hạng vé máy bay.\n- Kiểm tra cụ thể tại phần **"Chính sách"** trên trang sản phẩm.';
  }

  if (profile.intents.includes('compare') && cruiseMatches.length >= 2) {
    const [a, b] = cruiseMatches;
    return `⚖️ **So sánh du thuyền nổi bật:**\n\n1. **${a.name}** (${a.destination})\n   - Thời lượng: ${a.durationDays} ngày\n   - Giá: từ **${formatPrice(a.price)}đ/khách**\n   - Đánh giá: ⭐ ${a.rating}/10\n\n2. **${b.name}** (${b.destination})\n   - Thời lượng: ${b.durationDays} ngày\n   - Giá: từ **${formatPrice(b.price)}đ/khách**\n   - Đánh giá: ⭐ ${b.rating}/10\n\n👉 Bạn ưa thích hải trình ngắn gọn 2N1Đ hay muốn trải nghiệm nghỉ sâu hơn?`;
  }

  if (profile.intents.includes('flight')) {
    if (flightMatches.length) {
      const flightList = flightMatches.slice(0, 3).map((f) =>
        `• **${f.code}** (${f.airline}): ${f.origin} → ${f.destination} | ${f.depart} - ${f.arrive} | Giá từ **${formatPrice(f.price)}đ** (${f.baggage})`
      ).join('\n');
      return `✈️ **Các chuyến bay phù hợp dành cho bạn:**\n\n${flightList}\n\n👉 Chọn tab **"Vé máy bay"** để xem thêm tùy chọn giờ bay và hạng vé!`;
    }
    return '✈️ Dibaoxa kết nối dữ liệu bay trực tiếp từ **Vietnam Airlines, Vietjet Air, Bamboo Airways, Vietravel Airlines**. Chuyển sang tab **"Vé máy bay"** để tìm đường bay của bạn nhé!';
  }

  if (profile.intents.includes('hotel') || profile.intents.includes('room')) {
    if (matches.length) {
      const hotelList = matches.map((h) =>
        `• **${h.name}** (${h.city}): Giá từ **${formatPrice(h.min_price)}đ/đêm** | ⭐ ${h.avg_rating || h.star_rating}/5`
      ).join('\n');
      const familyNote = profile.isFamily ? '\n💡 *Các chỗ nghỉ trên đều có phòng rộng rãi cho gia đình và trẻ nhỏ.*' : '';
      return `🏨 **Gợi ý chỗ nghỉ hàng đầu tại ${profile.city || 'điểm đến'}:**\n\n${hotelList}${familyNote}\n\n👉 Bấm vào các thẻ bên dưới để xem danh sách phòng chi tiết!`;
    }
    return '🏨 Dibaoxa có hàng trăm khách sạn & resort 4-5 sao tuyển chọn tại Đà Nẵng, Phú Quốc, Hạ Long, Nha Trang, Đà Lạt... Bạn hãy chọn tab **"Khách sạn"** để tìm chỗ nghỉ ưng ý!';
  }

  if (profile.intents.includes('package')) {
    if (packageMatches.length) {
      const pkg = packageMatches[0];
      const includedText = pkg.included?.length ? `\n🎁 *Bao gồm:* ${pkg.included.join(', ')}.` : '';
      return `🎁 **Gói ưu đãi trọn gói HOT nhất:**\n\n**${pkg.title}** (${pkg.destination} - ${pkg.duration})\nGiá trọn gói: **${formatPrice(pkg.price)}đ**${includedText}\n\nXem chi tiết tại mục **"Gói ưu đãi"**!`;
    }
    return '🎁 Dibaoxa có nhiều gói combo ưu đãi trọn gói bao gồm chỗ nghỉ, bữa ăn và dịch vụ đi kèm. Hãy chuyển sang tab **"Gói ưu đãi"** để khám phá nhé!';
  }

  if (profile.intents.includes('cruise') || (profile.city && ['Hạ Long', 'Lan Hạ'].includes(profile.city))) {
    if (cruiseMatches.length) {
      const top = cruiseMatches[0];
      const featuresText = top.features?.length ? `\n✨ *Tiện ích nổi bật:* ${top.features.slice(0, 4).join(' • ')}` : '';
      return `⚓ **Gợi ý hải trình du thuyền đẳng cấp:**\n\n**${top.name}** (${top.operator})\n• Hải trình: ${top.destination} (${top.durationDays} ngày)\n• Cảng khởi hành: ${top.departurePort || 'Cảng Tuần Châu/Cát Hải'}\n• Giá ưu đãi: **${formatPrice(top.price)}đ/khách** (⭐ ${top.rating}/10)${featuresText}\n\n👉 Bấm tab **"Du thuyền"** để xem chi tiết!`;
    }
  }

  if (matches.length && profile.city) {
    const [first, second] = matches;
    const firstPrice = first.min_price ? ` từ **${formatPrice(first.min_price)}đ/đêm**` : '';
    const secondText = second ? `\n• **${second.name}** tại ${second.city}` : '';
    return `🏨 **Dành cho chuyến đi ${profile.city}:**\n• **${first.name}**${firstPrice}${secondText}\n\nBấm thẻ bên dưới để xem phòng trống!`;
  }

  if (articleMatches.length) {
    const article = articleMatches[0];
    return `💡 **Góc kinh nghiệm du lịch Dibaoxa:**\n\n*"${article.title}"*\n👉 ${article.advice}\n\nBạn có thể đọc thêm các bài viết hay tại mục **Blog**!`;
  }

  return '🌟 Mình luôn sẵn sàng tư vấn tất cả dịch vụ trên Dibaoxa:\n• ⚓ **Du thuyền** Hạ Long & Lan Hạ 4-5 sao\n• ✈️ **Vé máy bay** nội địa giá rẻ\n• 🏨 **Khách sạn & Resort** nghỉ dưỡng\n• 🎁 **Gói combo** trọn gói tiết kiệm\n\nBạn hãy cho mình biết điểm đến hoặc ngân sách dự kiến nhé!';
}

/* ────────────────────── DYNAMIC SUGGESTIONS ────────────────────── */

function buildDynamicSuggestions(profile, cruiseMatches, flightMatches, matches) {
  const suggestions = [];

  if (profile.intents.includes('cruise') || cruiseMatches.length) {
    suggestions.push('Du thuyền nào có spa?', 'So sánh du thuyền Hạ Long vs Lan Hạ', 'Chính sách hủy du thuyền');
  } else if (profile.intents.includes('flight') || flightMatches.length) {
    suggestions.push('Bay SGN đi DAD giá rẻ nhất?', 'Sân bay nào ở miền Trung?', 'Hãng nào được hoàn vé?');
  } else if (profile.intents.includes('hotel') || profile.intents.includes('room') || matches.length) {
    suggestions.push('Phòng nào rộng nhất cho gia đình?', 'Khách sạn gần biển có bể bơi', 'Resort 5 sao giá tốt');
  } else if (profile.intents.includes('package')) {
    suggestions.push('Gói combo dưới 5 triệu?', 'Combo du thuyền + khách sạn', 'Gói ưu đãi Phú Quốc');
  }

  const defaults = [
    'Du thuyền Hạ Long 2 ngày 1 đêm',
    'Vé máy bay Hà Nội đi Đà Nẵng',
    'Hướng dẫn thanh toán VietQR',
    'Tư vấn du thuyền cho gia đình',
  ];
  for (const item of defaults) {
    if (suggestions.length >= 4) break;
    if (!suggestions.includes(item)) suggestions.push(item);
  }

  return suggestions.slice(0, 4);
}

/* ────────────────────── COMPREHENSIVE DATA CONTEXT ────────────────────── */

function buildComprehensiveInventoryContext(hotels, packages, cruises) {
  return JSON.stringify({
    platform: {
      name: 'Dibaoxa - Travel & Staycation',
      hotline: '1900 8899',
      hotline_hours: '8:00 - 21:00 hàng ngày',
      features: [
        'Giữ chỗ 10 phút miễn phí trước khi thanh toán',
        'Thanh toán qua mã VietQR & cổng VNPay',
        'Mã QR Check-in tự động xuất hiện sau thanh toán',
        'Tích điểm thưởng Xu thành viên (1 Xu = 10.000đ chi tiêu)',
        'Hạng thành viên nâng cấp tự động: Silver → Gold → Platinum',
      ],
      categories: ['Du thuyền 4-5 sao', 'Vé máy bay nội địa', 'Khách sạn & Resort', 'Gói combo trọn gói', 'Du lịch doanh nghiệp MICE', 'Blog kinh nghiệm'],
      booking_process: [
        'Bước 1: Chọn sản phẩm (du thuyền/vé bay/khách sạn/gói combo)',
        'Bước 2: Điền thông tin hành khách/khách lưu trú',
        'Bước 3: Giữ chỗ 10 phút, quét mã VietQR hoặc thanh toán VNPay',
        'Bước 4: Nhận mã đặt chỗ + QR check-in trong mục "Đơn của tôi"',
      ],
    },
    cruises: cruises.map((c) => ({
      id: c.id,
      name: c.name,
      operator: c.operator,
      destination: c.destination,
      departurePort: c.departurePort,
      durationDays: c.durationDays,
      durationText: `${c.durationDays} ngày ${c.durationDays - 1} đêm`,
      price: c.price,
      priceText: `${formatPrice(c.price)}đ/khách`,
      rating: c.rating,
      reviews: c.reviews,
      shipClass: c.shipClass,
      features: c.features,
      cabins: c.cabins,
      itinerary: c.itinerary,
      description: c.description || '',
      policies: c.policies || [],
      faqs: c.faqs || [],
    })),
    hotels: hotels.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      address: h.address,
      stars: h.star_rating,
      min_price: h.min_price,
      min_priceText: h.min_price ? `${formatPrice(h.min_price)}đ/đêm` : null,
      rating: h.avg_rating,
      review_count: h.review_count,
      stay_types: h.stay_types,
      amenities: h.amenities,
      highlights: h.highlights,
      highlight_bullets: h.highlight_bullets,
      policies: h.policies,
      faqs: h.faqs,
      description: h.description || '',
      rooms: h.room_preview?.map((r) => ({
        id: r.id,
        name: r.name,
        room_type: r.room_type,
        max_occupancy: r.max_occupancy,
        price_per_night: r.price_per_night,
        bed_type: r.bed_type,
        area_sqm: r.area_sqm,
        view_type: r.view_type,
      })),
      cover_image: h.cover_image,
    })),
    packages: packages.map((p) => ({
      id: p.id,
      title: p.title,
      destination: p.destination,
      duration: p.duration,
      price: p.price,
      priceText: `${formatPrice(p.price)}đ`,
      included: p.included,
    })),
    flights: FLIGHTS.map((f) => ({
      id: f.id,
      airline: f.airline,
      code: f.code,
      origin: f.origin,
      originCity: AIRPORTS.find((a) => a.code === f.origin)?.city || f.origin,
      destination: f.destination,
      destinationCity: AIRPORTS.find((a) => a.code === f.destination)?.city || f.destination,
      depart: f.depart,
      arrive: f.arrive,
      durationMinutes: f.durationMinutes,
      price: f.price,
      priceText: `${formatPrice(f.price)}đ`,
      baggage: f.baggage,
      cabinBag: f.cabinBag,
      aircraft: f.aircraft,
      seatsLeft: f.seatsLeft,
      refundable: f.refundable,
    })),
    airports: AIRPORTS.map((a) => ({
      code: a.code,
      name: a.name,
      city: a.city,
      region: a.region,
    })),
    articles: BLOG_POSTS,
  });
}

/* ────────────────────── ADVANCED SYSTEM PROMPT ────────────────────── */

function buildSystemPrompt() {
  return [
    'Bạn là Vi - Trợ lý Tư vấn Du lịch Thông minh & Cao cấp của nền tảng Dibaoxa.',
    'Bạn đóng vai trò là một chuyên viên tư vấn du lịch tận tâm, sắc bén, am hiểu sâu sắc mọi dữ liệu sản phẩm, dịch vụ và chính sách của Dibaoxa.',
    '',
    '## NGUYÊN TẮC VÀ PHONG CÁCH TƯ VẤN:',
    '1. **Nắm bắt bối cảnh đa lượt (Multi-turn Awareness)**: Ghi nhớ các chi tiết khách đã đề cập trước đó (điểm đến, số người lớn/trẻ em, khoảng ngân sách, sở thích...) để đưa ra câu trả lời nối tiếp logic và cá nhân hóa.',
    '2. **Lý giải nguyên nhân (Personalized Reasoning)**: Luôn giải thích TẠI SAO một lựa chọn lại phù hợp với yêu cầu của khách (ví dụ: giải thích tại sao phòng khách sạn hoặc du thuyền này phù hợp cho gia đình có trẻ em, cặp đôi, hoặc nhóm bạn).',
    '3. **Tính toán chi phí thông minh (Cost Estimation)**: Nếu khách nêu số khách hoặc số đêm, hãy tự động tính tổng chi phí ước tính (Ví dụ: 2 vé máy bay x 1.890.000đ + 2 đêm khách sạn 2.000.000đ = tổng 7.780.000đ).',
    '4. **Tổ hợp Combo linh hoạt**: Khi khách hỏi lịch trình hoặc gợi ý chuyến đi, chủ động đề xuất kết hợp Vé máy bay + Khách sạn hoặc Du thuyền để tạo thành chuyến đi hoàn chỉnh.',
    '5. **Căn cứ dữ liệu tuyệt đối (Zero Hallucination)**: CHỈ trích dẫn chính xác thông tin (tên, giá, điểm đến, giờ bay, tiện ích, loại phòng, chính sách) có trong "Dữ liệu kiến thức Dibaoxa". Nếu dữ liệu chưa có, hãy lịch sự thông báo và hướng dẫn khách gọi Hotline 1900 8899.',
    '6. **Trình bày trực quan & Sang trọng**: Sử dụng định dạng Markdown đẹp mắt với emoji phù hợp, in đậm tên sản phẩm/con số, dùng danh sách gạch đầu dòng để khách dễ đọc trên di động.',
    '',
    '## HƯỚNG DẪN XỬ LÝ THEO CHỦ ĐỀ:',
    '- **Du thuyền**: Nêu tên du thuyền, hãng vận hành, điểm đến, cảng khởi hành, thời lượng, giá/khách, điểm đánh giá, danh sách tiện ích (Features), loại cabin và điểm nhấn hành trình (Itinerary).',
    '- **Khách sạn & Resort**: Nêu tên, thành phố, địa chỉ, số sao, giá phòng rẻ nhất, đánh giá. Liệt kê tên các hạng phòng kèm sức chứa `max_occupancy`, diện tích `area_sqm`, view và giá/đêm khi được hỏi.',
    '- **Vé máy bay**: Nêu mã chuyến bay, hãng bay, hành trình (điểm đi → điểm đến), giờ cất/hạ cánh, giá vé, hành lý ký gửi/xách tay, loại máy bay, số ghế còn lại.',
    '- **So sánh**: Lập bảng hoặc danh sách so sánh chi tiết ưu/nhược điểm, mức giá, tiện ích và đối tượng phù hợp giữa 2-3 lựa chọn.',
    '- **Thanh toán & Thủ tục**: Hướng dẫn giữ chỗ 10 phút, thanh toán VietQR/VNPay, mã QR Check-in tự động và chương trình tích Xu thành viên.',
  ].join('\n');
}

/* ────────────────────── RESPONSE PARSING ────────────────────── */

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text.trim();
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text.trim();
    }
  }
  return '';
}

/* ────────────────────── OPENAI REQUEST BUILDER ────────────────────── */

export function buildOpenAiRequestBody({ message, history, hotels, packages, cruises, profile, safetyIdentifier }) {
  const priorMessages = history
    .slice(-8)
    .map((item, i) => `[${i + 1}] ${item.role === 'user' ? 'Khách hỏi' : 'Vi trả lời'}: ${item.content}`)
    .join('\n');

  const detectedIntents = Array.isArray(profile?.intents) && profile.intents.length
    ? `Ý định phát hiện: ${profile.intents.join(', ')}`
    : 'Chưa xác định ý định cụ thể';

  const contextSummary = [
    `Ý định: ${detectedIntents}`,
    `Thành phố: ${profile.city || 'Chưa nêu'}`,
    `Ngân sách: ${profile.budget ? formatPrice(profile.budget) + 'đ' : 'Chưa nêu'}`,
    `Số đêm: ${profile.nights || 'Chưa nêu'}`,
    `Số khách: ${profile.guests || 'Chưa nêu'}`,
    `Đối tượng: ${profile.isFamily ? 'Gia đình' : profile.isCouple ? 'Cặp đôi' : 'Thường'}`,
    `Hạng mong muốn: ${profile.isLuxury ? 'Cao cấp 5 sao' : 'Tự do'}`,
  ].join(' | ');

  return {
    model: ENV.OPENAI_MODEL,
    instructions: buildSystemPrompt(),
    input: [
      `=== DỮ LIỆU KIẾN THỨC DIBAOXA ===\n${buildComprehensiveInventoryContext(hotels, packages, cruises)}`,
      `=== BỐI CẢNH NGHỆ THUẬT VÀ NHU CẦU KHÁCH ===\n${contextSummary}`,
      priorMessages ? `=== LỊCH SỬ TRÒ CHUYỆN ĐA LƯỢT ===\n${priorMessages}` : '',
      `=== CÂU HỎI MỚI NHẤT CỦA KHÁCH ===\nKhách hỏi: ${message}`,
    ].filter(Boolean).join('\n\n'),
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    max_output_tokens: 1200,
    ...(safetyIdentifier && { safety_identifier: safetyIdentifier }),
    store: false,
  };
}

/* ────────────────────── AI GENERATION ────────────────────── */

async function generateAiAnswer({ message, history, hotels, packages, cruises, profile, safetyIdentifier }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildOpenAiRequestBody({ message, history, hotels, packages, cruises, profile, safetyIdentifier })),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const apiMessage = errorPayload?.error?.message;
    const apiCode = errorPayload?.error?.code || errorPayload?.error?.type;
    throw new Error(`OpenAI request failed with ${response.status}${apiCode ? ` (${apiCode})` : ''}${apiMessage ? `: ${apiMessage}` : ''}`);
  }
  const answer = extractResponseText(await response.json());
  if (!answer) throw new Error('OpenAI response did not contain text');
  return answer;
}

/* ────────────────────── PUBLIC API ────────────────────── */

export function getAssistantStatus() {
  return {
    ai_enabled: Boolean(ENV.OPENAI_API_KEY),
    model: ENV.OPENAI_API_KEY ? ENV.OPENAI_MODEL : null,
    mode: ENV.OPENAI_API_KEY ? 'ai' : 'local',
  };
}

export function getOpenAiFallbackReason(error) {
  const message = String(error?.message || '').toLocaleLowerCase('en');
  if (message.includes('credit_balance_exhausted') || message.includes('insufficient_quota')) {
    return 'Hạn mức OpenAI API đã hết, Vi đang dùng kho kiến thức Dibaoxa nội bộ';
  }
  if (message.includes('401') || message.includes('invalid_api_key')) {
    return 'OpenAI API key không hợp lệ, Vi đang dùng kho kiến thức Dibaoxa nội bộ';
  }
  if (message.includes('403') || message.includes('model_not_found')) {
    return 'Tài khoản OpenAI chưa có quyền dùng model đã chọn, Vi đang dùng dữ liệu nội bộ';
  }
  if (message.includes('timeout') || message.includes('fetch failed')) {
    return 'Chưa kết nối được OpenAI, Vi đang dùng kho kiến thức Dibaoxa nội bộ';
  }
  return 'OpenAI tạm thời chưa phản hồi, Vi đang dùng kho kiến thức Dibaoxa nội bộ';
}

export async function chat({ message, history = [], safetyIdentifier }) {
  const [{ hotels }, packages, cruises] = await Promise.all([
    searchHotels({ page: 1, limit: 100 }),
    listActivePackages(),
    listCruises().catch(() => []),
  ]);

  const profile = extractTripProfile(message, history);
  const matches = rankHotels(hotels, message, profile);
  const packageMatches = rankPackages(packages, profile);
  const cruiseMatches = rankCruises(cruises, profile);
  const flightMatches = rankFlights(message, profile);
  const articleMatches = rankArticles(message);

  const suggestions = buildDynamicSuggestions(profile, cruiseMatches, flightMatches, matches);

  const fallbackAnswer = buildLocalAnswer(
    message,
    profile,
    matches,
    packageMatches,
    cruiseMatches,
    flightMatches,
    articleMatches,
    hotels,
    cruises
  );

  if (!ENV.OPENAI_API_KEY) {
    return {
      answer: fallbackAnswer,
      suggestions,
      matches,
      package_matches: packageMatches,
      cruise_matches: cruiseMatches,
      flight_matches: flightMatches,
      article_matches: articleMatches,
      profile,
      mode: 'local',
      mode_reason: 'Toàn bộ dữ liệu Dibaoxa đã được nạp sẵn',
    };
  }

  try {
    const answer = await generateAiAnswer({
      message,
      history,
      hotels,
      packages,
      cruises,
      profile,
      safetyIdentifier,
    });
    return {
      answer,
      suggestions,
      matches,
      package_matches: packageMatches,
      cruise_matches: cruiseMatches,
      flight_matches: flightMatches,
      article_matches: articleMatches,
      profile,
      mode: 'ai',
      mode_reason: `Powered by ${ENV.OPENAI_MODEL} với toàn bộ kho kiến thức Dibaoxa`,
    };
  } catch (error) {
    console.warn('[Assistant fallback]', error.message);
    return {
      answer: fallbackAnswer,
      suggestions,
      matches,
      package_matches: packageMatches,
      cruise_matches: cruiseMatches,
      flight_matches: flightMatches,
      article_matches: articleMatches,
      profile,
      mode: 'local',
      mode_reason: getOpenAiFallbackReason(error),
    };
  }
}
