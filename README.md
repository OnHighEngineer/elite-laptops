# Elite Laptops

An online store for certified refurbished laptops, built for **Elite Laptops & Solutions** (Bangalore, Karnataka).

Customers can browse laptops, add them to a cart, create an account, and pay online. The owner manages laptops, photos
and stock from a private admin page and sees sales and engagement on a dashboard.

## What it does

**For customers**
- Browse and search laptops, filter by brand, price and condition, view several photos per laptop.
- Cart that survives a page refresh. Checkout with UPI, cards and netbanking through Razorpay.
- Sign up and log in with email and password or Google. Email is verified before first login. Password reset.
- Pay online in full, or **cash on delivery**: pay a ₹1000 advance online and the rest to the courier.
- Address check: the pincode must exist and match the chosen state.
- Order history with a status timeline (confirmed, packed, shipped, out for delivery, delivered), the courier and tracking number, and a receipt. Emails for confirmation and shipping.
- Optional footer signup for new arrivals (double opt-in: they must click a confirmation link).
- Works on phones, tablets and desktop.

**For the owner (`/admin`, one account only)**
- Add and edit laptops: name, category, condition, price, quantity, stock status, description, warranty and policy,
  processor, RAM, storage, graphics, screen, OS, battery, and up to 6 photos.
- Hide or show a laptop, change stock quickly.
- Orders page: update each order's status, enter the courier and tracking number (the customer is emailed when you mark it shipped), tick "balance received" for cash on delivery, cancel a COD order, and retry a failed automatic refund.
- Dashboard: revenue, orders, average order, units sold, revenue per day, views, add-to-carts and shares per laptop,
  and low-stock warnings.

## Tech

| Part | Choice |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Login and database | Supabase (Auth + Postgres) |
| Payments | Razorpay (test mode is free) |
| Photos | Cloudinary |
| Email | Resend (order emails, newsletter) |
| Tests | Vitest |
| Hosting | Vercel |

> Next.js 16 has breaking changes from older versions (for example `middleware` is now `proxy`, and `params` and
> `searchParams` are Promises). When changing framework code, check `node_modules/next/dist/docs/` first.

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # then fill in the values (see docs/SETUP.md)
npm run dev                    # http://localhost:3000
```

**The store pages work with no keys at all.** Without Supabase and Razorpay keys you can browse, search, filter, use the
cart and view product pages (using the 10 sample laptops). Sign-in, checkout, the admin page, order emails and
newsletter signup need their keys. Follow **[docs/SETUP.md](docs/SETUP.md)** to turn each one on.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm start` | Serve the production build |
| `npm test` | Run the unit tests |
| `npm run lint` | Check code style |

## Project layout

```
src/
  app/                 Pages and API routes
    admin/             Owner dashboard and laptop management (404 for everyone else)
    api/               checkout (order, verify), webhooks/razorpay, subscribe, upload, track, catalog
    auth/              Sign-in actions and the email/Google callback
    shop/, orders/, checkout/, account/, login/, signup/ ...
  components/          UI pieces (home, shop, cart, checkout, admin, layout)
  lib/                 Logic: pricing, payment checks, security helpers, catalog, auth rules
    supabase/          Supabase clients (browser, server, admin) and cookie settings
  data/                Sample laptops, brand logos, Indian states
  proxy.ts             Refreshes the login session and protects /account
supabase/schema.sql    Database tables and functions (run once in Supabase)
docs/SETUP.md          Step-by-step setup for every service
```

## How the important parts work

**Prices cannot be tampered with.** The browser only sends product ids and quantities. The server looks up the real
price and stock and creates the Razorpay order from that.

**Payments are verified twice.** After the customer pays, the server checks Razorpay's signature, then asks Razorpay
whether the payment was captured, for the right amount and order. A signed Razorpay webhook repeats the same checks, so an
order is still recorded if the customer closes the tab right after paying.

**Stock is protected.** When a customer reaches the payment step, their laptop is held for 15 minutes so two people cannot race for the last one. Stock is reduced in a single database step when the order is paid. If someone pays for more than is
left, the order is flagged "paid_needs_review" and the money is sent back automatically, instead of silently overselling.

**Admin is private.** The admin email is set in a server-only variable (`ADMIN_EMAIL`) and never reaches the browser. Anyone
else, signed in or not, sees a normal "page not found" at `/admin`. A test fails the build if an email address or secret
setting ever appears in code the browser can see.

**Products come from the database.** Laptops live in a Supabase table and are cached, then refreshed the moment you save in
the admin or an order is paid. Until the table has rows, the shop shows the 10 sample laptops from `src/data/products.ts`.

## Store policy

**Exchange only. No returns and no refunds** for change of mind. The one exception is when we cannot deliver (for example a
laptop sells out while the customer is paying): the payment is sent back automatically. The wording lives in
`src/app/exchange/page.tsx`. Have it reviewed before you launch, because Indian consumer law can limit what a seller may refuse.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Add every variable from `.env.example` under Project Settings -> Environment Variables. Use **Razorpay Live** keys only
   in Production.
3. Set `NEXT_PUBLIC_SITE_URL` to your real address. Production refuses to build email links without it.
4. Add your domain to Supabase -> Authentication -> URL Configuration.
5. Add the Razorpay webhook (see docs/SETUP.md).
6. Set `CRON_SECRET`. `vercel.json` runs a job every 10 minutes that frees stock held by checkouts nobody paid for.

Vercel's free Hobby plan is for non-commercial use, so a real store should use a paid plan. Free Supabase projects pause
after about a week without activity, which would take the shop offline; check Supabase's current pricing before launch.

## Security notes

- Secrets live only in `.env.local` (git-ignored) and in Vercel's environment settings. Never commit them.
- The login session is stored in an HTTP-only cookie that page scripts cannot read.
- Rate limits in the code are per server instance, a speed bump rather than a wall. For a busy store add a shared limiter
  and a captcha (see the checklist in docs/SETUP.md).
- Run a secret scanner such as `gitleaks` over the git history before going live.

## Help

Customers reach the store through the contact form on the site. For problems with the code or setup, start with
[docs/SETUP.md](docs/SETUP.md) and its troubleshooting section.
