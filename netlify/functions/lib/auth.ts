import { SupabaseClient } from "@supabase/supabase-js";
import type { HandlerEvent } from "@netlify/functions";

interface SessionInfo {
  leadId: string;
  email: string;
}

export async function validateSession(
  event: HandlerEvent,
  supabase: SupabaseClient
): Promise<SessionInfo | null> {
  const authHeader = event.headers["authorization"] ?? event.headers["Authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const { data, error } = await supabase
    .from("session_tokens")
    .select("lead_id, email, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) return null;

  if (new Date(data.expires_at) < new Date()) return null;

  return { leadId: data.lead_id, email: data.email };
}
