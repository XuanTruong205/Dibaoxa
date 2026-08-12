import { Check, Mail, MapPin, MessageSquareText, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: 'Du thuyền', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email) || form.phone.trim().length < 9 || form.message.trim().length < 10) {
      setError('Vui lòng điền đầy đủ họ tên, email, điện thoại và nội dung cần hỗ trợ.');
      return;
    }
    setError('');
    setSent(true);
  };

  return (
    <div className="mixi-content-page mixi-contact-page">
      <section className="mixi-contact-layout">
        <div className="mixi-contact-copy"><span><MessageSquareText /> Liên hệ Dibaoxa</span><h1>Cùng chuẩn bị cho chuyến đi.</h1><p>Chia sẻ nhu cầu của bạn. Đội ngũ Dibaoxa sẽ phản hồi với lựa chọn phù hợp.</p><div><a href="tel:19008899"><Phone /> <span><small>Hotline</small><strong>1900 8899</strong></span></a><a href="mailto:support@dibaoxa.vn"><Mail /> <span><small>Email</small><strong>support@dibaoxa.vn</strong></span></a><p><MapPin /> Landmark 81, TP. Hồ Chí Minh</p></div></div>
        {sent ? <div className="mixi-form-success"><Check /><h2>Đã gửi yêu cầu</h2><p>Dibaoxa sẽ phản hồi tới {form.email} hoặc {form.phone}.</p><button type="button" className="btn-secondary" onClick={() => setSent(false)}>Gửi nội dung khác</button></div> : <form onSubmit={submit} noValidate><label><span>Họ và tên</span><input value={form.name} onChange={(event) => update('name', event.target.value)} /></label><label><span>Email</span><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label><span>Số điện thoại</span><input inputMode="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label><label><span>Dịch vụ quan tâm</span><select value={form.service} onChange={(event) => update('service', event.target.value)}><option>Du thuyền</option><option>Vé máy bay</option><option>Khách sạn</option><option>Đoàn doanh nghiệp</option></select></label><label className="is-full"><span>Nội dung</span><textarea value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Mô tả thời gian, số khách và nhu cầu của bạn" /></label>{error && <p className="form-error is-full" role="alert">{error}</p>}<button type="submit" className="btn-primary is-full">Gửi liên hệ <Send /></button></form>}
      </section>
    </div>
  );
}

