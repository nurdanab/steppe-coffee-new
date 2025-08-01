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
  // Новые состояния для публичных полей события
  const [eventName, setEventName] = useState(''); //
  const [eventDescription, setEventDescription] = useState(''); //
  const [organizerContact, setOrganizerContact] = useState(''); //

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
      // Сброс новых полей
      setEventName(''); //
      setEventDescription(''); //
      setOrganizerContact(''); //
      setMessage('');  
      setError(null); 
    }
  }, [isOpen, currentUserId, currentUserEmail]); 

  if (!isOpen) return null;

  const cafeOpenTime = '08:00';
  const cafeCloseTime = '22:00';
  const maxBookingDurationHours = 3; // Максимальная продолжительность бронирования
  const cleanupTimeHours = 1; // Время на уборку между бронями

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
      default: // Если не выбран конкретный зал или общий зал (весь кафе)
        minPeople = 1; 
        maxPeople = 50;  
        break;
    }

    if (numPpl < minPeople || numPpl > maxPeople) {
      return { available: false, message: `Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.` };
    }

    // Проверка максимальной продолжительности брони
    const startDateTime = new Date(`${date}T${start}`);
    const endDateTime = new Date(`${date}T${end}`);
    const durationMs = endDateTime - startDateTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours <= 0) {
      return { available: false, message: 'Время начала не может быть позже или равно времени окончания.' };
    }
    if (durationHours > maxBookingDurationHours) { //
      return { available: false, message: `Максимальное время бронирования - ${maxBookingDurationHours} часа.` }; //
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
      .eq('selected_room', room); // Теперь учитываем все статусы для проверки занятости и постановки в очередь

    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return { available: false, message: 'Произошла ошибка при проверке доступности. Пожалуйста, попробуйте снова.' };
    }

    let isConflict = false; // Флаг для определения конфликта
    let hasConfirmedConflict = false; // Флаг для определения конфликта с подтвержденной бронью

    for (const booking of existingBookings) {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;
      const bookingStatus = booking.status;

      // Учитываем время на уборку
      const cleanUpStartTime = new Date(`${date}T${existingEnd}`);
      cleanUpStartTime.setHours(cleanUpStartTime.getHours() + cleanupTimeHours); //
      const requiredNextAvailableTime = cleanUpStartTime.toTimeString().substring(0, 5); //

      // Проверка на пересечение с учетом времени на уборку
      if ((start < requiredNextAvailableTime) && (end > existingStart)) {
          isConflict = true;
          if (bookingStatus === 'confirmed') { //
              hasConfirmedConflict = true; //
              break; // Если есть подтвержденная бронь, дальнейшие проверки не нужны
          }
      }
    }

    if (hasConfirmedConflict) { //
        return { available: false, message: 'Выбранное время уже занято для данного зала подтвержденной бронью или недоступно с учетом правил интервала.' }; //
    } else if (isConflict) { //
        return { available: 'queued', message: 'На выбранное время уже есть ожидающая бронь. Ваша бронь будет добавлена в очередь.' }; //
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

    // Проверка заполнения обязательных полей
    if (!bookingDate || !startTime || !endTime || !selectedRoom || !phoneNumber || !userName) {
      setError('Пожалуйста, заполните все обязательные поля (Дата, Время начала, Время окончания, Зал, Количество человек, Телефон, Имя).');
      setLoading(false);
      return;
    }

    const availabilityCheckResult = await checkAvailability(bookingDate, startTime, endTime, selectedRoom, numberOfPeople);

    let bookingStatusToSet = 'pending'; //
    if (!availabilityCheckResult.available) {
      setError(availabilityCheckResult.message); 
      setLoading(false);
      return;
    } else if (availabilityCheckResult.available === 'queued') { //
      bookingStatusToSet = 'queued'; //
      setMessage(availabilityCheckResult.message); // Показываем сообщение о постановке в очередь
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
            status: bookingStatusToSet, // Устанавливаем статус 'pending' или 'queued'
            event_name: eventName || null, //
            event_description: eventDescription || null, //
            organizer_contact: organizerContact || null, //
          },
        ])
        .select(); 

      if (insertError) {
        throw insertError;
      }

      if (bookingStatusToSet === 'pending') {
        setMessage('Ваша бронь успешно отправлена и ожидает подтверждения!');
      } else {
        setMessage('Ваша бронь успешно отправлена и добавлена в очередь. Ожидайте подтверждения!');
      }
      
      // Сброс формы
      setBookingDate(new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setSelectedRoom('');
      setNumberOfPeople(1);
      setPhoneNumber('');
      setUserName(currentUserEmail || '');
      setComment('');
      setEventName('');
      setEventDescription('');
      setOrganizerContact('');


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
          {/* Существующие поля */}
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
          
          {/* Новые поля для публичного события */}
          <div className={styles.formGroup}>
            <label htmlFor="eventName">Название события (для анонса, необязательно):</label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              disabled={loading}
              placeholder="Например: Мастер-класс по рисованию"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="eventDescription">Описание события (для анонса, необязательно):</label>
            <textarea
              id="eventDescription"
              rows="3"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              disabled={loading}
              placeholder="Расскажите о вашем мероприятии, что будет происходить."
            ></textarea>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="organizerContact">Контакт для связи с организацией (телефон/Instagram, необязательно):</label>
            <input
              type="text"
              id="organizerContact"
              value={organizerContact}
              onChange={(e) => setOrganizerContact(e.target.value)}
              disabled={loading}
              placeholder="Например: @наш_инстаграм или +77001234567"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="comment">Комментарий (для администрации, необязательно):</label>
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