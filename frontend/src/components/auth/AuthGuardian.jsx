import { Compass, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

const COPY = {
  login: {
    eyebrow: 'Chào mừng trở lại',
    title: 'Hành trình của bạn vẫn đang chờ.',
    description: 'Đăng nhập để xem đơn, lưu lịch trình và tiếp tục khám phá những điểm đến bạn yêu thích.',
  },
  register: {
    eyebrow: 'Thành viên Dibaoxa',
    title: 'Một tài khoản, trọn vẹn mọi chuyến đi.',
    description: 'Tạo tài khoản để quản lý đặt chỗ, nhận mã QR và bắt đầu với 100 Xu thành viên.',
  },
};

export default function AuthGuardian({ activeField = '', mode = 'login', busy = false }) {
  const reduceMotion = useReducedMotion();
  const isPrivate = activeField === 'password';
  const isWatching = Boolean(activeField) && !isPrivate;
  const copy = COPY[mode] || COPY.login;
  const status = busy
    ? 'Đang bảo vệ phiên đăng nhập'
    : isPrivate
      ? 'Mình không nhìn mật khẩu đâu'
      : isWatching
        ? 'Mình đang theo dõi cùng bạn'
        : 'Trợ lý hành trình đã sẵn sàng';

  return (
    <aside className={`auth-visual auth-visual--${mode}`} aria-label="Trợ lý hành trình Dibaoxa">
      <img className="auth-visual__photo" src="/images/dibaoxa-coastal-resort.webp" alt="Khu nghỉ dưỡng ven biển Việt Nam" />
      <div className="auth-visual__scrim" aria-hidden="true" />

      <div className="auth-visual__topline">
        <div className="brand-lockup brand-lockup--inverse">
          <span className="brand-mark"><img src="/logo.png" alt="Dibaoxa" className="brand-mark__img" /></span>
          <span className="brand-copy"><strong>Dibaoxa</strong><small>Travel &amp; Staycation</small></span>
        </div>
        <span className="auth-visual__secure"><ShieldCheck aria-hidden="true" /> Bảo mật an toàn</span>
      </div>

      <div className={`auth-guardian ${isPrivate ? 'is-private' : ''} ${isWatching ? 'is-watching' : ''} ${busy ? 'is-busy' : ''}`}>
        <span className="auth-guardian__spark auth-guardian__spark--one" aria-hidden="true"><Sparkles /></span>
        <span className="auth-guardian__spark auth-guardian__spark--two" aria-hidden="true"><Compass /></span>
        <motion.div
          className="auth-guardian__character"
          animate={reduceMotion ? undefined : {
            y: busy ? [0, -5, 0] : isWatching ? -7 : 0,
            rotate: isWatching ? 2 : 0,
          }}
          transition={busy ? { duration: 1.15, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 210, damping: 18 }}
        >
          <span className="auth-guardian__ear auth-guardian__ear--left" aria-hidden="true" />
          <span className="auth-guardian__ear auth-guardian__ear--right" aria-hidden="true" />
          <div className="auth-guardian__face"><img src="/logo.png" alt="Linh vật Dibaoxa" /></div>
          <motion.span
            className="auth-guardian__hand auth-guardian__hand--left"
            aria-hidden="true"
            animate={reduceMotion ? undefined : isPrivate ? { x: 47, y: -65, rotate: 18 } : { x: 0, y: 0, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 240, damping: 19 }}
          />
          <motion.span
            className="auth-guardian__hand auth-guardian__hand--right"
            aria-hidden="true"
            animate={reduceMotion ? undefined : isPrivate ? { x: -47, y: -65, rotate: -18 } : { x: 0, y: 0, rotate: 12 }}
            transition={{ type: 'spring', stiffness: 240, damping: 19 }}
          />
          {isPrivate && <span className="auth-guardian__privacy"><EyeOff aria-hidden="true" /></span>}
        </motion.div>
        <div className="auth-guardian__status" aria-live="polite"><span aria-hidden="true" />{status}</div>
      </div>

      <div className="auth-visual__content">
        <span className="auth-visual__eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
    </aside>
  );
}
