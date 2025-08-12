// src/components/PublicCalendar/EventSection.jsx

import React from 'react';
import styles from './EventSection.module.scss';
import communityImage from '../../../public/images/comunity-1.webp'; 

const EventSection = ({ eventData }) => {
  const staticEvent = {
    title: "TEXT",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
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