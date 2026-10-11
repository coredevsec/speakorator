import { supabase } from "./supabase";

export type SubscriptionAccessResult = {
  allowed: boolean;
  error: string | null;
  status: string | null;
};

export async function checkSubscriptionAccess(userId: string): Promise<SubscriptionAccessResult> {
  if (!supabase) {
    return { allowed: false, error: "Supabase is unavailable.", status: null };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { allowed: false, error: error.message, status: null };
  const status = typeof data?.status === "string" ? data.status.trim().toLowerCase() : null;
  return { allowed: status === "trialing" || status === "active", error: null, status };
}
