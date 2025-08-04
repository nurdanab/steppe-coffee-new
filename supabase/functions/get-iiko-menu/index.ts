import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// --- КОНФИГУРАЦИЯ ---
const IIKO_API_BASE_URL = "https://api-ru.iiko.services";
const YOUR_API_KEY = Deno.env.get("IIKO_API_KEY");
const TARGET_ORGANIZATION_ID = Deno.env.get("IIKO_ORGANIZATION_ID");
const TARGET_MENU_NAME = Deno.env.get("IIKO_MENU_NAME") || "Steppe App Menu";

async function getAccessToken(apiKey: string | undefined): Promise<{ token: string | null; error: string | null }> {
    if (!apiKey) {
        return { token: null, error: "API Key не установлен." };
    }

    const url = `${IIKO_API_BASE_URL}/api/1/access_token`;
    const headers = { "Content-Type": "application/json" };
    const payload = { apiLogin: apiKey };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { token: null, error: `Ошибка HTTP: ${response.status} - ${errorText}` };
        }

        const tokenData = await response.json();
        const accessToken = tokenData.token;
        if (accessToken) {
            return { token: accessToken, error: null };
        } else {
            return { token: null, error: `Ошибка: В ответе нет токена. Ответ: ${JSON.stringify(tokenData)}` };
        }
    } catch (e: any) {
        return { token: null, error: `Ошибка при получении токена доступа: ${e.message}` };
    }
}

async function getExternalMenusList(accessToken: string, organizationId: string | undefined): Promise<{ menus: any[] | null; error: string | null }> {
    if (!organizationId) {
        return { menus: null, error: "Organization ID не указан." };
    }

    const url = `${IIKO_API_BASE_URL}/api/2/menu`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
    };
    const payload = { organizationId: organizationId };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { menus: null, error: `Ошибка HTTP: ${response.status} - ${errorText}` };
        }

        const menuListData = await response.json();
        const externalMenus = menuListData.externalMenus;
        if (Array.isArray(externalMenus)) {
            return { menus: externalMenus, error: null };
        } else {
            return { menus: null, error: `Ошибка: В ответе нет списка внешних меню или он пуст. Ответ: ${JSON.stringify(menuListData)}` };
        }
    } catch (e: any) {
        return { menus: null, error: `Ошибка при получении списка внешних меню: ${e.message}` };
    }
}

async function getMenuItems(accessToken: string, externalMenuId: string | undefined, organizationId: string | undefined): Promise<{ items: any[] | null; error: string | null }> {
    if (!externalMenuId) {
        return { items: null, error: "External Menu ID не указан." };
    }
    if (!organizationId) {
        return { items: null, error: "Organization ID не указан." };
    }

    const url = `${IIKO_API_BASE_URL}/api/2/menu/by_id`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
    };
    const payload = {
        externalMenuId: externalMenuId,
        organizationIds: [organizationId]
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { items: null, error: `Ошибка HTTP: ${response.status} - ${errorText}` };
        }

        const menuData = await response.json();
        const products = menuData.itemProducts;
        if (Array.isArray(products)) {
            return { items: products, error: null };
        } else {
            return { items: null, error: `Ошибка: В ответе нет списка блюд ('itemProducts') или он неверного формата. ${JSON.stringify(menuData)}` };
        }
    } catch (e: any) {
        return { items: null, error: `Ошибка при получении содержимого меню: ${e.message}` };
    }
}

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': 'https://steppecoffee.netlify.app',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders,
            status: 204
        });
    }

    const { token, error: tokenError } = await getAccessToken(YOUR_API_KEY); 
    if (!token) {
        return new Response(JSON.stringify({ error: `Не удалось получить токен доступа: ${tokenError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401
        });
    }

    if (!TARGET_ORGANIZATION_ID) {
         return new Response(JSON.stringify({ error: "ID целевой организации (IIKO_ORGANIZATION_ID) не установлен в секретах Supabase." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400
        });
    }

    const { menus: allExternalMenus, error: menusError } = await getExternalMenusList(token, TARGET_ORGANIZATION_ID);
    if (!allExternalMenus) {
        return new Response(JSON.stringify({ error: `Не удалось получить список внешних меню: ${menusError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }

    let selectedExternalMenuId: string | null = null;
    for (const menuInfo of allExternalMenus) {
        if (menuInfo.name === TARGET_MENU_NAME) {
            selectedExternalMenuId = menuInfo.id;
            break;
        }
    }

    if (!selectedExternalMenuId) {
        return new Response(JSON.stringify({ error: `Не найден ID для '${TARGET_MENU_NAME}' в списке внешних меню.` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404
        });
    }

    const { items: menuItems, error: itemsError } = await getMenuItems(token, selectedExternalMenuId, TARGET_ORGANIZATION_ID);
    if (!menuItems) {
        return new Response(JSON.stringify({ error: `Не удалось получить содержимое меню: ${itemsError}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }

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

    return new Response(JSON.stringify(formattedMenu), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
    });
});