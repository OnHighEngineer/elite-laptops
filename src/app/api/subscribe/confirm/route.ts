import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { verifyToken } from "@/lib/security";
import { siteBase, unsubscribeUrl } from "@/lib/subscribe";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const secret = process.env.NEWSLETTER_SECRET ?? "";
  const claim = verifyToken(request.nextUrl.searchParams.get("token") ?? "", secret, "confirm");
  if (!claim || !adminConfigured()) return NextResponse.redirect(`${siteBase()}/?subscribed=invalid`);

  const admin = createAdminClient();
  const { data } = await admin.from("subscribers").select("status").eq("email", claim.email).maybeSingle();
  if (data && data.status === "pending") {
    await admin.from("subscribers").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("email", claim.email);
    await sendEmail(
      claim.email,
      "Welcome to Elite Laptops",
      `Thanks for subscribing. You will hear from us about new arrivals and offers.\n\nUnsubscribe any time: ${unsubscribeUrl(claim.email, secret)}`
    );
  }
  return NextResponse.redirect(`${siteBase()}/?subscribed=ok`);
}
