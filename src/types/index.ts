// Domain types for MediStock Pro Pharmacy Management System

export type UserRole =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Pharmacist'
  | 'Salesman'
  | 'Accountant'
  | 'Customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Injection'
  | 'Cream'
  | 'Ointment'
  | 'Drops'
  | 'Inhaler'
  | 'Suspension'
  | 'Powder'
  | 'Sachet'
  | 'Suppository'
  | 'Other';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

export interface Generic {
  id: string;
  name: string;
  description?: string;
  indication?: string;
  side_effects?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  contact_person: string;
  opening_balance: number;
  current_balance: number;
  notes?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  total_purchases: number;
  due_amount: number;
  notes?: string;
  created_at?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  registration_number: string;
  hospital: string;
  phone: string;
  email?: string;
  address?: string;
  created_at?: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_id: string;
  generic_name?: string;
  category_id: string;
  category_name?: string;
  brand_name: string;
  manufacturer: string;
  dosage_form: DosageForm;
  strength: string;
  unit: string;
  pack_size: string;
  barcode: string;
  sku: string;
  prescription_required: boolean;
  purchase_price: number;
  sale_price: number;
  min_stock: number;
  reorder_level: number;
  description?: string;
  image_url?: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
  // Computed aggregations
  total_stock?: number;
  active_batches_count?: number;
}

export interface Batch {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  batch_number: string;
  mfg_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  purchase_price: number;
  sale_price: number;
  quantity: number;
  remaining_quantity: number;
  supplier_id: string;
  supplier_name?: string;
  purchase_id?: string;
  created_at?: string;
}

export type StockMovementType =
  | 'Purchase'
  | 'Sale'
  | 'Purchase Return'
  | 'Sales Return'
  | 'Adjustment'
  | 'Expired'
  | 'Damaged';

export interface StockMovement {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  batch_id: string;
  batch_number?: string;
  movement_type: StockMovementType;
  quantity: number; // positive or negative
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface PurchaseItem {
  id?: string;
  medicine_id: string;
  medicine_name?: string;
  batch_number: string;
  mfg_date: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number;
  purchase_price: number;
  sale_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_date: string;
  payment_type: 'Cash' | 'Bank' | 'bKash' | 'Nagad' | 'Due' | 'Credit';
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  notes?: string;
  items: PurchaseItem[];
  created_by?: string;
  created_at: string;
}

export interface PurchaseReturnItem {
  batch_id: string;
  medicine_id: string;
  medicine_name: string;
  return_qty: number;
  unit_price: number;
  total_amount: number;
  reason: string;
}

export interface PurchaseReturn {
  id: string;
  return_number: string;
  purchase_id: string;
  purchase_number?: string;
  supplier_id: string;
  supplier_name?: string;
  return_date: string;
  total_refund: number;
  notes?: string;
  items: PurchaseReturnItem[];
  created_by?: string;
  created_at: string;
}

export interface SaleItem {
  id?: string;
  medicine_id: string;
  medicine_name: string;
  batch_id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
}

export type PaymentMethod =
  | 'Cash'
  | 'Card'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Due'
  | 'Online';

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  prescription_id?: string;
  sale_date: string;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  due_amount: number;
  profit: number;
  cashier_name: string;
  notes?: string;
  items: SaleItem[];
  created_at: string;
}

export interface SalesReturnItem {
  sale_item_id?: string;
  medicine_id: string;
  medicine_name: string;
  batch_id: string;
  batch_number: string;
  return_qty: number;
  refund_price: number;
  total_refund: number;
}

export interface SalesReturn {
  id: string;
  return_number: string;
  sale_id: string;
  invoice_number: string;
  return_date: string;
  refund_amount: number;
  reason: string;
  items: SalesReturnItem[];
  created_by?: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  doctor_id?: string;
  doctor_name: string;
  prescription_date: string;
  file_url?: string;
  notes?: string;
  status: 'Pending' | 'Verified' | 'Dispensed' | 'Rejected';
  medicines?: {
    medicine_name: string;
    dosage: string;
    duration: string;
    instructions?: string;
  }[];
  created_at: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  date: string;
  category:
    | 'Rent'
    | 'Electricity'
    | 'Salary'
    | 'Transport'
    | 'Internet'
    | 'Maintenance'
    | 'Office'
    | 'Other';
  amount: number;
  payment_method: PaymentMethod;
  description: string;
  attachment_url?: string;
  created_by?: string;
  created_at: string;
}

export interface OnlineOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  items: {
    medicine_id: string;
    medicine_name: string;
    price: number;
    quantity: number;
    total: number;
    prescription_required?: boolean;
  }[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  prescription_url?: string;
  status:
    | 'Pending'
    | 'Confirmed'
    | 'Processing'
    | 'Ready'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled';
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'expiry' | 'order' | 'due' | 'system';
  read: boolean;
  link?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  created_at: string;
}

export interface PharmacySettings {
  pharmacy_name: string;
  tagline: string;
  logo_url?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  invoice_prefix: string;
  currency: string;
  currency_symbol: string;
  tax_rate: number; // percentage
  low_stock_threshold: number;
  expiry_warning_days: number;
  receipt_size: '58mm' | '80mm' | 'A4';
  date_format: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timezone: string;
  language: 'en' | 'bn';
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}
