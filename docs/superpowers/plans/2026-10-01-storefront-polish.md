# Storefront Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Elite Laptops storefront into a mobile-first, official-looking store for new and certified refurbished laptops, with no spares, phone numbers or WhatsApp.

**Architecture:** Keep the existing Next.js App Router structure, black/white palette and components. Put store-wide facts (warranty, returns, shipping) in one `store-terms` module and pure product logic in `product.ts` (unit tested). Add a product detail route, policy pages and a responsive shell (announcement bar, sticky navbar with mobile menu, richer footer).

**Tech Stack:** Next.js 16.3.7 (App Router), React 19, Tailwind 4, lucide-react, motion, Vitest (new, dev only).

**Spec:** `docs/superpowers/specs/2026-10-01-storefront-polish-design.md`

## Global Constraints

- Terms (exact copy): 3 months full warranty, 1 year service warranty, 7-day returns, free shipping in India.
- No spares/parts, no phone numbers, no WhatsApp (`wa.me`, `tel:`) anywhere in `src`.
- Keep the current UI: colours `#111111`, `#666666`, `#999999`, `#E5E5E5`, `#F5F5F5`, white; Inter font.
- Mobile-first: design at 360px, no horizontal scroll at any width, touch targets at least 44px, verify at 360, 390, 768, 1024, 1440.
- Next.js 16 has breaking changes (AGENTS.md): read the relevant guide in `node_modules/next/dist/docs/` before writing routes, metadata or `next/image` code.
- Match surrounding code style (double quotes, `cn`, existing `id=` attributes on interactive elements).
- Slug for the product page is the existing `Product.id` (ids are already URL-safe slugs). The spec's optional `slug` field is dropped as unnecessary.
- Out of scope: accounts, checkout, payments, orders, real contact delivery.

## Review Focus

- Unknown product slug (`/shop/does-not-exist`): shows the not-found page, not a crash. Pinned in Task 2 (`getProductById`) and Task 5.
- Out-of-stock product: Add-to-cart and the sticky buy bar are disabled on the card and detail page. Pinned in Task 4/5.
- Product with no `originalPrice`: no "You save" text and no `NaN%`; `discountPercent` returns `null`. Pinned in Task 2.
- Product with `originalPrice` at or below `price` (bad data): `discountPercent` returns `null`, never a negative or 0%. Pinned in Task 2.
- Contact form submitted with an invalid email or empty message: blocked with a visible error, not a silent success. Pinned in Task 3.
- Empty filter result and empty cart still render useful states at 360px. Checked in Task 8.

---

### Task 1: Install, read Next 16 docs, add test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm test` runs Vitest; `@/` path alias works in tests.

- [ ] **Step 1: Install dependencies**

Run: `npm install`
Expected: completes; `node_modules/next/package.json` exists.

- [ ] **Step 2: Read the Next 16 docs the constraints name**

Run: `ls node_modules/next/dist/docs`, then read the guides for: dynamic routes (`params`), `generateStaticParams`, `generateMetadata`, `not-found`, `loading`, and `next/image` remote images.
Write down in the commit message any API that differs from this plan (notably whether `params` is a `Promise`). Use the docs, not this plan, where they disagree.

- [ ] **Step 3: Baseline build**

Run: `npm run build`
Expected: succeeds. If it fails, stop and report; do not proceed on a broken baseline.

- [ ] **Step 4: Add Vitest**

Run: `npm install -D vitest`

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

In `package.json` scripts add `"test": "vitest run"`.

- [ ] **Step 5: Verify runner works with no tests**

Run: `npx vitest run --passWithNoTests`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

### Task 2: Product model, store terms and pure helpers (TDD)

**Files:**
- Create: `src/lib/store-terms.ts`, `src/lib/product.ts`, `src/lib/product.test.ts`
- Modify: `src/data/products.ts` (type, remove spares), `src/lib/utils.ts` (remove `whatsappUrl`)

**Interfaces:**
- Produces (`src/lib/store-terms.ts`):
  - `STORE_TERMS = { warrantyMonths: 3, serviceMonths: 12, returnDays: 7 } as const`
  - `warrantyLabel(): string` returns `"3 months warranty + 1 year service"`
- Produces (`src/lib/product.ts`):
  - `discountPercent(p: Pick<Product,"price"|"originalPrice">): number | null`
  - `conditionLabel(c: Condition): string` (`new` → `"New"`, `refurbished` → `"Certified Refurbished"`, `open-box` → `"Open Box"`)
  - `getProductById(id: string): Product | undefined`
- Produces (`src/data/products.ts`): `type Condition = "new" | "refurbished" | "open-box"`; `Product` without `category`/`spareCategory`; exports `laptops`, `BRANDS`. `spares`, `allProducts`, `SPARE_CATEGORIES` are removed.

- [ ] **Step 1: Write the failing tests**

`src/lib/product.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { conditionLabel, discountPercent, getProductById } from "@/lib/product";
import { STORE_TERMS, warrantyLabel } from "@/lib/store-terms";

describe("discountPercent", () => {
  it("rounds the saving", () => {
    expect(discountPercent({ price: 38999, originalPrice: 45000 })).toBe(13);
  });
  it("is null without an original price", () => {
    expect(discountPercent({ price: 100 })).toBeNull();
  });
  it("is null when original is not higher than price", () => {
    expect(discountPercent({ price: 100, originalPrice: 100 })).toBeNull();
    expect(discountPercent({ price: 100, originalPrice: 50 })).toBeNull();
  });
});

describe("conditionLabel", () => {
  it("maps every grade", () => {
    expect(conditionLabel("new")).toBe("New");
    expect(conditionLabel("refurbished")).toBe("Certified Refurbished");
    expect(conditionLabel("open-box")).toBe("Open Box");
  });
});

describe("getProductById", () => {
  it("finds a product", () => {
    expect(getProductById("hp-pavilion-15")?.name).toBe("HP Pavilion 15");
  });
  it("returns undefined for an unknown id", () => {
    expect(getProductById("nope")).toBeUndefined();
  });
});

describe("store terms", () => {
  it("states the confirmed terms", () => {
    expect(STORE_TERMS).toEqual({ warrantyMonths: 3, serviceMonths: 12, returnDays: 7 });
    expect(warrantyLabel()).toBe("3 months warranty + 1 year service");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run`
Expected: FAIL, cannot resolve `@/lib/product`.

- [ ] **Step 3: Implement**

`src/lib/store-terms.ts`:

```ts
export const STORE_TERMS = {
  warrantyMonths: 3,
  serviceMonths: 12,
  returnDays: 7,
} as const;

export function warrantyLabel(): string {
  return `${STORE_TERMS.warrantyMonths} months warranty + ${STORE_TERMS.serviceMonths / 12} year service`;
}
```

`src/lib/product.ts`:

```ts
import { laptops, type Condition, type Product } from "@/data/products";

export function discountPercent(
  p: Pick<Product, "price" | "originalPrice">
): number | null {
  if (!p.originalPrice || p.originalPrice <= p.price) return null;
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
}

const LABELS: Record<Condition, string> = {
  new: "New",
  refurbished: "Certified Refurbished",
  "open-box": "Open Box",
};

export function conditionLabel(c: Condition): string {
  return LABELS[c];
}

export function getProductById(id: string): Product | undefined {
  return laptops.find((p) => p.id === id);
}
```

In `src/data/products.ts`: change line 1 to `export type Condition = "new" | "refurbished" | "open-box";`; delete `category` and `spareCategory` from the `Product` interface and the `"category": "laptop",` line from every entry; delete the `spares`, `allProducts` and `SPARE_CATEGORIES` exports. Keep `BRANDS`.

In `src/lib/utils.ts` delete `whatsappUrl`.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run`
Expected: all PASS. (`tsc` will fail in components until Task 3/4; that is expected.)

- [ ] **Step 5: Commit**

```bash
git add src/lib src/data/products.ts
git commit -m "feat: add product helpers, store terms; drop spares from data model"
```

---

### Task 3: Remove spares, phone and WhatsApp; new contact form

**Files:**
- Delete: `src/components/home/CategoryCards.tsx`
- Modify: `src/components/shop/FilterSidebar.tsx`, `src/components/shop/ProductGrid.tsx`, `src/components/layout/FloatingDock.tsx`, `src/components/layout/Footer.tsx`, `src/components/cart/CartDrawer.tsx`, `src/components/contact/ContactForm.tsx`, `src/app/contact/page.tsx`, `src/app/layout.tsx`, `src/app/shop/page.tsx`
- Create: `src/lib/contact.ts`, `src/lib/contact.test.ts`

**Interfaces:**
- Consumes: `Condition` from `@/data/products`.
- Produces (`src/lib/contact.ts`): `validateContact(f: {name:string; email:string; topic:string; message:string}): Partial<Record<"name"|"email"|"message", string>>` (empty object means valid).
- Produces: `Filters.condition: "all" | Condition`; `Filters` no longer has `spareCategory`; `ProductGrid` props are `{ products: Product[]; title?: string }`.

- [ ] **Step 1: Write the failing test**

`src/lib/contact.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateContact } from "@/lib/contact";

const ok = { name: "Asha", email: "asha@example.com", topic: "Order", message: "Hello there" };

describe("validateContact", () => {
  it("accepts a valid message", () => {
    expect(validateContact(ok)).toEqual({});
  });
  it("rejects empty name, bad email and empty message", () => {
    const e = validateContact({ ...ok, name: " ", email: "nope", message: "" });
    expect(Object.keys(e).sort()).toEqual(["email", "message", "name"]);
  });
  it("rejects an email without a domain dot", () => {
    expect(validateContact({ ...ok, email: "a@b" }).email).toBeDefined();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/contact.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement validation**

`src/lib/contact.ts`:

```ts
export interface ContactFields {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export function validateContact(
  f: ContactFields
): Partial<Record<"name" | "email" | "message", string>> {
  const errors: Partial<Record<"name" | "email" | "message", string>> = {};
  if (!f.name.trim()) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    errors.email = "Please enter a valid email address.";
  if (!f.message.trim()) errors.message = "Please enter a message.";
  return errors;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/contact.test.ts`
Expected: PASS.

- [ ] **Step 5: Remove spares from the shop**

- `FilterSidebar.tsx`: import only `BRANDS`; remove `spareCategory` from `Filters`; remove the `showSpareFilter` prop, its JSX block (the `{showSpareFilter && (...)}` section) and `spareCategory: ""` in the reset handler; change `condition` type to `"all" | Condition` (import `Condition` and `conditionLabel`); render the radio list from `(["all","new","refurbished","open-box"] as const)` with label `c === "all" ? "All" : conditionLabel(c)` (drop the `capitalize` class).
- `ProductGrid.tsx`: remove `showSpareFilter` prop, `spareCategory` default and the `spareCategory` filter block.
- Delete `CategoryCards.tsx`.

- [ ] **Step 6: Remove WhatsApp and phone**

- `FloatingDock.tsx`: remove the WhatsApp item and the `MessageCircle` import.
- `Footer.tsx`: remove the WhatsApp button, the `tel:` list item, and the `Phone`/`MessageCircle` imports.
- `CartDrawer.tsx`: remove `WHATSAPP_NUMBER`, `buildWhatsAppMessage`, the `whatsappUrl` import and the WhatsApp anchor. Replace the anchor with a disabled button:

```tsx
<button
  id="checkout-button"
  disabled
  className="flex items-center justify-center w-full min-h-11 py-3 bg-[#111111] text-white text-sm font-medium rounded-lg opacity-40 cursor-not-allowed"
>
  Checkout (available soon)
</button>
```

Change the empty-cart text `Add laptops or spares to get started.` to `Add a laptop to get started.`.

- [ ] **Step 7: Replace the contact form**

Rewrite `ContactForm.tsx` as a client component with fields `name`, `email`, `topic` (select: Order, Warranty, Returns, Other) and `message` (textarea), using the existing field styling. On submit: `validateContact`; if errors, show each under its field (`role="alert"`) and do not submit; otherwise show a success panel "Thanks, we will reply by email shortly." and clear the form. No network call. Button text "Send message"; remove all phone/WhatsApp text and the `whatsappUrl` import. Every input uses `className` with `min-h-11` and `text-base` (prevents iOS zoom).

In `contact/page.tsx`: description `Get in touch for orders, warranty or returns. We reply by email. Based in Karnataka, India.`; body text `Send us a message and we will get back to you by email.`; change `pt-28` to `pt-12`.

- [ ] **Step 8: Clean metadata**

- `layout.tsx` description: `Buy new and certified refurbished laptops online with warranty and free shipping across India. Karnataka, India.`; keywords: `["laptops","refurbished laptops","certified refurbished","buy laptops online","Karnataka","Elite Laptops"]`; default title `Elite Laptops — New & Certified Refurbished Laptops`.
- `shop/page.tsx`: keep as is (no spares text).

- [ ] **Step 9: Verify**

Run: `npx vitest run && npx tsc --noEmit && grep -rniE "whatsapp|wa\.me|tel:|7676459688|spare" src ; echo "grep exit: $?"`
Expected: tests pass, no type errors, grep prints nothing and `grep exit: 1`. (Remaining `Product` card usage compiles because Task 4 has not changed it yet.)

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: remove spares, phone and WhatsApp; email-based contact form"
```

---

### Task 4: Product card with badges, warranty and savings

**Files:**
- Modify: `src/components/shop/ProductCard.tsx`
- Create: `src/components/shop/ConditionBadge.tsx`

**Interfaces:**
- Consumes: `discountPercent`, `conditionLabel` (`@/lib/product`), `warrantyLabel` (`@/lib/store-terms`), `formatPrice`.
- Produces: `ConditionBadge({ condition }: { condition: Condition })`, reused on the detail page.

- [ ] **Step 1: Badge component**

`ConditionBadge.tsx`:

```tsx
import { BadgeCheck } from "lucide-react";
import { conditionLabel } from "@/lib/product";
import type { Condition } from "@/data/products";

export function ConditionBadge({ condition }: { condition: Condition }) {
  const certified = condition === "refurbished";
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] px-2 py-0.5 bg-[#F5F5F5] rounded-md border border-[#E5E5E5]">
      {certified && <BadgeCheck className="w-3.5 h-3.5" aria-hidden />}
      {conditionLabel(condition)}
    </span>
  );
}
```

- [ ] **Step 2: Update the card**

In `ProductCard.tsx`:
- Replace the inline `savings` calculation with `const savings = discountPercent(product);`.
- Replace the condition `<span>` with `<ConditionBadge condition={product.condition} />`.
- Change the image `Link` href to `` `/shop/${product.id}` ``; wrap the product name in the same Link.
- Replace `<img>` with `next/image` (`fill`, `sizes="(min-width:1280px) 33vw, (min-width:640px) 50vw, 100vw"`, `className="object-cover ..."`, parent already `relative`), following the docs read in Task 1.
- Under the specs list add a warranty line: `<p className="text-xs text-[#666666] mb-3 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" aria-hidden />{warrantyLabel()}</p>`.
- Under the price add: `{savings && <p className="text-xs font-medium text-[#111111]">You save {formatPrice(product.originalPrice! - product.price)} ({savings}% off)</p>}`.
- Add button gets `min-h-11` and text `Add to cart` (keep the icon). Keep `disabled={!product.inStock}`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/shop
git commit -m "feat: product card with condition badge, warranty and savings"
```

---

### Task 5: Product detail page

**Files:**
- Create: `src/app/shop/[slug]/page.tsx`, `src/components/shop/BuyBox.tsx`, `src/app/not-found.tsx`

**Interfaces:**
- Consumes: `getProductById`, `laptops`, `ConditionBadge`, `discountPercent`, `warrantyLabel`, `STORE_TERMS`, `useCart().addItem`.
- Produces: route `/shop/[slug]` (slug = product id); `BuyBox({ product }: { product: Product })`.

- [ ] **Step 1: Not-found page**

`src/app/not-found.tsx`: centered block with heading "Page not found", short text, and a `Link` to `/shop` styled like the hero button. Padding `py-24 px-4`.

- [ ] **Step 2: BuyBox (client)**

`BuyBox.tsx`: `"use client"`. Shows price, struck original price and "You save", stock state, an "Add to cart" button (`id="detail-add-to-cart"`, `min-h-12`, `disabled={!product.inStock}`, calls `addItem(product)`), and a list of assurances: `warrantyLabel()`, `${STORE_TERMS.returnDays}-day returns`, "Free shipping across India", "Secure payments". Also renders a mobile-only sticky bar: `fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-[#E5E5E5] p-3 flex items-center justify-between gap-3` showing the price and the same button (disabled when out of stock; label "Out of stock" then).

- [ ] **Step 3: Page**

`src/app/shop/[slug]/page.tsx` (server component). Per the Next 16 docs read in Task 1 (expected: `params` is a `Promise`):

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { laptops } from "@/data/products";
import { getProductById } from "@/lib/product";
import { ConditionBadge } from "@/components/shop/ConditionBadge";
import { BuyBox } from "@/components/shop/BuyBox";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return laptops.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProductById(slug);
  if (!p) return { title: "Product not found" };
  return { title: p.name, description: p.description, openGraph: { images: [p.image] } };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductById(slug);
  if (!product) notFound();
  // layout: breadcrumb (Home / Shop / name), 1-col on mobile, 2-col (image | details) from lg
  // image: next/image fill in aspect-[4/3] container, priority, sizes="(min-width:1024px) 50vw, 100vw"
  // details: ConditionBadge, h1 name, description, <BuyBox product={product} />,
  //          specs table (<dl> rows: Brand, then each spec as a row), delivery & returns box
  // add pb-24 on mobile so the sticky bar never covers content
}
```

Fill in the layout comments with real JSX using the existing card/border styles.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: succeeds; build output lists `/shop/[slug]` with the 10 product pages generated.

- [ ] **Step 5: Manual check**

Run: `npm run dev`; open `/shop/hp-pavilion-15` (renders), `/shop/dell-xps-13` (out of stock, buttons disabled), `/shop/does-not-exist` (not-found page, no crash).

- [ ] **Step 6: Commit**

```bash
git add src/app
git commit -m "feat: product detail page, buy box and not-found page"
```

---

### Task 6: Responsive shell (announcement bar, navbar, footer)

**Files:**
- Create: `src/components/layout/AnnouncementBar.tsx`
- Modify: `src/components/layout/Navbar.tsx`, `src/components/layout/Footer.tsx`, `src/app/layout.tsx`, `src/components/home/Hero.tsx`

**Interfaces:**
- Consumes: `STORE_TERMS`, `useCart`.
- Produces: footer links to `/about`, `/warranty`, `/returns`, `/shipping`, `/privacy`, `/terms` (built in Task 7).

- [ ] **Step 1: Announcement bar**

`AnnouncementBar.tsx` (server component): `bg-[#111111] text-white text-xs text-center px-4 py-2` with text `Free shipping across India · ${STORE_TERMS.warrantyMonths}-month warranty on every laptop`. Rendered first in `layout.tsx` body, above `Navbar`.

- [ ] **Step 2: Navbar**

Rewrite `Navbar.tsx` layout: change from the floating `fixed top-4` pill to `sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E5E5E5]` with a `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between` row. Keep the logo, `NAV_LINKS` and cart button behaviour.
- Desktop (`md:` and up): inline links plus a search form (`<form action="/shop">` with `<input name="q">`, `min-h-10`).
- Mobile: hide inline links; show a menu button (`id="mobile-menu-button"`, `aria-expanded`, `aria-controls`, 44px target) that toggles a panel under the bar with the links and the search form, closing on link click and on route change (`usePathname` effect).
- Cart button 44px target.

Add `q` support in the shop: in `ProductGrid` accept `initialQuery?: string` and filter `p.name.toLowerCase().includes(q)` / brand; `shop/page.tsx` reads `searchParams` (a `Promise` per the docs) and passes `initialQuery`.

- [ ] **Step 3: Footer**

Add a "Policies" column with links to the six policy routes above; add the email-only "Contact support" link to `/contact`. Change the footer grid to `grid-cols-2 lg:grid-cols-4` with the brand block spanning `col-span-2`. Reduce bottom padding from `pb-28` to `pb-24` only if the floating dock still clears the text on 360px.

- [ ] **Step 4: Hero fits real mobile viewports**

In `Hero.tsx` change `h-screen` to `min-h-[100svh]` and add `py-24` so content never clips on short phones; change the subtitle text `fast delivery across Karnataka` to `fast delivery across India`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint`
Then in the browser at 360px and 1440px: menu opens/closes, no horizontal scroll, search sends you to `/shop?q=...` and filters.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: responsive shell with announcement bar, sticky navbar, policy footer"
```

---

### Task 7: Trust strip and policy pages

**Files:**
- Modify: `src/components/home/TrustStrip.tsx`, `src/app/page.tsx`
- Create: `src/app/about/page.tsx`, `src/app/warranty/page.tsx`, `src/app/returns/page.tsx`, `src/app/shipping/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/components/common/PolicyPage.tsx`, `src/app/shop/loading.tsx`

**Interfaces:**
- Consumes: `STORE_TERMS`.
- Produces: `PolicyPage({ title, children })`.

- [ ] **Step 1: Trust strip**

Replace `ITEMS` with six items, copy exact:
1. `ShieldCheck` "3-Month Full Warranty" / "Every laptop is covered for 3 months."
2. `Wrench` "1-Year Service Warranty" / "Free service support for a full year."
3. `BadgeCheck` "Quality Inspected" / "Every laptop is tested before it ships."
4. `RotateCcw` "7-Day Returns" / "Not happy? Return it within 7 days."
5. `Truck` "Free Shipping" / "Free delivery across India."
6. `Lock` "Secure Payments" / "Pay safely online at checkout."

Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Change the subheading to `Buy new or certified refurbished with confidence.` (drop the unverifiable "hundreds of customers" claim). `src/app/page.tsx` already has no `CategoryCards`; confirm.

- [ ] **Step 2: Policy pages**

`PolicyPage.tsx`: `max-w-3xl mx-auto px-4 sm:px-6 py-12`, `h1`, `prose`-style spacing via plain Tailwind classes (`space-y-4 text-sm text-[#666666] leading-relaxed`). Each of the six pages sets `metadata` and passes short, accurate content based only on the confirmed terms:
- Warranty: 3 months full warranty plus 1 year service warranty; contact support by email.
- Returns: 7-day returns; item must be returned in the condition received.
- Shipping: free shipping across India.
- About: Elite Laptops & Solutions, Bangalore, new and certified refurbished laptops.
- Privacy and Terms: short, generic, marked as a summary; no invented legal claims.

Do not write delivery-time or refund-time numbers that the user has not provided.

- [ ] **Step 3: Loading state**

`src/app/shop/loading.tsx`: a grid of 6 `animate-pulse` card skeletons using the same grid classes as `ProductGrid`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: succeeds; all six policy routes appear in the build output.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: trust strip, policy pages and shop loading state"
```

---

### Task 8: Mobile filters, empty states, responsive verification

**Files:**
- Modify: `src/components/shop/ProductGrid.tsx`, `src/components/shop/FilterSidebar.tsx`

- [ ] **Step 1: Mobile filter drawer**

Replace the inline show/hide sidebar with a bottom sheet on mobile: when `filtersOpen`, render the `FilterSidebar` inside `fixed inset-0 z-50 lg:hidden` with a backdrop, a panel `absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl p-5`, a header with a "Filters" title, a close button and an "Apply" button (`min-h-11`). Keep the desktop sidebar unchanged (`hidden lg:block`). Close on Escape and lock body scroll while open.

- [ ] **Step 2: Tap targets**

Make the filter toggle, sort select, checkboxes' labels and radio labels at least 44px tall on mobile (`min-h-11` / `py-2`). Set the sort select to `text-base sm:text-sm`.

- [ ] **Step 3: Empty states**

Empty filter result: add a "Clear filters" button next to the message. Cart empty state already exists; confirm it fits at 360px.

- [ ] **Step 4: Responsive verification**

Run: `npm run dev`. For each of `/`, `/shop`, `/shop/hp-pavilion-15`, `/contact`, `/warranty` at widths 360, 390, 768, 1024, 1440 (browser devtools device toolbar):
- no horizontal scroll (`document.documentElement.scrollWidth <= window.innerWidth` in the console),
- all buttons and links at least 44px tall on mobile,
- sticky buy bar does not cover content, floating dock does not cover the footer text or the "Add to cart" button.
Fix any failure before moving on.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: mobile filter sheet, tap targets and empty states"
```

---

### Task 9: Final verification

- [ ] **Step 1: Full checks**

Run: `npm test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 2: Banned-content grep**

Run: `grep -rniE "whatsapp|wa\.me|tel:|7676459688|spare|6 months|\+91" src ; echo "exit: $?"`
Expected: no output, `exit: 1`.

- [ ] **Step 3: Console check**

With `npm run dev`, load every route (`/`, `/shop`, one product, `/contact`, six policy pages, an unknown URL) and confirm there are no console errors or hydration warnings.

- [ ] **Step 4: Report**

Summarize results against each spec section, list anything skipped, and stop. Do not push or deploy unless the user asks.

---

## Self-Review

- **Spec coverage:** Remove (Task 3), Contact (Task 3), Refurbished/warranty features (Tasks 2, 4, 7), Official-store look (Tasks 5, 6, 7), Responsive (Tasks 6, 8), verification (Task 9). Search in the navbar is covered in Task 6. The spec's `slug` field is intentionally replaced by `id` (see Global Constraints).
- **Placeholders:** none; Task 5 and Task 3 Step 7 describe JSX layout in prose because it follows existing styles, with required class names and ids given.
- **Type consistency:** `Condition` (3 grades), `discountPercent`, `conditionLabel`, `getProductById`, `warrantyLabel`, `STORE_TERMS`, `ConditionBadge`, `validateContact`, `Filters.condition` are defined once and used with the same names later.
