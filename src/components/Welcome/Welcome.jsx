import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './Welcome.module.scss';

const Welcome = () => {
  const { ref, inView } = useInView({
    // threshold: 0.1,
    // triggerOnce: true,
  });

  return (
    <section ref={ref} className={`${styles.welcome} ${inView ? styles.visible : ''}`}>
           <div className="container"> 
      <div className={styles.welcomeContent}>
        {/* Заголовок */}
        <div className={`${styles.welcomeTitleBox} ${inView ? styles.titleBoxVisible : ''}`}>
          <h1 className={styles.welcomeTitle}>Добро пожаловать в ваше третье место!</h1>
        </div>

        <div className={styles.welcomeMainInfo}>
          {/* Изображение главного персонажа */}
          <img
            src="/images/welcome-sgk.png" 
            alt="Главный персонаж Steppe Coffee"
            className={`${styles.characterImage} ${inView ? styles.imageVisible : ''}`}
          />

          {/* Контейнер для текстовых абзацев */}
          <div className={`${styles.textContainer} ${inView ? styles.textVisible : ''}`}>
            <p>
              Steppe Coffee – это больше, чем просто кофейня. Это центр общения, творчество и, конечно же, отличного кофе. Здесь вы найдете уютное место для работы, пространство для встреч с друзьями и, без сомнения, лучший кофе в городе.
            </p>
            <p>
              Мы стремимся создать уютную атмосферу, где каждый чувствует себя как дома. Наша страсть к кофе сочетается с приверженностью к устойчивому развитию, высокому качеству и поддержке сообщества.
            </p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default Welcome;