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
 
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isAgreed, setIsAgreed] = useState(false); // Новое состояние для отслеживания флажка

  useEffect(() => {
    if (isOpen) {
      setUserName('');
      
      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      setStartTime('');
      setEndTime('');
      setSelectedRoom('');
      setNumberOfPeople(1);
      setPhoneNumber('');
      setComment('');
      setEventName('');
      setEventDescription('');
      setOrganizerContact('');
      setMessage('');
      setError(null);
      setIsAgreed(false); и
    }
  }, [isOpen, currentUserId, currentUserEmail]);

  if (!isOpen) return null;

  const cafeOpenTime = '08:00';
  const cafeCloseTime = '22:00';
  const maxBookingDurationHours = 3;
  const cleanupTimeHours = 1;

  const getRoomName = (roomKey) => {  
    switch (roomKey) {
      case 'second_hall':
        return 'Второй зал внутри';
      case 'summer_terrace':
        return 'Летняя терраса';
      default:
        return 'Неизвестный зал';
    }
  };

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

    const startDateTime = new Date(`${date}T${start}`);
    const endDateTime = new Date(`${date}T${end}`);
    const durationMs = endDateTime - startDateTime;
    const durationHours = durationMs / (1000 * 60 * 60);

    if (durationHours <= 0) {
      return { available: false, message: 'Время начала не может быть позже или равно времени окончания.' };
    }
    if (durationHours > maxBookingDurationHours) {
      return { available: false, message: `Максимальное время бронирования - ${maxBookingDurationHours} часа.` };
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
      .eq('selected_room', room);

    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return { available: false, message: 'Произошла ошибка при проверке доступности. Пожалуйста, попробуйте снова.' };
    }

    let isConflict = false;
    let hasConfirmedConflict = false;

    for (const booking of existingBookings) {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;
      const bookingStatus = booking.status;

      const cleanUpStartTime = new Date(`${date}T${existingEnd}`);
      cleanUpStartTime.setHours(cleanUpStartTime.getHours() + cleanupTimeHours);
      const requiredNextAvailableTime = cleanUpStartTime.toTimeString().substring(0, 5);

      if ((start < requiredNextAvailableTime) && (end > existingStart)) {
          isConflict = true;
          if (bookingStatus === 'confirmed') {
              hasConfirmedConflict = true;
              break;
          }
      }
    }

    if (hasConfirmedConflict) {
        return { available: false, message: 'Выбранное время уже занято для данного зала подтвержденной бронью или недоступно с учетом правил интервала.' };
    } else if (isConflict) {
        return { available: 'queued', message: 'На выбранное время уже есть ожидающая бронь. Ваша бронь будет добавлена в очередь.' };
    }

    return { available: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);

    // Добавляем проверку согласия перед отправкой
    if (!isAgreed) {
        setError('Пожалуйста, примите правила бронирования.');
        setLoading(false);
        return;
    }

    if (!currentUserId) {
        setError('Пожалуйста, войдите или зарегистрируйтесь, чтобы забронировать столик.');
        setLoading(false);
        return;
    }

    if (!bookingDate || !startTime || !endTime || !selectedRoom || !phoneNumber || !userName) {
      setError('Пожалуйста, заполните все обязательные поля (Дата, Время начала, Время окончания, Зал, Количество человек, Телефон, Имя).');
      setLoading(false);
      return;
    }

    const availabilityCheckResult = await checkAvailability(bookingDate, startTime, endTime, selectedRoom, numberOfPeople);

    let bookingStatusToSet = 'pending';
    if (!availabilityCheckResult.available) {
      setError(availabilityCheckResult.message);
      setLoading(false);
      return;
    } else if (availabilityCheckResult.available === 'queued') {
      bookingStatusToSet = 'queued';
      setMessage(availabilityCheckResult.message);
    }

    try {
      const { data: newBookingData, error: insertError } = await supabase
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
            status: bookingStatusToSet,
            event_name: eventName || null,
            event_description: eventDescription || null,
            organizer_contact: organizerContact || null,
          },
        ])
        .select();

      if (insertError) {
        throw insertError;
      }

      if (newBookingData && newBookingData.length > 0) {
        const newBooking = newBookingData[0];
        const telegramMessage = `
          <b>🥳 НОВОЕ БРОНИРОВАНИЕ!</b>
          #ID: <code>${newBooking.id.substring(0, 8)}</code>
          <b>Статус:</b> ${newBooking.status === 'confirmed' ? '✅ Подтверждено' : newBooking.status === 'pending' ? '⏳ В ожидании' : '❌ Отменено'}
          <b>Дата:</b> ${new Date(newBooking.booking_date).toLocaleDateString('ru-RU')}
          <b>Время:</b> ${newBooking.start_time.substring(0, 5)} - ${newBooking.end_time.substring(0, 5)}
          <b>Зал:</b> ${getRoomName(newBooking.selected_room)}
          <b>Кол-во чел.:</b> ${newBooking.num_people}
          <b>Организатор:</b> ${newBooking.organizer_name}
          <b>Телефон:</b> ${newBooking.phone_number}
          ${newBooking.event_name ? `<b>Название события:</b> ${newBooking.event_name}\n` : ''}
          ${newBooking.event_description ? `<b>Описание события:</b> ${newBooking.event_description}\n` : ''}
          ${newBooking.organizer_contact ? `<b>Контакт для связи:</b> ${newBooking.organizer_contact}\n` : ''}
          ${newBooking.comments ? `<b>Комментарий:</b> ${newBooking.comments}` : ''}
        `;

        try {
          const { data, error: telegramError } = await supabase.functions.invoke('telegram-notification', {
            body: { message: telegramMessage },
          });

          if (telegramError) {
            console.error('Ошибка отправки уведомления в Telegram:', telegramError);
          } else {
            console.log('Уведомление в Telegram о новом бронировании успешно отправлено:', data);
          }
        } catch (err) {
          console.error('Ошибка вызова Telegram Edge Function для нового бронирования:', err);
        }
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
      setIsAgreed(false); // Сбрасываем флажок после успешной отправки

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
              placeholder="Введите ваше имя или название организации"
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

          {/* Добавляем флажок согласия */}
          <div className={`${styles.formGroup} ${styles.agreementCheckbox}`}>
            <input
              type="checkbox"
              id="agreement"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="agreement" className={styles.agreementLabel}>
                <a href="/documentsPdf/rules_compressed.pdf" target="_blank" rel="noopener noreferrer">Я ознакомился и принимаю правила кофейни.</a>
            </label>
          </div>

          <button type="submit" className={styles.submitButton} disabled={!isAgreed || loading}>
            {loading ? 'Отправка...' : 'Подтвердить бронирование'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;