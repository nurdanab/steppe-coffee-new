import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Инициализируем клиента Supabase, используя переменные окружения Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_KEY;
const serverSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Основная функция-обработчик для Netlify
exports.handler = async (event, context) => {
    console.log('Запущено обновление меню по расписанию.');

    try {
        const newMenuFromIiko = await fetchFreshMenuFromIiko(); 

        if (!newMenuFromIiko || newMenuFromIiko.length === 0) {
            console.log('Нет данных для обновления. Меню iiko, возможно, пустое.');
            return { statusCode: 200, body: 'Меню iiko пустое, обновление не требуется.' };
        }

        // Очищаем таблицу перед вставкой новых данных.
        // Используем более надёжный метод очистки.
        const { error: deleteError } = await serverSupabase
            .from('menu_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем все записи, где id не равен пустой строке
                                                               // чтобы не удалять "случайно" какие-то важные записи.

        if (deleteError) {
            console.error('Ошибка при удалении старых данных:', deleteError);
            return { statusCode: 500, body: 'Ошибка сервера' };
        }
        console.log('Старые данные успешно удалены.');


        // Вставляем новые данные
        const { data, error: insertError } = await serverSupabase
            .from('menu_items')
            .insert(newMenuFromIiko);

        if (insertError) {
            console.error('Ошибка при вставке новых данных:', insertError);
            return { statusCode: 500, body: 'Ошибка сервера' };
        }

        console.log(`Меню успешно обновлено в Supabase. Вставлено ${newMenuFromIiko.length} позиций.`);
        return { statusCode: 200, body: 'Меню успешно обновлено.' };

    } catch (err) {
        console.error('Ошибка при обновлении меню по расписанию:', err);
        return { statusCode: 500, body: `Ошибка сервера: ${err.message}` };
    }
};

// Вспомогательная функция для получения токена
async function getIikoToken() {
    const iikoApiUrl = process.env.IIKO_API_URL;
    const iikoApiKey = process.env.IIKO_API_KEY;

    if (!iikoApiUrl || !iikoApiKey) {
        throw new Error('IIKO_API_URL or IIKO_API_KEY are not defined in environment variables.');
    }

    try {
        const { data } = await axios.post(`${iikoApiUrl}/api/1/auth/access_token`, {
            apiLogin: iikoApiKey
        });
        return data.token;
    } catch (error) {
        console.error("Ошибка при получении токена iiko:", error.response ? error.response.data : error.message);
        throw new Error("Не удалось получить токен iiko.");
    }
}

// Вспомогательная функция для получения актуального меню
async function fetchFreshMenuFromIiko() {
    const token = await getIikoToken();
    const iikoApiUrl = process.env.IIKO_API_URL;
    const organizationId = process.env.TARGET_ORGANIZATION_ID;
    const targetMenuName = process.env.TARGET_MENU_NAME; // Получаем имя меню из переменных окружения

    if (!organizationId) {
        throw new Error('TARGET_ORGANIZATION_ID is not defined in environment variables.');
    }
    if (!targetMenuName) {
        throw new Error('TARGET_MENU_NAME is not defined in environment variables.');
    }

    try {
        // Получаем список внешних меню
        const { data: externalMenusData } = await axios.post(`${iikoApiUrl}/api/2/menu`, {
            organizationId: organizationId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Ищем ID нужного нам меню по имени
        const targetMenu = externalMenusData.externalMenus.find(menu => menu.name === targetMenuName);
        if (!targetMenu) {
            throw new Error(`Не найдено меню с именем "${targetMenuName}".`);
        }
        const externalMenuId = targetMenu.id;

        // Получаем детали меню по его ID
        const { data: menuData } = await axios.post(`${iikoApiUrl}/api/2/menu/by_id`, {
            externalMenuId: externalMenuId,
            organizationIds: [organizationId]
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const allMenuItems = [];
        if (menuData && menuData.itemCategories) {
            for (const category of menuData.itemCategories) {
                if (category.items) {
                    for (const item of category.items) {
                        const price = item.itemSizes?.[0]?.prices?.[0]?.price || item.prices?.[0]?.price || null;
                        const imageId = item.imageIds?.[0] || item.itemSizes?.[0]?.buttonImageUrl?.split('imageId=')?.[1]?.split('.')?.[0] || null;

                        allMenuItems.push({
                            iiko_id: item.itemId,
                            name: item.name,
                            description: item.description || null,
                            price: price,
                            image_id: imageId,
                            categories: [category.name]
                        });
                    }
                }
            }
        }
        return allMenuItems;

    } catch (error) {
        console.error("Ошибка при получении меню iiko:", error.response ? error.response.data : error.message);
        throw new Error("Не удалось получить меню iiko.");
    }
}