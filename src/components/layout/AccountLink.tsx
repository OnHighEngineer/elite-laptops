import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export async function AccountLink() {
  let signedIn = false;
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);
  }
  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className="flex items-center gap-2 min-h-11 px-3 rounded-full text-sm font-medium text-[#111111] hover:bg-[#F5F5F5] transition-colors"
      aria-label={signedIn ? "My account" : "Sign in"}
    >
      <User className="w-5 h-5" aria-hidden />
      <span className="hidden sm:inline">{signedIn ? "Account" : "Sign in"}</span>
    </Link>
  );
}
