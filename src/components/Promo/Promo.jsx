import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './Promo.module.scss';
import promotionsData from '../../data/promotionsData.json'; 


const Promo = () => {
  const { ref, inView } = useInView({
    threshold: 0.1, // Срабатывает, когда 10% элемента видно
    triggerOnce: true, // Анимация запускается только один раз
  });

  const { promoSlot1, promoSlot2 } = promotionsData;

  return (
    <section ref={ref} className={`${styles.promoSection} ${inView ? styles.visible : ''}`}>
      <div className="headerFullWidthContainer"> 
        <h2 className={`${styles.promoTitle} ${inView ? styles.visible : ''}`}>
          Промо-предложения
        </h2>
        
        {/* Контейнер для двух промо-карточек */}
        <div className={styles.promoCardsContainer}>
          {/* Отображаем первую промо-карточку */}
          {promoSlot1 && ( // Проверяем, что promoSlot1 существует
            <div className={`${styles.promoCard} ${inView ? styles.cardVisible : ''}`}>
              {promoSlot1.imageUrl && ( // Проверяем, что есть URL изображения
                <img 
                  src={promoSlot1.imageUrl} 
                  alt={`Промо ${promoSlot1.id}`} 
                  className={styles.promoImage} 
                />
              )}
            </div>
          )}

          {/* Отображаем вторую промо-карточку */}
          {promoSlot2 && ( // Проверяем, что promoSlot2 существует
            <div className={`${styles.promoCard} ${inView ? styles.cardVisible : ''}`}>
              {promoSlot2.imageUrl && ( // Проверяем, что есть URL изображения
                <img 
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
        >
          Перейти в меню
        </button>
      </div>
    </section>
  );
};

export default Promo;
