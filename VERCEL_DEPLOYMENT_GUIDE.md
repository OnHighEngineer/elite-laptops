# 🚀 Vercel Deployment Guide & Security Architecture for Elite Laptops

This guide provides a clean, step-by-step walkthrough to deploy the **Elite Laptops** Next.js application to **Vercel** on the **Free Tier** (Supabase Free, Razorpay Test/Free, Vercel Hobby), along with a complete **Security & Google SSO Setup Guide**.

---

## 📋 Table of Contents
1. [Prerequisites](#-1-prerequisites)
2. [Step 1: Push Code to GitHub](#-step-1-push-code-to-github)
3. [Step 2: Import Project into Vercel](#-step-2-import-project-into-vercel)
4. [Step 3: Configure Environment Variables](#-step-3-configure-environment-variables)
5. [Step 4: Post-Deployment Setup & Webhooks](#-step-4-post-deployment-setup--webhooks)
6. [Step 5: Google SSO Setup Guide](#-step-5-google-sso-setup-guide)
7. [Step 6: Security Architecture & Free-Tier Defense](#-step-6-security-architecture--free-tier-defense)
8. [Step 7: Alternative CLI Deployment Method](#-step-7-alternative-cli-deployment-method)
9. [Verification & Troubleshooting Checklist](#-verification--troubleshooting-checklist)

---

## 🛠 1. Prerequisites

Before deploying to Vercel, ensure you have:
- A [GitHub](https://github.com) repository containing your latest source code.
- A [Vercel](https://vercel.com) account (Free Hobby Plan).
- **Supabase** project setup (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Razorpay** account (Test or Live API Keys & Webhook Secret).
- **Cloudinary** account (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- **Resend** account (`RESEND_API_KEY`, `EMAIL_FROM`, `STORE_NOTIFY_EMAIL`).

---

## 🐙 Step 1: Push Code to GitHub

Make sure all your local changes are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Prepare repository for Vercel deployment and security audit"
git push origin main
```

---

## 🌐 Step 2: Import Project into Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click the **"Add New..."** button in the top right and select **"Project"**.
3. Under **Import Git Repository**, select your `elite-laptops` repository and click **"Import"**.
4. Configure the Framework and Build Settings:
   - **Framework Preset**: `Next.js` (automatically detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `cross-env NODE_OPTIONS=--max-old-space-size=4096 next build` (or leave as `npm run build`)
   - **Output Directory**: `.next` (automatically detected)

---

## 🔐 Step 3: Configure Environment Variables

Before clicking **Deploy**, expand the **"Environment Variables"** section in Vercel. Add all the required variables listed below:

### 🌐 Public Variables (Accessible in Browser)
| Variable Name | Description / Source | Example Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your production domain (REQUIRED for emails) | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (Settings -> API) | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Public Key (Settings -> API) | `eyJhbGci...` |

### 🔒 Secret Server Variables (SERVER ONLY - Never prefix with `NEXT_PUBLIC_`)
| Variable Name | Description / Source | Example Value |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (Settings -> API) | `eyJhbGci...` |
| `ADMIN_EMAIL` | Sole admin email address with access to `/admin` | `admin@elitelaptops.in` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (Test or Live) | `rzp_test_xxxx` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `xxxxxxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret token created for Razorpay webhooks | `your_webhook_secret_32chars` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `xxxxxxxxxxxxxxxx` |
| `CLOUDINARY_FOLDER` | Cloudinary storage folder (Optional) | `elite_laptops_products` |
| `RESEND_API_KEY` | Resend API Key for sending order emails | `re_123456789` |
| `EMAIL_FROM` | Verified sender email address | `orders@yourdomain.com` |
| `STORE_NOTIFY_EMAIL` | Store owner email for new order alerts | `store@yourdomain.com` |
| `NEWSLETTER_SECRET` | Token used to sign newsletter links | Random 32+ char hex string |
| `CRON_SECRET` | Token used to authorize Vercel Cron jobs | Random 32+ char hex string |

> 💡 **Tip:** To generate 32-character hex secrets for `NEWSLETTER_SECRET` and `CRON_SECRET`, run:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

Click **"Deploy"** and wait for Vercel to build and deploy your project!

---

## ⚡ Step 4: Post-Deployment Setup & Webhooks

Once deployment completes, perform these final steps:

### 1. Update Supabase Authentication Redirect URLs
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) -> **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your production Vercel URL (e.g., `https://your-app.vercel.app`).
3. Add the callback address under **Redirect URLs**:
   `https://your-app.vercel.app/auth/callback`

### 2. Configure Razorpay Webhooks
To handle payment confirmations reliably:
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) -> **Webhooks** -> **Add New Webhook**.
2. Set **Webhook URL** to:
   `https://your-app.vercel.app/api/webhooks/razorpay`
3. Check events:
   - `payment.captured`
   - `order.paid`
4. Set Secret to match `RAZORPAY_WEBHOOK_SECRET` from your Vercel Environment Variables.

### 3. Automatic Cron Job Execution
This project includes a `vercel.json` file configuring automatic cart hold expirations every 10 minutes (`/api/cron/expire-holds`). Vercel Cron automatically detects this configuration and executes the job using your `CRON_SECRET`.

---

## 🔑 Step 5: Google SSO Setup Guide

Google Single Sign-On (SSO) is supported out of the box using Supabase Authentication. Follow these steps to activate Google Sign-In:

1. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
   - Create a project or select an existing project.
   - Click **Create Credentials** $\rightarrow$ **OAuth Client ID**.
   - Select Application Type: **Web application**.
   - Under **Authorized Redirect URIs**, enter your Supabase Auth callback URL:
     `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
   - Copy the generated **Client ID** and **Client Secret**.

2. **Supabase Provider Activation**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard) $\rightarrow$ **Authentication** $\rightarrow$ **Providers**.
   - Click on **Google** to expand provider settings.
   - Toggle **Enable Google Provider**.
   - Paste the **Client ID** and **Client Secret** obtained from Google.
   - Click **Save**.

3. **Verification**:
   - Navigate to `/login` or `/signup` on your live site.
   - Click **"Sign in with Google"**.
   - You will be redirected to Google OAuth consent and signed into Elite Laptops seamlessly.

---

## 🛡️ Step 6: Security Architecture & Free-Tier Defense

This application is built with enterprise-level security practices tailored for free-tier cloud deployment:

### 🔑 1. Authentication & Authorization (RBAC)
- **Supabase SSR Authentication**: Secure, HTTP-only cookie-based authentication via `@supabase/ssr`.
- **Hardened Admin Authorization**: Access to `/admin` routes and server actions is locked down exclusively to the email matching `ADMIN_EMAIL`. Non-admin or unauthenticated requests receive a strict `404 Not Found` response to conceal admin existence from scanners.

### 🔒 2. Data Security & Secret Isolation
- **Strict Server/Public Separation**: Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `ADMIN_EMAIL`) are kept off the client side (never prefixed with `NEXT_PUBLIC_`).
- **PostgreSQL Row-Level Security (RLS)**: Database tables enforce RLS policies in Supabase SQL schema so anonymous clients cannot modify or query private user transactions.

### 🛡️ 3. XSS (Cross-Site Scripting) Prevention
- **React Auto-Escaping**: Dynamic string renders in JSX are automatically sanitized by React DOM.
- **SVG Path Sanitization**: SVG path data in static brand logos (`brand-logos.ts`) is strictly validated against sanitization regex rules to guarantee zero inline script or HTML tag execution.

### 💉 4. SQL Injection Prevention
- **Parameterized Queries**: All database queries utilize Supabase ORM parameterized query builders (`supabase.from('products').select(...)`), executing PostgreSQL prepared statements that make SQL injection impossible.

### 🧱 5. Attack Prevention & Bot Mitigation
- **Cloudflare Turnstile CAPTCHA**: Integrated into Supabase Auth settings to stop automated credential stuffing and bot registration.
- **API Rate Limiting**: Server endpoints (newsletter signups, checkout holds, contact forms) implement rate limiting to protect free-tier API quotas against denial-of-service attempts.

### 🏗️ 6. Infrastructure & Webhook Security
- **HMAC SHA256 Webhook Verification**: Razorpay webhook payloads (`/api/webhooks/razorpay`) are cryptographically verified using `RAZORPAY_WEBHOOK_SECRET` before processing payment confirmations.
- **Sealed Cron Authentication**: Abandoned hold cleanup endpoints (`/api/cron/expire-holds`) mandate bearer token verification matching `CRON_SECRET`.

### 📊 7. Security Monitoring & Audit Trail
- **Real-Time Log Auditing**: Failed logins, unexpected webhook payloads, and illegal access attempts trigger server logs viewable in Supabase Audit Logs and Vercel Deployment Logs.

---

## 💻 Step 7: Alternative CLI Deployment Method

If you want to deploy directly using Vercel CLI from your terminal:

1. Deploy Preview / Staging Build:
   ```bash
   npx vercel
   ```
2. Deploy to Production:
   ```bash
   npm run deploy:manual
   ```
   *(or `npx vercel --prod`)*

---

## ✅ Verification & Troubleshooting Checklist

- [ ] **Build Check**: Verify production build completed with zero errors (`npm run build`).
- [ ] **Home & Shop Pages**: Open your live URL to confirm laptops and UI components render correctly.
- [ ] **Admin Portal**: Log in with your specified `ADMIN_EMAIL` and navigate to `https://your-app.vercel.app/admin`.
- [ ] **Brand Logos Carousel**: Verify infinite scroller displays clean major brands (HP, Dell, Lenovo, Asus, Acer, Apple, LG, Samsung).
- [ ] **Banner Copy**: Confirm top announcement bar displays: `Free shipping across India · 1 year service warranty on every laptop`.
- [ ] **Google SSO**: Test Google Sign-In on the live deployment.
- [ ] **Product Uploads**: Upload a product image in `/admin/products/new` to verify Cloudinary integration.
- [ ] **Checkout Flow**: Complete a test transaction with Razorpay test credentials.
- [ ] **Webhooks**: Confirm that order status updates to paid in Supabase.
