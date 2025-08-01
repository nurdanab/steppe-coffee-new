// src/components/PublicCalendar/PublicCalendar.jsx

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { supabase } from '../../supabaseClient'; // Убедись, что путь к supabaseClient правильный
import styles from './PublicCalendar.module.scss'; // Импортируем наш SCSS-модуль

function PublicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, selected_room, status, organizer_name, comments') // Добавил selected_room
          .eq('status', 'confirmed')
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          throw error;
        }

        const calendarEvents = data.map(booking => ({
          id: booking.id,
          title: `Занято (${booking.selected_room === 'second_hall' ? 'Второй зал' : 'Летник'}): ${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`, // Добавил название зала в заголовок события
          start: `${booking.booking_date}T${booking.start_time}`,
          end: `${booking.booking_date}T${booking.end_time}`,
          backgroundColor: '#28a745', // Зеленый цвет для подтвержденных бронирований
          borderColor: '#28a745',
          extendedProps: {
            numPeople: booking.num_people,
            organizerName: booking.organizer_name,
            comments: booking.comments,
            status: booking.status,
            selectedRoom: booking.selected_room, // Передаем название зала в extendedProps
          }
        }));
        setEvents(calendarEvents);
      } catch (err) {
        console.error("Не удалось загрузить события для календаря:", err);
        setError("Не удалось загрузить расписание. Попробуйте позже.");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  if (loading) {
    return <p className={styles.loadingMessage}>Загрузка расписания...</p>; // Применяем класс из SCSS
  }

  if (error) {
    return <p className={styles.errorMessage}>Ошибка: {error}</p>; // Применяем класс из SCSS
  }

  return (
    <div className={styles.publicCalendarWrapper}> {/* Используем обертку из SCSS */}
      <div className={styles.calendarContainer}> {/* Контейнер для календаря */}
        <h1 className={styles.calendarTitle}>Общее расписание бронирований</h1> {/* Применяем класс заголовка */}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek" // Начальный вид
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          locale="ru" // Устанавливаем русскую локаль
          height="auto" // Автоматическая высота календаря
          className={styles.fc} // Применяем общий класс для FullCalendar, если есть необходимость
          eventClick={(info) => {
            alert(`Бронирование: ${info.event.title}\n` +
                  `Дата: ${info.event.startStr.substring(0, 10)}\n` +
                  `Время: ${info.event.startStr.substring(11, 16)} - ${info.event.endStr.substring(11, 16)}\n` +
                  `Зал: ${info.event.extendedProps.selectedRoom === 'second_hall' ? 'Второй зал внутри' : 'Летняя терраса'}\n` + // Показываем название зала
                  `Статус: ${info.event.extendedProps.status}`);
          }}
          // Дополнительные опции FullCalendar
          allDaySlot={false} // Отключаем слот "Весь день"
          nowIndicator={true} // Индикатор текущего времени
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: false
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          dayHeaderFormat={{
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            omitZeroMinute: false
          }}
        />
      </div>
    </div>
  );
}

export default PublicCalendar;