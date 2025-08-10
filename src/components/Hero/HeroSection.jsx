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
      /></div>
     
    </section>
  );
};

export default HeroSection;