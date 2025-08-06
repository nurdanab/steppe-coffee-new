// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Header from './components/Header/Header';
import HeroSection from './components/Hero/HeroSection';
import Promo from './components/Promo/Promo';
import Welcome from './components/Welcome/Welcome';
import WelcomeDesk from './components/WelcomeDesk/WelcomeDesk';
import BookCorner from './components/BookCorner/BookCorner';
import MapSection from './components/MapSection/MapSection';
import FooterSection from './components/FooterSection/FooterSection';
import PublicCalendar from './components/PublicCalendar/PublicCalendar';
import BookingModal from './components/BookingModal/BookingModal.jsx';
import Auth from './components/Auth/Auth.jsx';
import ProfilePage from './components/ProfilePage/ProfilePage.jsx';
import UpdatePassword from './components/UpdatePassword/UpdatePassword.jsx';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import MenuDisplay from './components/MenuDisplay/MenuDisplay';

import { supabase } from './supabaseClient';

const EventsPageContent = () => (
  <main>
    <PublicCalendar />
  </main>
);

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const previousPathRef = useRef('/'); // Используем useRef для хранения предыдущего пути

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (location.pathname === '/profile' && !session) {
      previousPathRef.current = location.pathname;
      setIsAuthModalOpen(true);
    }
  }, [location, session]);

  const handleOpenBookingModal = () => {
    if (!session) {
      previousPathRef.current = location.pathname;
      setIsAuthModalOpen(true);
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const handleOpenAuthModal = () => {
    previousPathRef.current = location.pathname;
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
    setTimeout(() => {
      navigate(previousPathRef.current);
    }, 100);
  };

  const handleAuthSuccess = (user) => {
    console.log('Пользователь успешно авторизован:', user);
    setIsAuthModalOpen(false);
    // После успешной авторизации, всегда перенаправляем на страницу профиля
    navigate('/profile');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Ошибка выхода:', error.message);
    else {
      // Здесь мы добавляем закрытие модального окна перед навигацией.
      // Это гарантирует, что модальное окно не появится после выхода.
      setIsAuthModalOpen(false);
      navigate('/');
    }
  };

  return (
    <div className="App">
      <Helmet>
        <title>Steppe Coffee - Уютная кофейня в Алматы: насладитесь лучшим кофе!</title>
        <meta name="description" content="Пространство для общения, вдохновения и новых впечатлений." />
        <meta property="og:title" content="Steppe Coffee - Кофейня которую вы запомните" />
        <meta property="og:description" content="Посетите Steppe Coffee в Алматы с кофейной подпиской." />
        <meta property="og:image" content="https://steppecoffee.netlify.app/images/og/og-image.webp" />
        <meta property="og:url" content="https://steppecoffee.netlify.app/" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header
        session={session}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={
          <main>
            <HeroSection onOpenBookingModal={handleOpenBookingModal} />
            <Promo />
            <Welcome />
            <WelcomeDesk />
            <BookCorner />
            <MapSection />
            <FooterSection />
          </main>
        } />

        <Route path="/events" element={
          <EventsPageContent />
        } />

        <Route path="/profile" element={
          <ProfilePage session={session} onLogout={handleLogout} />
        } />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/dashboard" element={<AdminDashboard session={session} />} />
        <Route path="/menu" element={<MenuDisplay />} />
      </Routes>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        currentUserId={session?.user?.id || null}
        currentUserEmail={session?.user?.email || ''}
      />

      <Auth
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;