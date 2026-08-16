import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, DollarSign, CreditCard, Search, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TreasuryTransaction, BankAccount, Branch } from '../../types';
import { 
  getTreasuryTransactions, addTreasuryTransaction, getTreasuryBalance, 
  getBankAccounts, saveBankAccount, deleteBankAccount, getBranches, subscribeToDB 
} from '../../db/dbEngine';

export const TreasuryScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cashBalance, setCashBalance] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'TREASURY' | 'BANKS'>('TREASURY');

  // Modals
  const [showTxModal, setShowTxModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Manual Tx Form
  const [txType, setTxType] = useState<'IN' | 'OUT'>('IN');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txBranchId, setTxBranchId] = useState('br_main');

  // Bank Form
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [bankBalance, setBankBalance] = useState('');

  const loadData = () => {
    setTransactions(getTreasuryTransactions());
    setBankAccounts(getBankAccounts());
    setBranches(getBranches());
    setCashBalance(getTreasuryBalance());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDB(loadData);
    return () => unsubscribe();
  }, []);

  const handleOpenTxModal = (type: 'IN' | 'OUT') => {
    setTxType(type);
    setTxAmount('');
    setTxDescription('');
    if (branches.length > 0) setTxBranchId(branches[0].id);
    setShowTxModal(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    if (!txDescription.trim()) {
      alert('يرجى إدخال وصف المعاملة');
      return;
    }

    addTreasuryTransaction({
      type: txType,
      amount: amountVal,
      source: 'MANUAL',
      description: txDescription.trim(),
      branchId: txBranchId,
      createdBy: 'أحمد محمود (المدير)'
    });

    setShowTxModal(false);
    loadData();
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) {
      alert('يرجى إدخال اسم البنك ورقم الحساب');
      return;
    }

    saveBankAccount({
      id: `bank_${Date.now()}`,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
      balance: parseFloat(bankBalance) || 0,
      updatedAt: new Date().toISOString()
    });

    setShowBankModal(false);
    setBankName('');
    setAccountNumber('');
    setIban('');
    setBankBalance('');
    loadData();
  };

  const handleDeleteBank = (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف حساب "${name}"؟`)) {
      deleteBankAccount(id);
      loadData();
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tx.referenceId && tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalIn = transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);

  return (
    <div className="h-full flex flex-col p-3 sm:p-6 overflow-y-auto space-y-4 pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">إدارة الخزينة الرئيسية والحسابات البنكية</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">متابعة حركة السيولة النقدية، التحصيلات، السحوبات والحسابات البنكية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenTxModal('IN')}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>إيداع نقدي</span>
          </button>
          <button
            onClick={() => handleOpenTxModal('OUT')}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>صرف نقدي</span>
          </button>
        </div>
      </div>

      {/* Main Liquidity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cash Treasury Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">رصيد الخزينة النقدي الحالي</span>
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-emerald-400 font-mono">{cashBalance.toLocaleString()} <span className="text-sm">ج.م</span></p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-300">
              <span className="text-emerald-300">وارد: +{totalIn.toLocaleString()}</span>
              <span>•</span>
              <span className="text-rose-300">صادر: -{totalOut.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bank Balances */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي الأرصدة البنكية</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-slate-800 dark:text-slate-100 font-mono">{totalBankBalance.toLocaleString()} <span className="text-sm">ج.م</span></p>
            <p className="text-[10px] text-slate-400 mt-1">{bankAccounts.length} حسابات بنكية مسجلة</p>
          </div>
        </div>

        {/* Net Liquidity Sum */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">إجمالي السيولة النقدية والبنكية</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{(cashBalance + totalBankBalance).toLocaleString()} <span className="text-sm">ج.م</span></p>
            <p className="text-[10px] text-slate-400 mt-1">المجموع الكلي المتاح للعمليات</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('TREASURY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'TREASURY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            حركة الخزينة والسيولة (سجل المعاملات)
          </button>
          <button
            onClick={() => setActiveTab('BANKS')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'BANKS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            الحسابات البنكية ({bankAccounts.length})
          </button>
        </div>

        {activeTab === 'BANKS' && (
          <button
            onClick={() => setShowBankModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة حساب بنكي</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'TREASURY' ? (
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Search */}
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في وصف المعاملات أو المراجع..."
                className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                  <tr>
                    <th className="p-3">نوع المعاملة</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">مصدر الحركة</th>
                    <th className="p-3">البيان / الوصف</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">المسؤول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        لا توجد معاملات مسجلة في الخزينة
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'IN'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                          }`}>
                            {tx.type === 'IN' ? (
                              <><ArrowDownLeft className="w-3 h-3" /> إيداع (وارد)</>
                            ) : (
                              <><ArrowUpRight className="w-3 h-3" /> صرف (صادر)</>
                            )}
                          </span>
                        </td>
                        <td className={`p-3 font-mono font-black text-sm ${
                          tx.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {tx.type === 'IN' ? '+' : '-'}{tx.amount.toLocaleString()} ج.م
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 font-semibold">
                            {tx.source === 'SALE' ? 'مبيعات' : tx.source === 'PURCHASE' ? 'مشتريات' : tx.source === 'EXPENSE' ? 'مصروفات' : 'يدوي / تسوية'}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{tx.description}</td>
                        <td className="p-3 font-mono dir-ltr text-right text-slate-500">
                          {new Date(tx.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 text-slate-500">{tx.createdBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Banks Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bankAccounts.map((account) => (
            <div key={account.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 relative group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-xl">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{account.bankName}</h3>
                    <p className="text-[11px] font-mono text-slate-500">رقم الحساب: {account.accountNumber}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBank(account.id, account.bankName)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                  title="حذف الحساب"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {account.iban && (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-300 dir-ltr text-left">
                  IBAN: {account.iban}
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-700/60 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">الرصيد المتاح:</span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{account.balance.toLocaleString()} ج.م</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Deposit / Withdrawal Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between ${
              txType === 'IN' ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-rose-50 dark:bg-rose-950/40'
            }`}>
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {txType === 'IN' ? (
                  <><ArrowDownLeft className="w-4 h-4 text-emerald-600" /> <span>إيداع نقدي جديد في الخزينة</span></>
                ) : (
                  <><ArrowUpRight className="w-4 h-4 text-rose-600" /> <span>صرف / سحب نقدي من الخزينة</span></>
                )}
              </h2>
              <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">بيان ووصف المعاملة *</label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={e => setTxDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  placeholder={txType === 'IN' ? 'مثال: رأس مال إضافي، تحصيل جاري...' : 'مثال: سحب أرباح شخصية، مسحوبات...'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الفرع</label>
                <select
                  value={txBranchId}
                  onChange={e => setTxBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs rounded-xl text-white font-bold shadow-xs ${
                    txType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  تأكيد {txType === 'IN' ? 'الإيداع' : 'الصرف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                إضافة حساب بنكي جديد
              </h2>
              <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم البنك *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  placeholder="مثال: البنك الأهلي المصري"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم الحساب *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  placeholder="1000-xxxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">رقم IBAN (اختياري)</label>
                <input
                  type="text"
                  value={iban}
                  onChange={e => setIban(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  placeholder="EG..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الرصيد الافتتاحي (ج.م)</label>
                <input
                  type="number"
                  value={bankBalance}
                  onChange={e => setBankBalance(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
