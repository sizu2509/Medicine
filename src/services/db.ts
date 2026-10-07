import {
  Medicine,
  Batch,
  Category,
  Generic,
  Supplier,
  Customer,
  Doctor,
  StockMovement,
  Purchase,
  PurchaseReturn,
  Sale,
  SalesReturn,
  Expense,
  Prescription,
  OnlineOrder,
  Notification,
  AuditLog,
  PharmacySettings,
  Notice,
  MediaItem,
} from '../types';
import {
  initialCategories,
  initialGenerics,
  initialSuppliers,
  initialCustomers,
  initialDoctors,
  initialMedicines,
  initialBatches,
  initialStockMovements,
  initialPurchases,
  initialSales,
  initialExpenses,
  initialPrescriptions,
  initialOrders,
  defaultSettings,
  initialNotifications,
  initialAuditLogs,
  initialNotices,
  initialMedia,
} from './seedData';
import { getSupabase } from '../lib/supabase';

const STORAGE_KEY = 'medistock_db_store_v1';

interface DBState {
  categories: Category[];
  generics: Generic[];
  suppliers: Supplier[];
  customers: Customer[];
  doctors: Doctor[];
  medicines: Medicine[];
  batches: Batch[];
  stockMovements: StockMovement[];
  purchases: Purchase[];
  purchaseReturns: PurchaseReturn[];
  sales: Sale[];
  salesReturns: SalesReturn[];
  expenses: Expense[];
  prescriptions: Prescription[];
  orders: OnlineOrder[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: PharmacySettings;
  notices: Notice[];
  media: MediaItem[];
}

const getInitialState = (): DBState => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          notices: parsed.notices || initialNotices,
          media: parsed.media || initialMedia,
        };
      } catch (e) {
        console.error('Error parsing stored database state, restoring defaults:', e);
      }
    }
  }
  return {
    categories: initialCategories,
    generics: initialGenerics,
    suppliers: initialSuppliers,
    customers: initialCustomers,
    doctors: initialDoctors,
    medicines: initialMedicines,
    batches: initialBatches,
    stockMovements: initialStockMovements,
    purchases: initialPurchases,
    purchaseReturns: [],
    sales: initialSales,
    salesReturns: [],
    expenses: initialExpenses,
    prescriptions: initialPrescriptions,
    orders: initialOrders,
    notifications: initialNotifications,
    auditLogs: initialAuditLogs,
    settings: defaultSettings,
    notices: initialNotices,
    media: initialMedia,
  };
};

let currentState: DBState = getInitialState();
const listeners: Array<() => void> = [];

const persist = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  }
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Listener callback failed:', e);
    }
  });
};

export const subscribeToDB = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
};

// Log an audit trail item
export const logAudit = (action: string, module: string, details?: string, recordId?: string) => {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_email: 'pharmacist@medistockpro.com',
    user_role: 'Staff',
    action,
    module,
    record_id: recordId,
    details,
    created_at: new Date().toISOString(),
  };
  currentState.auditLogs.unshift(newLog);
  persist();
};

export const isExpired = (expiryDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return exp.getTime() < today.getTime();
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Core Database Service
export const db = {
  // Sync with Supabase if online
  async syncFromSupabase() {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
      const { data: medicines } = await supabase.from('medicines').select('*');
      if (medicines && medicines.length > 0) {
        currentState.medicines = medicines;
      }
      const { data: batches } = await supabase.from('batches').select('*');
      if (batches && batches.length > 0) {
        currentState.batches = batches;
      }
      persist();
      return true;
    } catch (e) {
      console.warn('Supabase sync skipped/failed:', e);
      return false;
    }
  },

  // Reset demo database to factory defaults
  resetToDefaults() {
    currentState = {
      categories: initialCategories,
      generics: initialGenerics,
      suppliers: initialSuppliers,
      customers: initialCustomers,
      doctors: initialDoctors,
      medicines: initialMedicines,
      batches: initialBatches,
      stockMovements: initialStockMovements,
      purchases: initialPurchases,
      purchaseReturns: [],
      sales: initialSales,
      salesReturns: [],
      expenses: initialExpenses,
      prescriptions: initialPrescriptions,
      orders: initialOrders,
      notifications: initialNotifications,
      auditLogs: initialAuditLogs,
      settings: defaultSettings,
      notices: initialNotices,
      media: initialMedia,
    };
    persist();
  },

  // Settings
  getSettings(): PharmacySettings {
    return { ...currentState.settings };
  },

  updateSettings(newSettings: Partial<PharmacySettings>) {
    currentState.settings = { ...currentState.settings, ...newSettings };
    logAudit('Settings Updated', 'Settings', 'Pharmacy settings were updated');
    persist();
    return currentState.settings;
  },

  // Categories
  getCategories(): Category[] {
    return [...currentState.categories];
  },

  saveCategory(cat: Omit<Category, 'id'> & { id?: string }): Category {
    if (cat.id) {
      const index = currentState.categories.findIndex((c) => c.id === cat.id);
      if (index > -1) {
        currentState.categories[index] = { ...currentState.categories[index], ...cat };
        persist();
        logAudit('Category Updated', 'Category', `Category: ${cat.name}`, cat.id);
        return currentState.categories[index];
      }
    }
    const newCat: Category = {
      ...cat,
      id: `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.categories.push(newCat);
    logAudit('Category Created', 'Category', `Category: ${cat.name}`, newCat.id);
    persist();
    return newCat;
  },

  deleteCategory(id: string): boolean {
    const initialLen = currentState.categories.length;
    currentState.categories = currentState.categories.filter((c) => c.id !== id);
    if (currentState.categories.length !== initialLen) {
      logAudit('Category Deleted', 'Category', `Deleted ID: ${id}`, id);
      persist();
      return true;
    }
    return false;
  },

  // Generics
  getGenerics(): Generic[] {
    return [...currentState.generics];
  },

  saveGeneric(gen: Omit<Generic, 'id'> & { id?: string }): Generic {
    if (gen.id) {
      const index = currentState.generics.findIndex((g) => g.id === gen.id);
      if (index > -1) {
        currentState.generics[index] = { ...currentState.generics[index], ...gen };
        persist();
        logAudit('Generic Updated', 'Generic', `Generic: ${gen.name}`, gen.id);
        return currentState.generics[index];
      }
    }
    const newGen: Generic = {
      ...gen,
      id: `gen-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.generics.push(newGen);
    logAudit('Generic Created', 'Generic', `Generic: ${gen.name}`, newGen.id);
    persist();
    return newGen;
  },

  deleteGeneric(id: string): boolean {
    const initialLen = currentState.generics.length;
    currentState.generics = currentState.generics.filter((g) => g.id !== id);
    if (currentState.generics.length !== initialLen) {
      logAudit('Generic Deleted', 'Generic', `Deleted ID: ${id}`, id);
      persist();
      return true;
    }
    return false;
  },

  // Suppliers
  getSuppliers(): Supplier[] {
    return [...currentState.suppliers];
  },

  saveSupplier(sup: Omit<Supplier, 'id'> & { id?: string }): Supplier {
    if (sup.id) {
      const index = currentState.suppliers.findIndex((s) => s.id === sup.id);
      if (index > -1) {
        currentState.suppliers[index] = { ...currentState.suppliers[index], ...sup };
        persist();
        logAudit('Supplier Updated', 'Supplier', `Supplier: ${sup.name}`, sup.id);
        return currentState.suppliers[index];
      }
    }
    const newSup: Supplier = {
      ...sup,
      id: `sup-${Date.now()}`,
      current_balance: sup.current_balance ?? sup.opening_balance ?? 0,
      created_at: new Date().toISOString(),
    };
    currentState.suppliers.push(newSup);
    logAudit('Supplier Created', 'Supplier', `Supplier: ${sup.name}`, newSup.id);
    persist();
    return newSup;
  },

  deleteSupplier(id: string): boolean {
    currentState.suppliers = currentState.suppliers.filter((s) => s.id !== id);
    logAudit('Supplier Deleted', 'Supplier', `Deleted ID: ${id}`, id);
    persist();
    return true;
  },

  // Customers
  getCustomers(): Customer[] {
    return [...currentState.customers];
  },

  saveCustomer(cust: Omit<Customer, 'id'> & { id?: string }): Customer {
    if (cust.id) {
      const index = currentState.customers.findIndex((c) => c.id === cust.id);
      if (index > -1) {
        currentState.customers[index] = { ...currentState.customers[index], ...cust };
        persist();
        logAudit('Customer Updated', 'Customer', `Customer: ${cust.name}`, cust.id);
        return currentState.customers[index];
      }
    }
    const newCust: Customer = {
      ...cust,
      id: `cust-${Date.now()}`,
      total_purchases: cust.total_purchases || 0,
      due_amount: cust.due_amount || 0,
      created_at: new Date().toISOString(),
    };
    currentState.customers.push(newCust);
    logAudit('Customer Created', 'Customer', `Customer: ${cust.name}`, newCust.id);
    persist();
    return newCust;
  },

  deleteCustomer(id: string): boolean {
    currentState.customers = currentState.customers.filter((c) => c.id !== id);
    logAudit('Customer Deleted', 'Customer', `Deleted ID: ${id}`, id);
    persist();
    return true;
  },

  // Doctors
  getDoctors(): Doctor[] {
    return [...currentState.doctors];
  },

  saveDoctor(doc: Omit<Doctor, 'id'> & { id?: string }): Doctor {
    if (doc.id) {
      const index = currentState.doctors.findIndex((d) => d.id === doc.id);
      if (index > -1) {
        currentState.doctors[index] = { ...currentState.doctors[index], ...doc };
        persist();
        logAudit('Doctor Updated', 'Doctor', `Doctor: ${doc.name}`, doc.id);
        return currentState.doctors[index];
      }
    }
    const newDoc: Doctor = {
      ...doc,
      id: `doc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.doctors.push(newDoc);
    logAudit('Doctor Created', 'Doctor', `Doctor: ${doc.name}`, newDoc.id);
    persist();
    return newDoc;
  },

  // Medicines (with enriched stock and batch count)
  getMedicines(): Medicine[] {
    return currentState.medicines.map((m) => {
      // Find batches for this medicine
      const mBatches = currentState.batches.filter((b) => b.medicine_id === m.id);
      // Valid non-expired remaining stock
      const total_stock = mBatches.reduce((acc, b) => acc + (b.remaining_quantity || 0), 0);
      const active_batches_count = mBatches.filter((b) => b.remaining_quantity > 0 && !isExpired(b.expiry_date)).length;
      const generic = currentState.generics.find((g) => g.id === m.generic_id);
      const category = currentState.categories.find((c) => c.id === m.category_id);

      return {
        ...m,
        total_stock,
        active_batches_count,
        generic_name: generic ? generic.name : undefined,
        category_name: category ? category.name : undefined,
      };
    });
  },

  getMedicineById(id: string): Medicine | undefined {
    const medicines = this.getMedicines();
    return medicines.find((m) => m.id === id);
  },

  saveMedicine(med: Omit<Medicine, 'id'> & { id?: string }): Medicine {
    if (med.id) {
      const index = currentState.medicines.findIndex((m) => m.id === med.id);
      if (index > -1) {
        currentState.medicines[index] = {
          ...currentState.medicines[index],
          ...med,
          updated_at: new Date().toISOString(),
        };
        persist();
        logAudit('Medicine Updated', 'Medicine', `Medicine: ${med.name}`, med.id);
        return currentState.medicines[index];
      }
    }
    const newMed: Medicine = {
      ...med,
      id: `med-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    currentState.medicines.push(newMed);
    logAudit('Medicine Created', 'Medicine', `Medicine: ${med.name}`, newMed.id);
    persist();
    return newMed;
  },

  deleteMedicine(id: string): boolean {
    const hasBatches = currentState.batches.some((b) => b.medicine_id === id && b.remaining_quantity > 0);
    if (hasBatches) {
      throw new Error('Cannot delete medicine with active inventory batches. Adjust stock or archive instead.');
    }
    currentState.medicines = currentState.medicines.filter((m) => m.id !== id);
    logAudit('Medicine Deleted', 'Medicine', `Deleted ID: ${id}`, id);
    persist();
    return true;
  },

  // Batches & FEFO Logic
  getBatches(): Batch[] {
    return currentState.batches.map((b) => {
      const med = currentState.medicines.find((m) => m.id === b.medicine_id);
      const sup = currentState.suppliers.find((s) => s.id === b.supplier_id);
      return {
        ...b,
        medicine_name: med ? med.name : 'Unknown Medicine',
        supplier_name: sup ? sup.name : undefined,
      };
    });
  },

  getBatchesForMedicine(medicineId: string): Batch[] {
    return this.getBatches().filter((b) => b.medicine_id === medicineId);
  },

  /**
   * FEFO (First Expire, First Out) Algorithm:
   * 1. Filter batches for medicineId with remaining_quantity > 0
   * 2. EXCLUDE EXPIRED batches (Rule: Expired batches CANNOT be sold)
   * 3. Sort by expiry_date ASCENDING (earliest expiry first)
   */
  getAvailableFEFOBatches(medicineId: string): Batch[] {
    return this.getBatchesForMedicine(medicineId)
      .filter((b) => b.remaining_quantity > 0 && !isExpired(b.expiry_date))
      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
  },

  // Stock Adjustment (Damaged, Expired, Inventory audit)
  adjustStock(params: {
    batch_id: string;
    new_quantity: number;
    reason: 'Damaged' | 'Expired' | 'Lost' | 'Physical Count Difference' | 'Other';
    notes?: string;
    user: string;
  }) {
    const batch = currentState.batches.find((b) => b.id === params.batch_id);
    if (!batch) throw new Error('Batch not found');
    const oldQty = batch.remaining_quantity;
    const diff = params.new_quantity - oldQty;

    if (params.new_quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    batch.remaining_quantity = params.new_quantity;

    // Record stock movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      medicine_id: batch.medicine_id,
      batch_id: batch.id,
      movement_type: 'Adjustment',
      quantity: diff,
      reference_id: params.batch_id,
      reference_type: 'Manual Adjustment',
      notes: `Reason: ${params.reason}. ${params.notes || ''}`,
      created_by: params.user,
      created_at: new Date().toISOString(),
    };
    currentState.stockMovements.unshift(movement);

    logAudit(
      'Stock Adjusted',
      'Inventory',
      `Batch ${batch.batch_number} changed from ${oldQty} to ${params.new_quantity}. Reason: ${params.reason}`,
      batch.id
    );

    persist();
    return batch;
  },

  // Stock Movements
  getStockMovements(): StockMovement[] {
    return currentState.stockMovements.map((mov) => {
      const med = currentState.medicines.find((m) => m.id === mov.medicine_id);
      const bat = currentState.batches.find((b) => b.id === mov.batch_id);
      return {
        ...mov,
        medicine_name: med ? med.name : 'Unknown',
        batch_number: bat ? bat.batch_number : undefined,
      };
    });
  },

  // Purchases (Supplier Inflow)
  getPurchases(): Purchase[] {
    return currentState.purchases.map((p) => {
      const sup = currentState.suppliers.find((s) => s.id === p.supplier_id);
      return {
        ...p,
        supplier_name: sup ? sup.name : undefined,
      };
    });
  },

  createPurchase(purchaseData: Omit<Purchase, 'id' | 'created_at'>): Purchase {
    const newId = `pur-${Date.now()}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    // Automatically increase inventory, create/update batches, record stock movements
    purchaseData.items.forEach((item) => {
      const totalQty = item.quantity + (item.free_quantity || 0);

      // Check if batch already exists for this medicine and batch_number
      let existingBatch = currentState.batches.find(
        (b) => b.medicine_id === item.medicine_id && b.batch_number.toLowerCase() === item.batch_number.toLowerCase()
      );

      let batchId = '';
      if (existingBatch) {
        existingBatch.quantity += totalQty;
        existingBatch.remaining_quantity += totalQty;
        existingBatch.purchase_price = item.purchase_price;
        existingBatch.sale_price = item.sale_price;
        batchId = existingBatch.id;
      } else {
        batchId = `bat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newBatch: Batch = {
          id: batchId,
          medicine_id: item.medicine_id,
          batch_number: item.batch_number,
          mfg_date: item.mfg_date,
          expiry_date: item.expiry_date,
          purchase_price: item.purchase_price,
          sale_price: item.sale_price,
          quantity: totalQty,
          remaining_quantity: totalQty,
          supplier_id: purchaseData.supplier_id,
          purchase_id: newId,
          created_at: new Date().toISOString(),
        };
        currentState.batches.push(newBatch);
      }

      // Record Stock Movement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        medicine_id: item.medicine_id,
        batch_id: batchId,
        movement_type: 'Purchase',
        quantity: totalQty,
        reference_id: newId,
        reference_type: 'Purchase Invoice',
        notes: `Purchased PO ${purchaseData.purchase_number}. Free: ${item.free_quantity || 0}`,
        created_by: purchaseData.created_by || 'Staff',
        created_at: new Date().toISOString(),
      };
      currentState.stockMovements.unshift(movement);
    });

    // Update supplier balance if due
    if (purchaseData.due_amount > 0) {
      const supplier = currentState.suppliers.find((s) => s.id === purchaseData.supplier_id);
      if (supplier) {
        supplier.current_balance = (supplier.current_balance || 0) + purchaseData.due_amount;
      }
    }

    currentState.purchases.unshift(newPurchase);
    logAudit('Purchase Created', 'Purchases', `Purchase: ${newPurchase.purchase_number}, Total: ৳${newPurchase.total}`, newId);
    persist();
    return newPurchase;
  },

  // Purchase Return
  createPurchaseReturn(returnData: Omit<PurchaseReturn, 'id' | 'created_at'>): PurchaseReturn {
    const newId = `pret-${Date.now()}`;
    const newReturn: PurchaseReturn = {
      ...returnData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    returnData.items.forEach((item) => {
      const batch = currentState.batches.find((b) => b.id === item.batch_id);
      if (!batch) throw new Error(`Batch not found for item: ${item.medicine_name}`);
      if (batch.remaining_quantity < item.return_qty) {
        throw new Error(`Cannot return ${item.return_qty} units. Only ${batch.remaining_quantity} in stock.`);
      }

      batch.remaining_quantity -= item.return_qty;

      // Record stock movement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        movement_type: 'Purchase Return',
        quantity: -item.return_qty,
        reference_id: newId,
        reference_type: 'Purchase Return',
        notes: `Returned to supplier. Reason: ${item.reason}`,
        created_by: returnData.created_by || 'Staff',
        created_at: new Date().toISOString(),
      };
      currentState.stockMovements.unshift(movement);
    });

    // Adjust supplier balance
    const supplier = currentState.suppliers.find((s) => s.id === returnData.supplier_id);
    if (supplier) {
      supplier.current_balance = Math.max(0, (supplier.current_balance || 0) - returnData.total_refund);
    }

    currentState.purchaseReturns.unshift(newReturn);
    logAudit('Purchase Return Created', 'Purchases', `Return ${newReturn.return_number}, Refund: ৳${newReturn.total_refund}`, newId);
    persist();
    return newReturn;
  },

  // POS / Sales Execution
  getSales(): Sale[] {
    return [...currentState.sales];
  },

  createSale(saleData: Omit<Sale, 'id' | 'created_at' | 'profit'>): Sale {
    let calculatedTotalProfit = 0;

    // Validate each item, ensure stock and expiry checks
    for (const item of saleData.items) {
      const batch = currentState.batches.find((b) => b.id === item.batch_id);
      if (!batch) {
        throw new Error(`Batch not found for medicine ${item.medicine_name}`);
      }

      // Hard check: Never allow selling expired medicine
      if (isExpired(batch.expiry_date)) {
        throw new Error(`Batch ${batch.batch_number} of ${item.medicine_name} is EXPIRED (${batch.expiry_date}). Sale blocked.`);
      }

      // Hard check: Insufficient stock
      if (batch.remaining_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock in batch ${batch.batch_number} for ${item.medicine_name}. Requested: ${item.quantity}, Available: ${batch.remaining_quantity}`
        );
      }
    }

    // Process deduction, calculate item profit based on actual batch purchase price
    const processedItems = saleData.items.map((item) => {
      const batch = currentState.batches.find((b) => b.id === item.batch_id)!;
      batch.remaining_quantity -= item.quantity;

      const itemProfit = (item.unit_price - batch.purchase_price) * item.quantity;
      calculatedTotalProfit += itemProfit;

      // Record Stock Movement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        medicine_id: item.medicine_id,
        batch_id: batch.id,
        movement_type: 'Sale',
        quantity: -item.quantity,
        reference_id: saleData.invoice_number,
        reference_type: 'Sale Invoice',
        notes: `Sold invoice ${saleData.invoice_number}`,
        created_by: saleData.cashier_name,
        created_at: new Date().toISOString(),
      };
      currentState.stockMovements.unshift(movement);

      return {
        ...item,
        purchase_price: batch.purchase_price,
        profit: itemProfit,
      };
    });

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      items: processedItems,
      profit: calculatedTotalProfit - saleData.discount,
      created_at: new Date().toISOString(),
    };

    // Update customer stats
    if (saleData.customer_id) {
      const cust = currentState.customers.find((c) => c.id === saleData.customer_id);
      if (cust) {
        cust.total_purchases = (cust.total_purchases || 0) + saleData.total;
        if (saleData.due_amount > 0) {
          cust.due_amount = (cust.due_amount || 0) + saleData.due_amount;
        }
      }
    }

    currentState.sales.unshift(newSale);
    logAudit('Sale Completed', 'POS / Sales', `Invoice: ${newSale.invoice_number}, Total: ৳${newSale.total}, Profit: ৳${newSale.profit}`, newSale.id);
    persist();
    return newSale;
  },

  // Sales Return
  createSalesReturn(returnData: Omit<SalesReturn, 'id' | 'created_at'>): SalesReturn {
    const originalSale = currentState.sales.find((s) => s.id === returnData.sale_id);
    if (!originalSale) throw new Error('Original sale invoice not found');

    const newId = `sret-${Date.now()}`;
    const newReturn: SalesReturn = {
      ...returnData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    returnData.items.forEach((item) => {
      const origItem = originalSale.items.find((si) => si.medicine_id === item.medicine_id && si.batch_id === item.batch_id);
      if (!origItem) throw new Error(`Medicine ${item.medicine_name} was not on invoice`);
      if (item.return_qty > origItem.quantity) {
        throw new Error(`Return quantity (${item.return_qty}) cannot exceed sold quantity (${origItem.quantity})`);
      }

      // Return stock to batch
      const batch = currentState.batches.find((b) => b.id === item.batch_id);
      if (batch) {
        batch.remaining_quantity += item.return_qty;
      }

      // Record stock movement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        medicine_id: item.medicine_id,
        batch_id: item.batch_id,
        movement_type: 'Sales Return',
        quantity: item.return_qty,
        reference_id: originalSale.invoice_number,
        reference_type: 'Sales Return',
        notes: `Customer return. Reason: ${returnData.reason}`,
        created_by: returnData.created_by || 'Staff',
        created_at: new Date().toISOString(),
      };
      currentState.stockMovements.unshift(movement);
    });

    currentState.salesReturns.unshift(newReturn);
    logAudit('Sales Return Processed', 'Sales Returns', `Return for ${originalSale.invoice_number}, Refund: ৳${returnData.refund_amount}`, newId);
    persist();
    return newReturn;
  },

  // Expenses
  getExpenses(): Expense[] {
    return [...currentState.expenses];
  },

  createExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Expense {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.expenses.unshift(newExpense);
    logAudit('Expense Recorded', 'Expenses', `${expenseData.category}: ৳${expenseData.amount}`, newExpense.id);
    persist();
    return newExpense;
  },

  deleteExpense(id: string): boolean {
    currentState.expenses = currentState.expenses.filter((e) => e.id !== id);
    persist();
    return true;
  },

  // Prescriptions
  getPrescriptions(): Prescription[] {
    return [...currentState.prescriptions];
  },

  savePrescription(rxData: Omit<Prescription, 'id' | 'created_at'> & { id?: string }): Prescription {
    if (rxData.id) {
      const idx = currentState.prescriptions.findIndex((p) => p.id === rxData.id);
      if (idx > -1) {
        currentState.prescriptions[idx] = { ...currentState.prescriptions[idx], ...rxData };
        persist();
        return currentState.prescriptions[idx];
      }
    }
    const newRx: Prescription = {
      ...rxData,
      id: `rx-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.prescriptions.unshift(newRx);
    logAudit('Prescription Logged', 'Prescriptions', `Customer: ${newRx.customer_name}`, newRx.id);
    persist();
    return newRx;
  },

  // Online Orders
  getOrders(): OnlineOrder[] {
    return [...currentState.orders];
  },

  createOrder(orderData: Omit<OnlineOrder, 'id' | 'created_at'>): OnlineOrder {
    const newOrder: OnlineOrder = {
      ...orderData,
      id: `ord-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.orders.unshift(newOrder);

    // Create notification
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      title: 'New Customer Order',
      message: `Order #${newOrder.order_number} by ${newOrder.customer_name} (৳${newOrder.total})`,
      type: 'order',
      read: false,
      link: '/admin/prescriptions',
      created_at: new Date().toISOString(),
    };
    currentState.notifications.unshift(notif);

    logAudit('Online Order Received', 'Orders', `Order ${newOrder.order_number} placed`, newOrder.id);
    persist();
    return newOrder;
  },

  updateOrderStatus(orderId: string, status: OnlineOrder['status']) {
    const order = currentState.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      logAudit('Order Status Updated', 'Orders', `Order ${order.order_number} changed to ${status}`, orderId);
      persist();
      return order;
    }
    throw new Error('Order not found');
  },

  // Notifications
  getNotifications(): Notification[] {
    // Generate dynamic alerts if not yet present
    const medicines = this.getMedicines();
    const batches = this.getBatches();

    // Check expiring batches (<= 60 days)
    const nearExpiry = batches.filter((b) => {
      const days = getDaysUntilExpiry(b.expiry_date);
      return b.remaining_quantity > 0 && days >= 0 && days <= 60;
    });

    // Check low stock medicines
    const lowStock = medicines.filter((m) => (m.total_stock || 0) <= m.reorder_level);

    return currentState.notifications;
  },

  markNotificationRead(id: string) {
    const notif = currentState.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      persist();
    }
  },

  markAllNotificationsRead() {
    currentState.notifications.forEach((n) => {
      n.read = true;
    });
    persist();
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...currentState.auditLogs];
  },

  // Notices & Announcements
  getNotices(): Notice[] {
    return [...currentState.notices];
  },

  saveNotice(noticeData: Omit<Notice, 'id' | 'created_at'> & { id?: string }): Notice {
    if (noticeData.id) {
      const idx = currentState.notices.findIndex((n) => n.id === noticeData.id);
      if (idx > -1) {
        currentState.notices[idx] = {
          ...currentState.notices[idx],
          ...noticeData,
          updated_at: new Date().toISOString(),
        };
        logAudit('Notice Updated', 'Notices', `Notice: ${noticeData.title}`, noticeData.id);
        persist();
        // Also persist to Supabase if connected
        const supabase = getSupabase();
        if (supabase) {
          supabase.from('notices').upsert(currentState.notices[idx]).then(() => {});
        }
        return currentState.notices[idx];
      }
    }
    const newNotice: Notice = {
      ...noticeData,
      id: `notc-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    currentState.notices.unshift(newNotice);
    logAudit('Notice Published', 'Notices', `Notice: ${newNotice.title}`, newNotice.id);
    persist();
    // Also persist to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('notices').insert(newNotice).then(() => {});
    }
    return newNotice;
  },

  deleteNotice(id: string): boolean {
    currentState.notices = currentState.notices.filter((n) => n.id !== id);
    logAudit('Notice Deleted', 'Notices', `Deleted ID: ${id}`, id);
    persist();
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('notices').delete().eq('id', id).then(() => {});
    }
    return true;
  },

  // Media Gallery (Photos, Videos, Notices, Attachments)
  getMediaItems(): MediaItem[] {
    return [...currentState.media];
  },

  saveMediaItem(itemData: Omit<MediaItem, 'id' | 'created_at'> & { id?: string }): MediaItem {
    if (itemData.id) {
      const idx = currentState.media.findIndex((m) => m.id === itemData.id);
      if (idx > -1) {
        currentState.media[idx] = {
          ...currentState.media[idx],
          ...itemData,
        };
        logAudit('Media Updated', 'Media', `Media: ${itemData.title}`, itemData.id);
        persist();
        const supabase = getSupabase();
        if (supabase) {
          supabase.from('media_gallery').upsert(currentState.media[idx]).then(() => {});
        }
        return currentState.media[idx];
      }
    }
    const newItem: MediaItem = {
      ...itemData,
      id: `med-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    currentState.media.unshift(newItem);
    logAudit('Media Uploaded', 'Media', `Uploaded: ${newItem.title} (${newItem.media_type})`, newItem.id);
    persist();
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('media_gallery').insert(newItem).then(() => {});
    }
    return newItem;
  },

  deleteMediaItem(id: string): boolean {
    currentState.media = currentState.media.filter((m) => m.id !== id);
    logAudit('Media Deleted', 'Media', `Deleted ID: ${id}`, id);
    persist();
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('media_gallery').delete().eq('id', id).then(() => {});
    }
    return true;
  },
};
