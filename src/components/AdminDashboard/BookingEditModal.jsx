// src/components/AdminDashboard/BookingEditModal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { IMaskInput } from 'react-imask';
import styles from './BookingEditModal.module.scss'; // Создадим этот файл стилей

const BookingEditModal = ({ isOpen, onClose, bookingToEdit, onBookingUpdated }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && bookingToEdit) {
      setBookingDate(bookingToEdit.booking_date);
      setStartTime(bookingToEdit.start_time.substring(0, 5)); // Обрезаем секунды
      setEndTime(bookingToEdit.end_time.substring(0, 5));     // Обрезаем секунды
      setSelectedRoom(bookingToEdit.selected_room);
      setNumberOfPeople(bookingToEdit.num_people);
      setPhoneNumber(bookingToEdit.phone_number || '');
      setOrganizerName(bookingToEdit.organizer_name || '');
      setComment(bookingToEdit.comments || '');
      setMessage('');
      setError(null);
    }
  }, [isOpen, bookingToEdit]);

  if (!isOpen || !bookingToEdit) return null;

  const cafeOpenTime = '08:00';
  const cafeCloseTime = '22:00';

  const checkAvailability = async (date, start, end, room, numPpl) => {
    setError(null);

    let minPeople = 0;
    let maxPeople = 0;

    switch (room) {
      case 'second_hall':
        minPeople = 1;
        maxPeople = 20;
        break;
      case 'summer_terrace':
        minPeople = 1;
        maxPeople = 10;
        break;
      default: // Если выбран "весь кафе" или другой вариант
        minPeople = 1;
        maxPeople = 50; // Примерное максимальное количество
        break;
    }

    if (numPpl < minPeople || numPpl > maxPeople) {
      return { available: false, message: `Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.` };
    }

    if (start >= end) {
      return { available: false, message: 'Время начала не может быть позже или равно времени окончания.' };
    }

    if (start < cafeOpenTime || end > cafeCloseTime) {
      return { available: false, message: `Кофейня работает с ${cafeOpenTime} до ${cafeCloseTime}.` };
    }

    const currentDateTime = new Date();
    const currentDay = currentDateTime.toISOString().split('T')[0];
    const currentTime = currentDateTime.toTimeString().substring(0, 5);

    // Только для прошедших дат/времени, если бронирование не подтверждено/ожидает
    // Для админа можно ослабить, но для клиента это важно
    if (bookingDate < currentDay) {
        // Если дата в прошлом, разрешить редактирование только для подтвержденных/отмененных статусов
        // if (bookingToEdit.status !== 'confirmed' && bookingToEdit.status !== 'cancelled') {
        //     return { available: false, message: 'Нельзя забронировать на прошедшую дату.' };
        // }
    } else if (bookingDate === currentDay && start < currentTime) {
        // if (bookingToEdit.status !== 'confirmed' && bookingToEdit.status !== 'cancelled') {
        //     return { available: false, message: 'Нельзя забронировать на прошедшее время сегодня.' };
        // }
    }

    // Проверяем пересечения с другими бронированиями (исключая текущее редактируемое)
    const { data: existingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, status')
      .eq('booking_date', date)
      .eq('selected_room', room)
      .in('status', ['confirmed', 'pending'])
      .neq('id', bookingToEdit.id); // Исключаем текущее бронирование из проверки

    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return { available: false, message: 'Произошла ошибка при проверке доступности. Пожалуйста, попробуйте снова.' };
    }

    for (const booking of existingBookings) {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;

      if ((start < existingEnd) && (end > existingStart)) {
        if (room === 'second_hall') {
          const existingEndTimeDate = new Date(`${date}T${existingEnd}`);
          existingEndTimeDate.setHours(existingEndTimeDate.getHours() + 1);
          const requiredStartTime = existingEndTimeDate.toTimeString().substring(0, 5);

          if (start < requiredStartTime) {
            return { available: false, message: 'Выбранное время для "Второго зала внутри" занято или недоступно с учетом правил интервала. Пожалуйста, выберите другое время.' };
          }
        } else {
          return { available: false, message: 'Выбранное время уже занято для данного зала.' };
        }
      }
    }

    return { available: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);

    const availabilityCheckResult = await checkAvailability(bookingDate, startTime, endTime, selectedRoom, numberOfPeople);

    if (!availabilityCheckResult.available) {
      setError(availabilityCheckResult.message);
      setLoading(false);
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          selected_room: selectedRoom,
          num_people: numberOfPeople,
          phone_number: phoneNumber,
          organizer_name: organizerName,
          comments: comment,
          // user_id и status не меняем через эту форму, т.к. статус меняется отдельно, а user_id фиксирован
        })
        .eq('id', bookingToEdit.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      setMessage('Бронирование успешно обновлено!');
      onBookingUpdated(); // Сообщаем родительскому компоненту об обновлении
      setTimeout(() => {
        onClose();
      }, 1500); // Закрываем модалку через 1.5 секунды
    } catch (err) {
      console.error('Ошибка при обновлении брони:', err.message);
      setError(`Ошибка при обновлении брони: ${err.message}. Пожалуйста, попробуйте снова.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>
          &times;
        </button>
        <h2>Редактировать бронирование #{bookingToEdit.id.substring(0, 8)}</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="editBookingDate">Дата бронирования:</label>
            <input
              type="date"
              id="editBookingDate"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editStartTime">Время начала:</label>
            <input
              type="time"
              id="editStartTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={loading}
              min="08:00"
              max="22:00"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editEndTime">Время окончания:</label>
            <input
              type="time"
              id="editEndTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              disabled={loading}
              min="08:00"
              max="22:00"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editSelectedRoom">Выберите зал:</label>
            <select
              id="editSelectedRoom"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Выберите зал --</option>
              <option value="second_hall">Второй зал внутри (до 20 человек)</option>
              <option value="summer_terrace">Летняя терраса (до 10 человек)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editNumberOfPeople">Количество человек:</label>
            <input
              type="number"
              id="editNumberOfPeople"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(Number(e.target.value))}
              min="1"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editPhoneNumber">Контактный номер телефона:</label>
            <IMaskInput
              mask="+{7}(000)000-00-00"
              definitions={{ '#': /[0-9]/ }}
              value={phoneNumber}
              onAccept={(value) => setPhoneNumber(value)}
              placeholder="+7(___)___-__-__"
              required
              disabled={loading}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editOrganizerName">Ваше имя (или название организации):</label>
            <input
              type="text"
              id="editOrganizerName"
              value={organizerName}
              onChange={(e) => setOrganizerName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="editComment">Комментарий (необязательно):</label>
            <textarea
              id="editComment"
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Обновление...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingEditModal;