import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/security";
import { siteBase } from "@/lib/subscribe";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = process.env.NEWSLETTER_SECRET ?? "";
  const claim = verifyToken(request.nextUrl.searchParams.get("token") ?? "", secret, "unsubscribe");
  if (!claim || !adminConfigured()) return NextResponse.redirect(`${siteBase()}/?subscribed=invalid`);
  await createAdminClient().from("subscribers").update({ status: "unsubscribed" }).eq("email", claim.email);
  return NextResponse.redirect(`${siteBase()}/?subscribed=off`);
}
