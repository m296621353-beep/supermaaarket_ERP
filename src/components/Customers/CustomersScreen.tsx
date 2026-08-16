import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, DollarSign, Phone, MapPin, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Customer } from '../../types';
import { getCustomers, saveCustomer, deleteCustomer, subscribeToDB } from '../../db/dbEngine';

export const CustomersScreen: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    address: '',
    creditLimit: '10000',
    balance: '0'
  });

  const loadData = () => {
    setCustomers(getCustomers());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDB(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    const nextCode = `CUST-0${customers.length + 1}`;
    setFormData({
      code: nextCode,
      name: '',
      phone: '',
      address: '',
      creditLimit: '10000',
      balance: '0'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      code: customer.code || '',
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      creditLimit: customer.creditLimit.toString(),
      balance: customer.balance.toString()
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust_${Date.now()}`,
      code: formData.code.trim() || `CUST-${Date.now().toString().slice(-4)}`,
      name: formData.name.trim(),
      phone: formData.phone.trim() || '-',
      address: formData.address.trim(),
      creditLimit: parseFloat(formData.creditLimit) || 0,
      balance: parseFloat(formData.balance) || 0,
      createdAt: editingCustomer?.createdAt || new Date().toISOString()
    };

    saveCustomer(customerToSave);
    setShowModal(false);
    loadData();
  };

  const handleDelete = (id: string, name: string) => {
    if (id === 'cust_cash') {
      alert('لا يمكن حذف العميل النقدي الافتراضي للنظام!');
      return;
    }
    if (confirm(`هل أنت تأكد من حذف العميل "${name}"؟`)) {
      deleteCustomer(id);
      loadData();
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const totalCustomers = customers.length;
  const totalReceivables = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const overCreditCount = customers.filter(c => c.balance > c.creditLimit && c.creditLimit > 0).length;

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto space-y-4 pb-28">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">سجل العملاء وإدارة الحسابات</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">إدارة بيانات العملاء، حدود الائتمان، ومتابعة الأرصدة والديون المستحقة</p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي العملاء</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalCustomers}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي المستحقات (ديون للشركة)</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalReceivables.toLocaleString()} ج.م</p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">عملاء تجاوزوا حد الائتمان</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{overCreditCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، كود العميل، أو رقم الهاتف..."
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3">اسم العميل</th>
                <th className="p-3">رقم الهاتف</th>
                <th className="p-3">العنوان</th>
                <th className="p-3">حد الائتمان</th>
                <th className="p-3">الرصيد الحالي</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    لا يوجد عملاء مطبقون لشروط البحث
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isOverCredit = cust.balance > cust.creditLimit && cust.creditLimit > 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                      <td className="p-3 font-mono text-slate-500 font-bold">{cust.code || '-'}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>{cust.name}</span>
                        {cust.id === 'cust_cash' && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold">افتراضي</span>
                        )}
                      </td>
                      <td className="p-3 dir-ltr text-right font-mono">{cust.phone}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{cust.address || '-'}</td>
                      <td className="p-3 font-mono">{cust.creditLimit ? `${cust.creditLimit.toLocaleString()} ج.م` : 'بدون حد'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          cust.balance > 0 
                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' 
                            : cust.balance < 0 
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {cust.balance > 0 ? `عليه ${cust.balance.toLocaleString()} ج.م` : cust.balance < 0 ? `له ${Math.abs(cust.balance).toLocaleString()} ج.م` : 'خالص (0)'}
                          {isOverCredit && (
                            <span className="text-[9px] px-1 bg-amber-500 text-white rounded font-black">تجاوز الائتمان</span>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {cust.id !== 'cust_cash' && (
                            <button
                              onClick={() => handleDelete(cust.id, cust.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">كود العميل</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  placeholder="CUST-01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  placeholder="مثال: شركة النور للتجارة"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  placeholder="01012345678"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">العنوان (اختياري)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  placeholder="المحافظة - المنطقة - الشارع"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">حد الائتمان (ج.م)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={e => setFormData({ ...formData, creditLimit: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الرصيد الابتدائي (ج.م)</label>
                  <input
                    type="number"
                    value={formData.balance}
                    onChange={e => setFormData({ ...formData, balance: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>
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
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
