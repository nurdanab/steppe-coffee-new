import requests
import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Загружаем переменные окружения из файла .env
load_dotenv()

# --- КОНФИГУРАЦИЯ ---
IIKO_API_URL = os.getenv("IIKO_API_URL")
YOUR_API_KEY = os.getenv("IIKO_API_KEY")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

class IikoApiClient:
    def __init__(self, api_key, base_url):
        if not api_key:
            raise ValueError("API-ключ не может быть пустым. Установите IIKO_API_KEY в .env файле.")
        self.api_key = api_key
        self.base_url = base_url
        self.access_token = None

    def get_access_token(self):
        url = f"{self.base_url}/api/1/access_token"
        payload = {"apiLogin": self.api_key}
        headers = {"Content-Type": "application/json"}
        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            token_data = response.json()
            token = token_data.get("token")
            if token:
                self.access_token = token
                print("Токен доступа успешно получен.")
                return True
            else:
                print(f"Ошибка: В ответе нет токена. Ответ: {token_data}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при получении токена доступа: {e}")
            return False

    def _make_post_request(self, endpoint, payload):
        if not self.access_token:
            print("Ошибка: Нет токена доступа. Сначала вызовите get_access_token().")
            return None
        url = f"{self.base_url}/{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.access_token}",
            "Accept-Encoding": "identity"
        }
        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при запросе к {url}: {e}")
            return None

    def get_organizations(self):
        endpoint = "api/1/organizations"
        payload = {}
        data = self._make_post_request(endpoint, payload)
        if data and isinstance(data.get("organizations"), list):
            print("Список организаций успешно получен.")
            return data["organizations"]
        print(f"Ошибка: Не удалось получить список организаций. Ответ: {data}")
        return None

    def get_external_menus_list(self, organization_id):
        endpoint = "api/2/menu"
        payload = {"organizationId": organization_id}
        data = self._make_post_request(endpoint, payload)
        if data and isinstance(data.get("externalMenus"), list):
            print("Список внешних меню успешно получен.")
            return data["externalMenus"]
        print(f"Ошибка: Не удалось получить список внешних меню. Ответ: {data}")
        return None

    def get_menu_items_from_external_menu(self, external_menu_id, organization_id):
        endpoint = "api/2/menu/by_id"
        payload = {
            "externalMenuId": external_menu_id,
            "organizationIds": [organization_id]
        }
        data = self._make_post_request(endpoint, payload)
        
        # Новый код для правильной обработки ответа
        if data and isinstance(data.get('itemCategories'), list):
            all_items = []
            for category in data['itemCategories']:
                if isinstance(category.get('items'), list):
                    for item in category['items']:
                        # Добавляем название категории
                        item['categoryName'] = category.get('name')
                        all_items.append(item)
            if all_items:
                print(f"Содержимое меню успешно получено. Найдено {len(all_items)} блюд.")
                return all_items
            else:
                print("Ошибка: В меню нет блюд.")
                return None
        
        print(f"Ошибка: Не удалось получить содержимое меню. Ответ: {data}")
        return None

def upload_menu_items_to_supabase(menu_items_data):
    """
    Загружает данные о меню в таблицу Supabase.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Ошибка: Ключи Supabase не найдены в .env файле.")
        return
        
    print("\n--- Загрузка данных в Supabase ---")
    try:
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        print(f"Используемый Supabase URL: {SUPABASE_URL}")
        
        print("Попытка очистить таблицу 'menu_items'...")
        
        delete_response = supabase_client.table('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        
        if delete_response.data:
            print("Старые данные из таблицы 'menu_items' удалены.")
        elif hasattr(delete_response, 'error') and delete_response.error:
            print(f"Ошибка при удалении старых данных: {delete_response.error}")
            return
        else:
            print("Старые данные из таблицы 'menu_items' удалены, или таблица была пуста.")


        data_to_insert = []
        for item in menu_items_data:
            item_id = item.get('itemId')
            if not item_id:
                print(f"Предупреждение: Блюдо '{item.get('name', 'без названия')}' не будет загружено из-за отсутствия ID.")
                continue

            price_value = None
            
            # Улучшенная логика поиска цены
            if item.get('itemSizes') and len(item['itemSizes']) > 0:
                item_size = item['itemSizes'][0]
                if item_size.get('prices') and len(item_size['prices']) > 0:
                    price_value = item_size['prices'][0].get('price')
            
            if price_value is None:
                # Если цена не найдена в itemSizes, пробуем старый способ
                if item.get('defaultPrice', {}).get('currentPrice') is not None:
                    price_value = item['defaultPrice']['currentPrice']
                elif item.get('prices') and len(item['prices']) > 0 and item['prices'][0].get('price') is not None:
                    price_value = item['prices'][0]['price']
            
            if price_value is not None:
                try:
                    price_value = float(price_value)
                except (ValueError, TypeError):
                    price_value = None

            categories = []
            if item.get('categoryName'):
                categories.append(item['categoryName'])
            
            image_id = None
            if item.get('buttonImageUrl'):
                image_url = item['buttonImageUrl']
                image_id_part = image_url.split('imageId=')[-1]
                if image_id_part:
                    image_id = image_id_part.split('.')[0]
            elif item.get('itemSizes') and item['itemSizes'][0].get('buttonImageUrl'):
                 image_url = item['itemSizes'][0]['buttonImageUrl']
                 image_id_part = image_url.split('imageId=')[-1]
                 if image_id_part:
                    image_id = image_id_part.split('.')[0]
            elif item.get('imageIds', [None])[0]:
                image_id = item['imageIds'][0]

            data_to_insert.append({
                'iiko_id': item_id,
                'name': item.get('name'),
                'description': item.get('description'),
                'price': price_value,
                'image_id': image_id,
                'categories': categories
            })
        
        print(f"Подготовлено для вставки {len(data_to_insert)} блюд.")
        if data_to_insert:
            print("Пример первого элемента для вставки:", data_to_insert[0])

        response = supabase_client.table('menu_items').insert(data_to_insert).execute()
        
        if response.data:
            print(f"Успешно загружено {len(response.data)} блюд в Supabase!")
        elif hasattr(response, 'error') and response.error:
            print(f"Ошибка при загрузке данных: {response.error}")
            return
        else:
            print("Вставка прошла успешно, но ответ не содержит данных.")
        
    except Exception as e:
        print(f"Неожиданная ошибка при работе с Supabase: {e}")

# --- ЗАПУСК ---
if __name__ == "__main__":
    TARGET_ORGANIZATION_ID = os.getenv("TARGET_ORGANIZATION_ID")
    TARGET_MENU_NAME = os.getenv("TARGET_MENU_NAME")
    
    iiko_client = IikoApiClient(YOUR_API_KEY, IIKO_API_URL)
    
    if iiko_client.get_access_token():
        organizations = iiko_client.get_organizations()
        
        if TARGET_ORGANIZATION_ID:
            all_external_menus = iiko_client.get_external_menus_list(TARGET_ORGANIZATION_ID)

            selected_external_menu_id = None
            if all_external_menus:
                for menu_info in all_external_menus:
                    if menu_info.get('name') == TARGET_MENU_NAME:
                        selected_external_menu_id = menu_info.get('id')
                        print(f"(Найден ID для '{TARGET_MENU_NAME}': {selected_external_menu_id})")
            
            if selected_external_menu_id:
                menu_items = iiko_client.get_menu_items_from_external_menu(selected_external_menu_id, TARGET_ORGANIZATION_ID)
                if menu_items:
                    upload_menu_items_to_supabase(menu_items)
                else:
                    print("Не удалось получить содержимое меню.")
            else:
                print(f"Не найден ID для '{TARGET_MENU_NAME}'.")
        else:
            print("ID целевой организации не указан.")

    else:
        print("Не удалось получить токен доступа.")