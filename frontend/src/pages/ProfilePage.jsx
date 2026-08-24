import { Award, CalendarDays, CheckCircle2, CircleUserRound, Coins, Hotel, Mail, Phone, Save, Ticket } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useNotificationStore } from '../store/useNotificationStore';

const tierDetails = {
  silver: { label: 'Silver', next: 'Gold', threshold: 5000, accent: 'profile-tier--silver' },
  gold: { label: 'Gold', next: 'Platinum', threshold: 20000, accent: 'profile-tier--gold' },
  platinum: { label: 'Platinum', next: null, threshold: 20000, accent: 'profile-tier--platinum' },
};

export default function ProfilePage({ onLogin, onViewBookings, onExplore }) {
  const { user, isAuthenticated, updateProfile } = useAuthStore();
  const notifySuccess = useNotificationStore((state) => state.success);
  const notifyError = useNotificationStore((state) => state.error);
  const reduceMotion = useReducedMotion();
  const [bookings, setBookings] = useState([]);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
  }, [user?.full_name, user?.phone]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/bookings/my-bookings')
      .then((response) => setBookings(Array.isArray(response.data.data) ? response.data.data : []))
      .catch(() => setBookings([]));
  }, [isAuthenticated]);

  const stats = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter((item) => ['confirmed', 'checked_in'].includes(item.status)).length,
    spent: bookings
      .filter((item) => item.payments?.some((payment) => payment.status === 'completed'))
      .reduce((sum, item) => sum + Number(item.total_price || 0), 0),
  }), [bookings]);

  if (!isAuthenticated || !user) {
    return (
      <div className="transaction-empty">
        <span className="transaction-empty__icon"><CircleUserRound /></span>
        <h2 className="text-xl font-bold text-slate-800">Đăng nhập để mở hồ sơ Dibaoxa</h2>
        <p>Xem hạng thành viên, điểm thưởng và cập nhật thông tin liên hệ của bạn.</p>
        <button type="button" onClick={onLogin} className="btn-primary">Đăng nhập ngay</button>
      </div>
    );
  }

  const tier = tierDetails[user.vip_tier] || tierDetails.silver;
  const points = Number(user.reward_points || 0);
  const progress = tier.next ? Math.min(100, (points / tier.threshold) * 100) : 100;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });
    const result = await updateProfile({ full_name: fullName.trim(), phone: phone.trim() });
    setSaving(false);
    if (result.success) notifySuccess('Đã cập nhật hồ sơ', 'Thông tin cá nhân của bạn đã được lưu.');
    else notifyError('Không thể cập nhật hồ sơ', result.message || 'Vui lòng thử lại.');
    setFeedback(result.success
      ? { type: 'success', message: 'Thông tin cá nhân đã được cập nhật.' }
      : { type: 'error', message: result.message || 'Không thể cập nhật hồ sơ.' });
  };

  return (
    <div className="profile-page">
      <motion.section
        className={`profile-tier ${tier.accent}`}
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="profile-tier__identity">
          <span className="profile-tier__avatar">{user.full_name?.charAt(0) || 'M'}</span>
          <div><small>Thành viên Dibaoxa</small><h1>{user.full_name}</h1><span><Award /> {tier.label} VIP</span></div>
        </div>
        <div className="profile-tier__points"><small>Số dư điểm thưởng</small><strong>{points.toLocaleString('vi-VN')}</strong><span>Xu Dibaoxa</span></div>
        <div className="profile-tier__progress">
          <div><span>{tier.next ? `Tiến độ lên ${tier.next}` : 'Hạng thành viên cao nhất'}</span><strong>{Math.round(progress)}%</strong></div>
          <div className="profile-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
          <small>{tier.next ? `Còn ${Math.max(0, tier.threshold - points).toLocaleString('vi-VN')} Xu để nâng hạng` : 'Bạn đang tận hưởng quyền lợi Platinum'}</small>
        </div>
      </motion.section>

      <section className="profile-stats" aria-label="Tổng quan hành trình">
        <div><Ticket /><span><small>Tổng đơn</small><strong>{stats.total}</strong></span></div>
        <div><CalendarDays /><span><small>Chuyến sắp tới</small><strong>{stats.upcoming}</strong></span></div>
        <div><Coins /><span><small>Đã thanh toán</small><strong>{stats.spent.toLocaleString('vi-VN')} đ</strong></span></div>
      </section>

      <div className="profile-grid">
        <section className="profile-panel" aria-labelledby="profile-info-title">
          <div className="profile-panel__heading"><div><span><CircleUserRound /></span><div><h2 id="profile-info-title">Thông tin cá nhân</h2><p>Đồng bộ với hồ sơ mà bộ phận vận hành sử dụng.</p></div></div></div>
          <form onSubmit={handleSubmit} className="profile-form">
            <label><span>Họ và tên</span><div><CircleUserRound /><input value={fullName} onChange={(event) => setFullName(event.target.value)} minLength="2" maxLength="100" required /></div></label>
            <label><span>Email đăng nhập</span><div><Mail /><input value={user.email} disabled /></div></label>
            <label><span>Số điện thoại</span><div><Phone /><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Thêm số điện thoại" /></div></label>
            {feedback.message && <p className={feedback.type === 'success' ? 'form-success' : 'form-error'} role="status">{feedback.type === 'success' && <CheckCircle2 />} {feedback.message}</p>}
            <button type="submit" className="btn-primary" disabled={saving || !fullName.trim()}><Save /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </form>
        </section>

        <aside className="profile-panel profile-panel--actions" aria-labelledby="profile-actions-title">
          <div className="profile-panel__heading"><div><span><Hotel /></span><div><h2 id="profile-actions-title">Hành trình của bạn</h2><p>Đi nhanh đến các thao tác thường dùng.</p></div></div></div>
          <button type="button" onClick={onViewBookings}><span><Ticket /><strong>Xem đơn và giao dịch</strong><small>QR check-in, thanh toán, hoàn tiền</small></span><span>→</span></button>
          <button type="button" onClick={onExplore}><span><Hotel /><strong>Khám phá nơi lưu trú</strong><small>Dùng điểm thưởng cho kỳ nghỉ kế tiếp</small></span><span>→</span></button>
        </aside>
      </div>
    </div>
  );
}
