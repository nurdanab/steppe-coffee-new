import React from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom'; 
import LazyImage from '../LazyImage/LazyImage.jsx';
import styles from './Promo.module.scss';
import promotionsData from '../../data/promotionsData.json';

const Promo = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const navigate = useNavigate();

  const handleNavigateToMenu = () => {
    navigate('/menu');
  };

  const { promoSlot1, promoSlot2 } = promotionsData;

  return (
    <section ref={ref} className={`${styles.promoSection} ${inView ? styles.visible : ''}`}>
      <div className="container">
        <h2 className={`${styles.promoTitle} ${inView ? styles.visible : ''}`}>
          Промо-предложения
        </h2>

        {/* Контейнер для двух промо-карточек */}
        <div className={styles.promoCardsContainer}>
          {promoSlot1 && (
            <div className={`${styles.promoCard} ${inView ? styles.cardVisible : ''}`}>
              {promoSlot1.imageUrl && (
                <LazyImage
                  src={promoSlot1.imageUrl}
                  alt={`Промо ${promoSlot1.id}`}
                  className={styles.promoImage}
                />
              )}
            </div>
          )}

          {promoSlot2 && (
            <div className={`${styles.promoCard} ${inView ? styles.cardVisible : ''}`}>
              {promoSlot2.imageUrl && (
                <LazyImage
                  src={promoSlot2.imageUrl}
                  alt={`Промо ${promoSlot2.id}`}
                  className={styles.promoImage}
                />
              )}
            </div>
          )}
        </div>
        <button
          className={`${styles.menuButton} ${inView ? styles.buttonVisible : ''}`}
          onClick={handleNavigateToMenu} 
        >
          Перейти в меню
        </button>
      </div>
      <div className={styles.waveContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          {/* Path для заливки волны */}
          <path
            fill="#FEF8BC"
            fillOpacity="1"
            d="M0,64L48,85.3C96,107,192,149,288,138.7C384,128,480,64,576,48C672,32,768,64,864,69.3C960,75,1056,53,1152,48C1248,43,1344,53,1392,58.7L1440,64L1440,320L0,320Z">
          </path>
          {/* Path для контура волны */}
          <path
            fill="none"
            stroke="#ffffff"
            strokeWidth="35"
            d="M0,64L48,85.3C96,107,192,149,288,138.7C384,128,480,64,576,48C672,32,768,64,864,69.3C960,75,1056,53,1152,48C1248,43,1344,53,1392,58.7L1440,64">
          </path>
        </svg>
      </div>
    </section>
  );
};

export default Promo;