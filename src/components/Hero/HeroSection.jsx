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
              Ваше <span className={styles.highlight}>третье</span><br />пространство ждет вас
            </h1>
            <p className={styles.subheadline}>
              Пространство для общения, вдохновения и новых впечатлений.
            </p>
            <button className={styles.ctaButton} onClick={onOpenBookingModal}>
              Забронировать столик
            </button>
          </div>
          <div className={styles.heroSpacer}></div>
        </div>
      </div>
      <LazyImage 
        src="/images/hero-sgk.png"
        alt="Steppe Coffee Character"
        className={styles.character}
      />
    </section>
  );
};

export default HeroSection;