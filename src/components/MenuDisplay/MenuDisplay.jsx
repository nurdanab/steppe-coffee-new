// src/components/MenuDisplay/MenuDisplay.jsx

import React, { useEffect, useState } from 'react';
import { fetchMenuItems } from '../../supabaseClient'; 

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
    }, []);

     const getImageUrl = (imageId) => {
        if (!imageId) return null;  
         return `${IIKO_IMAGE_API_BASE_URL}/api/1/image?imageId=${imageId}`;
    };

    if (loading) {
        return <div className="menu-status">Загрузка меню...</div>;
    }

    if (error) {
        return <div className="menu-status menu-error">Ошибка: {error}</div>;
    }

    if (menuItems.length === 0) {
        return <div className="menu-status">Меню пока пустое.</div>;
    }

    return (
        <div className="menu-container">
            <h2>Наше Меню</h2>
            <div className="menu-grid">
                {menuItems.map(item => (
                    <div key={item.id} className="menu-item-card">
                        <img 
                            src={getImageUrl(item.image_id) || "placeholder.png"} 
                            alt={item.name} 
                            className="menu-item-image" 
                        />
                        <div className="menu-item-info">
                            <h3 className="menu-item-name">{item.name}</h3>
                            <p className="menu-item-price">{item.price ? `${item.price} ₸` : 'Цена не указана'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MenuDisplay;