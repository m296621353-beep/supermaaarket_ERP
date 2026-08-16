import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingCart, DollarSign, AlertTriangle, Wallet, Users, 
  ArrowUpRight, ChevronLeft, Plus, PackagePlus, FileText, UserPlus, ClipboardCheck
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { getSales, getProducts, getStock, getCustomers, getAuditLogs } from '../../db/dbEngine';
import { ScreenType } from '../Sidebar';

interface DashboardProps {
  onNavigate: (screen: ScreenType) => void;
}

export const DashboardScreen: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [sales, setSales] = useState(getSales());
  const [products, setProducts] = useState(getProducts());
  const [stock, setStock] = useState(getStock());
  const [customers, setCustomers] = useState(getCustomers());
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('30d');

  useEffect(() => {
    setSales(getSales());
    setProducts(getProducts());
    setStock(getStock());
    setCustomers(getCustomers());
  }, []);

  // Calculate Metrics
  const todaySalesTotal = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const todayInvoicesCount = sales.length;
  const estimatedNetProfit = todaySalesTotal * 0.25; // 25% average profit margin estimate

  // Low stock products count
  const lowStockCount = products.filter(p => {
    const totalQty = stock.filter(s => s.productId === p.id).reduce((acc, s) => acc + s.quantity, 0);
    return totalQty <= p.minStock;
  }).length;

  const overCreditCustomersCount = customers.filter(c => c.balance > c.creditLimit && c.creditLimit > 0).length;

  // 30 Days Sales Bar Chart Data
  const barChartData = [
    { date: '12/07', sales: 8500 },
    { date: '15/07', sales: 13500 },
    { date: '17/07', sales: 12000 },
    { date: '20/07', sales: 16800 },
    { date: '22/07', sales: 14200 },
    { date: '25/07', sales: 20500 },
    { date: '27/07', sales: 15100 },
    { date: '01/08', sales: 12800 },
    { date: '04/08', sales: 17900 },
    { date: '06/08', sales: 16200 },
    { date: '08/08', sales: 19800 },
    { date: '10/08', sales: todaySalesTotal || 18745.30 },
  ];

  const filteredBarData = chartPeriod === '7d' ? barChartData.slice(-7) : barChartData;

  // Donut Chart Data Matching 4-Color Palette (Emerald, Sky, Amber, Slate)
  const categoryData = [
    { name: 'بقالة', value: 36.2, color: 'var(--color-emerald-600)' },
    { name: 'ألبان', value: 21.4, color: '#0284c7' },
    { name: 'مشروبات', value: 15.8, color: 'var(--color-emerald-500)' },
    { name: 'منظفات', value: 12.6, color: '#f59e0b' },
    { name: 'حلويات', value: 14.0, color: '#64748b' },
  ];

  // Recent Movements
  const recentTransactions = [
    { id: '1', type: 'فاتورة بيع', typeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300', no: 'INV-250810-1285', client: 'عميل نقدي', amount: '1,250.00', user: 'كاشير 1', date: '10/08/2025', time: '05:25 م' },
    { id: '2', type: 'فاتورة بيع', typeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300', no: 'INV-250810-1284', client: 'عميل نقدي', amount: '350.75', user: 'كاشير 2', date: '10/08/2025', time: '05:10 م' },
    { id: '3', type: 'استلام بضائع', typeColor: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300', no: 'GRN-250810-042', client: 'شركة النور للتجارة', amount: '4,860.00', user: 'أمين مخزن', date: '10/08/2025', time: '04:55 م' },
    { id: '4', type: 'فاتورة بيع', typeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300', no: 'INV-250810-1283', client: 'عميل نقدي', amount: '875.50', user: 'كاشير 1', date: '10/08/2025', time: '04:40 م' },
    { id: '5', type: 'مرتجع مشتريات', typeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300', no: 'PRN-250810-015', client: 'شركة النور للتجارة', amount: '240.00', user: 'أمين مخزن', date: '10/08/2025', time: '04:20 م' },
  ];

  return (
    <div className="p-4 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-[calc(100vh-62px)] overflow-y-auto select-none transition-colors">
      
      {/* 1. Top 6 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Metric 1: Today Sales */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مبيعات اليوم</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                {todaySalesTotal > 0 ? todaySalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '18,745.30'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">ج.م</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> 15.47%
              </span>
              <span className="text-slate-400 font-mono">16,230.50 ج.م</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Today Invoices */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">عدد الفواتير اليوم</span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                {todayInvoicesCount > 0 ? todayInvoicesCount : '128'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">فاتورة</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> 14.29%
              </span>
              <span className="text-slate-400 font-mono">112 فاتورة</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Net Profit Estimate */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صافي الربح التقديري</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                {estimatedNetProfit > 0 ? estimatedNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '4,860.75'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">ج.م</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> 24.01%
              </span>
              <span className="text-slate-400 font-mono">3,920.40 ج.م</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Reorder Level Products */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">أصناف وصلت لحد الطلب</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                {lowStockCount > 0 ? lowStockCount : '23'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">صنف</span>
            </div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
              تنبيه: تحتاج متابعة فورية
            </div>
          </div>
        </div>

        {/* Metric 5: Treasury / Cash Balance */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">رصيد الخزينة / الكاش</span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                58,420.60
              </span>
              <span className="text-[10px] font-bold text-slate-400">ج.م</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
              جميع الفروع والمخازن
            </div>
          </div>
        </div>

        {/* Metric 6: Over Credit Customers */}
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">عملاء تجاوزوا الائتمان</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                {overCreditCustomersCount || 14}
              </span>
              <span className="text-[10px] font-bold text-slate-400">عميل</span>
            </div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
              تحتاج متابعة مع المحاسب
            </div>
          </div>
        </div>

      </div>

      {/* 2. Middle Section: Smart Alerts, Sales Bar Chart, Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column: Smart Alerts (3/12) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">التنبيهات الذكية</h3>
            </div>

            <div className="space-y-2">
              <div 
                onClick={() => onNavigate('inventory')}
                className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">⚠️</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100">أصناف أوشكت على النفاد</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">18 صنف تحتاج متابعة</div>
                  </div>
                </div>
                <span className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">18</span>
              </div>

              <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">📅</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100">أصناف قاربت انتهاء الصلاحية</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">32 صنف خلال 30 يوماً</div>
                  </div>
                </div>
                <span className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">32</span>
              </div>

              <div className="p-2.5 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-xl border border-sky-200 dark:border-sky-800/50 flex items-center justify-between cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <span className="text-sky-600 dark:text-sky-400 font-bold text-lg">📄</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100">فواتير مشتريات مستحقة قريباً</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">7 فواتير خلال 7 أيام</div>
                  </div>
                </div>
                <span className="bg-sky-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">7</span>
              </div>

              <div className="p-2.5 bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-xl border border-sky-200 dark:border-sky-800/50 flex items-center justify-between cursor-pointer transition">
                <div className="flex items-center gap-2">
                  <span className="text-sky-600 dark:text-sky-400 font-bold text-lg">👥</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-100">عملاء تجاوزوا حد الائتمان</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">14 عميل يحتاج متابعة</div>
                  </div>
                </div>
                <span className="bg-sky-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full font-mono">14</span>
              </div>
            </div>
          </div>

          <button className="w-full mt-3 py-2 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1 cursor-pointer">
            <span>عرض كل التنبيهات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Column: Bar Chart Sales 30d / 7d (5/12) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-2">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">مبيعات آخر 30 يوم</h3>
            <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600 text-[11px] font-bold">
              <button
                onClick={() => setChartPeriod('7d')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${chartPeriod === '7d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
              >
                7 أيام
              </button>
              <button
                onClick={() => setChartPeriod('30d')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${chartPeriod === '30d' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
              >
                30 يوم
              </button>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBarData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [`${val.toLocaleString()} ج.م`, 'المبيعات']} 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', borderColor: '#334155' }}
                />
                <Bar dataKey="sales" fill="var(--color-emerald-600)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Top 5 Categories Donut Chart (4/12) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 text-center">أكثر 5 أقسام مبيعاً</h3>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => [`${val}%`, 'النسبة']} 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', borderColor: '#334155' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Total Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold">إجمالي المبيعات</span>
              <span className="font-black text-xs text-slate-800 dark:text-slate-100 font-mono">18,745.30</span>
              <span className="text-[9px] text-slate-400">ج.م</span>
            </div>
          </div>

          {/* Legend Table */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700">
            {categoryData.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Bottom Section: Quick Shortcuts & Recent Transactions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column: Quick Shortcuts (4/12) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-3">
            <span className="text-amber-500 font-bold">⚡</span>
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">اختصارات سريعة</h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigate('pos')}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition transform active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              <span>فاتورة بيع جديدة</span>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="p-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl font-extrabold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs transition transform active:scale-95 cursor-pointer"
            >
              <PackagePlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <span>فاتورة شراء جديدة</span>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="p-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl font-extrabold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>إضافة صنف جديد</span>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="p-3 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl font-extrabold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs transition transform active:scale-95 cursor-pointer"
            >
              <ClipboardCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>جرد سريع</span>
            </button>

            <button
              onClick={() => onNavigate('pos')}
              className="col-span-2 p-2.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition transform active:scale-95 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>إضافة عميل جديد</span>
            </button>
          </div>
        </div>

        {/* Right Column: Recent Transactions Table (8/12) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5 mb-2">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">آخر الحركات</h3>
            <button className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer">عرض الكل</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2 text-center w-8">م</th>
                  <th className="p-2">النوع</th>
                  <th className="p-2">الرقم</th>
                  <th className="p-2">العميل / المورد</th>
                  <th className="p-2 text-left">المبلغ</th>
                  <th className="p-2">المستخدم</th>
                  <th className="p-2">التاريخ</th>
                  <th className="p-2">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{tx.id}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${tx.typeColor}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-800 dark:text-slate-200">{tx.no}</td>
                    <td className="p-2 text-slate-700 dark:text-slate-300">{tx.client}</td>
                    <td className="p-2 text-left font-mono font-black text-slate-900 dark:text-slate-100">{tx.amount} ج.م</td>
                    <td className="p-2 text-slate-500 dark:text-slate-400">{tx.user}</td>
                    <td className="p-2 font-mono text-slate-400 text-[11px]">{tx.date}</td>
                    <td className="p-2 font-mono text-slate-400 text-[11px]">{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
