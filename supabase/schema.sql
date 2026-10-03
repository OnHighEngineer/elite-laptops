-- Run in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again after updates.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  lines jsonb not null,
  amount_inr integer not null check (amount_inr > 0),
  shipping jsonb not null,
  invoice_seq bigint,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);

create sequence if not exists public.invoice_seq_fy;

create table if not exists public.stock (
  product_id text primary key,
  qty integer not null check (qty >= 0)
);

alter table public.orders enable row level security;
alter table public.stock enable row level security;

-- Customers can read only their own orders. All writes go through the server (service role).
drop policy if exists "own orders readable" on public.orders;
create policy "own orders readable" on public.orders
  for select using (auth.uid() = user_id);
drop policy if exists "stock readable" on public.stock;
create policy "stock readable" on public.stock for select using (true);

-- Idempotent: safe to call from both the browser verify step and the webhook.
create or replace function public.mark_order_paid(p_rzp_order text, p_payment text)
returns public.orders language plpgsql security definer set search_path = public as $$
declare o public.orders; l jsonb;
begin
  select * into o from public.orders where razorpay_order_id = p_rzp_order for update;
  if not found then raise exception 'order not found'; end if;
  if o.status = 'paid' then return o; end if;
  for l in select * from jsonb_array_elements(o.lines) loop
    update public.stock set qty = greatest(qty - (l->>'qty')::int, 0) where product_id = l->>'id';
  end loop;
  update public.orders
     set status = 'paid', razorpay_payment_id = p_payment, paid_at = now(),
         invoice_seq = nextval('public.invoice_seq_fy')
   where id = o.id returning * into o;
  return o;
end $$;

revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;

-- Seed stock (edit quantities any time in Table Editor -> stock).
insert into public.stock (product_id, qty) values
  ('hp-pavilion-15', 3), ('hp-elitebook-840', 2), ('dell-inspiron-15', 3),
  ('dell-latitude-5420', 2), ('lenovo-thinkpad-e15', 2), ('lenovo-ideapad-5', 3),
  ('asus-vivobook-15', 3), ('asus-zenbook-14', 2), ('dell-xps-13', 0), ('asus-tuf-a15', 2)
on conflict (product_id) do nothing;

-- Newsletter / "stay in the loop" (double opt-in). Server-only: RLS on, no policies.
create table if not exists public.subscribers (
  email text primary key,
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
alter table public.subscribers enable row level security;

-- Products managed from /admin. Public read (the shop is public), writes only via the server (service role).
create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  condition text not null check (condition in ('new','refurbished','open-box')),
  price integer not null check (price > 0),
  original_price integer check (original_price is null or original_price > price),
  category text not null default 'Everyday',
  specs jsonb not null default '[]',
  spec_details jsonb not null default '{}',
  extra_specs jsonb not null default '[]',
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','out_of_stock','coming_soon')),
  warranty_months integer not null default 3 check (warranty_months between 0 and 36),
  service_months integer not null default 12 check (service_months between 0 and 60),
  warranty_note text not null default '',
  description text not null default '',
  image text not null,
  images jsonb not null default '[]',
  featured boolean not null default false,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "active products readable" on public.products;
create policy "active products readable" on public.products for select using (active);

-- Privacy-friendly engagement counters: no user ids, no IPs. One row per product/type/day.
create table if not exists public.product_events (
  product_id text not null,
  type text not null check (type in ('view','add_to_cart','share')),
  day date not null default current_date,
  n integer not null default 0,
  primary key (product_id, type, day)
);
alter table public.product_events enable row level security;

create or replace function public.bump_event(p_product text, p_type text)
returns void language sql security definer set search_path = public as $$
  insert into public.product_events (product_id, type, day, n)
  values (p_product, p_type, current_date, 1)
  on conflict (product_id, type, day) do update set n = public.product_events.n + 1;
$$;
revoke all on function public.bump_event(text, text) from public, anon, authenticated;

-- Stock lives on products.stock. Paying for more than is left does NOT silently clamp to zero:
-- the order is marked 'paid_needs_review' so you can refund or restock (see status check below).
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','failed','paid_needs_review'));

create or replace function public.mark_order_paid(p_rzp_order text, p_payment text)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare o public.orders; l jsonb; short boolean := false; n integer;
begin
  -- Locking the order row first means a replayed webhook waits here and then sees 'paid'.
  select * into o from public.orders where razorpay_order_id = p_rzp_order for update;
  if not found then raise exception 'order not found'; end if;
  if o.status in ('paid','paid_needs_review') then return o; end if;

  -- All or nothing: take every line's stock inside a sub-transaction and undo it all if any line is short,
  -- so an oversold order never keeps laptops it cannot ship.
  begin
    for l in select * from jsonb_array_elements(o.lines) loop
      update public.products
         set stock = stock - (l->>'qty')::int, updated_at = now()
       where id = l->>'id' and stock >= (l->>'qty')::int;
      get diagnostics n = row_count;
      if n = 0 then raise exception 'short' using errcode = 'P0001'; end if;
    end loop;
  exception when sqlstate 'P0001' then
    short := true;
  end;

  update public.orders
     set status = case when short then 'paid_needs_review' else 'paid' end,
         razorpay_payment_id = p_payment, paid_at = now(),
         invoice_seq = case when short then null else nextval('public.invoice_seq_fy') end
   where id = o.id returning * into o;
  return o;
end $$;
revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;

-- Newsletter: at most one confirmation email per address per day.
alter table public.subscribers add column if not exists last_sent_at timestamptz;

-- Order tracking. Only the server (admin page) can change these; customers can read their own rows.
alter table public.orders add column if not exists fulfillment_status text not null default 'confirmed'
  check (fulfillment_status in ('confirmed','packed','shipped','out_for_delivery','delivered'));
alter table public.orders add column if not exists courier text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists status_history jsonb not null default '[]';
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists refund_id text;

-- ---------------------------------------------------------------------------------------------
-- Cash on delivery, stock holds and refunds
-- ---------------------------------------------------------------------------------------------
alter table public.orders add column if not exists payment_method text not null default 'online'
  check (payment_method in ('online','cod'));
-- For COD: amount_inr is the full order total, advance_inr is paid online now, the rest is paid to the courier.
alter table public.orders add column if not exists advance_inr integer;
alter table public.orders add column if not exists balance_received_at timestamptz;
alter table public.orders add column if not exists held_until timestamptz;
alter table public.orders add column if not exists refund_status text
  check (refund_status in ('pending','processed','failed','manual'));
alter table public.orders add column if not exists refund_note text;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','failed','paid_needs_review','expired'));

-- A hold reserves stock while the customer pays, so two people do not race for the last laptop.
create table if not exists public.stock_holds (
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  qty integer not null check (qty > 0),
  expires_at timestamptz not null,
  primary key (order_id, product_id)
);
create index if not exists stock_holds_product_idx on public.stock_holds (product_id, expires_at);
alter table public.stock_holds enable row level security;

-- Units that are free to sell right now = stock minus other people's live holds.
create or replace function public.available_stock(p_product text, p_exclude_order uuid default null)
returns integer language sql stable security definer set search_path = '' as $$
  select coalesce((select stock from public.products where id = p_product), 0)
       - coalesce((select sum(h.qty) from public.stock_holds h
                    where h.product_id = p_product and h.expires_at > now()
                      and (p_exclude_order is null or h.order_id <> p_exclude_order)), 0);
$$;
revoke all on function public.available_stock(text, uuid) from public, anon, authenticated;

-- Create the order and hold its stock in one step. Returns null when something is not available.
create or replace function public.create_pending_order(
  p_user uuid, p_rzp_order text, p_lines jsonb, p_amount integer, p_shipping jsonb,
  p_method text, p_advance integer, p_hold_minutes integer default 15
) returns uuid language plpgsql security definer set search_path = '' as $$
declare l jsonb; oid uuid; pid text; need integer;
begin
  -- Lock the products involved in a fixed order so two checkouts cannot deadlock each other.
  perform 1 from public.products
   where id in (select x->>'id' from jsonb_array_elements(p_lines) x) order by id for update;

  for l in select * from jsonb_array_elements(p_lines) loop
    pid := l->>'id'; need := (l->>'qty')::int;
    if public.available_stock(pid, null) < need then return null; end if;
  end loop;

  insert into public.orders (user_id, razorpay_order_id, lines, amount_inr, shipping, payment_method, advance_inr, held_until)
  values (p_user, p_rzp_order, p_lines, p_amount, p_shipping, p_method, p_advance, now() + make_interval(mins => p_hold_minutes))
  returning id into oid;

  for l in select * from jsonb_array_elements(p_lines) loop
    insert into public.stock_holds (order_id, product_id, qty, expires_at)
    values (oid, l->>'id', (l->>'qty')::int, now() + make_interval(mins => p_hold_minutes))
    on conflict (order_id, product_id) do nothing;
  end loop;
  return oid;
end $$;
revoke all on function public.create_pending_order(uuid, text, jsonb, integer, jsonb, text, integer, integer) from public, anon, authenticated;

-- Paying turns the hold into a real stock reduction (all or nothing). A paid order whose hold had already
-- expired and whose stock is now gone is flagged for refund instead of being oversold.
create or replace function public.mark_order_paid(p_rzp_order text, p_payment text)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare o public.orders; l jsonb; short boolean := false; n integer;
begin
  select * into o from public.orders where razorpay_order_id = p_rzp_order for update;
  if not found then raise exception 'order not found'; end if;
  if o.status in ('paid','paid_needs_review') then return o; end if;

  begin
    for l in select * from jsonb_array_elements(o.lines) loop
      -- stock must cover this order AND everyone else's live holds
      if public.available_stock(l->>'id', o.id) < (l->>'qty')::int then raise exception 'short' using errcode = 'P0001'; end if;
      update public.products
         set stock = stock - (l->>'qty')::int, updated_at = now()
       where id = l->>'id' and stock >= (l->>'qty')::int;
      get diagnostics n = row_count;
      if n = 0 then raise exception 'short' using errcode = 'P0001'; end if;
    end loop;
  exception when sqlstate 'P0001' then
    short := true;
  end;

  delete from public.stock_holds where order_id = o.id;

  update public.orders
     set status = case when short then 'paid_needs_review' else 'paid' end,
         razorpay_payment_id = p_payment, paid_at = now(), held_until = null,
         refund_status = case when short then 'pending' else refund_status end,
         invoice_seq = case when short then null else nextval('public.invoice_seq_fy') end
   where id = o.id returning * into o;
  return o;
end $$;
revoke all on function public.mark_order_paid(text, text) from public, anon, authenticated;

-- Frees abandoned holds and marks their unpaid orders expired. Safe to call often.
create or replace function public.expire_pending_orders()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  with gone as (
    update public.orders set status = 'expired', held_until = null
     where status = 'pending' and held_until is not null and held_until < now()
     returning id)
  delete from public.stock_holds h using gone where h.order_id = gone.id;
  get diagnostics n = row_count;
  delete from public.stock_holds where expires_at < now();
  return n;
end $$;
revoke all on function public.expire_pending_orders() from public, anon, authenticated;
