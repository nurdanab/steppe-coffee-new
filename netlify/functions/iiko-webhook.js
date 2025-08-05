// netlify/functions/iiko-webhook.js

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Инициализируем клиента Supabase прямо в функции
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;
const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Основная функция-обработчик для Netlify
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body);
    console.log('Получен вебхук от iiko:', body);

    const eventType = body.eventType;

    if (eventType === 'menu.changed') {
        console.log('Произошло изменение в меню. Обновляем данные в Supabase.');
        
        try {
            const newMenuFromIiko = await fetchFreshMenuFromIiko(); 

            // Используем клиента для Supabase
            const { error: deleteError } = await serverSupabase 
                .from('menu_items')
                .delete()
                .neq('id', '0');

            if (deleteError) {
                console.error('Ошибка при удалении старых данных:', deleteError);
                return { statusCode: 500, body: 'Ошибка сервера' };
            }

            const { data, error: insertError } = await serverSupabase
                .from('menu_items')
                .insert(newMenuFromIiko);

            if (insertError) {
                console.error('Ошибка при вставке новых данных:', insertError);
                return { statusCode: 500, body: 'Ошибка сервера' };
            }

            console.log('Меню успешно обновлено в Supabase.');
            return { statusCode: 200, body: 'Меню успешно обновлено.' };

        } catch (err) {
            console.error('Ошибка при обработке вебхука:', err);
            return { statusCode: 500, body: 'Ошибка сервера' };
        }
    } else {
        console.log('Неизвестный тип события:', eventType);
        return { statusCode: 200, body: 'Событие обработано, но не требует действий.' };
    }
};

// Вспомогательная функция для получения токена
async function getIikoToken() {
    const iikoApiUrl = process.env.IIKO_API_URL;
    const iikoApiKey = process.env.IIKO_API_KEY;

    if (!iikoApiUrl || !iikoApiKey) {
        throw new Error('IIKO_API_URL or IIKO_API_KEY are not defined in environment variables.');
    }

    const { data } = await axios.post(`${iikoApiUrl}/api/1/auth/access_token`, {
        apiLogin: iikoApiKey
    });

    return data.token;
}

// Вспомогательная функция для получения актуального меню
async function fetchFreshMenuFromIiko() {
    const token = await getIikoToken();
    const iikoApiUrl = process.env.IIKO_API_URL;
    const organizationId = process.env.TARGET_ORGANIZATION_ID;

    if (!organizationId) {
        throw new Error('TARGET_ORGANIZATION_ID is not defined in environment variables.');
    }

    const { data: menuData } = await axios.post(`${iikoApiUrl}/api/1/nomenclature`, {
        organizationId: organizationId
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    return menuData.products.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image_id: item.imageLinks[0] || null,
        categories: item.productCategoryIds
    }));
}