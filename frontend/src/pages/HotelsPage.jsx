import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  MapPin,
  Search,
  Star,
  UsersRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import CatalogMediaHero from '../components/travel/CatalogMediaHero';
import {
  EmptyResults,
  FavoriteButton,
  ResultsSkeleton,
  ResultsPagination,
  ResultsToolbar,
  formatMoney,
  getDateFromToday,
  useFavoriteIds,
} from '../components/travel/TravelSearchUI';
import { cachedGet } from '../services/api';

const TODAY = getDateFromToday(0);
const PAGE_SIZE = 5;
const DEFAULT_FILTERS = { maxPrice: 10000000, minRating: 0, stars: '', stayType: 'all', amenity: '' };

function normalizeSearchText(value) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}

function HotelFilters({ filters, setFilters, onReset, mobileOpen, onClose }) {
  return (
    <aside className={`travel-filter-panel ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="Bộ lọc khách sạn">
      <div className="travel-filter-panel__heading">
        <div><strong>Bộ lọc</strong><span>Thu hẹp kết quả phù hợp</span></div>
        <button type="button" onClick={onClose} aria-label="Đóng bộ lọc"><X /></button>
      </div>
      <div className="travel-filter-group">
        <label htmlFor="hotel-max-price">Ngân sách mỗi đêm</label>
        <strong>Tối đa {formatMoney(filters.maxPrice)}</strong>
        <input id="hotel-max-price" type="range" min="500000" max="10000000" step="250000" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))} />
      </div>
      <div className="travel-filter-group">
        <label htmlFor="hotel-rating">Điểm đánh giá</label>
        <select id="hotel-rating" className="glass-input" value={filters.minRating} onChange={(event) => setFilters((current) => ({ ...current, minRating: Number(event.target.value) }))}>
          <option value="0">Tất cả đánh giá</option>
          <option value="9">Tuyệt hảo, từ 9.0</option>
          <option value="8">Rất tốt, từ 8.0</option>
          <option value="7">Tốt, từ 7.0</option>
        </select>
      </div>
      <div className="travel-filter-group">
        <label htmlFor="hotel-stars">Hạng khách sạn</label>
        <select id="hotel-stars" className="glass-input" value={filters.stars} onChange={(event) => setFilters((current) => ({ ...current, stars: event.target.value }))}>
          <option value="">Tất cả hạng sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
        </select>
      </div>
      <div className="travel-filter-group">
        <label htmlFor="hotel-stay-type">Loại chỗ nghỉ</label>
        <select id="hotel-stay-type" className="glass-input" value={filters.stayType} onChange={(event) => setFilters((current) => ({ ...current, stayType: event.target.value }))}>
          <option value="all">Tất cả chỗ nghỉ</option>
          <option value="resort">Khu nghỉ dưỡng</option>
          <option value="villa">Villa</option>
          <option value="boutique">Boutique</option>
          <option value="family">Cho gia đình</option>
          <option value="nature">Giữa thiên nhiên</option>
          <option value="beach">Gần biển</option>
        </select>
      </div>
      <div className="travel-filter-group">
        <label htmlFor="hotel-amenity">Tiện nghi ưu tiên</label>
        <select id="hotel-amenity" className="glass-input" value={filters.amenity} onChange={(event) => setFilters((current) => ({ ...current, amenity: event.target.value }))}>
          <option value="">Không giới hạn</option>
          <option value="hồ bơi">Hồ bơi</option>
          <option value="spa">Spa</option>
          <option value="bãi biển">Bãi biển</option>
          <option value="wifi">Wifi miễn phí</option>
          <option value="đưa đón">Đưa đón sân bay</option>
        </select>
      </div>
      <button type="button" className="travel-filter-reset" onClick={onReset}>Xóa tất cả bộ lọc</button>
    </aside>
  );
}

export default function HotelsPage({ onSelectHotel, initialCity = '' }) {
  const reduceMotion = useReducedMotion();
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavoriteIds('dibaoxa_favorite_hotels');
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dateError, setDateError] = useState('');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [sort, setSort] = useState('recommended');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState({
    keyword: '', city: initialCity || 'all', checkIn: getDateFromToday(7), checkOut: getDateFromToday(9), guests: 2, rooms: 1,
  });

  const loadHotels = async () => {
    if (new Date(search.checkOut) <= new Date(search.checkIn)) {
      setDateError('Ngày trả phòng phải sau ngày nhận phòng.');
      return;
    }
    setDateError('');
    setLoading(true);
    setLoadError('');
    try {
      const params = { check_in: search.checkIn, check_out: search.checkOut, limit: 50 };
      if (search.city !== 'all') params.city = search.city;
      const normalizedKeyword = normalizeSearchText(search.keyword);
      if (normalizedKeyword) params.search = normalizedKeyword;
      const response = await cachedGet('/hotels', { params });
      setHotels(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      setHotels([]);
      setLoadError(error.message || 'Không thể tải danh sách khách sạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHotels(); }, []);

  const results = useMemo(() => {
    const filtered = hotels.filter((hotel) => {
      const price = Number(hotel.min_price || 0);
      const amenities = (hotel.amenities || []).join(' ').toLocaleLowerCase('vi');
      if (price && price > filters.maxPrice) return false;
      if (filters.minRating && Number(hotel.avg_rating || 0) < filters.minRating) return false;
      if (filters.stars && Number(hotel.star_rating) !== Number(filters.stars)) return false;
      if (filters.stayType !== 'all' && !hotel.stay_types?.includes(filters.stayType)) return false;
      if (filters.amenity && !amenities.includes(filters.amenity)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'price-asc') return Number(a.min_price || Infinity) - Number(b.min_price || Infinity);
      if (sort === 'price-desc') return Number(b.min_price || 0) - Number(a.min_price || 0);
      if (sort === 'rating') return Number(b.avg_rating || 0) - Number(a.avg_rating || 0);
      return Number(b.review_count || 0) - Number(a.review_count || 0);
    });
  }, [hotels, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filters, sort, search]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const comparedHotels = hotels.filter((hotel) => compareIds.includes(hotel.id));

  const toggleCompare = (hotelId) => {
    setCompareIds((current) => current.includes(hotelId)
      ? current.filter((id) => id !== hotelId)
      : current.length < 3 ? [...current, hotelId] : current);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="travel-search-page reference-hotel-page">
      <CatalogMediaHero
        variant="hotel"
        titleId="hotel-search-title"
        title="Bạn lựa chọn khách sạn nào?"
        description="Hàng nghìn chỗ nghỉ phù hợp đang chờ bạn khám phá."
        mediaType="video"
        src="/videos/dibaoxa-cruise-hero.mp4"
        poster="/images/dibaoxa-coastal-resort.webp"
        alt="Hành trình du lịch Dibaoxa mở đầu trang khách sạn"
      >
        <form className="travel-search-panel catalog-hotel-search" aria-label="Tìm khách sạn" acceptCharset="UTF-8" onSubmit={(event) => { event.preventDefault(); loadHotels(); }}>
          <div className="travel-search-panel__grid travel-search-panel__grid--hotel">
            <label className="field-group"><span><MapPin /> Điểm đến hoặc khách sạn</span><input className="glass-input" type="search" lang="vi" inputMode="search" enterKeyHint="search" autoComplete="off" value={search.keyword} onChange={(event) => setSearch((current) => ({ ...current, keyword: event.target.value }))} placeholder="Ví dụ: Phú Quốc hoặc tên khách sạn" /></label>
            <label className="field-group"><span><Compass /> Thành phố</span><select className="glass-input" value={search.city} onChange={(event) => setSearch((current) => ({ ...current, city: event.target.value }))}><option value="all">Mọi điểm đến</option>{['Đà Nẵng', 'Hà Nội', 'Phú Quốc', 'Đà Lạt', 'Hồ Chí Minh', 'Nha Trang'].map((city) => <option key={city}>{city}</option>)}</select></label>
            <label className="field-group"><span><CalendarDays /> Nhận phòng</span><input className="glass-input" type="date" min={TODAY} value={search.checkIn} onChange={(event) => setSearch((current) => ({ ...current, checkIn: event.target.value }))} /></label>
            <label className="field-group"><span><CalendarDays /> Trả phòng</span><input className="glass-input" type="date" min={search.checkIn} value={search.checkOut} onChange={(event) => setSearch((current) => ({ ...current, checkOut: event.target.value }))} /></label>
            <label className="field-group"><span><UsersRound /> Khách</span><select className="glass-input" value={search.guests} onChange={(event) => setSearch((current) => ({ ...current, guests: Number(event.target.value) }))}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} khách</option>)}</select></label>
            <label className="field-group"><span><BedDouble /> Phòng</span><select className="glass-input" value={search.rooms} onChange={(event) => setSearch((current) => ({ ...current, rooms: Number(event.target.value) }))}>{[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value} phòng</option>)}</select></label>
          </div>
          {dateError && <p className="form-error" role="alert">{dateError}</p>}
          <button type="submit" className="btn-primary"><Search /> Tìm khách sạn</button>
        </form>
      </CatalogMediaHero>

      <section className="travel-results-layout" aria-label="Kết quả khách sạn">
        <HotelFilters filters={filters} setFilters={setFilters} onReset={resetFilters} mobileOpen={mobileFilters} onClose={() => setMobileFilters(false)} />
        <div className="travel-results-main">
          <ResultsToolbar count={results.length} sort={sort} onSort={setSort} onOpenFilters={() => setMobileFilters(true)} resultLabel="chỗ nghỉ" />
          {loading ? <ResultsSkeleton /> : loadError ? (
            <div className="travel-empty" role="alert"><span><Compass /></span><h2>Chưa tải được khách sạn</h2><p>{loadError}</p><button type="button" className="btn-secondary" onClick={loadHotels}>Thử lại</button></div>
          ) : results.length === 0 ? <EmptyResults title="Chưa có chỗ nghỉ phù hợp" description="Hãy nới ngân sách hoặc thay đổi hạng sao và tiện nghi." onReset={resetFilters} /> : (
            <motion.div className="travel-results-list" layout={!reduceMotion}>
              <AnimatePresence mode="popLayout">
                {visibleResults.map((hotel) => (
                  <motion.article key={hotel.id} className="hotel-search-result" layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                    <div className="hotel-search-result__media"><img src={hotel.cover_image || '/images/dibaoxa-coastal-resort.webp'} alt={`Không gian tại ${hotel.name}`} loading="lazy" onError={(event) => { event.currentTarget.src = '/images/dibaoxa-coastal-resort.webp'; }} /><FavoriteButton active={favoriteIds.includes(hotel.id)} onClick={() => toggleFavorite(hotel.id)} label={hotel.name} /></div>
                    <div className="hotel-search-result__body">
                      <div className="hotel-search-result__title"><div><span><MapPin /> {hotel.city}</span><h2>{hotel.name}</h2></div>{hotel.avg_rating ? <strong>{hotel.avg_rating}<small>{hotel.review_count} đánh giá</small></strong> : null}</div>
                      <p>{hotel.description}</p>
                      <div className="hotel-search-result__amenities">{(hotel.amenities || []).slice(0, 4).map((amenity) => <span key={amenity}><Check /> {amenity}</span>)}</div>
                      <div className="hotel-search-result__availability"><span>{hotel.available_rooms_count || 0} phòng còn trống</span><label><input type="checkbox" checked={compareIds.includes(hotel.id)} disabled={!compareIds.includes(hotel.id) && compareIds.length >= 3} onChange={() => toggleCompare(hotel.id)} /> So sánh</label></div>
                    </div>
                    <div className="hotel-search-result__price"><span>Giá từ mỗi đêm</span><strong>{hotel.min_price ? formatMoney(hotel.min_price) : 'Liên hệ'}</strong><small>Cho {search.guests} khách, {search.rooms} phòng</small><button type="button" className="btn-primary" onClick={() => onSelectHotel(hotel.id, search.checkIn, search.checkOut)}>Xem phòng <ChevronRight /></button></div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          <ResultsPagination page={page} pageCount={pageCount} onChange={(nextPage) => { setPage(nextPage); window.scrollTo({ top: 520, behavior: reduceMotion ? 'auto' : 'smooth' }); }} />
        </div>
      </section>

      <AnimatePresence>
        {compareIds.length > 0 && (
          <motion.div className="compare-tray" initial={reduceMotion ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div><strong>Đang so sánh {compareIds.length}/3</strong><span>{comparedHotels.map((hotel) => hotel.name).join(', ')}</span></div>
            <button type="button" className="btn-secondary" onClick={() => setCompareIds([])}>Xóa</button>
            <button type="button" className="btn-primary" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2}>So sánh ngay</button>
          </motion.div>
        )}
      </AnimatePresence>

      {compareOpen && (
        <div className="travel-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCompareOpen(false); }}>
          <section className="hotel-compare-dialog" role="dialog" aria-modal="true" aria-labelledby="compare-title">
            <button type="button" className="travel-dialog__close" onClick={() => setCompareOpen(false)} aria-label="Đóng"><X /></button>
            <h2 id="compare-title">So sánh chỗ nghỉ</h2>
            <div className="hotel-compare-grid">
              {comparedHotels.map((hotel) => <article key={hotel.id}><img src={hotel.cover_image || '/images/dibaoxa-coastal-resort.webp'} alt="" /><h3>{hotel.name}</h3><strong>{formatMoney(hotel.min_price)}</strong><p><Star /> {hotel.avg_rating || 'Mới'} ({hotel.review_count || 0} đánh giá)</p><p><BedDouble /> {hotel.available_rooms_count || 0} phòng trống</p><div>{(hotel.amenities || []).slice(0, 3).map((amenity) => <span key={amenity}><Check /> {amenity}</span>)}</div><button type="button" className="btn-primary" onClick={() => onSelectHotel(hotel.id, search.checkIn, search.checkOut)}>Xem phòng</button></article>)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
