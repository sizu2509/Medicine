# MediStock Pro - Cloud Pharmacy & Medical Store Management System

**MediStock Pro** is a modern, responsive, commercial-grade cloud Pharmacy and Medical Store Management SaaS application built for modern pharmacies and healthcare providers (with full Bangladesh localized support: ৳ BDT, bKash, Nagad, Rocket, DGDA compliance, and FEFO inventory).

---

## 🌟 Key Features

### 1. FEFO (First-Expire, First-Out) Batch Inventory Engine
- Every purchased medicine is strictly stored and tracked at the **Batch** level with its own manufacturing date, expiry date, purchase price, and remaining quantity.
- Automated FEFO allocation selects earliest expiring batches during POS sales.
- **Strict Compliance Rule**: Expired batches are automatically locked from sale and highlighted in real-time.
- Physical stock audit reconciliation with reason logging (Damaged, Expired, Physical count difference).

### 2. High-Speed Pharmacy POS Terminal
- Search medicines by brand name, generic molecule, SKU, or barcode scanner.
- Keyboard shortcuts (`F2` Search, `F4` Customer, `Enter` Add, `Esc` Close).
- Walk-in or registered patient selection with automatic due balance tracking.
- Instant thermal receipt printing (80mm / 58mm) and standard A4 commercial tax invoice printing.
- Payment methods: Cash, bKash, Nagad, Rocket, Bank Card, and Due credit.
- Computes profit per item using the exact batch acquisition purchase rate.

### 3. Purchasing & Supplier Procurement
- Multi-item supplier purchase invoices.
- Automatically creates or increments inventory batches, logs immutable stock movements, and updates supplier balance.
- Purchase return module with stock return validation.

### 4. Public Online Pharmacy & Delivery Portal
- Modern customer storefront (`/`, `/medicines`, `/cart`, `/checkout`, `/order-success`).
- Medicine search with generic alternatives explorer.
- **Strict Prescription (Rx) Enforcement**: Regulated medicines require a prescription upload before orders can be placed.
- Live order status tracking in the Admin Prescriptions dashboard.

### 5. Multi-Role RBAC (Role-Based Access Control)
- **Super Admin**: Complete unrestricted system access.
- **Admin**: Full inventory, sales, purchases, customers, and reports.
- **Manager**: Inventory, procurement, sales, and analytics.
- **Pharmacist**: POS dispensing, prescription audits, and batch validation.
- **Salesman**: Fast POS counter checkout.
- **Accountant**: Operating expenses, accounts receivable/payable, and financial P&L.

### 6. Financial Accounting & P&L
- Real-time Gross Sales, Customer Discounts, Net Sales Revenue.
- Cost of Goods Sold (COGS) audited via actual batch acquisition prices.
- Gross Margin %, OPEX expense tracker, and audited Net Operating Profit.

---

## 🚀 Deployment Instructions

### A. Supabase Cloud Database Setup
1. Create a new project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** tab in your Supabase dashboard.
3. Open `/supabase/schema.sql` from this repository, paste it into the editor, and click **Run**.
4. In your Supabase dashboard, go to **Project Settings** &rarr; **API**:
   - Copy the **Project URL**.
   - Copy the **anon / public** API Key.
5. In MediStock Pro, click the **Supabase** icon in the top header and paste your credentials, or define them in your environment variables.

---

### B. Environment Variables (`.env`)
```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

---

### C. Netlify Deployment
1. Connect your GitHub repository to [Netlify](https://www.netlify.com/).
2. Set Build Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. In **Site Configuration &rarr; Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy Site**.

---

### D. GitHub Repository Setup
```bash
git init
git add .
git commit -m "Initial commit: MediStock Pro Pharmacy Management System"
git branch -M main
git remote add origin https://github.com/your-username/medistock-pro.git
git push -u origin main
```

---

## 💻 Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend / Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Local Fallback**: Reactive persistent browser database for offline / AI Studio immediate preview.
- **Printing**: Direct thermal receipt (80mm) and A4 invoice generator.
