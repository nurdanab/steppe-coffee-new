// supabase/functions/export-to-sheets/index.ts
import { google } from "npm:googleapis";

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID");

function handleCORS(req: Request): Response {
  const headers = {
    'Access-Control-Allow-Origin': 'https://steppecoffee.kz', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: headers });
  }

  return new Response(null, { headers: headers });
}

export default async (req: Request): Promise<Response> => {
  const corsResponse = handleCORS(req);
  if (req.method === 'OPTIONS') {
    return corsResponse;
  }

  try {
    // --- Чтение тела запроса ---
    let confirmedBookings: any[] = [];
    try {
      const text = await req.text();
      if (text) {
        const parsed = JSON.parse(text);
        confirmedBookings = parsed.confirmedBookings || [];
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsResponse.headers },
      });
    }

    if (!confirmedBookings.length) {
      return new Response(JSON.stringify({ error: "No confirmed bookings" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsResponse.headers },
      });
    }

    // --- Проверка секрета ---
    const rawCreds = Deno.env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT");
    if (!rawCreds) {
      return new Response(
        JSON.stringify({ error: "Missing Google service account credentials" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsResponse.headers } },
      );
    }

    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(rawCreds);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid service account JSON" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsResponse.headers } },
      );
    }

    if (!SPREADSHEET_ID) {
      return new Response(
        JSON.stringify({ error: "SPREADSHEET_ID is not set" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsResponse.headers } },
      );
    }

    // --- Авторизация Google API ---
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

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

    // --- Запись в таблицу ---
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Подтвержденные бронирования!A:L",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: dataToExport,
      },
    });

    return new Response(
      JSON.stringify({ message: "Экспорт успешно завершен!" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsResponse.headers } },
    );
  } catch (error) {
    console.error("Ошибка при экспорте:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsResponse.headers } },
    );
  }
};