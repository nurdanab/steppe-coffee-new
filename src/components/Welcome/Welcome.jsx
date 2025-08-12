import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './Welcome.module.scss';
import LazyImage from '../LazyImage/LazyImage.jsx';

const Welcome = () => {
  const { ref, inView } = useInView({

  });

  return (
    <section ref={ref} className={`${styles.welcome} ${inView ? styles.visible : ''}`}>
           <div className="container"> 
      <div className={styles.welcomeContent}>
         <div className={`${styles.welcomeTitleBox} ${inView ? styles.titleBoxVisible : ''}`}>
          <h1 className={styles.welcomeTitle}>Добро пожаловать в ваше четвёртое место!</h1>
        </div>

        <div className={styles.welcomeMainInfo}>
           <LazyImage
            src="/images/welcome-sgk.png" 
            alt="Главный персонаж Steppe Coffee"
            className={`${styles.characterImage} ${inView ? styles.imageVisible : ''}`}
            
          />
<div className={`${styles.textContainer} ${inView ? styles.textVisible : ''}`}>
            <p>
            Steppe Coffee — это история, которую мы пишем вместе с тобой. Это больше, чем просто кофейня. Это наше «четвёртое пространство», где каждый чувствует себя как дома, где рождаются новые идеи и завязываются настоящие знакомства.
            </p>
            <p>
            Мы верим, что самый лучший кофе — это тот, который дарит тебе эмоции. Поэтому мы с любовью подходим к каждой чашке и стараемся сделать твой визит незабываемым. Приходи и почувствуй эту атмосферу!            </p>
          </div>
           
        </div>
      </div>
      </div>
      
    </section>
  );
};

export default Welcome;