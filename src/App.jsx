import React from 'react';
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