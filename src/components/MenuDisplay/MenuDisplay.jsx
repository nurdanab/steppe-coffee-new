import React, { useEffect, useState } from 'react';

const SUPABASE_FUNCTION_URL = "https://nlhugcvfwklgzpxgzvth.supabase.co/functions/v1/get-iiko-menu"; 
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; 

function MenuDisplay() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                if (!SUPABASE_ANON_KEY) {
                    throw new Error("Supabase Anon Key is not defined. Please check your .env file or Netlify environment variables.");
                }

                const response = await fetch(SUPABASE_FUNCTION_URL, {
                    method: 'POST', 
                    headers: {
                        'Content-Type': 'application/json',
                        // Попробуем отправить ANON_KEY как Bearer токен.
                        // Supabase функции, когда JWT отключен, иногда это воспринимают.
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 
                        'apikey': SUPABASE_ANON_KEY, // Оставьте apikey на всякий случай, если он используется внутренне
                    },
                    body: JSON.stringify({}), 
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status} - Response: ${JSON.stringify(errorData)}`);
                }
                
                const data = await response.json();
                setMenuItems(data);
            } catch (err) {
                console.error("Failed to fetch menu:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };


        fetchMenu();
    }, []); 

    if (loading) {
        return <div className="menu-loading">Загрузка меню...</div>;
    }

    if (error) {
        return <div className="menu-error">Ошибка загрузки меню: {error}</div>;
    }

    if (menuItems.length === 0) {
        return <div className="menu-empty">Меню пока пустое.</div>;
    }

    return (
        <div className="menu-container">
            <h2>Наше Меню</h2>
            {menuItems.map(item => (
                <div key={item.id} className="menu-item">
                    <h3>{item.name}</h3>
                    {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="menu-item-image" />
                    )}
                    <p className="menu-item-price">
                        Цена: {item.price} {item.currency}
                    </p>
                    {item.description && (
                        <p className="menu-item-description">{item.description}</p>
                    )}
                    {item.categories && item.categories.length > 0 && (
                        <p className="menu-item-categories">Категории: {item.categories.join(', ')}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default MenuDisplay;