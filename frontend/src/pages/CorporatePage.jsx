import { ArrowRight, Building2, CalendarDays, Check, Mail, Phone, Ship, UsersRound } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import React, { useState } from 'react';
import api from '../services/api';
import { useNotificationStore } from '../store/useNotificationStore';

const BENEFITS = [
  { title: 'Lịch trình theo mục tiêu', text: 'Điều chỉnh hoạt động cho nghỉ dưỡng, hội thảo hoặc tri ân nhân viên.', Icon: CalendarDays },
  { title: 'Nhiều quy mô đoàn', text: 'Tư vấn cabin, không gian chung và phương án di chuyển theo số khách.', Icon: UsersRound },
  { title: 'Một đầu mối hỗ trợ', text: 'Theo dõi yêu cầu, báo giá và thay đổi hành trình tại cùng một nơi.', Icon: Building2 },
];

export default function CorporatePage() {
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState({ company: '', name: '', phone: '', email: '', groupSize: '20-40', note: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const notifySuccess = useNotificationStore((state) => state.success);
  const notifyError = useNotificationStore((state) => state.error);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.company.trim() || !form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email) || form.phone.trim().length < 9) {
      setError('Vui lòng điền tên doanh nghiệp, người liên hệ, email và số điện thoại hợp lệ.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/contact-inquiries', {
        name: `${form.name} (${form.company})`,
        email: form.email,
        phone: form.phone,
        service: 'corporate',
        message: `Quy mô đoàn: ${form.groupSize}. ${form.note || 'Cần tư vấn hành trình doanh nghiệp.'}`,
      });
      setSent(true);
      notifySuccess('Đã gửi yêu cầu doanh nghiệp', 'Đội ngũ Dibaoxa đã tiếp nhận thông tin của bạn.');
    } catch (requestError) {
      setError(requestError.message || 'Chưa thể gửi yêu cầu. Vui lòng thử lại.');
      notifyError('Không thể gửi yêu cầu', requestError.message || 'Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="mixi-content-page">
      <section className="mixi-corporate-hero">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><span><Building2 /> Dibaoxa for Business</span><h1>Hành trình gắn kết doanh nghiệp.</h1><p>Từ du thuyền, khách sạn đến vé máy bay cho đoàn, một đội ngũ theo sát toàn bộ kế hoạch.</p><a href="#corporate-form" className="btn-primary">Nhận tư vấn <ArrowRight /></a></motion.div>
        <img src="/images/dibaoxa-cruise-hero.png" alt="Du thuyền dành cho hành trình doanh nghiệp" />
      </section>

      <section className="mixi-corporate-benefits" aria-labelledby="business-benefits-title">
        <div><h2 id="business-benefits-title">Kế hoạch phù hợp với từng đoàn</h2><p>Dibaoxa tổng hợp nhu cầu trước khi đề xuất hành trình và báo giá.</p></div>
        <div>{BENEFITS.map(({ title, text, Icon }) => <article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="mixi-corporate-form-section" id="corporate-form">
        <div><Ship /><h2>Trao đổi về chuyến đi của doanh nghiệp</h2><p>Thông tin sẽ được lưu dưới dạng yêu cầu tư vấn trong bản demo hiện tại.</p><ul><li><Check /> Tư vấn quy mô và lịch trình</li><li><Check /> Báo giá theo hạng cabin và dịch vụ</li><li><Check /> Hỗ trợ thay đổi trước khi xác nhận</li></ul></div>
        {sent ? (
          <div className="mixi-form-success"><Check /><h2>Đã nhận yêu cầu</h2><p>Đội ngũ Dibaoxa sẽ liên hệ với {form.name} qua {form.phone}.</p><button type="button" className="btn-secondary" onClick={() => setSent(false)}>Gửi yêu cầu khác</button></div>
        ) : (
          <form onSubmit={submit} noValidate>
            <label><span>Tên doanh nghiệp</span><input value={form.company} onChange={(event) => update('company', event.target.value)} /></label>
            <label><span>Người liên hệ</span><input value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
            <label><span><Phone /> Số điện thoại</span><input inputMode="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
            <label><span><Mail /> Email</span><input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
            <label><span>Quy mô đoàn</span><select value={form.groupSize} onChange={(event) => update('groupSize', event.target.value)}><option>Dưới 20 khách</option><option>20-40</option><option>41-80</option><option>Trên 80 khách</option></select></label>
            <label className="is-full"><span>Nhu cầu chính</span><textarea value={form.note} onChange={(event) => update('note', event.target.value)} placeholder="Ví dụ: hội thảo 2 ngày 1 đêm, cần không gian họp" /></label>
            {error && <p className="form-error is-full" role="alert">{error}</p>}
            <button type="submit" className="btn-primary is-full" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'} <ArrowRight /></button>
          </form>
        )}
      </section>
    </div>
  );
}
