// src/components/MenuDisplay/MenuDisplay.jsx
import React, { useEffect, useState, useRef } from 'react';
import { fetchMenuItems, supabase } from '../../supabaseClient';
import styles from './MenuDisplay.module.scss';
import { Link } from 'react-router-dom';
import ImageSlider from './ImageSlider'; 
import DeliverySection from './DeliverySection'; 
import LazyImage from '../LazyImage/LazyImage.jsx';

const IIKO_IMAGE_API_BASE_URL = "https://api-ru.iiko.services";

function MenuDisplay() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('Все меню');
    const [categoriesList, setCategoriesList] = useState([]); 

    // Создаем ref для секции доставки
    const deliverySectionRef = useRef(null);
    // 💡 Создаем новый ref для контейнера меню
    const menuContentRef = useRef(null);

    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        // 💡 Прокручиваем страницу к контейнеру меню при клике на категорию
        if (menuContentRef.current) {
            menuContentRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    };


    useEffect(() => {
        const getMenu = async () => {
            try {
                const data = await fetchMenuItems();
                if (data) {
                    setMenuItems(data);
                    
                    const allCategories = new Set();
                    allCategories.add('Все меню');
                    data.forEach(item => {
                        if (item.categories && item.categories.length > 0) {
                            item.categories.forEach(category => allCategories.add(category));
                        }
                    });
                    setCategoriesList(Array.from(allCategories)); 
                }
            } catch (err) {
                console.error("Не удалось получить меню:", err);
                setError("Не удалось получить меню.");
            } finally {
                setLoading(false);
            }
        };

        getMenu();
        
        const menuChannel = supabase.channel('menu_items_changes');

        menuChannel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, payload => {
                console.log('Изменение в меню:', payload);
                getMenu();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(menuChannel);
        };
    }, []);

    const getImageUrl = (imageSource) => {
        if (!imageSource) return "/images/noimg.webp"; 
        
        if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
            return imageSource;
        }
        return `${IIKO_IMAGE_API_BASE_URL}/api/1/image?imageId=${imageSource}`;
    };

    if (loading) {
        return <div className={styles.menuStatus}>Загрузка меню...</div>;
    }

    if (error) {
        return <div className={`${styles.menuStatus} ${styles.menuError}`}>Ошибка: {error}</div>;
    }

    if (menuItems.length === 0) {
        return <div className={styles.menuStatus}>Меню пока пустое.</div>;
    }

    const filteredItems = activeCategory === 'Все меню'
        ? menuItems
        : menuItems.filter(item => item.categories && item.categories.includes(activeCategory));

    return (
        <>
            <div className={styles.heroWrapper}>
                <ImageSlider deliverySectionRef={deliverySectionRef} />
                <div className={styles.heroContent}>
                </div>
            </div>               

            <div className="container">
            {/* 💡 Привязываем ref к контейнеру меню */}
            <div ref={menuContentRef} className={styles.menuContentContainer}>
                <div className={styles.menuCategories}>
                    {categoriesList.map(category => (
                        <button 
                            key={category} 
                            className={`${styles.categoryButton} ${activeCategory === category ? styles.activeCategory : ''}`}
                            onClick={() => handleCategoryClick(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                <h2 className={styles.menuTitle}>{activeCategory}</h2>
                <div className={styles.menuGrid}>
                    {filteredItems.map(item => (
                        <div key={item.iiko_id} className={styles.menuItemCard}>
                            <LazyImage 
                                src={getImageUrl(item.image_id)} 
                                alt={item.name} 
                                className={styles.menuItemImage} 
                            />
                            <div className={styles.menuItemInfo}>
                                <h3 className={styles.menuItemName}>{item.name}</h3>
                                <p className={styles.menuItemPrice}>{item.price ? `${item.price} ₸` : 'Цена не указана'}</p>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredItems.length === 0 && (
                    <div className={styles.menuStatus}>В этой категории пока нет блюд.</div>
                )}
            </div>            
            </div>
            <DeliverySection ref={deliverySectionRef} />
        </>
    );
}

export default MenuDisplay;