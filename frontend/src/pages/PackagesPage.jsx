import { ArrowRight, Check, Compass, MapPin, Search, Sparkles, Timer } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const destinationImages = {
  'Đà Lạt': '/images/dibaoxa-dalat-retreat.webp',
  'Đà Nẵng': '/images/dibaoxa-coastal-resort.webp',
};

export default function PackagesPage({ onExploreDestination }) {
  const reduceMotion = useReducedMotion();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');

  const loadPackages = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/packages');
      setPackages(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      setLoadError(error.message || 'Không thể tải các gói nghỉ dưỡng lúc này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const filteredPackages = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi');
    if (!keyword) return packages;
    return packages.filter((item) => [item.title, item.destination, item.duration, ...(item.included || [])]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('vi').includes(keyword)));
  }, [packages, query]);

  return (
    <div className="packages-page">
      <section className="packages-hero" aria-labelledby="packages-title">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hero-kicker"><Sparkles /> Bộ sưu tập từ Dibaoxa</span>
          <h1 id="packages-title">Gói nghỉ trọn trải nghiệm.</h1>
          <p>Những lựa chọn Staycation đang hoạt động do đội ngũ vận hành tuyển chọn, với quyền lợi và mức giá được công bố rõ ràng.</p>
        </motion.div>

        <div className="packages-hero__note">
          <Compass />
          <div><strong>Từ danh mục Admin đến tay bạn</strong><span>Gói mới được cập nhật tự động ngay khi quản trị viên phát hành.</span></div>
        </div>
      </section>

      <section className="packages-catalog" aria-labelledby="packages-catalog-title">
        <div className="section-heading section-heading--compact">
          <div>
            <h2 id="packages-catalog-title">Ưu đãi đang mở</h2>
            <p aria-live="polite">{loading ? 'Đang cập nhật ưu đãi.' : `${filteredPackages.length} gói phù hợp.`}</p>
          </div>
          <label className="packages-search">
            <span className="sr-only">Tìm gói nghỉ dưỡng</span>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm điểm đến hoặc quyền lợi"
            />
          </label>
        </div>

        {loading ? (
          <div className="package-grid" aria-label="Đang tải gói nghỉ dưỡng">
            {[1, 2].map((item) => <div key={item} className="package-card package-card--skeleton" aria-hidden="true"><span /><i /><i /></div>)}
          </div>
        ) : loadError ? (
          <div className="hotel-empty" role="alert">
            <span className="hotel-empty__icon"><Compass /></span>
            <h3>Chưa tải được gói nghỉ dưỡng</h3>
            <p>{loadError}</p>
            <button type="button" onClick={loadPackages} className="btn-secondary">Thử lại</button>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="hotel-empty" role="status">
            <span className="hotel-empty__icon"><Search /></span>
            <h3>Không tìm thấy gói phù hợp</h3>
            <p>Hãy thử một điểm đến hoặc quyền lợi khác.</p>
            <button type="button" onClick={() => setQuery('')} className="btn-secondary">Xóa tìm kiếm</button>
          </div>
        ) : (
          <div className="package-grid">
            {filteredPackages.map((travelPackage, index) => (
              <motion.article
                key={travelPackage.id}
                className="package-card"
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="package-card__media">
                  <img
                    src={destinationImages[travelPackage.destination] || '/images/dibaoxa-coastal-resort.webp'}
                    alt={`Kỳ nghỉ tại ${travelPackage.destination}`}
                    loading="lazy"
                  />
                  <span><MapPin /> {travelPackage.destination}</span>
                </div>
                <div className="package-card__body">
                  <div className="package-card__eyebrow"><Timer /> {travelPackage.duration}</div>
                  <h2>{travelPackage.title}</h2>
                  <ul>
                    {(travelPackage.included || []).map((benefit) => <li key={benefit}><Check /> {benefit}</li>)}
                  </ul>
                  <div className="package-card__footer">
                    <div><small>Giá gói từ</small><strong>{Number(travelPackage.price || 0).toLocaleString('vi-VN')} đ</strong></div>
                    <button type="button" onClick={() => onExploreDestination(travelPackage.destination)} className="btn-primary">
                      Xem nơi lưu trú <ArrowRight />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
