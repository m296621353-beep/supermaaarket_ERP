import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Barcode, Trash2, Plus, Minus, Printer, Save, CheckCircle, 
  RotateCcw, UserPlus, Grid, Tag, Layers, RefreshCw, Archive, DollarSign, X,
  Keyboard, Maximize, Sparkles
} from 'lucide-react';
import { Product, Category, Customer, Sale, SaleItem } from '../../types';
import { 
  getProducts, getCategories, getCustomers, saveCustomer, getProductStockInWarehouse, 
  getProductByBarcode, completeSale, saveHeldSale, getHeldSales, removeHeldSale, getSettings, getSales
} from '../../db/dbEngine';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ReceiptPrintModal } from '../ReceiptPrintModal';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';

export const POSScreen: React.FC = () => {
  const { activeBranch, activeWarehouse, user, hasPermission } = useAuth();
  const { toggleFullscreen } = useTheme();
  const settings = getSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [topBarcodeQuery, setTopBarcodeQuery] = useState<string>('');

  // Cart State
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('cust_cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [enableVat, setEnableVat] = useState<boolean>(settings.enableVat);

  // Mobile View Tab State ('products' | 'cart' | 'payment')
  const [mobileTab, setMobileTab] = useState<'products' | 'cart' | 'payment'>('products');

  // Modals & Feedback
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [showHeldSalesModal, setShowHeldSalesModal] = useState<boolean>(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [completedSaleForReceipt, setCompletedSaleForReceipt] = useState<Sale | null>(null);
  const [drawerOpenMessage, setDrawerOpenMessage] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Helper to show inline toast
  const showToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Refs for focusing inputs
  const topBarcodeRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);

  // Synchronized state refs to eliminate stale closure bugs in keyboard handlers
  const cartItemsRef = useRef(cartItems);
  const paidAmountInputValRef = useRef(paidAmountInput);
  const discountPercentRef = useRef(discountPercent);
  const selectedCustomerRef = useRef(selectedCustomer);
  const paymentMethodRef = useRef(paymentMethod);
  const enableVatRef = useRef(enableVat);
  const completedSaleRef = useRef(completedSaleForReceipt);
  const customersRef = useRef(customers);
  const activeBranchRef = useRef(activeBranch);
  const activeWarehouseRef = useRef(activeWarehouse);
  const userRef = useRef(user);
  const showDiscountModalRef = useRef(showDiscountModal);
  const showHeldSalesModalRef = useRef(showHeldSalesModal);
  const showNewCustomerModalRef = useRef(showNewCustomerModal);
  const showShortcutsModalRef = useRef(showShortcutsModal);

  useEffect(() => {
    cartItemsRef.current = cartItems;
    paidAmountInputValRef.current = paidAmountInput;
    discountPercentRef.current = discountPercent;
    selectedCustomerRef.current = selectedCustomer;
    paymentMethodRef.current = paymentMethod;
    enableVatRef.current = enableVat;
    completedSaleRef.current = completedSaleForReceipt;
    customersRef.current = customers;
    activeBranchRef.current = activeBranch;
    activeWarehouseRef.current = activeWarehouse;
    userRef.current = user;
    showDiscountModalRef.current = showDiscountModal;
    showHeldSalesModalRef.current = showHeldSalesModal;
    showNewCustomerModalRef.current = showNewCustomerModal;
    showShortcutsModalRef.current = showShortcutsModal;
  });

  const loadData = () => {
    setProducts(getProducts().filter(p => p.active));
    setCategories(getCategories());
    setCustomers(getCustomers());
  };

  useEffect(() => {
    loadData();
    // Auto focus top barcode scanner input on mount
    topBarcodeRef.current?.focus();
  }, []);

  // Handle barcode scanner fast entry
  const handleTopBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topBarcodeQuery.trim()) return;

    const matchedProduct = getProductByBarcode(topBarcodeQuery.trim());
    if (matchedProduct) {
      addToCart(matchedProduct);
      setTopBarcodeQuery('');
    } else {
      // Search by partial match if exact barcode not found
      const matchedByName = products.find(p => p.name.includes(topBarcodeQuery.trim()) || p.code === topBarcodeQuery.trim());
      if (matchedByName) {
        addToCart(matchedByName);
        setTopBarcodeQuery('');
      } else {
        alert(`لم يتم العثور على صنف بالباركود أو الكود: ${topBarcodeQuery}`);
      }
    }
    topBarcodeRef.current?.focus();
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIndex].qty + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: newQty,
          total: (newQty * updated[existingIndex].unitPrice) - updated[existingIndex].discount
        };
        return updated;
      } else {
        const newItem: SaleItem = {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          saleId: '',
          productId: product.id,
          barcode: product.barcodes[0] || product.code,
          productName: product.name,
          unitName: product.baseUnit,
          qty: 1,
          unitPrice: product.salePrice,
          discount: 0,
          total: product.salePrice
        };
        return [...prev, newItem];
      }
    });
  };

  // Update Item Quantity
  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(index);
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        qty: newQty,
        total: (newQty * updated[index].unitPrice) - updated[index].discount
      };
      return updated;
    });
  };

  // Remove Item
  const removeItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  // Clear Cart
  const handleClearCart = () => {
    if (cartItemsRef.current.length === 0) {
      showToast('السلة فارغة بالفعل', 'info');
      return;
    }
    setCartItems([]);
    setDiscountPercent(0);
    setPaidAmountInput('');
    showToast('تم تفريغ السلة بنجاح', 'info');
  };

  // Totals Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const vatRate = enableVat ? settings.vatRate : 0;
  const vatAmount = (netSubtotal * vatRate) / 100;
  const grandTotal = netSubtotal + vatAmount;

  const paidVal = paidAmountInput === '' ? grandTotal : parseFloat(paidAmountInput) || 0;
  const changeVal = Math.max(0, paidVal - grandTotal);

  // Complete Sale Logic (F2, Ctrl+Enter, or NumPad +)
  const handleCompleteSale = () => {
    const currentCart = cartItemsRef.current.length > 0 ? cartItemsRef.current : cartItems;
    if (!currentCart || currentCart.length === 0) {
      showToast('السلة فارغة! يرجى إضافة أصناف أولاً قبل إتمام البيع والدفع.', 'error');
      topBarcodeRef.current?.focus();
      return;
    }

    const currentSubtotal = currentCart.reduce((acc, item) => acc + item.total, 0);
    const currentDiscountPercent = discountPercentRef.current ?? discountPercent;
    const currentDiscountAmount = (currentSubtotal * currentDiscountPercent) / 100;
    const currentNetSubtotal = Math.max(0, currentSubtotal - currentDiscountAmount);
    const currentVatRate = (enableVatRef.current ?? enableVat) ? settings.vatRate : 0;
    const currentVatAmount = (currentNetSubtotal * currentVatRate) / 100;
    const currentGrandTotal = currentNetSubtotal + currentVatAmount;

    const currentPaidRaw = paidAmountInputValRef.current !== undefined ? paidAmountInputValRef.current : paidAmountInput;
    const currentPaidVal = currentPaidRaw === '' 
      ? currentGrandTotal 
      : parseFloat(currentPaidRaw) || 0;
    const currentChangeVal = Math.max(0, currentPaidVal - currentGrandTotal);

    const currentCustId = selectedCustomerRef.current || selectedCustomer;
    const customerObj = (customersRef.current || customers).find(c => c.id === currentCustId);
    const currentPayMethod = paymentMethodRef.current || paymentMethod || 'CASH';

    try {
      const sale = completeSale({
        branchId: activeBranchRef.current?.id || activeBranch?.id || 'br_main',
        warehouseId: activeWarehouseRef.current?.id || activeWarehouse?.id || 'wh_main',
        customerName: customerObj?.name || 'عميل نقدي',
        customerPhone: customerObj?.phone || '',
        paymentMethod: currentPayMethod,
        subtotal: currentSubtotal,
        discount: currentDiscountAmount,
        vatRate: currentVatRate,
        vatAmount: currentVatAmount,
        grandTotal: currentGrandTotal,
        paidAmount: currentPaidVal,
        changeAmount: currentChangeVal,
        status: 'COMPLETED',
        createdBy: userRef.current?.name || user?.name || 'كاشير',
        items: currentCart
      });

      setCompletedSaleForReceipt(sale);
      setCartItems([]);
      setDiscountPercent(0);
      setPaidAmountInput('');
      loadData(); // Refresh stock in memory
      showToast(`تم إتمام الفاتورة (${sale.invoiceNo}) بنجاح!`, 'success');
    } catch (err: any) {
      console.error('Sale error:', err);
      showToast('حدث خطأ أثناء حفظ الفاتورة: ' + (err?.message || 'يرجى المحاولة مجدداً'), 'error');
    }
  };

  // Hold Sale Logic (F6 or Alt+H)
  const handleHoldSale = () => {
    const currentCart = cartItemsRef.current.length > 0 ? cartItemsRef.current : cartItems;
    if (!currentCart || currentCart.length === 0) {
      showToast('لا توجد أصناف في السلة لحفظها كمسودة!', 'error');
      return;
    }

    const currentSubtotal = currentCart.reduce((acc, item) => acc + item.total, 0);
    const currentDiscountPercent = discountPercentRef.current ?? discountPercent;
    const currentDiscountAmount = (currentSubtotal * currentDiscountPercent) / 100;
    const currentNetSubtotal = Math.max(0, currentSubtotal - currentDiscountAmount);
    const currentVatRate = (enableVatRef.current ?? enableVat) ? settings.vatRate : 0;
    const currentVatAmount = (currentNetSubtotal * currentVatRate) / 100;
    const currentGrandTotal = currentNetSubtotal + currentVatAmount;

    const draftSale: Sale = {
      id: 'draft_' + Date.now(),
      invoiceNo: `DRAFT-${Date.now().toString().slice(-4)}`,
      branchId: activeBranchRef.current?.id || activeBranch?.id || 'br_main',
      warehouseId: activeWarehouseRef.current?.id || activeWarehouse?.id || 'wh_main',
      customerName: (customersRef.current || customers).find(c => c.id === (selectedCustomerRef.current || selectedCustomer))?.name || 'عميل نقدي',
      paymentMethod: paymentMethodRef.current || paymentMethod || 'CASH',
      subtotal: currentSubtotal,
      discount: currentDiscountAmount,
      vatRate: currentVatRate,
      vatAmount: currentVatAmount,
      grandTotal: currentGrandTotal,
      paidAmount: 0,
      changeAmount: 0,
      status: 'DRAFT',
      createdBy: userRef.current?.name || user?.name || 'كاشير',
      createdAt: new Date().toISOString(),
      items: currentCart
    };

    saveHeldSale(draftSale);
    setCartItems([]);
    setDiscountPercent(0);
    setPaidAmountInput('');
    showToast('تم حفظ الفاتورة كمسودة معلقة بنجاح (F6)', 'success');
  };

  // Trigger Open Cash Drawer (F8 or Alt+D)
  const handleOpenCashDrawer = () => {
    setDrawerOpenMessage(true);
    showToast('تم إرسال إشارة فتح درج النقدية!', 'success');
    setTimeout(() => setDrawerOpenMessage(false), 3000);
  };

  // Restore Held Sale
  const handleRestoreHeldSale = (held: Sale) => {
    if (held.items) {
      setCartItems(held.items);
      removeHeldSale(held.id);
      setShowHeldSalesModal(false);
      showToast(`تم استرجاع المسودة ${held.invoiceNo} بنجاح`, 'success');
    }
  };

  // Trigger Print Receipt (Alt+P or Ctrl+P or button)
  const handlePrintReceiptAction = () => {
    if (completedSaleRef.current) {
      window.print();
    } else if (cartItemsRef.current.length > 0) {
      handleCompleteSale();
    } else {
      const sales = getSales();
      if (sales.length > 0) {
        setCompletedSaleForReceipt(sales[0]);
        showToast(`تم فتح معاينة آخر فاتورة (${sales[0].invoiceNo}) للطباعة`, 'info');
      } else {
        showToast('لا توجد فواتير مبيعات سابقة لطباعتها', 'info');
      }
    }
  };

  // Dedicated & Conflict-Free Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Help Guide Modal (F1 or Shift+?)
      if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
        e.preventDefault();
        e.stopPropagation();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // 2. Escape: Close any open modal or reset focus to barcode input
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (showShortcutsModalRef.current) setShowShortcutsModal(false);
        else if (showDiscountModalRef.current) setShowDiscountModal(false);
        else if (showHeldSalesModalRef.current) setShowHeldSalesModal(false);
        else if (showNewCustomerModalRef.current) setShowNewCustomerModal(false);
        else if (completedSaleRef.current) setCompletedSaleForReceipt(null);
        else {
          topBarcodeRef.current?.focus();
          topBarcodeRef.current?.select();
        }
        return;
      }

      // 3. Complete Sale / Quick Pay (F2 or code F2, Ctrl+Enter, or NumPad +)
      if (
        e.key === 'F2' || 
        e.code === 'F2' || 
        (e.ctrlKey && e.key === 'Enter') || 
        e.code === 'NumpadAdd'
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleCompleteSale();
        return;
      }

      // 4. Focus Barcode Scanner (F3 or Alt+B / Alt+لا)
      if (e.key === 'F3' || e.code === 'F3' || (e.altKey && (e.key === 'b' || e.key === 'B' || e.key === 'لا'))) {
        e.preventDefault();
        e.stopPropagation();
        topBarcodeRef.current?.focus();
        topBarcodeRef.current?.select();
        return;
      }

      // 5. Focus Product Search (F4 or Alt+S / Alt+س)
      if (e.key === 'F4' || e.code === 'F4' || (e.altKey && (e.key === 's' || e.key === 'S' || e.key === 'س'))) {
        e.preventDefault();
        e.stopPropagation();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // 6. Hold Current Sale (F6 or Alt+H / Alt+ا)
      if (e.key === 'F6' || e.code === 'F6' || (e.altKey && (e.key === 'h' || e.key === 'H' || e.key === 'ا'))) {
        e.preventDefault();
        e.stopPropagation();
        handleHoldSale();
        return;
      }

      // 7. Recall Held Sales Modal (F7 or Alt+R / Alt+ق)
      if (e.key === 'F7' || e.code === 'F7' || (e.altKey && (e.key === 'r' || e.key === 'R' || e.key === 'ق'))) {
        e.preventDefault();
        e.stopPropagation();
        setShowHeldSalesModal(true);
        return;
      }

      // 8. Open Cash Drawer (F8)
      if (e.key === 'F8' || e.code === 'F8') {
        e.preventDefault();
        e.stopPropagation();
        handleOpenCashDrawer();
        return;
      }

      // 9. Quick Add Customer (F9 or Alt+C / Alt+ؤ)
      if (e.key === 'F9' || e.code === 'F9' || (e.altKey && (e.key === 'c' || e.key === 'C' || e.key === 'ؤ'))) {
        e.preventDefault();
        e.stopPropagation();
        setShowNewCustomerModal(true);
        return;
      }

      // 10. Discount Percentage Modal (F10 or Alt+K / Alt+ن)
      if (e.key === 'F10' || e.code === 'F10' || (e.altKey && (e.key === 'k' || e.key === 'K' || e.key === 'ن'))) {
        e.preventDefault();
        e.stopPropagation();
        setShowDiscountModal(true);
        return;
      }

      // 11. Fullscreen Toggle (F11 or Alt+Enter)
      if (e.key === 'F11' || e.code === 'F11' || (e.altKey && e.key === 'Enter')) {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen();
        return;
      }

      // 12. Print Receipt (Alt+P or Ctrl+P)
      if ((e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'ح')) || (e.ctrlKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        e.stopPropagation();
        handlePrintReceiptAction();
        return;
      }

      // 13. Clear Cart (Alt+X)
      if (e.altKey && (e.key === 'x' || e.key === 'X' || e.key === 'ء')) {
        e.preventDefault();
        e.stopPropagation();
        handleClearCart();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Filtered Products List
  const filteredProducts = products.filter(product => {
    const matchesCat = selectedCategory === 'cat_all' || product.categoryId === selectedCategory;
    const q = (topBarcodeQuery || searchQuery).trim().toLowerCase();
    const matchesSearch = !q || 
      product.name.toLowerCase().includes(q) || 
      product.code.toLowerCase().includes(q) ||
      product.barcodes.some(b => b.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-58px)] sm:h-[calc(100vh-62px)] bg-[#f5f7fa] dark:bg-slate-900 overflow-hidden select-none transition-colors">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <div className={`px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-black backdrop-blur-md ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/30'
              : toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/30'
              : 'bg-slate-800 text-white border-slate-700 shadow-slate-900/30'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. Top Barcode Scanner Full-Width Header Bar */}
      <div className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
        <form onSubmit={handleTopBarcodeSubmit} className="relative w-full flex items-center">
          <Barcode className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 absolute right-3 pointer-events-none" />
          <input
            ref={topBarcodeRef}
            type="text"
            value={topBarcodeQuery}
            onChange={(e) => setTopBarcodeQuery(e.target.value)}
            placeholder="امسح الباركود أو اكتب الكود ثم اضغط Enter (F3)"
            className="w-full pl-16 pr-11 sm:pr-12 py-2 sm:py-2.5 bg-white dark:bg-slate-700/60 border-2 border-slate-300 dark:border-slate-600 focus:border-emerald-600 dark:focus:border-emerald-500 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm tracking-wide shadow-2xs focus:outline-none placeholder-slate-400 dark:placeholder-slate-400"
          />
          <span className="absolute left-2.5 text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 pointer-events-none">
            F3
          </span>
        </form>
      </div>

      {/* Mobile / Tablet Tab Navigation Bar (< lg breakpoint) */}
      <div className="lg:hidden flex items-center justify-between gap-1 p-1.5 bg-slate-200/80 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shrink-0">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'products'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>المنتجات ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 relative cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>السلة</span>
          {cartItems.length > 0 && (
            <span className="bg-amber-500 text-slate-900 font-black px-1.5 py-0.2 text-[10px] rounded-full">
              {cartItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setMobileTab('payment')}
          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 relative cursor-pointer ${
            mobileTab === 'payment'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>الدفع ({grandTotal.toFixed(0)} ج.م)</span>
        </button>
      </div>

      {/* 2. Main POS 3-Panel Layout (RTL Order: Far Right = Product Catalog 6/12, Middle = Cart Table 3/12, Far Left = Totals & Payment 3/12) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2.5 p-2 sm:p-2.5 overflow-hidden bg-[#f5f7fa] dark:bg-slate-900">

        {/* 1st Column (Far Right - Col 6/12): Product Catalog Grid (Main Working Area) */}
        <div className={`lg:col-span-6 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden h-full ${
          mobileTab !== 'products' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Header Title with Search Input */}
          <div className="p-2 sm:p-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 bg-white dark:bg-slate-800">
            <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
              <Grid className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>كتالوج الأصناف</span>
            </span>

            {/* Product Catalog Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الكود (F4)"
                className="w-full pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute left-2 top-1.5 text-[9px] font-black font-mono px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 pointer-events-none">
                F4
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-bold border border-slate-200 dark:border-slate-600 shrink-0">
              {filteredProducts.length} صنف
            </span>
          </div>

          {/* Category Filters Bar - Uniform Button Styles */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center justify-center border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-extrabold'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600 shadow-2xs'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5 bg-slate-50/40 dark:bg-slate-900/40">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                <p className="font-bold text-xs">لا توجد أصناف تطابق البحث</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const stock = getProductStockInWarehouse(product.id, activeWarehouse?.id || 'wh_main');

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white dark:bg-slate-700/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-emerald-500 flex flex-col justify-between text-right transition transform active:scale-95 shadow-2xs group relative overflow-hidden h-32 sm:h-36 cursor-pointer"
                  >
                    {/* Stock Badge */}
                    <span className={`absolute top-1 left-1 text-[8px] sm:text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold z-10 shadow-2xs ${
                      stock <= product.minStock ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {stock} {product.baseUnit}
                    </span>

                    {/* Image Thumbnail */}
                    <div className="w-full h-14 sm:h-16 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 mb-1 flex items-center justify-center border border-slate-200 dark:border-slate-600 shrink-0">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Tag className="w-6 h-6 sm:w-7 sm:h-7 text-slate-300 dark:text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <h4 className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200 dark:border-slate-600">
                        <span className="font-extrabold font-mono text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400">
                          {product.salePrice.toFixed(2)}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400">ج.م</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Floating Quick Banner for Mobile in Products View */}
          {mobileTab === 'products' && cartItems.length > 0 && (
            <div className="lg:hidden p-2.5 bg-emerald-800 text-white flex items-center justify-between gap-2 border-t border-emerald-700 shadow-lg shrink-0">
              <div className="text-right">
                <span className="text-[10px] block font-semibold text-emerald-200">سلة الشراء ({cartItems.length} صنف)</span>
                <span className="text-sm font-black font-mono">{grandTotal.toFixed(2)} ج.م</span>
              </div>
              <button
                onClick={() => setMobileTab('cart')}
                className="px-3.5 py-1.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg text-xs font-extrabold shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>متابعة السلة والدفع</span>
                <span>←</span>
              </button>
            </div>
          )}
        </div>

        {/* 2nd Column (Middle - Col 3/12): Invoice Cart Items Table & Cart Tools */}
        <div className={`lg:col-span-3 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden h-full ${
          mobileTab !== 'cart' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Customer Selection Bar */}
          <div className="p-2 sm:p-2.5 bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">العميل:</span>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="flex-1 p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none truncate"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{c.name} {c.phone !== '-' ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewCustomerModal(true)}
              className="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shrink-0 flex items-center gap-1 cursor-pointer"
              title="إضافة عميل جديد (F9 / Alt+C)"
            >
              <UserPlus className="w-4 h-4" />
              <kbd className="hidden sm:inline px-1 bg-teal-800 text-teal-100 rounded text-[9px] font-mono font-bold">F9</kbd>
            </button>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 sticky top-0 font-extrabold border-b border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs">
                <tr>
                  <th className="py-2 px-1.5 text-center w-6 sm:w-8">م</th>
                  <th className="hidden sm:table-cell py-2 px-2">الباركود</th>
                  <th className="py-2 px-1.5 sm:px-2">اسم الصنف</th>
                  <th className="py-2 px-1.5 sm:px-2 text-center">الكمية</th>
                  <th className="py-2 px-1.5 sm:px-2 text-left">السعر</th>
                  <th className="py-2 px-1.5 sm:px-2 text-left">الإجمالي</th>
                  <th className="py-2 px-1 text-center w-6 sm:w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-slate-400">
                      <Barcode className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-600 dark:text-emerald-400" />
                      <p className="font-bold text-sm text-slate-600 dark:text-slate-300">السلة فارغة حالياً</p>
                      <p className="text-[11px] text-slate-400 mt-1">اختر منتجات أو امسح الباركود للبدء</p>
                    </td>
                  </tr>
                ) : (
                  cartItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition">
                      <td className="py-2 px-1.5 text-center text-slate-400 font-mono text-[10px] sm:text-[11px]">{idx + 1}</td>
                      <td className="hidden sm:table-cell py-2 px-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.barcode}</td>
                      <td className="py-2 px-1.5 sm:px-2 font-bold text-slate-800 dark:text-slate-100 max-w-[90px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">{item.productName}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-300 dark:border-slate-600 inline-flex">
                          <button
                            onClick={() => updateItemQty(idx, item.qty - 1)}
                            className="w-4 h-4 sm:w-5 sm:h-5 bg-white dark:bg-slate-600 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-100 font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-7 sm:w-9 text-center font-bold font-mono text-xs bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none"
                          />
                          <button
                            onClick={() => updateItemQty(idx, item.qty + 1)}
                            className="w-4 h-4 sm:w-5 sm:h-5 bg-white dark:bg-slate-600 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-100 font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-1.5 sm:px-2 text-left font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 px-1.5 sm:px-2 text-left font-mono font-black text-emerald-700 dark:text-emerald-400 text-[11px] sm:text-xs">{item.total.toFixed(2)}</td>
                      <td className="py-2 px-1 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 flex items-center justify-center transition border border-rose-200 dark:border-rose-800/60 cursor-pointer"
                          title="حذف الصنف"
                        >
                          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cart Bottom Actions Bar */}
          <div className="p-2 bg-slate-50 dark:bg-slate-700/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearCart}
                className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                title="مسح السلة (Alt + X)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح</span>
                <kbd className="text-[9px] px-1 bg-rose-200 dark:bg-rose-900 rounded font-mono font-bold">Alt+X</kbd>
              </button>

              <button
                onClick={() => setShowDiscountModal(true)}
                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-800/60 transition cursor-pointer"
                title="تطبيق خصم (F10 / Alt+K)"
              >
                <span>% خصم</span>
                <kbd className="text-[9px] px-1 bg-amber-200 dark:bg-amber-900 rounded font-mono font-bold">F10</kbd>
              </button>

              <button
                onClick={() => setMobileTab('payment')}
                className="lg:hidden px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-extrabold transition cursor-pointer"
              >
                الدفع ←
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHeldSalesModal(true)}
                className="px-2 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="استرجاع مسودة معلقة (F7 / Alt+R)"
              >
                <Archive className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مسودات</span>
                <kbd className="text-[9px] px-1 bg-purple-200 dark:bg-purple-900 rounded font-mono font-bold">F7</kbd>
              </button>
            </div>
          </div>
        </div>

        {/* 3rd Column (Far Left - Col 3/12): Totals, VAT & Payment Actions */}
        <div className={`lg:col-span-3 flex flex-col gap-2.5 h-full overflow-y-auto pl-0.5 ${
          mobileTab !== 'payment' ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Totals Summary Card - Clean Light / Dark Theme */}
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">إجمالي الأصناف</span>
              <span className="font-bold font-mono text-sm text-slate-900 dark:text-slate-100">
                {subtotal.toFixed(2)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">ج.م</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">قيمة الخصم</span>
              <span className="font-bold font-mono text-xs text-rose-600 dark:text-rose-400">
                {discountAmount.toFixed(2)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">ج.م</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={enableVat} 
                  onChange={(e) => setEnableVat(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" 
                />
                <span>ضريبة القيمة المضافة ({settings.vatRate}%)</span>
              </label>
              <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-200">
                {vatAmount.toFixed(2)} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">ج.م</span>
              </span>
            </div>

            {/* Grand Total */}
            <div className="bg-emerald-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
              <div>
                <span className="font-black text-xs text-white block">الإجمالي الكلي الصافي</span>
                <span className="text-[10px] font-bold text-emerald-100 block mt-0.5">شامل كافة الضرائب والخصومات</span>
              </div>
              <div className="text-left">
                <span className="font-black font-mono text-2xl text-white block leading-none">
                  {grandTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-black text-emerald-100 block mt-0.5">جنيه مصري ج.م</span>
              </div>
            </div>
          </div>

          {/* Payment Details Card - Clean Light / Dark Theme */}
          <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex items-center justify-between">
                <span>بيانات ومعالجة الدفع</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                  paymentMethod === 'CASH'
                    ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800'
                    : paymentMethod === 'CARD'
                    ? 'text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800'
                    : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800'
                }`}>
                  {paymentMethod === 'CASH' ? 'نقدي CASH' : paymentMethod === 'CARD' ? 'بطاقة CARD' : 'آجل CREDIT'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">طريقة الدفع</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>نقدي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                      paymentMethod === 'CARD'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>بطاقة/فيزا</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border ${
                      paymentMethod === 'CREDIT'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>آجل</span>
                  </button>
                </div>
              </div>

              {/* Paid Amount Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">المبلغ المدفوع من العميل (ج.م)</label>
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput(grandTotal > 0 ? grandTotal.toString() : '')}
                    className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
                  >
                    المبلغ بالضبط
                  </button>
                </div>
                <input
                  ref={paidAmountInputRef}
                  type="number"
                  step="0.5"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCompleteSale();
                    }
                  }}
                  placeholder={grandTotal > 0 ? grandTotal.toFixed(2) : '0.00'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border-2 border-emerald-600 rounded-lg font-black font-mono text-center text-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />

                {/* Quick Cash Presets */}
                <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5">
                  {[50, 100, 200, 500].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setPaidAmountInput(amount.toString())}
                      className="flex-1 py-1 px-1 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold font-mono transition cursor-pointer"
                    >
                      {amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput(grandTotal > 0 ? grandTotal.toString() : '')}
                    className="py-1 px-2 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded text-[10px] font-bold font-mono transition cursor-pointer shrink-0"
                    title="دفع القيمة بالضبط"
                  >
                    بالضبط
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">المتبقي للعميل (الباقي):</span>
                <span className={`font-black font-mono text-base ${
                  changeVal > 0 
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' 
                    : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {changeVal.toFixed(2)} <span className="text-xs font-semibold">ج.م</span>
                </span>
              </div>
            </div>

            {/* Action Buttons with Distinctive Keyboard Shortcut Badges */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCompleteSale}
                className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-between shadow-md transition transform active:scale-98 cursor-pointer group ${
                  cartItems.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                }`}
                title="إتمام البيع والدفع السريع (F2 أو NumPad + أو Ctrl+Enter)"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>إتمام البيع والدفع</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold">F2</span>
                  <span className="hidden sm:inline text-[9px] text-emerald-200">أو +</span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleHoldSale}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-between shadow-2xs transition active:scale-98 cursor-pointer"
                title="حفظ الفاتورة كمسودة مؤقتة (F6 أو Alt+H)"
              >
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>حفظ كمسودة</span>
                </div>
                <span className="bg-purple-800 text-purple-100 text-[10px] px-2 py-0.5 rounded font-mono font-bold">F6</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReceiptAction}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-between shadow-2xs transition active:scale-98 cursor-pointer"
                title="طباعة الإيصال (Alt+P / Ctrl+P)"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  <span>طباعة الإيصال</span>
                </div>
                <span className="bg-slate-700 text-slate-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold">Alt+P</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Function Key Shortcuts Bar - Color Coded and 100% Synced */}
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-1.5 px-2.5 sm:px-3 flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none select-none">
        <div className="flex items-center gap-1.5 w-full">
          
          <button 
            onClick={() => setShowShortcutsModal(true)} 
            className="flex-1 min-w-[70px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="دليل اختصارات الكيبورد (F1 أو Shift+?)"
          >
            <kbd className="px-1 py-0.2 bg-emerald-600 text-white rounded text-[10px] font-mono">F1</kbd>
            <span>دليل</span>
          </button>

          <button 
            onClick={handleCompleteSale} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-green-50 dark:bg-green-950/60 hover:bg-green-100 dark:hover:bg-green-900/80 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="إتمام البيع والدفع السريع (F2 أو NumPad +)"
          >
            <kbd className="px-1 py-0.2 bg-green-600 text-white rounded text-[10px] font-mono">F2</kbd>
            <span>دفع</span>
          </button>

          <button 
            onClick={() => topBarcodeRef.current?.focus()} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="التركيز على قارئ الباركود (F3 أو Alt+B)"
          >
            <kbd className="px-1 py-0.2 bg-sky-600 text-white rounded text-[10px] font-mono">F3</kbd>
            <span>باركود</span>
          </button>

          <button 
            onClick={() => searchInputRef.current?.focus()} 
            className="flex-1 min-w-[75px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="بحث في الأصناف (F4 أو Alt+S)"
          >
            <kbd className="px-1 py-0.2 bg-indigo-600 text-white rounded text-[10px] font-mono">F4</kbd>
            <span>بحث</span>
          </button>

          <button 
            onClick={handleHoldSale} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/80 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="حفظ الفاتورة كمسودة مؤقتة (F6 أو Alt+H)"
          >
            <kbd className="px-1 py-0.2 bg-purple-600 text-white rounded text-[10px] font-mono">F6</kbd>
            <span>حفظ</span>
          </button>

          <button 
            onClick={() => setShowHeldSalesModal(true)} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900/80 border border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="استرجاع المسودات المعلقة (F7 أو Alt+R)"
          >
            <kbd className="px-1 py-0.2 bg-pink-600 text-white rounded text-[10px] font-mono">F7</kbd>
            <span>مسودات</span>
          </button>

          <button 
            onClick={handleOpenCashDrawer} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="فتح درج النقدية الإلكتروني (F8 أو Alt+D)"
          >
            <kbd className="px-1 py-0.2 bg-amber-600 text-white rounded text-[10px] font-mono">F8</kbd>
            <span>درج</span>
          </button>

          <button 
            onClick={() => setShowNewCustomerModal(true)} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="إضافة عميل جديد (F9 أو Alt+C)"
          >
            <kbd className="px-1 py-0.2 bg-teal-600 text-white rounded text-[10px] font-mono">F9</kbd>
            <span>عملاء</span>
          </button>

          <button 
            onClick={() => setShowDiscountModal(true)} 
            className="flex-1 min-w-[85px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/80 border border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="تطبيق نسبة خصم (F10 أو Alt+K)"
          >
            <kbd className="px-1 py-0.2 bg-orange-600 text-white rounded text-[10px] font-mono">F10</kbd>
            <span>خصم</span>
          </button>

          <button 
            onClick={toggleFullscreen} 
            className="flex-1 min-w-[70px] h-8 px-2 text-[11px] font-black flex items-center justify-center gap-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="ملء الشاشة (F11 أو Alt+Enter)"
          >
            <kbd className="px-1 py-0.2 bg-slate-700 text-white rounded text-[10px] font-mono">F11</kbd>
            <span>شاشة</span>
          </button>

        </div>

        {drawerOpenMessage && (
          <div className="bg-emerald-600 text-white px-3 py-1 rounded font-bold text-xs shrink-0 animate-bounce">
            تم إرسال إشارة فتح درج النقدية!
          </div>
        )}
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 border-b pb-2">تطبيق خصم على الفاتورة (F10)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">نسبة الخصم (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  autoFocus
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold font-mono text-center text-lg text-slate-800 dark:text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-500">قيمة الخصم بالجنيه: <span className="font-bold text-rose-600 font-mono">{((subtotal * discountPercent) / 100).toFixed(2)} ج.م</span></p>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                تأكيد (Enter)
              </button>
              <button
                onClick={() => {
                  setDiscountPercent(0);
                  setShowDiscountModal(false);
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                إلغاء الخصم (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Sales Draft Modal */}
      {showHeldSalesModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">المسودات المعلقة ({getHeldSales().length})</h3>
              <button onClick={() => setShowHeldSalesModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕ (Esc)</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getHeldSales().length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">لا توجد مسودات محفوظة حالياً</p>
              ) : (
                getHeldSales().map(h => (
                  <div key={h.id} className="p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{h.invoiceNo} - {h.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{new Date(h.createdAt).toLocaleTimeString('ar-EG')} - {h.items?.length || 0} عناصر</div>
                      <div className="font-black font-mono text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{h.grandTotal.toFixed(2)} ج.م</div>
                    </div>
                    <button
                      onClick={() => handleRestoreHeldSale(h)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      استرجاع
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-3">إضافة عميل جديد (F9)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم العميل</label>
                <input
                  type="text"
                  autoFocus
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  if (newCustomerName.trim()) {
                    const newCustObj: Customer = {
                      id: 'cust_' + Date.now(),
                      code: 'CUST-' + Date.now().toString().slice(-4),
                      name: newCustomerName.trim(),
                      phone: newCustomerPhone.trim() || '-',
                      address: '',
                      creditLimit: 10000,
                      balance: 0,
                      createdAt: new Date().toISOString()
                    };
                    saveCustomer(newCustObj);
                    setCustomers(getCustomers());
                    setSelectedCustomer(newCustObj.id);
                    setShowNewCustomerModal(false);
                    setNewCustomerName('');
                    setNewCustomerPhone('');
                  }
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                حفظ العميل (Enter)
              </button>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                إلغاء (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal Trigger */}
      {completedSaleForReceipt && (
        <ReceiptPrintModal 
          sale={completedSaleForReceipt} 
          onClose={() => setCompletedSaleForReceipt(null)} 
        />
      )}

      {/* Embedded Shortcuts Modal if triggered locally */}
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

    </div>
  );
};
