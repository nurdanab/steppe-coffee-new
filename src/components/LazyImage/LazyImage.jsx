import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './LazyImage.module.scss';

const LazyImage = ({ src, alt, className, ...restProps }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });

  // Комбинируем переданный класс с классом из модуля
  const imageClassName = className ? `${styles.image} ${className}` : styles.image;

  return (
    <div ref={ref} className={styles.lazyContainer}>
      {inView ? (
        <img src={src} alt={alt} className={imageClassName} {...restProps} />
      ) : (
        <div className={styles.placeholder}></div>
      )}
    </div>
  );
};

export default LazyImage;