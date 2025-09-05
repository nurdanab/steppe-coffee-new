// supabase/functions/export-to-sheets/index.ts
import { google } from "npm:googleapis";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID");
const RAW_CREDS = Deno.env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT");

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      console.log("Handling OPTIONS preflight request.");
      return new Response("ok", { status: 200 });
    }

    console.log(`Received ${req.method} request.`);

    // --- Чтение тела запроса ---
    let confirmedBookings: any[] = [];
    try {
      const text = await req.text();
      console.log("Request body text received.");
      if (!text) {
        console.error("Received an empty request body.");
        return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400 });
      }
      const parsed = JSON.parse(text);
      confirmedBookings = parsed.confirmedBookings || [];
      console.log(`Successfully parsed JSON. Found ${confirmedBookings.length} bookings.`);
    } catch (e) {
      console.error("Ошибка парсинга тела запроса:", e.message);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    if (!confirmedBookings.length) {
      console.error("No confirmed bookings found in request body.");
      return new Response(JSON.stringify({ error: "No confirmed bookings" }), { status: 400 });
    }

    // --- Проверка секрета ---
    if (!RAW_CREDS) {
      console.error("GOOGLE_SHEETS_SERVICE_ACCOUNT not set.");
      return new Response(JSON.stringify({ error: "Missing Google service account credentials" }), { status: 500 });
    }
    
    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(RAW_CREDS);
      console.log("Service account JSON parsed successfully.");
    } catch (e) {
      console.error("Invalid GOOGLE_SHEETS_SERVICE_ACCOUNT JSON:", e.message);
      return new Response(JSON.stringify({ error: "Invalid service account JSON" }), { status: 500 });
    }

    if (!SPREADSHEET_ID) {
      console.error("SPREADSHEET_ID is not set.");
      return new Response(JSON.stringify({ error: "SPREADSHEET_ID is not set" }), { status: 500 });
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

    // --- Подготовка данных ---
    const dataToExport = confirmedBookings.map((booking) => [
      booking.booking_date,
      booking.start_time,
      booking.end_time,
      booking.selected_room,
      booking.num_people,
      booking.organizer_name,
      booking.event_name || "",
      booking.event_description || "",
      booking.organizer_contact || "",
      booking.phone_number,
      booking.comments || "",
      booking.status,
    ]);
    console.log("Data to be exported:", dataToExport);

    // --- Запись в таблицу ---
    console.log("Attempting to append data to the spreadsheet.");
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Подтвержденные бронирования!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: dataToExport,
      },
    });
    console.log("Data successfully appended.");

    return new Response(JSON.stringify({ message: "Экспорт успешно завершен!" }), { status: 200 });
  } catch (error) {
    console.error("Full Error Stack:", error.stack);
    console.error("Error Message:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});