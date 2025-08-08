// supabase/functions/book-table/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { DateTime, Interval } from 'https://esm.sh/luxon@3.4.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
        organizer_name, 
        booking_date, 
        start_time, 
        end_time, 
        num_people, 
        comments,
        user_id,
        selected_room,
        event_name,
        event_description,
        organizer_contact
    } = await req.json();

    if (!organizer_name || !booking_date || !start_time || !end_time || !num_people || !selected_room) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );
    
    const proposedBookingStart = DateTime.fromISO(`${booking_date}T${start_time}`);
    const proposedBookingEnd = DateTime.fromISO(`${booking_date}T${end_time}`);
    const cleanupTimeHours = 1;
    const cleanupMinutes = cleanupTimeHours * 60;
    
    const { data: existingBookings, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('start_time, end_time, status')
      .eq('booking_date', booking_date)
      .eq('selected_room', selected_room)
      .in('status', ['pending', 'confirmed']);

    if (fetchError) {
      console.error('Error fetching existing bookings:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error when checking availability' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    let hasConfirmedConflict = false;
    let hasPendingConflict = false;

    for (const booking of existingBookings) {
        const existingBookingStart = DateTime.fromISO(`${booking_date}T${booking.start_time}`);
        const existingBookingEnd = DateTime.fromISO(`${booking_date}T${booking.end_time}`);

        // Занятый интервал = время брони + время на уборку ПОСЛЕ
        const occupiedEnd = existingBookingEnd.plus({ minutes: cleanupMinutes });
        const occupiedInterval = Interval.fromDateTimes(existingBookingStart, occupiedEnd);
        
        const proposedInterval = Interval.fromDateTimes(proposedBookingStart, proposedBookingEnd);
        
        if (proposedInterval.overlaps(occupiedInterval) || occupiedInterval.contains(proposedInterval)) {
            if (booking.status === 'confirmed') {
                hasConfirmedConflict = true;
                break;
            }
            if (booking.status === 'pending') {
                hasPendingConflict = true;
            }
        }
    }

    if (hasConfirmedConflict) {
      return new Response(JSON.stringify({ error: 'Selected room is already booked by a confirmed reservation.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }
    
    let statusToSet = 'pending';
    if (hasPendingConflict) {
        statusToSet = 'queued';
    }

    const { data: newBooking, error: insertError } = await supabaseClient
      .from('bookings')
      .insert({
        organizer_name,
        booking_date,
        start_time,
        end_time,
        num_people: num_people,
        comments: comments || null,
        user_id: user_id || null,
        selected_room: selected_room,
        event_name: event_name || null,
        event_description: event_description || null,
        organizer_contact: organizer_contact || null,
        status: statusToSet,
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

    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const message = `
        ⚡️ НОВАЯ БРОНЬ ⚡️
        Организатор: ${organizer_name}
        Дата: ${booking_date}
        Время: с ${start_time} до ${end_time}
        Зал: ${selected_room}
        Количество мест: ${num_people}
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