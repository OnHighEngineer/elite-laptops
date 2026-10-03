import { createHmac, timingSafeEqual } from "node:crypto";

/** Sliding-window limiter over a caller-supplied store. Per-instance memory: a speed bump, not a wall. */
export function allowRequest(
  store: Map<string, number[]>,
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): boolean {
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.every((t) => now - t >= windowMs)) store.delete(k);
  }
  return true;
}

/** Identify an image by its first bytes. The client-claimed type is never trusted. */
export function detectImageType(b: Uint8Array): "jpeg" | "png" | "gif" | "webp" | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) return "gif";
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export function isAdminEmail(email: string | undefined, list: string | undefined): boolean {
  if (!email || !list) return false;
  const e = email.trim().toLowerCase();
  return list
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .includes(e);
}

type Purpose = "confirm" | "unsubscribe";

/** Compact signed token: base64url(json).base64url(hmac). Expiry is in ms epoch. */
export function signToken(
  payload: { email: string; purpose: Purpose },
  secret: string,
  now: number = Date.now(),
  ttlMs: number = 7 * 24 * 3600 * 1000
): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: now + ttlMs })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(
  token: string,
  secret: string,
  purpose: Purpose,
  now: number = Date.now()
): { email: string } | null {
  if (!secret || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.purpose !== purpose || typeof data.email !== "string" || typeof data.exp !== "number") return null;
    if (now > data.exp) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}
