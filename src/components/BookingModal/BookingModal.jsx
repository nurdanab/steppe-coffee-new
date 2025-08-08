// src/components/BookingModal/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './BookingModal.module.scss';
import { supabase } from '../../supabaseClient';
import { IMaskInput } from 'react-imask';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const BookingModal = ({ isOpen, onClose, currentUserId, currentUserEmail }) => {
  const [step, setStep] = useState(1);
  
  const [bookingDate, setBookingDate] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [durationHours, setDurationHours] = useState(1);
 
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isAgreed, setIsAgreed] = useState(false);
  
  const [conflict, setConflict] = useState(null);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setUserName('');
      const today = new Date();
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
      setConflict(null);
      setSuggestedSlots([]);
      setConfirmedBookings([]);
      setFullyBookedDates([]);
      setDurationHours(1);
    }
  }, [isOpen, currentUserId, currentUserEmail]);
  
  useEffect(() => {
    const fetchBookingsOnRoomChange = async () => {
      if (step === 2 && selectedRoom && durationHours) {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_date, start_time, end_time')
          .eq('selected_room', selectedRoom)
          .eq('status', 'confirmed')
          .gte('booking_date', new Date().toISOString().split('T')[0]);
        
        if (error) {
          console.error('Ошибка при получении подтвержденных бронирований:', error.message);
          setLoading(false);
          return;
        }

        const bookedDates = data.map(b => b.booking_date);
        const uniqueDates = [...new Set(bookedDates)];
        
        const fullyBooked = [];
        for (const date of uniqueDates) {
          const tempDate = new Date(date);
          const slots = await getAvailableSlots(tempDate, selectedRoom, durationHours);
          if (slots.length === 0) {
            fullyBooked.push(date);
          }
        }
        setFullyBookedDates(fullyBooked);
        
        setLoading(false);
      }
    };
    fetchBookingsOnRoomChange();
  }, [step, selectedRoom, durationHours]);

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

  const getAvailableSlots = async (date, room, duration) => {
    if (!date || !room || !duration) return [];
    
    const dateString = date.toISOString().split('T')[0];
    const { data: existingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('booking_date', dateString)
      .eq('selected_room', room);
    
    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return [];
    }

    const availableSlots = [];
    const intervalMinutes = 30;
    const cafeOpenTimeMinutes = 8 * 60;
    const cafeCloseTimeMinutes = 22 * 60;
    const durationMinutes = duration * 60;
    const cleanupMinutes = cleanupTimeHours * 60;
    const today = new Date();
    const currentDayString = today.toISOString().split('T')[0];
    const currentTimeMinutes = today.getHours() * 60 + today.getMinutes();

    for (let currentStartMinutes = cafeOpenTimeMinutes; currentStartMinutes <= cafeCloseTimeMinutes - durationMinutes; currentStartMinutes += intervalMinutes) {
      if (dateString === currentDayString && currentStartMinutes < currentTimeMinutes) {
        continue;
      }

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
  
        // Убрана лишняя проверка на статус. Эта функция просто ищет свободные слоты,
        // учитывая все бронирования
        if ((currentStartMinutes < cleanupEndMinutes) && (currentEndMinutes > existingStartMinutes)) {
          isConflict = true;
          break;
        }
      }
      
      if (!isConflict) {
        availableSlots.push({ start: currentStart, end: currentEnd });
      }
    }
    
    return availableSlots;
  };
  
  const handleNextStep = async () => {
    setError(null);
    if (!selectedRoom || !numberOfPeople || !durationHours) {
        setError('Пожалуйста, заполните все обязательные поля.');
        return;
    }

    const minPeople = selectedRoom === 'second_hall' ? 1 : selectedRoom === 'summer_terrace' ? 1 : 1;
    const maxPeople = selectedRoom === 'second_hall' ? 20 : selectedRoom === 'summer_terrace' ? 10 : 50;

    if (numberOfPeople < minPeople || numberOfPeople > maxPeople) {
        setError(`Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.`);
        return;
    }
    
    if (durationHours <= 0) {
      setError('Продолжительность бронирования должна быть больше 0.');
      return;
    }
    if (durationHours > maxBookingDurationHours) {
      setError(`Максимальное время бронирования - ${maxBookingDurationHours} часа.`);
      return;
    }

    setStep(2);
    const today = new Date();
    setBookingDate(today);
    setLoading(true);
    const slots = await getAvailableSlots(today, selectedRoom, durationHours);
    setSuggestedSlots(slots);
    setLoading(false);
  };
  
  const handleDateChange = async (date) => {
    setBookingDate(date);
    setError(null);
    setStartTime('');
    setEndTime('');
    setLoading(true);
    const slots = await getAvailableSlots(date, selectedRoom, durationHours);
    setSuggestedSlots(slots);
    setLoading(false);
  };

  const handleTimeSelect = (slot) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
    setError(null);
  };

  const checkAvailability = async () => {
    setError(null);
    setConflict(null);
    
    const date = bookingDate;
    const start = startTime;
    const end = endTime;
    const room = selectedRoom;
    const numPpl = numberOfPeople;

    let minPeople = 0;
    let maxPeople = 0;
    switch (room) {
      case 'second_hall': minPeople = 1; maxPeople = 20; break;
      case 'summer_terrace': minPeople = 1; maxPeople = 10; break;
      default: minPeople = 1; maxPeople = 50; break;
    }

    if (numPpl < minPeople || numPpl > maxPeople) {
      return { available: false, message: `Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.` };
    }

    const startDateTime = new Date(`${date.toISOString().split('T')[0]}T${start}`);
    const endDateTime = new Date(`${date.toISOString().split('T')[0]}T${end}`);
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

    if (date.toISOString().split('T')[0] < currentDay) {
        return { available: false, message: 'Нельзя забронировать на прошедшую дату.' };
    }
    if (date.toISOString().split('T')[0] === currentDay && start < currentTime) {
        return { available: false, message: 'Нельзя забронировать на прошедшее время сегодня.' };
    }
    
    const { data: existingBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('booking_date', date.toISOString().split('T')[0])
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
      const cleanUpStartTime = new Date(`${date.toISOString().split('T')[0]}T${existingEnd}`);
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
    
    // Новая логика: если есть подтвержденная бронь, не даем бронировать
    if (hasConfirmedConflict) {
        return { available: false, message: 'Выбранное время уже занято подтвержденной бронью или недоступно. Выберите другое время.' };
    }

    // Если есть конфликт с ожидающей бронью, предлагаем лист ожидания
    if (isConflict) {
        return { 
          available: 'queued', 
          message: 'На выбранное время уже есть ожидающая бронь. Ваша бронь может быть добавлена в очередь.',
          conflictType: 'pending'
        };
    }

    return { available: true };
  };
  
  const handleQueueBooking = async () => {
    await sendBooking('queued');
  };

  const sendBooking = async (statusToSet = 'pending') => {
      setLoading(true);
      setMessage('');
      setError(null);
      setConflict(null);

      try {
        const { data: newBookingData, error: insertError } = await supabase
          .from('bookings')
          .insert([
            {
              booking_date: bookingDate.toISOString().split('T')[0],
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
  
        setBookingDate(new Date());
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
        setStep(1);
  
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
    setConflict(null);

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

    const availabilityCheckResult = await checkAvailability();

    if (!availabilityCheckResult.available) {
        setError(availabilityCheckResult.message);
        setConflict(availabilityCheckResult.conflictType);
        setSuggestedSlots([]); // Сбрасываем предложенные слоты, так как они не нужны в этом случае
        setLoading(false);
        return;
    } 

    if (availabilityCheckResult.available === 'queued') {
        setError(availabilityCheckResult.message);
        setConflict(availabilityCheckResult.conflictType);
        setSuggestedSlots([]); // Сбрасываем предложенные слоты
        setLoading(false);
        return;
    }
    
    await sendBooking('pending');
  };

  const handleBackStep = () => {
    setStep(1);
    setError(null);
    setSuggestedSlots([]);
  };

  const isDateDisabled = ({ date }) => {
    const dateString = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return true;
    }

    return fullyBookedDates.includes(dateString);
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

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
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
                <label htmlFor="durationHours">Продолжительность (часы):</label>
                <input
                    type="number"
                    id="durationHours"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    min="0.5"
                    max={maxBookingDurationHours}
                    step="0.5"
                    required
                    disabled={loading}
                />
            </div>

            <button type="submit" className={styles.submitButton} disabled={loading}>
              Далее
            </button>
          </form>
        )}

        {step === 2 && (
          <>
            <button onClick={handleBackStep} className={styles.backButton} disabled={loading}>
                ← Назад
            </button>

            <div className={styles.bookingStep2}>
                <div className={styles.calendarContainer}>
                    <Calendar
                        onChange={handleDateChange}
                        value={bookingDate}
                        minDate={new Date()}
                        tileDisabled={isDateDisabled}
                    />
                </div>
                
                {loading && <p>Загрузка свободных времен...</p>}
                
                {suggestedSlots.length > 0 && !loading ? (
                  <div className={styles.availableSlotsContainer}>
                    <p>Свободные слоты на {bookingDate?.toLocaleDateString()}:</p>
                    <div className={styles.suggestedSlotsScroll}>
                      <div className={styles.suggestedSlotsContainer}>
                        {suggestedSlots.map((slot, index) => (
                          <button 
                            key={index} 
                            className={`${styles.suggestedSlotButton} ${startTime === slot.start && styles.selectedSlot}`}
                            onClick={() => handleTimeSelect(slot)}
                          >
                            {slot.start} - {slot.end}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  !loading && <p className={styles.noSlotsMessage}>На выбранную дату нет свободных слотов.</p>
                )}
            </div>

            {conflict ? (
              <div className={styles.conflictMessage}>
                <p className={styles.conflictHeader}>{error}</p>
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
              startTime && (
                <form onSubmit={handleSubmit}>
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
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;