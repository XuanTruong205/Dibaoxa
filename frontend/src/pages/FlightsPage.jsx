import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  Check,
  Clock3,
  Luggage,
  Plane,
  Search,
  Server,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import CatalogMediaHero from '../components/travel/CatalogMediaHero';
import {
  EmptyResults,
  FavoriteButton,
  PlanDialog,
  ResultsSkeleton,
  ResultsToolbar,
  formatMoney,
  getDateFromToday,
  useFavoriteIds,
} from '../components/travel/TravelSearchUI';
import { AIRPORTS } from '../data/travelCatalog';
import api from '../services/api';

const TODAY = getDateFromToday(0);
const DEFAULT_FILTERS = { maxPrice: 20000000, airline: 'all', period: 'all', refundable: false, baggage: false };
const CABIN_CLASSES = { economy: 'ECONOMY', premium: 'PREMIUM_ECONOMY', business: 'BUSINESS' };
function airportLabel(code, airports = AIRPORTS) {
  const airport = airports.find((item) => item.code === code);
  return airport ? `${airport.name} (${airport.code})` : code;
}

function formatDuration(minutes = 0) {
  return `${Math.floor(minutes / 60)}g ${minutes % 60 ? `${minutes % 60}p` : ''}`.trim();
}

function passengerCount(search) {
  return search.adults + search.children + search.infants;
}

function FlightFilters({ filters, setFilters, airlines, mobileOpen, onClose, onReset }) {
  return (
    <aside className={`travel-filter-panel ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="Bộ lọc chuyến bay">
      <div className="travel-filter-panel__heading"><div><strong>Lọc kết quả</strong><span>Chọn chuyến phù hợp</span></div><button type="button" onClick={onClose} aria-label="Đóng bộ lọc"><X /></button></div>
      <div className="travel-filter-group"><label htmlFor="flight-max-price">Ngân sách mỗi khách</label><strong>Tối đa {formatMoney(filters.maxPrice)}</strong><input id="flight-max-price" type="range" min="750000" max="20000000" step="250000" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))} /></div>
      <div className="travel-filter-group"><label htmlFor="flight-airline">Hãng bay</label><select id="flight-airline" className="glass-input" value={filters.airline} onChange={(event) => setFilters((current) => ({ ...current, airline: event.target.value }))}><option value="all">Tất cả hãng</option>{airlines.map((airline) => <option key={airline}>{airline}</option>)}</select></div>
      <div className="travel-filter-group"><label htmlFor="flight-period">Giờ khởi hành</label><select id="flight-period" className="glass-input" value={filters.period} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}><option value="all">Cả ngày</option><option value="morning">Sáng, trước 12:00</option><option value="afternoon">Chiều, 12:00 - 17:59</option><option value="evening">Tối, từ 18:00</option></select></div>
      <label className="travel-check"><input type="checkbox" checked={filters.refundable} onChange={(event) => setFilters((current) => ({ ...current, refundable: event.target.checked }))} /><span><Check /> Có thể hoàn vé</span></label>
      <label className="travel-check"><input type="checkbox" checked={filters.baggage} onChange={(event) => setFilters((current) => ({ ...current, baggage: event.target.checked }))} /><span><Luggage /> Có hành lý ký gửi</span></label>
      <button type="button" className="travel-filter-reset" onClick={onReset}>Đặt lại bộ lọc</button>
    </aside>
  );
}

export default function FlightsPage({ onViewPlans, onLogin }) {
  const reduceMotion = useReducedMotion();
  const resultsRef = useRef(null);
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavoriteIds('dibaoxa_favorite_flights');
  const initialSearch = { tripType: 'round-trip', origin: 'SGN', destination: 'DAD', departDate: getDateFromToday(14), returnDate: getDateFromToday(18), adults: 1, children: 0, infants: 0, cabin: 'economy' };
  const [draft, setDraft] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [airports, setAirports] = useState(AIRPORTS);
  const [offers, setOffers] = useState([]);
  const [providerStatus, setProviderStatus] = useState({ configured: false, provider: 'serpapi', source: 'Google Flights', environment: 'free', live: false });
  const [providerMeta, setProviderMeta] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('recommended');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [selection, setSelection] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get('/flights/status'), api.get('/flights/airports'), api.get('/hotels/featured-reviews', { params: { limit: 3 } })]).then(([statusResult, airportsResult, reviewsResult]) => {
      if (!active) return;
      if (statusResult.status === 'fulfilled') setProviderStatus(statusResult.value.data.data);
      if (airportsResult.status === 'fulfilled' && airportsResult.value.data.data?.length) setAirports(airportsResult.value.data.data);
      if (reviewsResult.status === 'fulfilled' && Array.isArray(reviewsResult.value.data.data)) setReviews(reviewsResult.value.data.data);
    });
    return () => { active = false; };
  }, []);

  const airlines = useMemo(() => [...new Set(offers.map((flight) => flight.airline).filter(Boolean))].sort(), [offers]);
  const results = useMemo(() => offers
    .filter((flight) => flight.price <= filters.maxPrice)
    .filter((flight) => filters.airline === 'all' || flight.airline === filters.airline)
    .filter((flight) => {
      const hour = Number(flight.depart?.split(':')[0] || 0);
      if (filters.period === 'morning') return hour < 12;
      if (filters.period === 'afternoon') return hour >= 12 && hour < 18;
      if (filters.period === 'evening') return hour >= 18;
      return true;
    })
    .filter((flight) => !filters.refundable || flight.refundable === true)
    .filter((flight) => !filters.baggage || !flight.baggage.toLowerCase().includes('theo điều kiện'))
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'departure') return a.depart.localeCompare(b.depart);
      if (sort === 'duration') return a.durationMinutes - b.durationMinutes;
      return a.stops - b.stops || a.price - b.price;
    }), [offers, filters, sort]);

  const executeSearch = async (nextSearch) => {
    setLoading(true);
    setLoadError('');
    setOffers([]);
    setProviderMeta(null);
    try {
      const response = await api.get('/flights/search', { params: {
        origin: nextSearch.origin,
        destination: nextSearch.destination,
        departure_date: nextSearch.departDate,
        return_date: nextSearch.tripType === 'round-trip' ? nextSearch.returnDate : undefined,
        adults: nextSearch.adults,
        children: nextSearch.children,
        infants: nextSearch.infants,
        travel_class: CABIN_CLASSES[nextSearch.cabin],
        max: 50,
      } });
      setOffers(response.data.data || []);
      setProviderMeta(response.data.provider || null);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (draft.origin === draft.destination) return setFormError('Điểm đi và điểm đến cần khác nhau.');
    if (draft.infants > draft.adults) return setFormError('Mỗi em bé cần đi cùng ít nhất một người lớn.');
    if (passengerCount(draft) > 9) return setFormError('Mỗi lần tìm hỗ trợ tối đa 9 hành khách.');
    if (draft.tripType === 'round-trip' && new Date(draft.returnDate) <= new Date(draft.departDate)) return setFormError('Ngày về phải sau ngày đi.');
    const nextSearch = { ...draft };
    setFormError('');
    setSearch(nextSearch);
    setHasSearched(true);
    executeSearch(nextSearch);
    window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
  };

  const swapAirports = () => setDraft((current) => ({ ...current, origin: current.destination, destination: current.origin }));
  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const chooseFlight = (flight) => setSelection({
    type: 'flight',
    title: `${flight.code}: ${airportLabel(flight.origin, airports)} đến ${airportLabel(flight.destination, airports)}`,
    summary: `${search.departDate}${search.tripType === 'round-trip' ? `, về ${search.returnDate}` : ''}. ${passengerCount(search)} hành khách, ${search.cabin}.`,
    totalPrice: flight.totalPrice || flight.price * Math.max(1, search.adults + search.children),
    item: flight,
    search,
  });
  const review = reviews[reviewIndex];

  return (
    <div className="reference-flight-page">
      <CatalogMediaHero
        variant="flight"
        titleId="flight-page-title"
        title="Bạn lựa chọn chuyến bay nào?"
        description="So sánh giờ bay, hành lý và mức giá phù hợp trong một lần tìm kiếm."
        mediaType="video"
        src="/videos/dibaoxa-cruise-hero.mp4"
        poster="/images/dibaoxa-flight-hero.png"
        alt="Hành trình du lịch Dibaoxa mở đầu trang vé máy bay"
      >
        <form className="reference-flight-search" onSubmit={submitSearch}>
          <div className="reference-flight-search__tabs" role="radiogroup" aria-label="Loại hành trình">
            {[['one-way', 'Một chiều'], ['round-trip', 'Khứ hồi']].map(([value, label]) => <label key={value} className={draft.tripType === value ? 'is-active' : ''}><input type="radio" name="trip-type" value={value} checked={draft.tripType === value} onChange={(event) => setDraft((current) => ({ ...current, tripType: event.target.value }))} />{label}</label>)}
          </div>
          <div className="reference-flight-search__route">
            <label><span><Plane /> Điểm đi</span><select value={draft.origin} onChange={(event) => setDraft((current) => ({ ...current, origin: event.target.value }))}>{airports.map((airport) => <option key={airport.code} value={airport.code}>{airport.name} ({airport.code}) - {airport.city}</option>)}</select></label>
            <button type="button" className="reference-airport-swap" onClick={swapAirports} aria-label="Đổi điểm đi và điểm đến"><ArrowRightLeft /></button>
            <label><span><Plane /> Điểm đến</span><select value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))}>{airports.map((airport) => <option key={airport.code} value={airport.code}>{airport.name} ({airport.code}) - {airport.city}</option>)}</select></label>
            <label><span><CalendarDays /> Ngày đi</span><input type="date" min={TODAY} value={draft.departDate} onChange={(event) => setDraft((current) => ({ ...current, departDate: event.target.value }))} /></label>
            <label className={draft.tripType !== 'round-trip' ? 'is-disabled' : ''}><span><CalendarDays /> Ngày về</span><input type="date" min={draft.departDate} value={draft.returnDate} disabled={draft.tripType !== 'round-trip'} onChange={(event) => setDraft((current) => ({ ...current, returnDate: event.target.value }))} /></label>
          </div>
          <div className="reference-flight-search__options">
            <label><span>Người lớn</span><select value={draft.adults} onChange={(event) => setDraft((current) => ({ ...current, adults: Number(event.target.value) }))}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Trẻ em</span><select value={draft.children} onChange={(event) => setDraft((current) => ({ ...current, children: Number(event.target.value) }))}>{[0, 1, 2, 3, 4].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Em bé</span><select value={draft.infants} onChange={(event) => setDraft((current) => ({ ...current, infants: Number(event.target.value) }))}>{[0, 1, 2, 3].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Hạng ghế</span><select value={draft.cabin} onChange={(event) => setDraft((current) => ({ ...current, cabin: event.target.value }))}><option value="economy">Phổ thông</option><option value="premium">Phổ thông đặc biệt</option><option value="business">Thương gia</option></select></label>
            <button type="submit" className="btn-primary" disabled={loading}><Search /> {loading ? 'Đang tìm...' : 'Tìm chuyến bay'}</button>
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
        </form>
      </CatalogMediaHero>

      <section className={`reference-results-section ${hasSearched ? 'has-searched' : ''}`} ref={resultsRef} aria-label="Kết quả chuyến bay">
        <div className="reference-results-heading"><div><span>Kết quả hành trình</span><h2>{airportLabel(search.origin, airports)} đến {airportLabel(search.destination, airports)}</h2><p>{search.departDate}{search.tripType === 'round-trip' ? `, ngày về ${search.returnDate}` : ''} · {passengerCount(search)} hành khách</p></div><strong>{results.length} chuyến bay</strong></div>
        <div className="travel-results-layout">
          <FlightFilters filters={filters} setFilters={setFilters} airlines={airlines} mobileOpen={mobileFilters} onClose={() => setMobileFilters(false)} onReset={resetFilters} />
          <div className="travel-results-main">
            <ResultsToolbar count={results.length} sort={sort} onSort={setSort} onOpenFilters={() => setMobileFilters(true)} resultLabel="chuyến bay" sortOptions={[{ value: 'recommended', label: 'Đề xuất' }, { value: 'price-asc', label: 'Giá thấp nhất' }, { value: 'departure', label: 'Khởi hành sớm' }, { value: 'duration', label: 'Bay nhanh nhất' }]} />
            <p className={`travel-data-note ${providerMeta?.live ? 'is-live' : ''}`}><Server /> {providerMeta?.live ? `${providerMeta.cached ? 'Kết quả đã lưu tạm' : 'Kết quả mới'} từ Google Flights qua SerpApi.` : providerStatus.configured ? 'SerpApi đã được kết nối. Hãy tìm một hành trình để xem giá.' : 'Chưa cấu hình SERPAPI_API_KEY ở máy chủ; danh sách sân bay vẫn có thể sử dụng.'}</p>
            {loading ? <ResultsSkeleton variant="flight" /> : loadError ? (
              <div className="travel-empty travel-api-error" role="alert"><span><AlertCircle /></span><h2>Chưa thể tải chuyến bay thật</h2><p>{loadError}</p><button type="button" className="btn-secondary" onClick={() => executeSearch(search)}>Thử lại</button></div>
            ) : !hasSearched ? (
              <div className="travel-empty"><img className="travel-empty__illustration" src="/images/dibaoxa-flight-empty.png" alt="Nhân vật Dibaoxa đang tìm chuyến đi bằng bản đồ và kính lúp" loading="lazy" decoding="async" /><h2>Chọn hành trình của bạn</h2><p>Dibaoxa sẽ gửi yêu cầu trực tiếp tới nhà cung cấp vé sau khi bạn bấm tìm.</p></div>
            ) : results.length === 0 ? <EmptyResults title="Chưa có chuyến bay phù hợp" description="Nhà cung cấp chưa trả về chuyến bay cho hành trình này hoặc bộ lọc đang quá hẹp." onReset={resetFilters} imageSrc="/images/dibaoxa-flight-empty.png" imageAlt="Nhân vật Dibaoxa đang tìm chuyến bay phù hợp" /> : (
              <motion.div className="travel-results-list travel-results-list--flight" layout={!reduceMotion}>
                <AnimatePresence mode="popLayout">
                  {results.map((flight) => (
                    <motion.article className="flight-result" key={flight.id} layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                      <div className="flight-result__airline"><span><Plane /></span><div><strong>{flight.airline}</strong><small>{flight.code} · {flight.aircraft}</small></div><FavoriteButton active={favoriteIds.includes(flight.id)} onClick={() => toggleFavorite(flight.id)} label={flight.code} /></div>
                      <div className="flight-result__route"><div><strong>{flight.depart}</strong><span>{flight.origin}</span><small>{airports.find((item) => item.code === flight.origin)?.city}</small></div><div className="flight-result__line"><span>{formatDuration(flight.durationMinutes)}</span><i /><small>{flight.stops ? `${flight.stops} điểm dừng` : 'Bay thẳng'}</small></div><div><strong>{flight.arrive}</strong><span>{flight.destination}</span><small>{airports.find((item) => item.code === flight.destination)?.city}</small></div></div>
                      <div className="flight-result__benefits"><span><Luggage /> Xách tay {flight.cabinBag}</span><span><Luggage /> Ký gửi {flight.baggage}</span><span><ShieldCheck /> {flight.refundable === true ? 'Có thể hoàn vé' : flight.refundable === false ? 'Không hoàn vé' : 'Điều kiện hoàn theo hãng'}</span>{flight.seatsLeft > 0 && <span><Clock3 /> Còn {flight.seatsLeft} chỗ mức giá này</span>}</div>
                      <div className="flight-result__price"><span>Giá mỗi hành khách</span><strong>{formatMoney(flight.price)}</strong><small>Giá và chỗ có thể thay đổi khi xác nhận</small><button type="button" className="btn-primary" onClick={() => chooseFlight(flight)}>Chọn chuyến <ArrowRight /></button></div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {review && <section className="reference-flight-review" aria-labelledby="flight-review-title">
        <div className="reference-flight-review__image"><img src="/images/dibaoxa-discover-vietnam.webp" alt="Gia đình trải nghiệm chuyến đi tại Việt Nam" loading="lazy" /></div>
        <motion.div key={review.id} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}><span>Đánh giá từ người đã trải nghiệm</span><h2 id="flight-review-title">Trải nghiệm thật từ khách hàng Dibaoxa.</h2><blockquote>“{review.comment}”</blockquote><strong>{review.user?.full_name || 'Khách hàng Dibaoxa'}</strong><small>{review.hotel?.name}{review.hotel?.city ? `, ${review.hotel.city}` : ''}</small><div>{reviews.map((item, index) => <button type="button" key={item.id} className={index === reviewIndex ? 'is-active' : ''} onClick={() => setReviewIndex(index)} aria-label={`Xem đánh giá ${index + 1}`}><Star /></button>)}</div></motion.div>
      </section>}

      <section className="reference-airline-network" aria-labelledby="airline-network-title"><div><span>Hạ tầng tìm kiếm</span><h2 id="airline-network-title">Dữ liệu thật, phạm vi nội địa rõ ràng.</h2></div><div><article><Server /><strong>Google Flights qua SerpApi</strong><small>{providerStatus.configured ? `Đã kết nối · lưu tạm ${providerStatus.cacheMinutes || 10} phút để tiết kiệm quota` : 'Đang chờ cấu hình API key miễn phí'}</small></article><article><Plane /><strong>{airports.length} sân bay Việt Nam</strong><small>Tên sân bay, thành phố và mã IATA đầy đủ</small></article></div></section>
      <PlanDialog selection={selection} onClose={() => setSelection(null)} onViewPlans={onViewPlans} onLogin={onLogin} />
    </div>
  );
}
