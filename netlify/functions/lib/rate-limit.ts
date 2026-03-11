import { SupabaseClient } from "@supabase/supabase-js";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  key: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_minutes: windowMinutes,
  });

  if (error || !data?.[0]) {
    // Fail open — don't block legitimate users if RPC fails
    console.error("Rate limit RPC error:", error);
    return { allowed: true, remaining: maxAttempts };
  }

  return { allowed: data[0].allowed, remaining: data[0].remaining };
}
