// src/components/DeliverySection/DeliverySection.jsx
import React, { forwardRef } from 'react';
import styles from './DeliverySection.module.scss';
import woltIcon from '/images/wolt-icon.png';
import woltCharacter from '/images/wolt-character.png'; 

// Используем forwardRef, чтобы родительский компонент мог получить доступ к DOM-узлу
const DeliverySection = forwardRef((props, ref) => {
  return (
    <section ref={ref} className={`${styles.deliverySection} section`}>
      <div className={`${styles.contentWrapper} container`}>
        <div className={styles.textContainer}>
          <h2 className={`${styles.heading} riffic-32`}>
            Заказывайте Steppe Coffe
            <br />
            с доставкой Wolt
          </h2>
          <p className={`${styles.description} gilroy-16`}>
            Wolt доставит ваши любимые напитки и еду прямо к двери
          </p>
          <a
            href="https://wolt.com/en/kaz/almaty/restaurant/steppe-coffee-63?srsltid=AfmBOopxQxSJJKAHuvQoK_-AmNZenDla5TThmJg4EZyXObIHZBO004_w"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} button-primary`}
          >
            Заказать сейчас
          </a>
        </div>
        <div className={styles.imageContainer}>
          <img
            src={woltCharacter}
            alt="Wolt character"
            className={styles.woltCharacter}
          />
        </div>
      </div>
      <img
        src={woltIcon}
        alt="Wolt"
        className={`${styles.woltIcon} animate-float`}
      />
    </section>
  );
});

DeliverySection.displayName = 'DeliverySection';

export default DeliverySection;