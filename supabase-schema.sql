-- ========================================================
-- Schema for Visitor Pharma Management App (پلتفرم مدیریت ویزیتوری دارو)
-- Run this script in the Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ۱. پاکسازی ساختارهای قدیمی (در صورت راه‌اندازی اولیه و تمیز)
drop table if exists public.visitor_remittances cascade;
drop table if exists public.visitor_cash_collections cascade;
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
    allow_visitor_cash_collection boolean default true, -- مجوز دریافت بیعانه توسط ویزیتورها
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
    allow_cash_collection boolean default true, -- مجوز دریافت بیعانه به صورت اختصاصی برای ویزیتور
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
    form text, -- شکل دارویی: قرص، شربت، آمپول، کپسول، پماد و...
    strength text, -- دوز و قدرت دارو: 500mg, 100ml...
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

-- ۶. جدول سفارشات ثبت شده ویزیتورها همراه با وضعیت مالی (ORDERS)
create table public.orders (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    customer_id text references public.customers(id) on delete cascade not null,
    customer_name text not null,
    items jsonb not null default '[]'::jsonb,
    total_amount numeric(12, 2) default 0,
    paid_amount numeric(12, 2) default 0, -- مبلغ بیعانه یا پرداخت نقدی
    remaining_amount numeric(12, 2) default 0, -- مانده بدهی فاکتور
    payment_status text default 'unpaid', -- 'unpaid' | 'partial' | 'paid'
    payments jsonb default '[]'::jsonb, -- تاریخچه دریافت بیعانه‌ها و پرداخت‌ها
    status text default 'pending',
    notes text,
    created_at timestamptz default now()
);

-- ۷. جدول صندوق وصولی‌های و بیعانه‌های ویزیتورها (VISITOR_CASH_COLLECTIONS)
create table public.visitor_cash_collections (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    visitor_name text not null,
    order_id text references public.orders(id) on delete cascade,
    order_number text,
    customer_id text,
    customer_name text,
    amount_afn numeric(12, 2) not null default 0,
    collection_type text default 'deposit', -- 'deposit' | 'full_payment' | 'installment'
    payment_method text default 'cash', -- 'cash' | 'card_to_card' | 'bank_receipt'
    receipt_number text,
    notes text,
    date timestamptz default now(),
    status text default 'in_hand', -- 'in_hand' (نزد ویزیتور) | 'remitted' (تسویه با فروشگاه)
    remittance_id text,
    created_at timestamptz default now()
);

-- ۸. جدول واریزی‌ها و انتقالات ویزیتور به فروشگاه (VISITOR_REMITTANCES)
create table public.visitor_remittances (
    id text primary key,
    remittance_number text not null,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    visitor_name text not null,
    amount_afn numeric(12, 2) not null default 0,
    payment_method text default 'bank_transfer', -- 'bank_transfer' | 'cash_in_person' | 'exchange_remittance' | 'check'
    bank_name text,
    destination_account text,
    tracking_number text not null, -- شماره فیش یا پیگیری
    receipt_image_url text,
    notes text,
    submitted_at timestamptz default now(),
    status text default 'pending', -- 'pending' (در انتظار تایید فروشگاه) | 'approved' | 'rejected'
    reviewed_at timestamptz,
    reviewed_by text,
    reviewed_by_name text,
    rejection_reason text,
    created_at timestamptz default now()
);

-- ۹. جدول پیام‌رسان و چت داخلی (MESSAGES)
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

-- ۱۰. جدول گزارش ویزیت حضوری و مراجعات (VISITS)
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
alter table public.visitor_cash_collections enable row level security;
alter table public.visitor_remittances enable row level security;
alter table public.messages enable row level security;
alter table public.visits enable row level security;

-- Public Anon access policies (دسترسی استاندارد کلاینت با کلید Anon)
create policy "Allow all operations for anon" on public.stores for all using (true) with check (true);
create policy "Allow all operations for anon" on public.profiles for all using (true) with check (true);
create policy "Allow all operations for anon" on public.medicines for all using (true) with check (true);
create policy "Allow all operations for anon" on public.customers for all using (true) with check (true);
create policy "Allow all operations for anon" on public.orders for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visitor_cash_collections for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visitor_remittances for all using (true) with check (true);
create policy "Allow all operations for anon" on public.messages for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visits for all using (true) with check (true);
