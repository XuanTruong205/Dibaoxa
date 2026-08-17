import {
  Anchor,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  Ship,
  Sparkles,
  Star,
  UsersRound,
  WalletCards,
  Waves,
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
  ResultsPagination,
  ResultsToolbar,
  formatMoney,
  getDateFromToday,
  useFavoriteIds,
} from '../components/travel/TravelSearchUI';
import { CRUISE_DESTINATIONS } from '../data/travelCatalog';
import { cachedGet } from '../services/api';

const TODAY = getDateFromToday(0);
const PAGE_SIZE = 5;
const FEATURES = ['Ban công riêng', 'Chèo kayak', 'Spa', 'Bữa ăn trọn gói', 'Lặn ống thở', 'Bể bơi', 'Phòng gia đình'];
const DEFAULT_FILTERS = { maxPrice: 10000000, minRating: 0, shipClass: 0, feature: '' };

function CruiseFilters({ filters, setFilters, mobileOpen, onClose, onReset }) {
  return (
    <aside className={`travel-filter-panel ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="Bộ lọc du thuyền">
      <div className="travel-filter-panel__heading"><div><strong>Lọc kết quả</strong><span>Tìm hải trình phù hợp</span></div><button type="button" onClick={onClose} aria-label="Đóng bộ lọc"><X /></button></div>
      <div className="travel-filter-group"><label htmlFor="cruise-max-price">Ngân sách mỗi khách</label><strong>Tối đa {formatMoney(filters.maxPrice)}</strong><input id="cruise-max-price" type="range" min="1500000" max="10000000" step="250000" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))} /></div>
      <div className="travel-filter-group"><label htmlFor="cruise-rating">Điểm đánh giá</label><select id="cruise-rating" className="glass-input" value={filters.minRating} onChange={(event) => setFilters((current) => ({ ...current, minRating: Number(event.target.value) }))}><option value="0">Tất cả đánh giá</option><option value="9">Từ 9.0</option><option value="8.5">Từ 8.5</option></select></div>
      <div className="travel-filter-group"><label htmlFor="cruise-class">Xếp hạng sao</label><select id="cruise-class" className="glass-input" value={filters.shipClass} onChange={(event) => setFilters((current) => ({ ...current, shipClass: Number(event.target.value) }))}><option value="0">Tất cả hạng</option><option value="5">5 sao</option><option value="4">4 sao</option></select></div>
      <div className="travel-filter-group"><label htmlFor="cruise-feature">Tiện ích</label><select id="cruise-feature" className="glass-input" value={filters.feature} onChange={(event) => setFilters((current) => ({ ...current, feature: event.target.value }))}><option value="">Không giới hạn</option>{FEATURES.map((feature) => <option key={feature}>{feature}</option>)}</select></div>
      <button type="button" className="travel-filter-reset" onClick={onReset}>Đặt lại bộ lọc</button>
    </aside>
  );
}

export default function CruisesPage({ onViewPlans, onSelectCruise, onLogin, initialDestination = 'all' }) {
  const reduceMotion = useReducedMotion();
  const resultsRef = useRef(null);
  const { ids: favoriteIds, toggle: toggleFavorite } = useFavoriteIds('dibaoxa_favorite_cruises');
  const initialSearch = { keyword: '', destination: initialDestination, budget: 'all', departDate: getDateFromToday(21), guests: 2, duration: 0 };
  const [draft, setDraft] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('recommended');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [selection, setSelection] = useState(null);
  const [cruises, setCruises] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    cachedGet('/cruises')
      .then((response) => {
        const items = response?.data?.data;
        if (active && Array.isArray(items)) setCruises(items);
      })
      .catch(() => { if (active) setCruises([]); })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = window.setTimeout(() => setLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, [loading, search]);

  const destinations = useMemo(() => [...new Set([...CRUISE_DESTINATIONS, ...cruises.map((item) => item.destination)])], [cruises]);

  const results = useMemo(() => cruises
    .filter((cruise) => !search.keyword.trim() || `${cruise.name} ${cruise.operator}`.toLocaleLowerCase('vi').includes(search.keyword.trim().toLocaleLowerCase('vi')))
    .filter((cruise) => search.destination === 'all' || cruise.destination === search.destination)
    .filter((cruise) => search.budget === 'all' || cruise.price <= Number(search.budget))
    .filter((cruise) => !search.duration || cruise.durationDays === Number(search.duration))
    .filter((cruise) => cruise.price <= filters.maxPrice)
    .filter((cruise) => cruise.rating >= filters.minRating)
    .filter((cruise) => !filters.shipClass || cruise.shipClass === filters.shipClass)
    .filter((cruise) => !filters.feature || cruise.features.includes(filters.feature))
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return b.rating - a.rating || a.price - b.price;
    }), [cruises, search, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [filters, sort, search]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const submitSearch = (event) => {
    event.preventDefault();
    setSearch({ ...draft });
    setLoading(true);
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 60);
  };

  const resetAll = () => {
    const resetSearch = { ...initialSearch, keyword: '', destination: 'all', budget: 'all' };
    setDraft(resetSearch);
    setSearch(resetSearch);
    setFilters(DEFAULT_FILTERS);
  };

  const chooseCruise = (cruise, cabin = cruise.cabins[0]) => {
    setSelection({
      type: 'cruise',
      title: `${cruise.name}, cabin ${cabin}`,
      summary: `${cruise.destination}, ${cruise.durationDays} ngày ${cruise.durationDays - 1} đêm. Khởi hành ${search.departDate} cho ${search.guests} khách.`,
      totalPrice: cruise.price * search.guests,
      item: { ...cruise, selectedCabin: cabin },
      search,
    });
  };

  return (
    <div className="reference-cruise-page">
      <CatalogMediaHero
        variant="cruise"
        titleId="cruise-search-title"
        title="Bạn lựa chọn du thuyền nào?"
        description="Những hải trình được tuyển chọn đang chờ bạn khám phá."
        mediaType="video"
        src="/videos/dibaoxa-cruise-catalog-hero.mp4"
        poster="/images/dibaoxa-cruise-hero.png"
        alt="Du thuyền Dibaoxa di chuyển giữa khung cảnh biển Việt Nam"
      >
        <form className="reference-cruise-search" onSubmit={submitSearch}>
          <div className="reference-cruise-search__primary">
            <label><Search /><span><small>Tên du thuyền</small><input type="search" value={draft.keyword} onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))} placeholder="Nhập tên du thuyền" /></span></label>
            <label><MapPin /><span><small>Điểm đến</small><select value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))}><option value="all">Tất cả địa điểm</option>{destinations.map((destination) => <option key={destination}>{destination}</option>)}</select></span></label>
            <label><WalletCards /><span><small>Mức giá</small><select value={draft.budget} onChange={(event) => setDraft((current) => ({ ...current, budget: event.target.value }))}><option value="all">Tất cả mức giá</option><option value="4000000">Dưới 4 triệu</option><option value="6000000">Dưới 6 triệu</option><option value="8000000">Dưới 8 triệu</option></select></span></label>
            <button type="submit" className="btn-primary">Tìm kiếm</button>
          </div>
          <div className="reference-cruise-search__secondary">
            <label><CalendarDays /><span>Khởi hành</span><input type="date" min={TODAY} value={draft.departDate} onChange={(event) => setDraft((current) => ({ ...current, departDate: event.target.value }))} /></label>
            <label><Clock3 /><span>Thời lượng</span><select value={draft.duration} onChange={(event) => setDraft((current) => ({ ...current, duration: Number(event.target.value) }))}><option value="0">Mọi thời lượng</option><option value="1">Trong ngày</option><option value="2">2 ngày 1 đêm</option><option value="3">3 ngày 2 đêm</option></select></label>
            <label><UsersRound /><span>Số khách</span><select value={draft.guests} onChange={(event) => setDraft((current) => ({ ...current, guests: Number(event.target.value) }))}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} khách</option>)}</select></label>
          </div>
        </form>
      </CatalogMediaHero>

      <section className="reference-cruise-results" ref={resultsRef} aria-label="Kết quả du thuyền">
        <header className="reference-cruise-results__header"><div><span>Kết quả tìm kiếm</span><h2>Tìm thấy {results.length} du thuyền</h2><p>Giá mỗi khách, cabin và lịch trình sẽ được xác nhận trước thanh toán.</p></div><button type="button" className="btn-secondary" onClick={resetAll}>Đặt lại tìm kiếm</button></header>
        <div className="travel-results-layout">
          <CruiseFilters filters={filters} setFilters={setFilters} mobileOpen={mobileFilters} onClose={() => setMobileFilters(false)} onReset={() => setFilters(DEFAULT_FILTERS)} />
          <div className="travel-results-main">
            <ResultsToolbar count={results.length} sort={sort} onSort={setSort} onOpenFilters={() => setMobileFilters(true)} resultLabel="hải trình" />
            {(loading || catalogLoading) ? <ResultsSkeleton variant="cruise" /> : results.length === 0 ? <EmptyResults title="Chưa có hải trình phù hợp" description="Hãy đổi từ khóa, địa điểm hoặc nới mức giá." onReset={resetAll} /> : (
              <motion.div className="travel-results-list travel-results-list--cruise" layout={!reduceMotion}>
                <AnimatePresence mode="popLayout">
                  {visibleResults.map((cruise) => (
                    <motion.article
                      className="cruise-result reference-cruise-card"
                      key={cruise.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Xem chi tiết ${cruise.name}`}
                      layout={!reduceMotion}
                      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onClick={(event) => {
                        if (event.target.closest('button, a, input, select')) return;
                        onSelectCruise?.(cruise.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
                        event.preventDefault();
                        onSelectCruise?.(cruise.id);
                      }}
                    >
                      <div className="cruise-result__media"><img src={cruise.image} alt={`Hành trình ${cruise.name}`} loading="lazy" /><FavoriteButton active={favoriteIds.includes(cruise.id)} onClick={() => toggleFavorite(cruise.id)} label={cruise.name} /></div>
                      <div className="cruise-result__body">
                        <div className="cruise-result__meta"><span><MapPin /> {cruise.destination}</span><span><Clock3 /> {cruise.durationDays} ngày {cruise.durationDays - 1} đêm</span></div>
                        <h2>{cruise.name}</h2><p>Khởi hành từ {cruise.departurePort}. Vận hành bởi {cruise.operator}.</p>
                        <div className="cruise-result__rating"><strong>{cruise.rating}</strong><span>Tuyệt hảo<small>{cruise.reviews} đánh giá</small></span></div>
                        <div className="cruise-result__features">{cruise.features.slice(0, 4).map((feature) => <span key={feature}><Check /> {feature}</span>)}</div>
                        <button type="button" className="cruise-result__details" onClick={() => onSelectCruise?.(cruise.id)}>Xem lịch trình và cabin <ChevronRight /></button>
                      </div>
                      <div className="cruise-result__price"><span>Giá từ mỗi khách</span><strong>{formatMoney(cruise.price)}</strong><small>{search.guests} khách, khởi hành {search.departDate}</small><button type="button" className="btn-primary" onClick={() => chooseCruise(cruise)}>Chọn hải trình <ArrowRight /></button></div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
            <ResultsPagination page={page} pageCount={pageCount} onChange={(nextPage) => { setPage(nextPage); resultsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }} />
          </div>
        </div>
      </section>

      <section className="cruise-assurance reference-cruise-assurance" aria-labelledby="cruise-assurance-title"><div><Anchor /><h2 id="cruise-assurance-title">Chuẩn bị trước khi lên tàu</h2></div><p><Sparkles /> Dibaoxa lưu cabin, ghi chú nhu cầu ăn uống và xác nhận lịch trình với đơn vị vận hành.</p><p><Ship /> Vé điện tử, giờ đón và hướng dẫn cảng được cập nhật trong hành trình.</p><p><Waves /> Thay đổi do thời tiết sẽ được thông báo ngay khi nhận tin từ ban quản lý vịnh.</p></section>
      <PlanDialog selection={selection} onClose={() => setSelection(null)} onViewPlans={onViewPlans} onLogin={onLogin} />
    </div>
  );
}
