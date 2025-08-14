// src/components/PublicCalendar/PublicCalendar.jsx
import React, { useEffect, useState } from 'react';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import '../../styles/fullcalendar-custom.scss';

import EventSection from './EventSection.jsx'; 
import { supabase } from '../../supabaseClient';  
import styles from './PublicCalendar.module.scss';
import { DateTime } from 'luxon';  
import EventModal from './EventModal.jsx';

function PublicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
            title: `${booking.organizer_name} - ${booking.event_name}`,
            start: startDateTime.toISO(),
            end: endDateTime.toISO(),
            className: `event-${booking.selected_room}`, 
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

  const openModal = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className={styles.publicCalendarWrapper}>  
      <div className="container"> 
        <div className={styles.calendarContainer}> 
          <h1 className={styles.calendarTitle}>Общее расписание бронирований</h1>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            // initialView="timeGridWeek" 
            // headerToolbar={{
            //   left: 'prev,next today',
            //   center: 'title',
            //   right: 'dayGridMonth,timeGridWeek,timeGridDay'
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridDay'
            }}
            events={events}
            slotMinTime="08:00:00"
            slotMaxTime="23:00:00"
            locale="ru"  
            height="auto" 
           
            eventClick={(info) => {
              openModal(info.event); // 👈 Теперь клик открывает наше модальное окно
            }}
            // eventClick={(info) => {
            //   const eventProps = info.event.extendedProps;
            //   const startStr = DateTime.fromISO(info.event.startStr, { zone: 'Asia/Almaty' });
            //   const endStr = DateTime.fromISO(info.event.endStr, { zone: 'Asia/Almaty' });

            //   alert(
            //     `Название события: ${eventProps.eventName || 'Не указано'}\n` +
            //     `Описание события: ${eventProps.eventDescription || 'Не указано'}\n` +
            //     `Контакт для связи: ${eventProps.organizerContact || 'Не указано'}\n` +
            //     `Дата: ${startStr.toFormat('dd.MM.yyyy')}\n` +
            //     `Время: ${startStr.toFormat('HH:mm')} - ${endStr.toFormat('HH:mm')}`
            //   );
            // }}
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
      <EventSection />
      {selectedEvent && <EventModal event={selectedEvent} onClose={closeModal} />}

    </div>
  );
}

export default PublicCalendar;