// src/components/PublicCalendar/PublicCalendar.jsx

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventSection from './EventSection.jsx'; // Импортируем компонент EventSection
import { supabase } from '../../supabaseClient';  
import styles from './PublicCalendar.module.scss';
import { DateTime } from 'luxon';  

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
          .select('id, booking_date, start_time, end_time, selected_room, status, organizer_name, comments, event_name, event_description, organizer_contact')
          .eq('status', 'confirmed')
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          throw error;
        }

        const calendarEvents = data.map(booking => {
           const startDateTime = DateTime.fromISO(`${booking.booking_date}T${booking.start_time}`, { zone: 'Asia/Almaty' });
          const endDateTime = DateTime.fromISO(`${booking.booking_date}T${booking.end_time}`, { zone: 'Asia/Almaty' });

          return {
            id: booking.id,
            title: `Занято (${booking.selected_room === 'second_hall' ? 'Второй зал' : 'Летник'}): ${startDateTime.toFormat('HH:mm')} - ${endDateTime.toFormat('HH:mm')}`,
            start: startDateTime.toISO(),
            end: endDateTime.toISO(),
            backgroundColor: '#FDE515', 
            borderColor: '#ED9354',
            extendedProps: {
              numPeople: booking.num_people,
              organizerName: booking.organizer_name,
              comments: booking.comments,
              status: booking.status,
              selectedRoom: booking.selected_room,
              eventName: booking.event_name,
              eventDescription: booking.event_description,
              organizerContact: booking.organizer_contact,
            }
          };
        });
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
    return <p className={styles.loadingMessage}>Загрузка расписания...</p>; 
  }

  if (error) {
    return <p className={styles.errorMessage}>Ошибка: {error}</p>;   
  }

  return (
    <div className={styles.publicCalendarWrapper}>  
      <div className="container"> 
        <div className={styles.calendarContainer}> 
          <h1 className={styles.calendarTitle}>Общее расписание бронирований</h1>
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
            className={styles.fc} 
            eventClick={(info) => {
              const eventProps = info.event.extendedProps;
              const startStr = DateTime.fromISO(info.event.startStr, { zone: 'Asia/Almaty' });
              const endStr = DateTime.fromISO(info.event.endStr, { zone: 'Asia/Almaty' });

              alert(
                `Название события: ${eventProps.eventName || 'Не указано'}\n` +
                `Описание события: ${eventProps.eventDescription || 'Не указано'}\n` +
                `Контакт для связи: ${eventProps.organizerContact || 'Не указано'}\n` +
                `Дата: ${startStr.toFormat('dd.MM.yyyy')}\n` +
                `Время: ${startStr.toFormat('HH:mm')} - ${endStr.toFormat('HH:mm')}`
              );
            }}
            allDaySlot={false} 
            nowIndicator={true} 
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
      {/* Добавляем компонент EventSection здесь, после календаря */}
      <EventSection />
    </div>
  );
}

export default PublicCalendar;