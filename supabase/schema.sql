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

-- 23. Notices & Announcements Table
CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY DEFAULT ('notc-' || extract(epoch from now())::bigint),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'photo',
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 24. Media Gallery (Photos, Videos, Notices, Attachments)
CREATE TABLE IF NOT EXISTS media_gallery (
  id TEXT PRIMARY KEY DEFAULT ('med-' || extract(epoch from now())::bigint),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo', -- 'photo', 'video', 'notice', 'document'
  file_size BIGINT,
  tag TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE media_gallery ENABLE ROW LEVEL SECURITY;

-- Public can read active medicines & categories & notices for public display
CREATE POLICY "Public Read Active Medicines" ON medicines FOR SELECT USING (status = 'Active');
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Published Notices" ON notices FOR SELECT USING (is_published = true);
CREATE POLICY "Public Read Media Gallery" ON media_gallery FOR SELECT USING (true);
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
CREATE POLICY "Staff Full Access Notices" ON notices FOR ALL TO authenticated USING (true);
CREATE POLICY "Staff Full Access Media" ON media_gallery FOR ALL TO authenticated USING (true);

-- ============================================================================
-- Supabase Storage Buckets Setup (Media, Photos, Videos, Notices, Prescriptions)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media', 'media', true),
  ('photos', 'photos', true),
  ('videos', 'videos', true),
  ('notices', 'notices', true),
  ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Allow public read access on storage objects in these buckets
CREATE POLICY "Public Access Storage Objects" ON storage.objects
  FOR SELECT USING (bucket_id IN ('media', 'photos', 'videos', 'notices', 'prescriptions'));

-- Allow upload access to public and authenticated users for prescriptions and media
CREATE POLICY "Allow All Insert Storage Objects" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('media', 'photos', 'videos', 'notices', 'prescriptions'));

-- ============================================================================
-- Initial Seed Data (Categories, Generics, Suppliers, Medicines, Batches, Notices)
-- ============================================================================

-- 1. Categories
INSERT INTO categories (id, name, slug, description, is_active) VALUES
  ('cat-1', 'Analgesic & Antipyretic', 'analgesic', 'Pain relief and fever reducers', true),
  ('cat-2', 'Antibiotic', 'antibiotic', 'Bacterial infection treatments', true),
  ('cat-3', 'Antacid & Antiulcer', 'antacid', 'Gastric acid and ulcer care', true),
  ('cat-4', 'Antihistamine', 'antihistamine', 'Allergy and cold relief', true),
  ('cat-5', 'Diabetes Care', 'diabetes', 'Insulin and oral hypoglycemics', true),
  ('cat-6', 'Blood Pressure & Cardiac', 'cardiac', 'Hypertension and heart health', true),
  ('cat-7', 'Vitamins & Supplements', 'vitamins', 'Nutritional and multivitamin aids', true),
  ('cat-8', 'Respiratory & Asthma', 'respiratory', 'Bronchodilators & inhalers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Generics
INSERT INTO generics (id, name, description, indication, side_effects, status) VALUES
  ('gen-1', 'Paracetamol', 'Analgesic & antipyretic agent', 'Fever, mild pain, headache', 'Rare at therapeutic dose', 'Active'),
  ('gen-2', 'Omeprazole', 'Proton-pump inhibitor (PPI)', 'GERD, peptic ulcer, acid reflux', 'Abdominal pain, headache', 'Active'),
  ('gen-3', 'Esomeprazole', 'S-isomer of omeprazole PPI', 'Erosive esophagitis, acid reflux', 'Nausea, flatulence', 'Active'),
  ('gen-4', 'Ciprofloxacin', 'Fluoroquinolone antibiotic', 'Urinary tract infections, respiratory infections', 'Tendinitis risk, dizziness', 'Active'),
  ('gen-5', 'Montelukast', 'Leukotriene receptor antagonist', 'Chronic asthma, allergic rhinitis', 'Headache', 'Active'),
  ('gen-6', 'Metformin Hydrochloride', 'Biguanide antihyperglycemic', 'Type 2 diabetes mellitus', 'GI upset', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 3. Suppliers
INSERT INTO suppliers (id, name, company, phone, email, address, contact_person, opening_balance, current_balance) VALUES
  ('sup-1', 'Square Pharmaceuticals Ltd.', 'Square Group Bangladesh', '+880 1711-234567', 'distribution@squarepharma.com.bd', 'Square Centre, 48 Mohakhali C/A, Dhaka-1212', 'Md. Rafiqul Islam', 0, 14500),
  ('sup-2', 'Beximco Pharmaceuticals Ltd.', 'Beximco Group', '+880 1712-345678', 'supply@beximcopharma.com', '19 Dhanmondi R/A, Road 7, Dhaka-1205', 'Tanvir Hossain', 0, 8200),
  ('sup-3', 'Incepta Pharmaceuticals Ltd.', 'Incepta Group', '+880 1713-456789', 'sales@inceptapharma.com', '40 Shahid Tajuddin Ahmed Sarani, Tejgaon, Dhaka', 'Kamrul Hasan', 0, 0),
  ('sup-4', 'Renata Limited', 'Renata Pharma', '+880 1714-567890', 'orders@renata-ltd.com', 'Plot # 1, Milk Vita Road, Section-7, Mirpur, Dhaka', 'Nasim Akhtar', 0, 4200)
ON CONFLICT (id) DO NOTHING;

-- 4. Medicines
INSERT INTO medicines (id, name, generic_id, category_id, brand_name, manufacturer, dosage_form, strength, unit, pack_size, barcode, sku, prescription_required, purchase_price, sale_price, min_stock, reorder_level, status) VALUES
  ('med-1', 'Napa Extra 500mg+65mg', 'gen-1', 'cat-1', 'Napa Extra', 'Beximco Pharmaceuticals Ltd.', 'Tablet', '500mg + 65mg', 'Strip', '10 Tablets/Strip', '894123456001', 'MED-NAP-EXT', false, 22.00, 28.00, 50, 100, 'Active'),
  ('med-2', 'Seclo 20mg Capsule', 'gen-2', 'cat-3', 'Seclo', 'Square Pharmaceuticals Ltd.', 'Capsule', '20mg', 'Strip', '10 Capsules/Strip', '894123456002', 'MED-SEC-020', false, 48.00, 60.00, 40, 80, 'Active'),
  ('med-3', 'Maxpro 20mg Tablet', 'gen-3', 'cat-3', 'Maxpro', 'Renata Limited', 'Tablet', '20mg', 'Strip', '14 Tablets/Strip', '894123456003', 'MED-MAX-020', false, 85.00, 105.00, 30, 60, 'Active'),
  ('med-4', 'Ciprocin 500mg Tablet', 'gen-4', 'cat-2', 'Ciprocin', 'Square Pharmaceuticals Ltd.', 'Tablet', '500mg', 'Strip', '10 Tablets/Strip', '894123456004', 'MED-CIP-500', true, 110.00, 140.00, 25, 50, 'Active'),
  ('med-5', 'Monas 10mg Tablet', 'gen-5', 'cat-8', 'Monas', 'The ACME Laboratories Ltd.', 'Tablet', '10mg', 'Strip', '10 Tablets/Strip', '894123456005', 'MED-MON-010', true, 125.00, 160.00, 30, 70, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 5. Batches (FEFO Inventory Core)
INSERT INTO batches (id, medicine_id, batch_number, mfg_date, expiry_date, purchase_price, sale_price, quantity, remaining_quantity, supplier_id) VALUES
  ('bat-1', 'med-1', 'NP-24A01', '2025-01-15', '2027-01-14', 22.00, 28.00, 150, 85, 'sup-2'),
  ('bat-2', 'med-1', 'NP-25B02', '2025-06-10', '2027-06-09', 22.00, 28.00, 200, 200, 'sup-2'),
  ('bat-3', 'med-2', 'SC-24K09', '2024-11-01', '2026-10-31', 48.00, 60.00, 100, 18, 'sup-1'),
  ('bat-4', 'med-2', 'SC-25D14', '2025-04-10', '2027-04-09', 48.00, 60.00, 120, 110, 'sup-1'),
  ('bat-5', 'med-3', 'MX-25A11', '2025-02-01', '2027-08-31', 85.00, 105.00, 90, 52, 'sup-4'),
  ('bat-7', 'med-4', 'CP-25F18', '2025-06-01', '2027-05-31', 110.00, 140.00, 60, 45, 'sup-1')
ON CONFLICT (id) DO NOTHING;

-- 6. Notices
INSERT INTO notices (id, title, category, content, media_url, is_pinned, is_published) VALUES
  ('notc-1', 'Free Blood Pressure & Glucose Screening Every Friday', 'Healthcare', 'Visit our Gulshan branch for free complimentary blood pressure and random blood sugar checkups supervised by registered pharmacists.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80', true, true),
  ('notc-2', 'Seasonal Dengue Prevention & Hydration Guidelines', 'Regulatory', 'Important public health advisory: Use DGDA approved paracetamol only and avoid NSAIDs without doctor consultation during fever.', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80', false, true),
  ('notc-3', '10% Cashback on bKash & Nagad Online Payments', 'Discount & Offer', 'Get 10% instant discount up to ৳100 on all online medicine deliveries paid via bKash or Nagad.', 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&auto=format&fit=crop&q=80', false, true)
ON CONFLICT (id) DO NOTHING;


