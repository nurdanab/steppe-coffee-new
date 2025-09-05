// supabase/functions/export-to-sheets/index.ts
import { google } from "npm:googleapis";

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID");

export default async (req: Request): Promise<Response> => {
  try {
    console.log("Starting export-to-sheets function.");

    // --- Чтение тела запроса ---
    let confirmedBookings: any[] = [];
    try {
      const text = await req.text();
      console.log("Request body text:", text);
      if (text) {
        const parsed = JSON.parse(text);
        confirmedBookings = parsed.confirmedBookings || [];
      }
    } catch (e) {
      console.error("Ошибка парсинга тела запроса:", e.message);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!confirmedBookings.length) {
      console.error("No confirmed bookings received.");
      return new Response(JSON.stringify({ error: "No confirmed bookings" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`Received ${confirmedBookings.length} confirmed bookings.`);

    // --- Проверка секрета ---
    const rawCreds = Deno.env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT");
    if (!rawCreds) {
      console.error("GOOGLE_SHEETS_SERVICE_ACCOUNT not set");
      return new Response(
        JSON.stringify({ error: "Missing Google service account credentials" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    console.log("GOOGLE_SHEETS_SERVICE_ACCOUNT secret found.");

    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(rawCreds);
      // Логируем только часть данных, чтобы не раскрывать секретный ключ
      console.log(`Parsed service account JSON. Client email: ${serviceAccountCredentials.client_email}`);
    } catch (e) {
      console.error("Invalid GOOGLE_SHEETS_SERVICE_ACCOUNT JSON:", e.message);
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!SPREADSHEET_ID) {
      console.error("SPREADSHEET_ID is not set");
      return new Response(
        JSON.stringify({ error: "SPREADSHEET_ID is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    console.log(`SPREADSHEET_ID is set to: ${SPREADSHEET_ID}`);

    // --- Авторизация Google API ---
    console.log("Authenticating with Google API...");
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    console.log("Authentication successful. Creating sheets instance.");

    const sheets = google.sheets({ version: "v4", auth });

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
    console.log("Data prepared for export:", dataToExport);

    // --- Запись в таблицу ---
    console.log("Attempting to append data to the spreadsheet...");
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Подтвержденные бронирования!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: dataToExport,
      },
    });
    console.log("Data successfully appended to the spreadsheet.");

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
};