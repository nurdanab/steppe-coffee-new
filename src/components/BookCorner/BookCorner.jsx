import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom'; // <-- Добавляем Link для кнопки "Увидеть больше"
import styles from './BookCorner.module.scss';
import bookCornerData from '../../data/bookCornerData.json';
import { supabase } from '../../supabaseClient'; // <-- Импортируем supabase клиент

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


  const [currentCalendarDate] = useState(new Date()); // Это для недельного календаря, который у тебя уже есть
  const todayDate = new Date(); // Сегодняшняя дата

  const getWeekDates = (date) => {
    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    // Для Monday-first week: 0 (Вс) -> 6, 1 (Пн) -> 0, ..., 6 (Сб) -> 5
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentCalendarDate);

  const isSameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const dayNamesShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getFormattedCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formattedEventDate = getFormattedCurrentDate();

  // --- НОВОЕ: Состояние для событий за сегодня ---
  const [todayEvents, setTodayEvents] = useState([]);
  const [todayEventsLoading, setTodayEventsLoading] = useState(true);
  const [todayEventsError, setTodayEventsError] = useState(null);

  // --- НОВОЕ: Функция для получения событий за сегодня ---
  useEffect(() => {
    const fetchTodayEvents = async () => {
      setTodayEventsLoading(true);
      setTodayEventsError(null);
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayFormatted = `${year}-${month}-${day}`; // Формат YYYY-MM-DD для запроса

        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, status, organizer_name') // Выбираем нужные поля
          .eq('booking_date', todayFormatted) // Фильтруем по сегодняшней дате
          .eq('status', 'confirmed') // Только подтвержденные события (можно изменить)
          .order('start_time', { ascending: true }); // Сортируем по времени начала

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
  }, []); // Запускаем один раз при монтировании

  return (
    <section ref={ref} className={`${styles.bookCornerSection} ${inView ? styles.visible : ''}`}>
      <div className={styles.bookCornerContent}>
        {/* Желтая часть */}
        <div className={styles.yellowPart}>
          <div className={styles.yellowPartInner}>
            <div className={styles.yellowPartTextContent}>
              <h2 className={styles.yellowPartTitle}>{bookCornerData.yellowPart.title}</h2>
              <p className={styles.yellowPartDescription}>{bookCornerData.yellowPart.description}</p>
              <button className={styles.yellowPartButton}>{bookCornerData.yellowPart.buttonText}</button>
            </div>
            <img
              src={bookCornerData.yellowPart.decorImage}
              alt="Декоративный элемент книжного уголка"
              className={styles.yellowPartDecor}
            />
          </div>

          <div className={styles.bookShelfSection}>
            <h3 className={styles.bookShelfSubtitle}>{bookCornerData.bookShelf.subtitle}</h3>
            <div className={styles.bookShelfCarousel}>
              <button
                className={`${styles.carouselButton} ${styles.leftButton} ${!canScrollLeft ? styles.disabled : ''}`}
                onClick={() => scrollShelf(-booksToScroll)}
                disabled={!canScrollLeft}
              >
                <img src="/images/left-vis.png" alt="Прокрутить влево" />
              </button>
              <div className={styles.booksContainer} ref={shelfRef}>
                {bookCornerData.bookShelf.books.map(book => (
                  <div key={book.id} className={styles.bookCard}>
                    <img src={book.coverImage} alt={book.title} className={styles.bookCover} />
                    <p className={styles.bookTitle}>{book.title}</p>
                    <p className={styles.bookAuthor}>{book.author}</p>
                  </div>
                ))}
              </div>
              <button
                className={`${styles.carouselButton} ${styles.rightButton} ${!canScrollRight ? styles.disabled : ''}`}
                onClick={() => scrollShelf(booksToScroll)}
                disabled={!canScrollRight}
              >
                <img src="/images/right-vis.png" alt="Прокрутить вправо" />
              </button>
            </div>
          </div>
        </div>

        {/* Главная открытая книга */}
        <div className={styles.mainBookContainer}>
          <img
            src={bookCornerData.mainBook.imageSrc}
            alt="Открытая книга"
            className={styles.mainBookImage}
          />
          <div className={styles.bookStampContainer} style={{
            top: `${bookCornerData.mainBook.stampOffset.top}%`,
            right: `${bookCornerData.mainBook.stampOffset.right}%`,
            transform: `rotate(${bookCornerData.mainBook.stampOffset.rotate || '0deg'})`
          }}>
            <p className={styles.textAboveStamp}>{bookCornerData.mainBook.textAboveStamp}</p>
            <img
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
                  const isToday = isSameDay(dateObj, todayDate);
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
                      {event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}
                    </p>
                    <p className={styles.todayEventTitle}>
                      {event.organizer_name ? `Бронь: ${event.organizer_name}` : 'Забронировано'}
                    </p>
                    {/* Если нужно показать статус или другие детали */}
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