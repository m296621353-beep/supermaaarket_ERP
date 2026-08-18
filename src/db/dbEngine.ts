import { 
  Branch, Warehouse, Category, Unit, Product, StockItem, 
  StockMovement, Sale, SaleItem, User, Role, AuditLog, SystemSettings, Customer,
  Supplier, PurchaseInvoice, PurchaseItem, ExpenseCategory, Expense,
  TreasuryTransaction, BankAccount, BankTransaction, Employee, PayrollRun, PayrollItem,
  Account, JournalEntry, JournalEntryLine, FixedAsset, DepreciationRecord
} from '../types';
import {
  syncToFirestore,
  deleteFromFirestore,
  seedCollectionIfEmpty,
  seedSettingsIfEmpty,
  setupCollectionListener,
  setupSettingsListener
} from './firestoreSync';

const STORAGE_KEY_PREFIX = 'egy_supermarket_db_v1_';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    notifyDatabaseChange();
    // Synchronize asynchronously with Cloud Firestore (Offline Persistent)
    syncToFirestore(key, value).catch(err => {
      console.warn(`Firestore sync error on ${key}:`, err);
    });
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

type DBChangeListener = () => void;
const listeners: Set<DBChangeListener> = new Set();

export function subscribeToDB(listener: DBChangeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyDatabaseChange() {
  listeners.forEach(fn => fn());
}

// Initial System Settings
export const DEFAULT_SETTINGS: SystemSettings = {
  storeName: 'سوبرماركت الخير والبركة',
  companyName: 'شركة النور والخير للتجارة والتوزيع',
  logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80',
  phone: '01012345678 / 0223456789',
  address: 'شارع النصر، المعادي، القاهرة، مصر',
  taxNumber: '321-456-789',
  commercialReg: '109845',
  vatRate: 14,
  enableVat: true,
  receiptHeader: 'أهلاً بكم في سوبرماركت الخير والبركة - نتمنى لكم تسوقاً ممتعاً',
  receiptFooter: 'شكراً لزيارتكم - البضاعة المبيعة تستبدل أو تسترجع خلال 14 يوماً بموجب الفاتورة',
  currency: 'ج.م'
};

// Initial Default Roles with full permissions mapping
const fullPermission = {
  view: true, add: true, edit: true, delete: true, print: true, discount: true, changePrice: true
};

const cashierPermission = {
  view: true, add: true, edit: false, delete: false, print: true, discount: true, changePrice: false
};

const storekeeperPermission = {
  view: true, add: true, edit: true, delete: false, print: true, discount: false, changePrice: false
};

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role_developer',
    name: 'مطور النظام',
    description: 'صلاحيات فنية كاملة + إعدادات النظام العامة والتراخيص',
    permissions: {
      dashboard: fullPermission,
      pos: fullPermission,
      inventory: fullPermission,
      branches: fullPermission,
      users: fullPermission,
      settings: fullPermission,
      ledger: fullPermission,
      taxes: fullPermission
    }
  },
  {
    id: 'role_admin',
    name: 'مدير عام',
    description: 'صلاحيات كاملة لإدارة الفروع والموظفين والمحاسبة (بدون إعدادات النظام الفنية)',
    permissions: {
      dashboard: fullPermission,
      pos: fullPermission,
      inventory: fullPermission,
      branches: fullPermission,
      users: fullPermission,
      settings: fullPermission,
      ledger: fullPermission,
      taxes: fullPermission
    }
  },
  {
    id: 'role_branch_manager',
    name: 'مدير فرع',
    description: 'إدارة عمليات الفرع والمخزن والبيع والموظفين بالفرع',
    permissions: {
      dashboard: fullPermission,
      pos: fullPermission,
      inventory: fullPermission,
      branches: { ...fullPermission, delete: false },
      users: { ...cashierPermission, view: true },
      settings: { ...cashierPermission, view: true },
      ledger: { ...cashierPermission, view: true },
      taxes: { ...cashierPermission, view: true }
    }
  },
  {
    id: 'role_cashier',
    name: 'كاشير',
    description: 'إجراء عمليات البيع والطباعة والخصم المصرح به فقط',
    permissions: {
      dashboard: { view: true, add: false, edit: false, delete: false, print: true, discount: false, changePrice: false },
      pos: cashierPermission,
      inventory: { view: true, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      branches: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      users: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      settings: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      ledger: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      taxes: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false }
    }
  },
  {
    id: 'role_storekeeper',
    name: 'أمين مخزن',
    description: 'إدارة أصناف المخزن، إدخال وإخراج وتعديل الكميات',
    permissions: {
      dashboard: { view: true, add: false, edit: false, delete: false, print: true, discount: false, changePrice: false },
      pos: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      inventory: storekeeperPermission,
      branches: { view: true, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      users: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      settings: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      ledger: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false },
      taxes: { view: false, add: false, edit: false, delete: false, print: false, discount: false, changePrice: false }
    }
  }
];

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br_main',
    code: 'BR-01',
    name: 'الفرع الرئيسي',
    phone: '01012345678',
    address: 'شارع النصر، المعادي، القاهرة',
    taxNumber: '321-456-789',
    commercialReg: '109845',
    isDefault: true
  },
  {
    id: 'br_branch2',
    code: 'BR-02',
    name: 'فرع مدينة نصر',
    phone: '01123456789',
    address: 'شارع عباس العقاد، مدينة نصر، القاهرة',
    taxNumber: '321-456-790',
    commercialReg: '109846',
    isDefault: false
  }
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_main',
    branchId: 'br_main',
    code: 'WH-01',
    name: 'المخزن الرئيسي',
    isDefault: true
  },
  {
    id: 'wh_display',
    branchId: 'br_main',
    code: 'WH-02',
    name: 'مخزن صالة العرض',
    isDefault: false
  },
  {
    id: 'wh_nasr',
    branchId: 'br_branch2',
    code: 'WH-03',
    name: 'مخزن فرع مدينة نصر',
    isDefault: false
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'أحمد محمود (المدير)',
    roleId: 'role_admin',
    branchId: 'br_main',
    active: true,
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'usr_cashier1',
    username: 'cashier1',
    name: 'كاشير 1 (محمد سعيد)',
    roleId: 'role_cashier',
    branchId: 'br_main',
    active: true,
    createdAt: '2025-01-02T08:00:00.000Z'
  },
  {
    id: 'usr_cashier2',
    username: 'cashier2',
    name: 'كاشير 2 (مصطفى علي)',
    roleId: 'role_cashier',
    branchId: 'br_main',
    active: true,
    createdAt: '2025-01-03T08:00:00.000Z'
  },
  {
    id: 'usr_storekeeper',
    username: 'storekeeper',
    name: 'أمين المخزن (حسن إبراهيم)',
    roleId: 'role_storekeeper',
    branchId: 'br_main',
    active: true,
    createdAt: '2025-01-04T08:00:00.000Z'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_all', code: 'CAT-00', name: 'كل الأقسام' },
  { id: 'cat_grocery', code: 'CAT-01', name: 'بقالة' },
  { id: 'cat_dairy', code: 'CAT-02', name: 'ألبان وجبن' },
  { id: 'cat_beverages', code: 'CAT-03', name: 'مشروبات ومياه' },
  { id: 'cat_cleaning', code: 'CAT-04', name: 'منظفات ورعاية' },
  { id: 'cat_sweets', code: 'CAT-05', name: 'حلويات وبسكويت' },
  { id: 'cat_frozen', code: 'CAT-06', name: 'مجمدات' },
  { id: 'cat_bakery', code: 'CAT-07', name: 'مخبوزات' }
];

export const INITIAL_UNITS: Unit[] = [
  { id: 'unit_piece', name: 'قطعة', symbol: 'قطعة' },
  { id: 'unit_kg', name: 'كيلوجرام', symbol: 'كجم' },
  { id: 'unit_pack', name: 'علبة / عبوة', symbol: 'علبة' },
  { id: 'unit_liter', name: 'لتر', symbol: 'لتر' },
  { id: 'unit_carton', name: 'كرتونة', symbol: 'كرتونة' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    code: 'PRD-101',
    name: 'أرز فاخر 1 كجم',
    categoryId: 'cat_grocery',
    baseUnit: 'كجم',
    barcodes: ['6281001234567', '100123'],
    purchasePrice: 24.00,
    salePrice: 30.00,
    minStock: 20,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_2',
    code: 'PRD-102',
    name: 'زيت خليط 700 مل',
    categoryId: 'cat_grocery',
    baseUnit: 'قطعة',
    barcodes: ['6281002345678', '100234'],
    purchasePrice: 36.00,
    salePrice: 45.00,
    minStock: 15,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_3',
    code: 'PRD-103',
    name: 'سكر 1 كجم',
    categoryId: 'cat_grocery',
    baseUnit: 'كجم',
    barcodes: ['6281003456789', '100345'],
    purchasePrice: 22.00,
    salePrice: 28.00,
    minStock: 25,
    image: 'https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_4',
    code: 'PRD-104',
    name: 'شاي 40 جم',
    categoryId: 'cat_grocery',
    baseUnit: 'علبة',
    barcodes: ['6281004567890', '100456'],
    purchasePrice: 11.50,
    salePrice: 15.00,
    minStock: 30,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_5',
    code: 'PRD-105',
    name: 'دقيق 1 كجم',
    categoryId: 'cat_grocery',
    baseUnit: 'كجم',
    barcodes: ['6281005678901', '100567'],
    purchasePrice: 17.00,
    salePrice: 22.00,
    minStock: 20,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_6',
    code: 'PRD-106',
    name: 'معكرونة 400 جم',
    categoryId: 'cat_grocery',
    baseUnit: 'كيس',
    barcodes: ['6281006789012', '100678'],
    purchasePrice: 9.00,
    salePrice: 12.50,
    minStock: 35,
    image: 'https://images.unsplash.com/photo-1621996346565-e3def6166739?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_7',
    code: 'PRD-107',
    name: 'حليب 1 لتر',
    categoryId: 'cat_dairy',
    baseUnit: 'لتر',
    barcodes: ['6281007890123', '100789'],
    purchasePrice: 30.00,
    salePrice: 38.00,
    minStock: 15,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_8',
    code: 'PRD-108',
    name: 'جبنة 1 كجم',
    categoryId: 'cat_dairy',
    baseUnit: 'كجم',
    barcodes: ['6281008901234', '100890'],
    purchasePrice: 78.00,
    salePrice: 95.00,
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_9',
    code: 'PRD-109',
    name: 'زبدة 200 جم',
    categoryId: 'cat_dairy',
    baseUnit: 'قطعة',
    barcodes: ['6281009012345', '100901'],
    purchasePrice: 52.00,
    salePrice: 65.00,
    minStock: 12,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_10',
    code: 'PRD-110',
    name: 'مناديل 550 منديل',
    categoryId: 'cat_cleaning',
    baseUnit: 'علبة',
    barcodes: ['6281010123456', '101012'],
    purchasePrice: 20.00,
    salePrice: 28.00,
    minStock: 15,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_11',
    code: 'PRD-111',
    name: 'صابون 125 جم',
    categoryId: 'cat_cleaning',
    baseUnit: 'قطعة',
    barcodes: ['6281011234567', '101123'],
    purchasePrice: 10.00,
    salePrice: 14.00,
    minStock: 25,
    image: 'https://images.unsplash.com/photo-1607006482172-2d1f930e4b85?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_12',
    code: 'PRD-112',
    name: 'شامبو 400 مل',
    categoryId: 'cat_cleaning',
    baseUnit: 'زجاجة',
    barcodes: ['6281012345678', '101234'],
    purchasePrice: 42.00,
    salePrice: 55.00,
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_13',
    code: 'PRD-113',
    name: 'كولا 330 مل',
    categoryId: 'cat_beverages',
    baseUnit: 'كان',
    barcodes: ['6281013456789', '101345'],
    purchasePrice: 7.50,
    salePrice: 10.00,
    minStock: 40,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_14',
    code: 'PRD-114',
    name: 'عصير 1 لتر',
    categoryId: 'cat_beverages',
    baseUnit: 'عبوة',
    barcodes: ['6281014567890', '101456'],
    purchasePrice: 15.00,
    salePrice: 20.00,
    minStock: 20,
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300&auto=format&fit=crop&q=80',
    active: true
  },
  {
    id: 'prod_15',
    code: 'PRD-115',
    name: 'مياه 1.5 لتر',
    categoryId: 'cat_beverages',
    baseUnit: 'زجاجة',
    barcodes: ['6281015678901', '101567'],
    purchasePrice: 5.50,
    salePrice: 8.00,
    minStock: 50,
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=80',
    active: true
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust_cash', code: 'CUST-00', name: 'عميل نقدي', phone: '-', address: 'مبيعات نقدية مباشرة', creditLimit: 0, balance: 0, createdAt: '2025-01-01T08:00:00.000Z' },
  { id: 'cust_1', code: 'CUST-01', name: 'شركة النور للتجارة', phone: '01098765432', address: '12 شارع الجمهورية، القاهرة', creditLimit: 50000, balance: 4860, createdAt: '2025-01-10T10:00:00.000Z' },
  { id: 'cust_2', code: 'CUST-02', name: 'مطعم الأهرام', phone: '01122334455', address: 'شارع الهرم، الجيزة', creditLimit: 20000, balance: 14200, createdAt: '2025-01-15T11:30:00.000Z' },
  { id: 'cust_3', code: 'CUST-03', name: 'سوبرماركت التوفيق', phone: '01233445566', address: 'شارع الثورة، مصر الجديدة', creditLimit: 15000, balance: 16500, createdAt: '2025-02-01T09:15:00.000Z' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup_1', code: 'SUP-01', name: 'شركة القاهرة للصناعات الغذائية', phone: '01011122233', address: 'المنطقة الصناعية، العاشر من رمضان', balance: 15400, createdAt: '2025-01-05T08:00:00.000Z' },
  { id: 'sup_2', code: 'SUP-02', name: 'شركة الدلتا للألبان والمشروبات', phone: '01144455566', address: 'شارع الجلاء، طنطا، الغربية', balance: 8200, createdAt: '2025-01-12T09:30:00.000Z' },
  { id: 'sup_3', code: 'SUP-03', name: 'الشركة المصرية للمنظفات ورعاية المنزل', phone: '01277788899', address: 'المنطقة الثانية، 6 أكتوبر', balance: 0, createdAt: '2025-02-02T14:00:00.000Z' }
];

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'exp_cat_rent', code: 'EXP-CAT-01', name: 'إيجار المحل والمخازن' },
  { id: 'exp_cat_util', code: 'EXP-CAT-02', name: 'كهرباء ومياه وغاز' },
  { id: 'exp_cat_sal', code: 'EXP-CAT-03', name: 'مرتبات وأجور الموظفين' },
  { id: 'exp_cat_maint', code: 'EXP-CAT-04', name: 'صيانة ومعدات' },
  { id: 'exp_cat_other', code: 'EXP-CAT-05', name: 'مصروفات عامة ونثريات' }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    categoryId: 'exp_cat_rent',
    categoryName: 'إيجار المحل والمخازن',
    amount: 12000,
    date: '2025-08-01',
    notes: 'إيجار الفرع الرئيسي لشهر أغسطس',
    branchId: 'br_main',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T09:00:00.000Z'
  },
  {
    id: 'exp_2',
    categoryId: 'exp_cat_util',
    categoryName: 'كهرباء ومياه وغاز',
    amount: 3450,
    date: '2025-08-05',
    notes: 'فاتورة الكهرباء للتكييفات والثلاجات',
    branchId: 'br_main',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-05T11:20:00.000Z'
  }
];

export const INITIAL_PURCHASE_INVOICES: PurchaseInvoice[] = [
  {
    id: 'pur_1',
    invoiceNo: 'PUR-250801-001',
    supplierId: 'sup_1',
    supplierName: 'شركة القاهرة للصناعات الغذائية',
    branchId: 'br_main',
    warehouseId: 'wh_main',
    totalAmount: 15400,
    isPaid: false,
    notes: 'شراء شحنة أرز وسكر بالآجل',
    createdBy: 'حسن إبراهيم (أمين المخزن)',
    createdAt: '2025-08-01T10:00:00.000Z',
    items: [
      { id: 'pi_1', purchaseId: 'pur_1', productId: 'prod_1', productName: 'أرز فاخر 1 كجم', unitName: 'كجم', qty: 300, purchasePrice: 24.00, total: 7200 },
      { id: 'pi_2', purchaseId: 'pur_1', productId: 'prod_3', productName: 'سكر 1 كجم', unitName: 'كجم', qty: 372, purchasePrice: 22.00, total: 8200 }
    ]
  }
];

export const INITIAL_TREASURY_TRANSACTIONS: TreasuryTransaction[] = [
  {
    id: 'tr_1',
    type: 'IN',
    amount: 50000,
    source: 'MANUAL',
    description: 'رصيد افتتاح الخزينة الرئيسية',
    branchId: 'br_main',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T08:00:00.000Z'
  },
  {
    id: 'tr_2',
    type: 'OUT',
    amount: 12000,
    source: 'EXPENSE',
    referenceId: 'exp_1',
    description: 'مصروف: إيجار المحل والمخازن - الفرع الرئيسي',
    branchId: 'br_main',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T09:00:00.000Z'
  },
  {
    id: 'tr_3',
    type: 'OUT',
    amount: 3450,
    source: 'EXPENSE',
    referenceId: 'exp_2',
    description: 'مصروف: كهرباء ومياه وغاز - الفرع الرئيسي',
    branchId: 'br_main',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-05T11:20:00.000Z'
  },
  {
    id: 'tr_4',
    type: 'IN',
    amount: 1250,
    source: 'SALE',
    referenceId: 'sale_1001',
    description: 'تحصيل مبيعات نقدي - فاتورة INV-250810-1285',
    branchId: 'br_main',
    createdBy: 'كاشير 1',
    createdAt: '2025-08-10T17:25:00.000Z'
  },
  {
    id: 'tr_5',
    type: 'IN',
    amount: 350.75,
    source: 'SALE',
    referenceId: 'sale_1002',
    description: 'تحصيل مبيعات نقدي - فاتورة INV-250810-1284',
    branchId: 'br_main',
    createdBy: 'كاشير 2',
    createdAt: '2025-08-10T17:10:00.000Z'
  }
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_1',
    bankName: 'البنك الأهلي المصري',
    accountNumber: '1000-2458-9901',
    iban: 'EG1200030001000245899010015',
    balance: 285000,
    updatedAt: '2025-08-10T12:00:00.000Z'
  },
  {
    id: 'bank_2',
    bankName: 'بنك مصر',
    accountNumber: '3000-8812-4410',
    iban: 'EG8800020003000881244100020',
    balance: 142000,
    updatedAt: '2025-08-08T15:30:00.000Z'
  }
];

export const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'btx_1',
    bankAccountId: 'bank_1',
    type: 'DEPOSIT',
    amount: 285000,
    description: 'رصيد افتتاحي بالحساب البنكي الرئيسي',
    relatedSource: 'MANUAL',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T08:00:00.000Z'
  },
  {
    id: 'btx_2',
    bankAccountId: 'bank_2',
    type: 'DEPOSIT',
    amount: 142000,
    description: 'رصيد افتتاحي بحساب بنك مصر',
    relatedSource: 'MANUAL',
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T08:00:00.000Z'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_1',
    code: 'EMP-001',
    name: 'أحمد محمود العبد',
    jobTitle: 'مدير الفرع المالي والإداري',
    branchId: 'br_main',
    baseSalary: 12500,
    status: 'ACTIVE',
    createdAt: '2025-01-01T08:00:00.000Z'
  },
  {
    id: 'emp_2',
    code: 'EMP-002',
    name: 'محمود حسن علي',
    jobTitle: 'مسؤول كاشير ونقطة البيع',
    branchId: 'br_main',
    baseSalary: 6500,
    status: 'ACTIVE',
    createdAt: '2025-01-15T08:00:00.000Z'
  },
  {
    id: 'emp_3',
    code: 'EMP-003',
    name: 'حسن إبراهيم مصطفى',
    jobTitle: 'أمين مخزن ومسؤول استلام شحنات',
    branchId: 'br_main',
    baseSalary: 7200,
    status: 'ACTIVE',
    createdAt: '2025-02-01T08:00:00.000Z'
  },
  {
    id: 'emp_4',
    code: 'EMP-004',
    name: 'سارة محمد السيد',
    jobTitle: 'محاسبة تكاليف وإدارية',
    branchId: 'br_main',
    baseSalary: 8500,
    status: 'ACTIVE',
    createdAt: '2025-03-01T08:00:00.000Z'
  }
];

export const INITIAL_STOCK: StockItem[] = [
  { id: 'stk_1', productId: 'prod_1', warehouseId: 'wh_main', quantity: 150 },
  { id: 'stk_2', productId: 'prod_2', warehouseId: 'wh_main', quantity: 80 },
  { id: 'stk_3', productId: 'prod_3', warehouseId: 'wh_main', quantity: 200 },
  { id: 'stk_4', productId: 'prod_4', warehouseId: 'wh_main', quantity: 120 },
  { id: 'stk_5', productId: 'prod_5', warehouseId: 'wh_main', quantity: 90 },
  { id: 'stk_6', productId: 'prod_6', warehouseId: 'wh_main', quantity: 110 },
  { id: 'stk_7', productId: 'prod_7', warehouseId: 'wh_main', quantity: 65 },
  { id: 'stk_8', productId: 'prod_8', warehouseId: 'wh_main', quantity: 40 },
  { id: 'stk_9', productId: 'prod_9', warehouseId: 'wh_main', quantity: 50 },
  { id: 'stk_10', productId: 'prod_10', warehouseId: 'wh_main', quantity: 75 },
  { id: 'stk_11', productId: 'prod_11', warehouseId: 'wh_main', quantity: 95 },
  { id: 'stk_12', productId: 'prod_12', warehouseId: 'wh_main', quantity: 35 },
  { id: 'stk_13', productId: 'prod_13', warehouseId: 'wh_main', quantity: 240 },
  { id: 'stk_14', productId: 'prod_14', warehouseId: 'wh_main', quantity: 85 },
  { id: 'stk_15', productId: 'prod_15', warehouseId: 'wh_main', quantity: 300 }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_1001',
    invoiceNo: 'INV-250810-1285',
    branchId: 'br_main',
    warehouseId: 'wh_main',
    customerName: 'عميل نقدي',
    paymentMethod: 'CASH',
    subtotal: 1100.00,
    discount: 0,
    vatRate: 14,
    vatAmount: 150.00,
    grandTotal: 1250.00,
    paidAmount: 1300.00,
    changeAmount: 50.00,
    status: 'COMPLETED',
    createdBy: 'كاشير 1',
    createdAt: '2025-08-10T17:25:00.000Z',
    items: [
      { id: 'si_1', saleId: 'sale_1001', productId: 'prod_1', barcode: '6281001234567', productName: 'أرز فاخر 1 كجم', unitName: 'كجم', qty: 20, unitPrice: 30.00, discount: 0, total: 600.00 },
      { id: 'si_2', saleId: 'sale_1001', productId: 'prod_2', barcode: '6281002345678', productName: 'زيت خليط 700 مل', unitName: 'قطعة', qty: 10, unitPrice: 45.00, discount: 0, total: 450.00 }
    ]
  },
  {
    id: 'sale_1002',
    invoiceNo: 'INV-250810-1284',
    branchId: 'br_main',
    warehouseId: 'wh_main',
    customerName: 'عميل نقدي',
    paymentMethod: 'CASH',
    subtotal: 307.67,
    discount: 0,
    vatRate: 14,
    vatAmount: 43.08,
    grandTotal: 350.75,
    paidAmount: 350.75,
    changeAmount: 0,
    status: 'COMPLETED',
    createdBy: 'كاشير 2',
    createdAt: '2025-08-10T17:10:00.000Z',
    items: [
      { id: 'si_3', saleId: 'sale_1002', productId: 'prod_7', barcode: '6281007890123', productName: 'حليب 1 لتر', unitName: 'لتر', qty: 5, unitPrice: 38.00, discount: 0, total: 190.00 },
      { id: 'si_4', saleId: 'sale_1002', productId: 'prod_3', barcode: '6281003456789', productName: 'سكر 1 كجم', unitName: 'كجم', qty: 4, unitPrice: 28.00, discount: 0, total: 112.00 }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    userId: 'usr_admin',
    userName: 'أحمد محمود (المدير)',
    action: 'LOGIN',
    module: 'المستخدمين',
    details: 'تسجيل دخول ناجح للنظام',
    timestamp: '2025-08-10T08:00:00.000Z'
  },
  {
    id: 'log_2',
    userId: 'usr_cashier1',
    userName: 'كاشير 1 (محمد سعيد)',
    action: 'SALE',
    module: 'نقطة البيع',
    details: 'إتمام فاتورة بيع رقم INV-250810-1285 بقيمة 1,250.00 ج.م',
    timestamp: '2025-08-10T17:25:00.000Z'
  }
];

// Initial Phase 3 Chart of Accounts
export const INITIAL_CHART_OF_ACCOUNTS: Account[] = [
  // 1000 ASSETS
  { id: '1000', code: '1000', name: 'الأصول', type: 'ASSET', isHeader: true, isSystem: true, balance: 0 },
  { id: '1100', code: '1100', name: 'الأصول المتداولة', type: 'ASSET', parentId: '1000', isHeader: true, isSystem: true, balance: 0 },
  { id: '1101', code: '1101', name: 'الصندوق / الخزينة الرئيسية', type: 'ASSET', parentId: '1100', isSystem: true, description: 'السيولة النقدية بالخزينة', balance: 0 },
  { id: '1102', code: '1102', name: 'الحسابات البنكية', type: 'ASSET', parentId: '1100', isSystem: true, description: 'أرصدة الحسابات بالبنوك', balance: 0 },
  { id: '1103', code: '1103', name: 'العملاء / مدينون', type: 'ASSET', parentId: '1100', isSystem: true, description: 'مستحقات على العملاء والآجل', balance: 0 },
  { id: '1104', code: '1104', name: 'المخزون السلعي', type: 'ASSET', parentId: '1100', isSystem: true, description: 'تكلفة البضاعة الموجودة بالمخازن', balance: 0 },

  { id: '1200', code: '1200', name: 'الأصول الثابتة', type: 'ASSET', parentId: '1000', isHeader: true, isSystem: true, balance: 0 },
  { id: '1201', code: '1201', name: 'أجهزة ومعدات ومباني', type: 'ASSET', parentId: '1200', isSystem: true, description: 'ثلاجات، شاشات، موازين، ومعدات', balance: 0 },
  { id: '1202', code: '1202', name: 'مجمع إهلاك الأصول الثابتة', type: 'ASSET', parentId: '1200', isSystem: true, description: 'مجمع إهلاك الأصول المتراكم', balance: 0 },

  // 2000 LIABILITIES
  { id: '2000', code: '2000', name: 'الخصوم والالتزامات', type: 'LIABILITY', isHeader: true, isSystem: true, balance: 0 },
  { id: '2100', code: '2100', name: 'الخصوم المتداولة', type: 'LIABILITY', parentId: '2000', isHeader: true, isSystem: true, balance: 0 },
  { id: '2101', code: '2101', name: 'الموردون / دائنون', type: 'LIABILITY', parentId: '2100', isSystem: true, description: 'مستحقات الموردين وشركات التوزيع', balance: 0 },
  { id: '2102', code: '2102', name: 'ضريبة القيمة المضافة مستحقة', type: 'LIABILITY', parentId: '2100', isSystem: true, description: 'الضريبة المحصلة الواجب توريدها', balance: 0 },

  // 3000 EQUITY
  { id: '3000', code: '3000', name: 'حقوق الملكية', type: 'EQUITY', isHeader: true, isSystem: true, balance: 0 },
  { id: '3101', code: '3101', name: 'رأس المال المباشر', type: 'EQUITY', parentId: '3000', isSystem: true, description: 'رأس مال المشروع', balance: 0 },
  { id: '3102', code: '3102', name: 'الأرباح المرحلية / المبقاة', type: 'EQUITY', parentId: '3000', isSystem: true, description: 'صافي أرباح الفترات السابقة', balance: 0 },

  // 4000 REVENUE
  { id: '4000', code: '4000', name: 'الإيرادات', type: 'REVENUE', isHeader: true, isSystem: true, balance: 0 },
  { id: '4101', code: '4101', name: 'إيرادات المبيعات', type: 'REVENUE', parentId: '4000', isSystem: true, description: 'إجمالي المبيعات قبل الضريبة', balance: 0 },

  // 5000 EXPENSES
  { id: '5000', code: '5000', name: 'المصروفات', type: 'EXPENSE', isHeader: true, isSystem: true, balance: 0 },
  { id: '5101', code: '5101', name: 'تكلفة البضاعة المباعة', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'تكلفة شراء الأصناف المباعة', balance: 0 },
  { id: '5102', code: '5102', name: 'مصروفات الإيجار', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'إيجار المحل والمخازن', balance: 0 },
  { id: '5103', code: '5103', name: 'مصروفات المرافق (كهرباء ومياه)', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'فواتير الكهرباء والمياه والغاز', balance: 0 },
  { id: '5104', code: '5104', name: 'المرتبات والأجور', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'أجور الموظفين والكاشيرية', balance: 0 },
  { id: '5105', code: '5105', name: 'مصروفات الصيانة والتصليح', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'صيانة الثلاجات والأجهزة', balance: 0 },
  { id: '5106', code: '5106', name: 'مصروفات عمومية ونثريات', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'مصروفات تشغيلية متنوعة', balance: 0 },
  { id: '5107', code: '5107', name: 'مصروفات إهلاك الأصول', type: 'EXPENSE', parentId: '5000', isSystem: true, description: 'إهلاك الأصول السنوي', balance: 0 }
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'jv_1',
    entryNo: 'JV-2508-001',
    date: '2025-08-01',
    source: 'TREASURY',
    referenceNo: 'tr_1',
    description: 'رصيد افتتاح الخزينة الرئيسية ورأس المال',
    lines: [
      { id: 'jvl_1', accountId: '1101', accountCode: '1101', accountName: 'الصندوق / الخزينة الرئيسية', debit: 50000, credit: 0, description: 'إيداع افتتاحي بالخزينة' },
      { id: 'jvl_2', accountId: '3101', accountCode: '3101', accountName: 'رأس المال المباشر', debit: 0, credit: 50000, description: 'رأس المال المستثمر' }
    ],
    totalDebit: 50000,
    totalCredit: 50000,
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T08:00:00.000Z'
  },
  {
    id: 'jv_2',
    entryNo: 'JV-2508-002',
    date: '2025-08-01',
    source: 'EXPENSE',
    referenceNo: 'exp_1',
    description: 'إثبات مصروف إيجار الفرع الرئيسي لشهر أغسطس',
    lines: [
      { id: 'jvl_3', accountId: '5102', accountCode: '5102', accountName: 'مصروفات الإيجار', debit: 12000, credit: 0, description: 'إيجار الفرع' },
      { id: 'jvl_4', accountId: '1101', accountCode: '1101', accountName: 'الصندوق / الخزينة الرئيسية', debit: 0, credit: 12000, description: 'سداد نقداً من الخزينة' }
    ],
    totalDebit: 12000,
    totalCredit: 12000,
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-01T09:00:00.000Z'
  },
  {
    id: 'jv_3',
    entryNo: 'JV-2508-003',
    date: '2025-08-05',
    source: 'EXPENSE',
    referenceNo: 'exp_2',
    description: 'إثبات مصروف فاتورة الكهرباء للتكييفات والثلاجات',
    lines: [
      { id: 'jvl_5', accountId: '5103', accountCode: '5103', accountName: 'مصروفات المرافق (كهرباء ومياه)', debit: 3450, credit: 0, description: 'كهرباء وثلاجات' },
      { id: 'jvl_6', accountId: '1101', accountCode: '1101', accountName: 'الصندوق / الخزينة الرئيسية', debit: 0, credit: 3450, description: 'سداد نقداً من الخزينة' }
    ],
    totalDebit: 3450,
    totalCredit: 3450,
    createdBy: 'أحمد محمود (المدير)',
    createdAt: '2025-08-05T11:20:00.000Z'
  },
  {
    id: 'jv_4',
    entryNo: 'JV-2508-004',
    date: '2025-08-01',
    source: 'PURCHASE',
    referenceNo: 'PUR-250801-001',
    description: 'إثبات فاتورة شراء آجل - شركة القاهرة للصناعات الغذائية',
    lines: [
      { id: 'jvl_7', accountId: '1104', accountCode: '1104', accountName: 'المخزون السلعي', debit: 15400, credit: 0, description: 'شراء شحنة أرز وسكر' },
      { id: 'jvl_8', accountId: '2101', accountCode: '2101', accountName: 'الموردون / دائنون', debit: 0, credit: 15400, description: 'استحقاق للمورد' }
    ],
    totalDebit: 15400,
    totalCredit: 15400,
    createdBy: 'حسن إبراهيم (أمين المخزن)',
    createdAt: '2025-08-01T10:00:00.000Z'
  },
  {
    id: 'jv_5',
    entryNo: 'JV-2508-005',
    date: '2025-08-10',
    source: 'SALE',
    referenceNo: 'INV-250810-1285',
    description: 'إثبات فاتورة بيع نقدي رقم INV-250810-1285 وتكلفة المبيعات',
    lines: [
      { id: 'jvl_9', accountId: '1101', accountCode: '1101', accountName: 'الصندوق / الخزينة الرئيسية', debit: 1250, credit: 0, description: 'تحصيل نقدي' },
      { id: 'jvl_10', accountId: '4101', accountCode: '4101', accountName: 'إيرادات المبيعات', debit: 0, credit: 1100, description: 'مبيعات قبل الضريبة' },
      { id: 'jvl_11', accountId: '2102', accountCode: '2102', accountName: 'ضريبة القيمة المضافة مستحقة', debit: 0, credit: 150, description: 'ضريبة 14%' },
      { id: 'jvl_12', accountId: '5101', accountCode: '5101', accountName: 'تكلفة البضاعة المباعة', debit: 840, credit: 0, description: 'إثبات تكلفة البضاعة' },
      { id: 'jvl_13', accountId: '1104', accountCode: '1104', accountName: 'المخزون السلعي', debit: 0, credit: 840, description: 'خصم كمية من المخزن' }
    ],
    totalDebit: 2090,
    totalCredit: 2090,
    createdBy: 'كاشير 1',
    createdAt: '2025-08-10T17:25:00.000Z'
  },
  {
    id: 'jv_6',
    entryNo: 'JV-2508-006',
    date: '2025-08-10',
    source: 'SALE',
    referenceNo: 'INV-250810-1284',
    description: 'إثبات فاتورة بيع نقدي رقم INV-250810-1284 وتكلفة المبيعات',
    lines: [
      { id: 'jvl_14', accountId: '1101', accountCode: '1101', accountName: 'الصندوق / الخزينة الرئيسية', debit: 350.75, credit: 0, description: 'تحصيل نقدي' },
      { id: 'jvl_15', accountId: '4101', accountCode: '4101', accountName: 'إيرادات المبيعات', debit: 0, credit: 307.67, description: 'مبيعات قبل الضريبة' },
      { id: 'jvl_16', accountId: '2102', accountCode: '2102', accountName: 'ضريبة القيمة المضافة مستحقة', debit: 0, credit: 43.08, description: 'ضريبة 14%' },
      { id: 'jvl_17', accountId: '5101', accountCode: '5101', accountName: 'تكلفة البضاعة المباعة', debit: 238.00, credit: 0, description: 'إثبات تكلفة البضاعة' },
      { id: 'jvl_18', accountId: '1104', accountCode: '1104', accountName: 'المخزون السلعي', debit: 0, credit: 238.00, description: 'خصم كمية من المخزن' }
    ],
    totalDebit: 588.75,
    totalCredit: 588.75,
    createdBy: 'كاشير 2',
    createdAt: '2025-08-10T17:10:00.000Z'
  }
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  {
    id: 'asset_1',
    code: 'AST-001',
    name: 'ثلاجة عرض كبيرة 4 باب (تجميد/تبريد)',
    purchaseDate: '2024-01-15',
    purchaseCost: 85000,
    salvageValue: 5000,
    usefulLifeYears: 5,
    accountId: '1201',
    accumDepAccountId: '1202',
    branchId: 'br_main',
    accumDepreciation: 16000,
    createdAt: '2024-01-15T10:00:00.000Z'
  },
  {
    id: 'asset_2',
    code: 'AST-002',
    name: 'نظام كاشير متكامل (شاشات touch + طابعات فواتير + قارئ باركود)',
    purchaseDate: '2024-06-01',
    purchaseCost: 32000,
    salvageValue: 2000,
    usefulLifeYears: 3,
    accountId: '1201',
    accumDepAccountId: '1202',
    branchId: 'br_main',
    accumDepreciation: 10000,
    createdAt: '2024-06-01T10:00:00.000Z'
  }
];

// Database Engine initialization check
let isFirestoreInitialized = false;

export function initFirestore(): void {
  if (isFirestoreInitialized) return;
  isFirestoreInitialized = true;

  // Background Initial Seeding into Cloud Firestore if cloud database is fresh
  seedSettingsIfEmpty(getStorage('settings', DEFAULT_SETTINGS));
  seedCollectionIfEmpty('roles', getRoles());
  // seedCollectionIfEmpty only writes when the collection is fully empty.
  // Push role_developer explicitly so it appears even on an existing
  // Firestore project that already has the other roles.
  const developerRole = INITIAL_ROLES.find(r => r.id === 'role_developer');
  if (developerRole) {
    syncToFirestore('roles', developerRole);
  }
  seedCollectionIfEmpty('branches', getBranches());
  seedCollectionIfEmpty('warehouses', getWarehouses());
  seedCollectionIfEmpty('users', getUsers());
  seedCollectionIfEmpty('categories', getCategories());
  seedCollectionIfEmpty('units', getUnits());
  seedCollectionIfEmpty('products', getProducts());
  seedCollectionIfEmpty('customers', getCustomers());
  seedCollectionIfEmpty('suppliers', getSuppliers());
  seedCollectionIfEmpty('expense_categories', getExpenseCategories());
  seedCollectionIfEmpty('expenses', getExpenses());
  seedCollectionIfEmpty('purchases', getPurchaseInvoices());
  seedCollectionIfEmpty('treasury', getTreasuryTransactions());
  seedCollectionIfEmpty('bank_accounts', getBankAccounts());
  seedCollectionIfEmpty('stock', getStock());
  seedCollectionIfEmpty('sales', getSales());
  seedCollectionIfEmpty('accounts', getAccounts());
  seedCollectionIfEmpty('journal_entries', getJournalEntries());
  seedCollectionIfEmpty('fixed_assets', getFixedAssets());
  seedCollectionIfEmpty('audit_logs', getAuditLogs());

  // Setup Realtime Settings listener
  setupSettingsListener((remoteSettings) => {
    if (remoteSettings && typeof remoteSettings === 'object') {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'settings', JSON.stringify(remoteSettings));
      notifyDatabaseChange();
    }
  });

  // Setup Realtime Collection Listeners
  const collectionsToListen = [
    { col: 'products', key: 'products' },
    { col: 'stock', key: 'stock' },
    { col: 'sales', key: 'sales' },
    { col: 'customers', key: 'customers' },
    { col: 'suppliers', key: 'suppliers' },
    { col: 'purchases', key: 'purchase_invoices' },
    { col: 'expenses', key: 'expenses' },
    { col: 'treasury', key: 'treasury_transactions' },
    { col: 'bank_accounts', key: 'bank_accounts' },
    { col: 'branches', key: 'branches' },
    { col: 'warehouses', key: 'warehouses' },
    { col: 'categories', key: 'categories' },
    { col: 'units', key: 'units' },
    { col: 'users', key: 'users' },
    { col: 'roles', key: 'roles' },
    { col: 'accounts', key: 'accounts' },
    { col: 'journal_entries', key: 'journal_entries' },
    { col: 'fixed_assets', key: 'fixed_assets' },
    { col: 'audit_logs', key: 'audit_logs' }
  ];

  collectionsToListen.forEach(({ col, key }) => {
    setupCollectionListener(col, (remoteItems) => {
      if (remoteItems && remoteItems.length > 0) {
        localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(remoteItems));
        notifyDatabaseChange();
      }
    });
  });
}

export function initDB(): void {
  if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'initialized')) {
    setStorage('settings', DEFAULT_SETTINGS);
    setStorage('roles', INITIAL_ROLES);
    setStorage('branches', INITIAL_BRANCHES);
    setStorage('warehouses', INITIAL_WAREHOUSES);
    setStorage('users', INITIAL_USERS);
    setStorage('categories', INITIAL_CATEGORIES);
    setStorage('units', INITIAL_UNITS);
    setStorage('products', INITIAL_PRODUCTS);
    setStorage('customers', INITIAL_CUSTOMERS);
    setStorage('suppliers', INITIAL_SUPPLIERS);
    setStorage('expense_categories', INITIAL_EXPENSE_CATEGORIES);
    setStorage('expenses', INITIAL_EXPENSES);
    setStorage('purchase_invoices', INITIAL_PURCHASE_INVOICES);
    setStorage('treasury_transactions', INITIAL_TREASURY_TRANSACTIONS);
    setStorage('bank_accounts', INITIAL_BANK_ACCOUNTS);
    setStorage('stock', INITIAL_STOCK);
    setStorage('sales', INITIAL_SALES);
    setStorage('stock_movements', []);
    setStorage('audit_logs', INITIAL_AUDIT_LOGS);
    setStorage('held_sales', []);
    setStorage('accounts', INITIAL_CHART_OF_ACCOUNTS);
    setStorage('journal_entries', INITIAL_JOURNAL_ENTRIES);
    setStorage('fixed_assets', INITIAL_FIXED_ASSETS);
    setStorage('depreciation_records', []);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'initialized', 'true');
  } else {
    // Ensure new Phase 3 keys exist even if system was initialized before
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'accounts')) {
      setStorage('accounts', INITIAL_CHART_OF_ACCOUNTS);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'journal_entries')) {
      setStorage('journal_entries', INITIAL_JOURNAL_ENTRIES);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'fixed_assets')) {
      setStorage('fixed_assets', INITIAL_FIXED_ASSETS);
    }
    if (!localStorage.getItem(STORAGE_KEY_PREFIX + 'depreciation_records')) {
      setStorage('depreciation_records', []);
    }
  }

  // Initialize Firestore listeners & background synchronization
  initFirestore();
}

// Data Access Methods
export function getSettings(): SystemSettings {
  initDB();
  return getStorage('settings', DEFAULT_SETTINGS);
}

export function updateSettings(newSettings: Partial<SystemSettings>): SystemSettings {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  setStorage('settings', updated);
  return updated;
}

export function getRoles(): Role[] {
  initDB();
  return getStorage('roles', INITIAL_ROLES);
}

export function getBranches(): Branch[] {
  initDB();
  return getStorage('branches', INITIAL_BRANCHES);
}

export function saveBranch(branch: Branch): Branch[] {
  const branches = getBranches();
  const index = branches.findIndex(b => b.id === branch.id);
  if (index >= 0) {
    branches[index] = branch;
  } else {
    branches.push(branch);
  }
  setStorage('branches', branches);
  return branches;
}

export function deleteBranch(id: string): Branch[] {
  const branches = getBranches().filter(b => b.id !== id && !b.isDefault);
  setStorage('branches', branches);
  deleteFromFirestore('branches', id);
  return branches;
}

export function getWarehouses(branchId?: string): Warehouse[] {
  initDB();
  const all = getStorage('warehouses', INITIAL_WAREHOUSES);
  return branchId ? all.filter(w => w.branchId === branchId) : all;
}

export function saveWarehouse(wh: Warehouse): Warehouse[] {
  const warehouses = getStorage('warehouses', INITIAL_WAREHOUSES);
  const index = warehouses.findIndex(w => w.id === wh.id);
  if (index >= 0) {
    warehouses[index] = wh;
  } else {
    warehouses.push(wh);
  }
  setStorage('warehouses', warehouses);
  return warehouses;
}

export function getUsers(): User[] {
  initDB();
  return getStorage('users', INITIAL_USERS);
}

export function saveUser(user: User): User[] {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  setStorage('users', users);
  return users;
}

export function getCategories(): Category[] {
  initDB();
  return getStorage('categories', INITIAL_CATEGORIES);
}

export function getUnits(): Unit[] {
  initDB();
  return getStorage('units', INITIAL_UNITS);
}

export function getProducts(): Product[] {
  initDB();
  const products = getStorage('products', INITIAL_PRODUCTS);
  let updated = false;
  products.forEach(p => {
    if (p.id === 'prod_3' && p.image.includes('1581441363689')) {
      p.image = 'https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=300&auto=format&fit=crop&q=80';
      updated = true;
    }
  });
  if (updated) {
    setStorage('products', products);
  }
  return products;
}

export function getProductByBarcode(barcode: string): Product | undefined {
  const products = getProducts();
  const query = barcode.trim().toLowerCase();
  return products.find(p => p.active && p.barcodes.some(b => b.toLowerCase() === query));
}

export function saveProduct(product: Product): Product[] {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  setStorage('products', products);
  return products;
}

export function getStock(): StockItem[] {
  initDB();
  return getStorage('stock', INITIAL_STOCK);
}

export function getProductStockInWarehouse(productId: string, warehouseId: string): number {
  const stock = getStock();
  const item = stock.find(s => s.productId === productId && s.warehouseId === warehouseId);
  return item ? item.quantity : 0;
}

export function updateStock(productId: string, warehouseId: string, deltaQty: number, reference: string, user: string): void {
  const stock = getStock();
  let item = stock.find(s => s.productId === productId && s.warehouseId === warehouseId);
  if (item) {
    item.quantity = Math.max(0, item.quantity + deltaQty);
  } else {
    item = {
      id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      productId,
      warehouseId,
      quantity: Math.max(0, deltaQty)
    };
    stock.push(item);
  }
  setStorage('stock', stock);

  // Record Stock Movement
  const movements: StockMovement[] = getStorage('stock_movements', []);
  movements.unshift({
    id: 'mov_' + Date.now(),
    productId,
    warehouseId,
    type: deltaQty < 0 ? 'OUT' : 'IN',
    quantity: Math.abs(deltaQty),
    reference,
    notes: deltaQty < 0 ? 'خصم مبيعات نقطة البيع' : 'إضافة مخزنية / تعديل',
    createdBy: user,
    createdAt: new Date().toISOString()
  });
  setStorage('stock_movements', movements);
}

export function getCustomers(): Customer[] {
  initDB();
  return getStorage('customers', INITIAL_CUSTOMERS);
}

export function saveCustomer(customer: Customer): Customer[] {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.push(customer);
  }
  setStorage('customers', customers);
  return customers;
}

export function deleteCustomer(id: string): Customer[] {
  const customers = getCustomers().filter(c => c.id !== id && c.id !== 'cust_cash');
  setStorage('customers', customers);
  deleteFromFirestore('customers', id);
  return customers;
}

// Suppliers CRUD
export function getSuppliers(): Supplier[] {
  initDB();
  return getStorage('suppliers', INITIAL_SUPPLIERS);
}

export function saveSupplier(supplier: Supplier): Supplier[] {
  const suppliers = getSuppliers();
  const index = suppliers.findIndex(s => s.id === supplier.id);
  if (index >= 0) {
    suppliers[index] = supplier;
  } else {
    suppliers.push(supplier);
  }
  setStorage('suppliers', suppliers);
  return suppliers;
}

export function deleteSupplier(id: string): Supplier[] {
  const suppliers = getSuppliers().filter(s => s.id !== id);
  setStorage('suppliers', suppliers);
  deleteFromFirestore('suppliers', id);
  return suppliers;
}

// Expenses CRUD
export function getExpenseCategories(): ExpenseCategory[] {
  initDB();
  return getStorage('expense_categories', INITIAL_EXPENSE_CATEGORIES);
}

export function getExpenses(): Expense[] {
  initDB();
  return getStorage('expenses', INITIAL_EXPENSES);
}

export function saveExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const expenses = getExpenses();
  const newExpense: Expense = {
    ...expenseData,
    id: 'exp_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  expenses.unshift(newExpense);
  setStorage('expenses', expenses);

  // Automatically record Treasury or Bank Transaction OUT
  if (newExpense.paymentMethod === 'BANK' && newExpense.bankAccountId) {
    addBankTransaction({
      bankAccountId: newExpense.bankAccountId,
      type: 'WITHDRAWAL',
      amount: newExpense.amount,
      description: `مصروف بنكي: ${newExpense.categoryName}${newExpense.notes ? ` - ${newExpense.notes}` : ''}`,
      relatedSource: 'EXPENSE',
      referenceId: newExpense.id,
      createdBy: newExpense.createdBy
    });
  } else {
    addTreasuryTransaction({
      type: 'OUT',
      amount: newExpense.amount,
      source: 'EXPENSE',
      referenceId: newExpense.id,
      description: `مصروف: ${newExpense.categoryName}${newExpense.notes ? ` - ${newExpense.notes}` : ''}`,
      branchId: newExpense.branchId,
      createdBy: newExpense.createdBy
    });
  }

  // Auto Journal Entry
  createAutoJournalForExpense(newExpense);

  addAuditLog({
    userId: 'active_user',
    userName: newExpense.createdBy,
    action: 'CREATE',
    module: 'المصروفات',
    details: `تسجيل مصروف جديد (${newExpense.categoryName}) بمبلغ ${newExpense.amount.toFixed(2)} ج.م`
  });

  return newExpense;
}

export function deleteExpense(id: string): Expense[] {
  const expenses = getExpenses().filter(e => e.id !== id);
  setStorage('expenses', expenses);
  deleteFromFirestore('expenses', id);
  return expenses;
}

// Purchases CRUD
export function getPurchaseInvoices(): PurchaseInvoice[] {
  initDB();
  return getStorage('purchase_invoices', INITIAL_PURCHASE_INVOICES);
}

export function addPurchaseInvoice(invData: Omit<PurchaseInvoice, 'id' | 'invoiceNo' | 'createdAt'>): PurchaseInvoice {
  const purchases = getPurchaseInvoices();
  const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const invoiceNo = `PUR-${todayStr}-${purchases.length + 101}`;

  const newInvoice: PurchaseInvoice = {
    ...invData,
    id: 'pur_' + Date.now(),
    invoiceNo,
    createdAt: new Date().toISOString()
  };

  // 1. Increase stock in the warehouse (Stock Movement IN)
  if (newInvoice.items && newInvoice.items.length > 0) {
    newInvoice.items.forEach(item => {
      updateStock(item.productId, newInvoice.warehouseId, item.qty, invoiceNo, newInvoice.createdBy);
    });
  }

  // 2. Financial settlement: Treasury/Bank OUT if paid, or increase Supplier Balance if unpaid
  if (newInvoice.isPaid) {
    if (newInvoice.paymentMethod === 'BANK' && newInvoice.bankAccountId) {
      addBankTransaction({
        bankAccountId: newInvoice.bankAccountId,
        type: 'WITHDRAWAL',
        amount: newInvoice.totalAmount,
        description: `فاتورة شراء سداد بنكي ${invoiceNo} - المورد: ${newInvoice.supplierName}`,
        relatedSource: 'PURCHASE',
        referenceId: newInvoice.id,
        createdBy: newInvoice.createdBy
      });
    } else {
      addTreasuryTransaction({
        type: 'OUT',
        amount: newInvoice.totalAmount,
        source: 'PURCHASE',
        referenceId: newInvoice.id,
        description: `فاتورة شراء كاش رقم ${invoiceNo} - المورد: ${newInvoice.supplierName}`,
        branchId: newInvoice.branchId,
        createdBy: newInvoice.createdBy
      });
    }
  } else {
    // Increase supplier balance
    const suppliers = getSuppliers();
    const supplier = suppliers.find(s => s.id === newInvoice.supplierId);
    if (supplier) {
      supplier.balance += newInvoice.totalAmount;
      saveSupplier(supplier);
    }
  }

  // Auto Journal Entry
  createAutoJournalForPurchase(newInvoice);

  purchases.unshift(newInvoice);
  setStorage('purchase_invoices', purchases);

  addAuditLog({
    userId: 'active_user',
    userName: newInvoice.createdBy,
    action: 'CREATE',
    module: 'المشتريات',
    details: `إضافة فاتورة شراء جديدة رقم ${invoiceNo} من ${newInvoice.supplierName} بقيمة ${newInvoice.totalAmount.toFixed(2)} ج.م`
  });

  return newInvoice;
}

// Treasury & Cash Flow
export function getTreasuryTransactions(): TreasuryTransaction[] {
  initDB();
  return getStorage('treasury_transactions', INITIAL_TREASURY_TRANSACTIONS);
}

export function addTreasuryTransaction(txData: Omit<TreasuryTransaction, 'id' | 'createdAt'>): TreasuryTransaction {
  const transactions = getTreasuryTransactions();
  const newTx: TreasuryTransaction = {
    ...txData,
    id: 'tr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    createdAt: new Date().toISOString()
  };
  transactions.unshift(newTx);
  setStorage('treasury_transactions', transactions);

  // Auto Journal Entry if manual transaction
  if (newTx.source === 'MANUAL') {
    createAutoJournalForTreasury(newTx);
  }

  return newTx;
}

export function getTreasuryBalance(): number {
  const transactions = getTreasuryTransactions();
  return transactions.reduce((acc, tx) => {
    return tx.type === 'IN' ? acc + tx.amount : acc - tx.amount;
  }, 0);
}

// Bank Accounts (For Display)
export function getBankAccounts(): BankAccount[] {
  initDB();
  return getStorage('bank_accounts', INITIAL_BANK_ACCOUNTS);
}

export function saveBankAccount(account: BankAccount): BankAccount[] {
  const accounts = getBankAccounts();
  const index = accounts.findIndex(a => a.id === account.id);
  if (index >= 0) {
    accounts[index] = { ...account, updatedAt: new Date().toISOString() };
  } else {
    accounts.push({ ...account, updatedAt: new Date().toISOString() });
  }
  setStorage('bank_accounts', accounts);
  return accounts;
}

export function deleteBankAccount(id: string): BankAccount[] {
  const accounts = getBankAccounts().filter(a => a.id !== id);
  setStorage('bank_accounts', accounts);
  return accounts;
}

export function getSales(): Sale[] {
  initDB();
  return getStorage('sales', INITIAL_SALES);
}

export function getHeldSales(): Sale[] {
  initDB();
  return getStorage('held_sales', []);
}

export function saveHeldSale(sale: Sale): void {
  const held = getHeldSales();
  held.unshift(sale);
  setStorage('held_sales', held);
}

export function removeHeldSale(id: string): void {
  const held = getHeldSales().filter(s => s.id !== id);
  setStorage('held_sales', held);
}

// Complete Sale Transaction - Deducts Stock, Records Cash Treasury, Updates Customer Balance, Adds Audit Log
export function completeSale(saleData: Omit<Sale, 'id' | 'invoiceNo' | 'createdAt'>): Sale {
  const sales = getSales();
  const invoiceNum = sales.length + 1286;
  const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const invoiceNo = `INV-${todayStr}-${invoiceNum}`;

  const newSale: Sale = {
    ...saleData,
    id: 'sale_' + Date.now(),
    invoiceNo,
    createdAt: new Date().toISOString()
  };

  // 1. Deduct inventory stock for each sold item
  if (newSale.items && newSale.items.length > 0) {
    newSale.items.forEach(item => {
      updateStock(item.productId, newSale.warehouseId, -item.qty, invoiceNo, newSale.createdBy);
    });
  }

  // 2. Record Cash inflow in Treasury if cash payment made
  const actualCashCollected = newSale.paymentMethod === 'CASH' 
    ? Math.max(0, Math.min(newSale.grandTotal, newSale.paidAmount))
    : 0;

  if (actualCashCollected > 0) {
    addTreasuryTransaction({
      type: 'IN',
      amount: actualCashCollected,
      source: 'SALE',
      referenceId: newSale.id,
      description: `تحصيل مبيعات نقدي - فاتورة ${invoiceNo} (${newSale.customerName})`,
      branchId: newSale.branchId,
      createdBy: newSale.createdBy
    });
  }

  // 3. Update Customer Balance if credit or unpaid portion exists
  const customers = getCustomers();
  const customer = customers.find(c => c.name === newSale.customerName);
  if (customer && customer.id !== 'cust_cash') {
    const debtAmount = newSale.grandTotal - actualCashCollected;
    if (debtAmount > 0) {
      customer.balance += debtAmount;
      saveCustomer(customer);
    }
  }

  // 4. Auto Double-Entry Journal Creation
  createAutoJournalForSale(newSale);

  sales.unshift(newSale);
  setStorage('sales', sales);

  // Record Audit Log
  addAuditLog({
    userId: 'active_user',
    userName: newSale.createdBy,
    action: 'SALE',
    module: 'نقطة البيع',
    details: `إتمام فاتورة بيع جديدة برقم ${invoiceNo} بقيمة ${newSale.grandTotal.toFixed(2)} ج.م`
  });

  return newSale;
}

export function getAuditLogs(): AuditLog[] {
  initDB();
  return getStorage('audit_logs', INITIAL_AUDIT_LOGS);
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const logs = getAuditLogs();
  logs.unshift({
    ...log,
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString()
  });
  setStorage('audit_logs', logs.slice(0, 100)); // Keep latest 100 logs
}

export function resetDatabaseToSeedData(): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + 'initialized');
  initDB();
  notifyDatabaseChange();
}

export function exportDatabaseJSON(): string {
  initDB();
  const exportData = {
    settings: getSettings(),
    roles: getRoles(),
    branches: getBranches(),
    warehouses: getWarehouses(),
    users: getUsers(),
    categories: getCategories(),
    units: getUnits(),
    products: getProducts(),
    stock: getStock(),
    sales: getSales(),
    customers: getCustomers(),
    suppliers: getSuppliers(),
    expenses: getExpenses(),
    purchase_invoices: getPurchaseInvoices(),
    treasury_transactions: getTreasuryTransactions(),
    bank_accounts: getBankAccounts(),
    bank_transactions: getBankTransactions(),
    employees: getEmployees(),
    payroll_runs: getPayrollRuns(),
    audit_logs: getAuditLogs(),
    accounts: getAccounts(),
    journal_entries: getJournalEntries(),
    fixed_assets: getFixedAssets(),
    depreciation_records: getDepreciationRecords()
  };
  return JSON.stringify(exportData, null, 2);
}

export function importDatabaseJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.products && data.branches && data.sales) {
      if (data.settings) setStorage('settings', data.settings);
      if (data.roles) setStorage('roles', data.roles);
      if (data.branches) setStorage('branches', data.branches);
      if (data.warehouses) setStorage('warehouses', data.warehouses);
      if (data.users) setStorage('users', data.users);
      if (data.categories) setStorage('categories', data.categories);
      if (data.units) setStorage('units', data.units);
      if (data.products) setStorage('products', data.products);
      if (data.stock) setStorage('stock', data.stock);
      if (data.sales) setStorage('sales', data.sales);
      if (data.customers) setStorage('customers', data.customers);
      if (data.suppliers) setStorage('suppliers', data.suppliers);
      if (data.expenses) setStorage('expenses', data.expenses);
      if (data.purchase_invoices) setStorage('purchase_invoices', data.purchase_invoices);
      if (data.treasury_transactions) setStorage('treasury_transactions', data.treasury_transactions);
      if (data.bank_accounts) setStorage('bank_accounts', data.bank_accounts);
      if (data.bank_transactions) setStorage('bank_transactions', data.bank_transactions);
      if (data.employees) setStorage('employees', data.employees);
      if (data.payroll_runs) setStorage('payroll_runs', data.payroll_runs);
      if (data.audit_logs) setStorage('audit_logs', data.audit_logs);
      if (data.accounts) setStorage('accounts', data.accounts);
      if (data.journal_entries) setStorage('journal_entries', data.journal_entries);
      if (data.fixed_assets) setStorage('fixed_assets', data.fixed_assets);
      if (data.depreciation_records) setStorage('depreciation_records', data.depreciation_records);
      notifyDatabaseChange();
      return true;
    }
  } catch (e) {
    console.error('Import error:', e);
  }
  return false;
}

// ==================== PHASE 3 ACCOUNTING IMPLEMENTATION ====================

export function getAccounts(): Account[] {
  initDB();
  const raw = getStorage<Account[]>('accounts', INITIAL_CHART_OF_ACCOUNTS);
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    setStorage('accounts', INITIAL_CHART_OF_ACCOUNTS);
    return INITIAL_CHART_OF_ACCOUNTS;
  }
  return raw.map(a => ({
    ...a,
    balance: typeof a.balance === 'number' ? a.balance : 0
  }));
}

export function saveAccount(account: Account): Account[] {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.id === account.id || a.code === account.code);
  if (index >= 0) {
    accounts[index] = account;
  } else {
    accounts.push(account);
  }
  setStorage('accounts', accounts);
  return accounts;
}

export function deleteAccount(id: string): Account[] {
  const accounts = getAccounts().filter(a => a.id !== id && !a.isSystem && !a.isHeader);
  setStorage('accounts', accounts);
  return accounts;
}

export function getJournalEntries(): JournalEntry[] {
  initDB();
  return getStorage('journal_entries', INITIAL_JOURNAL_ENTRIES);
}

export function addJournalEntry(entryData: Omit<JournalEntry, 'id' | 'entryNo' | 'createdAt' | 'totalDebit' | 'totalCredit'> & { totalDebit?: number; totalCredit?: number }): JournalEntry {
  const entries = getJournalEntries();
  const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
  const entryNo = `JV-${yearMonth}-${String(entries.length + 101).padStart(3, '0')}`;

  const totalDebit = entryData.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = entryData.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

  const newEntry: JournalEntry = {
    ...entryData,
    id: 'jv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    entryNo,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    createdAt: new Date().toISOString()
  };

  entries.unshift(newEntry);
  setStorage('journal_entries', entries);
  return newEntry;
}

// Auto-journal helper functions
function createAutoJournalForSale(sale: Sale): void {
  const lines: JournalEntryLine[] = [];
  const accounts = getAccounts();
  const cashAcc = accounts.find(a => a.code === '1101') || { id: '1101', code: '1101', name: 'الصندوق / الخزينة الرئيسية' };
  const custAcc = accounts.find(a => a.code === '1103') || { id: '1103', code: '1103', name: 'العملاء / مدينون' };
  const revAcc = accounts.find(a => a.code === '4101') || { id: '4101', code: '4101', name: 'إيرادات المبيعات' };
  const vatAcc = accounts.find(a => a.code === '2102') || { id: '2102', code: '2102', name: 'ضريبة القيمة المضافة مستحقة' };
  const cogsAcc = accounts.find(a => a.code === '5101') || { id: '5101', code: '5101', name: 'تكلفة البضاعة المباعة' };
  const invAcc = accounts.find(a => a.code === '1104') || { id: '1104', code: '1104', name: 'المخزون السلعي' };

  const actualCashCollected = sale.paymentMethod === 'CASH'
    ? Math.max(0, Math.min(sale.grandTotal, sale.paidAmount))
    : 0;
  const debtAmount = sale.grandTotal - actualCashCollected;
  const netSalesRevenue = sale.subtotal - sale.discount;

  if (actualCashCollected > 0) {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: cashAcc.id,
      accountCode: cashAcc.code,
      accountName: cashAcc.name,
      debit: actualCashCollected,
      credit: 0,
      description: `تحصيل نقدي - فاتورة ${sale.invoiceNo}`
    });
  }

  if (debtAmount > 0) {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: custAcc.id,
      accountCode: custAcc.code,
      accountName: custAcc.name,
      debit: debtAmount,
      credit: 0,
      description: `مستحق آجل - العميل: ${sale.customerName}`
    });
  }

  if (netSalesRevenue > 0) {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: revAcc.id,
      accountCode: revAcc.code,
      accountName: revAcc.name,
      debit: 0,
      credit: netSalesRevenue,
      description: `إيراد مبيعات فاتورة ${sale.invoiceNo}`
    });
  }

  if (sale.vatAmount > 0) {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: vatAcc.id,
      accountCode: vatAcc.code,
      accountName: vatAcc.name,
      debit: 0,
      credit: sale.vatAmount,
      description: `ضريبة قيمة مضافة 14% فاتورة ${sale.invoiceNo}`
    });
  }

  // Calculate COGS from products
  let totalCogs = 0;
  const products = getProducts();
  if (sale.items && sale.items.length > 0) {
    sale.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const costUnitPrice = prod ? prod.purchasePrice : (item.unitPrice * 0.8);
      totalCogs += costUnitPrice * item.qty;
    });
  }

  if (totalCogs > 0) {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: cogsAcc.id,
      accountCode: cogsAcc.code,
      accountName: cogsAcc.name,
      debit: totalCogs,
      credit: 0,
      description: `إثبات تكلفة البضاعة المباعة`
    });
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: invAcc.id,
      accountCode: invAcc.code,
      accountName: invAcc.name,
      debit: 0,
      credit: totalCogs,
      description: `خصم بضاعة من المخزون`
    });
  }

  if (lines.length > 0) {
    addJournalEntry({
      date: sale.createdAt.slice(0, 10),
      source: 'SALE',
      referenceNo: sale.invoiceNo,
      description: `قيد تلقائي: فاتورة بيع رقم ${sale.invoiceNo} (${sale.customerName})`,
      lines,
      createdBy: sale.createdBy
    });
  }
}

function createAutoJournalForPurchase(purchase: PurchaseInvoice): void {
  const lines: JournalEntryLine[] = [];
  const accounts = getAccounts();
  const invAcc = accounts.find(a => a.code === '1104') || { id: '1104', code: '1104', name: 'المخزون السلعي' };
  const cashAcc = accounts.find(a => a.code === '1101') || { id: '1101', code: '1101', name: 'الصندوق / الخزينة الرئيسية' };
  const bankAcc = accounts.find(a => a.code === '1102') || { id: '1102', code: '1102', name: 'الحسابات البنكية' };
  const suppAcc = accounts.find(a => a.code === '2101') || { id: '2101', code: '2101', name: 'الموردون / دائنون' };

  lines.push({
    id: 'jvl_' + Math.random().toString(36).substring(2, 7),
    accountId: invAcc.id,
    accountCode: invAcc.code,
    accountName: invAcc.name,
    debit: purchase.totalAmount,
    credit: 0,
    description: `إضافة مخزون بضاعة مشتراة - فاتورة ${purchase.invoiceNo}`
  });

  if (purchase.isPaid) {
    const payAcc = purchase.paymentMethod === 'BANK' ? bankAcc : cashAcc;
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: payAcc.id,
      accountCode: payAcc.code,
      accountName: payAcc.name,
      debit: 0,
      credit: purchase.totalAmount,
      description: purchase.paymentMethod === 'BANK' ? `سداد تحويل بنكي للمورد ${purchase.supplierName}` : `سداد نقداً للمورد ${purchase.supplierName}`
    });
  } else {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: suppAcc.id,
      accountCode: suppAcc.code,
      accountName: suppAcc.name,
      debit: 0,
      credit: purchase.totalAmount,
      description: `إثبات مستحق للمورد ${purchase.supplierName}`
    });
  }

  addJournalEntry({
    date: purchase.createdAt.slice(0, 10),
    source: 'PURCHASE',
    referenceNo: purchase.invoiceNo,
    description: `قيد تلقائي: فاتورة شراء رقم ${purchase.invoiceNo} - ${purchase.supplierName}`,
    lines,
    createdBy: purchase.createdBy
  });
}

function createAutoJournalForExpense(expense: Expense): void {
  const accounts = getAccounts();
  const cashAcc = accounts.find(a => a.code === '1101') || { id: '1101', code: '1101', name: 'الصندوق / الخزينة الرئيسية' };
  const bankAcc = accounts.find(a => a.code === '1102') || { id: '1102', code: '1102', name: 'الحسابات البنكية' };

  let expCode = '5106'; // general
  if (expense.categoryId === 'exp_cat_rent') expCode = '5102';
  else if (expense.categoryId === 'exp_cat_util') expCode = '5103';
  else if (expense.categoryId === 'exp_cat_sal') expCode = '5104';
  else if (expense.categoryId === 'exp_cat_maint') expCode = '5105';

  const expAcc = accounts.find(a => a.code === expCode) || { id: expCode, code: expCode, name: expense.categoryName };
  const payAcc = expense.paymentMethod === 'BANK' ? bankAcc : cashAcc;

  const lines: JournalEntryLine[] = [
    {
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: expAcc.id,
      accountCode: expAcc.code,
      accountName: expAcc.name,
      debit: expense.amount,
      credit: 0,
      description: `إثبات مصروف: ${expense.categoryName}`
    },
    {
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: payAcc.id,
      accountCode: payAcc.code,
      accountName: payAcc.name,
      debit: 0,
      credit: expense.amount,
      description: expense.paymentMethod === 'BANK' ? `سداد مصروف عن طريق البنك` : `سداد مصروف نقداً من الخزينة`
    }
  ];

  addJournalEntry({
    date: expense.date,
    source: 'EXPENSE',
    referenceNo: expense.id,
    description: `قيد تلقائي: مصروف ${expense.categoryName}${expense.notes ? ` (${expense.notes})` : ''}`,
    lines,
    createdBy: expense.createdBy
  });
}

function createAutoJournalForTreasury(tx: TreasuryTransaction): void {
  if (tx.source !== 'MANUAL') return;

  const accounts = getAccounts();
  const cashAcc = accounts.find(a => a.code === '1101') || { id: '1101', code: '1101', name: 'الصندوق / الخزينة الرئيسية' };
  const capAcc = accounts.find(a => a.code === '3101') || { id: '3101', code: '3101', name: 'رأس المال المباشر' };
  const drawAcc = accounts.find(a => a.code === '3102') || { id: '3102', code: '3102', name: 'الأرباح المرحلية / المبقاة' };

  const lines: JournalEntryLine[] = [];

  if (tx.type === 'IN') {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: cashAcc.id,
      accountCode: cashAcc.code,
      accountName: cashAcc.name,
      debit: tx.amount,
      credit: 0,
      description: tx.description
    });
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: capAcc.id,
      accountCode: capAcc.code,
      accountName: capAcc.name,
      debit: 0,
      credit: tx.amount,
      description: `إيداع نقدي الخزينة - ${tx.description}`
    });
  } else {
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: drawAcc.id,
      accountCode: drawAcc.code,
      accountName: drawAcc.name,
      debit: tx.amount,
      credit: 0,
      description: `سحب نقدي - ${tx.description}`
    });
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: cashAcc.id,
      accountCode: cashAcc.code,
      accountName: cashAcc.name,
      debit: 0,
      credit: tx.amount,
      description: tx.description
    });
  }

  addJournalEntry({
    date: tx.createdAt.slice(0, 10),
    source: 'TREASURY',
    referenceNo: tx.id,
    description: `قيد تلقائي حركة خزينة: ${tx.description}`,
    lines,
    createdBy: tx.createdBy
  });
}

// General Ledger query
export interface LedgerTransaction {
  id: string;
  entryNo: string;
  date: string;
  source: string;
  referenceNo?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export function getAccountLedger(accountId: string, startDate?: string, endDate?: string): {
  account: Account | undefined;
  transactions: LedgerTransaction[];
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
} {
  const accounts = getAccounts();
  const account = accounts.find(a => a.id === accountId || a.code === accountId);
  if (!account) {
    return { account: undefined, transactions: [], totalDebit: 0, totalCredit: 0, finalBalance: 0 };
  }

  const entries = getJournalEntries();
  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const txList: LedgerTransaction[] = [];
  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  sortedEntries.forEach(entry => {
    if (startDate && entry.date < startDate) return;
    if (endDate && entry.date > endDate) return;

    entry.lines.forEach(line => {
      if (line.accountId === account.id || line.accountCode === account.code) {
        const debit = line.debit || 0;
        const credit = line.credit || 0;

        totalDebit += debit;
        totalCredit += credit;

        // Balance direction
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          runningBalance += (debit - credit);
        } else {
          runningBalance += (credit - debit);
        }

        txList.push({
          id: line.id,
          entryNo: entry.entryNo,
          date: entry.date,
          source: entry.source,
          referenceNo: entry.referenceNo,
          description: line.description || entry.description,
          debit,
          credit,
          runningBalance
        });
      }
    });
  });

  return {
    account,
    transactions: txList,
    totalDebit,
    totalCredit,
    finalBalance: runningBalance
  };
}

// Trial Balance (ميزان المراجعة)
export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  type: string;
  debitBalance: number;
  creditBalance: number;
}

export function getTrialBalance(asOfDate?: string): {
  items: TrialBalanceItem[];
  totalDebitSum: number;
  totalCreditSum: number;
  isBalanced: boolean;
  diff: number;
} {
  const accounts = getAccounts().filter(a => !a.isHeader);
  const entries = getJournalEntries();

  const filteredEntries = asOfDate 
    ? entries.filter(e => e.date <= asOfDate)
    : entries;

  const balances: Record<string, { debitSum: number; creditSum: number }> = {};
  accounts.forEach(a => {
    balances[a.code] = { debitSum: 0, creditSum: 0 };
  });

  filteredEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode || line.accountId;
      if (!balances[code]) {
        balances[code] = { debitSum: 0, creditSum: 0 };
      }
      balances[code].debitSum += line.debit || 0;
      balances[code].creditSum += line.credit || 0;
    });
  });

  let totalDebitSum = 0;
  let totalCreditSum = 0;

  const items: TrialBalanceItem[] = accounts.map(a => {
    const b = balances[a.code] || { debitSum: 0, creditSum: 0 };
    let debitBalance = 0;
    let creditBalance = 0;

    if (a.type === 'ASSET' || a.type === 'EXPENSE') {
      const net = b.debitSum - b.creditSum;
      if (net >= 0) debitBalance = net;
      else creditBalance = Math.abs(net);
    } else {
      const net = b.creditSum - b.debitSum;
      if (net >= 0) creditBalance = net;
      else debitBalance = Math.abs(net);
    }

    totalDebitSum += debitBalance;
    totalCreditSum += creditBalance;

    return {
      accountCode: a.code,
      accountName: a.name,
      type: a.type,
      debitBalance: Math.round(debitBalance * 100) / 100,
      creditBalance: Math.round(creditBalance * 100) / 100
    };
  }).filter(item => item.debitBalance > 0 || item.creditBalance > 0);

  const roundedDebit = Math.round(totalDebitSum * 100) / 100;
  const roundedCredit = Math.round(totalCreditSum * 100) / 100;
  const diff = Math.abs(roundedDebit - roundedCredit);
  const isBalanced = diff < 0.05;

  return {
    items,
    totalDebitSum: roundedDebit,
    totalCreditSum: roundedCredit,
    isBalanced,
    diff
  };
}

// Fixed Assets & Depreciation
export function getFixedAssets(): FixedAsset[] {
  initDB();
  return getStorage('fixed_assets', INITIAL_FIXED_ASSETS);
}

export function saveFixedAsset(asset: FixedAsset): FixedAsset[] {
  const assets = getFixedAssets();
  const index = assets.findIndex(a => a.id === asset.id || a.code === asset.code);
  if (index >= 0) {
    assets[index] = asset;
  } else {
    assets.push(asset);
  }
  setStorage('fixed_assets', assets);
  return assets;
}

export function deleteFixedAsset(id: string): FixedAsset[] {
  const assets = getFixedAssets().filter(a => a.id !== id);
  setStorage('fixed_assets', assets);
  deleteFromFirestore('fixed_assets', id);
  return assets;
}

export function getDepreciationRecords(): DepreciationRecord[] {
  initDB();
  return getStorage('depreciation_records', []);
}

export function runDepreciationForAsset(assetId: string, user: string, notes?: string): {
  asset: FixedAsset;
  depAmount: number;
  journalEntry: JournalEntry;
} {
  const assets = getFixedAssets();
  const asset = assets.find(a => a.id === assetId);
  if (!asset) throw new Error('الأصل غير موجود');

  // Straight line annual depreciation = (cost - salvageValue) / usefulLifeYears
  const annualDep = (asset.purchaseCost - asset.salvageValue) / Math.max(1, asset.usefulLifeYears);
  const monthlyDep = Math.round((annualDep / 12) * 100) / 100;

  // Post Journal Entry: Debit 5107 Depreciation Expense / Credit 1202 Accumulated Depreciation
  const accounts = getAccounts();
  const depExpAcc = accounts.find(a => a.code === '5107') || { id: '5107', code: '5107', name: 'مصروفات إهلاك الأصول' };
  const accumDepAcc = accounts.find(a => a.code === '1202') || { id: '1202', code: '1202', name: 'مجمع إهلاك الأصول الثابتة' };

  const jv = addJournalEntry({
    date: new Date().toISOString().slice(0, 10),
    source: 'DEPRECIATION',
    referenceNo: asset.code,
    description: `إثبات إهلاك شهري للأصل الثابت: ${asset.name} (${asset.code})`,
    lines: [
      {
        id: 'jvl_' + Math.random().toString(36).substring(2, 7),
        accountId: depExpAcc.id,
        accountCode: depExpAcc.code,
        accountName: depExpAcc.name,
        debit: monthlyDep,
        credit: 0,
        description: `مصروف إهلاك شهري - ${asset.name}`
      },
      {
        id: 'jvl_' + Math.random().toString(36).substring(2, 7),
        accountId: accumDepAcc.id,
        accountCode: accumDepAcc.code,
        accountName: accumDepAcc.name,
        debit: 0,
        credit: monthlyDep,
        description: `مجمع إهلاك - ${asset.name}`
      }
    ],
    createdBy: user
  });

  // Update accumulated depreciation on the asset
  asset.accumDepreciation = (asset.accumDepreciation || 0) + monthlyDep;
  saveFixedAsset(asset);

  // Save depreciation record
  const records = getDepreciationRecords();
  records.unshift({
    id: 'dep_' + Date.now(),
    assetId: asset.id,
    assetName: asset.name,
    date: new Date().toISOString().slice(0, 10),
    amount: monthlyDep,
    journalEntryId: jv.id,
    notes: notes || 'إهلاك شهري بالقسط الثابت',
    createdAt: new Date().toISOString()
  });
  setStorage('depreciation_records', records);

  return { asset, depAmount: monthlyDep, journalEntry: jv };
}

// Tax Report
export function getVatReport(startDate?: string, endDate?: string) {
  const sales = getSales();
  const purchases = getPurchaseInvoices();

  const filteredSales = sales.filter(s => {
    const d = s.createdAt.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return s.status === 'COMPLETED';
  });

  const filteredPurchases = purchases.filter(p => {
    const d = p.createdAt.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  const totalSalesNet = filteredSales.reduce((sum, s) => sum + (s.subtotal - s.discount), 0);
  const totalSalesVat = filteredSales.reduce((sum, s) => sum + s.vatAmount, 0);
  const totalSalesGrand = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);

  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  // Purchase VAT estimation (if 14% included)
  const totalPurchasesVat = Math.round((totalPurchasesAmount - (totalPurchasesAmount / 1.14)) * 100) / 100;
  const totalPurchasesNet = totalPurchasesAmount - totalPurchasesVat;

  const netVatPayable = Math.round((totalSalesVat - totalPurchasesVat) * 100) / 100;

  return {
    salesCount: filteredSales.length,
    totalSalesNet: Math.round(totalSalesNet * 100) / 100,
    totalSalesVat: Math.round(totalSalesVat * 100) / 100,
    totalSalesGrand: Math.round(totalSalesGrand * 100) / 100,
    purchasesCount: filteredPurchases.length,
    totalPurchasesNet: Math.round(totalPurchasesNet * 100) / 100,
    totalPurchasesVat: Math.round(totalPurchasesVat * 100) / 100,
    totalPurchasesAmount: Math.round(totalPurchasesAmount * 100) / 100,
    netVatPayable,
    salesList: filteredSales,
    purchasesList: filteredPurchases
  };
}

// ==================== PHASE 4: BANK TRANSACTIONS & TRANSFERS ====================

export function getBankTransactions(): BankTransaction[] {
  initDB();
  return getStorage('bank_transactions', INITIAL_BANK_TRANSACTIONS);
}

export function addBankTransaction(txData: Omit<BankTransaction, 'id' | 'createdAt'>): BankTransaction {
  const transactions = getBankTransactions();
  const newTx: BankTransaction = {
    ...txData,
    id: 'btx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    createdAt: new Date().toISOString()
  };
  transactions.unshift(newTx);
  setStorage('bank_transactions', transactions);
  return newTx;
}

export function getBankAccountBalance(bankAccountId: string): number {
  const accounts = getBankAccounts();
  const bank = accounts.find(a => a.id === bankAccountId);
  const initialBal = bank ? bank.balance : 0;

  const transactions = getBankTransactions().filter(t => t.bankAccountId === bankAccountId);
  const txTotal = transactions.reduce((sum, t) => {
    return t.type === 'DEPOSIT' ? sum + t.amount : sum - t.amount;
  }, 0);

  return initialBal + txTotal;
}

export function transferTreasuryBank(params: {
  direction: 'DEPOSIT_TO_BANK' | 'WITHDRAW_FROM_BANK';
  bankAccountId: string;
  amount: number;
  description: string;
  branchId?: string;
  createdBy: string;
}): { bankTx: BankTransaction; treasuryTx: TreasuryTransaction; journalEntry: JournalEntry } {
  const bankAccounts = getBankAccounts();
  const bank = bankAccounts.find(a => a.id === params.bankAccountId);
  const bankName = bank ? bank.bankName : 'البنك';

  const isDeposit = params.direction === 'DEPOSIT_TO_BANK';

  // 1. Create Treasury Transaction
  const treasuryTx = addTreasuryTransaction({
    type: isDeposit ? 'OUT' : 'IN',
    amount: params.amount,
    source: 'MANUAL',
    description: isDeposit
      ? `تحويل وإيداع في حساب ${bankName} (${params.description})`
      : `سحب نقدي من حساب ${bankName} للتحويل للخزينة (${params.description})`,
    branchId: params.branchId || 'br_main',
    createdBy: params.createdBy
  });

  // 2. Create Bank Transaction
  const bankTx = addBankTransaction({
    bankAccountId: params.bankAccountId,
    type: isDeposit ? 'DEPOSIT' : 'WITHDRAWAL',
    amount: params.amount,
    description: params.description,
    relatedSource: 'TREASURY',
    referenceId: treasuryTx.id,
    createdBy: params.createdBy
  });

  // 3. Auto Journal Entry
  const accounts = getAccounts();
  const cashAcc = accounts.find(a => a.code === '1101') || { id: '1101', code: '1101', name: 'الصندوق / الخزينة الرئيسية' };
  const bankAcc = accounts.find(a => a.code === '1102') || { id: '1102', code: '1102', name: 'الحسابات البنكية' };

  const lines: JournalEntryLine[] = [];
  if (isDeposit) {
    // Debit Bank, Credit Cash
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: bankAcc.id,
      accountCode: bankAcc.code,
      accountName: bankAcc.name,
      debit: params.amount,
      credit: 0,
      description: `إيداع في حساب ${bankName}`
    });
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: cashAcc.id,
      accountCode: cashAcc.code,
      accountName: cashAcc.name,
      debit: 0,
      credit: params.amount,
      description: `سحب من الخزينة لإيداع بنكي`
    });
  } else {
    // Debit Cash, Credit Bank
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: cashAcc.id,
      accountCode: cashAcc.code,
      accountName: cashAcc.name,
      debit: params.amount,
      credit: 0,
      description: `استلام نقدي بالخزينة من سحب بنكي`
    });
    lines.push({
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: bankAcc.id,
      accountCode: bankAcc.code,
      accountName: bankAcc.name,
      debit: 0,
      credit: params.amount,
      description: `سحب من حساب ${bankName}`
    });
  }

  const jv = addJournalEntry({
    date: new Date().toISOString().slice(0, 10),
    source: 'BANK_TRANSFER',
    referenceNo: bankTx.id,
    description: isDeposit ? `قيد تحويل نقدي من الخزينة إلى ${bankName}` : `قيد تحويل نقدي من ${bankName} إلى الخزينة`,
    lines,
    createdBy: params.createdBy
  });

  return { bankTx, treasuryTx, journalEntry: jv };
}

// ==================== PHASE 4: EMPLOYEES & PAYROLL ====================

export function getEmployees(): Employee[] {
  initDB();
  return getStorage('employees', INITIAL_EMPLOYEES);
}

export function saveEmployee(emp: Employee): Employee[] {
  const employees = getEmployees();
  const index = employees.findIndex(e => e.id === emp.id);
  if (index >= 0) {
    employees[index] = emp;
  } else {
    employees.unshift(emp);
  }
  setStorage('employees', employees);
  return employees;
}

export function deleteEmployee(id: string): Employee[] {
  const employees = getEmployees().filter(e => e.id !== id);
  setStorage('employees', employees);
  return employees;
}

export function getPayrollRuns(): PayrollRun[] {
  initDB();
  return getStorage('payroll_runs', []);
}

export function approvePayrollRun(runData: Omit<PayrollRun, 'id' | 'runNo' | 'createdAt' | 'status'>): PayrollRun {
  const runs = getPayrollRuns();
  const yearMonth = runData.monthYear.replace('-', '');
  const runNo = `PAY-${yearMonth}-${String(runs.length + 1).padStart(2, '0')}`;

  const newRun: PayrollRun = {
    ...runData,
    id: 'pay_' + Date.now(),
    runNo,
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };

  // 1. Deduct funds from Treasury or Bank
  if (newRun.paymentMethod === 'CASH') {
    addTreasuryTransaction({
      type: 'OUT',
      amount: newRun.totalNetSalary,
      source: 'EXPENSE',
      referenceId: newRun.id,
      description: `صرف مسير رواتب شهر ${newRun.monthYear} (${newRun.items.length} موظف)`,
      branchId: newRun.branchId || 'br_main',
      createdBy: newRun.approvedBy
    });
  } else if (newRun.paymentMethod === 'BANK' && newRun.bankAccountId) {
    addBankTransaction({
      bankAccountId: newRun.bankAccountId,
      type: 'WITHDRAWAL',
      amount: newRun.totalNetSalary,
      description: `صرف مسير رواتب شهر ${newRun.monthYear} (${newRun.items.length} موظف)`,
      relatedSource: 'PAYROLL',
      referenceId: newRun.id,
      createdBy: newRun.approvedBy
    });
  }

  // 2. Auto Journal Entry
  const accounts = getAccounts();
  const salExpAcc = accounts.find(a => a.code === '5104') || { id: '5104', code: '5104', name: 'المرتبات والأجور' };
  const paymentAccCode = newRun.paymentMethod === 'BANK' ? '1102' : '1101';
  const paymentAcc = accounts.find(a => a.code === paymentAccCode) || {
    id: paymentAccCode,
    code: paymentAccCode,
    name: newRun.paymentMethod === 'BANK' ? 'الحسابات البنكية' : 'الصندوق / الخزينة الرئيسية'
  };

  const lines: JournalEntryLine[] = [
    {
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: salExpAcc.id,
      accountCode: salExpAcc.code,
      accountName: salExpAcc.name,
      debit: newRun.totalNetSalary,
      credit: 0,
      description: `إثبات مصروف مسير رواتب شهر ${newRun.monthYear}`
    },
    {
      id: 'jvl_' + Math.random().toString(36).substring(2, 7),
      accountId: paymentAcc.id,
      accountCode: paymentAcc.code,
      accountName: paymentAcc.name,
      debit: 0,
      credit: newRun.totalNetSalary,
      description: newRun.paymentMethod === 'BANK' ? `صرف الرواتب تحويل بنكي` : `صرف الرواتب نقداً من الخزينة`
    }
  ];

  addJournalEntry({
    date: new Date().toISOString().slice(0, 10),
    source: 'PAYROLL',
    referenceNo: newRun.runNo,
    description: `قيد تلقائي: اعتماد مسير رواتب شهر ${newRun.monthYear} بمبلغ ${newRun.totalNetSalary.toFixed(2)} ج.م`,
    lines,
    createdBy: newRun.approvedBy
  });

  runs.unshift(newRun);
  setStorage('payroll_runs', runs);

  addAuditLog({
    userId: 'active_user',
    userName: newRun.approvedBy,
    action: 'CREATE',
    module: 'الرواتب والأجور',
    details: `اعتماد وصرف مسير رواتب شهر ${newRun.monthYear} بقيمة صافية ${newRun.totalNetSalary.toFixed(2)} ج.م`
  });

  return newRun;
}

// ==================== PHASE 4: ADVANCED FINANCIAL REPORTS ====================

export function getIncomeStatement(startDate?: string, endDate?: string) {
  const journalEntries = getJournalEntries();

  const filteredEntries = journalEntries.filter(e => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  let salesRevenue = 0;      // 4101 (Credit - Debit)
  let cogs = 0;              // 5101 (Debit - Credit)
  let rentExpense = 0;       // 5102
  let utilExpense = 0;       // 5103
  let salariesExpense = 0;   // 5104
  let maintExpense = 0;      // 5105
  let generalExpense = 0;    // 5106
  let depExpense = 0;        // 5107

  filteredEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode;
      const netDebit = (line.debit || 0) - (line.credit || 0);
      const netCredit = (line.credit || 0) - (line.debit || 0);

      if (code === '4101') salesRevenue += netCredit;
      else if (code === '5101') cogs += netDebit;
      else if (code === '5102') rentExpense += netDebit;
      else if (code === '5103') utilExpense += netDebit;
      else if (code === '5104') salariesExpense += netDebit;
      else if (code === '5105') maintExpense += netDebit;
      else if (code === '5106') generalExpense += netDebit;
      else if (code === '5107') depExpense += netDebit;
    });
  });

  const grossProfit = salesRevenue - cogs;
  const totalOperatingExpenses = rentExpense + utilExpense + salariesExpense + maintExpense + generalExpense + depExpense;
  const netProfit = grossProfit - totalOperatingExpenses;

  return {
    salesRevenue: Math.round(salesRevenue * 100) / 100,
    cogs: Math.round(cogs * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    expenses: {
      rent: Math.round(rentExpense * 100) / 100,
      utilities: Math.round(utilExpense * 100) / 100,
      salaries: Math.round(salariesExpense * 100) / 100,
      maintenance: Math.round(maintExpense * 100) / 100,
      general: Math.round(generalExpense * 100) / 100,
      depreciation: Math.round(depExpense * 100) / 100
    },
    totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100
  };
}

export function getBalanceSheet() {
  const cashBalance = getTreasuryBalance();

  const bankAccounts = getBankAccounts();
  const bankBalancesTotal = bankAccounts.reduce((sum, b) => sum + getBankAccountBalance(b.id), 0);

  const stock = getStock();
  const products = getProducts();
  const inventoryValuation = stock.reduce((sum, stk) => {
    const prod = products.find(p => p.id === stk.productId);
    const cost = prod ? prod.purchasePrice : 0;
    return sum + (stk.quantity * cost);
  }, 0);

  const customers = getCustomers();
  const customersReceivable = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  const fixedAssets = getFixedAssets();
  const assetsCostTotal = fixedAssets.reduce((sum, a) => sum + a.purchaseCost, 0);
  const accumDepTotal = fixedAssets.reduce((sum, a) => sum + (a.accumDepreciation || 0), 0);
  const fixedAssetsNetValue = assetsCostTotal - accumDepTotal;

  const totalAssets = cashBalance + bankBalancesTotal + inventoryValuation + customersReceivable + fixedAssetsNetValue;

  const suppliers = getSuppliers();
  const suppliersPayable = suppliers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  const vatReport = getVatReport();
  const vatPayable = Math.max(0, vatReport.netVatPayable);

  const totalLiabilities = suppliersPayable + vatPayable;

  const capital = 50000;
  const incomeStatement = getIncomeStatement();
  const currentNetProfit = incomeStatement.netProfit;
  const totalEquity = capital + currentNetProfit;

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 500;

  return {
    assets: {
      cash: Math.round(cashBalance * 100) / 100,
      banks: Math.round(bankBalancesTotal * 100) / 100,
      inventory: Math.round(inventoryValuation * 100) / 100,
      receivables: Math.round(customersReceivable * 100) / 100,
      fixedAssetsCost: Math.round(assetsCostTotal * 100) / 100,
      accumDepreciation: Math.round(accumDepTotal * 100) / 100,
      fixedAssetsNet: Math.round(fixedAssetsNetValue * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100
    },
    liabilities: {
      suppliersPayable: Math.round(suppliersPayable * 100) / 100,
      vatPayable: Math.round(vatPayable * 100) / 100,
      totalLiabilities: Math.round(totalLiabilities * 100) / 100
    },
    equity: {
      capital: Math.round(capital * 100) / 100,
      retainedEarnings: Math.round(currentNetProfit * 100) / 100,
      totalEquity: Math.round(totalEquity * 100) / 100
    },
    totalLiabilitiesAndEquity: Math.round(totalLiabilitiesAndEquity * 100) / 100,
    isBalanced
  };
}

export function getSalesReport(startDate?: string, endDate?: string, branchId?: string, categoryId?: string) {
  const sales = getSales();
  const products = getProducts();

  const filteredSales = sales.filter(s => {
    const d = s.createdAt.slice(0, 10);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    if (branchId && branchId !== 'ALL' && s.branchId !== branchId) return false;
    return s.status === 'COMPLETED';
  });

  let totalGrand = 0;
  let totalNet = 0;
  let totalVat = 0;
  let totalItemsQty = 0;

  const productMap: Record<string, { productName: string; qty: number; totalRevenue: number }> = {};

  filteredSales.forEach(s => {
    totalGrand += s.grandTotal;
    totalNet += (s.subtotal - s.discount);
    totalVat += s.vatAmount;

    s.items?.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (categoryId && categoryId !== 'ALL' && prod?.categoryId !== categoryId) return;

      totalItemsQty += item.qty;
      if (!productMap[item.productId]) {
        productMap[item.productId] = { productName: item.productName, qty: 0, totalRevenue: 0 };
      }
      productMap[item.productId].qty += item.qty;
      productMap[item.productId].totalRevenue += item.total;
    });
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return {
    totalInvoices: filteredSales.length,
    totalGrand: Math.round(totalGrand * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    totalItemsQty,
    averageInvoiceValue: filteredSales.length > 0 ? Math.round((totalGrand / filteredSales.length) * 100) / 100 : 0,
    topProducts,
    salesList: filteredSales
  };
}

export function getInventoryReport(warehouseId?: string) {
  const stock = getStock();
  const products = getProducts();

  const filteredStock = stock.filter(stk => {
    if (warehouseId && warehouseId !== 'ALL' && stk.warehouseId !== warehouseId) return false;
    return true;
  });

  let totalValuationAtCost = 0;
  let totalValuationAtSell = 0;
  let totalQty = 0;

  const lowStockItems: Array<{ product: Product; currentQty: number }> = [];

  filteredStock.forEach(stk => {
    const prod = products.find(p => p.id === stk.productId);
    if (!prod) return;

    totalQty += stk.quantity;
    totalValuationAtCost += (stk.quantity * prod.purchasePrice);
    totalValuationAtSell += (stk.quantity * prod.salePrice);

    if (stk.quantity <= prod.minStock) {
      lowStockItems.push({ product: prod, currentQty: stk.quantity });
    }
  });

  return {
    totalProductsCount: products.length,
    totalQuantityInStock: totalQty,
    totalValuationAtCost: Math.round(totalValuationAtCost * 100) / 100,
    totalValuationAtSell: Math.round(totalValuationAtSell * 100) / 100,
    potentialProfit: Math.round((totalValuationAtSell - totalValuationAtCost) * 100) / 100,
    lowStockCount: lowStockItems.length,
    lowStockItems
  };
}
