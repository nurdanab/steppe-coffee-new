// supabase/functions/export-to-sheets/index.ts
import { google } from "npm:googleapis";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://steppecoffee.kz',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID");
const RAW_CREDS = Deno.env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT");

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      console.log("Handling OPTIONS preflight request.");
      return new Response("ok", { 
        headers: corsHeaders,
        status: 200,
      });
    }

    console.log(`Received ${req.method} request.`);

    let requestBody: { action: string, data: any };
    try {
      const text = await req.text();
      console.log("Request body text received.");
      if (!text) {
        console.error("Received an empty request body.");
        return new Response(JSON.stringify({ error: "Empty request body" }), { 
          status: 400,
          headers: corsHeaders,
        });
      }
      requestBody = JSON.parse(text);
      console.log(`Successfully parsed JSON. Action: ${requestBody.action}`);
    } catch (e) {
      console.error("Ошибка парсинга тела запроса:", e.message);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { 
        status: 400,
        headers: corsHeaders,
      });
    }

    const { action, data } = requestBody;

    // --- Проверка секрета ---
    if (!RAW_CREDS) {
      console.error("GOOGLE_SHEETS_SERVICE_ACCOUNT not set.");
      return new Response(JSON.stringify({ error: "Missing Google service account credentials" }), { 
        status: 500,
        headers: corsHeaders,
      });
    }
    
    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(RAW_CREDS);
      console.log("Service account JSON parsed successfully.");
    } catch (e) {
      console.error("Invalid GOOGLE_SHEETS_SERVICE_ACCOUNT JSON:", e.message);
      return new Response(JSON.stringify({ error: "Invalid service account JSON" }), { 
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!SPREADSHEET_ID) {
      console.error("SPREADSHEET_ID is not set.");
      return new Response(JSON.stringify({ error: "SPREADSHEET_ID is not set" }), { 
        status: 500,
        headers: corsHeaders,
      });
    }

    // --- Авторизация Google API ---
    console.log("Attempting to authenticate with Google API.");
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    console.log("Authentication successful.");

    if (action === 'append') {
      const confirmedBookings = Array.isArray(data) ? data : [data];
      if (!confirmedBookings.length) {
        return new Response(JSON.stringify({ error: "No confirmed bookings to append" }), { 
          status: 400,
          headers: corsHeaders,
        });
      }

      const dataToExport = confirmedBookings.map((booking) => [
        booking.id, // Добавляем ID бронирования
        booking.booking_date,
        booking.start_time,
        booking.end_time,
        booking.selected_room,
        booking.num_people,
        booking.organizer_name,
        booking.event_name || "",
        booking.event_description || "",
        booking.organizer_contact || "",
        `'${booking.phone_number}`,
        booking.comments || "",
        booking.status,
      ]);
      console.log("Data to be exported:", dataToExport);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Подтвержденные бронирования!A:M", // Увеличиваем диапазон
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: dataToExport,
        },
      });
      console.log("Data successfully appended.");

      return new Response(JSON.stringify({ message: "Экспорт успешно завершен!" }), { 
        status: 200,
        headers: corsHeaders,
      });

    } else if (action === 'delete') {
      const bookingId = data.id;
      if (!bookingId) {
        return new Response(JSON.stringify({ error: "Missing booking ID for deletion" }), { 
          status: 400,
          headers: corsHeaders,
        });
      }

      console.log(`Attempting to delete booking with ID: ${bookingId}`);

      // Шаг 1: Читаем все данные из таблицы
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Подтвержденные бронирования!A:A", // Читаем только колонку с ID
      });
      
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === bookingId);
      
      if (rowIndex === -1) {
        console.warn(`Booking with ID ${bookingId} not found in the spreadsheet.`);
        return new Response(JSON.stringify({ message: "Бронирование не найдено в таблице." }), {
          status: 200,
          headers: corsHeaders,
        });
      }
      
      // Шаг 2: Удаляем строку
      const rowToDelete = rowIndex + 1; // Индексы Google Sheets начинаются с 1
      console.log(`Found booking at row ${rowToDelete}. Deleting...`);
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // ID листа, 0 - это первый лист
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });
      
      console.log("Row successfully deleted.");
      return new Response(JSON.stringify({ message: "Бронирование успешно удалено." }), {
        status: 200,
        headers: corsHeaders,
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action specified" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

  } catch (error) {
    console.error("Full Error Stack:", error.stack);
    console.error("Error Message:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: corsHeaders,
    });
  }
});