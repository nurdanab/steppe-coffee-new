import React, { useState, useEffect } from 'react';
import PublicCalendar from './components/PublicCalendar.jsx';
import { Helmet } from 'react-helmet-async';
import Header from './components/Header/Header';
import HeroSection from './components/Hero/HeroSection';
import Promo from './components/Promo/Promo';
import Welcome from './components/Welcome/Welcome';
import WelcomeDesk from './components/WelcomeDesk/WelcomeDesk';
import BookCorner from './components/BookCorner/BookCorner';
import MapSection from './components/MapSection/MapSection';
import FooterSection from './components/FooterSection/FooterSection';
import BookingModal from './components/BookingModal/BookingModal.jsx';
import Auth from './components/Auth/Auth.jsx';
import { supabase } from './supabaseClient';

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [session, setSession] = useState(null);

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
    if (!session) {
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
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthSuccess = (user) => {
    console.log('Пользователь успешно авторизован:', user);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Ошибка выхода:', error.message);
    else alert('Вы вышли из системы.');
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
      <main>
        <HeroSection onOpenBookingModal={handleOpenBookingModal} />
        <Promo />
        <PublicCalendar />
        <Welcome />
        <WelcomeDesk /> 
        <BookCorner />
        <MapSection />
        <FooterSection />

      </main>
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