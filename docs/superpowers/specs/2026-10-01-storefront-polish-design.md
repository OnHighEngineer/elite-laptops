# Part 1: Storefront Polish — Design

Part 1 of 3. Part 2 is secure signup/login (Supabase Auth). Part 3 is checkout and payments (Razorpay test mode, live via key swap). Each part gets its own spec, plan and build.

## Goal
Make Elite Laptops look and feel like an official e-commerce store for new and certified refurbished laptops, keeping the current UI, colours and components. It must be fully responsive and mobile-first.

## Decisions made with the user
- Keep the current UI and colours.
- Remove spares/parts, phone numbers and WhatsApp everywhere.
- Lead with refurbished laptops, warranty and quality checks.
- Terms (confirmed): 3 months full warranty, 1 year service warranty, 7-day returns, free shipping in India.
- Payments (part 3): Razorpay test mode now. Accounts (part 2): Supabase Auth, free tier.

## Scope

### 1. Remove
- Spares & Parts section on the homepage (`CategoryCards`) and all `/spares` links (the route does not exist).
- Spare filter in `FilterSidebar`/`ProductGrid`; `spare` category, `spareCategory` and `SPARE_CATEGORIES` in `src/data/products.ts`.
- `FloatingDock` WhatsApp action, Footer phone and `tel:`/`wa.me` links, `whatsappUrl` helper.
- Phone, WhatsApp and spares text in metadata (`layout.tsx`, `contact/page.tsx`, `shop/page.tsx`) and keywords.

### 2. Contact
- Replace the WhatsApp-based `ContactForm` with an email-style "Contact support" form: name, email, topic, message.
- No phone field. For now it validates, shows a confirmation and stores nothing. Real delivery arrives with Supabase in part 2/3.

### 3. Refurbished and warranty as features
- Replace `Condition` with grades: `new`, `refurbished` (Certified Refurbished), `open-box`.
- Product gains `warrantyMonths` (default 3) and `serviceMonths` (default 12), plus optional `slug`.
- `ProductCard`: condition badge, warranty chip ("3 mo warranty + 1 yr service"), "Quality Checked" mark, struck-through original price and "You save X%" for discounted items.
- `TrustStrip`: 3-month full warranty, 1-year service warranty, multi-point quality inspection, 7-day returns, secure payments, free shipping across India. Only claims the user approved.
- Shop filter by condition includes open-box.

### 4. Official-store look
- Top announcement bar (free shipping, warranty).
- Cleaner navbar with search and cart icon.
- Product detail page `/shop/[slug]`: image gallery, specs table, condition, warranty, delivery/returns info, add-to-cart buy box. Not-found state for unknown slugs.
- Footer policy links and pages: About, Warranty Policy, Refund & Returns, Shipping, Privacy, Terms (short, accurate placeholders based on the defaults above).
- `not-found.tsx` and `loading.tsx`; page-level metadata and Open Graph.

### 5. Responsive and mobile-first
- Design for 360px width first, then scale up through `sm`/`md`/`lg`/`xl`.
- No horizontal scroll at any width.
- Touch targets at least 44px; readable text sizes; fluid typography.
- Mobile nav drawer, mobile filter drawer in the shop, sticky add-to-cart bar on the product page.
- Product grid: 1 column on small phones, 2 on larger phones, 3 and up on bigger screens.
- Images via `next/image` with proper `sizes`.
- Verify at 360, 390, 768, 1024 and 1440px.

## Out of scope for part 1
Accounts, checkout, payments, orders, real contact delivery, admin tools.

## Testing and verification
- `npm run lint` and `npm run build` pass.
- Grep confirms no remaining `spare`, `whatsapp`, `wa.me`, `tel:` or phone-number references in `src`.
- Manual check in the browser at the five widths above; all routes load with no console errors.

## Constraints
- AGENTS.md: this Next.js version (16) has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code, especially for dynamic routes, `next/image` and metadata.
- Match the surrounding code's style and naming.

## Open questions
None.
