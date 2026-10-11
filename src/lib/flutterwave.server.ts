export type SubscriptionPlanKey = "weekly" | "monthly" | "yearly";

type ServerEnv = Record<string, string | undefined>;
type AuthenticatedUser = { id: string; email: string };

const serverEnv = (globalThis as { process?: { env?: ServerEnv } }).process?.env ?? {};

export const PLAN_DETAILS: Record<SubscriptionPlanKey, { amount: string; cents: number }> = {
  weekly: { amount: "2.99", cents: 299 },
  monthly: { amount: "5.99", cents: 599 },
  yearly: { amount: "71.88", cents: 7188 },
};

export function getPaymentEnv() {
  return {
    supabaseUrl: serverEnv["SUPABASE_URL"]?.trim().replace(/\/$/, "") ?? "",
    serviceRoleKey: serverEnv["SUPABASE_SERVICE_ROLE_KEY"]?.trim() ?? "",
    flutterwaveSecretKey: serverEnv["FLW_SECRET_KEY"]?.trim() ?? "",
    flutterwaveSecretHash: serverEnv["FLW_SECRET_HASH"]?.trim() ?? "",
    redirectUrl: serverEnv["FLW_REDIRECT_URL"]?.trim() ?? "",
    planIds: {
      weekly: serverEnv["FLW_WEEKLY_PLAN_ID"]?.trim() ?? "",
      monthly: serverEnv["FLW_MONTHLY_PLAN_ID"]?.trim() ?? "",
      yearly: serverEnv["FLW_YEARLY_PLAN_ID"]?.trim() ?? "",
    },
  };
}

export async function getAuthenticatedUser(
  request: Request,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<AuthenticatedUser | null> {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match?.[1]) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${match[1]}`,
    },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: unknown; email?: unknown };
  if (typeof user.id !== "string" || typeof user.email !== "string") return null;
  return { id: user.id, email: user.email };
}

export async function adminRest(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      ...init.headers,
    },
  });
}

export function isPlanKey(value: unknown): value is SubscriptionPlanKey {
  return value === "weekly" || value === "monthly" || value === "yearly";
}
