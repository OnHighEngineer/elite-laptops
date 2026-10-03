const COMMON = new Set([
  "password123", "password1234", "qwerty12345", "letmein1234", "welcome1234",
  "iloveyou123", "admin123456", "abc1234567", "1234567890a", "password1!",
]);

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null
    : "Please enter a valid email address.";
}

export function passwordProblems(pw: string): string[] {
  const p: string[] = [];
  if (pw.length < 10) p.push("Use at least 10 characters.");
  if (pw.length > 72) p.push("Use at most 72 characters.");
  if (!/[A-Z]/.test(pw)) p.push("Add an uppercase letter.");
  if (!/[a-z]/.test(pw)) p.push("Add a lowercase letter.");
  if (!/\d/.test(pw)) p.push("Add a number.");
  if (COMMON.has(pw.toLowerCase())) p.push("That password is too common.");
  return p;
}

/** 0 (empty) to 4 (strong). Display only; passwordProblems is the real gate. */
export function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(1, Math.min(4, score));
}

/** Only same-site relative paths are allowed as post-login redirects. */
export function safeNext(next: string | null | undefined): string {
  const fallback = "/account";
  if (!next || next.length > 500) return fallback;
  // Control characters and spaces: browsers strip tab/CR/LF inside URLs, turning "/\t/evil.com" into "//evil.com".
  if (/[\u0000-\u0020\u007f\\]/.test(next)) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  try {
    const u = new URL(next, "http://same.invalid");
    if (u.origin !== "http://same.invalid") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
