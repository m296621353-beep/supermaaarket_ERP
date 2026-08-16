import React, { useState, useEffect } from 'react';
import { 
  BarChart3, FileSpreadsheet, TrendingUp, DollarSign, Package, 
  Calendar, Printer, Filter, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download
} from 'lucide-react';
import { 
  getIncomeStatement, getBalanceSheet, getSalesReport, getInventoryReport 
} from '../../db/dbEngine';

export const ReportsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'income_statement' | 'balance_sheet' | 'sales_report' | 'inventory_report'>('income_statement');
  
  // Date Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Data States
  const [pnl, setPnl] = useState<ReturnType<typeof getIncomeStatement> | null>(null);
  const [bs, setBs] = useState<ReturnType<typeof getBalanceSheet> | null>(null);
  const [salesRep, setSalesRep] = useState<ReturnType<typeof getSalesReport> | null>(null);
  const [invRep, setInvRep] = useState<ReturnType<typeof getInventoryReport> | null>(null);

  const loadReports = () => {
    setPnl(getIncomeStatement(startDate, endDate));
    setBs(getBalanceSheet());
    setSalesRep(getSalesReport(startDate, endDate));
    setInvRep(getInventoryReport());
  };

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-2xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-800 dark:text-slate-100">التقارير المتقدمة والقوائم المالية</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">قائمة الدخل، الميزانية العمومية، تقارير المبيعات، حركة وتقييم المخزون الربحية</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التقرير</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700 dark:text-slate-300">تصفية الفترة الزمنية:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-rose-600 font-bold hover:underline"
            >
              إعادة ضبط
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-bold">
          بيانات حقيقية موحدة من قيود دفتر الأستاذ العام
        </div>
      </div>

      {/* Main Report Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('income_statement')}
          className={`p-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'income_statement'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>قائمة الدخل (الأرباح والخسائر)</span>
        </button>

        <button
          onClick={() => setActiveTab('balance_sheet')}
          className={`p-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'balance_sheet'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>الميزانية العمومية</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_report')}
          className={`p-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'sales_report'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>تقارير المبيعات</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory_report')}
          className={`p-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'inventory_report'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>تقييم وحركة المخزون</span>
        </button>
      </div>

      {/* TAB 1: Income Statement */}
      {activeTab === 'income_statement' && pnl && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">قائمة الدخل - Income Statement (P&L)</h2>
              <p className="text-xs text-slate-500">عن الفترة من {startDate || 'بداية النشاط'} إلى {endDate || 'اليوم'}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 ${
              pnl.netProfit >= 0 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200' 
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200'
            }`}>
              <span>صافي نتيجة النشاط:</span>
              <span className="text-base font-mono dir-ltr">{pnl.netProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
              <span>{pnl.netProfit >= 0 ? '(صافي ربح)' : '(صافي خسارة)'}</span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Sales Revenue */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl font-bold">
              <span className="text-slate-700 dark:text-slate-200">إيرادات المبيعات (حـ/ 4101)</span>
              <span className="font-mono text-slate-800 dark:text-slate-100 font-black">{pnl.salesRevenue.toFixed(2)} ج.م</span>
            </div>

            {/* COGS */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl font-bold">
              <span className="text-slate-700 dark:text-slate-200">خصم: تكلفة البضاعة المباعة (حـ/ 5101 COGS)</span>
              <span className="font-mono text-rose-600 font-black">-{pnl.cogs.toFixed(2)} ج.م</span>
            </div>

            {/* Gross Profit */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl font-extrabold text-sm text-emerald-800 dark:text-emerald-200">
              <span>مجمل الربح (Gross Profit)</span>
              <span className="font-mono font-black">{pnl.grossProfit.toFixed(2)} ج.م</span>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="space-y-2 pt-2">
              <h4 className="font-extrabold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 pb-2">
                المصروفات التشغيلية والعمومية (Operating Expenses):
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                <div className="flex justify-between p-2 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">مصروفات الإيجار (حـ/ 5102)</span>
                  <span className="font-mono font-bold">{pnl.expenses.rent.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">المرافق والكهرباء (حـ/ 5103)</span>
                  <span className="font-mono font-bold">{pnl.expenses.utilities.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">المرتبات والأجور (حـ/ 5104)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{pnl.expenses.salaries.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">الصيانة والتصليح (حـ/ 5105)</span>
                  <span className="font-mono font-bold">{pnl.expenses.maintenance.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">مصروفات إهلاك الأصول الثابتة (حـ/ 5107)</span>
                  <span className="font-mono font-bold">{pnl.expenses.depreciation.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">مصروفات عامة ونثريات (حـ/ 5106)</span>
                  <span className="font-mono font-bold">{pnl.expenses.general.toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-100">
                <span>إجمالي المصروفات التشغيلية</span>
                <span className="font-mono text-rose-600 font-black">-{pnl.totalOperatingExpenses.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Final Net Profit */}
            <div className={`p-4 rounded-xl border-2 font-black text-base flex items-center justify-between ${
              pnl.netProfit >= 0
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-rose-600 text-white border-rose-700'
            }`}>
              <span>صافي ربح / خسارة النشاط التجاري (Net Profit / Loss)</span>
              <span className="font-mono dir-ltr text-xl">{pnl.netProfit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Balance Sheet */}
      {activeTab === 'balance_sheet' && bs && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">الميزانية العمومية والمركز المالي - Balance Sheet</h2>
              <p className="text-xs text-slate-500">حالة المركز المالي والسيولة للشركة حتى تاريخ اليوم</p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>الميزانية متوازنة محاسبياً (الأصول = الخصوم + الملكية)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* ASSETS */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 pb-2">
                الأصول والأسلوب المالي (Assets):
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">السيولة بالنقدية بالخزينة (حـ/ 1101)</span>
                  <span className="font-mono font-bold text-emerald-600">{bs.assets.cash.toFixed(2)} ج.م</span>
                </div>

                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">أرصدة الحسابات بالبنوك (حـ/ 1102)</span>
                  <span className="font-mono font-bold text-sky-600">{bs.assets.banks.toFixed(2)} ج.م</span>
                </div>

                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">تكلفة تقييم المخزون البضاعة (حـ/ 1104)</span>
                  <span className="font-mono font-bold">{bs.assets.inventory.toFixed(2)} ج.م</span>
                </div>

                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">مستحقات على العملاء والآجل (حـ/ 1103)</span>
                  <span className="font-mono font-bold">{bs.assets.receivables.toFixed(2)} ج.م</span>
                </div>

                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">صافي الأصول الثابتة بالدفتري (حـ/ 1201 - 1202)</span>
                  <span className="font-mono font-bold">{bs.assets.fixedAssetsNet.toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-600 text-white rounded-xl font-black text-sm flex justify-between">
                <span>إجمالي الأصول (Total Assets)</span>
                <span className="font-mono">{bs.assets.totalAssets.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 pb-2">
                الخصوم وحقوق الملكية (Liabilities & Equity):
              </h3>

              <div className="space-y-2">
                <div className="text-slate-500 font-bold text-[11px]">الخصوم والالتزامات المتداولة:</div>
                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">مستحقات الموردين والدائنين (حـ/ 2101)</span>
                  <span className="font-mono font-bold text-rose-600">{bs.liabilities.suppliersPayable.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">ضريبة القيمة المضافة المستحقة (حـ/ 2102)</span>
                  <span className="font-mono font-bold text-rose-600">{bs.liabilities.vatPayable.toFixed(2)} ج.م</span>
                </div>

                <div className="text-slate-500 font-bold text-[11px] pt-2">حقوق الملكية والأرباح:</div>
                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">رأس المال المستثمر المباشر (حـ/ 3101)</span>
                  <span className="font-mono font-bold">{bs.equity.capital.toFixed(2)} ج.م</span>
                </div>
                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-300">صافي الأرباح الصافية الحالية</span>
                  <span className="font-mono font-bold text-emerald-600">{bs.equity.retainedEarnings.toFixed(2)} ج.م</span>
                </div>
              </div>

              <div className="p-3 bg-slate-800 dark:bg-slate-900 text-white rounded-xl font-black text-sm flex justify-between">
                <span>إجمالي الخصوم وحقوق الملكية</span>
                <span className="font-mono">{bs.totalLiabilitiesAndEquity.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Sales Report */}
      {activeTab === 'sales_report' && salesRep && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">عدد الفواتير المنفذة</span>
              <div className="font-black text-2xl text-slate-800 dark:text-slate-100">{salesRep.totalInvoices} فاتورة</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">إجمالي المبيعات الشاملة</span>
              <div className="font-black text-2xl text-emerald-600">{salesRep.totalGrand.toFixed(2)} ج.م</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">ضريبة القيمة المضافة (14%)</span>
              <div className="font-black text-2xl text-sky-600">{salesRep.totalVat.toFixed(2)} ج.م</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">متوسط قيمة الفاتورة</span>
              <div className="font-black text-2xl text-slate-800 dark:text-slate-100">{salesRep.averageInvoiceValue.toFixed(2)} ج.م</div>
            </div>
          </div>

          {/* Top Selling Products List */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
              الأصناف الأكثر مبيعاً وإيراداً
            </h3>

            <div className="space-y-2 text-xs">
              {salesRep.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{p.productName}</span>
                  </div>

                  <div className="flex items-center gap-4 font-mono font-bold">
                    <span className="text-slate-500">الكمية: {p.qty} وحدة</span>
                    <span className="text-emerald-600">{p.totalRevenue.toFixed(2)} ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Inventory Report */}
      {activeTab === 'inventory_report' && invRep && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">عدد المنتجات المسجلة</span>
              <div className="font-black text-2xl text-slate-800 dark:text-slate-100">{invRep.totalProductsCount} صنف</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">إجمالي كمية المخزون القائم</span>
              <div className="font-black text-2xl text-slate-800 dark:text-slate-100">{invRep.totalQuantityInStock} قطعة/وحدة</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">قيمة التقييم بسعر التكلفة</span>
              <div className="font-black text-2xl text-emerald-600">{invRep.totalValuationAtCost.toFixed(2)} ج.م</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-bold">الهامش المالي المتوقع</span>
              <div className="font-black text-2xl text-sky-600">{invRep.potentialProfit.toFixed(2)} ج.م</div>
            </div>
          </div>

          {invRep.lowStockCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>تنبيه أصناف قاربت على النفاذ ({invRep.lowStockCount} صنف)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {invRep.lowStockItems.map((item, i) => (
                  <div key={i} className="p-2 bg-white/80 dark:bg-slate-800 rounded-lg flex justify-between font-bold">
                    <span>{item.product.name}</span>
                    <span className="text-amber-600 font-mono">المتاح: {item.currentQty} (الحد: {item.product.minStock})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
