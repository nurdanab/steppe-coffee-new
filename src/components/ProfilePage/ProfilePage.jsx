// src/components/ProfilePage/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient'; 
import styles from './ProfilePage.module.scss'; 

const ProfilePage = ({ session, isAuthModalOpen, onOpenAuthModal, onCloseAuthModal, onAuthSuccess, onLogout }) => {
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorBookings, setErrorBookings] = useState(null);

  useEffect(() => {
    if (!session) {
      // Это условие будет срабатывать, если пользователь не авторизован.
      // onOpenAuthModal() вызывается для отображения модального окна аутентификации.
      if (!isAuthModalOpen) { // Проверяем, что модальное окно еще не открыто
        onOpenAuthModal();
      }
      return; 
    }

    const fetchUserBookings = async () => {
      setLoadingBookings(true);
      setErrorBookings(null);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, selected_room, status, comments') // Добавил selected_room
          .eq('user_id', session.user.id) 
          .order('booking_date', { ascending: false }) 
          .order('start_time', { ascending: false });

        if (error) {
          throw error;
        }
        setUserBookings(data);
      } catch (err) {
        console.error('Ошибка при загрузке бронирований пользователя:', err.message);
        setErrorBookings('Не удалось загрузить историю бронирований.');
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchUserBookings();
  }, [session, onOpenAuthModal, isAuthModalOpen]); // Добавил isAuthModalOpen в зависимости, чтобы избежать повторных вызовов

  // Определение функции для получения имени зала
  const getRoomName = (roomKey) => {
    switch (roomKey) {
      case 'second_hall':
        return 'Второй зал';
      case 'summer_terrace':
        return 'Летняя терраса';
      default:
        return 'Неизвестный зал';
    }
  };


  if (!session) {
    return (
      <main className={styles.profilePage}>
        <div className={styles.notLoggedInMessage}>
          <h2>Для просмотра профиля необходимо войти</h2>
          <p>Пожалуйста, войдите или зарегистрируйтесь, чтобы получить доступ к истории бронирований.</p>
          {!isAuthModalOpen && ( // Отображаем кнопку только если модальное окно не открыто
            <button onClick={onOpenAuthModal} className={styles.loginButton}>Войти / Зарегистрироваться</button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <h1>Привет, {session.user.email}!</h1>
        <button onClick={onLogout} className={styles.logoutButton}>
          Выйти
        </button>
      </div>

      <section className={styles.bookingHistory}>
        <h2>История моих бронирований</h2>
        {loadingBookings ? (
          <p className={styles.noBookingsMessage}>Загрузка истории бронирований...</p> // Применяем стиль
        ) : errorBookings ? (
          <p className={styles.errorMessage}>{errorBookings}</p>
        ) : userBookings.length === 0 ? (
          <p className={styles.noBookingsMessage}>У вас пока нет бронирований.</p> // Применяем новый класс
        ) : (
          <div className={styles.bookingsList}>
            {userBookings.map(booking => (
              <div key={booking.id} className={styles.bookingItem}>
                <p className={styles.bookingDate}>
                  Дата: {new Date(booking.booking_date).toLocaleDateString('ru-RU')}
                </p>
                <p className={styles.bookingTime}>
                  Время: {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                </p>
                <p className={styles.bookingRoom}>
                  Зал: {getRoomName(booking.selected_room)} {/* Используем функцию для получения имени зала */}
                </p>
                <p className={styles.bookingStatus}>
                  Статус: <span className={styles[booking.status]}>{booking.status === 'confirmed' ? 'Подтверждено' : booking.status === 'pending' ? 'В ожидании' : 'Отменено'}</span>
                </p>
                {booking.comments && <p className={styles.bookingComments}>Комментарий: {booking.comments}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;