import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { google } from "npm:googleapis";

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID");

serve(async (req) => {
  try {
    // Читаем тело запроса безопасно
    let confirmedBookings: any[] = [];
    try {
      const text = await req.text(); // читаем как текст
      if (text) {
        const parsed = JSON.parse(text);
        confirmedBookings = parsed.confirmedBookings || [];
      }
    } catch (parseErr) {
      console.error("Ошибка парсинга тела запроса:", parseErr.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!confirmedBookings || !Array.isArray(confirmedBookings) || confirmedBookings.length === 0) {
      return new Response(
        JSON.stringify({ error: "No confirmed bookings provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Проверка наличия секретов
    const rawCreds = Deno.env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT");
    if (!rawCreds) {
      console.error("GOOGLE_SHEETS_SERVICE_ACCOUNT not set");
      return new Response(
        JSON.stringify({ error: "Missing Google service account credentials" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(rawCreds);
    } catch (e) {
      console.error("Invalid GOOGLE_SHEETS_SERVICE_ACCOUNT JSON:", e.message);
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!SPREADSHEET_ID) {
      return new Response(
        JSON.stringify({ error: "SPREADSHEET_ID is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Авторизация
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Подготовка данных для экспорта
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

    const range = "Подтвержденные бронирования!A:L";

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: dataToExport,
      },
    });

    return new Response(
      JSON.stringify({ message: "Экспорт успешно завершен!" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Ошибка при экспорте:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
