import { AlertCircle, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import AuthGuardian from '../components/auth/AuthGuardian';
import { useAuthStore } from '../store/useAuthStore';

export default function RegisterPage({ onSuccess, onSwitchLogin }) {
  const { register, loading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    const result = await register({ full_name: fullName, email, phone, password });
    if (result.success) onSuccess?.();
    else setErrorMsg(result.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
  };

  const fieldEvents = (field) => ({ onFocus: () => setActiveField(field), onBlur: () => setActiveField('') });

  return (
    <div className="auth-page auth-page--register">
      <div className="auth-shell">
        <AuthGuardian activeField={activeField} mode="register" busy={loading} />

        <motion.section className="auth-panel" aria-labelledby="register-title" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
          <div className="auth-card">
            <div className="auth-heading auth-heading--left">
              <span className="auth-heading__icon"><User /></span>
              <div>
                <span className="auth-form__eyebrow">Bắt đầu hành trình</span>
                <h2 id="register-title">Tạo tài khoản Dibaoxa</h2>
                <p>Đăng ký một lần để quản lý toàn bộ chuyến đi và nhận 100 Xu đầu tiên.</p>
              </div>
            </div>

            {errorMsg && <div className="auth-alert" role="alert"><AlertCircle />{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-form__row">
                <div className="field-group">
                  <label htmlFor="register-name">Họ và tên</label>
                  <div className="input-with-icon"><User aria-hidden="true" /><input id="register-name" name="full_name" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} {...fieldEvents('name')} className="glass-input" placeholder="Nguyễn Minh Anh" autoComplete="name" required /></div>
                </div>
                <div className="field-group">
                  <label htmlFor="register-phone">Số điện thoại</label>
                  <div className="input-with-icon"><Phone aria-hidden="true" /><input id="register-phone" name="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} {...fieldEvents('phone')} className="glass-input" placeholder="0901 234 567" autoComplete="tel" /></div>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="register-email">Email</label>
                <div className="input-with-icon"><Mail aria-hidden="true" /><input id="register-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} {...fieldEvents('email')} className="glass-input" placeholder="ban@example.com" autoComplete="email" required /></div>
              </div>

              <div className="field-group">
                <label htmlFor="register-password">Mật khẩu</label>
                <div className="input-with-icon input-with-icon--action">
                  <Lock aria-hidden="true" />
                  <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} {...fieldEvents('password')} className="glass-input" placeholder="Từ 6 ký tự trở lên" autoComplete="new-password" required />
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff /> : <Eye />}</button>
                </div>
                <span className="field-hint">Dùng ít nhất 6 ký tự để bảo vệ tài khoản.</span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary auth-submit">{loading ? 'Đang tạo tài khoản...' : 'Đăng ký và nhận 100 Xu'}</button>
            </form>

            <p className="auth-switch">Đã có tài khoản? <button type="button" onClick={onSwitchLogin}>Đăng nhập</button></p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
