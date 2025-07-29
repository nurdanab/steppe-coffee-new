// supabase/functions/book-table/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// import { corsHeaders } from '../_shared/cors.ts' // УБИРАЕМ ЭТУ СТРОКУ

// Вставляем corsHeaders прямо сюда
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Общее количество мест в кофейне
const TOTAL_SEATS = 36; // Убедись, что это правильное количество мест

serve(async (req) => {
  // Обработка CORS-запросов (предварительных OPTIONS-запросов)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organizer_name, booking_date, start_time, end_time, num_guests, comments } = await req.json();

    // Базовая валидация входных данных
    if (!organizer_name || !booking_date || !start_time || !end_time || !num_guests) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (num_guests <= 0 || num_guests > TOTAL_SEATS) {
        return new Response(JSON.stringify({ error: `Number of guests must be between 1 and ${TOTAL_SEATS}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // Создаем клиент Supabase для взаимодействия с базой данных
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // 1. Проверяем доступность мест
    const { data: existingBookings, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('num_guests')
      .eq('booking_date', booking_date)
      .overlaps('start_time', 'end_time', start_time, end_time)
      .in('status', ['pending', 'confirmed']);

    if (fetchError) {
      console.error('Error fetching existing bookings:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error when checking availability' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const bookedSeats = existingBookings.reduce((sum, booking) => sum + booking.num_guests, 0);
    const availableSeats = TOTAL_SEATS - bookedSeats;

    if (num_guests > availableSeats) {
      return new Response(JSON.stringify({ error: `Not enough seats available. Only ${availableSeats} seats left.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }

    // 2. Создаем новую запись бронирования
    const { data: newBooking, error: insertError } = await supabaseClient
      .from('bookings')
      .insert({
        organizer_name,
        booking_date,
        start_time,
        end_time,
        num_guests,
        comments: comments || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting new booking:', insertError);
      return new Response(JSON.stringify({ error: 'Database error when creating booking' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 3. Отправляем уведомление в Telegram
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const message = `
        ⚡️ НОВАЯ БРОНЬ ⚡️
        Организатор: ${organizer_name}
        Дата: ${booking_date}
        Время: с ${start_time} до ${end_time}
        Количество мест: ${num_guests}
        ${comments ? `Комментарии: ${comments}` : ''}

        id брони: ${newBooking.id}
        Статус: ${newBooking.status}
      `;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message.trim(),
          parse_mode: 'HTML',
        }),
      });
    } else {
      console.warn('Telegram bot token or chat ID not set. Skipping Telegram notification.');
    }

    // Возвращаем успешный ответ
    return new Response(JSON.stringify({ success: true, booking: newBooking }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});