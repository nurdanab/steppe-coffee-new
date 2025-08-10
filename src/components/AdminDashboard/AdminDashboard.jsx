// src/components/AdminDashboard/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './AdminDashboard.module.scss';
import { useNavigate } from 'react-router-dom';
import BookingEditModal from './BookingEditModal';

const AdminDashboard = ({ session }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState({ field: 'booking_date', order: 'desc' });
  const [isAdmin, setIsAdmin] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState(null);

  const navigate = useNavigate();

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

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('bookings').select('*');

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (searchTerm) {
        query = query.or(`organizer_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy.field, { ascending: sortBy.order === 'asc' });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }
      setBookings(data);
    } catch (err) {
      console.error('Ошибка при загрузке бронирований:', err.message);
      setError('Не удалось загрузить бронирования. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm, sortBy]);

  useEffect(() => {
    const checkAdminAccess = async () => {
      setLoading(true);
      if (!session) {
        setError("Пожалуйста, войдите в систему.");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          setError("У вас нет прав для доступа к этой панели. Только администраторы могут просматривать эту страницу.");
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        fetchBookings();
      } catch (err) {
        console.error("Ошибка проверки прав администратора:", err.message);
        setError("Ошибка авторизации. Пожалуйста, попробуйте позже.");
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [session, fetchBookings, navigate]);
  
  // Новый блок кода для подписки на изменения в реальном времени
  useEffect(() => {
    if (isAdmin) {
      console.log("Подписываемся на изменения в таблице 'bookings'...");
      const channel = supabase.channel('realtime:public:bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          (payload) => {
            console.log('Изменение получено!', payload);
            fetchBookings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        console.log("Отписываемся от канала 'realtime:public:bookings'");
      };
    }
  }, [isAdmin, fetchBookings]);
  // Конец нового блока

  const handleStatusChange = async (id, newStatus) => {
    try {
      const currentBooking = bookings.find(b => b.id === id);
      if (!currentBooking) {
        console.error('Бронирование не найдено для обновления статуса.');
        return;
      }

      const { data, error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select();

      if (updateError) {
        throw updateError;
      }

      const telegramMessage = `
        <b>Изменение статуса бронирования:</b>
        #ID: <code>${currentBooking.id.substring(0, 8)}</code>
        <b>Статус:</b> ${newStatus === 'confirmed' ? '✅ Подтверждено' : newStatus === 'pending' ? '⏳ В ожидании' : '❌ Отменено'}
        <b>Дата:</b> ${new Date(currentBooking.booking_date).toLocaleDateString('ru-RU')}
        <b>Время:</b> ${currentBooking.start_time.substring(0, 5)} - ${currentBooking.end_time.substring(0, 5)}
        <b>Зал:</b> ${getRoomName(currentBooking.selected_room)}
        <b>Организатор:</b> ${currentBooking.organizer_name}
        <b>Телефон:</b> ${currentBooking.phone_number}
        <b>Комментарий:</b> ${currentBooking.comments || 'Нет'}
      `;

      try {
        const { data, error: telegramError } = await supabase.functions.invoke('telegram-notification', {
          body: { message: telegramMessage },
        });

        if (telegramError) {
          console.error('Ошибка отправки уведомления в Telegram:', telegramError);
        } else {
          console.log('Уведомление в Telegram успешно отправлено:', data);
        }
      } catch (err) {
        console.error('Ошибка вызова Telegram Edge Function:', err);
      }
    } catch (err) {
      console.error('Ошибка при изменении статуса:', err.message);
      alert('Ошибка при изменении статуса: ' + err.message);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это бронирование?')) {
      try {
        const currentBooking = bookings.find(b => b.id === id);
        if (!currentBooking) {
          console.error('Бронирование не найдено для удаления.');
          return;
        }

        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw deleteError;
        }

        const telegramMessage = `
          <b>Бронирование удалено:</b>
          #ID: <code>${currentBooking.id.substring(0, 8)}</code>
          <b>Дата:</b> ${new Date(currentBooking.booking_date).toLocaleDateString('ru-RU')}
          <b>Время:</b> ${currentBooking.start_time.substring(0, 5)} - ${currentBooking.end_time.substring(0, 5)}
          <b>Зал:</b> ${getRoomName(currentBooking.selected_room)}
          <b>Организатор:</b> ${currentBooking.organizer_name}
          <b>Телефон:</b> ${currentBooking.phone_number}
          <b>Комментарий:</b> ${currentBooking.comments || 'Нет'}
        `;

        try {
          const { data, error: telegramError } = await supabase.functions.invoke('telegram-notification', {
            body: { message: telegramMessage },
          });

          if (telegramError) {
            console.error('Ошибка отправки уведомления об удалении в Telegram:', telegramError);
          } else {
            console.log('Уведомление об удалении в Telegram успешно отправлено:', data);
          }
        } catch (err) {
          console.error('Ошибка вызова Telegram Edge Function при удалении:', err);
        }
      } catch (err) {
        console.error('Ошибка при удалении бронирования:', err.message);
        alert('Ошибка при удалении бронирования: ' + err.message);
      }
    }
  };

  const openEditModal = (booking) => {
    setBookingToEdit(booking);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setBookingToEdit(null);
  };

  const handleBookingUpdated = () => {
    fetchBookings();
  };

  if (!isAdmin) {
    return (
      <main className={styles.adminDashboard}>
        <div className={styles.authRequired}>
          <h2 className={styles.title}>Доступ запрещен</h2>
          <p>{error || "У вас нет прав для доступа к этой панели. Пожалуйста, войдите с учетной записью администратора."}</p>
          {!session && <button className={styles.loginButton} onClick={() => navigate('/login')}>Войти</button>}
        </div>
      </main>
    );
  }

  if (loading && bookings.length === 0) {
    return (
      <main className={styles.adminDashboard}>
        <p className={styles.loadingMessage}>Загрузка бронирований...</p>
      </main>
    );
  }

  if (error && isAdmin) {
    return (
      <main className={styles.adminDashboard}>
        <p className={styles.errorMessage}>{error}</p>
      </main>
    );
  }

  return (
    <main className={styles.adminDashboard}>
                <div className="container"> 

      <h1 className={styles.title}>Панель управления бронированиями</h1>

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <label htmlFor="filterStatus">Статус:</label>
          <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Все</option>
            <option value="pending">В ожидании</option>
            <option value="confirmed">Подтверждено</option>
            <option value="cancelled">Отменено</option>
          </select>
        </div>

        <div className={styles.searchGroup}>
          <label htmlFor="searchTerm">Поиск:</label>
          <input
            type="text"
            id="searchTerm"
            placeholder="Имя или телефон"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.sortGroup}>
          <label htmlFor="sortByField">Сортировать по:</label>
          <select
            id="sortByField"
            value={sortBy.field}
            onChange={(e) => setSortBy({ ...sortBy, field: e.target.value })}
          >
            <option value="booking_date">Дата</option>
            <option value="start_time">Время начала</option>
            <option value="status">Статус</option>
            <option value="num_people">Кол-во человек</option>
          </select>
          <button
            onClick={() => setSortBy({ ...sortBy, order: sortBy.order === 'asc' ? 'desc' : 'asc' })}
            className={styles.sortOrderButton}
          >
            {sortBy.order === 'asc' ? 'ASC ↑' : 'DESC ↓'}
          </button>
        </div>
      </div>

      {bookings.length === 0 && !loading ? (
        <p className={styles.noBookingsMessage}>Бронирования не найдены.</p>
      ) : (
        <div className={styles.bookingsTableContainer}>
          <table className={styles.bookingsTable}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Время</th>
                <th>Зал</th>
                <th>Человек</th>
                <th>Организатор</th>
                <th>Телефон</th>
                <th>Комментарий</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className={styles[booking.status]}>
                  <td>{new Date(booking.booking_date).toLocaleDateString('ru-RU')}</td>
                  <td>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</td>
                  <td>{getRoomName(booking.selected_room)}</td>
                  <td>{booking.num_people}</td>
                  <td>{booking.organizer_name}</td>
                  <td>{booking.phone_number}</td>
                  <td>{booking.comments || 'Нет'}</td>
                  <td>
                    <select
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="pending">В ожидании</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(booking)} className={styles.editButton}>
                      Редактировать
                    </button>
                    <button onClick={() => handleDeleteBooking(booking.id)} className={styles.deleteButton}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BookingEditModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        bookingToEdit={bookingToEdit}
        onBookingUpdated={handleBookingUpdated}
      />
      </div>
    </main>
  );
};

export default AdminDashboard;