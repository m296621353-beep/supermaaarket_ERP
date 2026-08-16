import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, DollarSign, Download, Printer, Filter, 
  ArrowUpRight, ArrowDownLeft, Scale, CheckCircle2, Building, ShieldCheck 
} from 'lucide-react';
import { getVatReport, subscribeToDB } from '../../db/dbEngine';

export const TaxReportScreen: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'SALES' | 'PURCHASES'>('SUMMARY');

  const [vatReport, setVatReport] = useState(() => getVatReport(startDate, endDate));

  const loadData = () => {
    setVatReport(getVatReport(startDate, endDate));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDB(loadData);
    return () => unsubscribe();
  }, [startDate, endDate]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/10 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              الضرائب والإقرار الضريبي (VAT Report)
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                القيمة المضافة 14%
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              حساب ومقاصة ضريبة المبيعات والمشتريات والالتزام الضريبي الصافي للهيئة العامة للضرائب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            طباعة الإقرار الضريبي
          </button>
        </div>
      </div>

      {/* Date Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> الفلاتر الزمنية:
          </span>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>
          <span className="text-xs text-slate-400">إلى</span>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline font-semibold"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'SUMMARY'
                ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ملخص الإقرار
          </button>
          <button
            onClick={() => setActiveTab('SALES')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'SALES'
                ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            تفاصيل المبيعات ({vatReport.salesCount})
          </button>
          <button
            onClick={() => setActiveTab('PURCHASES')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'PURCHASES'
                ? 'bg-white dark:bg-slate-900 text-cyan-700 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            تفاصيل المشتريات ({vatReport.purchasesCount})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Taxable Sales Net */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">إجمالي صوافي المبيعات</span>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {vatReport.totalSalesNet.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
          </div>
          <span className="text-[11px] text-slate-400">قبل إضافة الضريبة</span>
        </div>

        {/* Card 2: Output VAT 14% */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">ضريبة المبيعات المحصلة (14%)</span>
          <div className="text-lg font-bold font-mono text-emerald-800 dark:text-emerald-200">
            +{vatReport.totalSalesVat.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
          </div>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400">ضريبة المخرجات</span>
        </div>

        {/* Card 3: Taxable Purchases */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">إجمالي صوافي المشتريات</span>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {vatReport.totalPurchasesNet.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
          </div>
          <span className="text-[11px] text-slate-400">شراء البضائع والمدخلات</span>
        </div>

        {/* Card 4: Input VAT 14% */}
        <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200/80 dark:border-blue-800/60 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 block">ضريبة المشتريات المخصومة (14%)</span>
          <div className="text-lg font-bold font-mono text-blue-800 dark:text-blue-200">
            -{vatReport.totalPurchasesVat.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
          </div>
          <span className="text-[11px] text-blue-600/80 dark:text-blue-400">ضريبة المدخلات القابلة للخصم</span>
        </div>

        {/* Card 5: Net Payable */}
        <div className="bg-gradient-to-br from-cyan-900 to-cyan-950 text-white p-4 rounded-xl border border-cyan-800 shadow-md space-y-2">
          <span className="text-xs font-semibold text-cyan-200 block">صافي الضريبة الواجبة السداد</span>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {vatReport.netVatPayable.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
          </div>
          <span className="text-[11px] text-cyan-300/80">المبلغ النهائي الملتزم به للهيئة</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'SUMMARY' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600" />
                ملخص إقرار ضريبة القيمة المضافة الرسمي
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">نموذج الإقرار الضريبي لحساب تسوية الضريبة المستحقة</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300 font-semibold">
              الرقم الضريبي: 984-201-512
            </span>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-r-4 border-emerald-600 pr-2">
              أولاً: المبيعات والمخرجات الضريبية
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">البيان</th>
                    <th className="p-3 text-center">عدد الفواتير</th>
                    <th className="p-3 text-center">القيمة الخاضعة للضريبة</th>
                    <th className="p-3 text-center">نسبة الضريبة</th>
                    <th className="p-3 text-center">قيمة الضريبة المحصلة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="p-3 font-semibold">المبيعات المحلية العامة بالسعر العام</td>
                    <td className="p-3 text-center font-mono">{vatReport.salesCount}</td>
                    <td className="p-3 text-center font-mono font-bold">{vatReport.totalSalesNet.toFixed(2)} ج.م</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">14%</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">{vatReport.totalSalesVat.toFixed(2)} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-r-4 border-blue-600 pr-2 pt-2">
              ثانياً: المشتريات والمدخلات الضريبية القابلة للخصم
            </h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">البيان</th>
                    <th className="p-3 text-center">عدد الفواتير</th>
                    <th className="p-3 text-center">القيمة الخاضعة للضريبة</th>
                    <th className="p-3 text-center">نسبة الضريبة</th>
                    <th className="p-3 text-center">قيمة الضريبة المخصومة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  <tr>
                    <td className="p-3 font-semibold">المشتريات المحلية والسلع الخاضعة للضريبة</td>
                    <td className="p-3 text-center font-mono">{vatReport.purchasesCount}</td>
                    <td className="p-3 text-center font-mono font-bold">{vatReport.totalPurchasesNet.toFixed(2)} ج.م</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-600">14%</td>
                    <td className="p-3 text-center font-mono font-bold text-blue-600">{vatReport.totalPurchasesVat.toFixed(2)} ج.م</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-r-4 border-cyan-600 pr-2 pt-2">
              ثالثاً: المقاصة والنتيجة النهائية للإقرار
            </h3>
            <div className="p-4 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-600 dark:text-slate-400 block font-semibold">المعادلة المحاسبية:</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                  {vatReport.totalSalesVat.toFixed(2)} (ضريبة المخرجات) - {vatReport.totalPurchasesVat.toFixed(2)} (ضريبة المدخلات)
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-500 block">الصافي الملتزم بدفعه للهيئة:</span>
                <span className="text-xl font-bold font-mono text-cyan-900 dark:text-cyan-200">
                  {vatReport.netVatPayable.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Sales Details */}
      {activeTab === 'SALES' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3 text-center">الصافي قبل الضريبة</th>
                  <th className="p-3 text-center">الضريبة 14%</th>
                  <th className="p-3 text-center">الإجمالي الشامل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {vatReport.salesList.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-cyan-600">{sale.invoiceNo}</td>
                    <td className="p-3 font-mono">{sale.createdAt.slice(0, 10)}</td>
                    <td className="p-3 font-semibold">{sale.customerName}</td>
                    <td className="p-3 text-center font-mono font-bold">{(sale.subtotal - sale.discount).toFixed(2)} ج.م</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">+{sale.vatAmount.toFixed(2)} ج.م</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">{sale.grandTotal.toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Purchases Details */}
      {activeTab === 'PURCHASES' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">المورد</th>
                  <th className="p-3 text-center">قيمة المشتريات</th>
                  <th className="p-3 text-center">الضريبة المخصومة (14%)</th>
                  <th className="p-3 text-center">الحالة المالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {vatReport.purchasesList.map(pur => {
                  const vat = Math.round((pur.totalAmount - (pur.totalAmount / 1.14)) * 100) / 100;
                  return (
                    <tr key={pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-cyan-600">{pur.invoiceNo}</td>
                      <td className="p-3 font-mono">{pur.createdAt.slice(0, 10)}</td>
                      <td className="p-3 font-semibold">{pur.supplierName}</td>
                      <td className="p-3 text-center font-mono font-bold">{pur.totalAmount.toFixed(2)} ج.م</td>
                      <td className="p-3 text-center font-mono font-bold text-blue-600">-{vat.toFixed(2)} ج.م</td>
                      <td className="p-3 text-center">
                        {pur.isPaid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">مسددة كاش</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">آجل على الحساب</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
