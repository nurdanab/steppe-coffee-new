import requests
import json

# --- КОНФИГУРАЦИЯ ---
IIKO_API_BASE_URL = "https://api-ru.iiko.services"
YOUR_API_KEY = "18daf48217a048baadd62f23be3a5041"

def get_access_token(api_key):
    """
    Получает токен доступа из iiko Cloud API.
    """
    url = f"{IIKO_API_BASE_URL}/api/1/access_token"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "apiLogin": api_key
    }
    print(f"Попытка получить токен доступа от {url}...")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status() 
        token_data = response.json()
        access_token = token_data.get("token")
        if access_token:
            print("Токен доступа успешно получен.")
            return access_token
        else:
            print(f"Ошибка: В ответе нет токена. Ответ: {token_data}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при получении токена доступа: {e}")
        return None
# --- конец входа ---

# --- заведение ---

def get_organizations(access_token):
    """
    Получает список организаций, доступных для данного токена.
    """
    url = f"{IIKO_API_BASE_URL}/api/1/organizations"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    payload = {}
    print(f"Попытка получить список организаций от {url}...")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        full_response_data = response.json()

        organizations_list = full_response_data.get("organizations") 

        if organizations_list and isinstance(organizations_list, list):
            print("Список организаций успешно получен.")
            return organizations_list 
        else:
            print(f"Ошибка: В ответе нет списка организаций или он неверного формата. Ответ: {full_response_data}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при получении списка организаций: {e}")
        return None

# --- заведение конец ---

# --- список доступных внешних меню ---

def get_external_menus_list(access_token, organization_id):
    """
    Получает список доступных внешних меню для указанной организации.
    """
    url = f"{IIKO_API_BASE_URL}/api/2/menu" # Эндпоинт, который мы вызывали ранее и который возвращает список меню
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    payload = {
        "organizationId": organization_id # Здесь organizationId - singular, как в документации для этого эндпоинта
    }
    print(f"\nПопытка получить список внешних меню для организации {organization_id} от {url}...")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        menu_list_data = response.json()

        external_menus = menu_list_data.get("externalMenus")
        if external_menus and isinstance(external_menus, list):
            print("Список внешних меню успешно получен.")
            return external_menus
        else:
            print(f"Ошибка: В ответе нет списка внешних меню или он пуст. Ответ: {menu_list_data}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при получении списка внешних меню: {e}")
        return None

# --- список доступных внешних меню конец ---


# --- меню ---

def get_menu_items(access_token, external_menu_id, organization_id): # Теперь принимаем external_menu_id
    """
    Получает содержимое конкретного внешнего меню по его ID.
    """
    url = f"{IIKO_API_BASE_URL}/api/2/menu/by_id" # Новый эндпоинт!
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    payload = {
        "externalMenuId": external_menu_id, # Передаем ID внешнего меню
        "organizationIds": [organization_id] # Передаем ID организации как МАССИВ
    }
    print(f"\nПопытка получить содержимое меню {external_menu_id} для организации {organization_id} от {url}...")
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        menu_data = response.json()

        products = menu_data.get("itemProducts") 

        if products is not None and isinstance(products, list): # Проверяем, что itemProducts существует и является списком
            print(f"Содержимое меню успешно получено. Найдено {len(products)} блюд.")
            return products
        else:
            print(f"Ошибка: В ответе нет списка блюд ('itemProducts') или он неверного формата. Ответ: {menu_data}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Ошибка при получении содержимого меню: {e}")
        return None

# --- меню конец ---


# --- ЗАПУСК ---
if __name__ == "__main__":
    TARGET_ORGANIZATION_ID = "390df300-2520-4594-a7da-f4d87d2ea84a" 
    TARGET_MENU_NAME = "Steppe App Menu"

    token = get_access_token(YOUR_API_KEY)

    if token:
        print(f"\nВаш токен доступа: {token}\n")

        organizations = get_organizations(token)
        if organizations:
            print("Доступные организации:")
            for org in organizations:
                print(f"  - Имя: {org.get('name')}, ID: {org.get('id')}")
            print("\n")
        else:
            print("Не удалось получить список организаций.")

        if TARGET_ORGANIZATION_ID:

            all_external_menus = get_external_menus_list(token, TARGET_ORGANIZATION_ID)

            selected_external_menu_id = None
            if all_external_menus:
                print(f"Доступные внешние меню для {TARGET_ORGANIZATION_ID}:")
                for menu_info in all_external_menus:
                    print(f"  - Название: {menu_info.get('name')}, ID: {menu_info.get('id')}")
                    if menu_info.get('name') == TARGET_MENU_NAME:
                        selected_external_menu_id = menu_info.get('id')
                        print(f"  (Найден ID для '{TARGET_MENU_NAME}': {selected_external_menu_id})")
            else:
                print("Не удалось получить список внешних меню.")

            if selected_external_menu_id:

                menu_items = get_menu_items(token, selected_external_menu_id, TARGET_ORGANIZATION_ID)
                if menu_items:
                    print("\n--- Полученные элементы меню (первые 5 для примера) ---")
                    for item in menu_items[:5]: 
                        print(f"  Название: {item.get('name')}")
                        price_info = item.get('defaultPrice', {}) 
                        if not price_info and item.get('prices') and len(item['prices']) > 0:
                            price_info = item['prices'][0] 

                        print(f"  Цена: {price_info.get('currentPrice')} {price_info.get('currencyISOCode', '')}")
                        print(f"  Описание: {item.get('description', 'Нет описания')}")

                        categories = []
                        if item.get('productCategories'):
                            categories = [cat['name'] for cat in item['productCategories']]
                        elif item.get('parentGroup') and item['parentGroup'].get('name'):
                            categories = [item['parentGroup']['name']]

                        print(f"  Категории: {', '.join(categories) if categories else 'Нет категории'}")

                        image_ids = item.get('imageIds')
                        print(f"  ID изображения: {image_ids[0] if image_ids and len(image_ids) > 0 else 'Нет изображения'}")
                        print("-" * 30)
                    print(f"\nВсего получено блюд: {len(menu_items)}")
                    print("\nТеперь у вас есть данные о меню!")
                else:
                    print("Не удалось получить содержимое меню для указанного ID внешнего меню.")
            else:
                print(f"Не найден ID для '{TARGET_MENU_NAME}' в списке внешних меню.")
        else:
            print("ID целевой организации не указан. Невозможно получить меню.")

    else:
        print("Не удалось получить токен доступа. Проверьте API-ключ и подключение.")