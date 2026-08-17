import React, { lazy, Suspense, useEffect, useState } from 'react';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import { useAuthStore } from './store/useAuthStore';

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
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (hidden) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [hidden]);
  if (hidden) return null;
  return <div className="site-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />;
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
  const [activeTab, setActiveTab] = useState('home');
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedCruiseId, setSelectedCruiseId] = useState(null);
  const [preferredCruiseDestination, setPreferredCruiseDestination] = useState('all');
  const [postLoginTab, setPostLoginTab] = useState(null);
  const [preferredDestination, setPreferredDestination] = useState('');
  const [searchDates, setSearchDates] = useState(createDefaultSearchDates);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('dibaoxa_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('dibaoxa_theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const handleSelectHotel = (hotelId, checkIn, checkOut) => {
    setSelectedHotelId(hotelId);
    setSearchDates({ checkIn, checkOut });
    setActiveTab('hotel-detail');
  };

  const handleProceedBooking = () => {
    setActiveTab('booking');
  };

  const handleSelectCruise = (cruiseId) => {
    setSelectedCruiseId(cruiseId);
    setActiveTab('cruise-detail');
  };

  const handleSearchCruises = ({ destination = 'all' } = {}) => {
    setPreferredCruiseDestination(destination);
    setActiveTab('cruises');
  };

  const handleRequireLogin = (returnTab = 'home') => {
    setPostLoginTab(returnTab);
    setActiveTab('login');
  };

  const handleBookingSuccess = (bookingData) => {
    setActiveTab('my-bookings');
  };

  const handleExploreDestination = (destination) => {
    setPreferredDestination(destination);
    setActiveTab('hotels');
  };

  return (
    <div className="page-shell min-h-[100dvh] font-sans antialiased flex flex-col justify-between" data-theme={theme}>
      <div>
        <SiteProgress hidden={activeTab === 'admin' || activeTab === 'login' || activeTab === 'register'} />
        {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && (
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
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
                <HomePage onNavigate={setActiveTab} onSelectCruise={handleSelectCruise} onSearchCruises={handleSearchCruises} />
              )}

              {activeTab === 'packages' && (
                <PackagesPage onExploreDestination={handleExploreDestination} />
              )}

              {activeTab === 'hotels' && (
                <HotelsPage onSelectHotel={handleSelectHotel} initialCity={preferredDestination} />
              )}

              {activeTab === 'flights' && (
                <FlightsPage onViewPlans={() => setActiveTab('my-bookings')} onLogin={() => handleRequireLogin('flights')} />
              )}

              {activeTab === 'cruises' && (
                <CruisesPage initialDestination={preferredCruiseDestination} onViewPlans={() => setActiveTab('my-bookings')} onSelectCruise={handleSelectCruise} onLogin={() => handleRequireLogin('cruises')} />
              )}

              {activeTab === 'cruise-detail' && selectedCruiseId && (
                <CruiseDetailPage cruiseId={selectedCruiseId} onBack={() => setActiveTab('cruises')} onViewPlans={() => setActiveTab('my-bookings')} onLogin={() => handleRequireLogin('cruise-detail')} />
              )}

              {activeTab === 'corporate' && (
                <CorporatePage />
              )}

              {activeTab === 'blog' && (
                <BlogPage />
              )}

              {activeTab === 'contact' && (
                <ContactPage />
              )}

          {activeTab === 'hotel-detail' && selectedHotelId && (
            <HotelDetailPage
              hotelId={selectedHotelId}
              initialCheckIn={searchDates.checkIn}
              initialCheckOut={searchDates.checkOut}
              onBack={() => setActiveTab('home')}
              onProceedBooking={handleProceedBooking}
              onRequireLogin={() => handleRequireLogin('hotel-detail')}
            />
          )}

          {activeTab === 'booking' && (
            <BookingPage
              onBack={() => setActiveTab('hotel-detail')}
              onSuccess={handleBookingSuccess}
            />
          )}

          {activeTab === 'my-bookings' && (
            <MyBookingsPage
              onExplore={() => setActiveTab('home')}
              onLogin={() => handleRequireLogin('my-bookings')}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              onLogin={() => handleRequireLogin('profile')}
              onViewBookings={() => setActiveTab('my-bookings')}
              onExplore={() => setActiveTab('home')}
            />
          )}

          {activeTab === 'login' && (
            <LoginPage
              onSuccess={(targetRole) => {
                const destination = targetRole === 'admin' ? 'admin' : (postLoginTab || 'home');
                setPostLoginTab(null);
                setActiveTab(destination);
              }}
              onSwitchRegister={() => setActiveTab('register')}
            />
          )}

          {activeTab === 'register' && (
            <RegisterPage
              onSuccess={() => setActiveTab('home')}
              onSwitchLogin={() => setActiveTab('login')}
            />
          )}

              {activeTab === 'admin' && (
                <AdminDashboardPage onExitAdmin={() => setActiveTab('home')} />
              )}
            </Suspense>
          </main>
      </div>

      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && <Footer onNavigate={setActiveTab} />}
      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && <DeferredAssistant onExploreDestination={handleExploreDestination} />}

    </div>
  );
}
