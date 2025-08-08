// src/components/BookingModal/BookingModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './BookingModal.module.scss';
import { supabase } from '../../supabaseClient';
import { IMaskInput } from 'react-imask';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Import Luxon
import { DateTime, Interval } from 'luxon';

// Helper function to get today's date string
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
  
  const [conflict, setConflict] = useState(null);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [pendingDates, setPendingDates] = useState([]);
  const [isSlotPending, setIsSlotPending] = useState(false);

  // Constants
  const maxBookingDurationHours = 3;
  const cleanupTimeHours = 1;

  // Memoized function for getRoomName
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
  
  // Memoized function for getAvailableSlots
  const getAvailableSlots = useCallback(async (date, room, duration) => {
    if (!date || !room || !duration) return [];
    
    const dateString = date.toISOString().split('T')[0];
    
    // Fetch bookings for the specific date, excluding canceled ones
    setLoading(true);
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('booking_date', dateString)
      .eq('selected_room', room)
      .neq('status', 'canceled');
    setLoading(false);
    
    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return [];
    }
    
    const availableSlots = [];
    const cafeOpenHour = 9; // Bookings can start from 9:00 (after 1-hour cleanup)
    const cafeCloseHour = 22; // Last possible end time is 22:00
    const intervalMinutes = 30; // Slot interval
    const durationMinutes = duration * 60;
    const cleanupMinutes = cleanupTimeHours * 60;
    
    // Convert current date to a Luxon DateTime object
    const dateObj = DateTime.fromJSDate(date);
    const today = DateTime.local();

    // Create intervals for existing bookings, including cleanup time
    const confirmedIntervals = [];
    const pendingIntervals = [];
    
    for (const booking of bookings) {
      const bookingStartTime = DateTime.fromISO(`${dateString}T${booking.start_time}`);
      const bookingEndTime = DateTime.fromISO(`${dateString}T${booking.end_time}`);
      
      // The occupied interval starts 1 hour before the booking and ends at the booking's end time
      const occupiedStart = bookingStartTime.minus({ minutes: cleanupMinutes });
      const occupiedInterval = Interval.fromDateTimes(occupiedStart, bookingEndTime);
      
      if (booking.status === 'confirmed') {
        confirmedIntervals.push(occupiedInterval);
      } else if (booking.status === 'pending') {
        pendingIntervals.push(occupiedInterval);
      }
    }

    // Generate and check all possible slots
    let currentStart = dateObj.set({ hour: cafeOpenHour, minute: 0, second: 0, millisecond: 0 });
    const cafeCloseTime = dateObj.set({ hour: cafeCloseHour, minute: 0, second: 0, millisecond: 0 });
    
    while (currentStart.plus({ minutes: durationMinutes }) <= cafeCloseTime) {
      const currentEnd = currentStart.plus({ minutes: durationMinutes });
      const slotInterval = Interval.fromDateTimes(currentStart, currentEnd);

      // Check for conflicts with confirmed bookings
      let hasConfirmedConflict = false;
      for (const confirmedInterval of confirmedIntervals) {
        if (slotInterval.overlaps(confirmedInterval)) {
          hasConfirmedConflict = true;
          break;
        }
      }

      if (!hasConfirmedConflict) {
        // Check for conflicts with pending bookings
        let hasPendingConflict = false;
        for (const pendingInterval of pendingIntervals) {
          if (slotInterval.overlaps(pendingInterval)) {
            hasPendingConflict = true;
            break;
          }
        }
        
        // Don't show slots in the past
        const isPast = currentEnd < today;
        
        if (!isPast) {
          availableSlots.push({
            start: currentStart.toFormat('HH:mm'),
            end: currentEnd.toFormat('HH:mm'),
            isPending: hasPendingConflict
          });
        }
      }
      
      currentStart = currentStart.plus({ minutes: intervalMinutes });
    }
    
    return availableSlots;
  }, [cleanupTimeHours]);
  
  // Memoized function for checkAvailability (also updated with Luxon)
  const checkAvailability = useCallback(async (manualStartTime, manualEndTime) => {
    // We can use the existing state for validation, but for manual check, we can pass params
    const startTimeToCheck = manualStartTime || startTime;
    const endTimeToCheck = manualEndTime || endTime;

    if (!bookingDate || !startTimeToCheck || !endTimeToCheck || !selectedRoom || !numberOfPeople) {
      return { available: false, message: 'Пожалуйста, заполните все обязательные поля.' };
    }

    const maxPeople = selectedRoom === 'second_hall' ? 20 : selectedRoom === 'summer_terrace' ? 10 : 1;
    if (numberOfPeople < 1 || numberOfPeople > maxPeople) {
      return { available: false, message: `Для выбранного зала количество человек должно быть от 1 до ${maxPeople}.` };
    }
    
    // Luxon for duration validation
    const startDateTime = DateTime.fromJSDate(bookingDate).set({ hour: parseInt(startTimeToCheck.split(':')[0]), minute: parseInt(startTimeToCheck.split(':')[1]) });
    const endDateTime = DateTime.fromJSDate(bookingDate).set({ hour: parseInt(endTimeToCheck.split(':')[0]), minute: parseInt(endTimeToCheck.split(':')[1]) });
    const duration = endDateTime.diff(startDateTime, 'hours').hours;

    if (duration <= 0 || duration > maxBookingDurationHours) {
        return { available: false, message: `Продолжительность должна быть от 0.5 до ${maxBookingDurationHours} часов.` };
    }
    
    const { data: existingBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('booking_date', bookingDate.toISOString().split('T')[0])
        .eq('selected_room', selectedRoom)
        .neq('status', 'canceled');

    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return { available: false, message: 'Произошла ошибка при проверке доступности. Пожалуйста, попробуйте снова.' };
    }

    const cleanupMinutes = cleanupTimeHours * 60;
    
    let hasConfirmedConflict = false;
    let hasPendingConflict = false;
    
    const proposedBookingStart = DateTime.fromISO(`${bookingDate.toISOString().split('T')[0]}T${startTimeToCheck}`);
    const proposedBookingEnd = DateTime.fromISO(`${bookingDate.toISOString().split('T')[0]}T${endTimeToCheck}`);
    const proposedBookingInterval = Interval.fromDateTimes(proposedBookingStart, proposedBookingEnd);

    for (const booking of existingBookings) {
      const existingBookingStart = DateTime.fromISO(`${bookingDate.toISOString().split('T')[0]}T${booking.start_time}`);
      const existingBookingEnd = DateTime.fromISO(`${bookingDate.toISOString().split('T')[0]}T${booking.end_time}`);
      const occupiedStart = existingBookingStart.minus({ minutes: cleanupMinutes });
      const occupiedInterval = Interval.fromDateTimes(occupiedStart, existingBookingEnd);
      
      if (proposedBookingInterval.overlaps(occupiedInterval)) {
        if (booking.status === 'confirmed') {
          hasConfirmedConflict = true;
          break;
        }
        if (booking.status === 'pending') {
          hasPendingConflict = true;
        }
      }
    }
    
    if (hasConfirmedConflict) {
      return { available: false, message: 'Выбранное время уже занято подтвержденной бронью или недоступно. Выберите другое время.' };
    }

    if (hasPendingConflict) {
      return { 
        available: 'queued', 
        message: 'На выбранное время уже есть ожидающая бронь. Ваша бронь может быть добавлена в очередь.',
        conflictType: 'pending'
      };
    }

    return { available: true };
  }, [bookingDate, startTime, endTime, selectedRoom, numberOfPeople, cleanupTimeHours, maxBookingDurationHours]);

  // UseEffect for initial state and data fetching
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
    }
  }, [isOpen]);
  
  // UseEffect for fetching calendar highlights
  useEffect(() => {
    const fetchCalendarHighlights = async () => {
      if (step === 2 && selectedRoom && durationHours) {
        setLoading(true);
        // Step 1: Get all future bookings for the room
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
        const pendingBooked = [];
        
        // Step 2: For each date, check for available slots and pending bookings
        for (const dateString of datesWithBookings) {
            const tempDate = new Date(dateString);
            const slots = await getAvailableSlots(tempDate, selectedRoom, durationHours);

            if (slots.length === 0) {
                fullyBooked.push(dateString);
            } else {
                const hasPending = slots.some(slot => slot.isPending);
                if (hasPending) {
                    pendingBooked.push(dateString);
                }
            }
        }

        setFullyBookedDates(fullyBooked);
        setPendingDates(pendingBooked);
        setLoading(false);
      }
    };
    fetchCalendarHighlights();
  }, [step, selectedRoom, durationHours, getAvailableSlots]);

  if (!isOpen) return null;

  const maxPeople = selectedRoom === 'second_hall' ? 20 : selectedRoom === 'summer_terrace' ? 10 : 1;

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
    setIsSlotPending(slot.isPending);
    setError(null);
    setMessage('');
  };

  const handleQueueBooking = async (e) => {
    e.preventDefault();
    if (!isAgreed) {
        setError('Пожалуйста, примите правила бронирования.');
        return;
    }
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
            <b>Статус:</b> ${newBooking.status === 'confirmed' ? '✅ Подтверждено' : newBooking.status === 'pending' ? '⏳ В ожидании' : newBooking.status === 'queued' ? 'Лист ожидания' : '❌ Отменено'}
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

    const availabilityCheckResult = await checkAvailability(startTime, endTime);
    
    if (availabilityCheckResult.available === false) {
        setError(availabilityCheckResult.message);
        setConflict(availabilityCheckResult.conflictType);
        setSuggestedSlots([]);
        setLoading(false);
        return;
    } 

    if (availabilityCheckResult.available === 'queued') {
        setError(availabilityCheckResult.message);
        setConflict(availabilityCheckResult.conflictType);
        setSuggestedSlots([]);
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
  
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
        const dateString = date.toISOString().split('T')[0];
        if (fullyBookedDates.includes(dateString)) {
            return styles.fullyBooked;
        }
        if (pendingDates.includes(dateString)) {
            return styles.hasPending;
        }
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
        <h2>Забронировать столик</h2>
        {error && <p className={styles.errorMessage}>{error}</p>}
        {message && <p className={styles.successMessage}>{message}</p>}

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
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
                  <span>(до 20 человек)</span>
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
                  Летник
                  <span>(до 10 человек)</span>
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
                    <div className={styles.legend}>
                        <div className={styles.legendItem}>
                            <span className={styles.fullyBooked} /> Полностью занято
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.hasPending} /> Есть ожидающие брони
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.available} /> Свободно
                        </div>
                    </div>
                </div>
                
                {loading && <p className={styles.loadingMessage}>Загрузка свободных времен...</p>}
                
                {suggestedSlots.length > 0 && !loading ? (
                  <div className={styles.availableSlotsContainer}>
                    <p>Свободные слоты на {bookingDate?.toLocaleDateString()}:</p>
                    <div className={styles.suggestedSlotsScroll}>
                      <div className={styles.suggestedSlotsContainer}>
                        {suggestedSlots.map((slot, index) => (
                          <button 
                            key={index} 
                            type="button"
                            className={`${styles.suggestedSlotButton} ${startTime === slot.start && styles.selectedSlot} ${slot.isPending ? styles.slotIsPending : ''}`}
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

            {startTime && (
                <form onSubmit={handleSubmit}>
                    {isSlotPending && (
                        <div className={styles.conflictMessage}>
                            <p className={styles.conflictHeader}>На выбранное время уже есть ожидающая бронь.</p>
                            <p>Вы можете либо изменить детали бронирования, либо встать в лист ожидания.</p>
                        </div>
                    )}
                    
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
                    
                    {isSlotPending ? (
                        <button type="button" onClick={handleQueueBooking} className={styles.submitButton} disabled={!isAgreed || loading}>
                            {loading ? 'Отправка...' : 'Встать в лист ожидания'}
                        </button>
                    ) : (
                        <button type="submit" className={styles.submitButton} disabled={!isAgreed || loading}>
                            {loading ? 'Отправка...' : 'Подтвердить бронирование'}
                        </button>
                    )}
                </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;