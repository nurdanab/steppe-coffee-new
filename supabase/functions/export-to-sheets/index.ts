// supabase/functions/export-to-sheets/index.ts
import { google } from "npm:googleapis";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DateTime } from "https://esm.sh/luxon@3.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://steppecoffee.kz',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SPREADSHEET_ID = Deno.env.get("SPREADSHEET_ID");
const RAW_CREDS = Deno.env.get("GOOGLE_SHEETS_SERVICE_ACCOUNT");

// Функция для проверки существования и создания листа
const ensureSheetExists = async (sheets, spreadsheetId, sheetName) => {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetsList = spreadsheet.data.sheets;
  
  const existingSheet = sheetsList.find(sheet => sheet.properties.title === sheetName);

  if (existingSheet) {
    console.log(`Лист "${sheetName}" уже существует. Возвращаем его ID.`);
    return existingSheet.properties.sheetId;
  }

  console.log(`Лист "${sheetName}" не найден. Создаем новый лист.`);
  const addSheetRequest = {
    requests: [{
      addSheet: {
        properties: {
          title: sheetName
        }
      }
    }]
  };
  
  const addSheetResponse = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: addSheetRequest,
  });

  const newSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
  console.log(`Новый лист "${sheetName}" создан с ID: ${newSheetId}`);

  // Добавляем заголовки на новый лист
  const headers = [
    ["ID бронирования", "Дата", "Время начала", "Время окончания", "Зал", "Кол-во человек", "Организатор", "Название события", "Описание события", "Контакты организации", "Телефон", "Комментарий", "Статус"]
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: headers
    },
  });
  console.log("Заголовки добавлены на новый лист.");

  return newSheetId;
};

// Функция для поиска ID листа по имени
const findSheetIdByName = async (sheets, spreadsheetId, sheetName) => {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
};

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

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountCredentials.client_email,
        private_key: serviceAccountCredentials.private_key.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    console.log("Authentication successful.");

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    if (action === 'append') {
      const confirmedBookings = Array.isArray(data) ? data : [data];
      if (!confirmedBookings.length) {
        return new Response(JSON.stringify({ error: "No confirmed bookings to append" }), { 
          status: 400,
          headers: corsHeaders,
        });
      }

      // Сортировка от новых к старым, как и было запрошено.
      confirmedBookings.sort((a, b) => {
        const dateA = DateTime.fromISO(`${a.booking_date}T${a.start_time}`);
        const dateB = DateTime.fromISO(`${b.booking_date}T${b.start_time}`);
        return dateB.toMillis() - dateA.toMillis();
      });

      const firstBookingDate = DateTime.fromISO(confirmedBookings[0].booking_date);
      const sheetName = `${monthNames[firstBookingDate.month - 1]} ${firstBookingDate.year}`;
      const sheetId = await ensureSheetExists(sheets, SPREADSHEET_ID, sheetName);
      
      const getRoomName = (roomKey) => {
        switch (roomKey) {
          case 'second_hall':
            return 'Второй зал';
          case 'summer_terrace':
            return 'Летник';
          default:
            return 'Неизвестный зал';
        }
      };
      
      const dataToExport = confirmedBookings.map((booking) => {
        const startTimeAlmaty = DateTime.fromISO(`${booking.booking_date}T${booking.start_time}`, { zone: 'utc' }).setZone('Asia/Almaty');
        const endTimeAlmaty = DateTime.fromISO(`${booking.booking_date}T${booking.end_time}`, { zone: 'utc' }).setZone('Asia/Almaty');
        
        return [
          booking.id, // Возвращаем ID бронирования
          booking.booking_date,
          startTimeAlmaty.toFormat('HH:mm'),
          endTimeAlmaty.toFormat('HH:mm'),
          getRoomName(booking.selected_room),
          booking.num_people,
          booking.organizer_name,
          booking.event_name || "",
          booking.event_description || "",
          booking.organizer_contact || "",
          `'${booking.phone_number}`,
          booking.comments || "",
          "Подтвержден",
        ];
      });
      
      console.log("Data to be exported:", dataToExport);
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: "ROWS",
                  startIndex: 1,
                  endIndex: dataToExport.length + 1,
                },
              },
            },
            {
              updateCells: {
                start: { sheetId: sheetId, rowIndex: 1, columnIndex: 0 },
                rows: dataToExport.map(row => ({
                  values: row.map(cell => {
                    if (typeof cell === 'number') {
                      return { userEnteredValue: { numberValue: cell } };
                    } else if (cell === null || cell === "") {
                      return { userEnteredValue: { stringValue: "" } };
                    } else {
                      return { userEnteredValue: { stringValue: cell.toString() } };
                    }
                  })
                })),
                fields: "userEnteredValue",
              },
            },
          ],
        },
      });
      console.log("Data successfully appended.");
      
      return new Response(JSON.stringify({ message: "Экспорт успешно завершен!" }), { 
        status: 200,
        headers: corsHeaders,
      });

    } else if (action === 'delete') {
      const bookingId = data.id;
      const bookingDate = data.booking_date;

      if (!bookingId || !bookingDate) {
        return new Response(JSON.stringify({ error: "Missing booking ID or date for deletion" }), { 
          status: 400,
          headers: corsHeaders,
        });
      }

      const bookingDateObj = DateTime.fromISO(bookingDate);
      const sheetName = `${monthNames[bookingDateObj.month - 1]} ${bookingDateObj.year}`;

      console.log(`Attempting to delete booking with ID: ${bookingId} from sheet "${sheetName}".`);
      const sheetId = await findSheetIdByName(sheets, SPREADSHEET_ID, sheetName);

      if (sheetId === null) {
        console.warn(`Sheet "${sheetName}" not found. Cannot delete booking.`);
        return new Response(JSON.stringify({ message: "Лист для данного бронирования не найден." }), {
          status: 200,
          headers: corsHeaders,
        });
      }
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:A`,
      });
      
      const rows = response.data.values || [];
      const rowIndex = rows.slice(1).findIndex(row => row[0] === bookingId);
      
      if (rowIndex === -1) {
        console.warn(`Booking with ID ${bookingId} not found in the spreadsheet.`);
        return new Response(JSON.stringify({ message: "Бронирование не найдено в таблице." }), {
          status: 200,
          headers: corsHeaders,
        });
      }
      
      const rowToDelete = rowIndex + 2;
      console.log(`Found booking at row ${rowToDelete}. Deleting...`);
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex + 1,
                  endIndex: rowIndex + 2,
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