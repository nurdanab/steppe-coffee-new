// src/components/BookingModal/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './BookingModal.module.scss';  
import { supabase } from '../../supabaseClient';
import { IMaskInput } from 'react-imask';

const BookingModal = ({ isOpen, onClose, currentUserId, currentUserEmail }) => { 
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(''); 
  const [numberOfPeople, setNumberOfPeople] = useState(1); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState(''); 
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null); 


   useEffect(() => {
    if (isOpen) {
      if (currentUserId) {
        setUserName(currentUserEmail || '');
      } else {
        setUserName('');
      }

      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      setStartTime('');
      setEndTime('');
      setSelectedRoom(''); 
      setNumberOfPeople(1); 
      setPhoneNumber('');
      setComment('');
      setMessage('');  
      setError(null); 
    }
  }, [isOpen, currentUserId, currentUserEmail]); 
  if (!isOpen) return null;

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
      default:
        minPeople = 1; 
        maxPeople = 50;  
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

    if (date < currentDay) {
        return { available: false, message: 'Нельзя забронировать на прошедшую дату.' };
    }
    if (date === currentDay && start < currentTime) {
        return { available: false, message: 'Нельзя забронировать на прошедшее время сегодня.' };
    }

    const { data: existingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, status')
      .eq('booking_date', date)
      .eq('selected_room', room)
      .in('status', ['confirmed', 'pending']);

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

    if (!currentUserId) {
        setMessage('Пожалуйста, войдите или зарегистрируйтесь, чтобы забронировать столик.');
        setLoading(false);
        return;
    }

    const availabilityCheckResult = await checkAvailability(bookingDate, startTime, endTime, selectedRoom, numberOfPeople);

    if (!availabilityCheckResult.available) {
      setError(availabilityCheckResult.message); 
      setLoading(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([
          {
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            selected_room: selectedRoom,
            num_people: numberOfPeople,
            phone_number: phoneNumber,
            organizer_name: userName,
            comments: comment,
            user_id: currentUserId,
            status: 'pending', 
          },
        ])
        .select(); 

      if (insertError) {
        throw insertError;
      }

      setMessage('Ваша бронь успешно отправлена! Ожидайте подтверждения.');
      setBookingDate(new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setSelectedRoom('');
      setNumberOfPeople(1);
      setPhoneNumber('');
      setUserName(currentUserEmail || '');
      setComment('');

      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) { 
      console.error('Ошибка при отправке брони:', err.message);
      setError(`Ошибка при отправке брони: ${err.message}. Пожалуйста, попробуйте снова.`);
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
        <h2>Забронировать столик</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="bookingDate">Дата бронирования:</label>
            <input
              type="date"
              id="bookingDate"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              disabled={loading}
              min={new Date().toISOString().split('T')[0]} 
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
              min="08:00" 
              max="22:00"
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
              min="08:00"
              max="22:00" 
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
            <label htmlFor="numberOfPeople">Количество человек:</label>
            <input
              type="number"
              id="numberOfPeople"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(Number(e.target.value))}
              min="1"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Контактный номер телефона:</label>
            <IMaskInput
              mask="+{7}(000)000-00-00" 
              definitions={{
                '#': /[0-9]/,
              }}
              value={phoneNumber}
              onAccept={(value) => setPhoneNumber(value)} 
              placeholder="+7(___)___-__-__"
              required
              disabled={loading}
              className={styles.input} 
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="userName">Ваше имя (или название организации):</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comment">Комментарий (необязательно):</label>
            <textarea
              id="comment"
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
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