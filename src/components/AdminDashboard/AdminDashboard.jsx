// src/components/AdminDashboard/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import styles from './AdminDashboard.module.scss';

const AdminDashboard = ({ session }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'confirmed', 'cancelled'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState({ field: 'booking_date', order: 'desc' }); // 'asc' or 'desc'

  // Функция для получения имени зала
  const getRoomName = (roomKey) => {
    switch (roomKey) {
      case 'second_hall':
        return 'Второй зал внутри';
      case 'summer_terrace':
        return 'Летняя терраса';
      default:
        return 'Неизвестный зал';
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('bookings').select('*');

      // Фильтрация по статусу
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Поиск по имени организатора или телефону
      if (searchTerm) {
        query = query.or(`organizer_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
      }

      // Сортировка
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
    // В реальном приложении здесь нужна проверка прав администратора
    // Например, если session.user.app_metadata.role !== 'admin'
    // if (!session || session.user.app_metadata.role !== 'admin') {
    //   setError("У вас нет прав для доступа к этой панели.");
    //   setLoading(false);
    //   return;
    // }

    fetchBookings();
  }, [session, fetchBookings]);

  // Обработчики изменения статуса
  const handleStatusChange = async (id, newStatus) => {
    setLoading(true); // Можно использовать отдельный стейт для загрузки отдельного элемента
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }
      // Обновляем список бронирований после изменения статуса
      fetchBookings();
    } catch (err) {
      console.error('Ошибка при изменении статуса:', err.message);
      alert('Ошибка при изменении статуса: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления бронирования
  const handleDeleteBooking = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это бронирование?')) {
      setLoading(true);
      try {
        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw deleteError;
        }
        fetchBookings(); // Обновляем список
      } catch (err) {
        console.error('Ошибка при удалении бронирования:', err.message);
        alert('Ошибка при удалении бронирования: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!session) {
    return (
      <main className={styles.adminDashboard}>
        <div className={styles.authRequired}>
          <h2 className={styles.title}>Доступ запрещен</h2>
          <p>Пожалуйста, войдите в систему с учетной записью администратора.</p>
          {/* Здесь можно добавить кнопку или ссылку на страницу входа */}
        </div>
      </main>
    );
  }

  if (loading && bookings.length === 0) { // Показывать "Загрузка" только если нет данных
    return (
      <main className={styles.adminDashboard}>
        <p className={styles.loadingMessage}>Загрузка бронирований...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.adminDashboard}>
        <p className={styles.errorMessage}>{error}</p>
      </main>
    );
  }

  return (
    <main className={styles.adminDashboard}>
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

      {bookings.length === 0 ? (
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
                      disabled={loading}
                      className={styles.statusSelect}
                    >
                      <option value="pending">В ожидании</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </td>
                  <td>
                    {/* Кнопка редактирования будет реализована позже с модальным окном */}
                    {/* <button className={styles.editButton}>Редактировать</button> */}
                    <button onClick={() => handleDeleteBooking(booking.id)} className={styles.deleteButton} disabled={loading}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;