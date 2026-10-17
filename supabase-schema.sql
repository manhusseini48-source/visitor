-- ========================================================
-- Schema for Visitor Pharma Management App (پلتفرم مدیریت ویزیتوری دارو)
-- Run this script in the Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ۱. پاکسازی ساختارهای قدیمی (برای سازگاری ۱۰۰٪ با شناسه متنی و ستون‌های برنامه)
drop table if exists public.visits cascade;
drop table if exists public.messages cascade;
drop table if exists public.orders cascade;
drop table if exists public.customers cascade;
drop table if exists public.medicines cascade;
drop table if exists public.profiles cascade;
drop table if exists public.stores cascade;

-- ۲. جدول شرکت‌های پخش و فروشگاه‌ها (STORES)
create table public.stores (
    id text primary key,
    name text not null,
    owner_name text not null default '',
    phone text not null default '',
    email text default '',
    address text default '',
    province text default '',
    subscription_plan text default 'trial',
    subscription_expires_at timestamptz,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- ۳. جدول کاربران، مدیران، مالکین و ویزیتورها (PROFILES)
create table public.profiles (
    id text primary key,
    store_id text references public.stores(id) on delete cascade,
    name text not null,
    phone text not null,
    username text unique not null,
    password_hash text default '123456',
    role text not null check (role in ('maker_admin', 'store_admin', 'store_owner', 'visitor', 'guest')),
    avatar_url text,
    city text default '',
    is_active boolean default true,
    created_at timestamptz default now()
);

-- ۴. جدول کاتالوگ و انبار داروها همراه با عکس Cloudinary (MEDICINES)
create table public.medicines (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    code text not null,
    name text not null,
    generic_name text,
    company text,
    country text,
    category text,
    form text,
    strength text,
    batch_number text,
    expire_date text,
    stock_quantity integer default 0,
    buy_price numeric(12, 2) default 0,
    sale_price numeric(12, 2) default 0,
    currency text default 'AFN',
    image_url text, -- لینک مستقیم عکس آپلود شده در Cloudinary
    description text,
    created_at timestamptz default now()
);

-- ۵. جدول داروخانه‌ها، مطب‌ها و کلینیک‌ها (CUSTOMERS)
create table public.customers (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text,
    name text not null,
    manager_name text,
    phone text not null,
    province text,
    city text,
    address text,
    balance numeric(12, 2) default 0,
    created_at timestamptz default now()
);

-- ۶. جدول سفارشات ثبت شده ویزیتورها (ORDERS)
create table public.orders (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    customer_id text references public.customers(id) on delete cascade not null,
    customer_name text not null,
    items jsonb not null default '[]'::jsonb,
    total_amount numeric(12, 2) default 0,
    status text default 'pending',
    notes text,
    created_at timestamptz default now()
);

-- ۷. جدول پیام‌رسان و چت داخلی (MESSAGES)
create table public.messages (
    id text primary key,
    store_id text references public.stores(id) on delete cascade,
    conversation_id text not null,
    sender_id text not null,
    sender_name text not null,
    sender_role text not null,
    recipient_id text,
    text text,
    image_url text, -- پیوست عکس آپلود شده در Cloudinary
    is_read boolean default false,
    created_at timestamptz default now()
);

-- ۸. جدول گزارش ویزیت حضوری و موقعیت مکانی (VISITS)
create table public.visits (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    customer_id text not null,
    customer_name text not null,
    notes text,
    latitude double precision,
    longitude double precision,
    created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.visits enable row level security;

-- Public Anon access policy (مطابق با کلید عمومی Supabase برای کلاینت)
create policy "Allow all operations for anon" on public.stores for all using (true) with check (true);
create policy "Allow all operations for anon" on public.profiles for all using (true) with check (true);
create policy "Allow all operations for anon" on public.medicines for all using (true) with check (true);
create policy "Allow all operations for anon" on public.customers for all using (true) with check (true);
create policy "Allow all operations for anon" on public.orders for all using (true) with check (true);
create policy "Allow all operations for anon" on public.messages for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visits for all using (true) with check (true);
