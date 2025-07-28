// src/components/WelcomeDesk/WelcomeDesk.jsx
import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './WelcomeDesk.module.scss';
import DeskItem from './DeskItem/DeskItem';
import NewsSticker from './NewsSticker/NewsSticker';
import SaigakSticker from './SaigakSticker/SaigakSticker';

import deskItemsData from '../../data/deskData.json';

const WelcomeDesk = () => {
  const { ref, inView } = useInView({
    
  });
  const pinImageMap = {
    wood: '/images/desk/detail/прищепка.png',
    red: '/images/desk/detail/redPin.png',
    blue: '/images/desk/detail/bluePin.png',
    green: '/images/desk/detail/greenPin.png',
    yellow: '/images/desk/detail/yellowPin.png',
    white: '/images/desk/detail/whitePin.png',
    paperClip: '/images/desk/detail/paper-clip.png',
  };
      // --- Верхние 3 полароидных фоток ---

  const polaroidItems = [
        // --- 3 полароида ---
        {
          id: 'polaroid1',
          imageSrc: '/images/desk/polaroid1.png',
          videoSrc: '/videos/desk/video1.webm',
          title: 'Моменты ♥',
          position: { top: 20, left: 4, transform: 'rotate(7deg)', zIndex: 12 },  
          size: 'medium',
          wrapperClass: styles.polaroidWrapper1, 
          pinType: 'wood',
          pinOffset: { top: -42, left: 120, rotate: '24deg' }
        },
        {
          id: 'polaroid2',
          imageSrc: '/images/desk/polaroid2.png',
          videoSrc: '/videos/desk/video2.webm',
          title: '★☺♫♪',
          position: { top: 23, left: 42, transform: 'rotate(-4deg)', zIndex: 11 },  
          size: 'large',
          wrapperClass: styles.polaroidWrapper2,
          pinType: 'wood',
          pinOffset: { top: -42, left: 52, rotate: '-10deg' }
        },
        {
          id: 'polaroid3',
          imageSrc: '/images/desk/polaroid3.png',
          videoSrc: '/videos/desk/video3.webm',
          position: { top: 20, left: 74, transform: 'rotate(-4deg)', zIndex: 10 }, 
          size: 'small',
          wrapperClass: styles.polaroidWrapper3,
          pinType: 'wood',
          pinOffset: { top: -42, left: 84, rotate: '7deg' }
        },
      ];

      // --- Нижние 5 фоток ---

      const bottomLivePhotos = [

        {
          id: 'live-photo-1',
          imageSrc: '/images/desk/live/live-1.png',
          videoSrc: '/videos/desk/video-live-1.webm',
          position: { top: 52, left: 1, transform: 'rotate(0deg)', zIndex: 9 }, 
          size: 'livePhotoSize-1',
          wrapperClass: styles.livePhotoWrapper1, 
          pinType: 'yellow', 
          pinOffset: { top: 5, left: 65, rotate: '0deg' }
        },
        {
          id: 'live-photo-2',
          imageSrc: '/images/desk/live/live-2.png',
          videoSrc: '/videos/desk/video-live-1.webm',
          position: { top: 65, left: 18, transform: 'rotate(1deg)', zIndex: 8 },
          size: 'livePhotoSize-2',
          wrapperClass: styles.livePhotoWrapper2,
          pinType: 'red', 
          pinOffset: { top: 2, left: 90, rotate: '0deg' }
        },
        {
            id: 'live-photo-3',
            imageSrc: '/images/desk/live/live-3.png', 
            videoSrc: '/videos/desk/video-live-1.webm', 
            position: { top: 62, left: 35, transform: 'rotate(-1deg)', zIndex: 7 },
            size: 'livePhotoSize-3',
            wrapperClass: styles.livePhotoWrapper3,
            pinType: 'yellow', 
            pinOffset: { top: -3, left: 123, rotate: '0deg' }
        },
        {
            id: 'live-photo-4',
            imageSrc: '/images/desk/live/live-4.png',
            videoSrc: '/videos/desk/video-live-1.webm',
            position: { top: 48, left: 60, transform: 'rotate(0deg)', zIndex: 5 },
            size: 'livePhotoSize-4',
            wrapperClass: styles.livePhotoWrapper4,
            pinType: 'green', 
            pinOffset: { top: 5, left: 140, rotate: '0deg' }
        },
        {
            id: 'live-photo-5',
            imageSrc: '/images/desk/live/live-5.png', 
            videoSrc: '/videos/desk/video-live-1.webm', 
            position: { top: 65, left: 80, transform: 'rotate(1deg)', zIndex: 6 },
            size: 'livePhotoSize-5',
            wrapperClass: styles.livePhotoWrapper5,
            pinType: 'white', 
            pinOffset: { top: 3, left: 100, rotate: '0deg' }
        },
  ];

  const stickerItems = deskItemsData.filter(item => item.type === 'sticker'); 
  const decorationItems = deskItemsData.filter(item => item.type === 'decoration'); 
  const decorationWithPinItems = deskItemsData.filter(item => item.type === 'decoration_with_pin');  
  const saigakStickerItems = deskItemsData.filter(item => item.type === 'saigak_sticker');

  return (
    <section ref={ref} className={`${styles.welcomeSection} ${inView ? styles.visible : ''}`}>
      <div className={styles.corkBoard}>

        {/* заголовок фото */}
        <div className={styles.boardTitle}>
          <img
            src="/images/desk/заголовок.png" 
            alt="Steppe Coffee – место, где оживает атмосфера"
            className={styles.titleImage}
          />        
        </div>

        {/* нить */}
        <div className={styles.imageString}>
          <img
            src="/images/desk/нить.png" 
            alt="нить"
            className={styles.stringImage} 
          />  
        </div>
                {/* Рендерим верхние 3 полароида */}

        {polaroidItems.map(item => (
          <React.Fragment key={item.id}>
            {/* рамка для полароида*/}
            <div className={`${item.wrapperClass}`} style={{ 
                top: `${item.position.top}%`,  
                left: `${item.position.left}%`,
                transform: item.position.transform, 
                zIndex: item.position.zIndex 
            }}>
              <DeskItem item={{ ...item, position: undefined }} />
            </div>
            
            {/* Прищепка */}
            <img
              src={pinImageMap[item.pinType] || pinImageMap.wood} 
              alt="Прищепка"
              className={styles.pin}
              style={{
                // Calc теперь будет работать корректно: число% + числоpx
                top: `calc(${item.position.top}% + ${item.pinOffset.top}px)`,
                left: `calc(${item.position.left}% + ${item.pinOffset.left}px)`,
                transform: `rotate(${item.pinOffset.rotate || '0deg'})`, 
                zIndex: item.position.zIndex + 20, 
              }}
            />
          </React.Fragment>
        ))}

                {/* Рендерим нижние 5 живых фото */}

        {bottomLivePhotos.map(item => (
          <React.Fragment key={item.id}>
            <div className={`${item.wrapperClass}`} style={{ 
                  top: `${item.position.top}%`,
                  left: `${item.position.left}%`,
                  transform: item.position.transform, 
                  zIndex: item.position.zIndex 
              }}>
      <DeskItem item={{ ...item, position: undefined }} />
    </div>
    
    <img
      src={pinImageMap[item.pinType]} 
      alt="Прищепка"
      className={styles.pin}
      style={{
        top: `calc(${item.position.top}% + ${item.pinOffset.top}px)`,
        left: `calc(${item.position.left}% + ${item.pinOffset.left}px)`,
        transform: `rotate(${item.pinOffset.rotate || '0deg'})`, 
        zIndex: item.position.zIndex + 20, 
      }}
    />
  </React.Fragment>
        ))}

                {/* Рендерим стикеры с изображением скотча */}

       {stickerItems.map(sticker => (
          <React.Fragment key={sticker.id}>
            <div className={styles.stickerWrapper} style={{
                top: `${sticker.position.top}%`,
                left: `${sticker.position.left}%`,
                transform: sticker.position.transform,
                zIndex: sticker.position.zIndex,
              }}>
              <NewsSticker
                text={sticker.text}
                stickerColor={sticker.stickerColor}
              />
              <img
                src="/images/desk/detail/stickerPin.png"  
                alt="Скотч"
                className={styles.tape}  
                style={{
                  top: '-15px', 
                  left: '-10px', 
                  transform: 'rotate(10deg)', 
                  zIndex: 2, 

                }}
              />
            </div>
            
          </React.Fragment>
        ))}

        {/* Рендерим декоративные элементы БЕЗ прищепок */}

        {decorationItems.map(decoration => (
          <img
            key={decoration.id}
            src={decoration.imageSrc}
            alt={`Декорация ${decoration.id}`}
            className={styles.decorationItem} 
            style={{
              position: 'absolute', 
              top: `${decoration.position.top}%`,
              left: `${decoration.position.left}%`,
              transform: decoration.position.transform,
              zIndex: decoration.position.zIndex,
            }}
          />
        ))}

        {/* Рендерим декоративные элементы С прищепками */}
        
        {decorationWithPinItems.map(item => ( // Используем decorationWithPinItems
          <React.Fragment key={item.id}>
            <img
              src={item.imageSrc}
              alt={`Декорация ${item.id}`}
              className={styles.decorationItem} // Можно создать новый класс или использовать этот
              style={{
                position: 'absolute', 
                top: `${item.position.top}%`,
                left: `${item.position.left}%`,
                transform: item.position.transform,
                zIndex: item.position.zIndex,
                // Возможно, здесь нужно задать ширину/высоту, если это большая картинка
                width: '100px', // Пример, настроить по размеру фото
                height: 'auto',
              }}
            />
            {/* Прищепка для декоративного элемента с прищепкой */}
            <img
              src={pinImageMap[item.pinType] || pinImageMap.wood} 
              alt="Прищепка"
              className={styles.pin}
              style={{
                top: `calc(${item.position.top}% + ${item.pinOffset.top}px)`,
                left: `calc(${item.position.left}% + ${item.pinOffset.left}px)`,
                transform: `rotate(${item.pinOffset.rotate || '0deg'})`, 
                zIndex: item.position.zIndex + 1,  
              }}
            />
          </React.Fragment>
        ))}

        {/* Рендерим наклейки с сайгаками и их прищепки - теперь используем компонент SaigakSticker */}
       
        {saigakStickerItems.map(saigakSticker => (
          <React.Fragment key={saigakSticker.id}>
            <div className={styles.saigakStickerWrapper} style={{ 
              position: 'absolute', 
              top: `${saigakSticker.position.top}%`,
              left: `${saigakSticker.position.left}%`,
              transform: saigakSticker.position.transform,
              zIndex: saigakSticker.position.zIndex,
            }}>
              <SaigakSticker
                saigakImageSrc={saigakSticker.saigakImageSrc}
                text={saigakSticker.text}
                backgroundShape={saigakSticker.backgroundShape}
                backgroundColor={saigakSticker.backgroundColor}
                textColor={saigakSticker.textColor}
                pinImageSrc={pinImageMap[saigakSticker.pinType] || pinImageMap.wood}  
                pinOffset={saigakSticker.pinOffset}
              />
            </div>
          </React.Fragment>
        ))}

      </div>
    </section>
  );
};


export default WelcomeDesk;