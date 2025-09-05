import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from 'npm:googleapis';

const SPREADSHEET_ID = Deno.env.get('SPREADSHEET_ID');

serve(async (req) => {
  try {
    const { confirmedBookings } = await req.json();

    if (!confirmedBookings) {
      return new Response(JSON.stringify({ error: 'Data is missing' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // --- ДОБАВЬ ЭТИ ДВЕ СТРОКИ ДЛЯ ОТЛАДКИ ---
    const serviceAccountJson = Deno.env.get('GOOGLE_SHEETS_SERVICE_ACCOUNT');
    console.log('Raw Service Account JSON:', serviceAccountJson);
    // ------------------------------------------

    const serviceAccountCredentials = JSON.parse(
      serviceAccountJson
    );

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Форматируем данные: первый массив - заголовки
    const dataToExport = [
      ['Дата', 'Время начала', 'Время зав', 'Зал', 'Человек', 'Организатор', 'Название события', 'Описание события', 'Контакты организации', 'Телефон', 'Комментарий', 'Статус'],
      ...confirmedBookings.map(booking => [
        booking.booking_date,
        booking.start_time,
        booking.end_time,
        booking.selected_room,
        booking.num_people,
        booking.organizer_name,
        booking.event_name || '',
        booking.event_description || '',
        booking.organizer_contact || '',
        booking.phone_number,
        booking.comments || '',
        booking.status
      ]),
    ];

    const range = 'Подтвержденные бронирования!A1';

    // Записываем данные в таблицу
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: dataToExport,
      },
    });

    return new Response(JSON.stringify({ message: 'Экспорт успешно завершен!' }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error('Ошибка при экспорте:', error.message);
    return new Response(JSON.stringify({ error: 'Ошибка сервера' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});