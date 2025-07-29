// src/components/PublicCalendar.jsx

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { fetchAllBookings } from '../supabaseClient'; 

function PublicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const bookings = await fetchAllBookings();

        const calendarEvents = bookings.map(booking => ({
          id: booking.id,
          title: `Занято: ${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`,
          start: `${booking.booking_date}T${booking.start_time}`,
          end: `${booking.booking_date}T${booking.end_time}`,
          backgroundColor: booking.status === 'confirmed' ? '#28a745' : '#ffc107',
          borderColor: booking.status === 'confirmed' ? '#28a745' : '#ffc107',
          extendedProps: {
            numPeople: booking.num_people,
            organizerName: booking.organizer_name,
            comments: booking.comments,
            status: booking.status,
          }
        }));
        setEvents(calendarEvents);
      } catch (err) {
        console.error("Не удалось загрузить бронирования для календаря:", err);
        setError("Не удалось загрузить расписание. Попробуйте позже.");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  if (loading) {
    return <p>Загрузка расписания...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Ошибка: {error}</p>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Общее расписание бронирований</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        slotMinTime="08:00:00"
        slotMaxTime="23:00:00"
        locale="ru"
        height="auto"
        eventClick={(info) => {
          alert(`Бронирование: ${info.event.title}\n` +
                `С ${info.event.startStr.substring(11, 16)} по ${info.event.endStr.substring(11, 16)}\n` +
                `Статус: ${info.event.extendedProps.status}`);
        }}
      />
    </div>
  );
}

export default PublicCalendar;