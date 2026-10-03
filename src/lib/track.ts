export type TrackType = "view" | "add_to_cart" | "share";

/** Fire-and-forget; never throws and never blocks the UI. */
export function track(productId: string, type: TrackType): void {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, type }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
