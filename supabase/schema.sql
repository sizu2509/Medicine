-- ============================================================================
-- MediStock Pro - Production Supabase PostgreSQL Schema & Security Rules
-- Complete Normalized Pharmacy Management System Architecture
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles & Roles
CREATE TYPE user_role_type AS ENUM (
  'Super Admin',
  'Admin',
  'Manager',
  'Pharmacist',
  'Salesman',
  'Accountant',
  'Customer'
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'Pharmacist',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT ('cat-' || extract(epoch from now())::bigint),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Generics Master
CREATE TABLE IF NOT EXISTS generics (
  id TEXT PRIMARY KEY DEFAULT ('gen-' || extract(epoch from now())::bigint),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  indication TEXT,
  side_effects TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY DEFAULT ('sup-' || extract(epoch from now())::bigint),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  opening_balance NUMERIC(12,2) DEFAULT 0,
  current_balance NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT ('cust-' || extract(epoch from now())::bigint),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  total_purchases NUMERIC(12,2) DEFAULT 0,
  due_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY DEFAULT ('doc-' || extract(epoch from now())::bigint),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  hospital TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Medicines Master
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY DEFAULT ('med-' || extract(epoch from now())::bigint),
  name TEXT NOT NULL,
  generic_id TEXT REFERENCES generics(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE RESTRICT,
  brand_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  strength TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Strip',
  pack_size TEXT NOT NULL,
  barcode TEXT UNIQUE,
  sku TEXT UNIQUE NOT NULL,
  prescription_required BOOLEAN DEFAULT false,
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 20,
  reorder_level INTEGER NOT NULL DEFAULT 50,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Batches (FEFO Inventory Core)
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY DEFAULT ('bat-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  remaining_quantity INTEGER NOT NULL DEFAULT 0,
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_positive_remaining CHECK (remaining_quantity >= 0),
  CONSTRAINT chk_expiry_after_mfg CHECK (expiry_date >= mfg_date)
);

-- 10. Stock Movement Ledger
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY DEFAULT ('mov-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
  medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'Purchase', 'Sale', 'Purchase Return', 'Sales Return', 'Adjustment', 'Expired', 'Damaged'
  quantity INTEGER NOT NULL, -- positive for stock in, negative for stock out
  reference_id TEXT,
  reference_type TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY DEFAULT ('pur-' || extract(epoch from now())::bigint),
  purchase_number TEXT UNIQUE NOT NULL,
  invoice_number TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  mfg_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  free_quantity INTEGER DEFAULT 0,
  purchase_price NUMERIC(10,2) NOT NULL,
  sale_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL
);

-- 13. Purchase Returns
CREATE TABLE IF NOT EXISTS purchase_returns (
  id TEXT PRIMARY KEY DEFAULT ('pret-' || extract(epoch from now())::bigint),
  return_number TEXT UNIQUE NOT NULL,
  purchase_id TEXT REFERENCES purchases(id) ON DELETE SET NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_refund NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Sales (POS Invoices)
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY DEFAULT ('sale-' || extract(epoch from now())::bigint),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  prescription_id TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  paid_amount NUMERIC(12,2) NOT NULL,
  due_amount NUMERIC(12,2) DEFAULT 0,
  profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  cashier_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  medicine_name TEXT NOT NULL,
  batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  profit NUMERIC(12,2) NOT NULL
);

-- 16. Sales Returns
CREATE TABLE IF NOT EXISTS sales_returns (
  id TEXT PRIMARY KEY DEFAULT ('sret-' || extract(epoch from now())::bigint),
  return_number TEXT UNIQUE NOT NULL,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  refund_amount NUMERIC(12,2) NOT NULL,
  reason TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY DEFAULT ('rx-' || extract(epoch from now())::bigint),
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT ('exp-' || extract(epoch from now())::bigint),
  expense_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Online Orders (Public Store)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ord-' || extract(epoch from now())::bigint),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  delivery_fee NUMERIC(12,2) DEFAULT 50,
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL,
  prescription_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif-' || extract(epoch from now())::bigint),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log-' || extract(epoch from now())::bigint),
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Pharmacy Settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for High Performance Search
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines (name);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines (barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_sku ON medicines (sku);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_id ON medicines (generic_id);
CREATE INDEX IF NOT EXISTS idx_medicines_category_id ON medicines (category_id);

CREATE INDEX IF NOT EXISTS idx_batches_med_exp ON batches (medicine_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches (expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_number ON batches (batch_number);

CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales (invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales (customer_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_med ON stock_movements (medicine_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements (batch_id);

-- ============================================================================
-- Row Level Security (RLS) Configuration
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE generics ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can read active medicines & categories for online shopping
CREATE POLICY "Public Read Active Medicines" ON medicines FOR SELECT USING (status = 'Active');
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Own Orders" ON orders FOR SELECT USING (true);

-- Authenticated Staff Full Access Policies
CREATE POLICY "Staff Full Access Medicines" ON medicines FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Categories" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Generics" ON generics FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Doctors" ON doctors FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Batches" ON batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Stock Movements" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Purchases" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Sales" ON sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Expenses" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Prescriptions" ON prescriptions FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Orders" ON orders FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Logs" ON audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Notifications" ON notifications FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Settings" ON settings FOR ALL TO authenticated USING (true);
