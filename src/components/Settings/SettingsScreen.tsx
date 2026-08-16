import React, { useState } from 'react';
import { Settings, Save, Download, Upload, RotateCcw, Store, FileText, Percent, CheckCircle } from 'lucide-react';
import { getSettings, updateSettings, exportDatabaseJSON, importDatabaseJSON, resetDatabaseToSeedData } from '../../db/dbEngine';
import { SystemSettings } from '../../types';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportDB = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Supermarket_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير: استعادة النسخة الاحتياطية ستؤدي إلى استبدال البيانات الحالية بالبيانات الموجودة بالملف. هل تريد الاستمرار؟')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (importDatabaseJSON(content)) {
          alert('تم استعادة قاعدة البيانات بنجاح!');
          setSettings(getSettings());
        } else {
          alert('فشل استعادة الملف! يرجى التأكد من أن الملف بصيغة JSON صحيحة.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('تحذير شديد: هل أنت متأكد من إعادة ضبط كافة البيانات إلى الحالة الافتراضية؟ سيتم مسح المبيعات والتعديلات الحالية!')) {
      resetDatabaseToSeedData();
      setSettings(getSettings());
      alert('تم إرجاع كافة البيانات الافتراضية بنجاح.');
    }
  };

  return (
    <div className="p-4 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-[calc(100vh-62px)] select-none transition-colors">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-800 dark:text-slate-100">إعدادات النظام والنسخ الاحتياطي</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400">تخصيص بيانات السوبرماركت، نصوص الفاتورة الحرارية، وحفظ استعادة قاعدة البيانات</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            <span>تم حفظ الإعدادات بنجاح!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Store Info */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">بيانات السوبرماركت والشركة</h3>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم السوبرماركت التجاري</label>
            <input
              type="text"
              required
              value={settings.storeName}
              onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الشركة / المالك</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان بالتفصيل</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم الضريبي (Tax ID)</label>
              <input
                type="text"
                value={settings.taxNumber}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Receipt & VAT Settings */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">إعدادات الضرائب والفاتورة الحرارية</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نسبة ضريبة القيمة المضافة (%)</label>
                <input
                  type="number"
                  value={settings.vatRate}
                  onChange={(e) => setSettings({ ...settings, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-center text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-center pt-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={settings.enableVat}
                    onChange={(e) => setSettings({ ...settings, enableVat: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  />
                  <span>تفعيل الضريبة افتراضياً</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ترويسة الفاتورة (Header Text)</label>
              <textarea
                rows={2}
                value={settings.receiptHeader}
                onChange={(e) => setSettings({ ...settings, receiptHeader: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تذييل الفاتورة (Footer Policy Text)</label>
              <textarea
                rows={2}
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>

      </form>

      {/* Database Backup / Restore / Reset Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">نسخ واستعادة قاعدة البيانات بالكامل (JSON)</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleExportDB}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل نسخة احتياطية (JSON)</span>
          </button>

          <label className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer text-center">
            <Upload className="w-4 h-4" />
            <span>استعادة ملف قاعدة بيانات</span>
            <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة ضبط المصنع بالكامل</span>
          </button>
        </div>
      </div>

    </div>
  );
};
