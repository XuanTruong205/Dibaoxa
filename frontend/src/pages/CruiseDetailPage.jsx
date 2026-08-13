import {
  Anchor,
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Ship,
  Star,
  UsersRound,
  Utensils,
  Waves,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { PlanDialog, formatMoney } from '../components/travel/TravelSearchUI';
import api from '../services/api';

const HIGHLIGHT_ICONS = [BedDouble, Utensils, Coffee, Dumbbell, Bath, Waves];

const REVIEW_SAMPLES = [
  ['Mai Phương', 'Cabin sạch, lịch trình vừa phải và đội ngũ tư vấn giải thích rất rõ trước chuyến đi.'],
  ['Quang Chính', 'Đồ ăn ngon, nhân viên chu đáo. Gia đình tôi đặc biệt thích hoạt động chèo kayak.'],
  ['Minh Tuấn', 'Không gian đẹp và yên tĩnh. Phòng có ban công nên ngắm bình minh rất thoải mái.'],
];

export default function CruiseDetailPage({ cruiseId, onBack, onViewPlans, onLogin }) {
  const reduceMotion = useReducedMotion();
  const [cruise, setCruise] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const gallery = useMemo(() => cruise ? [
    cruise.image,
    ...(cruise.galleryImages || []),
  ].filter((image, index, images) => image && images.indexOf(image) === index) : [], [cruise]);
  const [mainImage, setMainImage] = useState('/images/dibaoxa-cruise-hero.png');
  const [departDate, setDepartDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [roomQuantities, setRoomQuantities] = useState({});
  const [selection, setSelection] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    api.get(`/cruises/${cruiseId}`)
      .then((response) => {
        const item = response?.data?.data;
        if (active && item) setCruise(item);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 404 || error.code === 'CRUISE_NOT_FOUND') setCruise(null);
        else setCruise(null);
      })
      .finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, [cruiseId]);

  useEffect(() => {
    let active = true;
    api.get(`/cruises/${cruiseId}/departures`).then((response) => {
      const items = Array.isArray(response?.data?.data) ? response.data.data : [];
      if (!active) return;
      setDepartures(items);
      setDepartDate((current) => items.some((item) => item.departure_date === current) ? current : (items[0]?.departure_date || ''));
    }).catch(() => { if (active) { setDepartures([]); setDepartDate(''); } });
    return () => { active = false; };
  }, [cruiseId]);

  useEffect(() => {
    if (!cruise) return;
    setMainImage(cruise.image);
    setRoomQuantities({});
  }, [cruise]);

  useEffect(() => {
    if (!galleryOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setGalleryOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryOpen]);

  if (catalogLoading && !cruise) {
    return <div className="detail-loading" aria-label="Đang tải thông tin du thuyền"><div className="detail-loading__title" /><div className="detail-loading__gallery" /><div className="detail-loading__row"><span /><span /></div></div>;
  }

  if (!cruise) {
    return (
      <div className="travel-empty">
        <Ship />
        <h2>Không tìm thấy du thuyền</h2>
        <p>Du thuyền này có thể đã ngừng mở bán.</p>
        <button type="button" className="btn-secondary" onClick={onBack}>Quay lại danh sách</button>
      </div>
    );
  }

  const currentImageIndex = Math.max(0, gallery.indexOf(mainImage));
  const previousImage = gallery[(currentImageIndex - 1 + gallery.length) % gallery.length];
  const nextImage = gallery[(currentImageIndex + 1) % gallery.length];
  const selectedCabins = cruise.cabins.filter((cabin) => roomQuantities[cabin] > 0);
  const activeDeparture = departures.find((item) => item.departure_date === departDate);
  const cabinAvailability = new Map((activeDeparture?.inventory || []).map((item) => [item.cabin_name, item]));
  const roomCount = Object.values(roomQuantities).reduce((sum, quantity) => sum + quantity, 0);
  const totalPrice = Object.entries(roomQuantities).reduce((sum, [cabin, quantity]) => sum + Number(quantity || 0) * Number(cabinAvailability.get(cabin)?.price_override ?? cruise.price) * guests, 0);
  const updateRoom = (cabin, delta) => setRoomQuantities((current) => ({
    ...current,
    [cabin]: Math.max(0, Math.min(cabinAvailability.get(cabin)?.available_units || 0, (current[cabin] || 0) + delta)),
  }));

  const saveCruise = () => setSelection({
    type: 'cruise',
    title: `${cruise.name}, ${selectedCabins.join(', ')}`,
    summary: `${cruise.destination}, ${cruise.durationDays} ngày ${cruise.durationDays - 1} đêm. ${roomCount} cabin, khởi hành ${departDate} cho ${guests} khách.`,
    totalPrice,
    item: { ...cruise, selectedCabins, roomQuantities },
    search: { departDate, guests, roomCount },
  });

  const moveGallery = (direction) => {
    const targetIndex = (currentImageIndex + direction + gallery.length) % gallery.length;
    setMainImage(gallery[targetIndex]);
  };

  const highlights = cruise.features.concat(['Lễ tân 24 giờ', 'Nhà hàng trên tàu']).slice(0, 8);
  const specifications = cruise.specifications || {};
  const mapQuery = encodeURIComponent(`${cruise.departurePort}, ${cruise.destination}, Việt Nam`);

  return (
    <div className="product-detail">
      <nav className="product-detail__breadcrumbs" aria-label="Đường dẫn">
        <button type="button" onClick={onBack}><ArrowLeft /> Tìm du thuyền</button>
        <ChevronRight />
        <span>{cruise.destination}</span>
        <ChevronRight />
        <strong>{cruise.name}</strong>
      </nav>

      <header className="product-detail__heading">
        <div>
          <div className="product-detail__eyebrow"><Ship /> Du thuyền nghỉ dưỡng</div>
          <h1>{cruise.name}</h1>
          <p><Star /> {cruise.rating} xuất sắc · {cruise.reviews} đánh giá · <MapPin /> {cruise.departurePort}</p>
        </div>
        <div className="product-detail__headline-price">
          <span>Giá từ</span>
          <strong>{formatMoney(cruise.price)}</strong>
          <small>/ khách</small>
        </div>
      </header>

      <section className="product-gallery" aria-label="Thư viện ảnh du thuyền">
        <button type="button" className="product-gallery__peek" onClick={() => moveGallery(-1)} aria-label="Ảnh trước">
          <img src={previousImage} alt="" />
          <span><ChevronLeft /></span>
        </button>
        <motion.button
          type="button"
          className="product-gallery__main"
          key={mainImage}
          initial={reduceMotion ? false : { opacity: 0.65 }}
          animate={{ opacity: 1 }}
          onClick={() => setGalleryOpen(true)}
        >
          <img src={mainImage} alt={`Không gian ${cruise.name}`} />
          <span><Maximize2 /> Xem tất cả {gallery.length} ảnh</span>
        </motion.button>
        <button type="button" className="product-gallery__peek" onClick={() => moveGallery(1)} aria-label="Ảnh tiếp theo">
          <img src={nextImage} alt="" />
          <span><ChevronRight /></span>
        </button>
      </section>

      <div className="product-detail__body">
        <section id="overview" className="product-section">
          <h2>Đặc điểm nổi bật</h2>
          <div className="product-overview">
            <div>
              <div className="product-feature-grid">
                {highlights.map((feature, index) => {
                  const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
                  return <div key={feature}><Icon /><span>{feature}</span></div>;
                })}
              </div>
              <ul className="product-check-list">
                <li><Check /> Lịch trình cân bằng giữa nghỉ dưỡng và khám phá vịnh.</li>
                <li><Check /> Cabin hướng vịnh, bao gồm các bữa ăn theo chương trình.</li>
                <li><Check /> Dibaoxa xác nhận lại cabin và giờ đón trước khi thanh toán.</li>
              </ul>
            </div>
            <aside className="product-info-card">
              <h3>Thông tin du thuyền</h3>
              <dl>
                <div><dt>Hạ thủy</dt><dd>{specifications.launchedYear || 'Đang cập nhật'}</dd></div>
                <div><dt>Cabin</dt><dd>{specifications.cabinCount || cruise.cabins.length}</dd></div>
                <div><dt>Thân vỏ</dt><dd>{specifications.hullMaterial || 'Kim loại'}</dd></div>
                <div><dt>Hành trình</dt><dd>{specifications.route || cruise.destination}</dd></div>
                <div><dt>Điều hành</dt><dd>{cruise.operator}</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section id="cabins" className="product-section">
          <div className="product-section__heading">
            <div><h2>Các loại phòng &amp; giá</h2><p>Chọn cabin phù hợp cho hành trình của bạn.</p></div>
            <button type="button" className="text-button" onClick={() => setRoomQuantities({})}>Xóa lựa chọn</button>
          </div>
          <div className="product-room-panel">
            <div className="product-room-toolbar">
              <label><span>Ngày khởi hành</span><select value={departDate} onChange={(event) => { setDepartDate(event.target.value); setRoomQuantities({}); }} disabled={!departures.length}><option value="">{departures.length ? 'Chọn ngày khởi hành' : 'Chưa có lịch mở bán'}</option>{departures.map((item) => <option key={item.id} value={item.departure_date}>{new Date(`${item.departure_date}T00:00:00`).toLocaleDateString('vi-VN')} · {item.departure_time}</option>)}</select></label>
              <label><span>Số khách</span><select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value} khách</option>)}</select></label>
            </div>
            <div className="product-room-list">
              {cruise.cabins.map((cabin, index) => {
                const quantity = roomQuantities[cabin] || 0;
                const availability = cabinAvailability.get(cabin);
                const price = availability?.price_override ?? cruise.price;
                return (
                  <article key={cabin} className={quantity ? 'is-selected' : ''}>
                    <button type="button" className="product-room-list__image" onClick={() => { setMainImage(gallery[index % gallery.length]); setGalleryOpen(true); }} aria-label={`Xem ảnh ${cabin}`}>
                      <img src={gallery[index % gallery.length]} alt={`Cabin ${cabin}`} loading="lazy" />
                    </button>
                    <div className="product-room-list__copy">
                      <h3>{cabin}</h3>
                      <p><Maximize2 /> {30 + index * 8} m² <UsersRound /> Tối đa {index > 1 ? 4 : 2} khách</p>
                      <small>Bồn tắm, cửa sổ hướng vịnh · còn {availability?.available_units || 0} cabin.</small>
                    </div>
                    <div className="product-room-list__price"><strong>{formatMoney(price)}</strong><span>/ khách</span></div>
                    <div className="quantity-stepper" aria-label={`Số lượng ${cabin}`}>
                      <button type="button" onClick={() => updateRoom(cabin, -1)} disabled={!quantity} aria-label={`Giảm ${cabin}`}><Minus /></button>
                      <b>{quantity}</b>
                      <button type="button" onClick={() => updateRoom(cabin, 1)} disabled={!availability?.available_units || quantity >= availability.available_units} aria-label={`Thêm ${cabin}`}><Plus /></button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="product-booking-bar">
              <div><span>Tổng cộng</span><strong>{roomCount ? formatMoney(totalPrice) : 'Chưa chọn cabin'}</strong><small>{roomCount} cabin · {guests} khách</small></div>
              <button type="button" className="btn-primary" onClick={saveCruise} disabled={!roomCount || !activeDeparture}>Đặt ngay <ChevronRight /></button>
            </div>
          </div>
        </section>

        <section id="introduction" className="product-section product-article">
          <h2>Giới thiệu</h2>
          <h3>Giới thiệu về du thuyền</h3>
          <p>{cruise.description || `${cruise.name} đưa du khách qua vùng nước yên, đảo đá vôi và làng chài đặc trưng của ${cruise.destination}. Thiết kế trên tàu cân bằng giữa nét Việt Nam đương đại và tiện nghi nghỉ dưỡng.`}</p>
          {gallery[1] && <img src={gallery[1]} alt={`Hành trình của ${cruise.name}`} loading="lazy" />}
          <p>Hành trình tập trung vào trải nghiệm thực tế như ngắm cảnh, chèo kayak, khám phá điểm đến và thưởng thức bữa ăn trên tàu. Đội ngũ vận hành theo sát từng chặng để chuyến đi thoải mái cho cả cặp đôi, gia đình và nhóm bạn.</p>
          {gallery[2] && <img src={gallery[2]} alt={`Không gian nghỉ dưỡng trên ${cruise.name}`} loading="lazy" />}
          <p>Dibaoxa xác nhận giờ đón, loại cabin và các yêu cầu ăn uống trước ngày khởi hành. Nếu thời tiết ảnh hưởng đến lịch trình, bạn sẽ được thông báo sớm và hỗ trợ phương án phù hợp.</p>
          {gallery.length > 3 && (
            <div className="product-article-gallery" aria-label={`Không gian và trải nghiệm trên ${cruise.name}`}>
              {gallery.slice(3).map((image, index) => (
                <button type="button" key={image} onClick={() => { setMainImage(image); setGalleryOpen(true); }} aria-label={`Xem ảnh trải nghiệm ${index + 1}`}>
                  <img src={image} alt={`Trải nghiệm ${index + 1} trên ${cruise.name}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section id="rules" className="product-section">
          <h2>Quy định chung và lưu ý</h2>
          <div className="product-accordions">
            {(cruise.policies?.length ? cruise.policies : ['Cabin đã chọn, các bữa ăn trong lịch trình, vé tham quan và hoạt động được liệt kê trong chương trình.', 'Mức giá trẻ em phụ thuộc độ tuổi, loại cabin và thời điểm khởi hành.', 'Lịch trình có thể điều chỉnh theo thông báo của ban quản lý vịnh và đơn vị vận hành.']).map((policy, index) => <details key={policy} open={index === 0}><summary>{index === 0 ? 'Giá và dịch vụ bao gồm' : `Lưu ý ${index + 1}`}</summary><p>{policy}</p></details>)}
          </div>
        </section>

        <section className="product-section">
          <h2>Câu hỏi thường gặp</h2>
          <div className="product-accordions">
            {(cruise.faqs?.length ? cruise.faqs : [{ question: 'Tôi cần có mặt tại bến trước bao lâu?', answer: 'Bạn nên có mặt trước giờ đón khoảng 30 phút. Thời gian chính xác được gửi sau khi xác nhận cabin.' }, { question: 'Có hỗ trợ đồ ăn chay hoặc dị ứng không?', answer: 'Có. Hãy ghi chú yêu cầu khi đặt chỗ để đơn vị vận hành chuẩn bị trước.' }]).map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          </div>
        </section>

        <section id="itinerary" className="product-section">
          <h2>Bản đồ và lịch trình</h2>
          <div className="product-map">
            <iframe title={`Bản đồ ${cruise.destination}`} src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="product-itinerary">
            {cruise.itinerary.map((item, index) => (
              <article key={item}><strong>{index + 1}</strong><div><span>Ngày {Math.min(index + 1, cruise.durationDays)}</span><h3>{item}</h3><p>Thời gian có thể thay đổi theo điều kiện vận hành và thời tiết.</p></div></article>
            ))}
          </div>
        </section>

        <section id="reviews" className="product-section">
          <div className="product-section__heading"><div><h2>Đánh giá ({cruise.reviews})</h2><p>Chia sẻ từ khách đã trải nghiệm hành trình.</p></div></div>
          <div className="product-review-summary"><strong>{cruise.rating}</strong><div><span>Tuyệt hảo</span><small>{cruise.reviews} đánh giá đã xác thực</small></div><div className="product-review-summary__bars"><span><i style={{ width: '96%' }} /></span><span><i style={{ width: '91%' }} /></span><span><i style={{ width: '94%' }} /></span></div></div>
          <div className="product-review-list">
            {REVIEW_SAMPLES.map(([name, comment], index) => <article key={name}><div><span>{name.charAt(0)}</span><div><strong>{name}</strong><small>Khởi hành tháng {index + 5}/2026</small></div><b><Star /> 5.0</b></div><p>{comment}</p></article>)}
          </div>
        </section>
      </div>

      <PlanDialog selection={selection} onClose={() => setSelection(null)} onViewPlans={onViewPlans} onLogin={onLogin} />
      <AnimatePresence>
        {galleryOpen && (
          <motion.div className="reference-gallery-lightbox" role="dialog" aria-modal="true" aria-label={`Ảnh ${cruise.name}`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setGalleryOpen(false); }}>
            <button type="button" className="reference-gallery-lightbox__close" onClick={() => setGalleryOpen(false)} aria-label="Đóng ảnh"><X /></button>
            <motion.img src={mainImage} alt={`Không gian ${cruise.name}`} initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} />
            <div>{gallery.map((image, index) => <button type="button" key={`${image}-lightbox-${index}`} className={mainImage === image ? 'is-active' : ''} onClick={() => setMainImage(image)} aria-label={`Mở ảnh ${index + 1}`}><img src={image} alt="" /></button>)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
