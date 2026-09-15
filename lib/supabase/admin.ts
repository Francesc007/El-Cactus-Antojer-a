import { setDefaultResultOrder } from "node:dns";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";
import { supabaseFetch } from "@/lib/supabase/fetch";

setDefaultResultOrder("ipv4first");

export function createAdminSupabaseClient() {
  const env = getServerEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: supabaseFetch,
    },
  });
}
