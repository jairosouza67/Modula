import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usando Service Role Key se precisar por RPC ou bypass, mas como passaremos o Authorization, podemos usar Anon Key. Pela documentação Edge Functions pode precisar da service_role para evitar problemas em update.
    )

    // Pegamos o token do usuário que chamou a funcão
    const authHeader = req.headers.get('Authorization')!
    
    // Tenta obter o usuário validando o JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Não autorizado - ' + (authError?.message || 'Sem token válido'))

    const { title, type, duration_minutes, image_url } = await req.json()

    // Cálculo de XP
    let xp_earned = 50; // base
    if (image_url) xp_earned += 20;
    if (duration_minutes) {
      if (duration_minutes > 60) xp_earned += 50;
      else if (duration_minutes > 30) xp_earned += 30;
      xp_earned += duration_minutes; // 1 XP por min
    }

    const coins_earned = xp_earned;

    // Criar um client com o token do usuário para que o insert seja feito em nome do usuário e respeite o RLS
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Inserir checkin - O RLS valida se auth.uid() == user_id
    const { data: checkin, error: checkinError } = await userClient
      .from('checkins')
      .insert({
        user_id: user.id,
        title,
        type,
        duration_minutes,
        image_url,
        xp_earned,
        coins_earned
      })
      .select()
      .single()

    if (checkinError) throw checkinError;

    // Atualizar a user_stats
    const { data: stats, error: statsError } = await supabaseClient
      .from('user_stats')
      .select('total_xp, coins, level')
      .eq('user_id', user.id)
      .single()

    if (stats) {
      const newTotalXP = stats.total_xp + xp_earned;
      const newCoins = stats.coins + coins_earned;
      
      // Lógica de Level (básica)
      let newLevel = stats.level;
      if (newTotalXP > 1000 && newTotalXP <= 2500 && newLevel < 5) newLevel = 5; // Fase 2
      else if (newTotalXP > 2500 && newTotalXP <= 5000 && newLevel < 10) newLevel = 10; // Fase 3
      else if (newTotalXP > 5000 && newTotalXP <= 10000 && newLevel < 15) newLevel = 15; // Fase 4
      else if (newTotalXP > 10000 && newLevel < 20) newLevel = 20; // Fase 5

      const { error: updateError } = await supabaseClient
        .from('user_stats')
        .update({
           total_xp: newTotalXP,
           coins: newCoins,
           level: newLevel,
           checkins_count: supabaseClient.rpc('increment', {x: 1}) // fallback
        })
        .eq('user_id', user.id)

      if (updateError) {
        // Tenta sem RPC increment
        await supabaseClient.from('user_stats').update({
           total_xp: newTotalXP,
           coins: newCoins,
           level: newLevel
        }).eq('user_id', user.id)
      }
    }

    return new Response(
      JSON.stringify({ checkin, xp_earned, coins_earned }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
