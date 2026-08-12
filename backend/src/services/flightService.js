import { createHmac, timingSafeEqual } from 'crypto';
import { ENV } from '../config/env.js';
import { VIETNAM_AIRPORTS, VIETNAM_AIRPORT_CODES, getVietnamAirport } from '../data/vietnamAirports.js';
import { httpError } from '../utils/httpError.js';

const SERPAPI_URL = 'https://serpapi.com/search.json';
const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_CACHE_LIMIT = 100;
const searchCache = new Map();

function quoteSignature(encodedPayload) {
  return createHmac('sha256', ENV.JWT_SECRET).update(encodedPayload, 'utf8').digest('base64url');
}

export function createFlightQuoteToken(offer, query) {
  const payablePassengers = query.adults + query.children;
  const totalPassengers = payablePassengers + query.infants;
  const payload = {
    version: 1,
    type: 'flight',
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    productRef: offer.id,
    unitPrice: offer.price,
    quantity: Math.max(1, payablePassengers),
    totalPassengers,
    title: `${offer.code}: ${offer.origin} đến ${offer.destination}`,
    summary: `${query.departure_date}${query.return_date ? `, về ${query.return_date}` : ''}. ${totalPassengers} hành khách.`,
    snapshot: {
      id: offer.id,
      airline: offer.airline,
      code: offer.code,
      origin: offer.origin,
      destination: offer.destination,
      depart: offer.depart,
      arrive: offer.arrive,
      departAt: offer.departAt,
      arriveAt: offer.arriveAt,
      durationMinutes: offer.durationMinutes,
      stops: offer.stops,
      baggage: offer.baggage,
      refundable: offer.refundable,
      cabin: offer.cabin,
      departureDate: query.departure_date,
      returnDate: query.return_date || null,
      adults: query.adults,
      children: query.children,
      infants: query.infants,
      travelClass: query.travel_class,
    },
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${encodedPayload}.${quoteSignature(encodedPayload)}`;
}

export function verifyFlightQuoteToken(token) {
  const [encodedPayload, receivedSignature, ...extra] = String(token || '').split('.');
  if (!encodedPayload || !receivedSignature || extra.length) {
    throw httpError(400, 'Báo giá chuyến bay không hợp lệ.', 'INVALID_FLIGHT_QUOTE');
  }
  const expectedSignature = quoteSignature(encodedPayload);
  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
    throw httpError(400, 'Báo giá chuyến bay đã bị thay đổi.', 'INVALID_FLIGHT_QUOTE_SIGNATURE');
  }
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    throw httpError(400, 'Báo giá chuyến bay không thể đọc được.', 'INVALID_FLIGHT_QUOTE');
  }
  if (payload.type !== 'flight' || payload.version !== 1 || !Number.isSafeInteger(payload.unitPrice) || payload.unitPrice <= 0) {
    throw httpError(400, 'Thông tin báo giá chuyến bay không hợp lệ.', 'INVALID_FLIGHT_QUOTE');
  }
  if (!Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= Date.now()) {
    throw httpError(409, 'Báo giá chuyến bay đã hết hạn. Vui lòng tìm chuyến lại.', 'FLIGHT_QUOTE_EXPIRED');
  }
  return payload;
}

function isConfigured() {
  return Boolean(ENV.SERPAPI_API_KEY);
}

async function providerFetch(url, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw httpError(504, 'Nguồn tìm kiếm chuyến bay phản hồi quá thời gian.', 'FLIGHT_PROVIDER_TIMEOUT');
    }
    throw httpError(502, 'Không thể kết nối nguồn tìm kiếm chuyến bay.', 'FLIGHT_PROVIDER_UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }
}

function timeFromProvider(value = '') {
  const parts = value.trim().split(/\s+/);
  return parts.length > 1 ? parts.at(-1).slice(0, 5) : value.slice(0, 5);
}

function parseBaggage(offer) {
  const text = [
    ...(offer.extensions || []),
    ...(offer.flights || []).flatMap((flight) => flight.extensions || []),
  ].join(' ').toLowerCase();
  if (/checked baggage (included|free)|hành lý ký gửi.*(bao gồm|miễn phí)/i.test(text)) return 'Đã bao gồm';
  if (/checked baggage for a fee|hành lý ký gửi.*(tính phí|mua thêm)/i.test(text)) return 'Mua thêm';
  return 'Theo điều kiện hãng';
}

function parseRefundable(offer) {
  const text = (offer.extensions || []).join(' ').toLowerCase();
  if (/non-refundable|không hoàn/i.test(text)) return false;
  if (/refundable|được hoàn/i.test(text)) return true;
  return null;
}

function normalizeSegment(segment) {
  return {
    carrierName: segment.airline || '',
    number: segment.flight_number || '',
    aircraft: segment.airplane || 'Theo hãng',
    departure: {
      iataCode: segment.departure_airport?.id || '',
      terminal: segment.departure_airport?.terminal || null,
      at: segment.departure_airport?.time || '',
    },
    arrival: {
      iataCode: segment.arrival_airport?.id || '',
      terminal: segment.arrival_airport?.terminal || null,
      at: segment.arrival_airport?.time || '',
    },
    durationMinutes: Number(segment.duration || 0),
  };
}

function normalizeOffer(offer, index, searchId, currency) {
  const segments = (offer.flights || []).map(normalizeSegment);
  const firstSegment = segments[0];
  const lastSegment = segments.at(-1);
  const airlines = [...new Set(segments.map((segment) => segment.carrierName).filter(Boolean))];
  const origin = firstSegment?.departure?.iataCode || '';
  const destination = lastSegment?.arrival?.iataCode || '';

  return {
    id: `${searchId || 'serpapi'}-${index}`,
    provider: 'serpapi',
    airline: airlines.length > 1 ? airlines.join(' + ') : airlines[0] || 'Hãng bay',
    airlineCode: firstSegment?.number?.split(' ')?.[0] || '',
    airlineLogo: offer.airline_logo || offer.flights?.[0]?.airline_logo || null,
    code: firstSegment?.number || airlines[0] || 'Chuyến bay',
    origin,
    destination,
    originAirport: getVietnamAirport(origin) || null,
    destinationAirport: getVietnamAirport(destination) || null,
    depart: timeFromProvider(firstSegment?.departure?.at),
    arrive: timeFromProvider(lastSegment?.arrival?.at),
    departAt: firstSegment?.departure?.at || '',
    arriveAt: lastSegment?.arrival?.at || '',
    durationMinutes: Number(offer.total_duration || segments.reduce((sum, segment) => sum + segment.durationMinutes, 0)),
    stops: Math.max(0, segments.length - 1),
    price: Number(offer.price || 0),
    totalPrice: 0,
    currency,
    baggage: parseBaggage(offer),
    cabinBag: 'Theo điều kiện hãng',
    aircraft: firstSegment?.aircraft || 'Theo hãng',
    seatsLeft: 0,
    refundable: parseRefundable(offer),
    cabin: firstSegment?.travel_class || offer.flights?.[0]?.travel_class || '',
    bookingToken: offer.booking_token || null,
    departureToken: offer.departure_token || null,
    carbonEmissions: offer.carbon_emissions || null,
    segments,
    outbound: { durationMinutes: Number(offer.total_duration || 0), stops: Math.max(0, segments.length - 1), segments },
    inbound: null,
  };
}

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of searchCache) {
    if (entry.expiresAt <= now) searchCache.delete(key);
  }
  while (searchCache.size >= SEARCH_CACHE_LIMIT) searchCache.delete(searchCache.keys().next().value);
}

function cacheKey(query) {
  return JSON.stringify({
    origin: query.origin,
    destination: query.destination,
    departure_date: query.departure_date,
    return_date: query.return_date || '',
    adults: query.adults,
    children: query.children,
    infants: query.infants,
    travel_class: query.travel_class,
    non_stop: query.non_stop,
  });
}

export function getStatus() {
  return {
    configured: isConfigured(),
    provider: 'serpapi',
    source: 'Google Flights',
    environment: 'free',
    live: isConfigured(),
    monthlyFreeSearches: 250,
    cacheMinutes: SEARCH_CACHE_TTL_MS / 60000,
  };
}

export function getAirports() {
  return VIETNAM_AIRPORTS;
}

export async function searchFlights(query) {
  if (!VIETNAM_AIRPORT_CODES.has(query.origin) || !VIETNAM_AIRPORT_CODES.has(query.destination)) {
    throw httpError(400, 'Điểm đi và điểm đến phải là sân bay tại Việt Nam.', 'UNSUPPORTED_AIRPORT');
  }
  if (!isConfigured()) {
    throw httpError(503, 'Nguồn Google Flights chưa được cấu hình. Vui lòng thêm SERPAPI_API_KEY ở backend.', 'FLIGHT_API_NOT_CONFIGURED');
  }

  const key = cacheKey(query);
  const cached = searchCache.get(key);
  if (cached?.expiresAt > Date.now()) return { ...cached.value, cached: true };

  const travelClassMap = { ECONOMY: '1', PREMIUM_ECONOMY: '2', BUSINESS: '3', FIRST: '4' };
  const params = new URLSearchParams({
    engine: 'google_flights',
    api_key: ENV.SERPAPI_API_KEY,
    departure_id: query.origin,
    arrival_id: query.destination,
    outbound_date: query.departure_date,
    type: query.return_date ? '1' : '2',
    travel_class: travelClassMap[query.travel_class] || '1',
    adults: String(query.adults),
    children: String(query.children),
    infants_on_lap: String(query.infants),
    currency: 'VND',
    gl: 'vn',
    hl: 'vi',
    sort_by: '1',
  });
  if (query.return_date) params.set('return_date', query.return_date);
  if (query.non_stop) params.set('stops', '1');

  const response = await providerFetch(`${SERPAPI_URL}?${params.toString()}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const status = response.status === 429 ? 429 : response.status === 400 ? 400 : 502;
    const code = response.status === 429 ? 'FLIGHT_FREE_QUOTA_EXCEEDED' : 'FLIGHT_PROVIDER_ERROR';
    throw httpError(status, payload.error || 'Google Flights không thể trả kết quả cho hành trình này.', code);
  }

  const rawOffers = [...(payload.best_flights || []), ...(payload.other_flights || [])];
  const offers = rawOffers
    .slice(0, query.max)
    .map((offer, index) => normalizeOffer(offer, index, payload.search_metadata?.id, 'VND'))
    .filter((offer) => offer.origin && offer.destination && offer.price > 0)
    .map((offer) => ({ ...offer, quoteToken: createFlightQuoteToken(offer, query) }));
  const result = {
    provider: 'serpapi',
    source: 'Google Flights',
    environment: 'free',
    live: true,
    cached: false,
    offers,
    meta: { searchId: payload.search_metadata?.id || null, priceInsights: payload.price_insights || null },
  };

  pruneCache();
  searchCache.set(key, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, value: result });
  return result;
}
