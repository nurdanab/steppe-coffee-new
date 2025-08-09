// src/components/BookingModal/BookingModal.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IMaskInput } from 'react-imask';
import styles from './BookingModal.module.scss';
import { supabase } from '../../supabaseClient';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { DateTime, Interval } from 'luxon';

const BookingModal = ({ isOpen, onClose, currentUserId, currentUserEmail }) => {
  const [step, setStep] = useState(1);
  const [bookingDate, setBookingDate] = useState(new Date());
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
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [monthlyBookings, setMonthlyBookings] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);

  // 🛠️ ИСПРАВЛЕНИЕ: Используем Luxon для создания 'today' в нужной временной зоне.
  const today = useMemo(() => {
    return DateTime.now().setZone('Asia/Almaty').startOf('day').toJSDate();
  }, []);

  const maxBookingDurationHours = 3;
  const bufferTimeHours = 1;
  const maxPeople = selectedRoom === 'second_hall' ? 20 : selectedRoom === 'summer_terrace' ? 10 : 1;
  const cafeOpenHour = 8;
  const cafeCloseHour = 22;

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

  const calculateAvailableSlots = useCallback((date, room, duration, bookings) => {
    // 🛠️ ИСПРАВЛЕНИЕ: Явно указываем зону при создании DateTime из JS Date.
    const luxonDate = DateTime.fromJSDate(date, { zone: 'Asia/Almaty' });
    const dateString = luxonDate.toISODate();
    const allSlots = [];
    const intervalMinutes = 30;
    const durationMinutes = duration * 60;
    const bufferMinutes = bufferTimeHours * 60;
    // 🛠️ ИСПРАВЛЕНИЕ: Получаем текущее время в правильной зоне.
    const now = DateTime.now().setZone('Asia/Almaty');

    const dailyBookings = bookings.filter(b => b.booking_date === dateString && b.selected_room === room);

    const occupiedIntervals = [];
    for (const booking of dailyBookings) {
      // 🛠️ ИСПРАВЛЕНИЕ: Явно указываем зону при создании DateTime из строки.
      const bookingStartTime = DateTime.fromISO(`${booking.booking_date}T${booking.start_time}`, { zone: 'Asia/Almaty' });
      const bookingEndTime = DateTime.fromISO(`${booking.booking_date}T${booking.end_time}`, { zone: 'Asia/Almaty' });
      
      const occupiedStart = bookingStartTime.minus({ minutes: bufferMinutes });
      const occupiedEnd = bookingEndTime.plus({ minutes: bufferMinutes });
      occupiedIntervals.push(Interval.fromDateTimes(occupiedStart, occupiedEnd));
    }

    let currentStart = luxonDate.set({ hour: cafeOpenHour, minute: 0, second: 0, millisecond: 0 });
    const lastPossibleSlotStart = luxonDate.set({ hour: cafeCloseHour, minute: 0, second: 0, millisecond: 0 }).minus({ minutes: durationMinutes });

    while (currentStart <= lastPossibleSlotStart) {
      const currentEnd = currentStart.plus({ minutes: durationMinutes });
      const slotInterval = Interval.fromDateTimes(currentStart, currentEnd);

      const isAvailable = !occupiedIntervals.some(occupiedInterval => slotInterval.overlaps(occupiedInterval)) && currentStart > now;
      
      allSlots.push({
        start: currentStart.toFormat('HH:mm'),
        end: currentEnd.toFormat('HH:mm'),
        isAvailable: isAvailable
      });

      currentStart = currentStart.plus({ minutes: intervalMinutes });
    }

    return allSlots;
  }, [bufferTimeHours]);

  const fetchMonthlyBookings = useCallback(async (room, duration, date) => {
    if (!room || !duration || !date) {
      setMonthlyBookings([]);
      setFullyBookedDates([]);
      return;
    }

    setLoading(true);
    setError(null);
    // 🛠️ ИСПРАВЛЕНИЕ: Убеждаемся, что мы работаем с датой в правильной зоне.
    const luxonDate = DateTime.fromJSDate(date, { zone: 'Asia/Almaty' });
    const startOfMonth = luxonDate.startOf('month').toISODate();
    const endOfMonth = luxonDate.endOf('month').toISODate();

    try {
      const { data: bookings, error: fetchError } = await supabase
        .from('public_bookings_for_calendar')
        .select('booking_date, start_time, end_time, selected_room, status')
        .eq('selected_room', room)
        .gte('booking_date', startOfMonth)
        .lte('booking_date', endOfMonth);

      if (fetchError) {
        throw fetchError;
      }

      setMonthlyBookings(bookings);

      const datesWithBookings = [...new Set(bookings.map(b => b.booking_date))];
      const fullyBooked = [];
      const now = DateTime.now().setZone('Asia/Almaty');

      for (const dateString of datesWithBookings) {
        // 🛠️ ИСПРАВЛЕНИЕ: Создаем временный объект DateTime с нужной зоной.
        const tempDateLuxon = DateTime.fromISO(dateString, { zone: 'Asia/Almaty' });
        const tempDate = tempDateLuxon.toJSDate();
        const slots = calculateAvailableSlots(tempDate, room, duration, bookings);

        const allSlotsUnavailable = slots.every(slot => !slot.isAvailable);
        const atLeastOneFutureSlotExists = slots.some(slot =>
          DateTime.fromFormat(slot.start, 'HH:mm', { zone: 'Asia/Almaty' })
            .set({
              year: tempDateLuxon.year,
              month: tempDateLuxon.month,
              day: tempDateLuxon.day
            }) > now
        );

        if (allSlotsUnavailable && atLeastOneFutureSlotExists) {
          fullyBooked.push(dateString);
        }
      }

      setFullyBookedDates(fullyBooked);

    } catch (err) {
      console.error('Ошибка при получении бронирований за месяц:', err.message);
      setError('Ошибка при загрузке данных о бронированиях.');
    } finally {
      setLoading(false);
    }
  }, [calculateAvailableSlots]);

  const sendBooking = async (statusToSet = 'pending') => {
    setLoading(true);
    setMessage('');
    setError(null);

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
      setError('Пожалуйста, заполните все обязательные поля и выберите временной слот.');
      setLoading(false);
      return;
    }

    try {
      const { data: bookingResult, error: invokeError } = await supabase.functions.invoke('book-table', {
        body: {
          organizer_name: userName,
          // 🛠️ ИСПРАВЛЕНИЕ: Преобразуем дату в ISO-строку с учетом зоны.
          booking_date: DateTime.fromJSDate(bookingDate, { zone: 'Asia/Almaty' }).toISODate(),
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
      setBookingDate(new Date());
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
      setSuggestedSlots([]);
      setMonthlyBookings([]);
      setFullyBookedDates([]);
      setDurationHours(1);
      setIsBookingSuccessful(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 2 && selectedRoom && durationHours && bookingDate) {
      fetchMonthlyBookings(selectedRoom, durationHours, bookingDate);
    }
  }, [step, selectedRoom, durationHours, bookingDate, fetchMonthlyBookings]);

  useEffect(() => {
    if (step === 2 && bookingDate && selectedRoom && durationHours && monthlyBookings.length > 0) {
      const slots = calculateAvailableSlots(bookingDate, selectedRoom, durationHours, monthlyBookings);
      setSuggestedSlots(slots);
    }
  }, [step, bookingDate, selectedRoom, durationHours, monthlyBookings, calculateAvailableSlots]);

  const validateStep1 = () => {
    setError(null);
    if (!selectedRoom || !numberOfPeople || !durationHours) {
        setError('Пожалуйста, заполните все обязательные поля.');
        return false;
    }

    const minPeople = 1;
    if (numberOfPeople < minPeople || numberOfPeople > maxPeople) {
        setError(`Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.`);
        return false;
    }

    if (durationHours <= 0) {
        setError('Продолжительность бронирования должна быть больше 0.');
        return false;
    }
    if (durationHours > maxBookingDurationHours) {
        setError(`Максимальное время бронирования - ${maxBookingDurationHours} часа.`);
        return false;
    }

    return true;
  };

  if (!isOpen) return null;

  const handleNextStep = async () => {
    setMessage('');
    if (!validateStep1()) {
      return;
    }
    setStep(2);
  };

  const handleDateChange = (date) => {
    setBookingDate(date);
    setError(null);
    setMessage('');
    setStartTime('');
    setEndTime('');
  };

  const handleTimeSelect = (slot) => {
    setStartTime(slot.start);
    setEndTime(slot.end);
    setError(null);
    setMessage('');
  };

  const handleBackStep = () => {
    setStep(1);
    setError(null);
    setSuggestedSlots([]);
    setMonthlyBookings([]);
    setFullyBookedDates([]);
  };

  const isDateDisabled = ({ date }) => {
    // 🛠️ ИСПРАВЛЕНИЕ: Сравниваем даты с помощью Luxon, чтобы избежать смещения.
    const luxonDate = DateTime.fromJSDate(date, { zone: 'Asia/Almaty' });
    const luxonToday = DateTime.now().setZone('Asia/Almaty').startOf('day');
    if (luxonDate < luxonToday) {
      return true;
    }

    const dateString = luxonDate.toISODate();
    return fullyBookedDates.includes(dateString);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      // 🛠️ ИСПРАВЛЕНИЕ: Получаем dateString, явно указывая временную зону.
      const dateString = DateTime.fromJSDate(date, { zone: 'Asia/Almaty' }).toISODate();
      if (fullyBookedDates.includes(dateString)) {
        return styles.fullyBooked;
      }
    }
    return null;
  };

  const handleCalendarNavigation = ({ activeStartDate }) => {
    if (activeStartDate) {
      setBookingDate(activeStartDate);
    }
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

minDate={today}

onChange={handleDateChange}

value={bookingDate}

tileDisabled={isDateDisabled}

tileClassName={tileClassName}

onActiveStartDateChange={handleCalendarNavigation}

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

className={`${styles.suggestedSlotButton} ${startTime === slot.start && styles.selectedSlot} ${!slot.isAvailable ? styles.slotUnavailable : ''}`}

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

!loading && <p className={styles.noSlotsMessage}>На выбранную дату нет свободных слотов. Попробуйте выбрать другую дату или изменить продолжительность бронирования.</p>

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