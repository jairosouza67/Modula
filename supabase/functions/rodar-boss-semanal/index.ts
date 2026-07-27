import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Basic CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Process active bosses that ended
    const { data: expiredBosses, error: bError } = await supabaseClient
      .from("weekly_bosses")
      .select("*")
      .eq("status", "active")
      .lte("ends_at", new Date().toISOString());

    if (bError) throw bError;

    if (expiredBosses && expiredBosses.length > 0) {
      for (const boss of expiredBosses) {
        if (boss.current_hp <= 0) {
          // Boss Defeated by Group !
          await supabaseClient
            .from("weekly_bosses")
            .update({ status: "victorious" })
            .eq("id", boss.id);

          // Get participants to reward them 
          const { data: participants } = await supabaseClient
            .from("boss_damage_log")
            .select("user_id")
            .eq("boss_id", boss.id);

          if (participants) {
            const uniqueUsers = [...new Set(participants.map((p) => p.user_id))];
            
            for (const userId of uniqueUsers) {
              // Give rewards: +500 XP, +100 Coins, regenerate HP
              const { data: stats } = await supabaseClient
                .from("user_stats")
                .select("total_xp, coins, hp, max_hp")
                .eq("user_id", userId)
                .single();
              
              if (stats) {
                await supabaseClient
                  .from("user_stats")
                  .update({
                    total_xp: stats.total_xp + 500,
                    coins: stats.coins + 100,
                    hp: stats.max_hp
                  })
                  .eq("user_id", userId);
                
                // TODO: trigger level validation somehow, or leave it for next checkin
              }
            }
          }
        } else {
          // Boss not defeated! Penalty for group.
          await supabaseClient
            .from("weekly_bosses")
            .update({ status: "defeated" })
            .eq("id", boss.id);

          // Get all users in the group to punish them
          const { data: groupMembers } = await supabaseClient
            .from("user_groups") // Assuming a user_groups table exists or similar logic
            .select("user_id")
            .eq("group_id", boss.group_id);
          
          if (groupMembers) {
            for (const member of groupMembers) {
              await supabaseClient.rpc("aplicar_penalidade", { p_user_id: member.user_id });
            }
          }
        }
      }
    }

    // 2. Create new boss for groups that don't have an active one
    const { data: groups } = await supabaseClient.from("groups").select("id");
    
    if (groups) {
      for (const group of groups) {
        const { data: activeBoss } = await supabaseClient
          .from("weekly_bosses")
          .select("id")
          .eq("group_id", group.id)
          .eq("status", "active")
          .maybeSingle();
        
        if (!activeBoss) {
          // Create new boss
          const startsAt = new Date();
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + 7);
          
          await supabaseClient.from("weekly_bosses").insert({
            name: "Preguiça Suprema", // Can be randomized later
            hp: 5000, 
            current_hp: 5000,
            group_id: group.id,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            status: "active"
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ message: "Boss cycle executed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
