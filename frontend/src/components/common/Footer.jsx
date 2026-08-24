import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import React from 'react';
import { pathForTab } from '../../utils/siteRoutes';

export default function Footer({ onNavigate }) {
  const internalLink = (tab, label) => <a href={pathForTab(tab)} onClick={(event) => { event.preventDefault(); onNavigate?.(tab); }}>{label}</a>;
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-brand">
          <a href={pathForTab('home')} className="brand-lockup" onClick={(event) => { event.preventDefault(); onNavigate?.('home'); }} aria-label="Về trang chủ Dibaoxa">
            <span className="brand-mark" aria-hidden="true"><img src="/logo.png" alt="Dibaoxa Logo" className="brand-mark__img" /></span>
            <span className="brand-copy"><strong>Dibaoxa</strong><small>Travel &amp; Staycation</small></span>
          </a>
          <p>Thiết kế hành trình nghỉ dưỡng Việt Nam với thông tin rõ ràng, hỗ trợ tận tâm và trải nghiệm đặt dịch vụ liền mạch.</p>
          <span className="footer-assurance"><ShieldCheck />Giá minh bạch. Dữ liệu được bảo vệ.</span>
        </div>

        <div className="footer-column">
          <h2>Dịch vụ</h2>
          {internalLink('cruises', 'Du thuyền')}
          {internalLink('flights', 'Vé máy bay')}
          {internalLink('hotels', 'Khách sạn')}
          {internalLink('packages', 'Gói ưu đãi')}
        </div>

        <div className="footer-column">
          <h2>Về Dibaoxa</h2>
          {internalLink('corporate', 'Khách hàng doanh nghiệp')}
          {internalLink('blog', 'Cẩm nang du lịch')}
          {internalLink('case-studies', 'Câu chuyện khách hàng')}
          {internalLink('contact', 'Liên hệ')}
          {internalLink('privacy', 'Chính sách bảo mật')}
        </div>

        <div className="footer-column footer-contact">
          <h2>Hỗ trợ khách hàng</h2>
          <a href="tel:19008899"><Phone />1900 8899</a>
          <a href="mailto:support@dibaoxa.vn"><Mail />support@dibaoxa.vn</a>
          <span><MapPin />Landmark 81, TP. Hồ Chí Minh</span>
          <a href="https://www.google.com/maps/dir/?api=1&destination=Landmark+81+Ho+Chi+Minh+City" target="_blank" rel="noreferrer"><MapPin />Xem đường đi</a>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© 2026 Dibaoxa. Bảo lưu mọi quyền.</span>
        <div className="payment-row" aria-label="Phương thức thanh toán được hỗ trợ"><span>VietQR</span><span>VNPAY</span><span>MoMo</span><span>Visa</span></div>
        {internalLink('login', 'Đăng nhập hệ thống')}
      </div>
    </footer>
  );
}
