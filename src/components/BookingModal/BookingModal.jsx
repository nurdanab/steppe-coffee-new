import React, { useState, useEffect } from 'react';
import styles from './BookingModal.module.scss';
import { supabase } from '../../supabaseClient';

const BookingModal = ({ isOpen, onClose, currentUserId, currentUserEmail }) => {
  const [organizerName, setOrganizerName] = useState('');
  const [eventName, setEventName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen && currentUserId) {
      setOrganizerName(currentUserEmail || '');
    } else if (isOpen && !currentUserId) {
      setOrganizerName('');
    }
    setBookingDate('');
    setStartTime('');
    setEndTime('');
    setNumPeople(1);
    setComments('');
    setEventName('');
    setPhoneNumber('');
    setSelectedRoom('');
    setError(null);
    setMessage(null);
  }, [isOpen, currentUserId, currentUserEmail]);

  if (!isOpen) {
    return null;
  }

  // Новая функция для проверки доступности бронирования
  const checkAvailability = async (date, start, end, room, numPpl) => {
    setError(null);

    // 1. Валидация на количество людей в зависимости от зала
    if (room === 'second_hall' && numPpl > 20) {
      return { available: false, message: 'Для "Второго зала внутри" максимальное количество человек - 20.' };
    }
    if (room === 'summer_terrace' && numPpl > 10) {
      return { available: false, message: 'Для "Летника" максимальное количество человек - 10.' };
    }

    // 2. Проверка, что время начала раньше времени окончания
    if (start >= end) {
      return { available: false, message: 'Время начала должно быть раньше времени окончания.' };
    }

    // 3. Проверка рабочего времени кофейни (08:00 - 22:00)
    const cafeOpenTime = '08:00';
    const cafeCloseTime = '22:00';
    if (start < cafeOpenTime || end > cafeCloseTime) {
      return { available: false, message: `Кофейня работает с ${cafeOpenTime} до ${cafeCloseTime}. Пожалуйста, выберите другое время.` };
    }

    try {
      // 4. Проверка на пересечение с существующими бронированиями
      const { data: existingBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, status')
        .eq('booking_date', date)
        .eq('selected_room', room)
        .in('status', ['confirmed', 'pending']); // Проверяем и подтвержденные, и ожидающие

      if (fetchError) {
        throw fetchError;
      }

      for (const existingBooking of existingBookings) {
        const existingStart = existingBooking.start_time;
        const existingEnd = existingBooking.end_time;

        // Проверяем прямое пересечение интервалов
        // (start < existingEnd) && (end > existingStart) означает, что интервалы пересекаются
        if ((start < existingEnd) && (end > existingStart)) {
          // Если есть пересечение, применяем правило 1 часа для "Второго зала внутри"
          if (room === 'second_hall') {
            const existingEndTimeDate = new Date(`${date}T${existingEnd}`);
            const newStartTimeDate = new Date(`${date}T${start}`);
            const diffMs = newStartTimeDate.getTime() - existingEndTimeDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            // Если новое бронирование начинается раньше, чем через 1 час после окончания существующего
            if (diffHours < 1) {
              return { available: false, message: 'Для "Второго зала внутри" следующее бронирование должно начинаться минимум через 1 час после окончания предыдущего.' };
            }
          } else {
            // Для "Летника" просто сообщаем о занятости
            return { available: false, message: 'Выбранное время уже занято для данного зала.' };
          }
        }
      }

      return { available: true, message: 'Время доступно!' };
    } catch (err) {
      console.error('Ошибка при проверке доступности:', err.message);
      return { available: false, message: `Ошибка при проверке доступности: ${err.message}. Попробуйте еще раз.` };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Получаем ID текущего пользователя
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user ? user.id : null;

    if (!currentUserId) {
      setError('Вы должны быть авторизованы для бронирования.');
      setLoading(false);
      return;
    }

    // Вызываем функцию проверки доступности перед отправкой
    const availabilityCheckResult = await checkAvailability(bookingDate, startTime, endTime, selectedRoom, numPeople);

    if (!availabilityCheckResult.available) {
      setError(availabilityCheckResult.message);
      setLoading(false);
      return;
    }

    try {
      const newBooking = {
        organizer_name: organizerName,
        event_name: eventName,
        phone_number: phoneNumber,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        num_people: numPeople,
        comments: comments,
        selected_room: selectedRoom,
        user_id: currentUserId,
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
        setMessage('Бронирование успешно отправлено! Ожидайте подтверждения.');
        // Очистка полей формы после успешной отправки
        setOrganizerName('');
        setEventName('');
        setPhoneNumber('');
        setBookingDate('');
        setStartTime('');
        setEndTime('');
        setNumPeople(1);
        setSelectedRoom('');
        setComments('');
        // onClose(); // Можно закрыть модальное окно после успешной отправки, если это желаемое поведение
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
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="organizerName">Название организации (или Ваше имя):</label>
            <input
              type="text"
              id="organizerName"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="eventName">Название события:</label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Контактный номер телефона:</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bookingDate">Дата бронирования:</label>
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
            <label htmlFor="selectedRoom">Выберите зал:</label>
            <select
              id="selectedRoom"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Выберите зал --</option>
              <option value="second_hall">Второй зал внутри (до 20 человек)</option>
              <option value="summer_terrace">Летник (до 10 человек)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comments">Комментарии (необязательно):</label>
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