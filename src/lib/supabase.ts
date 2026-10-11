import { createClient } from "@supabase/supabase-js";

const clientEnv = import.meta.env as Record<string, string | undefined>;
const supabaseUrl = clientEnv["VITE_SUPABASE_URL"]?.trim();
const supabaseAnonKey = clientEnv["VITE_SUPABASE_ANON_KEY"]?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
