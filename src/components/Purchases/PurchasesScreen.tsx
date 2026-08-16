import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Eye, CheckCircle2, AlertCircle, X, Trash2, Calendar, FileText } from 'lucide-react';
import { PurchaseInvoice, PurchaseItem, Supplier, Product, Branch, Warehouse } from '../../types';
import { 
  getPurchaseInvoices, addPurchaseInvoice, getSuppliers, getProducts, 
  getBranches, getWarehouses, subscribeToDB 
} from '../../db/dbEngine';

export const PurchasesScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);

  // New Invoice Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('br_main');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('wh_main');
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{
    productId: string;
    productName: string;
    unitName: string;
    qty: number;
    purchasePrice: number;
    total: number;
  }>>([]);

  // Product Selection helper inside Modal
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('0');

  const loadData = () => {
    setInvoices(getPurchaseInvoices());
    setSuppliers(getSuppliers());
    setProducts(getProducts());
    setBranches(getBranches());
    setWarehouses(getWarehouses());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDB(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenCreateModal = () => {
    if (suppliers.length > 0) {
      setSelectedSupplierId(suppliers[0].id);
    }
    if (branches.length > 0) setSelectedBranchId(branches[0].id);
    if (warehouses.length > 0) setSelectedWarehouseId(warehouses[0].id);
    setIsPaid(true);
    setNotes('');
    setItems([]);
    setSelectedProductId('');
    setItemQty('1');
    setItemPrice('0');
    setShowCreateModal(true);
  };

  const handleSelectProductToForm = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setItemPrice(prod.purchasePrice ? prod.purchasePrice.toString() : ((prod.salePrice || 0) * 0.8).toFixed(2));
    }
  };

  const handleAddItemToInvoice = () => {
    if (!selectedProductId) {
      alert('يرجى اختيار المنتج أولاً');
      return;
    }
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseFloat(itemQty) || 1;
    const price = parseFloat(itemPrice) || 0;
    if (qty <= 0) {
      alert('الكمية يجب أن تكون أكبر من صفر');
      return;
    }

    // Check if already in list
    const existingIndex = items.findIndex(i => i.productId === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].qty += qty;
      updated[existingIndex].purchasePrice = price;
      updated[existingIndex].total = updated[existingIndex].qty * price;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          unitName: prod.baseUnit || 'قطعة',
          qty,
          purchasePrice: price,
          total: qty * price
        }
      ]);
    }

    // Reset item selector
    setSelectedProductId('');
    setItemQty('1');
    setItemPrice('0');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('يرجى اختيار المورد');
      return;
    }
    if (items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل لفاتورة الشراء');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    const purchaseItems: PurchaseItem[] = items.map((item, idx) => ({
      id: `pi_${Date.now()}_${idx}`,
      purchaseId: '',
      productId: item.productId,
      productName: item.productName,
      unitName: item.unitName,
      qty: item.qty,
      purchasePrice: item.purchasePrice,
      total: item.total
    }));

    addPurchaseInvoice({
      supplierId: selectedSupplierId,
      supplierName: supplier ? supplier.name : 'مورد غير معروف',
      branchId: selectedBranchId,
      warehouseId: selectedWarehouseId,
      totalAmount: grandTotal,
      isPaid,
      notes,
      createdBy: 'أحمد محمود (المدير)',
      items: purchaseItems
    });

    setShowCreateModal(false);
    loadData();
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPurchaseValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto space-y-4 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">إدارة المشتريات وفواتير التوريد</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">تسجيل فواتير الشراء، زيادة كميات المخزون تلقائياً وتسوية حسابات الموردين</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>فاتورة شراء جديدة</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">عدد فواتير الشراء</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{invoices.length}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي قيمة فواتير الشراء</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalPurchaseValue.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم فاتورة الشراء أو اسم المورد..."
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Purchases Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">اسم المورد</th>
                <th className="p-3">طريقة السداد</th>
                <th className="p-3">إجمالي الفاتورة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المُدخل</th>
                <th className="p-3 text-center">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    لا توجد فواتير شراء مسجلة
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">{inv.invoiceNo}</td>
                    <td className="p-3 font-semibold">{inv.supplierName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.isPaid 
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {inv.isPaid ? 'نقدي (كاش)' : 'آجل (حساب المورد)'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{inv.totalAmount.toLocaleString()} ج.م</td>
                    <td className="p-3 text-slate-500 dir-ltr text-right font-mono">
                      {new Date(inv.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-3 text-slate-500">{inv.createdBy}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setViewingInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        title="تفاصيل الفاتورة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>تسجيل فاتورة شراء جديدة (إدخال شحنة توريد)</span>
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Top Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">المورد *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name} ({sup.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">المخزن المستلم</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={e => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">طريقة الدفع</label>
                  <select
                    value={isPaid ? 'true' : 'false'}
                    onChange={e => setIsPaid(e.target.value === 'true')}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold"
                  >
                    <option value="true">نقدي (خصم فوراً من الخزينة)</option>
                    <option value="false">آجل (إضافة لحساب ديون المورد)</option>
                  </select>
                </div>
              </div>

              {/* Add Item Row Picker */}
              <div className="border border-slate-200 dark:border-slate-700 p-3 rounded-xl space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">إضافة منتج للفاتورة:</p>
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-[10px] text-slate-500 mb-1">اختر المنتج</label>
                    <select
                      value={selectedProductId}
                      onChange={e => handleSelectProductToForm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="">-- اختار منتج --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.barcodes?.[0] || p.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-slate-500 mb-1">الكمية المشتراة</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={e => setItemQty(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[10px] text-slate-500 mb-1">سعر الشراء (للوحدة)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={itemPrice}
                      onChange={e => setItemPrice(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItemToInvoice}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xs"
                      title="إضافة"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table in Invoice */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900/60 font-bold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-2">المنتج</th>
                      <th className="p-2">الكمية</th>
                      <th className="p-2">سعر الشراء</th>
                      <th className="p-2">الإجمالي</th>
                      <th className="p-2 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-400">
                          لم يتم إضافة منتجات للفاتورة بعد
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-800 dark:text-slate-100">{it.productName}</td>
                          <td className="p-2 font-mono">{it.qty} {it.unitName}</td>
                          <td className="p-2 font-mono">{it.purchasePrice.toFixed(2)} ج.م</td>
                          <td className="p-2 font-mono font-bold text-emerald-600">{it.total.toFixed(2)} ج.م</td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Invoice Footer Total & Notes */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="w-full sm:w-1/2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات الفاتورة</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="رقم بيان الشحن، أو أي ملاحظات..."
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="text-left font-black">
                  <span className="text-xs text-slate-500 block">إجمالي الفاتورة النهائي:</span>
                  <span className="text-xl text-emerald-700 dark:text-emerald-400">{grandTotal.toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  حفظ واعتتماد الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Invoice Details Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-800 dark:text-slate-100">فاتورة شراء #{viewingInvoice.invoiceNo}</h3>
                <p className="text-xs text-slate-500">المورد: {viewingInvoice.supplierName}</p>
              </div>
              <button onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                <div><span className="text-slate-400">طريقة الدفع:</span> <strong>{viewingInvoice.isPaid ? 'نقدي' : 'آجل'}</strong></div>
                <div><span className="text-slate-400">التاريخ:</span> <strong className="font-mono">{new Date(viewingInvoice.createdAt).toLocaleString('ar-EG')}</strong></div>
                <div><span className="text-slate-400">بواسطة:</span> <strong>{viewingInvoice.createdBy}</strong></div>
                <div><span className="text-slate-400">الإجمالي:</span> <strong className="text-emerald-600 font-mono">{viewingInvoice.totalAmount.toLocaleString()} ج.م</strong></div>
              </div>

              <p className="font-bold text-slate-700 dark:text-slate-300 mt-2">بنود الشحنة:</p>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 font-bold text-slate-600">
                    <tr>
                      <th className="p-2">الصنف</th>
                      <th className="p-2">الكمية</th>
                      <th className="p-2">سعر الشراء</th>
                      <th className="p-2">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {viewingInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 font-bold">{item.productName}</td>
                        <td className="p-2 font-mono">{item.qty} {item.unitName}</td>
                        <td className="p-2 font-mono">{item.purchasePrice.toFixed(2)} ج.م</td>
                        <td className="p-2 font-mono font-bold text-emerald-600">{item.total.toFixed(2)} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
