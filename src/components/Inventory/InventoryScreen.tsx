import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Edit3, Trash2, ArrowUpDown, AlertTriangle, 
  Barcode, Warehouse, Save, X, Image as ImageIcon, Layers, RefreshCw
} from 'lucide-react';
import { Product, Category, Unit, StockItem, Warehouse as WarehouseType } from '../../types';
import { 
  getProducts, getCategories, getUnits, getStock, getWarehouses, 
  saveProduct, updateStock, getProductStockInWarehouse, getSettings
} from '../../db/dbEngine';
import { useAuth } from '../../context/AuthContext';

export const InventoryScreen: React.FC = () => {
  const { user } = useAuth();
  const settings = getSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: 'cat_grocery',
    baseUnit: 'قطعة',
    barcodesStr: '',
    purchasePrice: 0,
    salePrice: 0,
    minStock: 10,
    image: '',
    initialStock: 50
  });

  // Adjustment Modal
  const [showStockAdjustModal, setShowStockAdjustModal] = useState<boolean>(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState<string>('توريد بضائع جديدة من المورد');

  const loadAll = () => {
    setProducts(getProducts());
    setCategories(getCategories());
    setUnits(getUnits());
    const whs = getWarehouses();
    setWarehouses(whs);
    if (whs.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(whs[0].id);
    }
    setStock(getStock());
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      code: `PRD-${Date.now().toString().slice(-4)}`,
      name: '',
      categoryId: categories[1]?.id || 'cat_grocery',
      baseUnit: units[0]?.name || 'قطعة',
      barcodesStr: `628100${Math.floor(1000000 + Math.random() * 9000000)}`,
      purchasePrice: 10,
      salePrice: 15,
      minStock: 10,
      image: '',
      initialStock: 50
    });
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      categoryId: p.categoryId,
      baseUnit: p.baseUnit,
      barcodesStr: p.barcodes.join(', '),
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      minStock: p.minStock,
      image: p.image || '',
      initialStock: 0
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم الصنف');
      return;
    }

    const barcodes = formData.barcodesStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newProd: Product = {
      id: editingProduct ? editingProduct.id : 'prod_' + Date.now(),
      code: formData.code.trim(),
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      baseUnit: formData.baseUnit,
      barcodes: barcodes.length > 0 ? barcodes : [formData.code],
      purchasePrice: Number(formData.purchasePrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      minStock: Number(formData.minStock) || 0,
      image: formData.image.trim() || undefined,
      active: true
    };

    saveProduct(newProd);

    // Initial stock setup if new product
    if (!editingProduct && formData.initialStock > 0) {
      const targetWh = selectedWarehouseId || warehouses[0]?.id || 'wh_main';
      updateStock(newProd.id, targetWh, formData.initialStock, 'INITIAL_SEED', user ? user.name : 'مدير النظام');
    }

    setShowProductModal(false);
    loadAll();
  };

  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;

    const delta = adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    updateStock(adjustProduct.id, selectedWarehouseId, delta, 'MANUAL_ADJUSTMENT', user ? user.name : 'أمين مخزن');

    setShowStockAdjustModal(false);
    loadAll();
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategoryId === 'cat_all' || p.categoryId === selectedCategoryId;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcodes.some(b => b.toLowerCase().includes(q));
    
    const whQty = getProductStockInWarehouse(p.id, selectedWarehouseId);
    const matchesLowStock = !showLowStockOnly || whQty <= p.minStock;

    return matchesCat && matchesSearch && matchesLowStock;
  });

  return (
    <div className="p-3 sm:p-4 pb-28 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-[calc(100vh-62px)] select-none transition-colors">
      
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-800 dark:text-slate-100">إدارة المنتجات والمخزون</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400">تابع أسعار الشراء والبيع وحد إعادة الطلب بكل مخزن</p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة صنف جديد</span>
        </button>
      </div>

      {/* Filters & Warehouses Selector */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الصنف، الكود، أو الباركود..."
            className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Warehouse Selector */}
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-slate-400" />
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {warehouses.map(w => (
              <option key={w.id} value={w.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{w.name}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {categories.map(c => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-700/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => setShowLowStockOnly(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          />
          <span>عرض المنخفض بالمخزن فقط</span>
        </label>

      </div>

      {/* Products Table with Vertical & Horizontal Scroll */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col mb-16">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-260px)] min-h-[380px] pb-16">
          <table className="w-full text-right text-xs relative border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-600 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="p-3 text-center w-12 bg-slate-100 dark:bg-slate-700">الصورة</th>
                <th className="p-3 bg-slate-100 dark:bg-slate-700">كود الصنف</th>
                <th className="p-3 bg-slate-100 dark:bg-slate-700">اسم الصنف</th>
                <th className="p-3 bg-slate-100 dark:bg-slate-700">التصنيف</th>
                <th className="p-3 bg-slate-100 dark:bg-slate-700">الباركودات</th>
                <th className="p-3 text-left bg-slate-100 dark:bg-slate-700">سعر الشراء</th>
                <th className="p-3 text-left bg-slate-100 dark:bg-slate-700">سعر البيع</th>
                <th className="p-3 text-center bg-slate-100 dark:bg-slate-700">الرصيد الحرج</th>
                <th className="p-3 text-center bg-slate-100 dark:bg-slate-700">الرصيد بالمخزن</th>
                <th className="p-3 text-center w-28 bg-slate-100 dark:bg-slate-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {filteredProducts.map((p) => {
                const whQty = getProductStockInWarehouse(p.id, selectedWarehouseId);
                const categoryObj = categories.find(c => c.id === p.categoryId);
                const isLow = whQty <= p.minStock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="p-2 text-center">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden mx-auto border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-500 dark:text-slate-400">{p.code}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{categoryObj?.name || 'بقالة'}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">{p.barcodes.join(', ')}</td>
                    <td className="p-3 text-left font-mono font-bold text-slate-600 dark:text-slate-300">{p.purchasePrice.toFixed(2)} ج.م</td>
                    <td className="p-3 text-left font-mono font-black text-emerald-700 dark:text-emerald-400">{p.salePrice.toFixed(2)} ج.م</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{p.minStock} {p.baseUnit}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                        isLow ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {whQty} {p.baseUnit}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setAdjustProduct(p);
                            setShowStockAdjustModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 transition cursor-pointer"
                          title="تعديل المخزون"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 transition cursor-pointer"
                          title="تعديل الصنف"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl relative">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-800">
                {editingProduct ? 'تعديل بيانات صنف' : 'إضافة صنف جديد'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود الصنف</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {categories.filter(c => c.id !== 'cat_all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الصنف بالكامل</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أرز فاخر 1 كجم"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">أرقام الباركود (مفصولة بفواصل ,)</label>
                <input
                  type="text"
                  value={formData.barcodesStr}
                  onChange={(e) => setFormData({ ...formData, barcodesStr: e.target.value })}
                  placeholder="6281001234567, 100123"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوحدة الأساسية</label>
                  <select
                    value={formData.baseUnit}
                    onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر الشراء</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر البيع</label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-black text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حد المخزون الحرج</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الرصيد الافتتاحي بالمخزن</label>
                    <input
                      type="number"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({ ...formData, initialStock: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg font-mono font-bold text-emerald-800"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رابط صورة المنتج (Unsplash URL)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-600 text-[11px]"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                >
                  حفظ الصنف
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockAdjustModal && adjustProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-3">
              تعديل رصيد: {adjustProduct.name}
            </h3>

            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">نوع الحركة</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as 'IN' | 'OUT')}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="IN">إضافة للمخزن (+ توريد)</option>
                  <option value="OUT">خصم من المخزن (- تسوية / هالك)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">الكمية المعدلة</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 rounded-lg font-bold font-mono text-center text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">السبب / الملاحظات</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs"
                >
                  حفظ التعديل
                </button>
                <button
                  type="button"
                  onClick={() => setShowStockAdjustModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
