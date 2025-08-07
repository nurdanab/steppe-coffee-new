// src/components/DeliverySection/DeliverySection.jsx
import React, { forwardRef } from 'react';
import styles from './DeliverySection.module.scss';
import woltIcon from '/images/wolt-icon.png';
import woltCharacter from '/images/menuSaygak.png'; 
import decor1 from '/images/decor-vector.webp';
import decor2 from '/images/map-decor2.png';


const DeliverySection = forwardRef((props, ref) => {
  return (
    <section ref={ref} className={`${styles.deliverySection} section`}>
                    <div className="container">

      {/* <div className={`${styles.contentWrapper} container`}> */}
        <div className={styles.textContainer}>
          <h2 className={`${styles.heading} riffic-32`}>
            Заказывайте Steppe Coffe
            <br />
            с доставкой Wolt
          </h2>
          <p className={`${styles.description} gilroy-24`}>
            Wolt доставит ваши любимые напитки и еду прямо к двери
          </p>
          <a
            href="https://wolt.com/en/kaz/almaty/restaurant/steppe-coffee-63?srsltid=AfmBOoquoWg6sftTTSrx3osd3ly-XiZS-gjC9_mczgD_iy5X4hrl6hod"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.button} button-primary`}
          >
            Заказать сейчас
          </a>
        </div>
        <div className={styles.decorContainer}>
        <img
        src={decor1}
        // alt="Wolt"
        className={styles.decor1}
      />   
          <img
            src={decor2}
            // alt="Wolt character"
            className={styles.decor2}
          />
        {/* </div> */}


        <div className={styles.imageContainer}>
        <img
        src={woltIcon}
        alt="Wolt"
        className={`${styles.woltIcon} animate-float`}
      />   
          <img
            src={woltCharacter}
            alt="Wolt character"
            className={styles.woltCharacter}
          />
        </div>
      </div>
         </div>

    </section>
  );
});

DeliverySection.displayName = 'DeliverySection';

export default DeliverySection;