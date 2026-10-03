# Setup guide

Follow this top to bottom. Each step says what to do and **how to check it worked**. Everything here has a free tier,
except hosting a real shop on Vercel (see step 10).

**Before you start:** the store pages (home, shop, product pages, cart) already work with no setup. Run
`npm install && npm run dev` and open http://localhost:3000. The steps below turn on login, the database, payments,
emails and the admin page.

## Where the keys go

All secrets go in a file called `.env.local` in the project folder. It is ignored by git, so it never gets published.

```bash
cp .env.example .env.local
```

Fill the values in as you complete each step. After changing `.env.local`, **stop and restart** `npm run dev`.

| Variable | Comes from | Used for | Safe in the browser? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase step 1 | Login and database | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase step 1 | Login | Yes |
| `NEXT_PUBLIC_SITE_URL` | Your address | Links inside emails | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase step 1 | Orders, products, admin | **No. Secret** |
| `ADMIN_EMAIL` | You | The one admin account | **No. Secret** |
| `RAZORPAY_KEY_ID` | Razorpay step 4 | Payments | Shown to the payment popup only |
| `RAZORPAY_KEY_SECRET` | Razorpay step 4 | Verifying payments | **No. Secret** |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay step 6 | Verifying webhooks | **No. Secret** |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary step 5 | Photo uploads | **No. Secret** |
| `CLOUDINARY_FOLDER` | You (optional) | Folder name for photos | Yes |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend step 7 | Order and newsletter emails | **No. Secret** |
| `STORE_NOTIFY_EMAIL` | You | Your inbox for new-order alerts | **No. Secret** |
| `NEWSLETTER_SECRET` | You | Signs newsletter links | **No. Secret** |
| `CRON_SECRET` | You | Lets Vercel Cron free abandoned checkout holds | **No. Secret** |

Only variables starting with `NEXT_PUBLIC_` are ever sent to the browser. Never add that prefix to a secret.

Generate `NEWSLETTER_SECRET` and `CRON_SECRET` with: `openssl rand -hex 32`

---

## 1. Supabase: login and database

1. Create a free project at https://supabase.com. Choose a region close to your customers (Mumbai if offered).
2. **Project Settings -> API**: copy the **Project URL**, the **anon public** key and the **service_role** key into
   `.env.local`.
3. **SQL Editor -> New query**: paste the whole of `supabase/schema.sql` and press **Run**. It is safe to run again.
4. **Authentication -> URL Configuration**: set **Site URL** to your address and add these under **Redirect URLs**
   (exact addresses, no wildcards):
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-DOMAIN/auth/callback`
5. **Authentication -> Providers -> Email**: keep **Confirm email** switched ON.

**Check it worked:** restart `npm run dev`, open http://localhost:3000/signup and create an account. You should see
"Check your email to verify your account". Before email sending is set up (step 7) the email may be slow or missing, which
is normal. In Supabase you can also open **Authentication -> Users** to confirm the user appeared.

### Optional: Google sign-in
1. Google Cloud Console (free) -> create OAuth credentials of type "Web application".
2. Use the redirect address that Supabase shows under **Authentication -> Providers -> Google**.
3. Paste the client ID and secret into that Supabase screen and enable it.

### Strongly recommended: captcha
**Authentication -> Attack Protection**: turn on captcha (Cloudflare Turnstile is free). This stops bots from creating
accounts and flooding reset emails.

## 2. The admin account

1. Put your email in `ADMIN_EMAIL` in `.env.local` and restart `npm run dev`.
2. Sign up at `/signup` with **that same email**, then click the verification link in the email.
3. Sign in, then type `http://localhost:3000/admin` into the address bar.

There is deliberately no link to the admin page anywhere. To everyone else, signed in or not, `/admin` shows a normal
"page not found". The admin email is never sent to the browser.

**Check it worked:** you see the Dashboard. If you still see "page not found", `ADMIN_EMAIL` does not exactly match your
login email (check spelling), the email is not verified, or you did not restart the dev server.

## 3. Add your laptops

Open `/admin/products`.
- **Import the 10 samples** (shown the first time) to edit the demo laptops, or
- **Add laptop** and fill in: name, brand, category, condition, price, original price (optional), quantity, stock status,
  description, warranty months and policy, processor, RAM, storage, graphics, screen, OS, battery, and photos.

Photos upload to Cloudinary (next step). The first photo is the cover shown in the shop. You can upload up to 6.
Until you add your own laptops the shop shows the 10 samples from `src/data/products.ts`.

**Check it worked:** save a laptop, then open `/shop`. It should appear straight away.

## 4. Razorpay: payments (test mode is free)

1. Sign up at https://razorpay.com and switch the Dashboard to **Test Mode**.
2. **Account & Settings -> API Keys -> Generate Test Key**. Put the **Key ID** in `RAZORPAY_KEY_ID` and the **Key Secret**
   in `RAZORPAY_KEY_SECRET`. The secret is shown only once, so copy it immediately.
3. Restart `npm run dev`.

**Test with fake money** (Test Mode only, nothing real is charged):
- UPI: enter `success@razorpay` to succeed or `failure@razorpay` to fail.
- Card: `4100 2800 0000 1007`, any CVV, any future expiry.
- Netbanking and wallets show a test page with Success and Failure buttons.

**Check it worked:** sign in, add a laptop to the cart, press Checkout, fill the address, press Pay, and complete a test
payment. You should land on the "order confirmed" page, and the order should appear under **My orders** with a receipt.
In the Razorpay Dashboard the payment should show as **Captured**.

## 5. Cloudinary: photos

1. Sign up at https://cloudinary.com (free).
2. Copy the **Cloud name**, **API key** and **API secret** from the dashboard into `.env.local`.

**Check it worked:** in `/admin/products/new`, choose a photo. A preview should appear. If you see "Upload failed", the
Cloudinary keys are wrong or you are not signed in as the admin.

## 6. Razorpay webhook: never lose a paid order

Without this, a customer who pays and then closes the browser tab could be charged with no order recorded.

1. This needs a **public address**, so do it after deploying (step 10). It cannot reach `localhost`.
2. Razorpay Dashboard -> **Webhooks -> Add**: URL `https://YOUR-DOMAIN/api/webhooks/razorpay`, events `payment.captured`
   and `order.paid`, and a secret of your choice.
3. Put that secret in `RAZORPAY_WEBHOOK_SECRET` (locally and in Vercel).

## 7. Resend: emails

1. Sign up at https://resend.com (free), then add and verify a sending domain or address.
2. Fill `RESEND_API_KEY`, `EMAIL_FROM` (the verified sender) and `STORE_NOTIFY_EMAIL` (your inbox for new-order alerts).
3. **Supabase -> Authentication -> SMTP Settings**: use the same sender, because Supabase's built-in email only sends a
   few messages per hour.
4. Generate and set `NEWSLETTER_SECRET`.

### Who gets which email

| Moment | Who | Sent by |
|---|---|---|
| Signs up | The customer: confirm link | Supabase (edit the text in Authentication -> Emails) |
| Forgets password | The customer: reset link | Supabase |
| Pays for an order | The customer and you | This app, through Resend |
| Subscribes in the footer | The visitor: confirm link, then a welcome email | This app, through Resend |

A visitor who only browses is never emailed. We do not have their address, and emailing people who did not ask is spam and
conflicts with India's DPDP Act. The footer signup is the legal way to reach them.

## 8. Run the tests

```bash
npm test          # unit tests (pricing, payment checks, security helpers, forms)
npm run lint      # code style
npm run build     # the same build Vercel runs
```

All three should finish without errors before you deploy.

## 9. Security checklist before taking real money

- [ ] `.env.local` is not committed. Rotate any key that was ever pasted into a chat, email or commit.
- [ ] Run a secret scanner over the whole git history, for example `gitleaks detect`.
- [ ] Use Razorpay **Live** keys only in Vercel's Production environment. Keep Test keys everywhere else.
- [ ] `ADMIN_EMAIL`, `NEWSLETTER_SECRET` and `NEXT_PUBLIC_SITE_URL` are set.
- [ ] Supabase **Redirect URLs** list only your real addresses, with no wildcards.
- [ ] Supabase captcha is on (step 1).
- [ ] The Razorpay webhook is set up (step 6) and a test payment was recorded.
- [ ] Have the Privacy, Terms, Exchange and Shipping pages reviewed. The exchange-only, no-refund wording especially. They are short summaries, not legal advice.
- [ ] Replace the sample stock photos with your own laptop photos.
- [ ] You know how to restore the database. Free Supabase projects have no automatic backups, so export regularly.
- [ ] Rate limits in the code are per server instance. For a busy store add a shared limiter (for example free Upstash
      Redis).

## 10. Cash on delivery, tracking and exchanges

- **Cash on delivery:** at checkout the customer chooses "Pay online now" or "Cash on delivery". For COD they pay a ₹1000 advance online
  and the rest to the courier. COD is not offered for orders of ₹1000 or less. The order page in the admin shows how much to
  collect, and you cannot mark a COD order Delivered until you tick **Balance received**.
- **Tracking:** in `/admin/orders`, open an order and pick a status. From **Shipped** onwards enter the courier (for example DTDC) and
  tracking number. The customer sees a timeline and gets an email when you mark it shipped.
- **Cancelling a COD order** (before delivery) refunds the advance and puts the laptop back in stock.
- **Policy:** exchange only, no returns and no refunds. The only refund is automatic, when we cannot deliver. A COD customer who
  refuses delivery loses the advance.

## 11. Deploy to Vercel

1. Push the repository to GitHub and import it at https://vercel.com/new.
2. **Project Settings -> Environment Variables**: add every variable from `.env.example`.
   Set `NEXT_PUBLIC_SITE_URL` to your real address (production refuses to build email links without it).
3. Deploy. Then finish step 6 (the webhook) and add your domain to Supabase's Redirect URLs.
4. **Plan:** Vercel's free Hobby plan is for non-commercial use, so a real store should use a paid plan. Free Supabase
   projects pause after about a week without activity, which would take the shop offline. Check both providers' current
   pricing pages before launch.

---

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| "Sign-in is not available yet" | Supabase keys missing or the server was not restarted after editing `.env.local`. |
| Signed up but no email arrives | Supabase's built-in email is heavily limited. Set up SMTP (step 7), and check spam. |
| Sign-in says "Incorrect email or password, or the email is not verified yet" | Click the link in the verification email first. The message is deliberately the same for both cases, so it never reveals which emails have accounts. |
| `/admin` shows "page not found" | `ADMIN_EMAIL` does not match your login email, your email is not verified, or you did not restart. |
| Admin pages say "Run supabase/schema.sql first" | The database tables were not created (step 1.3). |
| Checkout says "Checkout is not available yet" | A Razorpay key, `SUPABASE_SERVICE_ROLE_KEY` or the Supabase keys are missing. |
| Payment popup never opens | The Razorpay script was blocked by an ad blocker, or `RAZORPAY_KEY_ID` is wrong. |
| Paid, but the order does not appear | The webhook is not set up (step 6) or `RAZORPAY_WEBHOOK_SECRET` does not match. |
| A paid order shows "Sold out · refund pending/failed" | The customer paid but the laptop sold out. The app refunds automatically; if it failed, open the order and press **Retry refund**. |
| Stock stays reserved for people who never paid | `CRON_SECRET` is missing, so the 10-minute cleanup job cannot run. Holds also expire on their own after 15 minutes. |
| "That pincode is not in the state you chose" | The free India Post lookup disagrees with the state selected. Check both. If the lookup is down, checkout still works. |
| Product changes do not show on the site | They update within seconds of saving. If not, the database tables are missing or the service role key is wrong. |
| "Upload failed" | Cloudinary keys are wrong, or you are not signed in as the admin. |
| Newsletter box says "Signup is not available yet" | `NEWSLETTER_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` is missing. |
| Build fails on Vercel about `NEXT_PUBLIC_SITE_URL` | Add it in Vercel's environment variables. |
