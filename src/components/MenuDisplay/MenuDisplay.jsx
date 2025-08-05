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
    const [activeCategory, setActiveCategory] = useState('Спец. предложения');

    useEffect(() => {
        const getMenu = async () => {
            try {
                const data = await fetchMenuItems();
                if (data) {
                    setMenuItems(data);
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

    const getImageUrl = (imageId) => {
        if (!imageId) return null;
        
        if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
            return imageId;
        }
        return `${IIKO_IMAGE_API_BASE_URL}/api/1/image?imageId=${imageId}`;
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

    const categories = ['Спец. предложения', 'Напитки', 'Сэндвичи', 'Десерты', 'Добавки'];

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
                <div className={styles.menuCategories}>
                    {categories.map(category => (
                        <button 
                            key={category} 
                            className={`${styles.categoryButton} ${activeCategory === category ? styles.activeCategory : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                <h2 className={styles.menuTitle}>Авторские напитки</h2>
                <div className={styles.menuGrid}>
                    {menuItems.map(item => (
                        <div key={item.id} className={styles.menuItemCard}>
                            <img 
                                src={getImageUrl(item.image_id) || "placeholder.png"} 
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
            </div>
        </>
    );
}

export default MenuDisplay;