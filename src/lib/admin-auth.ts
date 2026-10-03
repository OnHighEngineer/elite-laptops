import { isAdminEmail } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

/** Server-only. True only for the single configured admin account. Fails closed on any problem. */
export async function isAdmin(): Promise<boolean> {
  if (!supabaseConfigured() || !process.env.ADMIN_EMAIL) return false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return isAdminEmail(user?.email, process.env.ADMIN_EMAIL);
  } catch {
    return false;
  }
}
