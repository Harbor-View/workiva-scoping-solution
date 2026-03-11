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
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  // Try to find existing record
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("count, window_start")
    .eq("key", key)
    .single();

  if (!existing) {
    // First request — insert
    await supabase.from("rate_limits").insert({ key, count: 1, window_start: new Date().toISOString() });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Window expired — reset
  if (new Date(existing.window_start) < windowStart) {
    await supabase
      .from("rate_limits")
      .update({ count: 1, window_start: new Date().toISOString() })
      .eq("key", key);
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Within window — check limit
  if (existing.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  // Increment
  await supabase
    .from("rate_limits")
    .update({ count: existing.count + 1 })
    .eq("key", key);

  return { allowed: true, remaining: maxAttempts - existing.count - 1 };
}
