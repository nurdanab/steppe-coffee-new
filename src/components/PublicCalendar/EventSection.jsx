// src/components/PublicCalendar/EventSection.jsx

import React from 'react';
import styles from './EventSection.module.scss';
import communityImage from '../../../public/images/comunity-1.webp'; 

const EventSection = ({ eventData }) => {
  const staticEvent = {
    title: "Встречаемся в Steppe Coffee",
    text: "Наша комьюнити-комната — это место, где собираются люди с разными интересами и целями. Здесь проходят встречи клубов, рабочие собрания, мастер-классы, игры и тёплые дружеские посиделки. Мы создаём атмосферу, в которой легко общаться, обмениваться идеями и проводить время с пользой. На этой странице вы можете посмотреть, какие события запланированы в ближайшее время.",
    photos: [
      communityImage,
    ],
    communities: [
      { name: "NAME (of community)", logo: communityImage },
      { name: "NAME (of community)", logo: communityImage },
      { name: "NAME (of community)", logo: communityImage },
    ],
  };

  const data = eventData || staticEvent;

  return (
    <div className={styles.eventSectionWrapper}>
      <div className={styles.contentContainer}>
        <div className="container"> 
          <div className={styles.textAndPhotos}>
            <div className={styles.textBlock}>
              <h2 className={styles.title}>{data.title}</h2>
              <p className={styles.text}>{data.text}</p>
            </div>
            <div className={styles.photosBlock}>
              {data.photos.map((photo, index) => (
                <div key={index} className={styles.photoWrapper}>
                  <img src={photo} alt={`Photo ${index + 1}`} className={styles.photo} />
                  <span className={styles.photoLabel}></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSection;