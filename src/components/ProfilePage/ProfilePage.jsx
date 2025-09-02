// src/components/ProfilePage/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient'; 
import styles from './ProfilePage.module.scss'; 
import { useNavigate } from 'react-router-dom';
import WhatsAppFeedback from './WhatsAppFeedback';
import { DateTime } from 'luxon'; // ДОБАВИТЬ ИМПОРТ

const ProfilePage = ({ session, onLogout }) => {
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorBookings, setErrorBookings] = useState(null);
  const navigate = useNavigate();

  const TIME_ZONE = 'Asia/Almaty'; // ДОБАВИТЬ КОНСТАНТУ

  useEffect(() => {
    if (!session) {
      return; 
    }

    const fetchUserBookings = async () => {
      setLoadingBookings(true);
      setErrorBookings(null);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, selected_room, status, comments') 
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
  }, [session]); 

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

  // ДОБАВИТЬ ФУНКЦИЮ ДЛЯ КОНВЕРТАЦИИ ВРЕМЕНИ
  const formatBookingTime = (booking) => {
    try {
      // Парсим UTC время из БД и конвертируем в локальную зону
      const startTime = DateTime.fromISO(`${booking.booking_date}T${booking.start_time}`).setZone(TIME_ZONE);
      const endTime = DateTime.fromISO(`${booking.booking_date}T${booking.end_time}`).setZone(TIME_ZONE);
      
      return `${startTime.toFormat('HH:mm')} - ${endTime.toFormat('HH:mm')}`;
    } catch (error) {
      console.error('Ошибка при форматировании времени:', error);
      // Fallback на старый способ отображения
      return `${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`;
    }
  };

  const handleChangePassword = () => {
    navigate('/update-password');
  };

  if (!session) {
    return (
      <main className={styles.profilePage}>
        <div className="container">
          <div className={styles.notLoggedInMessage}>
            <p>Для просмотра профиля необходимо войти.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.profilePage}>
      <div className="container">
        <div className={styles.profileHeader}>
          <h1>Добро пожаловать!</h1>
          <div className={styles.profileActions}> 
            <button onClick={handleChangePassword} className={styles.changePasswordButton}>
              Сменить пароль
            </button>
            <button onClick={onLogout} className={styles.logoutButton}>
              Выйти
            </button>
          </div>
        </div>

        <section className={styles.bookingHistory}>
          <h2>История моих бронирований</h2>
          {loadingBookings ? (
            <p className={styles.noBookingsMessage}>Загрузка истории бронирований...</p> 
          ) : errorBookings ? (
            <p className={styles.errorMessage}>{errorBookings}</p>
          ) : userBookings.length === 0 ? (
            <p className={styles.noBookingsMessage}>У вас пока нет бронирований.</p>
          ) : (
            <div className={styles.bookingsList}>
              {userBookings.map(booking => (
                <div key={booking.id} className={styles.bookingItem}>
                  <p className={styles.bookingTitle}>Бронирование</p>
                  <p className={styles.bookingDate}>
                    Дата: {new Date(booking.booking_date).toLocaleDateString('ru-RU')}
                  </p>
                  <p className={styles.bookingTime}>
                    Время: {formatBookingTime(booking)}
                  </p>
                  <p className={styles.bookingRoom}>
                    Зал: {getRoomName(booking.selected_room)}
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
        <section className={styles.whatsappFeedbackSection}>
          <WhatsAppFeedback 
            phoneNumber="+77082591231"
            prefilledMessage={`Здравствуйте, у меня есть вопрос или отзыв.`} 
          />
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;