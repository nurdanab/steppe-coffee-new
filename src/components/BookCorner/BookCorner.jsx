import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom'; 
import styles from './BookCorner.module.scss';
import bookCornerData from '../../data/bookCornerData.json';
import { supabase } from '../../supabaseClient'; 
import LazyImage from '../LazyImage/LazyImage.jsx';
import { DateTime } from 'luxon';

// SVG для стрелки "влево"
const LeftArrowSVG = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"/>
  </svg>
);

// SVG для стрелки "вправо"
const RightArrowSVG = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"/>
  </svg>
);


const BookCorner = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const shelfRef = useRef(null);
  
  const totalBooks = bookCornerData.bookShelf.books.length;

  // Рассчитываем, можно ли прокручивать, исходя из ширины контейнера и количества видимых книг
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = () => {
    if (shelfRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = shelfRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const scrollShelf = (direction) => {
    if (shelfRef.current) {
        const firstBookCard = shelfRef.current.children[0];
        if (firstBookCard) {
            const bookWidth = firstBookCard.offsetWidth;
            const computedStyle = window.getComputedStyle(shelfRef.current);
            const gapValue = parseFloat(computedStyle.getPropertyValue('gap'));
            const scrollAmount = bookWidth + gapValue;
            
            shelfRef.current.scrollBy({
                left: direction * scrollAmount,
                behavior: 'smooth'
            });
        }
    }
  };
  
  useEffect(() => {
    const currentRef = shelfRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScrollState);
      // Проверяем состояние при первой загрузке
      checkScrollState();
    }
    
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', checkScrollState);
      }
    };
  }, []);

  // Дополнительная проверка состояния при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      checkScrollState();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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
        const todayAlmatyFormatted = DateTime.now().setZone('Asia/Almaty').toISODate();

        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_date, start_time, end_time, status, event_name') 
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

  const formatTime = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const [activeTooltip, setActiveTooltip] = useState(null);

  return (
    <section ref={ref} className={`${styles.bookCornerSection} ${inView ? styles.visible : ''}`}>

       {/* SVG-волна для верхней части секции */}
       <div className={styles.topWaveContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="#FEF8BC" 
            fillOpacity="1"
            d="M0,64L48,85.3C96,107,192,149,288,138.7C384,128,480,64,576,48C672,32,768,64,864,69.3C960,75,1056,53,1152,48C1248,43,1344,53,1392,58.7L1440,64L1440,0L0,0Z">
          </path>
          <path
            fill="none"
            stroke="#ffffff"
            strokeWidth="15"
            d="M0,64L48,85.3C96,107,192,149,288,138.7C384,128,480,64,576,48C672,32,768,64,864,69.3C960,75,1056,53,1152,48C1248,43,1344,53,1392,58.7L1440,64">
          </path>
        </svg>
      </div>


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
          <div className="container"> 

          <div className={styles.bookShelfSection}>
            <h3 className={styles.bookShelfSubtitle}>{bookCornerData.bookShelf.subtitle}</h3>
          </div>

          <div className={styles.bookShelfCarouselContainer}> 
            <button
                className={`${styles.carouselButton} ${styles.leftButton} ${!canScrollLeft ? styles.disabled : ''}`}
                onClick={() => scrollShelf(-1)}
                disabled={!canScrollLeft}
            >
                <LeftArrowSVG className={styles.carouselArrow} />
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
                onClick={() => scrollShelf(1)}
                disabled={!canScrollRight}
            >
                <RightArrowSVG className={styles.carouselArrow} />
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
                  <div key={event.id} className={styles.todayEventItem}>  
                    <p className={styles.todayEventTime}>
                      {formatTime(event.start_time)} - {formatTime(event.end_time)}
                    </p>
                    <p className={styles.todayEventTitle}>
                    {event.event_name || 'Забронировано'}
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

      <div className={styles.waveContainer}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          {/* Path для заливки волны. Цвет должен совпадать с фоном секции с картой. */}
          <path
            fill="#FEF8BC" 
            fillOpacity="1"
            d="M0,64L21.8,101.3C43.6,139,87,213,131,240C174.5,267,218,245,262,218.7C305.5,192,349,160,393,144C436.4,128,480,128,524,133.3C567.3,139,611,149,655,165.3C698.2,181,742,203,785,192C829.1,181,873,139,916,144C960,149,1004,203,1047,202.7C1090.9,203,1135,149,1178,144C1221.8,139,1265,181,1309,202.7C1352.7,224,1396,224,1418,224L1440,224L1440,320L1418.2,320C1396.4,320,1353,320,1309,320C1265.5,320,1222,320,1178,320C1134.5,320,1091,320,1047,320C1003.6,320,960,320,916,320C872.7,320,829,320,785,320C741.8,320,698,320,655,320C610.9,320,567,320,524,320C480,320,436,320,393,320C349.1,320,305,320,262,320C218.2,320,175,320,131,320C87.3,320,44,320,22,320L0,320Z">
          </path>
          {/* Path для контура волны. */}
          <path
            fill="none"
            stroke="#ffffff"
            strokeWidth="10"
            d="M0,64L21.8,101.3C43.6,139,87,213,131,240C174.5,267,218,245,262,218.7C305.5,192,349,160,393,144C436.4,128,480,128,524,133.3C567.3,139,611,149,655,165.3C698.2,181,742,203,785,192C829.1,181,873,139,916,144C960,149,1004,203,1047,202.7C1090.9,203,1135,149,1178,144C1221.8,139,1265,181,1309,202.7C1352.7,224,1396,224,1418,224L1440,224">
          </path>
        </svg>
      </div>
    </section>
  );
};

export default BookCorner;