import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, ArrowLeftRight, ArrowUpRight, ArrowDownLeft, 
  Search, RefreshCw, CreditCard, DollarSign, FileText, CheckCircle2, AlertCircle, Edit2, Trash2
} from 'lucide-react';
import { BankAccount, BankTransaction } from '../../types';
import { 
  getBankAccounts, getBankTransactions, getBankAccountBalance, 
  saveBankAccount, deleteBankAccount, transferTreasuryBank, getTreasuryBalance 
} from '../../db/dbEngine';

export const BankingScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions'>('accounts');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Bank Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [initialBalance, setInitialBalance] = useState<number>(0);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'DEPOSIT_TO_BANK' | 'WITHDRAW_FROM_BANK'>('DEPOSIT_TO_BANK');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferMessage, setTransferMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    const bankAccs = getBankAccounts();
    setAccounts(bankAccs);
    setTransactions(getBankTransactions());
    setTreasuryBalance(getTreasuryBalance());
    if (bankAccs.length > 0 && !selectedBankId) {
      setSelectedBankId(bankAccs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBankBalance = accounts.reduce((sum, b) => sum + getBankAccountBalance(b.id), 0);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) {
      alert('يرجى إدخال اسم البنك ورقم الحساب');
      return;
    }

    const accountToSave: BankAccount = {
      id: editingAccount ? editingAccount.id : 'bank_' + Date.now(),
      bankName,
      accountNumber,
      iban,
      balance: Number(initialBalance) || 0,
      updatedAt: new Date().toISOString()
    };

    saveBankAccount(accountToSave);
    setIsAccountModalOpen(false);
    resetAccountForm();
    loadData();
  };

  const resetAccountForm = () => {
    setEditingAccount(null);
    setBankName('');
    setAccountNumber('');
    setIban('');
    setInitialBalance(0);
  };

  const handleEditAccount = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bankName);
    setAccountNumber(acc.accountNumber);
    setIban(acc.iban || '');
    setInitialBalance(acc.balance);
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا الحساب البنكي؟')) {
      deleteBankAccount(id);
      loadData();
    }
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!selectedBankId || isNaN(amount) || amount <= 0) {
      setTransferMessage({ text: 'يرجى اختيار البنك وإدخال مبلغ صحيح أكبر من صفر', type: 'error' });
      return;
    }

    if (transferDirection === 'DEPOSIT_TO_BANK' && amount > treasuryBalance) {
      setTransferMessage({ text: `الرصيد المتاح بالخزينة النقدية (${treasuryBalance.toFixed(2)} ج.م) غير كافٍ لإتمام هذا التحويل`, type: 'error' });
      return;
    }

    const currentBankBal = getBankAccountBalance(selectedBankId);
    if (transferDirection === 'WITHDRAW_FROM_BANK' && amount > currentBankBal) {
      setTransferMessage({ text: `الرصيد المتاح بالحساب البنكي (${currentBankBal.toFixed(2)} ج.م) غير كافٍ للسحب`, type: 'error' });
      return;
    }

    try {
      transferTreasuryBank({
        direction: transferDirection,
        bankAccountId: selectedBankId,
        amount,
        description: transferNotes || (transferDirection === 'DEPOSIT_TO_BANK' ? 'إيداع بنكي من الخزينة' : 'سحب بنكي للخزينة'),
        createdBy: 'أحمد محمود (المدير)'
      });

      setTransferMessage({ text: 'تمت عملية التحويل وإصدار القيد المحاسبي التلقائي بنجاح!', type: 'success' });
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferAmount('');
        setTransferNotes('');
        setTransferMessage(null);
        loadData();
      }, 1200);
    } catch (err: any) {
      setTransferMessage({ text: err.message || 'حدث خطأ أثناء إجراء التحويل', type: 'error' });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const bank = accounts.find(a => a.id === t.bankAccountId);
    const text = `${t.description} ${bank?.bankName || ''} ${t.amount}`.toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-800 dark:text-slate-100">إدارة البنوك والتحويلات النقدية</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">متابعة حسابات البنوك والتحويل بين الخزينة والبنك مع ربط محاسبي آلي</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              resetAccountForm();
              setIsAccountModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>حساب بنكي جديد</span>
          </button>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>تحويل نقدي / بنكي</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">إجمالي أرصدة البنوك</span>
            <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="font-black text-2xl text-slate-800 dark:text-slate-100">
            {totalBankBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500">في {accounts.length} حسابات بنكية مسجلة</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">رصيد الخزينة النقدية الحالية</span>
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
            {treasuryBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500">جاهزة للتحويل أو الإيداع البنكي</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">عدد الحركات البنكية المسجلة</span>
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="font-black text-2xl text-slate-800 dark:text-slate-100">
            {transactions.length} <span className="text-xs text-slate-500 font-bold">حركة</span>
          </div>
          <div className="text-[11px] text-slate-500">إيداعات وسحوبات موثقة بالمستندات</div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>قائمة الحسابات البنكية ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-sky-600 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>كشف حركات البنوك ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: Bank Accounts Grid */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const currentBal = getBankAccountBalance(acc.id);
            return (
              <div key={acc.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4 hover:border-sky-300 transition">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center font-black">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{acc.bankName}</h3>
                      <p className="text-xs text-slate-500 font-mono dir-ltr text-right">{acc.accountNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditAccount(acc)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-500">الرصيد المتاح بالحساب</div>
                  <div className="font-black text-2xl text-sky-600 dark:text-sky-400">
                    {currentBal.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">ج.م</span>
                  </div>
                </div>

                {acc.iban && (
                  <div className="bg-slate-50 dark:bg-slate-700/40 p-2.5 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-300 dir-ltr truncate">
                    <span className="font-bold text-slate-400 select-none mr-2 dir-rtl">IBAN:</span>
                    {acc.iban}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                  <span>آخر تحديث: {new Date(acc.updatedAt).toLocaleDateString('ar-EG')}</span>
                  <button
                    onClick={() => {
                      setSelectedBankId(acc.id);
                      setIsTransferModalOpen(true);
                    }}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>إجراء تحويل</span>
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Transactions Log */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden space-y-4 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في الحركات البنكية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">البنك والحساب</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">المبلغ (ج.م)</th>
                  <th className="p-3">البيان والتفاصيل</th>
                  <th className="p-3">بواسطة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-200">
                {filteredTransactions.map(tx => {
                  const bank = accounts.find(a => a.id === tx.bankAccountId);
                  const isDeposit = tx.type === 'DEPOSIT';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                      <td className="p-3 font-mono text-slate-500 dir-ltr text-right">
                        {new Date(tx.createdAt).toLocaleString('ar-EG')}
                      </td>
                      <td className="p-3 font-bold">
                        {bank ? bank.bankName : 'حساب بنكي'}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                          isDeposit 
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}>
                          {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{isDeposit ? 'إيداع بنكي' : 'سحب بنكي'}</span>
                        </span>
                      </td>
                      <td className={`p-3 font-black font-mono text-sm ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isDeposit ? '+' : '-'}{tx.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 font-medium">{tx.description}</td>
                      <td className="p-3 text-slate-500">{tx.createdBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Bank Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {editingAccount ? 'تعديل بيانات الحساب البنكي' : 'إضافة حساب بنكي جديد'}
              </h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم البنك *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: البنك الأهلي المصري، بنك مصر..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الحساب البنكي *</label>
                <input
                  type="text"
                  required
                  placeholder="رقم الحساب..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 font-mono dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الآيبان IBAN (اختياري)</label>
                <input
                  type="text"
                  placeholder="EG..."
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 font-mono dir-ltr text-right"
                />
              </div>

              {!editingAccount && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الرصيد الافتتاحي (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>
              )}

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-extrabold hover:bg-emerald-700 transition"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Cash <-> Bank Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <ArrowLeftRight className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">تحويل بين الخزينة والبنك</h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            {transferMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                transferMessage.type === 'success' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200'
              }`}>
                {transferMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{transferMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اتجاه التحويل *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferDirection('DEPOSIT_TO_BANK')}
                    className={`p-2.5 rounded-xl font-bold border transition text-center ${
                      transferDirection === 'DEPOSIT_TO_BANK'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    إيداع (خزينة ⬅️ بنك)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDirection('WITHDRAW_FROM_BANK')}
                    className={`p-2.5 rounded-xl font-bold border transition text-center ${
                      transferDirection === 'WITHDRAW_FROM_BANK'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    سحب (بنك ⬅️ خزينة)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الحساب البنكي *</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - ({acc.accountNumber}) - رصيده: {getBankAccountBalance(acc.id).toFixed(2)} ج.م
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ التحويل (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 font-black text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">البيان وملاحظات القيد</label>
                <input
                  type="text"
                  placeholder="سبب التحويل أو رقم الإيصال..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
                <p className="font-bold">القيد المحاسبي المولد تلقائياً:</p>
                {transferDirection === 'DEPOSIT_TO_BANK' ? (
                  <p>من حـ/ البنك (1102) مدين ⬅️ إلى حـ/ الصندوق الخزينة (1101) دائن</p>
                ) : (
                  <p>من حـ/ الصندوق الخزينة (1101) مدين ⬅️ إلى حـ/ البنك (1102) دائن</p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl font-extrabold hover:bg-sky-700 transition"
                >
                  تأكيد وإصدار القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
