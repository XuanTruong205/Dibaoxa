import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Hotel,
  MapPin,
  Plane,
  Quote,
  Search,
  Ship,
  Star,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { CRUISE_DESTINATIONS } from '../data/travelCatalog';
import api from '../services/api';

const REVIEWS = [
  {
    title: 'Kỳ nghỉ gia đình tại Hạ Long',
    body: 'Tư vấn rất rõ về cabin và lịch trình. Bố mẹ mình thích không gian yên tĩnh, các bé thì mê hoạt động kayak.',
    name: 'Chị Ngọc Anh',
    trip: 'Heritage Dawn Hạ Long',
  },
  {
    title: 'Chuyến đi vừa đủ riêng tư',
    body: 'Đội ngũ hỗ trợ phản hồi nhanh, nhắc giờ đón và chuẩn bị bữa ăn chay đúng yêu cầu của cả nhóm.',
    name: 'Anh Quang Huy',
    trip: 'Lan Hạ Serenity',
  },
  {
    title: 'Lần đầu đi du thuyền rất dễ dàng',
    body: 'Mọi thông tin từ cảng khởi hành đến hạng cabin đều có sẵn. Mình chỉ cần chọn và xác nhận lại.',
    name: 'Bạn Minh Thư',
    trip: 'Sapphire Passage',
  },
];

const DESTINATIONS = [
  { name: 'Vịnh Hạ Long', description: 'Đảo đá vôi, hang động và những đêm yên trên vịnh.', image: '/images/dibaoxa-cruise-hero.png', value: 'Hạ Long' },
  { name: 'Vịnh Lan Hạ', description: 'Làn nước xanh, làng chài và hành trình gần đảo Cát Bà.', image: '/images/dibaoxa-discover-vietnam.webp', value: 'Lan Hạ' },
  { name: 'Miền Tây sông nước', description: 'Chợ nổi, cù lao và nhịp sống chậm dọc sông Mekong.', image: '/images/dibaoxa-dalat-retreat.webp', value: 'Mekong' },
];

const ARTICLES = [
  { id: 1, category: 'Du thuyền', title: 'Chọn hành trình 2 ngày 1 đêm hay 3 ngày 2 đêm?', excerpt: 'So sánh lịch trình, thời gian nghỉ và trải nghiệm phù hợp với từng nhóm khách.', date: '08/08/2026', image: '/images/dibaoxa-cruise-hero.png' },
  { id: 2, category: 'Kinh nghiệm', title: 'Chuẩn bị gì cho chuyến đi Hạ Long đầu tiên', excerpt: 'Danh sách hành lý gọn nhẹ, giấy tờ và những lưu ý về giờ có mặt tại cảng.', date: '02/08/2026', image: '/images/dibaoxa-discover-vietnam.webp' },
  { id: 3, category: 'Lưu trú', title: 'Kết hợp du thuyền và nghỉ dưỡng ven biển', excerpt: 'Gợi ý lịch trình nối liền khách sạn, chuyến bay và một đêm trên vịnh.', date: '25/07/2026', image: '/images/dibaoxa-coastal-resort.webp' },
];

const PARTNERS = [
  { name: 'Heritage Fleet', Icon: Ship },
  { name: 'Northern Sails', Icon: Compass },
  { name: 'Emerald Passage', Icon: Star },
  { name: 'Coastal Journey', Icon: Ship },
  { name: 'Island Passage', Icon: Compass },
  { name: 'Southern River', Icon: Star },
];

function SectionHeading({ title, description, centered = false }) {
  return (
    <div className={`mixi-section-heading ${centered ? 'is-centered' : ''}`}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function CruiseCard({ cruise, onSelectCruise, index }) {
  const reduceMotion = useReducedMotion();
  const specifications = cruise.specifications || {};
  return (
    <motion.article
      className="mixi-product-card"
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.46, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <button type="button" className="mixi-product-card__image" onClick={() => onSelectCruise?.(cruise.id)} aria-label={`Xem ${cruise.name}`}>
        <img src={cruise.image} alt={`Du thuyền ${cruise.name}`} loading="lazy" />
      </button>
      <div className="mixi-product-card__body">
        <div className="mixi-product-card__rating"><Star /><strong>{cruise.rating}</strong><span>({cruise.reviews}) đánh giá</span></div>
        <span className="mixi-product-card__location"><MapPin /> {cruise.destination}</span>
        <h3>{cruise.name}</h3>
        <p>
          {specifications.launchedYear ? `Hạ thủy ${specifications.launchedYear}` : `${cruise.durationDays} ngày ${Math.max(0, cruise.durationDays - 1)} đêm`}
          {' · '}{specifications.hullMaterial || 'Tàu nghỉ dưỡng'}
          {' · '}{specifications.cabinCount ? `${specifications.cabinCount} cabin` : `${cruise.cabins.length} hạng cabin`}
        </p>
        <div className="mixi-product-card__footer">
          <div><strong>{Number(cruise.price).toLocaleString('vi-VN')} đ</strong><span>/ khách</span></div>
          <button type="button" className="btn-primary" onClick={() => onSelectCruise?.(cruise.id)}>Đặt ngay</button>
        </div>
      </div>
    </motion.article>
  );
}

export default function HomePage({ onNavigate, onSelectCruise, onSearchCruises }) {
  const reduceMotion = useReducedMotion();
  const [keyword, setKeyword] = useState('');
  const [destination, setDestination] = useState('all');
  const [budget, setBudget] = useState('all');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [cruises, setCruises] = useState([]);

  useEffect(() => {
    let active = true;
    api.get('/cruises').then((response) => {
      if (active && Array.isArray(response?.data?.data)) setCruises(response.data.data);
    }).catch(() => { if (active) setCruises([]); });
    return () => { active = false; };
  }, []);

  const popularCruises = useMemo(() => cruises
    .filter((cruise) => destination === 'all' || cruise.destination === destination)
    .filter((cruise) => budget === 'all' || cruise.price <= Number(budget))
    .filter((cruise) => !keyword.trim() || cruise.name.toLocaleLowerCase('vi').includes(keyword.trim().toLocaleLowerCase('vi')))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6), [cruises, keyword, destination, budget]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (keyword.trim() && popularCruises.length > 0) {
      onSelectCruise?.(popularCruises[0].id);
      return;
    }
    onSearchCruises?.({ destination });
  };

  const currentReview = REVIEWS[reviewIndex];

  return (
    <div className="mixi-home-page">
      <section className="mixi-home-hero" aria-label="Tìm du thuyền">
        <motion.video
          src="/videos/dibaoxa-cruise-hero.mp4"
          poster="/images/dibaoxa-cruise-hero.png"
          aria-label="Du thuyền hiện đại đi giữa vịnh Hạ Long"
          autoPlay={!reduceMotion}
          loop
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="mixi-home-hero__shade" aria-hidden="true" />
        <form className="mixi-search-box" onSubmit={handleSearch}>
          <div className="mixi-search-box__heading">
            <h1>Bạn lựa chọn du thuyền nào?</h1>
            <p>Những hải trình được tuyển chọn đang chờ bạn khám phá.</p>
          </div>
          <div className="mixi-search-box__fields">
            <label><span className="sr-only">Tên du thuyền</span><Search /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Nhập tên du thuyền" /></label>
            <label><span className="sr-only">Điểm đến</span><MapPin /><select value={destination} onChange={(event) => setDestination(event.target.value)}><option value="all">Tất cả địa điểm</option>{CRUISE_DESTINATIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="sr-only">Mức giá</span><WalletCards /><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="all">Tất cả mức giá</option><option value="4000000">Dưới 4 triệu</option><option value="6000000">Dưới 6 triệu</option><option value="8000000">Dưới 8 triệu</option></select></label>
            <button type="submit" className="btn-primary">Tìm kiếm</button>
          </div>
        </form>
      </section>

      <section className="mixi-service-switcher" aria-label="Dịch vụ Dibaoxa">
        <button type="button" onClick={() => onNavigate?.('cruises')}><Ship /><span><strong>Tìm du thuyền</strong><small>Hạ Long, Lan Hạ, Mekong</small></span><ArrowRight /></button>
        <button type="button" onClick={() => onNavigate?.('flights')}><Plane /><span><strong>Tìm vé máy bay</strong><small>So sánh giờ bay và hành lý</small></span><ArrowRight /></button>
        <button type="button" onClick={() => onNavigate?.('hotels')}><Hotel /><span><strong>Tìm khách sạn</strong><small>Phòng trống và giá rõ ràng</small></span><ArrowRight /></button>
      </section>

      <section className="mixi-home-section mixi-popular-section" aria-labelledby="popular-cruises-title">
        <SectionHeading title="Du thuyền mới và phổ biến" description="Chọn theo hành trình, tiện nghi và ngân sách của bạn." />
        {popularCruises.length ? (
          <div className="mixi-product-grid">{popularCruises.map((cruise, index) => <CruiseCard key={cruise.id} cruise={cruise} onSelectCruise={onSelectCruise} index={index} />)}</div>
        ) : (
          <div className="mixi-home-empty"><Ship /><h3>Chưa có du thuyền phù hợp</h3><p>Hãy thay đổi từ khóa, điểm đến hoặc mức giá.</p><button type="button" className="btn-secondary" onClick={() => { setKeyword(''); setDestination('all'); setBudget('all'); }}>Đặt lại tìm kiếm</button></div>
        )}
        <div className="mixi-home-action"><button type="button" className="btn-secondary" onClick={() => onNavigate?.('cruises')}>Xem tất cả du thuyền <ArrowRight /></button></div>
      </section>

      <section className="mixi-review-section" aria-labelledby="review-title">
        <div className="mixi-home-section">
          <SectionHeading title="Đánh giá từ người đã trải nghiệm" description="Những chia sẻ sau chuyến đi được đội ngũ Dibaoxa ghi nhận." />
          <div className="mixi-review-layout">
            <div className="mixi-review-image"><img src="/images/dibaoxa-discover-vietnam.webp" alt="Khung cảnh Việt Nam trong hành trình nghỉ dưỡng" loading="lazy" /></div>
            <motion.blockquote key={reviewIndex} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.32 }}>
              <Quote />
              <h3>{currentReview.title}</h3>
              <p>“{currentReview.body}”</p>
              <footer><strong>{currentReview.name}</strong><span>{currentReview.trip}</span></footer>
              <div className="mixi-review-controls"><button type="button" onClick={() => setReviewIndex((reviewIndex - 1 + REVIEWS.length) % REVIEWS.length)} aria-label="Đánh giá trước"><ChevronLeft /></button><span>{reviewIndex + 1} / {REVIEWS.length}</span><button type="button" onClick={() => setReviewIndex((reviewIndex + 1) % REVIEWS.length)} aria-label="Đánh giá tiếp theo"><ChevronRight /></button></div>
            </motion.blockquote>
          </div>
        </div>
      </section>

      <section className="mixi-home-section" aria-labelledby="destinations-title">
        <SectionHeading title="Các điểm đến của Dibaoxa" description="Mỗi vùng vịnh có một nhịp trải nghiệm khác nhau." centered />
        <div className="mixi-destination-grid">
          {DESTINATIONS.map((item, index) => (
            <motion.button type="button" key={item.name} onClick={() => onSearchCruises?.({ destination: item.value })} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
              <img src={item.image} alt={item.name} loading="lazy" />
              <span><strong>{item.name}</strong><small>{item.description}</small><em>Xem ngay <ArrowRight /></em></span>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="mixi-partner-section" aria-labelledby="partners-title">
        <div className="mixi-home-section">
          <SectionHeading title="Đồng hành cùng đơn vị vận hành uy tín" description="Danh mục được tổng hợp từ các đối tác có thông tin hành trình rõ ràng." centered />
          <div className="mixi-partner-list">{PARTNERS.map(({ name, Icon }) => <div key={name} title={name} aria-label={name}><Icon /><span>{name}</span></div>)}</div>
        </div>
      </section>

      <section className="mixi-home-section" aria-labelledby="blog-title">
        <SectionHeading title="Kinh nghiệm cho hành trình sắp tới" description="Thông tin ngắn gọn để bạn chuẩn bị trước khi đặt dịch vụ." />
        <div className="mixi-blog-grid">
          {ARTICLES.map((article, index) => (
            <motion.article key={article.id} className="mixi-blog-card" initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
              <img src={article.image} alt={article.title} loading="lazy" />
              <div><span>{article.category}</span><h3>{article.title}</h3><p>{article.excerpt}</p><footer><time>{article.date}</time><button type="button" onClick={() => onNavigate?.('blog')}>Đọc bài viết <ArrowRight /></button></footer></div>
            </motion.article>
          ))}
        </div>
        <div className="mixi-home-action"><button type="button" className="btn-secondary" onClick={() => onNavigate?.('blog')}>Xem tất cả bài viết <ArrowRight /></button></div>
      </section>

      <section className="mixi-corporate-cta" aria-labelledby="corporate-title">
        <div><Building2 /><span><h2 id="corporate-title">Hành trình dành cho doanh nghiệp</h2><p>Tư vấn lịch trình, hội thảo và nghỉ dưỡng theo quy mô đoàn.</p></span></div>
        <button type="button" className="btn-primary" onClick={() => onNavigate?.('corporate')}>Nhận tư vấn <ArrowRight /></button>
      </section>
    </div>
  );
}
