import { Check } from "lucide-react";
import { timeline, type FulfillmentStatus, type HistoryEntry } from "@/lib/fulfillment";

export function TrackingTimeline({
  status, history, courier, trackingNumber, trackingUrl,
}: {
  status: FulfillmentStatus;
  history: HistoryEntry[];
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}) {
  const steps = timeline(status, history);
  return (
    <section aria-labelledby="track-h" className="border border-[#E5E5E5] rounded-xl p-4 sm:p-5 space-y-4">
      <h2 id="track-h" className="font-semibold text-[#111111]">Order status</h2>
      <ol className="space-y-0">
        {steps.map((s, i) => (
          <li key={s.status} className="flex gap-3" aria-current={s.state === "current" ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                s.state === "upcoming" ? "border-[#E5E5E5] bg-white" : "border-[#111111] bg-[#111111]"
              }`}>
                {s.state !== "upcoming" && <Check className="h-3.5 w-3.5 text-white" aria-hidden />}
              </span>
              {i < steps.length - 1 && (
                <span className={`w-0.5 flex-1 min-h-6 ${steps[i + 1].state === "upcoming" ? "bg-[#E5E5E5]" : "bg-[#111111]"}`} />
              )}
            </div>
            <div className="pb-4">
              <p className={`text-sm ${s.state === "upcoming" ? "text-[#999999]" : "font-medium text-[#111111]"}`}>
                {s.label}
                {s.state === "current" && <span className="ml-2 text-xs font-normal text-[#666666]">(current)</span>}
              </p>
              {s.at && (
                <p className="text-xs text-[#666666]">
                  {new Date(s.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {courier && trackingNumber && (
        <div className="border-t border-[#E5E5E5] pt-4 text-sm space-y-1">
          <p><span className="text-[#666666]">Courier:</span> <span className="font-medium text-[#111111]">{courier}</span></p>
          <p className="break-all"><span className="text-[#666666]">Tracking number:</span> <span className="font-mono text-[#111111]">{trackingNumber}</span></p>
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center min-h-11 underline font-medium text-[#111111]">
              Track on the courier website
            </a>
          )}
        </div>
      )}
    </section>
  );
}
