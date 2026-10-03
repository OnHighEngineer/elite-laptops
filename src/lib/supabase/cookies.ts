/**
 * The Supabase library sets the session cookie with httpOnly:false so its browser client can read it. This app
 * only touches the session on the server, so every auth cookie is locked down from page scripts. Only security
 * flags are overridden; lifetime and expiry pass through so sign-out (which clears the cookie) still works.
 */
export interface CookieOpts {
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
}

export function hardenCookie(options: CookieOpts = {}, nodeEnv: string | undefined = process.env.NODE_ENV) {
  return { ...options, httpOnly: true, secure: nodeEnv === "production", sameSite: "lax" as const };
}
