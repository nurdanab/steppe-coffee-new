import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './BookCorner.module.scss';
import bookCornerData from '../../data/bookCornerData.json';

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


  const [currentCalendarDate] = useState(new Date());

  const getWeekDates = (date) => {
    const today = new Date(date);
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
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
  
  const todayDate = new Date();
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

  return (
    <section ref={ref} className={`${styles.bookCornerSection} ${inView ? styles.visible : ''}`}>
                  {/* <div className="headerFullWidthContainer">  */}

      <div className={styles.bookCornerContent}>
        {/* Желтая часть */}
        <div className={styles.yellowPart}>
          <div className={styles.yellowPartInner}>  
            <div className={styles.yellowPartTextContent}>
              <h2 className={styles.yellowPartTitle}>{bookCornerData.yellowPart.title}</h2>
              <p className={styles.yellowPartDescription}>{bookCornerData.yellowPart.description}</p>
              <button className={styles.yellowPartButton}>{bookCornerData.yellowPart.buttonText}</button>
            </div>
            {/* Декоративный элемент - теперь внутри yellowPartInner */}
            <img 
              src={bookCornerData.yellowPart.decorImage} 
              alt="Декоративный элемент книжного уголка"
              className={styles.yellowPartDecor}
            />
          </div>

          {/* Полка с книгами, теперь она внутри yellowPart, но отдельным блоком */}
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

        {/* Главная открытая книга (расположена между желтой и белой частями) */}
        <div className={styles.mainBookContainer}>
          <img
            src={bookCornerData.mainBook.imageSrc}
            alt="Открытая книга"
            className={styles.mainBookImage}
          />
          {/* Печать на книге */}
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
          {/* Пустой заголовок, если нужен отступ или если здесь будет другой контент */}
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
                  // 0 - Вс, 6 - Сб. Для Пн-Вс: Вс - это 6, Сб - это 5.
                  const currentDay = dateObj.getDay(); // 0 (Вс) - 6 (Сб)
                  // Если Пн (1) по Пт (5) это рабочие, а Вс (0) и Сб (6) - выходные
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
            {/* Дата события (теперь динамическая) */}
            <p className={styles.eventDate}>{formattedEventDate}</p>
            {/* Сообщения о событиях */}
            <div className={styles.eventList}>
              <p className={styles.emptyEventsMessage}>{bookCornerData.eventsSection.emptyMessage}</p>
            </div>
            <button className={styles.viewMoreButton}>{bookCornerData.eventsSection.viewMoreButtonText}</button>
          </div>
        </div>
      </div>
      {/* </div> */}

    </section>
  );
};

export default BookCorner;