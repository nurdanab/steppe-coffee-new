import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from 'npm:googleapis';

const SPREADSHEET_ID = Deno.env.get('SPREADSHEET_ID'); 
serve(async (req) => {
  try {
    const { confirmedBookings } = await req.json();

    if (!confirmedBookings || !Array.isArray(confirmedBookings) || confirmedBookings.length === 0) {
      return new Response(JSON.stringify({ error: 'Data is missing or empty' }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const serviceAccountCredentials = JSON.parse(
      Deno.env.get('GOOGLE_SHEETS_SERVICE_ACCOUNT')
    );

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Мы будем добавлять данные, поэтому заголовки нам не нужны каждый раз
    const dataToExport = confirmedBookings.map(booking => [
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
    ]);

    const range = 'Подтвержденные бронирования!A:L'; // A:L это столбец с данными, который ты хочешь записывать

    // Записываем данные в таблицу, добавляя их в конец
    await sheets.spreadsheets.values.append({
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