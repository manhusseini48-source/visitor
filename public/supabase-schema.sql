-- ========================================================
-- Schema for Visitor Pharma Management App (پلتفرم مدیریت ویزیتوری دوا)
-- کاملاً امن و ضد خطا (Idempotent): بدون حذف داده‌های قبلی با قابلیت اجرای مکرر
-- ========================================================

-- فعال‌سازی افزونه UUID
create extension if not exists "uuid-ossp";

-- ۱. جدول شرکت‌های پخش و فروشگاه‌ها (STORES)
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
    allow_visitor_cash_collection boolean default true,
    created_at timestamptz default now()
);

-- ۲. جدول کاربران، مدیران، مالکین و ویزیتورها (PROFILES)
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
    allow_cash_collection boolean default true,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- ۳. جدول کاتالوگ و انبار دواها همراه با عکس (MEDICINES)
create table if not exists public.medicines (
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
    image_url text,
    description text,
    created_at timestamptz default now()
);

-- ۴. جدول دواخانه‌ها، کلینیک‌ها و مشتریان (CUSTOMERS)
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

-- ۵. جدول سفارشات ثبت شده ویزیتورها (ORDERS)
create table if not exists public.orders (
    id text primary key,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    customer_id text references public.customers(id) on delete cascade not null,
    customer_name text not null,
    items jsonb not null default '[]'::jsonb,
    total_amount numeric(12, 2) default 0,
    payment_type text default 'cash',
    status text default 'pending',
    is_delivered boolean default false,
    notes text,
    created_at timestamptz default now()
);

-- ۶. جدول وصولی‌ها و بیعانه‌های نقدی ویزیتورها (VISITOR_CASH_COLLECTIONS)
create table if not exists public.visitor_cash_collections (
    id text primary key,
    collection_number text not null,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    visitor_name text not null,
    customer_id text references public.customers(id) on delete cascade not null,
    customer_name text not null,
    order_id text references public.orders(id) on delete set null,
    amount_afn numeric(12, 2) not null default 0,
    payment_method text default 'cash',
    receipt_number text,
    notes text,
    date timestamptz default now(),
    status text default 'in_hand',
    remittance_id text,
    created_at timestamptz default now()
);

-- ۷. جدول حواله‌ها و تسویه‌حساب ویزیتورها با فروشگاه (VISITOR_REMITTANCES)
create table if not exists public.visitor_remittances (
    id text primary key,
    remittance_number text not null,
    store_id text references public.stores(id) on delete cascade not null,
    visitor_id text not null,
    visitor_name text not null,
    amount_afn numeric(12, 2) not null default 0,
    payment_method text default 'cash',
    bank_name text,
    destination_account text,
    tracking_number text,
    receipt_image_url text,
    notes text,
    submitted_at timestamptz default now(),
    status text default 'pending',
    reviewed_at timestamptz,
    reviewed_by text,
    reviewed_by_name text,
    rejection_reason text,
    created_at timestamptz default now()
);

-- ۸. جدول پیام‌رسان و چت داخلی (MESSAGES)
create table if not exists public.messages (
    id text primary key,
    store_id text references public.stores(id) on delete cascade,
    conversation_id text not null,
    sender_id text not null,
    sender_name text not null,
    sender_role text not null,
    recipient_id text,
    text text,
    image_url text,
    is_read boolean default false,
    created_at timestamptz default now()
);

-- ۹. جدول گزارش ویزیت حضوری و مراجعات (VISITS)
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

-- ۱۰. جدول تیکت‌ها و پیام‌های پشتیبانی آنلاین (SUPPORT_TICKETS)
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

-- ۱۱. جدول تنظیمات سراسری پلتفرم، نسخه و سوالات متداول (PLATFORM_CONFIG)
create table if not exists public.platform_config (
    id text primary key default 'global_config',
    app_name text default 'ویزیتور',
    short_description text default 'پنل ویزیتور دوا',
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

-- ۱۲. جدول ثبت آمار ورود کاربران مهمان و دستگاه‌ها (GUEST_SESSIONS)
create table if not exists public.guest_sessions (
    id text primary key,
    device_type text default 'mobile',
    os text default '',
    browser text default '',
    screen_width integer default 0,
    screen_height integer default 0,
    viewport_width integer default 0,
    viewport_height integer default 0,
    user_agent text default '',
    language text default '',
    is_standalone_pwa boolean default false,
    created_at timestamptz default now()
);

-- ۱۳. اطمینان از وجود ستون‌های تکمیلی در صورت وجود قبلی جداول (Safe Column Migrations)
alter table public.stores add column if not exists allow_visitor_cash_collection boolean default true;
alter table public.profiles add column if not exists allow_cash_collection boolean default true;
alter table public.profiles add column if not exists avatar_url text;
alter table public.medicines add column if not exists image_url text;
alter table public.messages add column if not exists image_url text;
alter table public.guest_sessions add column if not exists is_standalone_pwa boolean default false;

-- ۱۴. فعال‌سازی امنیت سطح ردیف (Row Level Security)
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
alter table public.guest_sessions enable row level security;

-- حذف سیاست‌های قدیمی جهت جلوگیری از خطای duplicate policy
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
drop policy if exists "Allow all operations for anon" on public.guest_sessions;

-- تعریف سیاست‌های دسترسی Anon با RLS
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
create policy "Allow all operations for anon" on public.guest_sessions for all using (true) with check (true);

-- ۱۵. فعال‌سازی ایمن Realtime بدون خطا برای جداول زنده
do $$
begin
  begin alter publication supabase_realtime add table public.stores; exception when others then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when others then null; end;
  begin alter publication supabase_realtime add table public.medicines; exception when others then null; end;
  begin alter publication supabase_realtime add table public.customers; exception when others then null; end;
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
  begin alter publication supabase_realtime add table public.visitor_cash_collections; exception when others then null; end;
  begin alter publication supabase_realtime add table public.visitor_remittances; exception when others then null; end;
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.visits; exception when others then null; end;
  begin alter publication supabase_realtime add table public.support_tickets; exception when others then null; end;
  begin alter publication supabase_realtime add table public.platform_config; exception when others then null; end;
  begin alter publication supabase_realtime add table public.guest_sessions; exception when others then null; end;
end $$;

-- ۱۶. ایندکس‌های کلیدی جهت تفکیک صددرصدی داده‌ها بر اساس store_id و افزایش شتاب
create index if not exists idx_medicines_store_id on public.medicines(store_id);
create index if not exists idx_customers_store_id on public.customers(store_id);
create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_cash_collections_store on public.visitor_cash_collections(store_id);
create index if not exists idx_remittances_store on public.visitor_remittances(store_id);
create index if not exists idx_visits_store_id on public.visits(store_id);
create index if not exists idx_support_tickets_store on public.support_tickets(store_id);
create index if not exists idx_guest_sessions_created on public.guest_sessions(created_at desc);

-- ۱۷. رکوردهای اولیه و پیش‌فرض (Seed Data)
insert into public.platform_config (
    id, app_name, short_description, app_release_version, app_version_code,
    app_update_notes, plan_6month_price_afn, plan_1year_price_afn,
    support_phone, support_whatsapp, support_welcome_message, updated_at
) values (
    'global_config', 'ویزیتور', 'پنل ویزیتور دوا', '2.5.0', 5,
    'همگام‌سازی کامل دواها، پیام‌ها، مدیریت پیشرفته کاربران و نسخه آنلاین',
    1700, 3000, '0784524918', '0784524918',
    'سلام و وقت بخیر! به واحد پشتیبانی آنلاین سامانه ویزیتور دوا خوش آمدید. پیام، سؤال یا تصویر مشکل خود را ارسال نمایید تا در اسرع وقت رسیدگی شود.',
    now()
) on conflict (id) do update set
    app_name = excluded.app_name,
    short_description = excluded.short_description,
    updated_at = now();

insert into public.profiles (
    id, name, phone, username, password_hash, role, city, is_active, created_at
) values (
    'user_maker_01', 'مدیر کل سامانه', '0700000000', 'maker_admin', '123456', 'maker_admin', 'کابل', true, now()
) on conflict (username) do nothing;
