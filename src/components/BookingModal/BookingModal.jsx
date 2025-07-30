// src/components/BookingModal/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './BookingModal.module.scss'; // Убедись, что это .scss
import { supabase } from '../../supabaseClient';
import { IMaskInput } from 'react-imask';

// Проверь, что здесь нет повторной инициализации supabaseClient
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; // Эти строки должны быть удалены
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Эти строки должны быть удалены
// const supabase = createClient(supabaseUrl, supabaseAnonKey); // Эта строка должна быть удалена

const BookingModal = ({ isOpen, onClose, currentUserId, currentUserEmail }) => { // <-- ИСПРАВЛЕНО
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(''); // Изначально пусто, чтобы требовать выбор
  const [numberOfPeople, setNumberOfPeople] = useState(1); // По умолчанию 1
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState(''); // Теперь userName
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null); // Добавлено для явного управления ошибками


  // Сбрасываем состояние при открытии/закрытии модального окна и предзаполняем
  useEffect(() => {
    if (isOpen) {
      // Предзаполняем имя пользователя его email, если есть сессия
      if (currentUserId) {
        setUserName(currentUserEmail || '');
      } else {
        setUserName('');
      }

      // Устанавливаем сегодняшнюю дату по умолчанию при открытии
      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      setStartTime('');
      setEndTime('');
      setSelectedRoom(''); // Сбрасываем выбор зала
      setNumberOfPeople(1); // Сбрасываем количество людей
      setPhoneNumber('');
      setComment('');
      setMessage(''); // Очищаем сообщения
      setError(null); // Очищаем ошибки
    }
  }, [isOpen, currentUserId, currentUserEmail]); // Добавляем зависимости для реагирования на изменение сессии

  if (!isOpen) return null;

  const cafeOpenTime = '08:00';
  const cafeCloseTime = '22:00';

  const checkAvailability = async (date, start, end, room, numPpl) => { // Добавили numPpl как параметр
    setError(null); // Сбрасываем ошибки перед проверкой

    // Валидация: количество человек для залов (перемещено сюда для ранней проверки)
    let minPeople = 0;
    let maxPeople = 0;

    switch (room) { // Используем 'room' из параметров функции
      case 'second_hall':
        minPeople = 1; // Уточни минимальное количество
        maxPeople = 20; // Максимум 20 человек
        break;
      case 'summer_terrace': // Уточни название "Летник" на "summer_terrace" или то, что в БД
        minPeople = 1; // Уточни минимальное количество
        maxPeople = 10; // Максимум 10 человек
        break;
      // Добавь другие залы, если они есть
      default:
        minPeople = 1; // Общее минимальное значение по умолчанию
        maxPeople = 50; // Общее максимальное значение по умолчанию
        break;
    }

    if (numPpl < minPeople || numPpl > maxPeople) {
      return { available: false, message: `Для выбранного зала количество человек должно быть от ${minPeople} до ${maxPeople}.` };
    }

    // Валидация: время начала должно быть раньше времени окончания
    if (start >= end) {
      return { available: false, message: 'Время начала не может быть позже или равно времени окончания.' };
    }

    // Валидация: время должно быть в рамках рабочего дня кафе
    if (start < cafeOpenTime || end > cafeCloseTime) {
      return { available: false, message: `Кофейня работает с ${cafeOpenTime} до ${cafeCloseTime}.` };
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

      // Проверка на пересечение интервалов
      // (start < existingEnd && end > existingStart) - базовая проверка на пересечение
      if ((start < existingEnd) && (end > existingStart)) {
        // Если есть пересечение, применяем правило 1 часа для "Второго зала внутри"
        if (room === 'second_hall') {
          // Вычисляем время окончания предыдущего бронирования + 1 час
          const existingEndTimeDate = new Date(`${date}T${existingEnd}`);
          existingEndTimeDate.setHours(existingEndTimeDate.getHours() + 1);
          const requiredStartTime = existingEndTimeDate.toTimeString().substring(0, 5);

          // Если новое бронирование начинается раньше, чем через 1 час после окончания существующего
          if (start < requiredStartTime) {
            return { available: false, message: 'Выбранное время для "Второго зала внутри" занято или недоступно с учетом правил интервала. Пожалуйста, выберите другое время.' };
          }
        } else {
          // Для других залов просто сообщаем о занятости
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
    setError(null); // Сбрасываем ошибки

    // Проверка авторизации
    if (!currentUserId) {
        setMessage('Пожалуйста, войдите или зарегистрируйтесь, чтобы забронировать столик.');
        setLoading(false);
        return;
    }

    // Вызываем функцию проверки доступности перед отправкой
    const availabilityCheckResult = await checkAvailability(bookingDate, startTime, endTime, selectedRoom, numberOfPeople);

    if (!availabilityCheckResult.available) {
      setError(availabilityCheckResult.message); // Устанавливаем ошибку
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
            num_people: numberOfPeople, // Убедись, что это `num_people` в БД
            phone_number: phoneNumber,
            organizer_name: userName, // Используем userName как organizer_name
            comments: comment, // Используем comment как comments
            user_id: currentUserId, // Используем currentUserId из пропсов
            status: 'pending', // Всегда 'pending' при создании
            // created_at: new Date().toISOString(), // Supabase добавит это автоматически
          },
        ])
        .select(); // Добавим .select() для получения вставленных данных

      if (insertError) {
        throw insertError;
      }

      setMessage('Ваша бронь успешно отправлена! Ожидайте подтверждения.');
      // Очистка формы после успешной отправки
      setBookingDate(new Date().toISOString().split('T')[0]);
      setStartTime('');
      setEndTime('');
      setSelectedRoom('');
      setNumberOfPeople(1);
      setPhoneNumber('');
      setUserName(currentUserEmail || ''); // Сбрасываем, но предзаполняем если авторизован
      setComment('');

      // Закрываем модальное окно через 3 секунды (можно убрать, если не нужно)
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) { // Изменено с 'error' на 'err' чтобы избежать конфликта имен
      console.error('Ошибка при отправке брони:', err.message);
      setError(`Ошибка при отправке брони: ${err.message}. Пожалуйста, попробуйте снова.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}> {/* Добавил onClick={onClose} для закрытия по клику вне модалки */}
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}> {/* Предотвращает закрытие по клику внутри модалки */}
        <button className={styles.closeButton} onClick={onClose} disabled={loading}>
          &times;
        </button>
        <h2>Забронировать столик</h2>
        {error && <p className={styles.errorMessage}>{error}</p>} {/* Отображение ошибки */}
        {message && <p className={styles.successMessage}>{message}</p>} {/* Отображение сообщения об успехе */}
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
              <option value="">-- Выберите зал --</option> {/* Пустая опция для обязательного выбора */}
              <option value="second_hall">Второй зал внутри (до 20 человек)</option>
              <option value="summer_terrace">Летник (до 10 человек)</option>
              {/* Если у тебя есть другие залы, добавь их здесь, например: */}
              {/* <option value="main_hall">Главный зал</option> */}
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