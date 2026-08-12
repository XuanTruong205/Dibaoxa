import { Compass, Facebook, Instagram, Mail, MapPin, Phone, ShieldCheck, Youtube } from 'lucide-react';
import React from 'react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-brand">
          <button type="button" className="brand-lockup" onClick={() => onNavigate?.('home')} aria-label="Về trang chủ Dibaoxa">
            <span className="brand-mark" aria-hidden="true"><img src="/logo.png" alt="Dibaoxa Logo" className="brand-mark__img" /></span>
            <span className="brand-copy"><strong>Dibaoxa</strong><small>Travel &amp; Staycation</small></span>
          </button>
          <p>Thiết kế hành trình nghỉ dưỡng Việt Nam với thông tin rõ ràng, hỗ trợ tận tâm và trải nghiệm đặt dịch vụ liền mạch.</p>
          <span className="footer-assurance"><ShieldCheck />Giá minh bạch. Dữ liệu được bảo vệ.</span>
        </div>

        <div className="footer-column">
          <h2>Dịch vụ</h2>
          <button type="button" onClick={() => onNavigate?.('cruises')}>Du thuyền</button>
          <button type="button" onClick={() => onNavigate?.('flights')}>Vé máy bay</button>
          <button type="button" onClick={() => onNavigate?.('hotels')}>Khách sạn</button>
          <button type="button" onClick={() => onNavigate?.('packages')}>Gói ưu đãi</button>
        </div>

        <div className="footer-column">
          <h2>Về Dibaoxa</h2>
          <button type="button" onClick={() => onNavigate?.('corporate')}>Khách hàng doanh nghiệp</button>
          <button type="button" onClick={() => onNavigate?.('blog')}>Cẩm nang du lịch</button>
          <button type="button" onClick={() => onNavigate?.('contact')}>Liên hệ</button>
          <button type="button" onClick={() => onNavigate?.('my-bookings')}>Quản lý đơn</button>
        </div>

        <div className="footer-column footer-contact">
          <h2>Hỗ trợ khách hàng</h2>
          <a href="tel:19008899"><Phone />1900 8899</a>
          <a href="mailto:support@dibaoxa.vn"><Mail />support@dibaoxa.vn</a>
          <span><MapPin />Landmark 81, TP. Hồ Chí Minh</span>
          <div className="footer-socials" aria-label="Mạng xã hội Dibaoxa"><a href="#facebook" aria-label="Facebook"><Facebook /></a><a href="#instagram" aria-label="Instagram"><Instagram /></a><a href="#youtube" aria-label="YouTube"><Youtube /></a></div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© 2026 Dibaoxa. Bảo lưu mọi quyền.</span>
        <div className="payment-row" aria-label="Phương thức thanh toán được hỗ trợ"><span>VietQR</span><span>VNPAY</span><span>MoMo</span><span>Visa</span></div>
        <button type="button" onClick={() => onNavigate?.('login')}>Đăng nhập hệ thống</button>
      </div>
    </footer>
  );
}
