import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Trash2, DollarSign, Calendar, Tag, X, Store } from 'lucide-react';
import { Expense, ExpenseCategory, Branch } from '../../types';
import { 
  getExpenses, saveExpense, deleteExpense, getExpenseCategories, 
  getBranches, subscribeToDB, getBankAccounts 
} from '../../db/dbEngine';

export const ExpensesScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    branchId: 'br_main',
    paymentMethod: 'CASH' as 'CASH' | 'BANK',
    bankAccountId: ''
  });

  const loadData = () => {
    setExpenses(getExpenses());
    setCategories(getExpenseCategories());
    setBranches(getBranches());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDB(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    const cats = getExpenseCategories();
    const brs = getBranches();
    setFormData({
      categoryId: cats.length > 0 ? cats[0].id : '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      branchId: brs.length > 0 ? brs[0].id : 'br_main',
      paymentMethod: 'CASH',
      bankAccountId: ''
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (!formData.categoryId) {
      alert('يرجى اختيار بند المصروف');
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }

    const category = categories.find(c => c.id === formData.categoryId);

    saveExpense({
      categoryId: formData.categoryId,
      categoryName: category ? category.name : 'مصروفات عامة',
      amount: amountVal,
      date: formData.date,
      notes: formData.notes.trim(),
      branchId: formData.branchId,
      paymentMethod: formData.paymentMethod,
      bankAccountId: formData.paymentMethod === 'BANK' ? formData.bankAccountId : undefined,
      createdBy: 'أحمد محمود (المدير)'
    });

    setShowModal(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا المصروف؟')) {
      deleteExpense(id);
      loadData();
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'ALL' || exp.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto space-y-4 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">إدارة المصروفات التشغيلية والنثريات</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">تسجيل الإيجارات، الفواتير، المرتبات، والصيانات مع الخصم التلقائي من الخزينة</p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">عدد المصروفات المسجلة</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{expenses.length}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي المصروفات</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalExpensesAmount.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في البيان أو الملاحظات..."
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold"
        >
          <option value="ALL">جميع بنود المصروفات</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">بند المصروف</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">الفرع</th>
                <th className="p-3">الملاحظات والبيان</th>
                <th className="p-3">المُدخل</th>
                <th className="p-3 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono dir-ltr text-right text-slate-500">{exp.date}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{exp.categoryName}</td>
                    <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-400">{exp.amount.toLocaleString()} ج.م</td>
                    <td className="p-3 text-slate-500">{branches.find(b => b.id === exp.branchId)?.name || 'الرئيسي'}</td>
                    <td className="p-3 text-slate-500 max-w-[250px] truncate">{exp.notes || '-'}</td>
                    <td className="p-3 text-slate-500">{exp.createdBy}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                        title="حذف المصروف"
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
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                تسجيل مصروف جديد (خصم من الخزينة)
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">بند المصروف *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-rose-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">تاريخ المصروف *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الفرع الخاص بالمصروف</label>
                <select
                  value={formData.branchId}
                  onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">البيان / ملاحظات التفاصيل</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  placeholder="مثال: فاتورة الكهرباء لشهر أغسطس للفرع الرئيسي..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  حفظ وخصم من الخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
