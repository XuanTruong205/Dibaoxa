import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  CreditCard,
  Grid,
  LogOut,
  Menu,
  Plane,
  Search,
  ShieldCheck,
  Ship,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminStore } from '../../store/useAdminStore';

const toSearchText = (...values) => values.filter(Boolean).join(' ').toLocaleLowerCase('vi');

const indexAdminRecords = ({ bookings, travelOrders, hotels, cruises, payments, customers, staff, packages }) => [
  ...bookings.map((item) => ({
    id: `booking-${item.id}`,
    nav: 'bookings',
    group: 'Đặt phòng',
    title: item.booking_code || `Đơn ${item.id}`,
    subtitle: [item.traveler_name, item.hotel_name, item.status].filter(Boolean).join(' - '),
    haystack: toSearchText(item.booking_code, item.traveler_name, item.hotel_name, item.destination, item.status, item.guest_phone),
  })),
  ...travelOrders.map((item) => ({
    id: `travel-order-${item.id}`,
    nav: 'travel-orders',
    group: item.product_type === 'flight' ? 'Vé máy bay' : 'Đơn du thuyền',
    title: item.order_code || `Đơn ${item.id}`,
    subtitle: [item.customer?.full_name, item.title, item.status].filter(Boolean).join(' - '),
    haystack: toSearchText(item.order_code, item.customer?.full_name, item.customer?.email, item.title, item.status),
  })),
  ...hotels.map((item) => ({
    id: `hotel-${item.id}`,
    nav: 'hotels',
    group: 'Khách sạn',
    title: item.name,
    subtitle: item.city || item.destination || item.address,
    haystack: toSearchText(item.name, item.city, item.destination, item.address, item.description),
  })),
  ...cruises.map((item) => ({
    id: `cruise-${item.id}`,
    nav: 'cruises',
    group: 'Du thuyền',
    title: item.name,
    subtitle: [item.destination, item.operator].filter(Boolean).join(' - '),
    haystack: toSearchText(item.name, item.destination, item.operator, item.departurePort, item.status),
  })),
  ...payments.map((item) => ({
    id: `payment-${item.id}`,
    nav: 'payments',
    group: 'Thanh toán',
    title: item.transaction_ref || item.booking_code || item.booking?.booking_code || `Giao dịch ${item.id}`,
    subtitle: [item.user?.full_name, item.status, item.payment_method].filter(Boolean).join(' - '),
    haystack: toSearchText(item.transaction_ref, item.booking_code, item.booking?.booking_code, item.product_title, item.user?.full_name, item.status, item.payment_method),
  })),
  ...customers.map((item) => ({
    id: `customer-${item.id}`,
    nav: 'travelers',
    group: 'Khách du lịch',
    title: item.full_name,
    subtitle: item.email || item.phone,
    haystack: toSearchText(item.full_name, item.email, item.phone, item.vip_tier),
  })),
  ...staff.map((item) => ({
    id: `staff-${item.id}`,
    nav: 'guides',
    group: 'Nhân sự',
    title: item.full_name,
    subtitle: [item.role, item.assigned_hotel].filter(Boolean).join(' - '),
    haystack: toSearchText(item.full_name, item.email, item.phone, item.role, item.assigned_hotel),
  })),
  ...packages.map((item) => ({
    id: `package-${item.id}`,
    nav: 'packages',
    group: 'Gói du lịch',
    title: item.title,
    subtitle: [item.destination, item.duration].filter(Boolean).join(' - '),
    haystack: toSearchText(item.title, item.destination, item.duration, item.included),
  })),
].filter((item) => item.title);

export default function AdminLayout({ activeNav, setActiveNav, onLogout, children }) {
  const { user, logout } = useAuthStore();
  const { bookings, travelOrders, hotels, cruises, payments, customers, staff, packages, error } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchInputRef = useRef(null);
  const searchAreaRef = useRef(null);
  const notificationsRef = useRef(null);

  const searchIndex = useMemo(
    () => indexAdminRecords({ bookings, travelOrders, hotels, cruises, payments, customers, staff, packages }),
    [bookings, travelOrders, hotels, cruises, payments, customers, staff, packages],
  );
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('vi');
  const searchResults = normalizedQuery
    ? searchIndex.filter((item) => item.haystack.includes(normalizedQuery)).slice(0, 8)
    : [];

  const operationalAlerts = useMemo(() => {
    const alerts = [];
    if (error) alerts.push({ id: 'load-error', title: 'Dữ liệu cần được kiểm tra', detail: error, nav: 'dashboard', tone: 'rose' });

    bookings
      .filter((booking) => ['pending_payment', 'pending'].includes(String(booking.status).toLowerCase()))
      .slice(0, 3)
      .forEach((booking) => alerts.push({
        id: `pending-booking-${booking.id}`,
        title: `Đơn ${booking.booking_code || booking.id} chờ xử lý`,
        detail: booking.traveler_name || booking.hotel_name || 'Cần xác nhận thông tin đặt phòng',
        nav: 'bookings',
        tone: 'amber',
      }));

    travelOrders
      .filter((order) => order.status === 'pending_payment')
      .slice(0, 3)
      .forEach((order) => alerts.push({ id: `pending-travel-${order.id}`, title: `Đơn ${order.order_code} chờ thanh toán`, detail: order.title, nav: 'travel-orders', tone: 'amber' }));

    payments
      .filter((payment) => String(payment.status).toLowerCase() === 'pending')
      .slice(0, 2)
      .forEach((payment) => alerts.push({
        id: `pending-payment-${payment.id}`,
        title: 'Giao dịch đang chờ đối soát',
        detail: payment.transaction_ref || payment.booking_code || payment.booking?.booking_code || 'Mở danh sách thanh toán để kiểm tra',
        nav: 'payments',
        tone: 'blue',
      }));

    return alerts.slice(0, 5);
  }, [bookings, travelOrders, payments, error]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        setSearchQuery('');
        setNotificationsOpen(false);
        setSidebarOpen(false);
      }
    };

    const handlePointerDown = (event) => {
      if (searchAreaRef.current && !searchAreaRef.current.contains(event.target)) setSearchQuery('');
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setNotificationsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: Grid },
    { id: 'bookings', label: 'Đặt Phòng & QR Code', icon: Calendar },
    { id: 'travel-orders', label: 'Vé Máy Bay & Đơn Dịch Vụ', icon: Plane, adminOnly: true },
    { id: 'packages', label: 'Gói Tour & Staycation', icon: Briefcase },
    { id: 'travelers', label: 'Khách Du Lịch', icon: Users },
    { id: 'guides', label: 'Hướng Dẫn Viên', icon: UserCheck },
    { id: 'hotels', label: 'Khách Sạn & Resort', icon: Building2 },
    { id: 'cruises', label: 'Du Thuyền & Hải Trình', icon: Ship },
    { id: 'payments', label: 'Thanh Toán & Giao Dịch', icon: CreditCard },
    { id: 'reports', label: 'Báo Cáo & Phân Tích', icon: TrendingUp },
  ].filter((item) => !item.adminOnly || user?.role === 'admin');

  const adminName = user?.full_name || 'Trần Thị Thu Hà';
  const adminRole = user?.role === 'admin' ? 'Quản Trị Viên Hệ Thống' : 'Quản Lý Lễ Tân';
  const avatarChar = adminName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="admin-app min-h-[100dvh] bg-[var(--page)] text-slate-800 font-sans flex antialiased">
      {sidebarOpen && <button type="button" className="fixed inset-0 z-20 bg-slate-950/45 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng thanh điều hướng" />}
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 md:static w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 transition-all duration-300 z-30 ${sidebarOpen ? 'flex' : 'hidden md:flex'}`}>
        
        <div>
          {/* Logo Header */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <span className="brand-mark"><img src="/logo.png" alt="Dibaoxa Logo" className="brand-mark__img" /></span>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">Dibaoxa Admin</h1>
              <span className="text-[11px] font-bold text-indigo-600 tracking-wider uppercase block -mt-0.5">Quản Trị Hệ Thống</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout & Admin Info */}
        <div className="p-4 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-center space-y-2">
            <ShieldCheck className="w-7 h-7 text-blue-600 mx-auto" />
            <span className="text-[11px] font-bold text-indigo-700 block">Nền tảng Quản trị Dibaoxa</span>
            <span className="text-[10px] text-slate-500 font-medium block">Hệ thống sẵn sàng vận hành</span>
          </div>
        </div>

      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Topbar Header */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 px-6 h-20 flex items-center justify-between gap-4 shadow-sm">
          
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600" aria-label="Mở thanh điều hướng">
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full" ref={searchAreaRef}>
              <label htmlFor="admin-global-search" className="sr-only">Tìm kiếm trong trang quản trị</label>
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                id="admin-global-search"
                name="admin_search"
                type="text"
                placeholder="Tìm mã đơn, khách sạn, du khách..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
                aria-expanded={Boolean(normalizedQuery)}
                aria-controls="admin-search-results"
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-2.5 pl-11 pr-16 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 ring-indigo-500/10 transition-all"
              />
              <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-slate-400 shadow-sm">Ctrl K</kbd>

              {normalizedQuery && (
                <div id="admin-search-results" className="absolute top-[calc(100%+10px)] inset-x-0 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10" role="listbox">
                  <div className="border-b border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {searchResults.length ? `${searchResults.length} kết quả phù hợp` : 'Không tìm thấy kết quả'}
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto p-2">
                      {searchResults.map((result) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected="false"
                          key={result.id}
                          onClick={() => {
                            setActiveNav(result.nav);
                            setSearchQuery('');
                          }}
                          className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-indigo-50 focus-visible:bg-indigo-50"
                        >
                          <span className="mt-0.5 rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500 group-hover:bg-white group-hover:text-indigo-600">{result.group}</span>
                          <span className="min-w-0">
                            <strong className="block truncate text-xs text-slate-800">{result.title}</strong>
                            {result.subtitle && <small className="mt-1 block truncate text-[10px] text-slate-500">{result.subtitle}</small>}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-6 text-center text-xs text-slate-500">Thử tìm theo mã đơn, tên khách hoặc điểm đến.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Header Items */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Date Range Selector Filter */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Thời gian thực</span>
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all relative"
                aria-label={`Thông báo vận hành${operationalAlerts.length ? `, ${operationalAlerts.length} mục cần chú ý` : ''}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
              >
                <Bell className="w-4 h-4" />
                {operationalAlerts.length > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold grid place-items-center ring-2 ring-white">
                    {operationalAlerts.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <strong className="text-xs text-slate-900">Thông báo vận hành</strong>
                    <span className="text-[10px] font-semibold text-slate-400">Dữ liệu thời gian thực</span>
                  </div>
                  {operationalAlerts.length ? (
                    <div className="p-2">
                      {operationalAlerts.map((alert) => (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => {
                            setActiveNav(alert.nav);
                            setNotificationsOpen(false);
                          }}
                          className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${alert.tone === 'rose' ? 'bg-rose-500' : alert.tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} aria-hidden="true" />
                          <span className="min-w-0">
                            <strong className="block text-xs text-slate-800">{alert.title}</strong>
                            <small className="mt-1 block text-[10px] leading-relaxed text-slate-500">{alert.detail}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <ShieldCheck className="mx-auto h-7 w-7 text-emerald-500" />
                      <strong className="mt-3 block text-xs text-slate-800">Mọi thứ đang ổn định</strong>
                      <p className="mt-1 text-[10px] text-slate-500">Không có đơn hoặc giao dịch nào cần xử lý.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin User Profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 text-sm">
                {avatarChar}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-sm font-bold text-slate-900 block leading-tight">{adminName}</span>
                <span className="text-[11px] font-semibold text-indigo-600 block">{adminRole}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </header>

        {/* View Main Content */}
        <main className="p-6 md:p-8 flex-1">
          {children}
        </main>

      </div>

    </div>
  );
}
