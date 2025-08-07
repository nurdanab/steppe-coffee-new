// src/components/WelcomeDesk/SaigakSticker/SaigakSticker.jsx
import React from 'react';
import styles from './SaigakSticker.module.scss';

const SaigakSticker = ({ saigakImageSrc, text, backgroundShape, backgroundColor, textColor, pinImageSrc, pinOffset }) => {
  return (
    <div className={styles.saigakStickerContainer}>
      {/* Изображение сайгака (самый верхний слой) */}
      <img src={saigakImageSrc} alt="Сайгак" className={styles.saigakImage} /> 
      
      {/* Прищепка (средний слой) */}
      {pinImageSrc && (
        <img
          src={pinImageSrc}
          alt="Прищепка"
          className={styles.saigakStickerPin}
          style={{
            top: `calc(${pinOffset.top}px)`,
            left: `calc(${pinOffset.left}px)`,
            transform: `rotate(${pinOffset.rotate || '0deg'})`,
          }}
        />
      )}

      {/* Текстовый фон (самый нижний слой) */}
      <div className={`${styles.textBox} ${styles[`shape_${backgroundShape}`]} ${styles[`bg_${backgroundColor}`]}`}>
        <p className={styles.stickerText} style={{ color: textColor }}>
          {text}
        </p>
      </div>
    </div>
  );
};

export default SaigakSticker;