// src/components/BookingModal/BookingModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './BookingModal.module.scss';
import { supabase } from '../../supabaseClient';
import { IMaskInput } from 'react-imask';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import { DateTime, Interval } from 'luxon';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

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
  const [isBookingSuccessful, setIsBookingSuccessful] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [pendingDates, setPendingDates] = useState([]);
  const [isSlotPending, setIsSlotPending] = useState(false);

  const maxBookingDurationHours = 3;
  // 💡 Теперь буферное время - 1 час
  const bufferTimeHours = 1; 
  
  const maxPeople = selectedRoom === 'second_hall' ? 20 : selectedRoom === 'summer_terrace' ? 10 : 1;

  const getRoomName = useCallback((roomKey) => {  
    switch (roomKey) {
      case 'second_hall':
        return 'Второй зал внутри';
      case 'summer_terrace':
        return 'Летняя терраса';
      default:
        return 'Неизвестный зал';
    }
  }, []);
  
  const getAvailableSlots = useCallback(async (date, room, duration) => {
    if (!date || !room || !duration) return [];

    const dateString = date.toISOString().split('T')[0];

    setLoading(true);
    try {
      const { data: bookings, error: fetchError } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('booking_date', dateString)
        .eq('selected_room', room)
        // 💡 Не учитываем бронирования со статусом 'canceled'
        .neq('status', 'canceled');
      
      if (fetchError) {
        console.error('Ошибка при получении существующих бронирований:', fetchError.message);
        return [];
      }
      
      const allSlots = [];
      // 💡 Изменено время открытия с 9:00 на 8:00
      const cafeOpenHour = 8;
      const cafeCloseHour = 22;
      const intervalMinutes = 30;
      const durationMinutes = duration * 60;
      const bufferMinutes = bufferTimeHours * 60;
      
      const dateObj = DateTime.fromJSDate(date).setZone('Asia/Almaty');
    const now = DateTime.local().setZone('Asia/Almaty');

      // Объединяем все интервалы (подтвержденные и ожидающие) в один массив
      const occupiedIntervals = [];
      for (const booking of bookings) {
        const bookingStartTime = DateTime.fromISO(`${dateString}T${booking.start_time}`);
        const bookingEndTime = DateTime.fromISO(`${dateString}T${booking.end_time}`);
        
        // 💡 Расширяем интервал на буферное время до и после
        const occupiedStart = bookingStartTime.minus({ minutes: bufferMinutes });
        const occupiedEnd = bookingEndTime.plus({ minutes: bufferMinutes });
        occupiedIntervals.push(Interval.fromDateTimes(occupiedStart, occupiedEnd));
      }

      let currentStart = dateObj.set({ hour: cafeOpenHour, minute: 0, second: 0, millisecond: 0 });
      // 💡 Учитываем длительность брони и буферное время для последнего возможного слота
      const lastPossibleSlotStart = dateObj.set({ hour: cafeCloseHour, minute: 0, second: 0, millisecond: 0 }).minus({ minutes: durationMinutes });

      while (currentStart <= lastPossibleSlotStart) {
        const currentEnd = currentStart.plus({ minutes: durationMinutes });
        const slotInterval = Interval.fromDateTimes(currentStart, currentEnd);

        if (currentEnd < now) {
            currentStart = currentStart.plus({ minutes: intervalMinutes });
            continue;
        }
        
        // 💡 Проверяем, пересекается ли предлагаемый слот с каким-либо занятым интервалом
        const isAvailable = !occupiedIntervals.some(occupiedInterval => slotInterval.overlaps(occupiedInterval));
        
        allSlots.push({
            start: currentStart.toFormat('HH:mm'),
            end: currentEnd.toFormat('HH:mm'),
            isAvailable: isAvailable,
            isPending: false // 💡 Это поле больше не нужно, так как все занятые слоты просто будут isAvailable: false
        });
        
        currentStart = currentStart.plus({ minutes: intervalMinutes });
      }
      
      return allSlots;
    } finally {
      setLoading(false);
    }
  }, [bufferTimeHours]);
  
  const sendBooking = async (statusToSet = 'pending') => {
    setLoading(true);
    setMessage('');
    setError(null);
    setConflict(null);
  
    const { data: { user }, error: authError } = await supabase.auth.getUser();
  
    if (authError || !user) {
      setError('Пожалуйста, войдите, чтобы забронировать.');
      setLoading(false);
      return;
    }
      
    if (!isAgreed) {
        setError('Пожалуйста, примите правила бронирования.');
        setLoading(false);
        return;
    }
  
    if (!bookingDate || !startTime || !endTime || !selectedRoom || !phoneNumber || !userName) {
      setError('Пожалуйста, заполните все обязательные поля.');
      setLoading(false);
      return;
    }
    
    if (startTime === '' || endTime === '') {
        setError('Пожалуйста, выберите временной слот.');
        setLoading(false);
        return;
    }
  
    try {
      const { data: bookingResult, error: invokeError } = await supabase.functions.invoke('book-table', {
          body: {
              organizer_name: userName,
              booking_date: DateTime.fromJSDate(bookingDate).toISODate(),
              start_time: startTime,
              end_time: endTime,
              num_people: numberOfPeople,
              comments: comment,
              user_id: user.id,
              selected_room: selectedRoom,
              event_name: eventName,
              event_description: eventDescription,
              organizer_contact: organizerContact,
              phone_number: phoneNumber,
              status_to_set: statusToSet, 
          },
          method: 'POST',
      });
  
      if (invokeError) {
          console.error('Ошибка вызова Edge Function:', invokeError);
          setError('Произошла ошибка при отправке брони. Пожалуйста, попробуйте снова.');
          return;
      }
      
      if (bookingResult.error) {
          setError(bookingResult.error);
          return;
      }
  
      if (bookingResult.booking.status === 'pending') {
          setMessage('Ваша бронь успешно отправлена и ожидает подтверждения!');
      } else if (bookingResult.booking.status === 'queued') {
          setMessage('Ваша бронь успешно добавлена в лист ожидания!');
      }
      setIsBookingSuccessful(true);
      
    } catch (err) {
      console.error('Ошибка при отправке брони:', err.message);
      setError(`Ошибка при отправке брони: ${err.message}. Пожалуйста, попробуйте снова.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendBooking('pending');
  };

  const handleQueueBooking = async (e) => {
    e.preventDefault();
    await sendBooking('queued');
  };

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
      setFullyBookedDates([]);
      setPendingDates([]);
      setDurationHours(1);
      setIsBookingSuccessful(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    const fetchCalendarHighlights = async () => {
      if (step === 2 && selectedRoom && durationHours) {
        setLoading(true);
        const { data: allBookings, error } = await supabase
            .from('bookings')
            .select('booking_date, status')
            .eq('selected_room', selectedRoom)
            .gte('booking_date', getTodayDateString());
        
        if (error) {
            console.error('Ошибка при получении бронирований:', error.message);
            setError('Ошибка при загрузке данных о бронированиях.');
            setLoading(false);
            return;
        }

        const datesWithBookings = [...new Set(allBookings.map(b => b.booking_date))];
        const fullyBooked = [];
        
        for (const dateString of datesWithBookings) {
            const tempDate = new Date(dateString);
            const slots = await getAvailableSlots(tempDate, selectedRoom, durationHours);
            
            // 💡 Проверяем, есть ли хотя бы один доступный слот на эту дату
            if (slots.every(slot => !slot.isAvailable)) {
                fullyBooked.push(dateString);
            }
        }
        
        // 💡 Удаляем лишний стейт для pendingDates, так как вся логика теперь в isAvailable
        setFullyBookedDates(fullyBooked);
        setPendingDates([]);
        setLoading(false);
      }
    };
    fetchCalendarHighlights();
  }, [step, selectedRoom, durationHours, getAvailableSlots]);

  if (!isOpen) return null;

  const handleNextStep = async () => {
    setError(null);
    setMessage('');
    if (!selectedRoom || !numberOfPeople || !durationHours) {
        setError('Пожалуйста, заполните все обязательные поля.');
        return;
    }
    
    const minPeople = 1;
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
    setMessage('');
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
    // 💡 Этот флаг больше не нужен, т.к. все занятые слоты просто некликабельны
    // setIsSlotPending(slot.isPending); 
    setError(null);
    setMessage('');
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
  
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
        const dateString = date.toISOString().split('T')[0];
        if (fullyBookedDates.includes(dateString)) {
            return styles.fullyBooked;
        }
        // 💡 Удаляем логику для pendingDates, так как она больше не нужна
    }
    return null;
  };
  
  const formatDurationLabel = (value) => {
    if (value < 1) return `${value * 60} минут`;
    if (value === 1) return `1 час`;
    return `${value} часа`;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>
          &times;
        </button>
        
        {isBookingSuccessful ? (
          <div className={styles.successContainer}>
            <h2 className={styles.successTitle}>Бронирование успешно отправлено!</h2>
            <p className={styles.successText}>{message}</p>
            <p className={styles.successSubtext}>
              Спасибо за ваш выбор. Мы свяжемся с вами в ближайшее время.
            </p>
            <button className={styles.backButton} onClick={onClose}>Закрыть</button>
          </div>
        ) : (
          <>
            <h2>Забронировать столик</h2>
            {error && <p className={styles.errorMessage}>{error}</p>}
            {message && <p className={styles.successMessage}>{message}</p>}

            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                <div className={styles.section}>
                  <h3>Детали бронирования</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="selectedRoom">Выберите зал:</label>
                    <div className={styles.hallSelector}>
                      <button
                        type="button"
                        className={`${styles.hallButton} ${selectedRoom === 'second_hall' ? styles.active : ''}`}
                        onClick={() => {
                          setSelectedRoom('second_hall');
                          setNumberOfPeople(1);
                        }}
                        disabled={loading}
                      >
                        Зал
                      </button>
                      <button
                        type="button"
                        className={`${styles.hallButton} ${selectedRoom === 'summer_terrace' ? styles.active : ''}`}
                        onClick={() => {
                          setSelectedRoom('summer_terrace');
                          setNumberOfPeople(1);
                        }}
                        disabled={loading}
                      >
                        Летняя терраса
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="numberOfPeople">Количество человек:</label>
                    <div className={styles.partySizeControl}>
                      <button type="button" onClick={() => setNumberOfPeople(prev => Math.max(1, prev - 1))} disabled={loading || numberOfPeople <= 1 || !selectedRoom}>-</button>
                      <input
                        type="number"
                        id="numberOfPeople"
                        value={numberOfPeople}
                        onChange={(e) => setNumberOfPeople(Number(e.target.value))}
                        min="1"
                        max={maxPeople}
                        required
                        disabled={loading || !selectedRoom}
                      />
                      <button type="button" onClick={() => setNumberOfPeople(prev => Math.min(maxPeople, prev + 1))} disabled={loading || numberOfPeople >= maxPeople || !selectedRoom}>+</button>
                    </div>
                    {selectedRoom && (
                      <p className={styles.maxPeopleInfo}>Максимум: {maxPeople} человек</p>
                    )}
                  </div>
                  
                  <div className={styles.formGroup}>
                      <label htmlFor="durationHours">Продолжительность:</label>
                      <div className={styles.durationControl}>
                          <input
                              type="range"
                              id="durationHours"
                              value={durationHours}
                              onChange={(e) => setDurationHours(Number(e.target.value))}
                              min="0.5"
                              max={maxBookingDurationHours}
                              step="0.5"
                              required
                              disabled={loading}
                          />
                          <div className={styles.durationLabel}>
                              {formatDurationLabel(durationHours)}
                          </div>
                          <div className={styles.durationSteps}>
                              <span>30 мин</span>
                              <span>1 ч</span>
                              <span>1.5 ч</span>
                              <span>2 ч</span>
                              <span>2.5 ч</span>
                              <span>3 ч</span>
                          </div>
                      </div>
                  </div>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading || !selectedRoom}>
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
                            tileClassName={tileClassName}
                        />
                    </div>
                    
                    {loading && <p className={styles.loadingMessage}>Загрузка свободных времен...</p>}
                    
                    {suggestedSlots.length > 0 && !loading ? (
                      <div className={styles.availableSlotsContainer}>
                        <p className={styles.slotsHeader}>Слоты на {bookingDate?.toLocaleDateString()}</p>
                        <div className={styles.suggestedSlotsScroll}>
                          <div className={styles.suggestedSlotsContainer}>
                            {suggestedSlots.map((slot, index) => (
                              <button 
                                key={index} 
                                type="button"
                                // 💡 Добавляем класс, чтобы визуально выделить недоступные слоты
                                className={`${styles.suggestedSlotButton} ${startTime === slot.start && styles.selectedSlot} ${!slot.isAvailable ? styles.slotUnavailable : ''}`}
                                // 💡 Делаем кнопку некликабельной, если isAvailable: false
                                onClick={() => slot.isAvailable && handleTimeSelect(slot)}
                                disabled={!slot.isAvailable}
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

                {startTime && (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.section}>
                          <h3>Ваши контактные данные</h3>
                          <p className={styles.sectionDescription}>Для связи по вопросам бронирования.</p>
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
                        </div>

                        <div className={styles.section}>
                          <h3>Информация о событии <small>(необязательно)</small></h3>
                          <p className={styles.sectionDescription}>Эти данные будут использованы для анонса в наших соцсетях.</p>
                          <div className={styles.formGroup}>
                            <label htmlFor="eventName">Название события:</label>
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
                            <label htmlFor="eventDescription">Описание события:</label>
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
                            <label htmlFor="organizerContact">Контакт для связи с организацией:</label>
                            <input
                                type="text"
                                id="organizerContact"
                                value={organizerContact}
                                onChange={(e) => setOrganizerContact(e.target.value)}
                                disabled={loading}
                                placeholder="Например: @наш_инстаграм или +77001234567"
                            />
                          </div>
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label htmlFor="comment">Комментарий <small>(для администрации, необязательно)</small>:</label>
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
                            Я ознакомился с <a href="/documentsPdf/rules_compressed.pdf" target="_blank" rel="noopener noreferrer">правилами</a>
                        </label>
                        </div>
                        
                        <button type="submit" className={styles.submitButton} disabled={!isAgreed || loading}>
                            {loading ? 'Отправка...' : 'Подтвердить бронирование'}
                        </button>
                    </form>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;