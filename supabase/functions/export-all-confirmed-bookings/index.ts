// supabase/functions/export-all-confirmed-bookings/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { DateTime } from 'https://esm.sh/luxon@3.4.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://steppecoffee.kz',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Получаем все подтвержденные бронирования
    const { data: confirmedBookings, error: fetchError } = await supabaseClient
      .from('bookings')
      .select('*')
      .eq('status', 'confirmed')
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (fetchError) {
      console.error('Error fetching confirmed bookings:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error when fetching bookings' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!confirmedBookings || confirmedBookings.length === 0) {
      return new Response(JSON.stringify({ message: 'No confirmed bookings found to export.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${confirmedBookings.length} confirmed bookings.`);

    // 2. Группируем бронирования по месяцам
    const bookingsByMonth = confirmedBookings.reduce((acc, booking) => {
      const date = DateTime.fromISO(booking.booking_date);
      const monthYearKey = `${date.year}-${date.month}`;
      if (!acc[monthYearKey]) {
        acc[monthYearKey] = [];
      }
      acc[monthYearKey].push(booking);
      return acc;
    }, {});

    console.log(`Grouped bookings into ${Object.keys(bookingsByMonth).length} months.`);

    // 3. Отправляем каждую группу в функцию sheets для экспорта
    for (const monthYearKey in bookingsByMonth) {
      const bookingsForMonth = bookingsByMonth[monthYearKey];
      console.log(`Exporting ${bookingsForMonth.length} bookings for ${monthYearKey}...`);

      const { error: invokeError } = await supabaseClient.functions.invoke('export-to-sheets', {
        body: {
          action: 'append',
          data: bookingsForMonth,
        },
      });

      if (invokeError) {
        console.error(`Error invoking 'export-to-sheets' for ${monthYearKey}:`, invokeError);
      } else {
        console.log(`Successfully exported bookings for ${monthYearKey}.`);
      }
    }

    return new Response(JSON.stringify({ message: 'All confirmed bookings successfully exported.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});