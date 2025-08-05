import React, { useState, useEffect } from 'react';
import styles from './ImageSlider.module.scss';

const ImageSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = [
        { src: "/images/menu-1.webp", alt: "Изображение 1 из меню" },
        { src: "/images/menu-2.webp", alt: "Изображение 2 из меню" },
        { src: "/images/menu-3.webp", alt: "Изображение 3 из меню" },
        { src: "/images/menu-1.webp", alt: "Изображение 1 из меню (клон)" }, // Добавляем клон первого слайда
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide(prevSlide => {
                const nextSlide = prevSlide + 1;
                // Когда дошли до клонированного слайда, сбрасываем на 0
                if (nextSlide === slides.length) {
                    return 0;
                }
                return nextSlide;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [slides.length]);
    
    // Эффект для мгновенного сброса
    useEffect(() => {
        if (currentSlide === slides.length - 1) {
            const timeout = setTimeout(() => {
                setCurrentSlide(0);
            }, 1200); // Время перехода + небольшая задержка
            return () => clearTimeout(timeout);
        }
    }, [currentSlide, slides.length]);
    

    return (
        <div className={styles.sliderContainer}>
            <div 
                className={styles.slider}
                style={{
                    transform: `translateX(-${currentSlide * 100}%)`,
                    transition: currentSlide === 0 && slides.length - 1 ? 'none' : 'transform 1.2s ease-in-out',
                }}
            >
                {slides.map((slide, index) => (
                    <img
                        key={index}
                        src={slide.src}
                        alt={slide.alt}
                        className={styles.slideImage}
                    />
                ))}
            </div>

            <div className={styles.pagination}>
                {slides.map((_, index) => (
                    index < slides.length - 1 && (
                        <button
                            key={index}
                            className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Перейти к слайду ${index + 1}`}
                        />
                    )
                ))}
            </div>
        </div>
    );
};

export default ImageSlider;