import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAdmin } from "@/lib/admin-auth";
import { allowRequest, detectImageType } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

const MAX_BYTES = 5 * 1024 * 1024;
const hits = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  // Admin only: unauthenticated uploads would let anyone fill the storage quota.
  if (!supabaseConfigured()) return NextResponse.json({ error: "Not available." }, { status: 503 });
  if (!(await isAdmin())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!allowRequest(hits, user.id, 20, 60_000)) {
    return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!detectImageType(buffer)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF images are allowed." }, { status: 400 });
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || "elite_laptops_products",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
          format: "jpg",
          resource_type: "image",
          public_id: `product_${Date.now()}`,
        },
        (error, res) => (error || !res ? reject(error ?? new Error("upload failed")) : resolve(res))
      );
      stream.end(buffer);
    });

    return NextResponse.json({ success: true, url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
