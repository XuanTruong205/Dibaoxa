import React, { lazy, Suspense, useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import Footer from './components/common/Footer';
import Header from './components/common/Header';
import TravelAssistantBot from './components/common/TravelAssistantBot';
import HomePage from './pages/HomePage';
import { useAuthStore } from './store/useAuthStore';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CorporatePage = lazy(() => import('./pages/CorporatePage'));
const CruiseDetailPage = lazy(() => import('./pages/CruiseDetailPage'));
const CruisesPage = lazy(() => import('./pages/CruisesPage'));
const FlightsPage = lazy(() => import('./pages/FlightsPage'));
const HotelDetailPage = lazy(() => import('./pages/HotelDetailPage'));
const HotelsPage = lazy(() => import('./pages/HotelsPage'));
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
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 28,
    mass: 0.3,
  });

  if (hidden || reduceMotion) return null;

  return <motion.div className="site-progress" style={{ scaleX: progress }} aria-hidden="true" />;
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

export default function App() {
  const { fetchProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [selectedCruiseId, setSelectedCruiseId] = useState(null);
  const [preferredCruiseDestination, setPreferredCruiseDestination] = useState('all');
  const [postLoginTab, setPostLoginTab] = useState(null);
  const [preferredDestination, setPreferredDestination] = useState('');
  const [searchDates, setSearchDates] = useState(createDefaultSearchDates);
  const reduceMotion = useReducedMotion();
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
          />
        )}

        <motion.main
          id="main-content"
          key={activeTab}
          className={activeTab === 'admin' ? '' : (activeTab === 'login' || activeTab === 'register' ? 'route-stage route-stage--auth' : 'route-stage')}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
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
          </motion.main>
      </div>

      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && <Footer onNavigate={setActiveTab} />}
      {activeTab !== 'admin' && activeTab !== 'login' && activeTab !== 'register' && <TravelAssistantBot onExploreDestination={handleExploreDestination} />}

    </div>
  );
}
