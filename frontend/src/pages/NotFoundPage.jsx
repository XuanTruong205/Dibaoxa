import { ArrowLeft, Compass, Search } from 'lucide-react';
import React from 'react';

export default function NotFoundPage({ onNavigate }) {
  return (
    <section className="utility-page utility-page--not-found">
      <div className="utility-page__art" aria-hidden="true"><span>404</span><Compass /></div>
      <p className="eyebrow">Lạc đường một chút</p>
      <h1>Trang này không còn ở đây.</h1>
      <p>Địa chỉ có thể đã thay đổi. Bạn có thể về trang chủ hoặc tiếp tục tìm dịch vụ phù hợp.</p>
      <div className="utility-page__actions">
        <button type="button" className="btn-primary" onClick={() => onNavigate('home')}><ArrowLeft /> Về trang chủ</button>
        <button type="button" className="btn-secondary" onClick={() => onNavigate('hotels')}><Search /> Tìm khách sạn</button>
      </div>
    </section>
  );
}
