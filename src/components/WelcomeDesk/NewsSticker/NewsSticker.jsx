// src/components/WelcomeDesk/NewsSticker/NewsSticker.jsx
import React from 'react';  
import styles from './NewsSticker.module.scss';

const NewsSticker = ({ text, stickerColor, tapeImageSrc, tapeClassName }) => {
  return (
    <div
      className={`${styles.stickerWrapper}`}
    >
      <div
        className={`${styles.sticker} ${styles[stickerColor]}`}  
      >
        <p className={styles.stickerText}>
          {text}
        </p>
      </div>
      {tapeImageSrc && (
        <img
          src={tapeImageSrc}
          alt="Скотч"
          className={`${styles.tape} ${tapeClassName}`}
        />
      )}
    </div>
  );
};

export default NewsSticker;