// HeroSection.jsx
import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './HeroSection.module.scss';

// Принимаем onOpenBookingModal как пропс
const HeroSection = ({ onOpenBookingModal }) => { // <-- ИСПРАВЛЕНИЕ ЗДЕСЬ!
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <section ref={ref} className={`${styles.hero} ${inView ? styles.visible : ''}`}>
      {/* Используем класс headerFullWidthContainer для согласования отступов с хедером */}
      <div className="headerFullWidthContainer">
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
          {/* Пустой элемент для грид-разметки, чтобы heroText не занимал всю ширину */}
          <div className={styles.heroSpacer}></div>
        </div>
      </div>
      {/* Персонаж теперь находится прямо в HeroSection, позиционируется глобально */}
      <img
        src="/images/hero-sgk.png"
        alt="Steppe Coffee Character"
        className={styles.character}
      />
    </section>
  );
};

export default HeroSection;