import { Clock3, ExternalLink, Mail, MapPin, MessageSquareText, Phone, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import api, { cachedGet } from '../services/api';

const SERVICE_OPTIONS = [
  ['cruise', 'Du thuyền'],
  ['flight', 'Vé máy bay'],
  ['hotel', 'Khách sạn'],
  ['corporate', 'Đoàn doanh nghiệp'],
  ['other', 'Nhu cầu khác'],
];

export default function ContactPage({ onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: 'cruise', message: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;
    cachedGet('/team', {}, 60_000)
      .then((response) => {
        if (active) setTeam(Array.isArray(response.data?.data) ? response.data.data : []);
      })
      .catch(() => {
        if (active) setTeam([]);
      })
      .finally(() => {
        if (active) setTeamLoading(false);
      });
    return () => { active = false; };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email) || form.phone.trim().length < 9 || form.message.trim().length < 10) {
      setError('Vui lòng điền đầy đủ họ tên, email, điện thoại và nội dung cần hỗ trợ.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await api.post('/contact-inquiries', form);
      onSuccess?.(response.data?.data?.id);
    } catch (requestError) {
      setError(requestError.message || 'Chưa thể gửi yêu cầu. Vui lòng thử lại hoặc gọi hotline 1900 8899.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mixi-content-page mixi-contact-page">
      <section className="mixi-contact-layout">
        <div className="mixi-contact-copy"><span><MessageSquareText /> Liên hệ Dibaoxa</span><h1>Cùng chuẩn bị cho chuyến đi.</h1><p>Chia sẻ nhu cầu của bạn. Đội ngũ Dibaoxa sẽ phản hồi với lựa chọn phù hợp.</p><div><a href="tel:19008899"><Phone /> <span><small>Hotline</small><strong>1900 8899</strong></span></a><a href="mailto:support@dibaoxa.vn"><Mail /> <span><small>Email</small><strong>support@dibaoxa.vn</strong></span></a><a href="https://www.google.com/maps/dir/?api=1&destination=Landmark+81+Ho+Chi+Minh+City" target="_blank" rel="noreferrer"><MapPin /> <span><small>Văn phòng</small><strong>Landmark 81, TP. Hồ Chí Minh</strong></span><ExternalLink /></a><p className="contact-response-promise"><Clock3 /> Mục tiêu phản hồi trong 30 phút, từ 08:00 đến 22:00.</p></div></div>
        <form onSubmit={submit} noValidate><label><span>Họ và tên</span><input autoComplete="name" value={form.name} onChange={(event) => update('name', event.target.value)} /></label><label><span>Email</span><input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label><label><span>Số điện thoại</span><input inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label><label><span>Dịch vụ quan tâm</span><select value={form.service} onChange={(event) => update('service', event.target.value)}>{SERVICE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="is-full"><span>Nội dung</span><textarea value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Mô tả thời gian, số khách và nhu cầu của bạn" /></label>{error && <p className="form-error is-full" role="alert">{error}</p>}<button type="submit" className="btn-primary is-full" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi liên hệ'} <Send /></button></form>
      </section>
      {(teamLoading || team.length > 0) && (
        <section className="public-team" aria-labelledby="public-team-title" aria-busy={teamLoading}>
          <header>
            <h2 id="public-team-title">Người đồng hành cùng bạn</h2>
            <p>Những hồ sơ dưới đây đã được đội ngũ đồng ý công bố.</p>
          </header>
          {teamLoading ? (
            <div className="public-team__grid" role="status" aria-label="Đang tải thông tin đội ngũ">
              {[0, 1, 2].map((item) => <div className="public-team__skeleton" key={item}><span /><i /><i /></div>)}
            </div>
          ) : (
            <div className="public-team__grid">
              {team.map((member) => (
                <article className="public-team__member" key={member.id}>
                  <img src={member.photo_url} alt={`${member.full_name}, ${member.job_title}`} loading="lazy" decoding="async" />
                  <div><h3>{member.full_name}</h3><strong>{member.job_title}</strong>{member.bio && <p>{member.bio}</p>}<span><MapPin /> {member.assigned_hotel}</span></div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
