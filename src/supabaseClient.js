// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key are not defined in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchAllBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_date, start_time, end_time, status, num_people, comments');

  if (error) {
    console.error('Ошибка при получении всех бронирований:', error);
    return [];
  }
  console.log('Получены все бронирования:', data);
  return data;
}


export async function fetchMenuItems() {
  const { data, error } = await supabase
      .from('menu_items')
      .select('*');

  if (error) {
      console.error('Ошибка при получении меню:', error);
      return null;
  }

  return data;
}