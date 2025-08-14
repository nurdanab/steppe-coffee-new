// src/components/WelcomeDesk/WelcomeDesk.jsx
import React from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './WelcomeDesk.module.scss';
import DeskItem from './DeskItem/DeskItem';
import NewsSticker from './NewsSticker/NewsSticker';
import SaigakSticker from './SaigakSticker/SaigakSticker';
import LazyImage from '../LazyImage/LazyImage.jsx';
import deskItemsDataWrapper from '../../data/deskData.json';
import saigakPositions from './SaigakPositions.module.scss';
import NewsStickerStyles from './NewsSticker/NewsSticker.module.scss';
import DeskItemStyles from './DeskItem/DeskItem.module.scss';

const WelcomeDesk = () => {
  const { ref, inView } = useInView({});
  const pinImageMap = {
    wood: '/images/desk/detail/прищепка.png',
    red: '/images/desk/detail/redPin.png',
    blue: '/images/desk/detail/bluePin.png',
    green: '/images/desk/detail/greenPin.png',
    yellow: '/images/desk/detail/yellowPin.png',
    white: '/images/desk/detail/whitePin.png',
    paperClip: '/images/desk/detail/paper-clip.png',
  };

  const allDeskItems = deskItemsDataWrapper.items;

  const polaroidItems = [
    {
      id: 'polaroid1',
      imageSrc: '/images/desk/polaroid1.png',
      videoSrc: '/videos/desk/video1.webm',
      title: 'Каждая чашка-это\nискусство ♥',
      position: { top: 20, left: 4, transform: 'rotate(7deg)', zIndex: 18 },
      size: 'medium',
      wrapperClass: styles.polaroidWrapper1,
      pinType: 'wood',
      pinClass: DeskItemStyles['pin-polaroid1'],
    },
    {
      id: 'polaroid2',
      imageSrc: '/images/desk/polaroid2.webp',
      videoSrc: '/videos/desk/video2.webm',
      title: 'Ваше «четвертое\nпространство ждёт»!',
      position: { top: 23, left: 42, transform: 'rotate(-4deg)', zIndex: 17 },
      size: 'large',
      wrapperClass: styles.polaroidWrapper2,
      pinType: 'wood',
      pinClass: DeskItemStyles['pin-polaroid2'],
    },
    {
      id: 'polaroid3',
      imageSrc: '/images/desk/polaroid3.webp',
      videoSrc: '/videos/desk/video3.webm',
      position: { top: 20, left: 74, transform: 'rotate(-4deg)', zIndex: 16 },
      size: 'small',
      wrapperClass: styles.polaroidWrapper3,
      pinType: 'wood',
      pinClass: DeskItemStyles['pin-polaroid3'],
    },
  ];

  const bottomLivePhotos = [
    {
      id: 'live-photo-1',
      imageSrc: '/images/desk/live/live-1.webp',
      videoSrc: '/videos/desk/video-live-1.webm',
      position: { top: 52, left: 1, transform: 'rotate(0deg)', zIndex: 9 },
      size: 'livePhotoSize-1',
      wrapperClass: styles.livePhotoWrapper1,
      pinType: 'wood',
      pinClass: DeskItemStyles['pin-live-photo-1'],
    },
    {
      id: 'live-photo-2',
      imageSrc: '/images/desk/live/live-3.png',
      videoSrc: '/videos/desk/video-live-2.webm',
      position: { top: 65, left: 18, transform: 'rotate(1deg)', zIndex: 8 },
      size: 'livePhotoSize-2',
      wrapperClass: styles.livePhotoWrapper2,
      pinType: 'red',
      pinClass: DeskItemStyles['pin-live-photo-2'],
    },
    {
      id: 'live-photo-3',
      imageSrc: '/images/desk/live/live-2.png',
      videoSrc: '/videos/desk/video-live-3.webm',
      position: { top: 62, left: 35, transform: 'rotate(-1deg)', zIndex: 7 },
      size: 'livePhotoSize-3',
      wrapperClass: styles.livePhotoWrapper3,
      pinType: 'yellow',
      pinClass: DeskItemStyles['pin-live-photo-3'],
    },
    {
      id: 'live-photo-4',
      imageSrc: '/images/desk/live/live-4.png',
      videoSrc: '/videos/desk/video-live-4.webm',
      position: { top: 48, left: 60, transform: 'rotate(0deg)', zIndex: 5 },
      size: 'livePhotoSize-4',
      wrapperClass: styles.livePhotoWrapper4,
      pinType: 'green',
      pinClass: DeskItemStyles['pin-live-photo-4'],
    },
    {
      id: 'live-photo-5',
      imageSrc: '/images/desk/live/live-5.png',
      videoSrc: '/videos/desk/video-live-5.webm',
      position: { top: 65, left: 80, transform: 'rotate(1deg)', zIndex: 6 },
      size: 'livePhotoSize-5',
      wrapperClass: styles.livePhotoWrapper5,
      pinType: 'white',
      pinClass: DeskItemStyles['pin-live-photo-5'],
    },
  ];

  const stickerItems = allDeskItems.filter(item => item.type === 'sticker');
  const decorationItems = allDeskItems.filter(item => item.type === 'decoration');
  const decorationWithPinItems = allDeskItems.filter(item => item.type === 'decoration_with_pin');
  const saigakStickerItems = allDeskItems.filter(item => item.type === 'saigak_sticker');

  const saigakPositionMap = {
    'saigak-sticker-1': saigakPositions.saigak1,
    'saigak-sticker-2': saigakPositions.saigak2,
    'saigak-sticker-3': saigakPositions.saigak3,
    'saigak-sticker-4': saigakPositions.saigak4,
  };

  const decorationMap = {
      'decoration-food-sticker': styles['decoration-food-sticker'],
  };

  const decorationWithPinMap = {
      'decoration-food-sticker': styles['pin-decoration-food-sticker'],
  };

  const tapeMap = {
    'news-sticker-1': NewsStickerStyles['tape-news-sticker'],
  };

  return (
    <section ref={ref} className={`${styles.welcomeSection} ${inView ? styles.visible : ''}`}>
      <div className="container">
        <div className={styles.corkBoard}>
          <div className={styles.boardTitle}>
            <LazyImage
              src="/images/desk/заголовок.webp"
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
          {polaroidItems.map(item => {
            return (
              <div 
                key={item.id}
                className={`${item.wrapperClass}`}
                style={{
                  top: `${item.position.top}%`,
                  left: `${item.position.left}%`,
                  transform: item.position.transform,
                  zIndex: item.position.zIndex,
                }}>
                <DeskItem 
                  item={{ ...item, position: undefined }}
                  pinImageSrc={pinImageMap[item.pinType]}
                  pinClassName={item.pinClass}
                />
              </div>
            );
          })}

          {/* Рендерим нижние 5 живых фото */}
          {bottomLivePhotos.map(item => {
            return (
              <div 
                key={item.id}
                className={`${item.wrapperClass}`} 
                style={{
                  top: `${item.position.top}%`,
                  left: `${item.position.left}%`,
                  transform: item.position.transform,
                  zIndex: item.position.zIndex,
                }}>
                <DeskItem 
                  item={{ ...item, position: undefined }}
                  pinImageSrc={pinImageMap[item.pinType]}
                  pinClassName={item.pinClass}
                />
              </div>
            );
          })}
          {/* Рендерим стикеры с изображением скотча */}
          {stickerItems.map(sticker => {
            return (
              <div 
                key={sticker.id} 
                className={styles.stickerWrapper} 
                style={{
                  top: `${sticker.position.top}%`,
                  left: `${sticker.position.left}%`,
                  transform: sticker.position.transform,
                  zIndex: sticker.position.zIndex,
                }}>
                <NewsSticker
                  text={sticker.text}
                  stickerColor={sticker.stickerColor}
                  tapeImageSrc="/images/desk/detail/stickerPin.png"
                  tapeClassName={tapeMap[sticker.id]}
                />
              </div>
            );
          })}

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
          {decorationWithPinItems.map(item => {
            const pinClass = decorationWithPinMap[item.id];
            const decorationClass = decorationMap[item.id];
            return (
              <React.Fragment key={item.id}>
                <img
                  src={item.imageSrc}
                  alt={`Декорация ${item.id}`}
                  className={decorationClass}
                />
                <img
                  src={pinImageMap[item.pinType] || pinImageMap.wood}
                  alt="Прищепка"
                  className={pinClass}
                />
              </React.Fragment>
            );
          })}

          {/* Рендерим наклейки с сайгаками и их прищепки - теперь используем компонент SaigakSticker */}
          {saigakStickerItems.map(saigakSticker => {
            const positionClass = saigakPositionMap[saigakSticker.id];
            return (
              <React.Fragment key={saigakSticker.id}>
                <div className={`${styles.saigakStickerWrapper} ${positionClass}`}>
                  <SaigakSticker
                    saigakImageSrc={saigakSticker.saigakImageSrc}
                    text={saigakSticker.text}
                    backgroundShape={saigakSticker.backgroundShape}
                    backgroundColor={saigakSticker.backgroundColor}
                    textColor={saigakSticker.textColor}
                    pinImageSrc={saigakSticker.pinType ? pinImageMap[saigakSticker.pinType] : null}
                    pinOffset={saigakSticker.pinOffset}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WelcomeDesk;