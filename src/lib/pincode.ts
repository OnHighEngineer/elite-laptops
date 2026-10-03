export type PincodeCheck = "ok" | "not_found" | "state_mismatch" | "unavailable";

export function normalizeState(s: string): string {
  return s.trim().toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ");
}

// India Post still lists some regions under older or merged names.
const ALIASES: Record<string, string[]> = {
  puducherry: ["pondicherry"],
  ladakh: ["jammu and kashmir"],
  "jammu and kashmir": ["jammu and kashmir"],
  "andaman and nicobar islands": ["andaman and nicobar"],
  "dadra and nagar haveli and daman and diu": ["dadra and nagar haveli", "daman and diu"],
};

export function stateMatches(chosen: string, postStates: string[]): boolean {
  const c = normalizeState(chosen);
  const accepted = new Set([c, ...(ALIASES[c] ?? [])]);
  return postStates.some((s) => accepted.has(normalizeState(s)));
}

export type ParsedPincode = { ok: true; states: string[] } | { ok: false; reason: "not_found" | "unavailable" };

export function parsePincodeResponse(body: unknown): ParsedPincode {
  if (!Array.isArray(body) || body.length === 0 || typeof body[0] !== "object" || body[0] === null) {
    return { ok: false, reason: "unavailable" };
  }
  const first = body[0] as { Status?: unknown; PostOffice?: unknown };
  if (first.Status === "Success" && Array.isArray(first.PostOffice)) {
    const states = [...new Set((first.PostOffice as { State?: unknown }[]).map((p) => p?.State).filter((s): s is string => typeof s === "string"))];
    return states.length ? { ok: true, states } : { ok: false, reason: "not_found" };
  }
  if (first.Status === "Error" || first.Status === "404") return { ok: false, reason: "not_found" };
  return { ok: false, reason: "unavailable" };
}

/** `fetchJson` is injected so tests do not touch the network. */
export async function checkPincode(
  pincode: string,
  state: string,
  fetchJson: (url: string) => Promise<unknown> = defaultFetch
): Promise<PincodeCheck> {
  if (!/^[1-9]\d{5}$/.test(pincode)) return "not_found";
  let body: unknown;
  try {
    body = await fetchJson(`https://api.postalpincode.in/pincode/${pincode}`);
  } catch {
    return "unavailable";
  }
  const parsed = parsePincodeResponse(body);
  if (!parsed.ok) return parsed.reason;
  return stateMatches(state, parsed.states) ? "ok" : "state_mismatch";
}

async function defaultFetch(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(4000), cache: "no-store" });
  if (!res.ok) throw new Error("pincode lookup failed");
  return res.json();
}
