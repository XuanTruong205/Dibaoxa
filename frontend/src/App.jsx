import React, { lazy, Suspense, useEffect, useState } from 'react';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import Analytics from './components/common/Analytics';
import SeoManager from './components/common/SeoManager';
import SuccessToast from './components/common/SuccessToast';
import { useAuthStore } from './store/useAuthStore';
import { useNotificationStore } from './store/useNotificationStore';
import { pathForTab, resolveSitePath } from './utils/siteRoutes';

const routeLoaders = {
  home: () => import('./pages/HomePage'),
  cruises: () => import('./pages/CruisesPage'),
  flights: () => import('./pages/FlightsPage'),
  hotels: () => import('./pages/HotelsPage'),
  corporate: () => import('./pages/CorporatePage'),
  blog: () => import('./pages/BlogPage'),
  contact: () => import('./pages/ContactPage'),
};

const HomePage = lazy(routeLoaders.home);
const TravelAssistantBot = lazy(() => import('./components/common/TravelAssistantBot'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const BlogPage = lazy(routeLoaders.blog);
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ContactPage = lazy(routeLoaders.contact);
const CorporatePage = lazy(routeLoaders.corporate);
const CruiseDetailPage = lazy(() => import('./pages/CruiseDetailPage'));
const CruisesPage = lazy(routeLoaders.cruises);
const FlightsPage = lazy(routeLoaders.flights);
const HotelDetailPage = lazy(() => import('./pages/HotelDetailPage'));
const HotelsPage = lazy(routeLoaders.hotels);
const LoginPage = lazy(() => import('./pages/LoginPage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const PackagesPage = lazy(() => import('./pages/PackagesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ThankYouPage = lazy(() => import('./pages/ThankYouPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage'));

const getDateFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createDefaultSearchDates = () => ({
  checkIn: getDateFromToday(7),
  checkOut: getDateFromToday(9),
});

function SiteProgress({ hidden }) {
  if (hidden) return null;
  return <div className="site-progress" aria-hidden="true" />;
}

function PageFallback() {
  return (
    <div className="page-fallback" role="status" aria-live="polite">
      <div className="page-fallback__visual" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>Đang chuẩn bị trải nghiệm của bạn...</p>
    </div>
  );
}

function DeferredAssistant({ onExploreDestination }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const show = () => setReady(true);
    const idleId = window.requestIdleCallback?.(show, { timeout: 1800 });
    const timerId = window.setTimeout(show, 1800);
    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      window.clearTimeout(timerId);
    };
  }, []);
  if (!ready) return null;
  return <Suspense fallback={null}><TravelAssistantBot onExploreDestination={onExploreDestination} /></Suspense>;
}

export default function App() {
  const { fetchProfile } = useAuthStore();
  const initialRoute = resolveSitePath(window.location.pathname);
  const [activeTab, setActiveTab] = useState(initialRoute.tab);
  const [selectedHotelId, setSelectedHotelId] = useState(initialRoute.params.id || null);
  const [selectedCruiseId, setSelectedCruiseId] = useState(initialRoute.params.id || null);
  const [preferredCruiseDestination, setPreferredCruiseDestination] = useState('all');
  const [postLoginTab, setPostLoginTab] = useState(null);
  const [preferredDestination, setPreferredDestination] = useState('');
  const [searchDates, setSearchDates] = useState(createDefaultSearchDates);
  const [contactReferenceId, setContactReferenceId] = useState('');
  const [seoEntity, setSeoEntity] = useState(null);
  const { notification, success: notifySuccess, dismiss: dismissNotification } = useNotificationStore();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('dibaoxa_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const route = resolveSitePath(window.location.pathname);
      setSeoEntity(null);
      setActiveTab(route.tab);
      if (route.tab === 'hotel-detail' || route.tab === 'booking') setSelectedHotelId(route.params.id || null);
      if (route.tab === 'cruise-detail') setSelectedCruiseId(route.params.id || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('dibaoxa_theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const navigateToTab = (tab, params = {}, { replace = false } = {}) => {
    setSeoEntity(null);
    if (params.id && (tab === 'hotel-detail' || tab === 'booking')) setSelectedHotelId(params.id);
    if (params.id && tab === 'cruise-detail') setSelectedCruiseId(params.id);
    const path = pathForTab(tab, params);
    if (window.location.pathname !== path) window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    setActiveTab(tab);
  };

  const showSuccessNotification = (title, message) => {
    notifySuccess(title, message);
  };

  const handleSelectHotel = (hotelId, checkIn, checkOut) => {
    setSelectedHotelId(hotelId);
    setSearchDates({ checkIn, checkOut });
    navigateToTab('hotel-detail', { id: hotelId });
  };

  const handleProceedBooking = () => {
    navigateToTab('booking', { id: selectedHotelId });
  };

  const handleSelectCruise = (cruiseId) => {
    setSelectedCruiseId(cruiseId);
    navigateToTab('cruise-detail', { id: cruiseId });
  };

  const handleSearchCruises = ({ destination = 'all' } = {}) => {
    setPreferredCruiseDestination(destination);
    navigateToTab('cruises');
  };

  const handleRequireLogin = (returnTab = 'home') => {
    setPostLoginTab(returnTab);
    navigateToTab('login');
  };

  const handleBookingSuccess = (bookingData) => {
    showSuccessNotification('Đặt phòng thành công', bookingData?.booking_code ? `Đơn ${bookingData.booking_code} đã được tạo.` : 'Đơn đặt phòng của bạn đã được tạo.');
    navigateToTab('my-bookings');
  };

  const handleExploreDestination = (destination) => {
    setPreferredDestination(destination);
    navigateToTab('hotels');
  };

  const seoEntityId = activeTab === 'cruise-detail'
    ? selectedCruiseId
    : (activeTab === 'hotel-detail' || activeTab === 'booking' ? selectedHotelId : undefined);

  return (
    <div className="page-shell min-h-[100dvh] font-sans antialiased flex flex-col justify-between" data-theme={theme}>
      <SeoManager
        tab={activeTab}
        entityId={seoEntityId}
        entityName={seoEntity?.name}
        entityDescription={seoEntity?.description}
        entityImage={seoEntity?.image}
      />
      <Analytics path={window.location.pathname} />
      <div>
        <SiteProgress hidden={activeTab === 'admin' || activeTab === 'login' || activeTab === 'register'} />
        {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && (
          <Header
            activeTab={activeTab}
            setActiveTab={navigateToTab}
            theme={theme}
            onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
            onPrefetch={(tab) => routeLoaders[tab]?.()}
          />
        )}

        <main
          id="main-content"
          key={activeTab}
          className={activeTab === 'admin' ? '' : (activeTab === 'login' || activeTab === 'register' ? 'route-stage route-stage--auth' : 'route-stage')}
        >
            <Suspense fallback={<PageFallback />}>
              {activeTab === 'home' && (
                <HomePage onNavigate={navigateToTab} onSelectCruise={handleSelectCruise} onSearchCruises={handleSearchCruises} />
              )}

              {activeTab === 'packages' && (
                <PackagesPage onExploreDestination={handleExploreDestination} />
              )}

              {activeTab === 'hotels' && (
                <HotelsPage onSelectHotel={handleSelectHotel} initialCity={preferredDestination} />
              )}

              {activeTab === 'flights' && (
                <FlightsPage onViewPlans={() => navigateToTab('my-bookings')} onLogin={() => handleRequireLogin('flights')} />
              )}

              {activeTab === 'cruises' && (
                <CruisesPage initialDestination={preferredCruiseDestination} onViewPlans={() => navigateToTab('my-bookings')} onSelectCruise={handleSelectCruise} onLogin={() => handleRequireLogin('cruises')} />
              )}

              {activeTab === 'cruise-detail' && selectedCruiseId && (
                <CruiseDetailPage cruiseId={selectedCruiseId} onSeoChange={setSeoEntity} onBack={() => navigateToTab('cruises')} onViewPlans={() => navigateToTab('my-bookings')} onLogin={() => handleRequireLogin('cruise-detail')} />
              )}

              {activeTab === 'corporate' && (
                <CorporatePage />
              )}

              {activeTab === 'blog' && (
                <BlogPage />
              )}

              {activeTab === 'contact' && (
                <ContactPage onSuccess={(referenceId) => { setContactReferenceId(referenceId); showSuccessNotification('Đã gửi yêu cầu', 'Dibaoxa đã tiếp nhận thông tin tư vấn của bạn.'); navigateToTab('thanks'); }} />
              )}

              {activeTab === 'case-studies' && <CaseStudiesPage onNavigate={navigateToTab} />}
              {activeTab === 'privacy' && <PrivacyPolicyPage onNavigate={navigateToTab} />}
              {activeTab === 'thanks' && <ThankYouPage referenceId={contactReferenceId} onNavigate={navigateToTab} />}
              {activeTab === 'not-found' && <NotFoundPage onNavigate={navigateToTab} />}

          {activeTab === 'hotel-detail' && selectedHotelId && (
            <HotelDetailPage
              hotelId={selectedHotelId}
              initialCheckIn={searchDates.checkIn}
              initialCheckOut={searchDates.checkOut}
              onBack={() => navigateToTab('hotels')}
              onProceedBooking={handleProceedBooking}
              onRequireLogin={() => handleRequireLogin('hotel-detail')}
              onSeoChange={setSeoEntity}
            />
          )}

          {activeTab === 'booking' && (
            <BookingPage
              onBack={() => navigateToTab('hotel-detail', { id: selectedHotelId })}
              onSuccess={handleBookingSuccess}
            />
          )}

          {activeTab === 'my-bookings' && (
            <MyBookingsPage
              onExplore={() => navigateToTab('home')}
              onLogin={() => handleRequireLogin('my-bookings')}
              onNavigate={navigateToTab}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              onLogin={() => handleRequireLogin('profile')}
              onViewBookings={() => navigateToTab('my-bookings')}
              onExplore={() => navigateToTab('home')}
            />
          )}

              {activeTab === 'login' && (
            <LoginPage
              onSuccess={(targetRole) => {
                const destination = targetRole === 'admin' ? 'admin' : (postLoginTab || 'home');
                setPostLoginTab(null);
                showSuccessNotification('Đăng nhập thành công', targetRole === 'admin' ? 'Đang mở khu vực quản trị của bạn.' : 'Chào mừng bạn trở lại Dibaoxa.');
                navigateToTab(destination);
              }}
              onSwitchRegister={() => navigateToTab('register')}
            />
          )}

          {activeTab === 'register' && (
            <RegisterPage
              onSuccess={() => {
                showSuccessNotification('Tạo tài khoản thành công', 'Tài khoản Dibaoxa của bạn đã sẵn sàng để lên kế hoạch chuyến đi.');
                navigateToTab('home');
              }}
              onSwitchLogin={() => navigateToTab('login')}
            />
          )}

              {activeTab === 'admin' && (
                <AdminDashboardPage
                  onExitAdmin={() => navigateToTab('home')}
                  onAuthSuccess={() => showSuccessNotification('Đăng nhập thành công', 'Đang mở khu vực quản trị của bạn.')}
                />
              )}
            </Suspense>
          </main>
      </div>

      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && <Footer onNavigate={navigateToTab} />}
      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && <DeferredAssistant onExploreDestination={handleExploreDestination} />}
      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && (
        <nav className="mobile-sticky-cta" aria-label="Hỗ trợ nhanh">
          <a href="tel:19008899"><span>Gọi tư vấn</span><strong>1900 8899</strong></a>
          <button type="button" onClick={() => navigateToTab('contact')}>Nhận tư vấn</button>
        </nav>
      )}
      <SuccessToast key={notification?.id || 'notification-empty'} notification={notification} onClose={dismissNotification} />

    </div>
  );
}
