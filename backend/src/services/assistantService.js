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
};

const INTENT_RULES = [
  { key: 'cruise', patterns: ['du thuyen', 'cruise', 'tau', 'hai trinh', 'lan ha', 'ha long', 'vinh'], label: 'du thuyền' },
  { key: 'flight', patterns: ['ve may bay', 'may bay', 'sang bay', 've bay', 'flight', 'hang bay', 'vietnam airlines', 'vietjet', 'bamboo'], label: 'vé máy bay' },
  { key: 'hotel', patterns: ['khach san', 'resort', 'phong', 'villa', 'cho nghi', 'hotel'], label: 'khách sạn & resort' },
  { key: 'beach', patterns: ['bien', 'beach', 'dao', 'ocean', 'tam bien', 'gan bien'], label: 'gần biển' },
  { key: 'family', patterns: ['gia dinh', 'tre em', 'nhom', 'family', 'bo me', 'con nho'], label: 'gia đình' },
  { key: 'package', patterns: ['goi nghi', 'goi du lich', 'combo', 'tron goi', 'staycation', 'uu dai'], label: 'gói combo trọn gói' },
  { key: 'booking', patterns: ['thanh toan', 'vietqr', 'vnpay', 'momo', 'qr', 'dat phong', 'huy phong', 'don cua toi', 'tich diem', 'xu'], label: 'thủ tục & thanh toán' },
  { key: 'corporate', patterns: ['doanh nghiep', 'cong ty', 'doan', 'mice', 'team building', 'hoi thao'], label: 'du lịch doanh nghiệp' },
  { key: 'contact', patterns: ['hotline', 'lien he', 'so dien thoại', 'tong dai', 'dia chi', 'ho tro'], label: 'liên hệ & hỗ trợ' },
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
    durationDays: cruise.durationDays,
    price: cruise.price,
    rating: cruise.rating,
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
    }));
}

function rankFlights(message, profile) {
  const text = normalize(message);
  return FLIGHTS.filter((flight) => {
    if (profile.budget && flight.price > profile.budget) return false;
    return true;
  }).slice(0, 3);
}

function rankArticles(message) {
  const text = normalize(message);
  return BLOG_POSTS.filter((post) => {
    const postText = normalize(`${post.title} ${post.summary} ${post.category}`);
    return text.split(' ').some((word) => word.length > 3 && postText.includes(word));
  }).slice(0, 2);
}

function buildLocalAnswer(message, profile, matches, packageMatches, cruiseMatches, flightMatches, articleMatches) {
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
    return 'Trên Dibaoxa, bạn có thể giữ chỗ trong 10 phút, thanh toán dễ dàng qua mã VietQR hoặc VNPay. Sau khi thanh toán thành công, mã đặt chỗ và mã QR check-in tự động xuất hiện trong mục "Đơn của tôi".';
  }

  if (profile.intents.includes('cruise') || cruiseMatches.length > 0) {
    if (cruiseMatches.length) {
      const top = cruiseMatches[0];
      return `Về du thuyền, mình gợi ý hải trình nổi bật "${top.name}" thuộc ${top.operator} tại ${top.destination} (${top.durationDays} ngày) với giá từ ${formatPrice(top.price)}đ/khách (Đánh giá ${top.rating}/10). Bạn chọn tab "Du thuyền" để xem chi tiết nhé!`;
    }
    return 'Dibaoxa có nhiều du thuyền 4-5 sao tuyển chọn tại Hạ Long & Lan Hạ với hải trình 2N1Đ hoặc 3N2Đ bao gồm bữa ăn trọn gói và chèo kayak. Bạn có thể chọn tab "Du thuyền" để lọc chi tiết.';
  }

  if (profile.intents.includes('flight') || flightMatches.length > 0) {
    if (flightMatches.length) {
      const flight = flightMatches[0];
      return `Về vé máy bay, chuyến ${flight.code} (${flight.airline}) từ ${flight.origin} đi ${flight.destination} có giá chỉ từ ${formatPrice(flight.price)}đ (Giờ bay ${flight.depart} - ${flight.arrive}, hành lý ${flight.baggage}). Chọn tab "Vé máy bay" để tìm kiếm chuyến bay phù hợp!`;
    }
    return 'Dibaoxa hỗ trợ so sánh vé máy bay trực tiếp từ các hãng Vietnam Airlines, Vietjet Air, Bamboo Airways. Bạn hãy chuyển sang tab "Vé máy bay" để nhập chặng bay nhé!';
  }

  if (articleMatches.length) {
    const article = articleMatches[0];
    return `Kinh nghiệm du lịch từ Dibaoxa: "${article.title}" - ${article.advice}. Bạn có thể vào mục "Blog" để đọc đầy đủ các bài viết bổ ích!`;
  }

  if (profile.intents.includes('package') || packageMatches.length) {
    if (packageMatches.length) {
      const pkg = packageMatches[0];
      return `Gói ưu đãi hot nhất hiện tại: "${pkg.title}" tại ${pkg.destination} (${pkg.duration}) với giá trọn gói chỉ ${formatPrice(pkg.price)}đ. Xem thêm trong mục "Gói ưu đãi"!`;
    }
  }

  if (matches.length) {
    const [first, second] = matches;
    const firstPrice = first.min_price ? ` từ ${formatPrice(first.min_price)}đ/đêm` : '';
    const secondText = second ? ` Ngoài ra còn có ${second.name} tại ${second.city}.` : '';
    return `Dành cho chỗ nghỉ, mình gợi ý ${first.name} tại ${first.city}${firstPrice}.${secondText} Chọn thẻ bên dưới để xem phòng trống!`;
  }

  return 'Mình luôn sẵn sàng tư vấn tất cả dịch vụ của Dibaoxa: Du thuyền Hạ Long/Lan Hạ, Vé máy bay nội địa, Khách sạn & Resort, Gói ưu đãi và Kinh nghiệm du lịch. Bạn hãy cho mình biết điểm đến hoặc khoảng ngân sách nhé!';
}

function buildComprehensiveInventoryContext(hotels, packages, cruises) {
  return JSON.stringify({
    platform: {
      name: 'Dibaoxa - Travel & Staycation',
      hotline: '1900 8899',
      features: ['Giữ chỗ 10 phút', 'Thanh toán VietQR & VNPay', 'Mã QR Check-in tự động', 'Tích điểm thưởng Xu thành viên'],
      categories: ['Du thuyền', 'Vé máy bay', 'Khách sạn', 'Doanh nghiệp MICE', 'Blog kinh nghiệm'],
    },
    cruises: cruises.map((c) => ({
      id: c.id,
      name: c.name,
      operator: c.operator,
      destination: c.destination,
      durationDays: c.durationDays,
      price: c.price,
      rating: c.rating,
      cabins: c.cabins,
    })),
    hotels: hotels.map((h) => ({
      id: h.id,
      name: h.name,
      city: h.city,
      stars: h.star_rating,
      min_price: h.min_price,
      rating: h.avg_rating,
      stay_types: h.stay_types,
    })),
    packages: packages.map((p) => ({
      id: p.id,
      title: p.title,
      destination: p.destination,
      duration: p.duration,
      price: p.price,
      included: p.included,
    })),
    flights_info: {
      airlines: ['Vietnam Airlines', 'Vietjet Air', 'Bamboo Airways', 'Vietravel Airlines'],
      popular_routes: ['SGN - DAD', 'HAN - DAD', 'SGN - HAN', 'HAN - PQC', 'SGN - PQC'],
      airports_count: AIRPORTS.length,
    },
    articles: BLOG_POSTS,
  });
}

function extractResponseText(payload) {
  if (typeof payload.output_text === 'string') return payload.output_text.trim();
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text.trim();
    }
  }
  return '';
}

export function buildOpenAiRequestBody({ message, history, hotels, packages, cruises, profile, safetyIdentifier }) {
  const priorMessages = history
    .slice(-6)
    .map((item) => `${item.role === 'user' ? 'Khách' : 'Vi'}: ${item.content}`)
    .join('\n');

  return {
    model: ENV.OPENAI_MODEL,
    instructions: [
      'Bạn là Vi, trợ lý AI toàn năng của nền tảng du lịch Dibaoxa.',
      'Bạn am hiểu toàn bộ hệ thống Dibaoxa: Du thuyền (Hạ Long, Lan Hạ...), Vé máy bay nội địa, Khách sạn & Resort, Gói combo ưu đãi, Kinh nghiệm du lịch (Blog), Du lịch doanh nghiệp MICE, và Quy trình thanh toán VietQR / Check-in QR.',
      'Trả lời thân thiện, chính xác dựa trên toàn bộ dữ liệu nền tảng được cung cấp.',
      'Ưu tiên trả lời ngắn gọn (2-4 câu), nêu kết luận trước rồi đưa ra gợi ý phù hợp.',
      'Không bịa thông tin ngoài hệ thống.',
    ].join(' '),
    input: [
      `Toàn bộ dữ liệu kiến thức Dibaoxa:\n${buildComprehensiveInventoryContext(hotels, packages, cruises)}`,
      `Nhu cầu của khách:\n${JSON.stringify(profile)}`,
      `Lịch sử trò chuyện:\n${priorMessages || 'Chưa có'}`,
      `Khách hỏi: ${message}`,
    ].join('\n\n'),
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    max_output_tokens: 400,
    ...(safetyIdentifier && { safety_identifier: safetyIdentifier }),
    store: false,
  };
}

async function generateAiAnswer({ message, history, hotels, packages, cruises, profile, safetyIdentifier }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildOpenAiRequestBody({ message, history, hotels, packages, cruises, profile, safetyIdentifier })),
    signal: AbortSignal.timeout(12_000),
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
    searchHotels({ page: 1, limit: 50 }),
    listActivePackages(),
    listCruises().catch(() => []),
  ]);

  const profile = extractTripProfile(message);
  const matches = rankHotels(hotels, message, profile);
  const packageMatches = rankPackages(packages, profile);
  const cruiseMatches = rankCruises(cruises, profile);
  const flightMatches = rankFlights(message, profile);
  const articleMatches = rankArticles(message);

  const suggestions = [
    'Du thuyền Hạ Long 2 ngày 1 đêm',
    'Vé máy bay Hà Nội đi Đà Nẵng',
    'Hướng dẫn thanh toán VietQR',
    'Tư vấn du thuyền cho gia đình',
  ];

  const fallbackAnswer = buildLocalAnswer(
    message,
    profile,
    matches,
    packageMatches,
    cruiseMatches,
    flightMatches,
    articleMatches
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
