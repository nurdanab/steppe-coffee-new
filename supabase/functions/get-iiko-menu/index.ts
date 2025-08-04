import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// --- КОНФИГУРАЦИЯ ---
const IIKO_API_BASE_URL = "https://api-ru.iiko.services";
const YOUR_API_KEY = Deno.env.get("IIKO_API_KEY");
const TARGET_ORGANIZATION_ID = Deno.env.get("IIKO_ORGANIZATION_ID");
const TARGET_MENU_NAME = Deno.env.get("IIKO_MENU_NAME") || "Steppe App Menu";

const COMMON_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
};

// CORS заголовки, определенные здесь, для этого конкретного файла функции
const LOCAL_CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://steppecoffee.netlify.app', // Убедитесь, что здесь НЕТ слэша
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

// ... (функции getAccessToken, getExternalMenusList, getMenuItems остаются без изменений) ...

serve(async (req) => {
    console.log(`DEBUG: Запрос получен в serve: ${req.method} ${req.url}`);

    // Используем локально определенные CORS заголовки
    if (req.method === 'OPTIONS') {
        console.log("DEBUG: Обработка OPTIONS запроса.");
        return new Response(null, {
            headers: LOCAL_CORS_HEADERS,
            status: 204
        });
    }

    const { token, error: tokenError } = await getAccessToken(YOUR_API_KEY);
    if (!token) {
        console.error(`DEBUG: Не удалось получить токен доступа в serve: ${tokenError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить токен доступа: ${tokenError}` }), {
            headers: { ...LOCAL_CORS_HEADERS, "Content-Type": "application/json" },
            status: 401
        });
    }
    console.log("DEBUG: Токен доступа получен в serve.");

    if (!TARGET_ORGANIZATION_ID) {
         console.error("DEBUG: ID целевой организации не установлен.");
         return new Response(JSON.stringify({ error: "ID целевой организации (IIKO_ORGANIZATION_ID) не установлен в секретах Supabase." }), {
            headers: { ...LOCAL_CORS_HEADERS, "Content-Type": "application/json" },
            status: 400
        });
    }
    console.log(`DEBUG: Целевая организация ID: ${TARGET_ORGANIZATION_ID}`);

    const { menus: allExternalMenus, error: menusError } = await getExternalMenusList(token, TARGET_ORGANIZATION_ID);
    if (!allExternalMenus) {
        console.error(`DEBUG: Не удалось получить список внешних меню в serve: ${menusError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить список внешних меню: ${menusError}` }), {
            headers: { ...LOCAL_CORS_HEADERS, "Content-Type": "application/json" },
            status: 500
        });
    }
    console.log(`DEBUG: Получен список из ${allExternalMenus.length} внешних меню.`);

    let selectedExternalMenuId: string | null = null;
    for (const menuInfo of allExternalMenus) {
        if (menuInfo.name === TARGET_MENU_NAME) {
            selectedExternalMenuId = menuInfo.id;
            console.log(`DEBUG: Найден ID для '${TARGET_MENU_NAME}': ${selectedExternalMenuId}`);
            break;
        }
    }

    if (!selectedExternalMenuId) {
        console.error(`DEBUG: Не найден ID для '${TARGET_MENU_NAME}'.`);
        return new Response(JSON.stringify({ error: `Не найден ID для '${TARGET_MENU_NAME}' в списке внешних меню.` }), {
            headers: { ...LOCAL_CORS_HEADERS, "Content-Type": "application/json" },
            status: 404
        });
    }

    const { items: menuItems, error: itemsError } = await getMenuItems(token, selectedExternalMenuId, TARGET_ORGANIZATION_ID);
    if (itemsError) {
        console.error(`DEBUG: Не удалось получить содержимое меню в serve: ${itemsError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить содержимое меню: ${itemsError}` }), {
            headers: { ...LOCAL_CORS_HEADERS, "Content-Type": "application/json" },
            status: 500
        });
    }
    console.log(`DEBUG: Получено ${menuItems ? menuItems.length : 0} элементов меню.`);


    const formattedMenu = menuItems.map((item: any) => {
        let priceInfo = item.defaultPrice || {};
        if (Object.keys(priceInfo).length === 0 && item.prices && item.prices.length > 0) {
            priceInfo = item.prices[0];
        }

        const categories = [];
        if (item.productCategories) {
            item.productCategories.forEach((cat: any) => categories.push(cat.name));
        } else if (item.parentGroup && item.parentGroup.name) {
            categories.push(item.parentGroup.name);
        }

        const imageUrl = item.imageIds && item.imageIds.length > 0
                            ? `${IIKO_API_BASE_URL}/api/2/entities/products/image?id=${item.imageIds[0]}`
                            : null;

        return {
            id: item.id,
            name: item.name,
            description: item.description || 'Нет описания',
            price: priceInfo.currentPrice,
            currency: priceInfo.currencyISOCode || '',
            categories: categories,
            imageUrl: imageUrl
        };
    });

    console.log("DEBUG: Возвращаем отформатированное меню. Завершение запроса.");
    return new Response(JSON.stringify(formattedMenu), {
        headers: { ...LOCAL_CORS_HEADERS, "Content-Type": "application/json" },
        status: 200
    });
});