// src/components/MenuDisplay.jsx

import React, { useEffect, useState } from 'react';
import { fetchMenuItems, supabase } from '../../supabaseClient';
import styles from './MenuDisplay.module.scss';
import { Link } from 'react-router-dom';
import ImageSlider from './ImageSlider'; 

const IIKO_IMAGE_API_BASE_URL = "https://api-ru.iiko.services";

function MenuDisplay() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCategory, setActiveCategory] = useState('Все меню'); // <-- Изменено: категория по умолчанию
    const [categoriesList, setCategoriesList] = useState([]); // <-- Добавлено: состояние для динамического списка категорий

    useEffect(() => {
        const getMenu = async () => {
            try {
                const data = await fetchMenuItems();
                if (data) {
                    setMenuItems(data);
                    
                    // <-- Добавлена логика для динамического получения категорий
                    const allCategories = new Set();
                    allCategories.add('Все меню'); // <-- Добавим категорию "Все меню"
                    data.forEach(item => {
                        if (item.categories && item.categories.length > 0) {
                            item.categories.forEach(category => allCategories.add(category));
                        }
                    });
                    setCategoriesList(Array.from(allCategories)); // <-- Преобразуем Set в массив и сохраним в состояние

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
        if (!imageSource) return "/placeholder.png"; 
        
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

    // <-- Логика фильтрации по активной категории
    const filteredItems = activeCategory === 'Все меню'
        ? menuItems
        : menuItems.filter(item => item.categories && item.categories.includes(activeCategory));

    return (
        <>
            <div className={styles.heroWrapper}>
                <ImageSlider />
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>Steppe Caffee Menu</h1>
                    <Link to="/order">
                        <button className={styles.heroButton}>Заказать онлайн</button>
                    </Link>
                </div>
            </div>
            <div className={styles.menuContentContainer}>
                {/* <-- Разметка для кнопок категорий, используем categoriesList */}
                <div className={styles.menuCategories}>
                    {categoriesList.map(category => (
                        <button 
                            key={category} 
                            className={`${styles.categoryButton} ${activeCategory === category ? styles.activeCategory : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                {/* <-- Заголовок, который меняется в зависимости от выбранной категории */}
                <h2 className={styles.menuTitle}>{activeCategory}</h2>
                <div className={styles.menuGrid}>
                    {filteredItems.map(item => (
                        <div key={item.iiko_id} className={styles.menuItemCard}>
                            <img 
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
                {/* <-- Сообщение, если в категории нет блюд */}
                {filteredItems.length === 0 && (
                    <div className={styles.menuStatus}>В этой категории пока нет блюд.</div>
                )}
            </div>
        </>
    );
}

export default MenuDisplay;