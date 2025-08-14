import React from 'react';
import styles from './EventModal.module.scss';
import { DateTime } from 'luxon';

const EventModal = ({ event, onClose }) => {
  if (!event) {
    return null;
  }

  const start = DateTime.fromJSDate(event.start);
  const end = DateTime.fromJSDate(event.end);

  const formatRoomName = (name) => {
    switch (name) {
      case 'second_hall':
        return 'Второй зал';
      case 'summer_terrace':
        return 'Летняя терраса';
      default:
        return 'Неизвестно';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        {/* 👈 Оберни весь контент в div с классом modalBody */}
        <div className={styles.modalBody}>
          <h2 className={styles.modalTitle}>{event.extendedProps.eventName}</h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Дата:</span>
            <span className={styles.infoValue}>{start.toFormat('dd.MM.yyyy')}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Время:</span>
            <span className={styles.infoValue}>{start.toFormat('HH:mm')} - {end.toFormat('HH:mm')}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Организатор:</span>
            <span className={styles.infoValue}>{event.extendedProps.organizerName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Место проведения:</span>
            <span className={styles.infoValue}>{formatRoomName(event.extendedProps.selectedRoom)}</span>
          </div>
          <p className={styles.modalDescription}>
            {event.extendedProps.eventDescription}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventModal;