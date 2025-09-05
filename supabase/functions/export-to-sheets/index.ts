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

// Function to check if a sheet exists and create it if it doesn't
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

  // Add headers to the new sheet
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

  // Format headers and freeze the top row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          // Freeze the first row
          updateSheetProperties: {
            properties: {
              sheetId: newSheetId,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          // Apply formatting to headers
          repeatCell: {
            range: {
              sheetId: newSheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: headers[0].length,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.1,
                  green: 0.8,
                  blue: 0.1,
                },
                textFormat: {
                  bold: true,
                  foregroundColor: {
                    red: 1.0,
                    green: 1.0,
                    blue: 1.0,
                  },
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
      ],
    },
  });
  console.log("Форматирование заголовков и заморозка строки успешно применены.");

  return newSheetId;
};

// Function to find a sheet ID by name
const findSheetIdByName = async (sheets, spreadsheetId, sheetName) => {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
};

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response("ok", { 
        headers: corsHeaders,
        status: 200,
      });
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { 
        status: 400,
        headers: corsHeaders,
      });
    }

    const { action, data } = requestBody;

    if (!RAW_CREDS || !SPREADSHEET_ID) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), { 
        status: 500,
        headers: corsHeaders,
      });
    }
    
    let serviceAccountCredentials;
    try {
      serviceAccountCredentials = JSON.parse(RAW_CREDS);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid service account JSON" }), { 
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
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

    if (action === 'append') {
      const confirmedBookings = Array.isArray(data) ? data : [data];
      if (!confirmedBookings.length) {
        return new Response(JSON.stringify({ error: "No confirmed bookings to append" }), { 
          status: 400,
          headers: corsHeaders,
        });
      }

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
          booking.id,
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
      const sheetId = await findSheetIdByName(sheets, SPREADSHEET_ID, sheetName);

      if (sheetId === null) {
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
      const rowIndex = rows.slice(1).findIndex(row => row && row[0] === bookingId);
      
      if (rowIndex === -1) {
        return new Response(JSON.stringify({ message: "Бронирование не найдено в таблице." }), {
          status: 200,
          headers: corsHeaders,
        });
      }
      
      const rowToDelete = rowIndex + 2;
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowToDelete - 1,
                  endIndex: rowToDelete,
                },
              },
            },
          ],
        },
      });
      
      const updatedSheetResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:A`,
      });

      const updatedRows = updatedSheetResponse.data.values || [];
      if (updatedRows.length === 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId: sheetId,
                },
              },
            ],
          },
        });
      }

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
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500,
      headers: corsHeaders,
    });
  }
});