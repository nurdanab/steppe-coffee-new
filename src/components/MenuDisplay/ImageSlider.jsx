// src/components/ImageSlider/ImageSlider.jsx
import React, { useState, useEffect } from 'react';
import styles from './ImageSlider.module.scss';

import image1 from '/images/menuBack-1.webp'; 
import image2 from '/images/menuback-2.webp';
import image3 from '/images/menuback-3.webp';
import image4 from '/images/menuback-4.webp';
import image5 from '/images/menuback-5.webp';

const images = [image1, image2, image3, image4, image5];

const ImageSlider = ({ deliverySectionRef }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleScrollToDelivery = () => {
    if (deliverySectionRef && deliverySectionRef.current) {
      deliverySectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % images.length
      );
    }, 5000); // 5000 миллисекунд = 5 секунд

    return () => clearInterval(interval); // Очистка интервала при размонтировании компонента
  }, []);

  return (
    <div className={styles.imageSlider}>
      <div 
        className={styles.imageContainer}
        style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
      >
              <div className="container">
          <h1 className={styles.title}>МЕНЮ <br/> Steppe Cofee</h1>
          <button 
            onClick={handleScrollToDelivery}
            className={`${styles.button} button-primary`}
          >
            Заказать онлайн
          </button>
        </div>
      </div>
      <div className={styles.dotsContainer}>
        {images.map((_, index) => (
          <span
            key={index}
            className={`${styles.dot} ${currentImageIndex === index ? styles.active : ''}`}
            onClick={() => setCurrentImageIndex(index)}
          ></span>
        ))}
    </div>    </div>

  );
};

export default ImageSlider;