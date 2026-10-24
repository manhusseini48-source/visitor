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
drop table if exists public.support_tickets cascade;
drop table if exists public.platform_config cascade;

-- ۲. جدول شرکت‌های پخش و فروشگاه‌ها (STORES)
create table if not exists public.stores (
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
create table if not exists public.profiles (
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
create table if not exists public.medicines (
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
create table if not exists public.customers (
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
create table if not exists public.orders (
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
create table if not exists public.visitor_cash_collections (
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
create table if not exists public.visitor_remittances (
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
create table if not exists public.messages (
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
create table if not exists public.visits (
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

-- ۱۱. جدول تیکت‌ها و پیام‌های پشتیبانی آنلاین (SUPPORT_TICKETS)
create table if not exists public.support_tickets (
    id text primary key,
    store_id text not null,
    store_name text default '',
    title text default '',
    description text default '',
    status text default 'open',
    messages jsonb default '[]'::jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ۱۲. جدول تنظیمات سراسری پلتفرم، نسخه و سوالات متداول (PLATFORM_CONFIG)
create table if not exists public.platform_config (
    id text primary key default 'global_config',
    app_name text default 'ویزیتور',
    short_description text default 'پنل ویزیتور دارو',
    app_release_version text default '2.5.0',
    app_version_code integer default 5,
    app_update_notes text default '',
    app_update_required boolean default false,
    plan_6month_price_afn numeric(12, 2) default 1700,
    plan_1year_price_afn numeric(12, 2) default 3000,
    support_phone text default '0784524918',
    support_whatsapp text default '0784524918',
    support_welcome_message text default '',
    support_faqs jsonb default '[]'::jsonb,
    public_announcement text default '',
    announcement_title text default '',
    announcement_type text default 'info',
    announcement_enabled boolean default false,
    updated_at timestamptz default now()
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
alter table public.support_tickets enable row level security;
alter table public.platform_config enable row level security;

-- Drop previous policies to avoid duplication
drop policy if exists "Allow all operations for anon" on public.stores;
drop policy if exists "Allow all operations for anon" on public.profiles;
drop policy if exists "Allow all operations for anon" on public.medicines;
drop policy if exists "Allow all operations for anon" on public.customers;
drop policy if exists "Allow all operations for anon" on public.orders;
drop policy if exists "Allow all operations for anon" on public.visitor_cash_collections;
drop policy if exists "Allow all operations for anon" on public.visitor_remittances;
drop policy if exists "Allow all operations for anon" on public.messages;
drop policy if exists "Allow all operations for anon" on public.visits;
drop policy if exists "Allow all operations for anon" on public.support_tickets;
drop policy if exists "Allow all operations for anon" on public.platform_config;

-- Public Anon access policies (دسترسی استاندارد کلاینت با کلید Anon برای خواندن، درج، ویرایش و حذف)
create policy "Allow all operations for anon" on public.stores for all using (true) with check (true);
create policy "Allow all operations for anon" on public.profiles for all using (true) with check (true);
create policy "Allow all operations for anon" on public.medicines for all using (true) with check (true);
create policy "Allow all operations for anon" on public.customers for all using (true) with check (true);
create policy "Allow all operations for anon" on public.orders for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visitor_cash_collections for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visitor_remittances for all using (true) with check (true);
create policy "Allow all operations for anon" on public.messages for all using (true) with check (true);
create policy "Allow all operations for anon" on public.visits for all using (true) with check (true);
create policy "Allow all operations for anon" on public.support_tickets for all using (true) with check (true);
create policy "Allow all operations for anon" on public.platform_config for all using (true) with check (true);

-- Enable Realtime for all shared business tables
do $$
begin
  alter publication supabase_realtime add table public.stores;
  alter publication supabase_realtime add table public.profiles;
  alter publication supabase_realtime add table public.medicines;
  alter publication supabase_realtime add table public.customers;
  alter publication supabase_realtime add table public.orders;
  alter publication supabase_realtime add table public.visitor_cash_collections;
  alter publication supabase_realtime add table public.visitor_remittances;
  alter publication supabase_realtime add table public.messages;
  alter publication supabase_realtime add table public.support_tickets;
  alter publication supabase_realtime add table public.platform_config;
exception
  when others then null;
end $$;

-- ۱۳. ایندکس‌های کلیدی جهت افزایش سرعت کوئری‌ها
create index if not exists idx_medicines_store_id on public.medicines(store_id);
create index if not exists idx_customers_store_id on public.customers(store_id);
create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_cash_collections_store on public.visitor_cash_collections(store_id);
create index if not exists idx_remittances_store on public.visitor_remittances(store_id);

-- ۱۴. رکوردهای پیش‌فرض اولیه (Seed Data)
insert into public.platform_config (
    id, app_name, short_description, app_release_version, app_version_code,
    app_update_notes, plan_6month_price_afn, plan_1year_price_afn,
    support_phone, support_whatsapp, support_welcome_message, updated_at
) values (
    'global_config', 'ویزیتور', 'پنل ویزیتور دارو', '2.5.0', 5,
    'همگام‌سازی کامل داروها، پیام‌ها، مدیریت پیشرفته کاربران و نسخه آنلاین',
    1700, 3000, '0784524918', '0784524918',
    'سلام و وقت بخیر! به واحد پشتیبانی آنلاین سامانه ویزیتور دارو خوش آمدید. پیام، سؤال یا تصویر مشکل خود را ارسال نمایید تا در اسرع وقت رسیدگی شود.',
    now()
) on conflict (id) do update set
    app_name = excluded.app_name,
    updated_at = now();

insert into public.profiles (
    id, name, phone, username, password_hash, role, city, is_active, created_at
) values (
    'user_maker_01', 'مدیر کل سامانه', '0700000000', 'maker_admin', '123456', 'maker_admin', 'کابل', true, now()
) on conflict (username) do nothing;
