import { CheckCircle2, Clock3, Mail, Phone } from 'lucide-react';
import React from 'react';

export default function ThankYouPage({ referenceId, onNavigate }) {
  return (
    <section className="utility-page utility-page--thanks">
      <CheckCircle2 className="utility-page__success" />
      <p className="eyebrow">Yêu cầu đã được ghi nhận</p>
      <h1>Cảm ơn bạn đã liên hệ Dibaoxa.</h1>
      <p>Đội ngũ tư vấn sẽ xem thông tin và liên hệ qua email hoặc số điện thoại bạn đã cung cấp.</p>
      {referenceId && <div className="reference-code"><small>Mã yêu cầu</small><strong>{referenceId}</strong></div>}
      <div className="response-promise"><Clock3 /><span><strong>Thời gian phản hồi mục tiêu: trong 30 phút</strong><small>Áp dụng trong khung hỗ trợ 08:00 đến 22:00 mỗi ngày.</small></span></div>
      <div className="utility-page__actions">
        <a className="btn-secondary" href="tel:19008899"><Phone /> Gọi 1900 8899</a>
        <button type="button" className="btn-primary" onClick={() => onNavigate('home')}><Mail /> Tiếp tục khám phá</button>
      </div>
    </section>
  );
}
