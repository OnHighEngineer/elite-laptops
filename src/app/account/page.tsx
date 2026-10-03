import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  if (!supabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  return (
    <AuthShell title="My account">
      <dl className="text-sm space-y-1">
        <dt className="text-[#666666]">Signed in as</dt>
        <dd className="font-medium text-[#111111] break-all">{user.email}</dd>
      </dl>
      <Link
        href="/orders"
        className="flex items-center justify-center w-full min-h-12 border border-[#E5E5E5] rounded-xl text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
      >
        My orders
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="w-full min-h-12 border border-[#E5E5E5] rounded-xl text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5] transition-colors"
        >
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
