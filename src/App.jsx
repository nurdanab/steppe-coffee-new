// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SeoComponent from './components/SeoComponent'; 
import SeoHelmet from './components/SeoHelmet.jsx';
import NotFoundPage from './components/NotFoundPage.jsx';

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
    <SeoComponent
      title="Афиша событий Steppe Coffee в Алматы | Бронирование столиков"
      description="Следите за афишей Steppe Coffee: музыкальные вечера, мастер-классы, встречи с авторами и многое другое. Бронируйте столики онлайн для участия в наших уникальных событиях в Алматы."
      ogUrl="https://steppecoffee.kz/events"
    />
    <PublicCalendar />
  </main>
);

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const previousPathRef = useRef('/');

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
    if (location.pathname === '/profile' && !session && !isAuthModalOpen) {
      navigate('/');
      setIsAuthModalOpen(true);
    }
  }, [location, session, isAuthModalOpen, navigate]);
  
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
    navigate('/profile');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Ошибка выхода:', error.message);
    else {
      setIsAuthModalOpen(false);
      navigate('/');
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "name": "Steppe Coffee",
    "image": "https://steppecoffee.kz/images/og/og-image.webp",
    "url": "https://steppecoffee.kz/",
    "telephone": "+7 (777) 123-45-67",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "ул. Курмангазы, 63",
      "addressLocality": "Алматы",
      "addressRegion": "Almaty",
      "postalCode": "050008",
      "addressCountry": "KZ"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "07:45",
        "closes": "23:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Saturday",
          "Sunday"
        ],
        "opens": "08:00",
        "closes": "23:00"
      }
    ],
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.244473",
      "longitude": "76.941566"
    }
  };

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "name": "Меню Steppe Coffee",
    "description": "Полное меню кофейни Steppe Coffee: от классических напитков до авторских десертов и закусок.",
    "hasMenuSection": [
      {
        "@type": "MenuSection",
        "name": "Кофе и напитки",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "Латте",
            "description": "Классический латте с нежной молочной пеной."
          },
          {
            "@type": "MenuItem",
            "name": "Капучино",
            "description": "Идеальный баланс эспрессо, молока и воздушной пены."
          }
        ]
      },
      {
        "@type": "MenuSection",
        "name": "Выпечка и десерты",
        "hasMenuItem": [
          {
            "@type": "MenuItem",
            "name": "Чизкейк",
            "description": "Нежный сливочный чизкейк с ягодным соусом."
          }
        ]
      }
    ]
  };

  return (
    <div className="App">
      <Header
        session={session}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
      />

      <Routes>
        <Route path="/" element={
          <main>
            <SeoComponent
              title="Steppe Coffee: Уютная кофейня в Алматы | Кофе, Выпечка и Подписка"
              description="Посетите Steppe Coffee — идеальное место для вдохновения и новых впечатлений. Насладитесь лучшим кофе, свежей выпечкой и выгодной кофейной подпиской в самом сердце Алматы."
              ogImage="https://steppecoffee.kz/images/og/og-image.webp"
              ogUrl="https://steppecoffee.kz/"
              structuredData={localBusinessSchema}
            />
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
        <Route path="/update-password" element={
          <UpdatePassword />
        } />
        <Route path="/dashboard" element={
          <AdminDashboard session={session} />
        } />
        <Route path="/menu" element={
        <main>
          <SeoComponent
            title="Меню | Steppe Coffee - Кофе, напитки и десерты"
            description="Ознакомьтесь с полным меню Steppe Coffee. У нас есть широкий выбор кофе, чая, свежих десертов и закусок. Закажите любимое блюдо сегодня!"
            ogUrl="https://steppecoffee.kz/menu"
            structuredData={menuSchema}
          />
          <MenuDisplay />
        </main>
      } />
      
        {/* Маршрут для 404 ошибки всегда должен быть последним */}
        <Route path="*" element={<NotFoundPage />} />
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