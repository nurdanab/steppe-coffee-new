// src/components/WelcomeDesk/DeskItem/DeskItem.jsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './DeskItem.module.scss';
import LazyImage from '../LazyImage/LazyImage.jsx';

const DeskItem = ({ item, pinImageSrc }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered && isVideoReady) {
        videoRef.current.play().catch(error => {
          console.error("Ошибка видео:", error);
        });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, isVideoReady]);

  useEffect(() => {
    if (videoRef.current) {
      const handleCanPlay = () => {
        setIsVideoReady(true);
      };

      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.load();

      return () => {
        videoRef.current?.removeEventListener('canplay', handleCanPlay);
        setIsVideoReady(false);
      };
    }
  }, [item.videoSrc]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`${styles.deskItem} ${styles[item.size] || styles.medium}`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* прищепки */}
      {pinImageSrc && (
        <LazyImage
          src={pinImageSrc}
          alt="Прищепка"
          className={styles.pin} 
        />
      )}
      <div className={styles.mediaContainer}>
        <LazyImage
          src={item.imageSrc}
          alt={item.altText}
          className={`${styles.media} ${isHovered && isVideoReady ? styles.hidden : ''}`}
        />

        <video
          ref={videoRef}
          src={item.videoSrc}
          loop
          muted
          playsInline
          preload="auto"
          poster={item.imageSrc}
          className={`${styles.media} ${!isHovered || !isVideoReady ? styles.hidden : ''}`}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      {item.title && <p className={styles.itemTitle}>{item.title}</p>}
    </div>
  );
};

export default DeskItem;