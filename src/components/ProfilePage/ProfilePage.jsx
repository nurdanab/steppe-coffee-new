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
      onOpenAuthModal();
      return; 
    }

    const fetchUserBookings = async () => {
      setLoadingBookings(true);
      setErrorBookings(null);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
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
  }, [session, onOpenAuthModal]); 

  if (!session) {
    return (
      <main className={styles.profilePage}>
        <div className={styles.notLoggedInMessage}>
          <h2>Для просмотра профиля необходимо войти</h2>
          <p>Пожалуйста, войдите или зарегистрируйтесь, чтобы получить доступ к истории бронирований.</p>
          {!isAuthModalOpen && (
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
          <p>Загрузка истории бронирований...</p>
        ) : errorBookings ? (
          <p className={styles.errorMessage}>{errorBookings}</p>
        ) : userBookings.length === 0 ? (
          <p>У вас пока нет бронирований.</p>
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