// supabase/functions/_shared/cors.ts
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // В продакшене лучше указать конкретный домен твоего сайта
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };