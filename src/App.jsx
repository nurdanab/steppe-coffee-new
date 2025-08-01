// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'; // Импортируем useLocation
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

  const navigate = useNavigate();
  const location = useLocation(); // Используем useLocation для получения текущего пути

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

  const handleOpenBookingModal = () => {
    // Открываем модалку авторизации, только если пользователь не на странице UpdatePassword
    if (!session && location.pathname !== '/update-password') { // Добавлено условие
      setIsAuthModalOpen(true);
      alert("Пожалуйста, войдите или зарегистрируйтесь, чтобы забронировать столик.");
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const handleOpenAuthModal = () => {
    // Не открываем модалку авторизации, если мы на странице UpdatePassword
    if (location.pathname === '/update-password') { // Добавлено условие
        return;
    }
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (user) => {
    console.log('Пользователь успешно авторизован:', user);
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Ошибка выхода:', error.message);
    else {
      alert('Вы вышли из системы.');
      navigate('/');
    }
  };

  // Определяем, должен ли быть открыт AuthModal
  const shouldOpenAuthModal = isAuthModalOpen && location.pathname !== '/update-password'; // Новое условие

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
          <ProfilePage
            session={session}
            isAuthModalOpen={isAuthModalOpen} // Передаем это, но оно будет зависеть от shouldOpenAuthModal
            onOpenAuthModal={handleOpenAuthModal}
            onCloseAuthModal={handleCloseAuthModal}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
          />
        } />
          <Route path="/update-password" element={<UpdatePassword />} />
      </Routes>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        currentUserId={session?.user?.id || null}
        currentUserEmail={session?.user?.email || ''}
      />

      {/* Передаем shouldOpenAuthModal в пропс isOpen для Auth */}
      <Auth
        isOpen={shouldOpenAuthModal} 
        onClose={handleCloseAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;