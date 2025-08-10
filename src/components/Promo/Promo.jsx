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
    </section>
  );
};

export default Promo;