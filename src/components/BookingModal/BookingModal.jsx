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
    const now = DateTime.local();

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

      // Check if the current slot is in the past
      if (currentEnd < now) {
          currentStart = currentStart.plus({ minutes: intervalMinutes });
          continue; // Skip slots that are in the past
      }

      // Check for conflicts with ALL occupied intervals
      let hasConfirmedConflict = false;
      for (const confirmedInterval of confirmedIntervals) {
        if (slotInterval.overlaps(confirmedInterval) || confirmedInterval.contains(slotInterval)) {
          hasConfirmedConflict = true;
          break;
        }
      }

      if (!hasConfirmedConflict) {
        let hasPendingConflict = false;
        for (const pendingInterval of pendingIntervals) {
          if (slotInterval.overlaps(pendingInterval) || pendingInterval.contains(slotInterval)) {
            hasPendingConflict = true;
            break;
          }
        }
        
        availableSlots.push({
            start: currentStart.toFormat('HH:mm'),
            end: currentEnd.toFormat('HH:mm'),
            isPending: hasPendingConflict
        });
      }
      
      currentStart = currentStart.plus({ minutes: intervalMinutes });
    }
    
    return availableSlots;
  }, [cleanupTimeHours]);

  // ... (остальная часть компонента остается без изменений) ...

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
      
      // Corrected logic: Check for overlap OR if the proposed interval is contained within an existing one
      if (proposedBookingInterval.overlaps(occupiedInterval) || occupiedInterval.contains(proposedBookingInterval)) {
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
            
            {/* Улучшенная секция выбора зала */}
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
                    Летняя терраса
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
                    <div className={styles.legend}>
                      <div className={styles.legendItem}>
                          <span className={`${styles.legendColor} ${styles.fullyBooked}`} /> Занято
                      </div>
                      <div className={styles.legendItem}>
                          <span className={`${styles.legendColor} ${styles.hasPending}`} /> Лист ожидания
                      </div>
                      <div className={styles.legendItem}>
                          <span className={`${styles.legendColor} ${styles.available}`} /> Свободно
                      </div>
                    </div>
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
                    <p className={styles.slotsHeader}>Свободные слоты на **{bookingDate?.toLocaleDateString()}**</p>
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
                          <p className={styles.conflictIcon}>⏳</p>
                          <p className={styles.conflictHeader}>На выбранное время уже есть ожидающая бронь.</p>
                          <p>Ваша бронь будет добавлена в лист ожидания.</p>
                        </div>
                    )}
                    
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