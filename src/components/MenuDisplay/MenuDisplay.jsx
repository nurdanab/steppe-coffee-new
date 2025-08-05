import React, { useEffect, useState } from 'react';
import { fetchMenuItems, supabase } from '../../supabaseClient';
import styles from './MenuDisplay.module.scss'; // Импортируем стили

const IIKO_IMAGE_API_BASE_URL = "https://api-ru.iiko.services";

function MenuDisplay() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        
        // Проверяем, является ли imageId уже полным URL
        if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
            // Если да, используем его напрямую
            return imageId;
        }

        // Если нет, формируем полный URL с помощью базового URL iiko
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

    return (
        <div className={styles.menuContainer}>
            <h2 className={styles.menuTitle}>Наше Меню</h2>
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
    );
}

export default MenuDisplay;