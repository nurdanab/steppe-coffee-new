// src/components/DeliverySection/DeliverySection.jsx
import React, { forwardRef } from 'react';
import styles from './DeliverySection.module.scss';
import woltIcon from '/images/wolt-icon.png';
import woltCharacter from '/images/menuSaygak.png'; 
import decor1 from '/images/decor-vector.webp';
import decor2 from '/images/map-decor2.png';
import LazyImage from '../LazyImage/LazyImage.jsx';


const DeliverySection = forwardRef((props, ref) => {
  return (
    <section ref={ref} className={`${styles.deliverySection} section`}>
     <div className={styles.topWave}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L30,122.7C60,149,120,203,180,202.7C240,203,300,149,360,133.3C420,117,480,139,540,165.3C600,192,660,224,720,208C780,192,840,128,900,112C960,96,1020,128,1080,154.7C1140,181,1200,203,1260,176C1320,149,1380,75,1410,37.3L1440,0L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"></path>
        </svg>
      </div>
    <div className="container">

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
        {/* <LazyImage
        src={decor1}
         className={styles.decor1}
      />   
          <LazyImage
            src={decor2}
            className={styles.decor2}
          /> */}
        {/* </div> */}


        <div className={styles.imageContainer}>
        <LazyImage
        src={woltIcon}
        alt="Wolt"
        className={`${styles.woltIcon} animate-float`}
      />   
          <LazyImage
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