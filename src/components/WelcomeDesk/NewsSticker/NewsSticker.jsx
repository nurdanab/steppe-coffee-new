// src/components/WelcomeDesk/NewsSticker/NewsSticker.jsx
import React from 'react';  
import styles from './NewsSticker.module.scss';

const NewsSticker = ({ text, stickerColor }) => {
  return (
    <div
      className={`${styles.sticker} ${styles[stickerColor]}`}  
    >
      <p className={styles.stickerText}>
        {text}
      </p>
    </div>
  );
};

export default NewsSticker;