# 📊 Open-Source Observability Guide for Elite Laptops

This guide provides a comprehensive evaluation, architectural decision, and step-by-step implementation plan for adding **free, open-source observability** (Tracing, Metrics, Error Monitoring, and Session Replay) to the **Elite Laptops** Next.js 16 application.

---

## 🎯 Executive Decision & Recommendation Matrix

For a Next.js 16 + Vercel + Supabase e-commerce application, the recommended observability architecture is divided by core operational needs:

| Observability Domain | Recommended Tool | License / Open-Source Status | Free Tier Quota | Why It's the Best Choice |
|---|---|---|---|---|
| **Full-Stack APM & Distributed Traces** | **[SigNoz](https://signoz.io)** | 100% Open Source (Apache 2.0) | 50 GB/mo Cloud Ingestion or **Unlimited Self-Hosted** | Native OpenTelemetry integration, traces server actions, API routes, and database queries without vendor lock-in. |
| **User Session Replay & Web Vitals** | **[PostHog](https://posthog.com)** | Open Source Core (MIT) | 1,000,000 events/mo + 15,000 session recordings/mo free forever | Visual session replays to inspect checkout drop-offs, automatic Web Vitals tracking (LCP, FID, CLS). |
| **Error & Exception Tracking** | **[Sentry](https://sentry.io)** / **[GlitchTip](https://glitchtip.com)** | Sentry (BSL/FSL) / GlitchTip (100% MIT Open Source) | 5,000 errors/mo free cloud | Instant stack traces, source map mapping, and real-time alert notifications for unhandled server crashes. |

---

## 🏆 Comparative Analysis of Open-Source Tools

### 1. SigNoz (Best Overall Open-Source APM)
- **Strengths**: Built natively on **OpenTelemetry** and ClickHouse. Combines traces, metrics, and logs in a unified UI. Can be self-hosted via Docker with 1 command or connected to SigNoz Cloud free tier.
- **Next.js Fit**: Uses Next.js native `instrumentation.ts` hook for seamless server-side tracing.

### 2. PostHog (Best for UX & Product Observability)
- **Strengths**: Massive free tier (1 million events/mo + 15k session recordings/mo). Gives real video-like session replays of user interactions in the cart and checkout funnel.
- **Next.js Fit**: React SDK (`posthog-js`) integrates with 5 lines of code.

### 3. Sentry / GlitchTip (Best for Dedicated Crash Monitoring)
- **Strengths**: Comprehensive stack traces for React hydration errors, API route crashes, and unhandled server action exceptions. GlitchTip is a lightweight, 100% open-source Sentry API-compatible drop-in alternative.
- **Next.js Fit**: Official `@sentry/nextjs` package with automated source-map uploading.

---

## 🚀 Setup Guide Option A: SigNoz (OpenTelemetry APM)

SigNoz uses standard OpenTelemetry instrumentation in Next.js.

### Step 1: Install OpenTelemetry Dependencies
```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
```

### Step 2: Configure Next.js Instrumentation
Enable experimental instrumentation in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // ... rest of config
};
```

Create `instrumentation.ts` in your root or `src/` folder:

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: process.env.SIGNOZ_INGESTION_URL || "https://ingest.in.signoz.cloud:443/v1/traces",
        headers: {
          "signoz-access-token": process.env.SIGNOZ_ACCESS_TOKEN || "",
        },
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
  }
}
```

### Step 3: Set Environment Variables
Add to `.env.local` and Vercel Environment Variables:
```env
SIGNOZ_INGESTION_URL=https://ingest.in.signoz.cloud:443/v1/traces
SIGNOZ_ACCESS_TOKEN=your_signoz_ingestion_key
```

---

## 🚀 Setup Guide Option B: PostHog (Session Replay & Web Vitals)

### Step 1: Install PostHog SDK
```bash
npm install posthog-js
```

### Step 2: Create PostHog Provider
Create `src/components/providers/PostHogProvider.tsx`:

```typescript
"use client";

import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { useEffect } from "react";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    session_recording: {
      maskAllInputs: true, // Privacy compliant
    },
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={posthog}>{children}</Provider>;
}
```

### Step 3: Wrap Layout
In `src/app/layout.tsx`:

```typescript
import { PostHogProvider } from "@/components/providers/PostHogProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
```

---

## 🚀 Setup Guide Option C: Sentry / GlitchTip (Error Monitoring)

### Step 1: Run Automatic Sentry Wizard
```bash
npx @sentry/wizard@latest -i nextjs
```
This automatically configures `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and `next.config.ts`.

### Step 2: GlitchTip Self-Hosted Drop-in Alternative
If using self-hosted GlitchTip instead of Sentry Cloud, set the `NEXT_PUBLIC_SENTRY_DSN` in your `.env.local` to point to your GlitchTip instance DSN:
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-glitchtip-instance.com/1
```

---

## 🔒 Content Security Policy (CSP) Updates

When using external observability telemetry endpoints, update `next.config.ts` to allow connections under `connect-src`:

```typescript
// next.config.ts
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://app.posthog.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://*.razorpay.com https://app.posthog.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://ingest.in.signoz.cloud https://app.posthog.com https://*.ingest.sentry.io",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
].join("; ");
```

---

## ✅ Observability Verification Checklist

- [ ] **Telemetry Connection**: Verify OpenTelemetry traces or PostHog events reach the dashboard.
- [ ] **Session Replay Privacy**: Ensure sensitive user inputs (passwords, payment fields) are masked.
- [ ] **Error Tracing**: Trigger a test server error to verify exception capture and stack trace resolution.
- [ ] **CSP Compliance**: Verify browser console shows zero Content Security Policy connection errors.
