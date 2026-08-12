import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import AuthGuardian from '../../auth/AuthGuardian';
import { useAuthStore } from '../../../store/useAuthStore';

export default function AdminLoginView({ onLoginSuccess, onSwitchRegister }) {
  const { login, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeField, setActiveField] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    const result = await login(email, password, rememberMe);

    if (result.success) {
      const userRole = result.user?.role;
      const targetRole = userRole === 'admin' || userRole === 'receptionist' ? 'admin' : 'user';
      onLoginSuccess?.(targetRole);
      return;
    }

    setErrorMsg(result.message || 'Email hoặc mật khẩu không chính xác.');
  };

  return (
    <div className="auth-page auth-page--login">
      <div className="auth-shell">
        <AuthGuardian activeField={activeField} mode="login" busy={loading} />

        <motion.section className="auth-panel" aria-labelledby="login-title" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
          <div className="auth-card">
            <div className="auth-heading">
              <span className="auth-heading__icon"><LogIn /></span>
              <div>
                <span className="auth-form__eyebrow">Tài khoản Dibaoxa</span>
                <h2 id="login-title">Chào mừng bạn trở lại</h2>
                <p>Dùng chung một tài khoản để truy cập đúng khu vực theo quyền của bạn.</p>
              </div>
            </div>

            {errorMsg && <div className="auth-alert" role="alert"><AlertCircle />{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label htmlFor="login-email">Email đăng nhập</label>
                <div className="input-with-icon">
                  <Mail aria-hidden="true" />
                  <input id="login-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} onFocus={() => setActiveField('email')} onBlur={() => setActiveField('')} className="glass-input" placeholder="ban@example.com" autoComplete="email" required />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="login-password">Mật khẩu</label>
                <div className="input-with-icon input-with-icon--action">
                  <Lock aria-hidden="true" />
                  <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} onFocus={() => setActiveField('password')} onBlur={() => setActiveField('')} className="glass-input" placeholder="Nhập mật khẩu" autoComplete="current-password" required />
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff /> : <Eye />}</button>
                </div>
              </div>

              <div className="auth-options">
                <label htmlFor="remember-login"><input id="remember-login" name="remember" type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />Ghi nhớ đăng nhập</label>
                <span>Phiên đăng nhập được bảo vệ</span>
              </div>

              <button type="submit" disabled={loading} className="btn-primary auth-submit">{loading ? 'Đang xác thực...' : 'Đăng nhập'}</button>
            </form>

            {onSwitchRegister && <p className="auth-switch">Chưa có tài khoản? <button type="button" onClick={onSwitchRegister}>Đăng ký ngay</button></p>}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
