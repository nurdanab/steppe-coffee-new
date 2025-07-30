import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './BookingModal.module.css';
import { IMaskInput } from 'react-imask'; // Импортируем IMaskInput

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BookingModal = ({ isOpen, onClose }) => {
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('main_hall'); // По умолчанию "Главный зал"
  const [numberOfPeople, setNumberOfPeople] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Сбрасываем состояние при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      // Устанавливаем сегодняшнюю дату по умолчанию при открытии
      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      setStartTime('');
      setEndTime('');
      setSelectedRoom('main_hall');
      setNumberOfPeople('');
      setPhoneNumber('');
      setUserName('');
      setComment('');
      setMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cafeOpenTime = '08:00';
  const cafeCloseTime = '22:00';

  const checkAvailability = async (date, start, end, room) => {
    // Валидация: время начала должно быть раньше времени окончания
    if (start >= end) {
      return { available: false, message: 'Время начала не может быть позже или равно времени окончания.' };
    }

    // Валидация: время должно быть в рамках рабочего дня кафе
    if (start < cafeOpenTime || end > cafeCloseTime) {
      return { available: false, message: `Кафе работает с ${cafeOpenTime} до ${cafeCloseTime}.` };
    }

    // Валидация: нельзя бронировать на прошедшее время/дату
    const currentDateTime = new Date();
    const currentDay = currentDateTime.toISOString().split('T')[0];
    const currentTime = currentDateTime.toTimeString().substring(0, 5); // HH:MM

    if (date < currentDay) {
        return { available: false, message: 'Нельзя забронировать на прошедшую дату.' };
    }
    if (date === currentDay && start < currentTime) {
        return { available: false, message: 'Нельзя забронировать на прошедшее время сегодня.' };
    }

    // Проверка на пересечение с существующими бронированиями
    const { data: existingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, status')
      .eq('booking_date', date)
      .eq('selected_room', room)
      .in('status', ['confirmed', 'pending']); // Проверяем бронирования в статусах 'confirmed' и 'pending'

    if (fetchError) {
      console.error('Ошибка при получении существующих бронирований:', fetchError.message);
      return { available: false, message: 'Произошла ошибка при проверке доступности. Пожалуйста, попробуйте снова.' };
    }

    for (const booking of existingBookings) {
      const existingStart = booking.start_time;
      const existingEnd = booking.end_time;

      // Проверка на пересечение
      if (
        (start < existingEnd && end > existingStart) || // Новое бронирование пересекается с существующим
        (start >= existingStart && start < existingEnd) || // Начало нового бронирования внутри существующего
        (end > existingStart && end <= existingEnd) || // Конец нового бронирования внутри существующего
        (start <= existingStart && end >= existingEnd) // Новое бронирование полностью охватывает существующее
      ) {
        // Специальное правило для "Второго зала внутри"
        if (room === 'second_hall') {
          // Вычисляем время окончания предыдущего бронирования + 1 час
          const prevBookingEndTime = new Date(`${date}T${existingEnd}:00`);
          prevBookingEndTime.setHours(prevBookingEndTime.getHours() + 1);
          const requiredStartTime = prevBookingEndTime.toTimeString().substring(0, 5);

          // Если новое бронирование начинается раньше, чем через 1 час после окончания предыдущего
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

    // Валидация количества человек для залов
    let minPeople = 0;
    let maxPeople = 0;

    switch (selectedRoom) {
      case 'main_hall':
        minPeople = 2;
        maxPeople = 6;
        break;
      case 'second_hall':
        minPeople = 4;
        maxPeople = 10;
        break;
      case 'terrace':
        minPeople = 2;
        maxPeople = 8;
        break;
      default:
        break;
    }

    if (numberOfPeople < minPeople || numberOfPeople > maxPeople) {
      setMessage(`Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.`);
      setLoading(false);
      return;
    }

    const availability = await checkAvailability(bookingDate, startTime, endTime, selectedRoom);

    if (!availability.available) {
      setMessage(availability.message);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            selected_room: selectedRoom,
            number_of_people: numberOfPeople,
            phone_number: phoneNumber,
            user_name: userName,
            comment: comment,
            status: 'pending', // Всегда 'pending' при создании
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        throw error;
      }

      setMessage('Ваша бронь успешно отправлена! Ожидайте подтверждения.');
      // Очистка формы после успешной отправки
      setBookingDate(new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setSelectedRoom('main_hall');
      setNumberOfPeople('');
      setPhoneNumber('');
      setUserName('');
      setComment('');

      // Закрываем модальное окно через 3 секунды
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Ошибка при отправке брони:', error.message);
      setMessage(`Ошибка при отправке брони: ${error.message}. Пожалуйста, попробуйте снова.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>Забронировать столик</h2>
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
              min={new Date().toISOString().split('T')[0]} // Минимальная дата - сегодня
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
              min="08:00" // Кафе открывается в 08:00
              max="22:00" // Последнее возможное время начала бронирования
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
              min="08:00" // Кафе открывается в 08:00
              max="22:00" // Последнее возможное время окончания бронирования
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
              <option value="main_hall">Главный зал</option>
              <option value="second_hall">Второй зал внутри</option>
              <option value="terrace">Терраса</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="numberOfPeople">Количество человек:</label>
            <input
              type="number"
              id="numberOfPeople"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
              min="1"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Контактный номер телефона:</label>
            <IMaskInput
              mask="+{7}(000)000-00-00" // Маска для казахстанского номера
              definitions={{
                '#': /[0-9]/,
              }}
              value={phoneNumber}
              onAccept={(value) => setPhoneNumber(value)} // onAccept для IMaskInput
              placeholder="+7(___)___-__-__"
              required
              disabled={loading}
              className={styles.input} // Применяем стили как к обычным инпутам
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="userName">Ваше имя:</label>
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
            <label htmlFor="comment">Комментарий (по желанию):</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
              disabled={loading}
            ></textarea>
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Отправка...' : 'Забронировать'}
          </button>
        </form>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default BookingModal;