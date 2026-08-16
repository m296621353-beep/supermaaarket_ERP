import React, { useEffect } from 'react';
import { Keyboard, X, Sparkles, Command, CheckCircle2 } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutSections = [
    {
      title: '🛒 شاشة الكاشير ونقطة البيع (POS)',
      color: 'emerald',
      shortcuts: [
        { key: 'F2', altKey: 'NumPad + / Ctrl+Enter', desc: 'إتمام البيع والدفع السريع المباشر', highlight: true },
        { key: 'F3', altKey: 'Alt + B', desc: 'التركيز الفوري على حقل مسح الباركود' },
        { key: 'F4', altKey: 'Alt + S', desc: 'التركيز على حقل البحث في المنتجات بالاسم' },
        { key: 'F6', altKey: 'Alt + H', desc: 'تعليق الفاتورة الحالية كمسودة مؤقتة' },
        { key: 'F7', altKey: 'Alt + R', desc: 'استرجاع الفواتير والمسودات المعلقة' },
        { key: 'F8', altKey: 'Alt + D', desc: 'إرسال أمر فتح درج النقدية الإلكتروني' },
        { key: 'F9', altKey: 'Alt + C', desc: 'نافذة إضافة وتسجيل عميل جديد سريعاً' },
        { key: 'F10', altKey: 'Alt + K', desc: 'تطبيق نسبة خصم (%) على إجمالي الفاتورة' },
        { key: 'Alt + P', altKey: 'Ctrl + P', desc: 'طباعة الإيصال / إعادة طباعة آخر فاتورة' },
        { key: 'Alt + X', altKey: 'Delete / Backspace', desc: 'تفريغ محتويات سلة المبيعات بالكامل' },
      ]
    },
    {
      title: '⚡ التنقل السريع بين شاشات النظام',
      color: 'sky',
      shortcuts: [
        { key: 'Alt + 1', desc: 'الشاشة الرئيسية - لوحة التحكم والتحليلات' },
        { key: 'Alt + 2', desc: 'شاشة الكاشير ونقطة البيع (POS)' },
        { key: 'Alt + 3', desc: 'المشتريات وفواتير التوريد' },
        { key: 'Alt + 4', desc: 'إدارة المنتجات والمخزون والمستودعات' },
        { key: 'Alt + 5', desc: 'الخزينة النقدية الرئيسية' },
        { key: 'Alt + 6', desc: 'الحسابات البنكية والتحويلات' },
        { key: 'Alt + 7', desc: 'مسيرات الرواتب وأجور الموظفين' },
        { key: 'Alt + 8', desc: 'الحسابات العامة ودفتر الأستاذ' },
        { key: 'Alt + 9', desc: 'التقارير المتقدمة والقوائم المالية' },
        { key: 'Alt + 0', desc: 'الإعدادات والنسخ الاحتياطي' },
      ]
    },
    {
      title: '🛠️ أدوات عامة ومفاتيح التحكم',
      color: 'amber',
      shortcuts: [
        { key: 'F1', altKey: 'Shift + ?', desc: 'فتح / إغلاق دليل اختصارات الكيبورد (هذه النافذة)' },
        { key: 'F11', altKey: 'Alt + Enter', desc: 'تفعيل / إلغاء وضع ملء الشاشة (Fullscreen)' },
        { key: 'Esc', desc: 'إغلاق أي نافذة منبثقة مفتوحة والرجوع للشاشة' },
        { key: 'Tab', desc: 'التنقل المتتابع بين حقول الإدخال والأزرار' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>دليل ومساعد اختصارات لوحة المفاتيح</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  سريعة ومضمونة 100%
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تم تخصيص واختبار الاختصارات لتجنب أي تعارض مع المتصفح، وتعمل بمفاتيح F المباشرة ومفاتيح Alt البديلة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="إغلاق (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {shortcutSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-700">
                {section.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {section.shortcuts.map((sc, scIdx) => (
                  <div
                    key={scIdx}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      sc.highlight
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80 shadow-xs'
                        : 'bg-slate-50/60 dark:bg-slate-700/30 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100/70 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-200 leading-snug">
                      {sc.desc}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <kbd className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black font-mono text-[11px] rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs">
                        {sc.key}
                      </kbd>
                      {sc.altKey && (
                        <>
                          <span className="text-slate-400 text-[10px]">أو</span>
                          <kbd className="px-2 py-1 bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold font-mono text-[10px] rounded-lg border border-slate-300/80 dark:border-slate-600 shadow-2xs">
                            {sc.altKey}
                          </kbd>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>نصيحة: يمكنك في أي وقت الضغط على مفتاح <strong className="text-slate-700 dark:text-slate-200">F1</strong> لفتح هذا الدليل السريع.</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-xs transition cursor-pointer"
          >
            فهمت، إغلاق الدليل
          </button>
        </div>

      </div>
    </div>
  );
};
