import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom'; 
import styles from './BookCorner.module.scss';
import bookCornerData from '../../data/bookCornerData.json';
import { supabase } from '../../supabaseClient'; 
import LazyImage from '../LazyImage/LazyImage.jsx';
import { DateTime } from 'luxon';

const BookCorner = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const shelfRef = useRef(null);

  const booksToScroll = 1;

  const totalBooks = bookCornerData.bookShelf.books.length;
  const canScrollLeft = currentBookIndex > 0;
  const canScrollRight = currentBookIndex < totalBooks - booksToScroll;

  const scrollShelf = (direction) => {
    const newIndex = currentBookIndex + direction;
    if (newIndex >= 0 && newIndex <= totalBooks - booksToScroll) {
      setCurrentBookIndex(newIndex);
    } else if (newIndex < 0) {
        setCurrentBookIndex(0);
    } else if (newIndex > totalBooks - booksToScroll) {
        setCurrentBookIndex(totalBooks - booksToScroll);
    }
  };

  useEffect(() => {
    if (shelfRef.current) {
      const firstBookCard = shelfRef.current.children[0];
      if (firstBookCard) {
        const bookWidth = firstBookCard.offsetWidth;
        const computedStyle = window.getComputedStyle(shelfRef.current);
        const gapValue = parseFloat(computedStyle.getPropertyValue('gap'));
        
        const scrollAmount = bookWidth + gapValue;
        
        shelfRef.current.scrollLeft = currentBookIndex * scrollAmount;
      }
    }
  }, [currentBookIndex]);


  // ✨ ИСПРАВЛЕНИЕ: Используем Luxon для работы с датами в Алматы.
  const todayAlmaty = useMemo(() => DateTime.now().setZone('Asia/Almaty'), []);
  const [currentCalendarDate] = useState(todayAlmaty.toJSDate());
  
  const getWeekDates = (date) => {
    const luxonDate = DateTime.fromJSDate(date, { zone: 'Asia/Almaty' });
    const dayOfWeek = luxonDate.weekday; // 1 (Пн) - 7 (Вс)
    const startOfWeek = luxonDate.minus({ days: dayOfWeek - 1 }).startOf('day');

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(startOfWeek.plus({ days: i }).toJSDate());
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentCalendarDate);

  const isSameDay = (d1, d2) => {
    const luxonD1 = DateTime.fromJSDate(d1, { zone: 'Asia/Almaty' });
    const luxonD2 = DateTime.fromJSDate(d2, { zone: 'Asia/Almaty' });
    return luxonD1.hasSame(luxonD2, 'day');
  };

  const dayNamesShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getFormattedCurrentDate = () => {
    // ✨ ИСПРАВЛЕНИЕ: Получаем текущую дату в зоне Алматы и форматируем ее.
    const today = DateTime.now().setZone('Asia/Almaty');
    return today.toFormat('dd.MM.yyyy');
  };

  const formattedEventDate = getFormattedCurrentDate();

   const [todayEvents, setTodayEvents] = useState([]);
  const [todayEventsLoading, setTodayEventsLoading] = useState(true);
  const [todayEventsError, setTodayEventsError] = useState(null);

   useEffect(() => {
    const fetchTodayEvents = async () => {
      setTodayEventsLoading(true);
      setTodayEventsError(null);
      try {
        // ✨ ИСПРАВЛЕНИЕ: Получаем текущую дату в зоне Алматы и форматируем ее для запроса.
        const todayAlmatyFormatted = DateTime.now().setZone('Asia/Almaty').toISODate();

        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, status, organizer_name') 
          .eq('booking_date', todayAlmatyFormatted)  
          .eq('status', 'confirmed') 
          .order('start_time', { ascending: true }); 

        if (error) {
          throw error;
        }
        setTodayEvents(data);
      } catch (err) {
        console.error('Ошибка при получении сегодняшних событий:', err.message);
        setTodayEventsError('Не удалось загрузить события за сегодня.');
      } finally {
        setTodayEventsLoading(false);
      }
    };

    fetchTodayEvents();
  }, []); 

  // ✨ ИСПРАВЛЕНИЕ: Внутри todayEvents.map используем Luxon для корректного форматирования времени.
  const formatTime = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const [activeTooltip, setActiveTooltip] = useState(null);
  return (
    <section ref={ref} className={`${styles.bookCornerSection} ${inView ? styles.visible : ''}`}>
      <div className={styles.bookCornerContent}>
        {/* Желтая часть */}
        <div className={styles.yellowPart}>
          <div className={styles.yellowPartInner}>
          <div className="container"> 

            <div className={styles.yellowPartTextContent}>
              <h2 className={styles.yellowPartTitle}>{bookCornerData.yellowPart.title}</h2>
              <p className={styles.yellowPartDescription}>{bookCornerData.yellowPart.description}</p>
              <Link to="/events" className={styles.yellowPartButton}> 
                {bookCornerData.yellowPart.buttonText}
              </Link>
            </div>            
            </div>

           
          </div>
          <LazyImage 
              src={bookCornerData.yellowPart.decorImage}
              alt="Декоративный элемент книжного уголка"
              className={styles.yellowPartDecor}
            />
          <div className="container"> 

          <div className={styles.bookShelfSection}>
            <h3 className={styles.bookShelfSubtitle}>{bookCornerData.bookShelf.subtitle}</h3>          </div>

            <div className={styles.bookShelfCarousel}>
    <button
        className={`${styles.carouselButton} ${styles.leftButton} ${!canScrollLeft ? styles.disabled : ''}`}
        onClick={() => scrollShelf(-booksToScroll)}
        disabled={!canScrollLeft}
    >
        <LazyImage  src="/images/left-vis.png" alt="Прокрутить влево" />
    </button>
    <div className={styles.booksContainer} ref={shelfRef}>
        {bookCornerData.bookShelf.books.map(book => (
            <div 
                key={book.id} 
                className={styles.bookCard}
            >
                <LazyImage  src={book.coverImage} alt={book.title} className={styles.bookCover} />
                <p className={styles.bookTitle}>{book.title}</p>
                <p className={styles.bookAuthor}>{book.author}</p>
                
                 <div className={styles.bookTooltip}>
                    <p>{book.description}</p>
                </div>
            </div>
        ))}
    </div>
    <button
        className={`${styles.carouselButton} ${styles.rightButton} ${!canScrollRight ? styles.disabled : ''}`}
        onClick={() => scrollShelf(booksToScroll)}
        disabled={!canScrollRight}
    >
        <LazyImage  src="/images/right-vis.png" alt="Прокрутить вправо" />
    </button>
</div>

            
          </div>
        </div>

        {/* Главная открытая книга */}
        <div className={styles.mainBookContainer}>
          <div 
            className={styles.mainBookImageWrapper}
            onMouseEnter={() => bookCornerData.mainBook.description && setActiveTooltip('mainBook')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {bookCornerData.mainBook.pdfFile ? (
              <a 
                href={bookCornerData.mainBook.pdfFile} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <LazyImage 
                  src={bookCornerData.mainBook.imageSrc}
                  alt="Открытая книга"
                  className={styles.mainBookImage}
                />
              </a>
            ) : (
              <LazyImage 
                src={bookCornerData.mainBook.imageSrc}
                alt="Открытая книга"
                className={styles.mainBookImage}
              />
            )}

             {activeTooltip === 'mainBook' && (
              <div className={styles.bookTooltip}>
                <p>{bookCornerData.mainBook.description}</p>
              </div>
            )}
          </div>
          <div className={styles.bookStampContainer} style={{
            top: `${bookCornerData.mainBook.stampOffset.top}%`,
            right: `${bookCornerData.mainBook.stampOffset.right}%`,
            transform: `rotate(${bookCornerData.mainBook.stampOffset.rotate || '0deg'})`
          }}>
            <p className={styles.textAboveStamp}>{bookCornerData.mainBook.textAboveStamp}</p>
            <LazyImage 
              src={bookCornerData.mainBook.stampImage}
              alt="Печать"
              className={styles.bookStampImage}
            />
          </div>
        </div>

        {/* Белая часть */}
        <div className={styles.whitePart}>
          <h3 className={styles.whitePartPlaceholder}></h3>

          {/* Блок "Ближайшие события" */}
          <div className={styles.eventsBlock}>
            <h3 className={styles.eventsSubtitle}>{bookCornerData.eventsSection.subtitle}</h3>
            <div className={styles.eventsCalendar}>
              {/* Дни недели */}
              <div className={styles.calendarDays}>
                {dayNamesShort.map((dayName, index) => (
                  <span key={index}>{dayName}</span>
                ))}
              </div>
              {/* Даты */}
              <div className={styles.calendarDates}>
                {weekDates.map((dateObj, index) => {
                  const isToday = isSameDay(dateObj, todayAlmaty.toJSDate());
                  const currentDay = dateObj.getDay();
                  const isWeekend = currentDay === 0 || currentDay === 6;

                  return (
                    <span
                      key={index}
                      className={`${isToday ? styles.todayDate : ''} ${isWeekend ? styles.weekendDay : ''}`}
                    >
                      {dateObj.getDate()}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className={styles.eventDate}>{formattedEventDate}</p>

             <div className={styles.eventList}>
              {todayEventsLoading ? (
                <p className={styles.emptyEventsMessage}>Загрузка событий...</p>
              ) : todayEventsError ? (
                <p className={styles.emptyEventsMessage} style={{ color: 'red' }}>{todayEventsError}</p>
              ) : todayEvents.length > 0 ? (
                todayEvents.map(event => (
                  <div key={event.id} className={styles.todayEventItem}> {/* Добавим стили для этого */}
                    <p className={styles.todayEventTime}>
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                    <p className={styles.todayEventTitle}>
                      {event.organizer_name ? `Бронь: ${event.organizer_name}` : 'Забронировано'}
                    </p>
                  </div>
                ))
              ) : (
                <p className={styles.emptyEventsMessage}>{bookCornerData.eventsSection.emptyMessage}</p>
              )}
            </div>

            <div className={styles.viewMoreButton}>
              <Link to="/events" className={styles.viewMoreLink}> 
                {bookCornerData.eventsSection.viewMoreButtonText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookCorner;