import { Quote, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function CaseStudiesPage({ onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    api.get('/hotels/featured-reviews', { params: { limit: 12 } })
      .then((response) => { if (live) setReviews(response.data?.data || []); })
      .catch(() => { if (live) setReviews([]); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return (
    <div className="story-page">
      <nav className="simple-breadcrumb" aria-label="Đường dẫn"><button type="button" onClick={() => onNavigate('home')}>Trang chủ</button><span>/</span><span>Câu chuyện khách hàng</span></nav>
      <header className="story-page__header"><p className="eyebrow">Trải nghiệm được chia sẻ</p><h1>Câu chuyện từ khách hàng Dibaoxa</h1><p>Các nội dung dưới đây được lấy trực tiếp từ đánh giá khách hàng đã gửi trong hệ thống.</p></header>
      {loading ? <div className="story-page__loading" role="status">Đang tải đánh giá...</div> : reviews.length > 0 ? (
        <div className="story-grid">
          {reviews.map((review) => (
            <article key={review.id} className="story-card">
              <Quote aria-hidden="true" />
              <div className="story-card__rating" aria-label={`${review.rating} trên 5 sao`}><Star /> {review.rating}/5</div>
              <blockquote>{review.comment}</blockquote>
              <footer><strong>{review.user?.full_name || 'Khách hàng Dibaoxa'}</strong><span>{review.hotel?.name}</span></footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="story-empty"><h2>Chưa có đánh giá công khai</h2><p>Chúng tôi không tạo nội dung thay cho khách hàng. Đánh giá thật sẽ xuất hiện ở đây sau khi được gửi trong hệ thống.</p><button type="button" className="btn-primary" onClick={() => onNavigate('hotels')}>Khám phá khách sạn</button></div>
      )}
    </div>
  );
}
