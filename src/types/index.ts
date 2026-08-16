export type RolePermissionKey = 
  | 'dashboard' 
  | 'pos' 
  | 'inventory' 
  | 'branches' 
  | 'users' 
  | 'settings'
  | 'ledger'
  | 'taxes';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  print: boolean;
  discount: boolean;
  changePrice: boolean;
}

export type RolePermissions = Record<RolePermissionKey, ModulePermissions>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
}

export interface User {
  id: string;
  username: string;
  name: string;
  roleId: string;
  branchId: string;
  active: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  phone: string;
  address: string;
  taxNumber: string;
  commercialReg: string;
  isDefault: boolean;
}

export interface Warehouse {
  id: string;
  branchId: string;
  code: string;
  name: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  icon?: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  baseUnit: string;
  barcodes: string[];
  purchasePrice: number;
  salePrice: number;
  minStock: number;
  image?: string;
  active: boolean;
}

export interface StockItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'SALE' | 'RETURN';

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  reference: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type SaleStatus = 'COMPLETED' | 'DRAFT' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  barcode: string;
  productName: string;
  unitName: string;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  branchId: string;
  warehouseId: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  status: SaleStatus;
  createdBy: string;
  createdAt: string;
  items?: SaleItem[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SALE' | 'PRINT';
  module: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  storeName: string;
  companyName: string;
  logoUrl: string;
  phone: string;
  address: string;
  taxNumber: string;
  commercialReg: string;
  vatRate: number;
  enableVat: boolean;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address?: string;
  creditLimit: number;
  balance: number; // positive = owes us (debt), negative = advance
  createdAt?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // positive = amount due to supplier
  createdAt?: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  unitName: string;
  qty: number;
  purchasePrice: number;
  total: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  warehouseId: string;
  totalAmount: number;
  isPaid: boolean;
  paymentMethod?: 'CASH' | 'BANK';
  bankAccountId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  items: PurchaseItem[];
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  notes?: string;
  branchId: string;
  paymentMethod?: 'CASH' | 'BANK';
  bankAccountId?: string;
  createdBy: string;
  createdAt: string;
}

export type TreasurySourceType = 'SALE' | 'PURCHASE' | 'EXPENSE' | 'MANUAL';

export interface TreasuryTransaction {
  id: string;
  type: 'IN' | 'OUT';
  amount: number;
  source: TreasurySourceType;
  referenceId?: string;
  description: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban?: string;
  balance: number;
  updatedAt: string;
}

export type BankTxType = 'DEPOSIT' | 'WITHDRAWAL';

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  type: BankTxType;
  amount: number;
  description: string;
  relatedSource?: 'TREASURY' | 'PURCHASE' | 'EXPENSE' | 'PAYROLL' | 'MANUAL';
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  jobTitle: string;
  branchId: string;
  baseSalary: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface PayrollItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  baseSalary: number;
  bonus: number;
  deduction: number;
  netSalary: number;
}

export interface PayrollRun {
  id: string;
  runNo: string;
  monthYear: string; // YYYY-MM
  branchId?: string;
  totalBaseSalary: number;
  totalBonus: number;
  totalDeduction: number;
  totalNetSalary: number;
  paymentMethod: 'CASH' | 'BANK';
  bankAccountId?: string;
  status: 'APPROVED' | 'DRAFT';
  approvedBy: string;
  createdAt: string;
  items: PayrollItem[];
}

// ==================== PHASE 3 ACCOUNTING & FIXED ASSETS TYPES ====================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;        // Account code as ID, e.g., '1101'
  code: string;      // e.g., '1101'
  name: string;      // e.g., 'الصندوق / الخزينة الرئيسية'
  type: AccountType;
  parentId?: string; // e.g., '1100'
  isHeader?: boolean; // True if it's a header section
  isSystem?: boolean; // Cannot be deleted
  balance?: number;
  description?: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;   // مدين
  credit: number;  // دائن
  description?: string;
}

export type JournalSourceType = 'SALE' | 'PURCHASE' | 'EXPENSE' | 'TREASURY' | 'BANK_TRANSFER' | 'PAYROLL' | 'DEPRECIATION' | 'MANUAL';

export interface JournalEntry {
  id: string;
  entryNo: string;      // e.g. 'JV-2508-001'
  date: string;         // YYYY-MM-DD
  source: JournalSourceType;
  referenceNo?: string; // Invoice number, expense ID, etc.
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  createdAt: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category?: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLifeYears: number;
  accountId?: string;          // Asset Account Code, e.g. '1201'
  accumDepAccountId?: string;  // Accumulated Dep. Code, e.g. '1202'
  branchId?: string;
  accumDepreciation: number;  // Calculated or stored accumulated depreciation
  netBookValue?: number;
  status?: 'ACTIVE' | 'DISPOSED';
  createdAt?: string;
}

export interface DepreciationRecord {
  id: string;
  assetId: string;
  assetName: string;
  date: string;
  amount: number;
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
}

