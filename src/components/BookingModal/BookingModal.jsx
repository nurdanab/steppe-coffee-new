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
  const [isAgreed, setIsAgreed] = useState(false);
  
  const [conflict, setConflict] = useState(null); // Новое состояние для хранения информации о конфликте
  const [suggestedSlots, setSuggestedSlots] = useState([]); // Новое состояние для хранения свободных слотов

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
      setIsAgreed(false);
      setConflict(null); // Сбрасываем конфликт при открытии
      setSuggestedSlots([]); // Сбрасываем предложенные слоты
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

  const getSuggestedSlots = (date, durationHours, existingBookings, room) => {
    const suggested = [];
    const intervalMinutes = 30;
    const cafeOpenTimeMinutes = 8 * 60;
    const cafeCloseTimeMinutes = 22 * 60;
    const durationMinutes = durationHours * 60;
    const cleanupMinutes = cleanupTimeHours * 60;
  
    for (let currentStartMinutes = cafeOpenTimeMinutes; currentStartMinutes <= cafeCloseTimeMinutes - durationMinutes; currentStartMinutes += intervalMinutes) {
      const currentEndMinutes = currentStartMinutes + durationMinutes;
      
      const currentStart = `${String(Math.floor(currentStartMinutes / 60)).padStart(2, '0')}:${String(currentStartMinutes % 60).padStart(2, '0')}`;
      const currentEnd = `${String(Math.floor(currentEndMinutes / 60)).padStart(2, '0')}:${String(currentEndMinutes % 60).padStart(2, '0')}`;
  
      let isConflict = false;
      for (const booking of existingBookings) {
        const existingStartParts = booking.start_time.split(':').map(Number);
        const existingEndParts = booking.end_time.split(':').map(Number);
  
        const existingStartMinutes = existingStartParts[0] * 60 + existingStartParts[1];
        const existingEndMinutes = existingEndParts[0] * 60 + existingEndParts[1];
  
        const cleanupEndMinutes = existingEndMinutes + cleanupMinutes;

        // Проверка на пересечение с учетом времени на уборку
        if ((currentStartMinutes < cleanupEndMinutes) && (currentEndMinutes > existingStartMinutes)) {
          isConflict = true;
          break;
        }
      }
      
      if (!isConflict) {
        suggested.push({ start: currentStart, end: currentEnd });
      }
    }
  
    return suggested;
  };
  

  const checkAvailability = async (date, start, end, room, numPpl) => {
    setError(null);
    setConflict(null);
    setSuggestedSlots([]);

    // ... (логика проверки min/max people, duration, cafeOpen/CloseTime, past dates/times - остается без изменений)
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
    // ...

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
      // ✅ Теперь возвращаем подробную информацию о конфликте
      const duration = (endDateTime - startDateTime) / (1000 * 60 * 60);
      const suggestedSlots = getSuggestedSlots(date, duration, existingBookings, room);
      return { 
        available: false, 
        message: 'Выбранное время уже занято подтвержденной бронью или недоступно. Выберите другое время или встаньте в лист ожидания.',
        conflictType: 'confirmed',
        suggestedSlots: suggestedSlots
      };
    } else if (isConflict) {
      // ✅ Теперь возвращаем подробную информацию о конфликте
      return { 
        available: 'queued', 
        message: 'На выбранное время уже есть ожидающая бронь. Ваша бронь может быть добавлена в очередь.',
        conflictType: 'pending',
        suggestedSlots: [] // В этом случае не предлагаем слоты
      };
    }

    return { available: true };
  };

  const handleQueueBooking = async () => {
    // Эта функция будет вызываться, если пользователь решит встать в лист ожидания
    await sendBooking('queued');
  };

  const sendBooking = async (statusToSet = 'pending') => {
      setLoading(true);
      setMessage('');
      setError(null);
      setConflict(null);
      setSuggestedSlots([]);

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
              status: statusToSet,
              event_name: eventName || null,
              event_description: eventDescription || null,
              organizer_contact: organizerContact || null,
            },
          ])
          .select();
  
        if (insertError) {
          throw insertError;
        }

        // ... (логика отправки в Telegram - остается без изменений)
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
        
        if (statusToSet === 'pending') {
          setMessage('Ваша бронь успешно отправлена и ожидает подтверждения!');
        } else if (statusToSet === 'queued') {
          setMessage('Ваша бронь успешно добавлена в лист ожидания!');
        }
  
        // Сброс формы
        setBookingDate(new Date().toISOString().split('T')[0]);
        setStartTime('');
        setEndTime('');
        setSelectedRoom('');
        setNumberOfPeople(1);
        setPhoneNumber('');
        setUserName('');
        setComment('');
        setEventName('');
        setEventDescription('');
        setOrganizerContact('');
        setIsAgreed(false);
  
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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(null);
    setConflict(null); // Сброс конфликта перед новой проверкой
    setSuggestedSlots([]);

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

    if (!availabilityCheckResult.available) {
        // Если есть конфликт, мы не отправляем бронь, а показываем предупреждение
        setError(availabilityCheckResult.message);
        setConflict(availabilityCheckResult.conflictType);
        setSuggestedSlots(availabilityCheckResult.suggestedSlots);
        setLoading(false);
        return;
    } 

    if (availabilityCheckResult.available === 'queued') {
        // Если конфликт "в ожидании", показываем предупреждение
        setError(availabilityCheckResult.message);
        setConflict(availabilityCheckResult.conflictType);
        setLoading(false);
        return;
    }

    // Если всё хорошо, отправляем бронь со статусом 'pending'
    await sendBooking('pending');
  };

  const handleApplySuggestion = (slot) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
    setError(null);
    setConflict(null);
    setSuggestedSlots([]);
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

        {/* Условный рендеринг: показываем форму или блок с конфликтом */}
        {conflict ? (
          <div className={styles.conflictMessage}>
            <p className={styles.conflictHeader}>К сожалению, выбранное время занято.</p>
            {suggestedSlots.length > 0 && (
              <>
                <p>Возможно, вы захотите забронировать на одно из этих свободных времен:</p>
                <div className={styles.suggestedSlotsContainer}>
                  {suggestedSlots.slice(0, 3).map((slot, index) => (
                    <button 
                      key={index} 
                      className={styles.suggestedSlotButton}
                      onClick={() => handleApplySuggestion(slot)}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  ))}
                  {suggestedSlots.length > 3 && <p className={styles.moreSuggestions}>и еще {suggestedSlots.length - 3} варианта</p>}
                </div>
              </>
            )}
            <p>Вы можете либо изменить детали бронирования, либо встать в лист ожидания.</p>
            <div className={styles.conflictActions}>
              <button onClick={handleQueueBooking} className={styles.submitButton} disabled={loading}>
                Встать в лист ожидания
              </button>
              <button onClick={() => setConflict(null)} className={styles.secondaryButton} disabled={loading}>
                Изменить детали
              </button>
            </div>
          </div>
        ) : (
          // Форма бронирования
          <form onSubmit={handleSubmit}>
            {/* ... (остальная часть формы - остается без изменений) */}
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

            <div className={`${styles.formGroup} ${styles.agreementCheckbox}`}>
              <input
                type="checkbox"
                id="agreement"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="agreement" className={styles.agreementLabel}>
                  Я ознакомился с <a href="/documentsPdf/information-about-payment security.pdf" target="_blank" rel="noopener noreferrer">правилами</a>
              </label>
            </div>

            <button type="submit" className={styles.submitButton} disabled={!isAgreed || loading}>
              {loading ? 'Отправка...' : 'Подтвердить бронирование'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;