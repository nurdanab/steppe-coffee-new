import React from 'react';
import { Helmet } from 'react-helmet-async'; 
import Header from './components/Header/Header';
import HeroSection from './components/Hero/HeroSection';
import Promo from './components/Promo/Promo';
import Welcome from './components/Welcome/Welcome';
import WelcomeDesk from './components/WelcomeDesk/WelcomeDesk'; 
import BookCorner from './components/BookCorner/BookCorner';
import MapSection from './components/MapSection/MapSection';
import FooterSection from './components/FooterSection/FooterSection';


function App() {
  return (
    <div className="App">
      <Helmet>
        <title>Steppe Coffee - Уютная кофейня в Алматы: насладитесь лучшим кофе!</title>
        <meta name="description" content="Пространство для общения, вдохновения и новых впечатлений." />
        {/* Дополнительные мета-теги Open Graph для социальных сетей */}
        <meta property="og:title" content="Steppe Coffee - Кофейня которую вы запомните" />
        <meta property="og:description" content="Посетите Steppe Coffee в Алматы с кофейной подпиской." />
        <meta property="og:image" content="https://steppecoffee.netlify.app/images/og/og-image.webp" /> 
        <meta property="og:url" content="https://steppecoffee.netlify.app/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Header />
      <main>
        <HeroSection />
        <Promo />
        <Welcome />
        <WelcomeDesk /> 
        <BookCorner />
        <MapSection />
        <FooterSection />

      </main>
    </div>
  );
}

export default App;