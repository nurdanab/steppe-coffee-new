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

// ... (функции getAccessToken, getExternalMenusList остаются без изменений) ...

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
        ...COMMON_HEADERS,
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

        let allProducts: any[] = [];
        if (Array.isArray(menuData.itemCategories)) {
            for (const category of menuData.itemCategories) {
                if (Array.isArray(category.products)) {
                    allProducts = allProducts.concat(category.products);
                }
            }
        }

        if (allProducts.length > 0) {
            console.log(`DEBUG: Найдено ${allProducts.length} блюд в меню.`);
            return { items: allProducts, error: null };
        } else {
            console.error(`DEBUG: Список блюд пуст или не найден в категориях: ${JSON.stringify(menuData)}`);
            return { items: [], error: `Ошибка: В ответе нет списка блюд в категориях или он пуст. ${JSON.stringify(menuData)}` };
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
    // Важно: если getMenuItems вернул пустой массив (items: []), это не ошибка
    if (itemsError) { // Проверяем только наличие ошибки, а не то, что items === null
        console.error(`DEBUG: Не удалось получить содержимое меню в serve: ${itemsError}`);
        return new Response(JSON.stringify({ error: `Не удалось получить содержимое меню: ${itemsError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }
    console.log(`DEBUG: Получено ${menuItems ? menuItems.length : 0} элементов меню.`);


    const formattedMenu = menuItems.map((item: any) => { // Убедимся, что menuItems не null/undefined
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