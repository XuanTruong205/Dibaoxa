import {
  Award,
  Building2,
  CircleUserRound,
  Compass,
  Hotel,
  LogOut,
  Menu,
  Moon,
  Newspaper,
  Phone,
  Plane,
  ShieldCheck,
  Ship,
  Sparkles,
  Sun,
  Ticket,
  User as UserIcon,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { pathForTab } from '../../utils/siteRoutes';

const MAIN_LINKS = [
  { tab: 'cruises', label: 'Du thuyền', Icon: Ship },
  { tab: 'flights', label: 'Vé máy bay', Icon: Plane },
  { tab: 'hotels', label: 'Khách sạn', Icon: Hotel },
  { tab: 'corporate', label: 'Doanh nghiệp', Icon: Building2 },
  { tab: 'blog', label: 'Blog', Icon: Newspaper },
];

export default function Header({ activeTab, setActiveTab, theme, onToggleTheme, onPrefetch }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const notifySuccess = useNotificationStore((state) => state.success);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) setDropdownOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [activeTab]);

  const navigate = (tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  const handleInternalLink = (event, tab) => {
    event.preventDefault();
    navigate(tab);
  };

  const isActive = (tab) => {
    if (tab === 'cruises') return activeTab === 'cruises' || activeTab === 'cruise-detail';
    if (tab === 'hotels') return activeTab === 'hotels' || activeTab === 'hotel-detail' || activeTab === 'booking';
    return activeTab === tab;
  };

  const getVipBadge = (tier) => {
    if (tier === 'platinum') return <span className="member-badge member-badge--platinum">Platinum VIP</span>;
    if (tier === 'gold') return <span className="member-badge member-badge--gold">Gold VIP</span>;
    return <span className="member-badge">Thành viên</span>;
  };

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a href={pathForTab('home')} onClick={(event) => handleInternalLink(event, 'home')} className="brand-lockup" aria-label="Về trang chủ Dibaoxa">
          <span className="brand-mark" aria-hidden="true"><img src="/logo.png" alt="Dibaoxa Logo" className="brand-mark__img" /></span>
          <span className="brand-copy"><strong>Dibaoxa</strong><small>Travel &amp; Staycation</small></span>
        </a>

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {MAIN_LINKS.map(({ tab, label, Icon }) => (
            <a
              key={tab}
              href={pathForTab(tab)}
              onClick={(event) => handleInternalLink(event, tab)}
              onPointerEnter={() => onPrefetch?.(tab)}
              onFocus={() => onPrefetch?.(tab)}
              className={`nav-link ${isActive(tab) ? 'is-active' : ''}`}
              aria-current={isActive(tab) ? 'page' : undefined}
            >
              <Icon />{label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a className="header-hotline" href="tel:19008899" aria-label="Gọi hotline 1900 8899">
            <Phone /><span><small>Hotline tư vấn</small><strong>1900 8899</strong></span>
          </a>
          <a href={pathForTab('contact')} className="btn-primary btn-compact header-contact" onClick={(event) => handleInternalLink(event, 'contact')}>Liên hệ</a>
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-button"
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            <span key={theme} className="theme-icon">{theme === 'dark' ? <Sun /> : <Moon />}</span>
          </button>

          {isAuthenticated && user ? (
            <div className="account-menu" ref={accountMenuRef}>
              <button type="button" onClick={() => setDropdownOpen((open) => !open)} className="account-trigger" aria-expanded={dropdownOpen} aria-haspopup="menu">
                <span className="account-copy"><span>{user.full_name}</span><small><Award /> {user.reward_points ? user.reward_points.toLocaleString('vi-VN') : 0} Xu</small></span>
                <span className="account-avatar" aria-hidden="true">{user.full_name?.charAt(0) || 'U'}</span>
              </button>
                {dropdownOpen && (
                  <div className="account-dropdown" role="menu">
                    <div className="account-dropdown__meta"><span>{getVipBadge(user.vip_tier)}</span><p>{user.email}</p></div>
                    <button type="button" onClick={() => navigate('my-bookings')} role="menuitem"><Ticket />Đơn và lịch trình</button>
                    <button type="button" onClick={() => navigate('packages')} role="menuitem"><Sparkles />Gói ưu đãi</button>
                    <button type="button" onClick={() => navigate('profile')} role="menuitem"><CircleUserRound />Hồ sơ và điểm thưởng</button>
                    {(user.role === 'admin' || user.role === 'receptionist') && <button type="button" onClick={() => navigate('admin')} role="menuitem"><ShieldCheck />Quản trị và QR Scan</button>}
                    <button type="button" onClick={() => { logout(); setDropdownOpen(false); notifySuccess('Đã đăng xuất', 'Phiên làm việc của bạn đã kết thúc an toàn.'); navigate('home'); }} className="account-dropdown__danger" role="menuitem"><LogOut />Đăng xuất</button>
                  </div>
                )}
            </div>
          ) : (
            <button type="button" onClick={() => navigate('login')} className="icon-button header-login" aria-label="Đăng nhập" title="Đăng nhập"><UserIcon /></button>
          )}

          <button type="button" aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="icon-button mobile-menu-button">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

        {mobileOpen && (
          <nav className="mobile-nav" aria-label="Điều hướng di động">
            <button type="button" onClick={() => navigate('home')} className={activeTab === 'home' ? 'is-active' : ''}><Compass />Trang chủ</button>
            {MAIN_LINKS.map(({ tab, label, Icon }) => <button type="button" key={tab} onClick={() => navigate(tab)} className={isActive(tab) ? 'is-active' : ''}><Icon />{label}</button>)}
            <button type="button" onClick={() => navigate('packages')} className={activeTab === 'packages' ? 'is-active' : ''}><Sparkles />Gói ưu đãi</button>
            <button type="button" onClick={() => navigate('my-bookings')} className={activeTab === 'my-bookings' ? 'is-active' : ''}><Ticket />Đơn của tôi</button>
            <button type="button" onClick={() => navigate('contact')} className={activeTab === 'contact' ? 'is-active' : ''}><Phone />Liên hệ hỗ trợ</button>
            {isAuthenticated && <button type="button" onClick={() => navigate('profile')} className={activeTab === 'profile' ? 'is-active' : ''}><CircleUserRound />Hồ sơ và điểm thưởng</button>}
            {(user?.role === 'admin' || user?.role === 'receptionist') && <button type="button" onClick={() => navigate('admin')}><ShieldCheck />Quản trị lễ tân</button>}
            {!isAuthenticated && <button type="button" onClick={() => navigate('register')} className="btn-primary"><UserIcon />Đăng ký tài khoản</button>}
          </nav>
        )}
    </header>
  );
}
