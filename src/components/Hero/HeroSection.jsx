// HeroSection.jsx
import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './HeroSection.module.scss';
import LazyImage from '../LazyImage/LazyImage'; 

const HeroSection = ({ onOpenBookingModal }) => { 
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section ref={ref} className={`${styles.hero} ${inView ? styles.visible : ''}`}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.headline}>
              Твоё <span className={styles.highlight}>«четвёртое пространство»</span><br/> ждёт тебя!
            </h1>
            <p className={styles.subheadline}>
              Пространство для общения, творчества и вдохновения. Заходи днём за кофе, а вечером — за впечатлениями и настроением.
            </p>
            <button className={styles.ctaButton} onClick={onOpenBookingModal}>
              Забронировать место
            </button>
          </div>
        </div>
        <LazyImage 
          src="/images/hero-sgk.png"
          alt="Steppe Coffee Character"
          className={styles.character}
        />
      </div>
      
      {/* SVG волна */}
      <div className={styles.waveContainer}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
          className={styles.wave}
        >
          {/* Основная заливка волны */}
          <path 
            fill="#FDE515" 
            fillOpacity="1" 
            d="M0,160L48,165.3C96,171,192,181,288,176C384,171,480,149,576,154.7C672,160,768,192,864,208C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          {/* Белая граница только для верхней части волны */}
          <path
            fill="none"
            stroke="#ffffff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M0,160L48,165.3C96,171,192,181,288,176C384,171,480,149,576,154.7C672,160,768,192,864,208C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96"
          />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;