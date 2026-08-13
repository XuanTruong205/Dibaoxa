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

const BASE_SUGGESTIONS = [
  'Gợi ý du thuyền Hạ Long / Lan Hạ',
  'Tìm vé máy bay giá rẻ',
  'Có gói nghỉ dưỡng nào dưới 5 triệu?',
  'Hotline hỗ trợ & Quy trình đặt phòng',
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
  { key: 'family', patterns: ['gia dinh', 'tre em', 'nhom', 'family', 'bo me', 'con nho'], label: 'gia đình' },
  { key: 'package', patterns: ['goi nghi', 'goi du lich', 'combo', 'tron goi', 'staycation', 'uu dai'], label: 'gói combo trọn gói' },
  { key: 'booking', patterns: ['thanh toan', 'vietqr', 'vnpay', 'momo', 'qr', 'dat phong', 'huy phong', 'don cua toi', 'tich diem', 'xu', 'dat cho', 'giu cho'], label: 'thủ tục & thanh toán' },
  { key: 'corporate', patterns: ['doanh nghiep', 'cong ty', 'doan', 'mice', 'team building', 'hoi thao'], label: 'du lịch doanh nghiệp' },
  { key: 'contact', patterns: ['hotline', 'lien he', 'so dien thoai', 'tong dai', 'dia chi', 'ho tro'], label: 'liên hệ & hỗ trợ' },
  { key: 'compare', patterns: ['so sanh', 'khac nhau', 'nao tot hon', 'chon gi', 'hay la', 'nen chon'], label: 'so sánh' },
  { key: 'policy', patterns: ['chinh sach', 'quy dinh', 'huy don', 'huy phong', 'huy dat', 'hoan tien', 'dieu kien', 'luu y'], label: 'chính sách' },
  { key: 'airport', patterns: ['san bay', 'airport', 'noi bai', 'tan son nhat', 'da nang airport', 'cam ranh'], label: 'sân bay' },
  { key: 'feature', patterns: ['tien ich', 'dich vu', 'spa', 'be boi', 'kayak', 'gym', 'wifi', 'bua an', 'buffet', 'nau an'], label: 'tiện ích & dịch vụ' },
  { key: 'price', patterns: ['gia', 're nhat', 'dat nhat', 'bao nhieu', 'chi phi', 'ngan sach', 'budget'], label: 'giá cả' },
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

function extractTripProfile(message) {
  const normalized = normalize(message);
  const city = Object.entries(CITY_ALIASES).find(([alias]) => normalized.includes(alias))?.[1] || null;
  const budget = extractBudget(message);
  const intents = INTENT_RULES
    .filter((rule) => includesAny(normalized, rule.patterns))
    .map((rule) => rule.key);
  const nightsMatch = normalized.match(/(\d+)\s*(?:dem|ngay)/);
  const guestsMatch = normalized.match(/(\d+)\s*(?:nguoi|khach|ban|nguoi lon)/);

  return {
    normalized,
    city,
    budget,
    intents: [...new Set(intents)],
    nights: nightsMatch ? Number(nightsMatch[1]) : null,
    guests: guestsMatch ? Number(guestsMatch[1]) : null,
  };
}

function rankHotels(hotels, message, profile) {
  const scoredHotels = hotels
    .map((hotel) => {
      let score = 0;
      if (profile.city && hotel.city === profile.city) score += 14;
      if (profile.guests && hotel.room_preview?.some((r) => r.max_occupancy >= profile.guests)) score += 4;
      if (profile.budget && hotel.min_price && hotel.min_price <= profile.budget) score += 6;
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
    score,
  }));
}

function rankCruises(cruises, profile) {
  const scored = cruises
    .map((cruise) => {
      let score = 0;
      if (profile.city && (cruise.destination.includes(profile.city) || profile.city.includes(cruise.destination))) score += 12;
      if (profile.budget && cruise.price <= profile.budget) score += 8;
      if (profile.nights && cruise.durationDays === profile.nights) score += 5;
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
  const text = normalize(message);
  const airportCodes = AIRPORTS.map((a) => a.code.toLowerCase());

  return FLIGHTS.filter((flight) => {
    if (profile.budget && flight.price > profile.budget) return false;
    // Match by origin/destination city or code mentioned in message
    const originMatch = text.includes(flight.origin.toLowerCase()) ||
      AIRPORTS.find((a) => a.code === flight.origin && normalize(a.city).split(' ').some((w) => w.length > 2 && text.includes(w)));
    const destMatch = text.includes(flight.destination.toLowerCase()) ||
      AIRPORTS.find((a) => a.code === flight.destination && normalize(a.city).split(' ').some((w) => w.length > 2 && text.includes(w)));
    // If user mentions specific route, filter for it
    if (originMatch && destMatch) return true;
    if (originMatch || destMatch) return true;
    return true; // fallback: include all within budget
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
    return 'Chào bạn, mình là Vi, trợ lý AI thông minh của Dibaoxa. Bạn có thể hỏi mình về Du thuyền Hạ Long/Lan Hạ, Vé máy bay, Khách sạn & Resort, Gói ưu đãi, Kinh nghiệm du lịch hoặc Quy trình thanh toán QR nhé!';
  }

  if (profile.intents.includes('contact')) {
    return 'Dịch vụ CSKH Dibaoxa luôn sẵn sàng hỗ trợ bạn qua Hotline tư vấn: 1900 8899 (8:00 - 21:00 hàng ngày) hoặc nút "Liên hệ" trực tiếp trên giao diện website.';
  }

  if (profile.intents.includes('corporate')) {
    return 'Dibaoxa cung cấp giải pháp du lịch doanh nghiệp MICE, Team Building và Hội thảo trọn gói bao gồm du thuyền, khách sạn và vé máy bay cho đoàn từ 10 đến hơn 100 khách. Hãy chọn tab "Doanh nghiệp" để gửi yêu cầu báo giá!';
  }

  if (profile.intents.includes('booking')) {
    return 'Trên Dibaoxa, bạn có thể giữ chỗ trong 10 phút, thanh toán dễ dàng qua mã VietQR hoặc VNPay. Sau khi thanh toán thành công, mã đặt chỗ và mã QR check-in tự động xuất hiện trong mục "Đơn của tôi". Bạn được tích điểm thưởng Xu cho mỗi giao dịch thành công.';
  }

  if (profile.intents.includes('airport')) {
    const text = normalize(message);
    const regionKeywords = { 'mien bac': 'Miền Bắc', 'mien trung': 'Miền Trung', 'mien nam': 'Miền Nam', 'tay nguyen': 'Tây Nguyên' };
    const matchedRegion = Object.entries(regionKeywords).find(([alias]) => text.includes(alias));
    if (matchedRegion) {
      const regionAirports = AIRPORTS.filter((a) => a.region === matchedRegion[1]);
      const list = regionAirports.map((a) => `${a.code} - ${a.name} (${a.city})`).join('; ');
      return `Sân bay khu vực ${matchedRegion[1]} trên Dibaoxa: ${list}.`;
    }
    return `Dibaoxa hỗ trợ ${AIRPORTS.length} sân bay trong nước. Bạn có thể hỏi mình sân bay cụ thể theo vùng miền (Bắc/Trung/Nam/Tây Nguyên).`;
  }

  // Feature-based search (e.g. "du thuyền nào có spa?") — must come before policy
  if (profile.intents.includes('feature')) {
    const text = normalize(message);
    const featureSynonyms = [
      { key: 'spa', patterns: ['spa', 'jacuzzi', 'be suc', 'massage'] },
      { key: 'bể bơi', patterns: ['be boi', 'pool', 'jacuzzi'] },
      { key: 'kayak', patterns: ['kayak', 'cheo thuyền', 'cheo kayak'] },
      { key: 'bữa ăn', patterns: ['bua an', 'buffet', 'nha hang', 'thuc don'] },
      { key: 'ban công', patterns: ['ban cong', 'balcony'] },
    ];
    const matchedFeature = featureSynonyms.find((item) => item.patterns.some((p) => text.includes(p)));
    if (matchedFeature && cruises?.length) {
      const matching = cruises.filter((c) =>
        c.features?.some((f) => matchedFeature.patterns.some((p) => normalize(f).includes(p)))
      );
      if (matching.length) {
        const list = matching.map((c) => `"${c.name}" (${c.destination}, ${formatPrice(c.price)}đ)`).join(', ');
        return `Du thuyền có ${matchedFeature.key}: ${list}. Chọn tab "Du thuyền" để xem chi tiết!`;
      }
    }
  }

  if (profile.intents.includes('policy')) {
    const relevantCruise = cruises?.find((c) => normalize(message).includes(normalize(c.name)) || normalize(message).includes(normalize(c.destination)));
    if (relevantCruise?.policies?.length) {
      return `Chính sách du thuyền "${relevantCruise.name}": ${relevantCruise.policies.slice(0, 3).join('. ')}. Xem đầy đủ tại trang chi tiết du thuyền.`;
    }
    return 'Bạn có thể xem chính sách chi tiết tại trang sản phẩm tương ứng (Du thuyền, Khách sạn...). Nếu cần hỗ trợ thêm, gọi Hotline 1900 8899.';
  }

  if (profile.intents.includes('compare') && cruiseMatches.length >= 2) {
    const [a, b] = cruiseMatches;
    return `So sánh: "${a.name}" (${a.destination}, ${a.durationDays} ngày, ${formatPrice(a.price)}đ, ${a.rating}/10) vs "${b.name}" (${b.destination}, ${b.durationDays} ngày, ${formatPrice(b.price)}đ, ${b.rating}/10). Xem chi tiết từng du thuyền để chọn phù hợp!`;
  }

  if (profile.intents.includes('flight')) {
    if (flightMatches.length) {
      const flight = flightMatches[0];
      return `Về vé máy bay, chuyến ${flight.code} (${flight.airline}) từ ${flight.origin} đi ${flight.destination} có giá chỉ từ ${formatPrice(flight.price)}đ (Giờ bay ${flight.depart} - ${flight.arrive}, hành lý ${flight.baggage}, máy bay ${flight.aircraft}, còn ${flight.seatsLeft} ghế). Chọn tab "Vé máy bay" để tìm kiếm chuyến bay phù hợp!`;
    }
    return 'Dibaoxa hỗ trợ so sánh vé máy bay trực tiếp từ các hãng Vietnam Airlines, Vietjet Air, Bamboo Airways, Vietravel Airlines. Bạn hãy chuyển sang tab "Vé máy bay" để tìm chặng bay nhé!';
  }

  if (profile.intents.includes('hotel') || profile.intents.includes('room')) {
    if (matches.length) {
      const [first, second] = matches;
      const firstPrice = first.min_price ? ` từ ${formatPrice(first.min_price)}đ/đêm` : '';
      const secondText = second ? ` Ngoài ra còn có ${second.name} tại ${second.city}.` : '';
      return `Dành cho chỗ nghỉ, mình gợi ý ${first.name} tại ${first.city}${firstPrice}.${secondText} Chọn thẻ bên dưới để xem chi tiết phòng!`;
    }
    return 'Dibaoxa có nhiều khách sạn & resort cao cấp từ 4-5 sao tại Đà Nẵng, Phú Quốc, Hạ Long, Nha Trang... Bạn hãy chọn tab "Khách sạn" để xem phòng trống!';
  }

  if (profile.intents.includes('package') || packageMatches.length) {
    if (packageMatches.length) {
      const pkg = packageMatches[0];
      const includedText = pkg.included?.length ? ` Bao gồm: ${pkg.included.slice(0, 3).join(', ')}.` : '';
      return `Gói ưu đãi hot nhất hiện tại: "${pkg.title}" tại ${pkg.destination} (${pkg.duration}) với giá trọn gói chỉ ${formatPrice(pkg.price)}đ.${includedText} Xem thêm trong mục "Gói ưu đãi"!`;
    }
  }

  if (profile.intents.includes('cruise') || (profile.city && ['Hạ Long', 'Lan Hạ'].includes(profile.city))) {
    if (cruiseMatches.length) {
      const top = cruiseMatches[0];
      const featuresText = top.features?.length ? `. Tiện ích: ${top.features.slice(0, 4).join(', ')}` : '';
      return `Về du thuyền, mình gợi ý hải trình nổi bật "${top.name}" thuộc ${top.operator} tại ${top.destination} (${top.durationDays} ngày), khởi hành từ ${top.departurePort || 'cảng chính'}, giá từ ${formatPrice(top.price)}đ/khách (Đánh giá ${top.rating}/10)${featuresText}. Bạn chọn tab "Du thuyền" để xem chi tiết nhé!`;
    }
    return 'Dibaoxa có nhiều du thuyền 4-5 sao tuyển chọn tại Hạ Long & Lan Hạ với hải trình 2N1Đ hoặc 3N2Đ bao gồm bữa ăn trọn gói và chèo kayak. Bạn có thể chọn tab "Du thuyền" để lọc chi tiết.';
  }

  if (matches.length && profile.city) {
    const [first, second] = matches;
    const firstPrice = first.min_price ? ` từ ${formatPrice(first.min_price)}đ/đêm` : '';
    const secondText = second ? ` Ngoài ra còn có ${second.name} tại ${second.city}.` : '';
    return `Dành cho chỗ nghỉ tại ${profile.city}, mình gợi ý ${first.name}${firstPrice}.${secondText} Chọn thẻ bên dưới để xem phòng trống!`;
  }

  if (articleMatches.length) {
    const article = articleMatches[0];
    return `Kinh nghiệm du lịch từ Dibaoxa: "${article.title}" - ${article.advice}. Bạn có thể vào mục "Blog" để đọc đầy đủ các bài viết bổ ích!`;
  }

  return 'Mình luôn sẵn sàng tư vấn tất cả dịch vụ của Dibaoxa: Du thuyền Hạ Long/Lan Hạ, Vé máy bay nội địa, Khách sạn & Resort, Gói ưu đãi và Kinh nghiệm du lịch. Bạn hãy cho mình biết điểm đến hoặc khoảng ngân sách nhé!';
}

/* ────────────────────── DYNAMIC SUGGESTIONS ────────────────────── */

function buildDynamicSuggestions(profile, cruiseMatches, flightMatches, matches) {
  const suggestions = [];

  if (profile.intents.includes('cruise') || cruiseMatches.length) {
    suggestions.push('Du thuyền nào có spa?', 'So sánh du thuyền Hạ Long vs Lan Hạ', 'Chính sách hủy du thuyền');
  } else if (profile.intents.includes('flight') || flightMatches.length) {
    suggestions.push('Bay SGN đi DAD giá rẻ nhất?', 'Sân bay nào ở miền Trung?', 'Hãng nào được hoàn vé?');
  } else if (profile.intents.includes('hotel') || profile.intents.includes('room') || matches.length) {
    suggestions.push('Phòng nào rẻ nhất ở Đà Nẵng?', 'Khách sạn gần biển có bể bơi', 'Resort cho gia đình');
  } else if (profile.intents.includes('package')) {
    suggestions.push('Gói combo dưới 5 triệu?', 'Combo du thuyền + khách sạn', 'Gói ưu đãi Phú Quốc');
  }

  // Fill remaining slots with defaults
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
        'Giữ chỗ 10 phút trước khi thanh toán',
        'Thanh toán qua VietQR & VNPay',
        'Mã QR Check-in tự động sau thanh toán',
        'Tích điểm thưởng Xu thành viên (1 Xu = 10.000đ chi tiêu)',
        'Hạng thành viên: Silver → Gold → Platinum',
      ],
      categories: ['Du thuyền', 'Vé máy bay', 'Khách sạn & Resort', 'Gói combo ưu đãi', 'Du lịch doanh nghiệp MICE', 'Blog kinh nghiệm'],
      booking_process: [
        'Chọn sản phẩm (du thuyền/vé bay/khách sạn/gói combo)',
        'Điền thông tin hành khách/khách lưu trú',
        'Giữ chỗ 10 phút, thanh toán qua VietQR hoặc VNPay',
        'Nhận mã đặt chỗ + QR check-in trong mục "Đơn của tôi"',
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

/* ────────────────────── SYSTEM PROMPT ────────────────────── */

function buildSystemPrompt() {
  return [
    'Bạn là Vi, trợ lý AI thông minh của nền tảng du lịch Dibaoxa. Bạn am hiểu toàn bộ dữ liệu sản phẩm và dịch vụ của Dibaoxa.',
    '',
    '## NGUYÊN TẮC CỐT LÕI:',
    '1. CHỈ trả lời dựa trên dữ liệu được cung cấp trong "Dữ liệu kiến thức Dibaoxa". TUYỆT ĐỐI KHÔNG bịa thêm thông tin.',
    '2. Nếu không tìm thấy thông tin trong dữ liệu, nói rõ: "Thông tin này mình chưa có trong hệ thống, bạn có thể gọi Hotline 1900 8899 để được tư vấn chi tiết."',
    '3. Luôn trích dẫn tên sản phẩm, giá, và thông số cụ thể khi trả lời.',
    '',
    '## CÁCH XỬ LÝ TỪNG LOẠI CÂU HỎI:',
    '',
    '### Câu hỏi về Du thuyền:',
    '- Nêu tên du thuyền, hãng vận hành, điểm đến, cảng khởi hành, thời lượng, giá/khách, đánh giá.',
    '- Liệt kê tiện ích (features), hành trình (itinerary), loại cabin nếu được hỏi.',
    '- Trả lời chính sách (policies) và FAQ nếu có trong dữ liệu.',
    '',
    '### Câu hỏi về Khách sạn & Resort:',
    '- Nêu tên, thành phố, địa chỉ, số sao, giá phòng rẻ nhất, đánh giá.',
    '- Liệt kê các loại phòng (tên phòng, giá/đêm, sức chứa, diện tích, view, loại giường) nếu được hỏi.',
    '- Nêu tiện nghi (amenities), điểm nổi bật (highlights), chính sách nếu được hỏi.',
    '',
    '### Câu hỏi về Vé máy bay:',
    '- Nêu mã chuyến bay, hãng bay, điểm đi/đến (kèm tên thành phố), giờ bay, giá, hành lý, máy bay.',
    '- So sánh các chuyến bay nếu được yêu cầu.',
    '- Nêu thông tin sân bay (mã IATA, tên, thành phố, vùng miền) nếu được hỏi.',
    '',
    '### Câu hỏi so sánh:',
    '- So sánh theo bảng: tên, giá, đánh giá, tiện ích, thời lượng.',
    '- Nêu rõ ưu/nhược điểm từng lựa chọn.',
    '',
    '### Câu hỏi về Giá & Ngân sách:',
    '- Lọc sản phẩm phù hợp ngân sách, sắp xếp từ rẻ đến đắt.',
    '- Nêu rõ giá gốc, đơn vị (VND/khách, VND/đêm...).',
    '',
    '### Câu hỏi về Gói combo:',
    '- Nêu tên gói, điểm đến, thời lượng, giá, và danh sách dịch vụ bao gồm.',
    '',
    '### Câu hỏi về Thanh toán & Đặt chỗ:',
    '- Giải thích quy trình đặt chỗ 4 bước: Chọn → Điền thông tin → Thanh toán VietQR/VNPay → Nhận mã QR.',
    '- Thời gian giữ chỗ: 10 phút. Tích điểm Xu: 1 Xu = 10.000đ.',
    '',
    '## PHONG CÁCH TRẢ LỜI:',
    '- Thân thiện, chuyên nghiệp, gọi khách là "bạn".',
    '- Ưu tiên trả lời trực tiếp, đi thẳng vào kết luận rồi mở rộng chi tiết.',
    '- Độ dài: 2-5 câu cho câu hỏi đơn giản, có thể dài hơn khi so sánh hoặc liệt kê.',
    '- Luôn kết thúc bằng gợi ý hành động (xem tab, chọn sản phẩm, gọi hotline...).',
    '- Sử dụng format đẹp: bullet points cho danh sách, in đậm cho tên sản phẩm.',
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

  const detectedIntents = profile.intents.length
    ? `Ý định phát hiện: ${profile.intents.join(', ')}`
    : 'Chưa xác định ý định cụ thể';

  return {
    model: ENV.OPENAI_MODEL,
    instructions: buildSystemPrompt(),
    input: [
      `=== DỮ LIỆU KIẾN THỨC DIBAOXA (Toàn bộ sản phẩm & dịch vụ) ===\n${buildComprehensiveInventoryContext(hotels, packages, cruises)}`,
      `=== PHÂN TÍCH NHU CẦU KHÁCH ===\n${detectedIntents}\nThành phố: ${profile.city || 'Chưa xác định'}\nNgân sách: ${profile.budget ? formatPrice(profile.budget) + 'đ' : 'Chưa nêu'}\nSố đêm: ${profile.nights || 'Chưa nêu'}\nSố khách: ${profile.guests || 'Chưa nêu'}`,
      priorMessages ? `=== LỊCH SỬ TRÒ CHUYỆN ===\n${priorMessages}` : '',
      `=== CÂU HỎI HIỆN TẠI ===\n${message}`,
    ].filter(Boolean).join('\n\n'),
    reasoning: { effort: 'medium' },
    max_output_tokens: 800,
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
    signal: AbortSignal.timeout(18_000),
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

  const profile = extractTripProfile(message);
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
