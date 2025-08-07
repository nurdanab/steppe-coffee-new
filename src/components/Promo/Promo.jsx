import React from 'react';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom'; // Импортируем useNavigate
import styles from './Promo.module.scss';
import promotionsData from '../../data/promotionsData.json';

const Promo = () => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const navigate = useNavigate(); // Инициализируем хук

  const handleNavigateToMenu = () => {
    navigate('/menu'); // Функция для перехода на страницу '/menu'
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
          {/* Отображаем первую промо-карточку */}
          {promoSlot1 && (
            <div className={`${styles.promoCard} ${inView ? styles.cardVisible : ''}`}>
              {promoSlot1.imageUrl && (
                <img
                  src={promoSlot1.imageUrl}
                  alt={`Промо ${promoSlot1.id}`}
                  className={styles.promoImage}
                />
              )}
            </div>
          )}

          {/* Отображаем вторую промо-карточку */}
          {promoSlot2 && (
            <div className={`${styles.promoCard} ${inView ? styles.cardVisible : ''}`}>
              {promoSlot2.imageUrl && (
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
          onClick={handleNavigateToMenu} // Добавляем обработчик клика
        >
          Перейти в меню
        </button>
      </div>
    </section>
  );
};

export default Promo;