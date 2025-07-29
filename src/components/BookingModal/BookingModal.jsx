// src/components/BookingModal/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './BookingModal.module.scss';
import { supabase } from '../../supabaseClient';

// Принимаем currentUserId и currentUserEmail
const BookingModal = ({ isOpen, onClose, currentUserId, currentUserEmail }) => { // <-- Обновляем пропсы
  const [organizerName, setOrganizerName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Заполняем имя (если есть) и email из пропсов, если пользователь авторизован
  useEffect(() => {
    if (isOpen && currentUserId) {
      // Предзаполняем имя пользователя его email, если имя не хранится отдельно
      setOrganizerName(currentUserEmail || '');
    } else if (isOpen && !currentUserId) {
      // Если модальное окно открывается и пользователь НЕ авторизован
      setOrganizerName(''); // Очищаем форму, если она была заполнена
    }
    // Также сбрасываем дату, время, кол-во людей и комментарии, чтобы форма была чистой
    setBookingDate('');
    setStartTime('');
    setEndTime('');
    setNumPeople(1);
    setComments('');
  }, [isOpen, currentUserId, currentUserEmail]); // Зависимости хука

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!currentUserId) { // <-- Проверка на ID пользователя
        setError('Не удалось получить ID пользователя. Пожалуйста, войдите снова.');
        setLoading(false);
        return;
      }

      const newBooking = {
        organizer_name: organizerName, // Это имя будет введено в форме
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        num_people: numPeople,
        comments: comments,
        user_id: currentUserId, // <-- Используем ID пользователя из сессии Supabase Auth
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([newBooking])
        .select();

      if (error) {
        console.error('Ошибка при создании бронирования:', error);
        setError(`Ошибка при бронировании: ${error.message}`);
      } else {
        console.log('Бронирование успешно создано:', data);
        alert('Бронирование успешно отправлено!');
        onClose(); // Закрываем модальное окно
        // Здесь можно обновить расписание в календаре, если это необходимо
      }
    } catch (err) {
      console.error('Непредвиденная ошибка:', err);
      setError('Произошла непредвиденная ошибка. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>&times;</button>
        <h2>Забронировать столик</h2>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="organizerName">Ваше имя:</label>
            <input
              type="text"
              id="organizerName"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {/* ... остальные поля формы ... */}
          <div className={styles.formGroup}>
            <label htmlFor="bookingDate">Дата:</label>
            <input
              type="date"
              id="bookingDate"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="startTime">Время начала:</label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="endTime">Время окончания:</label>
            <input
              type="time"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="numPeople">Количество человек:</label>
            <input
              type="number"
              id="numPeople"
              value={numPeople}
              onChange={(e) => setNumPeople(Number(e.target.value))}
              min="1"
              required
              disabled={loading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="comments">Комментарии:</label>
            <textarea
              id="comments"
              rows="3"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>
          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Отправка...' : 'Подтвердить бронирование'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;