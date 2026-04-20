import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("DITT-PROJEKT-ID") &&
  !supabaseAnonKey.includes("din-anon");

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
