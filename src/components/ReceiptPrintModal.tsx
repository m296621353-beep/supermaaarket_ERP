import React, { useEffect } from 'react';
import { Printer, Check, X } from 'lucide-react';
import { Sale } from '../types';
import { getSettings } from '../db/dbEngine';

interface ReceiptPrintModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ sale, onClose }) => {
  const settings = getSettings();

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || (e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'ح')) || (e.ctrlKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 transition cursor-pointer"
          title="إغلاق (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">تم إتمام العملية بنجاح!</h3>
          <p className="text-xs text-slate-500">فاتورة بيع رقم: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sale.invoiceNo}</span></p>
        </div>

        {/* Thermal Receipt Preview Area */}
        <div id="thermal-receipt" className="bg-amber-50/60 dark:bg-slate-900 p-4 rounded-xl border border-dashed border-amber-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs space-y-3 print:bg-white print:p-0 print:border-none print:text-black">
          
          {/* Store Header */}
          <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3 space-y-1">
            <h2 className="font-extrabold text-sm font-sans">{settings.storeName}</h2>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-sans">{settings.address}</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">هاتف: {settings.phone}</p>
            <div className="text-[9px] text-slate-500 flex justify-center gap-2 pt-1 font-sans">
              <span>س.ت: {settings.commercialReg}</span>
              <span>بطاقة ضريبية: {settings.taxNumber}</span>
            </div>
          </div>

          {/* Transaction Metadata */}
          <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
            <div className="flex justify-between">
              <span>التاريخ:</span>
              <span>{new Date(sale.createdAt).toLocaleDateString('ar-EG')}</span>
            </div>
            <div className="flex justify-between">
              <span>الوقت:</span>
              <span>{new Date(sale.createdAt).toLocaleTimeString('ar-EG')}</span>
            </div>
            <div className="flex justify-between">
              <span>الكاشير:</span>
              <span>{sale.createdBy}</span>
            </div>
            <div className="flex justify-between">
              <span>العميل:</span>
              <span>{sale.customerName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-b border-dashed border-slate-300 dark:border-slate-700 pb-2 space-y-1.5">
            <div className="flex justify-between font-bold text-[10px] text-slate-500 border-b pb-1">
              <span>الصنف</span>
              <span>الكمية × السعر</span>
              <span>الإجمالي</span>
            </div>
            {sale.items?.map((item, i) => (
              <div key={i} className="text-[11px]">
                <div className="font-bold font-sans">{item.productName}</div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[10px]">
                  <span>{item.qty} {item.unitName} × {item.unitPrice.toFixed(2)}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.total.toFixed(2)} ج.م</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span>{sale.subtotal.toFixed(2)} ج.م</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم:</span>
                <span>-{sale.discount.toFixed(2)} ج.م</span>
              </div>
            )}
            {sale.vatAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>ضريبة القيمة المضافة ({sale.vatRate}%):</span>
                <span>+{sale.vatAmount.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
              <span>الإجمالي النهائي:</span>
              <span className="text-emerald-600 font-mono">{sale.grandTotal.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>المدفوع نقداً:</span>
              <span>{sale.paidAmount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>الباقي للعميل:</span>
              <span>{sale.changeAmount.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 text-[10px] text-slate-500 font-sans space-y-1">
            <p className="font-bold">{settings.receiptHeader}</p>
            <p>{settings.receiptFooter}</p>
            <div className="pt-2 font-mono text-[9px] text-slate-400">||| |||| ||||| |||| |||</div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition cursor-pointer"
            title="طباعة (Enter أو Alt+P)"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصال (Enter)</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
            title="إغلاق (Esc)"
          >
            إغلاق (Esc)
          </button>
        </div>

      </div>
    </div>
  );
};
