// src/components/LazyImage/LazyImage.jsx
import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './LazyImage.module.scss'; // Создадим CSS-модуль для стилей

const LazyImage = ({ src, alt, ...props }) => {
  const { ref, inView } = useInView({
    // threshold: 0.1, // Можно настроить, когда именно должно начаться появление
    triggerOnce: true, // Загрузить изображение только один раз
  });

  return (
    <div ref={ref} className={styles.lazyContainer}>
      {inView ? (
        <LazyImage src={src} alt={alt} {...props} />
      ) : (
        <div className={styles.placeholder}></div>
      )}
    </div>
  );
};

export default LazyImage;