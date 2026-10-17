-- Migration 001: Initial schema for ویزیتور دارو
-- Enables PostgreSQL Row Level Security (RLS) and multi-tenant store isolation

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('store_owner', 'visitor', 'maker_admin')),
  store_id UUID,
  avatar_url TEXT,
  city TEXT DEFAULT 'کابل',
  address TEXT,
  base_salary NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 4.0,
  commission_basis TEXT DEFAULT 'delivered_order',
  monthly_target NUMERIC DEFAULT 250000,
  weekly_target NUMERIC DEFAULT 60000,
  employment_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Stores Table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  group_chat_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Store Subscriptions (14 days trial default)
CREATE TABLE IF NOT EXISTS store_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT '14-Day Trial',
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'suspended')),
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  price_afn NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(40) NOT NULL,
  brand TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  code TEXT NOT NULL,
  unit TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  stock INT DEFAULT 0,
  min_stock_alert INT DEFAULT 20,
  category TEXT DEFAULT 'عمومی',
  expiry_date DATE NOT NULL,
  batch_number TEXT NOT NULL,
  short_description VARCHAR(200),
  full_description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  trade_name TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'کابل',
  area TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  primary_visitor_id UUID REFERENCES profiles(id),
  shared_visitor_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  visitor_id UUID REFERENCES profiles(id),
  visitor_name TEXT NOT NULL,
  subtotal_afn NUMERIC NOT NULL,
  discount_afn NUMERIC DEFAULT 0,
  total_afn NUMERIC NOT NULL,
  paid_amount_afn NUMERIC DEFAULT 0,
  remaining_amount_afn NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '[]'::jsonb,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id),
  medicine_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_afn NUMERIC DEFAULT 0,
  total_afn NUMERIC NOT NULL
);

-- 8. Visits Schedule
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES profiles(id),
  visitor_name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  completed_time TIMESTAMPTZ,
  outcome TEXT,
  notes TEXT,
  next_followup_date DATE,
  status TEXT DEFAULT 'scheduled'
);

-- 9. Visitor Ledger Entries
CREATE TABLE IF NOT EXISTS visitor_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_id UUID,
  date TIMESTAMPTZ DEFAULT now(),
  registered_by TEXT NOT NULL
);

-- 10. Conversations and Messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('private', 'store_group')),
  visitor_id UUID REFERENCES profiles(id),
  visitor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text TEXT,
  image_url TEXT,
  order_doc_attachment JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'open',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Row Level Security Policies (RLS)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
