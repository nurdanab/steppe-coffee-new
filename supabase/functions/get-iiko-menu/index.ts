import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// --- КОНФИГУРАЦИЯ ---
const IIKO_API_BASE_URL = "https://api-ru.iiko.services";
const YOUR_API_KEY = Deno.env.get("IIKO_API_KEY");
const TARGET_ORGANIZATION_ID = Deno.env.get("IIKO_ORGANIZATION_ID");
const TARGET_MENU_NAME = Deno.env.get("IIKO_MENU_NAME") || "Steppe App Menu";

// Добавляем общий заголовок User-Agent
const COMMON_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" // Пример User-Agent из Chrome
};

async function getAccessToken(apiKey: string | undefined): Promise<{ token: string | null; error: string | null }> {
    console.log("DEBUG: Внутри getAccessToken.");
    if (!apiKey) {
        console.error("DEBUG: API Key не установлен.");
        return { token: null, error: "API Key не установлен." };
    }

    const url = `${IIKO_API_BASE_URL}/api/1/access_token`;
    const payload = { apiLogin: apiKey };

    try {
        console.log(`DEBUG: Отправка запроса на получение токена: ${url}`);
        const response = await fetch(url, {
            method: "POST",
            headers: COMMON_HEADERS, // Используем общие заголовки
            body: JSON.stringify(payload)
        });
        console.log(`DEBUG: Получен ответ по токену. Статус: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DEBUG: Ошибка HTTP при получении токена: ${response.status} - ${errorText}`);
            return { token: null, error: `Ошибка HTTP: ${response.status} - ${errorText}` };
        }

        const tokenData = await response.json();
        console.log("DEBUG: Данные токена получены:", JSON.stringify(tokenData));
        const accessToken = tokenData.token;
        if (accessToken) {
            console.log("DEBUG: Токен доступа успешно извлечен.");
            return { token: accessToken, error: null };
        } else {
            console.error(`DEBUG: Токен отсутствует в ответе: ${JSON.stringify(tokenData)}`);
            return { token: null, error: `Ошибка: В ответе нет токена. Ответ: ${JSON.stringify(tokenData)}` };
        }
    } catch (e: any) {
        console.error(`DEBUG: Исключение при получении токена: ${e.message}`);
        return { token: null, error: `Ошибка при получении токена доступа: ${e.message}` };
    }
}

async function getExternalMenusList(accessToken: string, organizationId: string | undefined): Promise<{ menus: any[] | null; error: string | null }> {
    console.log("DEBUG: Внутри getExternalMenusList.");
    if (!organizationId) {
        console.error("DEBUG: Organization ID не указан для getExternalMenusList.");
        return { menus: null, error: "Organization ID не указан." };
    }

    const url = `${IIKO_API_BASE_URL}/api/2/menu`;
    const headers = {
        ...COMMON_HEADERS, // Добавляем общие заголовки
        "Authorization": `Bearer ${accessToken}`
    };
    const payload = { organizationId: organizationId };

    try {
        console.log(`DEBUG: Отправка запроса на список меню: ${url} для Org ID: ${organizationId}`);
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
        console.log(`DEBUG: Получен ответ по списку меню. Статус: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DEBUG: Ошибка HTTP при получении списка меню: ${response.status} - ${errorText}`);
            return { menus: null, error: `Ошибка HTTP: ${response.status} - ${errorText}` };
        }

        const menuListData = await response.json();
        console.log("DEBUG: Данные списка меню получены:", JSON.stringify(menuListData));
        const externalMenus = menuListData.externalMenus;
        if (Array.isArray(externalMenus)) {
            console.log(`DEBUG: Найдено ${externalMenus.length} внешних меню.`);
            return { menus: externalMenus, error: null };
        } else {
            console.error(`DEBUG: Список внешних меню неверного формата: ${JSON.stringify(menuListData)}`);
            return { menus: null, error: `Ошибка: В ответе нет списка внешних меню или он пуст. Ответ: ${JSON.stringify(menuListData)}` };
        }
    } catch (e: any) {
        console.error(`DEBUG: Исключение при получении списка внешних меню: ${e.message}`);
        return { menus: null, error: `Ошибка при получении списка внешних меню: ${e.message}` };
    }
}

async function getMenuItems(accessToken: string, externalMenuId: string | undefined, organizationId: string | undefined): Promise<{ items: any[] | null; error: string | null }> {
    console.log("DEBUG: Внутри getMenuItems.");
    if (!externalMenuId) {
        console.error("DEBUG: External Menu ID не указан для getMenuItems.");
        return { items: null, error: "External Menu ID не указан." };
    }
    if (!organizationId) {
        console.error("DEBUG: Organization ID не указан для getMenuItems.");
        return { items: null, error: "Organization ID не указан." };
    }

    const url = `${IIKO_API_BASE_URL}/api/2/menu/by_id`;
    const headers = {
        ...COMMON_HEADERS, // Добавляем общие заголовки
        "Authorization": `Bearer ${accessToken}`
    };
    const payload = {
        externalMenuId: externalMenuId,
        organizationIds: [organizationId]
    };

    try {
        console.log(`DEBUG: Отправка запроса на получение содержимого меню: ${url} для Menu ID: ${externalMenuId}, Org ID: ${organizationId}`);
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });
        console.log(`DEBUG: Получен ответ по содержимому меню. Статус: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DEBUG: Ошибка HTTP при получении содержимого меню: ${response.status} - Полный ответ: ${errorText}`);
            return { items: null, error: `Ошибка HTTP: ${response.status} - ${errorText}` };
        }

        const menuData = await response.json();
        console.log("DEBUG: Данные содержимого меню получены:", JSON.stringify(menuData));
        const products = menuData.itemProducts;
        if (Array.isArray(products)) {
            console.log(`DEBUG: Найдено ${products.length} блюд в меню.`);
            return { items: products, error: null };
        } else {
            console.error(`DEBUG: Список блюд неверного формата: ${JSON.stringify(menuData)}`);
            return { items: null, error: `Ошибка: В ответе нет списка блюд ('itemProducts') или он неверного формата. ${JSON.stringify(menuData)}` };
        }
    } catch (e: any) {
        console.error(`DEBUG: Исключение при получении содержимого меню: ${e.message}`);
        return { items: null, error: `Ошибка при получении содержимого меню: ${e.message}` };
    }
}

serve(async (req) => {
    console.log(`DEBUG: Запрос получен в serve: ${req.method} ${req.url}`);

    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://steppecoffee.netlify.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    };

    if (req.method === 'OPTIONS') {
        console.log("DEBUG: Обработка OPTIONS запроса.");
        return new Response(null, {
            headers: corsHeaders,
            status: 204
        });
    }

    const { token, error: tokenError } = await getAccessToken(YOUR_API_KEY);
    if (!token) {
        console.error(`DEBUG: Не удалось получить токен доступа в serve: ${tokenError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить токен доступа: ${tokenError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401
        });
    }
    console.log("DEBUG: Токен доступа получен в serve.");

    if (!TARGET_ORGANIZATION_ID) {
         console.error("DEBUG: ID целевой организации не установлен.");
         return new Response(JSON.stringify({ error: "ID целевой организации (IIKO_ORGANIZATION_ID) не установлен в секретах Supabase." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
        });
    }
    console.log(`DEBUG: Целевая организация ID: ${TARGET_ORGANIZATION_ID}`);

    const { menus: allExternalMenus, error: menusError } = await getExternalMenusList(token, TARGET_ORGANIZATION_ID);
    if (!allExternalMenus) {
        console.error(`DEBUG: Не удалось получить список внешних меню в serve: ${menusError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить список внешних меню: ${menusError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
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
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404
        });
    }

    const { items: menuItems, error: itemsError } = await getMenuItems(token, selectedExternalMenuId, TARGET_ORGANIZATION_ID);
    if (!menuItems) {
        console.error(`DEBUG: Не удалось получить содержимое меню в serve: ${itemsError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить содержимое меню: ${itemsError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }
    console.log(`DEBUG: Получено ${menuItems.length} элементов меню.`);

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
    });
});