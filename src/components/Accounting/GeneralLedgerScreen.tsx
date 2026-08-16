import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Layers, FileText, Scale, Building2, Plus, Search, Calendar, 
  CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft, Eye, RefreshCw, X, Shield, Filter,
  Folder, FolderOpen, ChevronDown, ChevronLeft, List, GitFork, ArrowLeft, Table
} from 'lucide-react';
import { Account, JournalEntry, FixedAsset, RolePermissions } from '../../types';
import { 
  getAccounts, saveAccount, deleteAccount, 
  getJournalEntries, addJournalEntry, 
  getAccountLedger, getTrialBalance, LedgerTransaction, TrialBalanceItem,
  getFixedAssets, saveFixedAsset, deleteFixedAsset, runDepreciationForAsset,
  subscribeToDB 
} from '../../db/dbEngine';

interface GeneralLedgerScreenProps {
  permissions?: RolePermissions;
}

export const GeneralLedgerScreen: React.FC<GeneralLedgerScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'ENTRIES' | 'LEDGER' | 'TRIAL_BALANCE' | 'FIXED_ASSETS'>('ACCOUNTS');
  const [accountViewMode, setAccountViewMode] = useState<'TABLE' | 'TREE'>('TREE');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  
  // Data states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('1101');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  // Modals
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [selectedEntryDetails, setSelectedEntryDetails] = useState<JournalEntry | null>(null);

  // Form states
  const [accountFormData, setAccountFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET' as Account['type'],
    parentId: '',
    notes: ''
  });

  const [entryFormData, setEntryFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    referenceNo: '',
    lines: [
      { id: '1', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
      { id: '2', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
    ]
  });

  const [assetFormData, setAssetFormData] = useState({
    code: '',
    name: '',
    category: 'معدات وأجهزة',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: '',
    salvageValue: '0',
    usefulLifeYears: '5',
    notes: ''
  });

  const loadData = () => {
    const accs = getAccounts();
    setAccounts(accs);
    setJournalEntries(getJournalEntries());
    setFixedAssets(getFixedAssets());
    if (accs.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDB(loadData);
    return () => unsubscribe();
  }, []);

  // Handler: Add Account
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountFormData.code.trim() || !accountFormData.name.trim()) {
      alert('يرجى ملء كود اسم الحساب بالكامل');
      return;
    }
    saveAccount({
      id: 'acc_' + accountFormData.code,
      code: accountFormData.code.trim(),
      name: accountFormData.name.trim(),
      type: accountFormData.type,
      parentId: accountFormData.parentId || undefined,
      balance: 0,
      isSystem: false,
      isHeader: false
    });
    setShowAddAccountModal(false);
    setAccountFormData({ code: '', name: '', type: 'ASSET', parentId: '', notes: '' });
  };

  // Handler: Add Manual Journal Entry
  const handleAddLine = () => {
    setEntryFormData(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        { id: String(Date.now()), accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
      ]
    }));
  };

  const handleRemoveLine = (id: string) => {
    if (entryFormData.lines.length <= 2) {
      alert('القيد المحاسبي يتطلب طرفين على الأقل (مدين ودائن)');
      return;
    }
    setEntryFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(l => l.id !== id)
    }));
  };

  const handleLineChange = (id: string, field: string, value: any) => {
    setEntryFormData(prev => ({
      ...prev,
      lines: prev.lines.map(l => {
        if (l.id !== id) return l;
        if (field === 'accountId') {
          const acc = accounts.find(a => a.id === value);
          return {
            ...l,
            accountId: value,
            accountCode: acc?.code || '',
            accountName: acc?.name || ''
          };
        }
        return { ...l, [field]: value };
      })
    }));
  };

  const totalEntryDebit = entryFormData.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalEntryCredit = entryFormData.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isEntryBalanced = Math.abs(totalEntryDebit - totalEntryCredit) < 0.01 && totalEntryDebit > 0;
  const entryDiff = Math.abs(totalEntryDebit - totalEntryCredit);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryFormData.description.trim()) {
      alert('يرجى إدخال البيان العام للقيد');
      return;
    }
    if (totalEntryDebit <= 0) {
      alert('يرجى إدخال مبالغ صالحة للقيد');
      return;
    }
    if (Math.abs(totalEntryDebit - totalEntryCredit) > 0.01) {
      alert(`القيد غير متوازن! إجمالي المدين (${totalEntryDebit.toFixed(2)}) لا يساوي إجمالي الدائن (${totalEntryCredit.toFixed(2)}). الفرق: ${entryDiff.toFixed(2)} ج.م`);
      return;
    }
    // Check missing accounts
    const hasMissingAccount = entryFormData.lines.some(l => !l.accountId);
    if (hasMissingAccount) {
      alert('يرجى اختيار الحساب لجميع أطراف القيد');
      return;
    }

    addJournalEntry({
      date: entryFormData.date,
      source: 'MANUAL',
      referenceNo: entryFormData.referenceNo || 'يدوي',
      description: entryFormData.description,
      lines: entryFormData.lines,
      createdBy: 'المدير المالي'
    });

    setShowAddEntryModal(false);
    setEntryFormData({
      date: new Date().toISOString().slice(0, 10),
      description: '',
      referenceNo: '',
      lines: [
        { id: '1', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' },
        { id: '2', accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, description: '' }
      ]
    });
  };

  // Handler: Save Fixed Asset
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(assetFormData.purchaseCost);
    if (!assetFormData.code || !assetFormData.name || isNaN(cost) || cost <= 0) {
      alert('يرجى تعبئة كافة بيانات الأصل الثابت وقيمة الشراء بشكل صحيح');
      return;
    }
    const salvage = parseFloat(assetFormData.salvageValue) || 0;
    const life = parseInt(assetFormData.usefulLifeYears) || 5;

    saveFixedAsset({
      id: 'fa_' + Date.now(),
      code: assetFormData.code,
      name: assetFormData.name,
      category: assetFormData.category,
      purchaseDate: assetFormData.purchaseDate,
      purchaseCost: cost,
      salvageValue: salvage,
      usefulLifeYears: life,
      accumDepreciation: 0,
      netBookValue: cost,
      status: 'ACTIVE'
    });

    setShowAddAssetModal(false);
    setAssetFormData({
      code: '',
      name: '',
      category: 'معدات وأجهزة',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseCost: '',
      salvageValue: '0',
      usefulLifeYears: '5',
      notes: ''
    });
  };

  // Handler: Depreciation execution
  const handleRunDepreciation = (assetId: string) => {
    try {
      const result = runDepreciationForAsset(assetId, 'المدير المالي');
      alert(`تم تسجيل قيد الإهلاك الشهري بنجاح!\nالأصل: ${result.asset.name}\nقيمة الإهلاك: ${result.depAmount.toFixed(2)} ج.م\nرقم القيد التلقائي: ${result.journalEntry.entryNo}`);
      loadData();
    } catch (err: any) {
      alert('حدث خطأ أثناء إجراء الإهلاك: ' + err.message);
    }
  };

  // Calculations for views
  const ledgerData = getAccountLedger(selectedAccountId, startDate, endDate);
  const trialBalance = getTrialBalance(asOfDate);

  // Dynamic Live Account Balance Resolver
  const getAccountLiveBalance = (account: Account): number => {
    const tbItem = trialBalance.items.find(i => i.accountCode === account.code);
    if (tbItem) {
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        return tbItem.debitBalance > 0 ? tbItem.debitBalance : (tbItem.creditBalance > 0 ? -tbItem.creditBalance : 0);
      } else {
        return tbItem.creditBalance > 0 ? tbItem.creditBalance : (tbItem.debitBalance > 0 ? -tbItem.debitBalance : 0);
      }
    }
    return typeof account.balance === 'number' ? account.balance : 0;
  };

  // Filtered lists
  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = 
      (a.code || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = accountTypeFilter === 'ALL' || a.type === accountTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredEntries = journalEntries.filter(e => 
    (e.entryNo || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.referenceNo && e.referenceNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group accounts for Tree View
  const rootAccounts = useMemo(() => {
    return filteredAccounts.filter(a => !a.parentId || a.isHeader);
  }, [filteredAccounts]);

  const getChildAccounts = (parentId: string) => {
    return filteredAccounts.filter(a => a.parentId === parentId);
  };

  // Account Type Arabic Badges
  const getTypeBadge = (type: Account['type']) => {
    switch (type) {
      case 'ASSET': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">أصول (Assets)</span>;
      case 'LIABILITY': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">التزامات (Liabilities)</span>;
      case 'EQUITY': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">حقوق ملكية (Equity)</span>;
      case 'REVENUE': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">إيرادات (Revenue)</span>;
      case 'EXPENSE': return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">مصروفات (Expense)</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">أخرى</span>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'SALE': return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">تلقائي: مبيعات POS</span>;
      case 'PURCHASE': return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50">تلقائي: مشتريات</span>;
      case 'EXPENSE': return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">تلقائي: مصروفات</span>;
      case 'TREASURY': return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/50">تلقائي: خزينة</span>;
      case 'DEPRECIATION': return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50">تلقائي: إهلاك أصول</span>;
      default: return <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">قيد يدوي</span>;
    }
  };

  const handleNavigateToLedger = (accId: string) => {
    setSelectedAccountId(accId);
    setActiveTab('LEDGER');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/10 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-700 dark:text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              الحسابات العامة والقيود المحاسبية
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                مزدوج القيد دقيق 100%
              </span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              دليل الحسابات، الترحيل التلقائي للقيود، دفتر الأستاذ العام، ميزان المراجعة والأصول الثابتة
            </p>
          </div>
        </div>

        {/* Tab Selector buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ACCOUNTS'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            دليل وشجرة الحسابات ({accounts.length})
          </button>

          <button
            onClick={() => setActiveTab('ENTRIES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'ENTRIES'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            قيود اليومية ({journalEntries.length})
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'LEDGER'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            دفتر الأستاذ العام
          </button>

          <button
            onClick={() => setActiveTab('TRIAL_BALANCE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'TRIAL_BALANCE'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Scale className="w-4 h-4" />
            ميزان المراجعة
          </button>

          <button
            onClick={() => setActiveTab('FIXED_ASSETS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'FIXED_ASSETS'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            الأصول الثابتة
          </button>
        </div>
      </div>

      {/* TAB 1: JOURNAL ENTRIES (قيود اليومية) */}
      {activeTab === 'ENTRIES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم القيد أو البيان أو المرجع..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            <button
              onClick={() => setShowAddEntryModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إضافة قيد يدوي جديد
            </button>
          </div>

          {/* Table of Entries */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">رقم القيد</th>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">مصدر القيد</th>
                    <th className="p-3.5">البيان العام</th>
                    <th className="p-3.5 text-center">إجمالي المدين</th>
                    <th className="p-3.5 text-center">إجمالي الدائن</th>
                    <th className="p-3.5 text-center">التوازن</th>
                    <th className="p-3.5 text-center">عرض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {filteredEntries.map(entry => {
                    const isBalanced = Math.abs(entry.totalDebit - entry.totalCredit) < 0.01;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                          {entry.entryNo}
                        </td>
                        <td className="p-3.5 text-xs text-slate-600 dark:text-slate-400">
                          {entry.date}
                        </td>
                        <td className="p-3.5">
                          {getSourceBadge(entry.source)}
                        </td>
                        <td className="p-3.5 max-w-xs truncate font-medium">
                          {entry.description}
                          {entry.referenceNo && (
                            <span className="block text-xs text-slate-500 font-mono mt-0.5">مرجع: {entry.referenceNo}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {entry.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td className="p-3.5 text-center font-mono font-semibold text-blue-700 dark:text-blue-400">
                          {entry.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td className="p-3.5 text-center">
                          {isBalanced ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> متوازن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              <AlertCircle className="w-3 h-3" /> غير متوازن
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelectedEntryDetails(entry)}
                            className="p-1.5 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950 rounded-lg transition-colors"
                            title="تفاصيل أطراف القيد"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        لا توجد قيود محاسبية مطابقة للبحث
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL LEDGER (دفتر الأستاذ العام) */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">اختر الحساب المحاسبي</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-600"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      [{acc.code}] {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">من تاريخ</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">إلى تاريخ</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                />
              </div>
            </div>

            {/* Account Summary Metrics */}
            {ledgerData.account && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">الحساب المختار</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    {ledgerData.account.name}
                  </div>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">كود: {ledgerData.account.code}</span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 block mb-1">إجمالي الحركات المدينة</span>
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 text-base font-mono">
                    {ledgerData.totalDebit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400 block mb-1">إجمالي الحركات الدائنة</span>
                  <div className="font-bold text-blue-800 dark:text-blue-300 text-base font-mono">
                    {ledgerData.totalCredit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-100 dark:border-cyan-900/40">
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-400 block mb-1">الرصيد النهائي الحقيقي</span>
                  <div className="font-bold text-cyan-900 dark:text-cyan-200 text-base font-mono">
                    {ledgerData.finalBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">التاريخ</th>
                    <th className="p-3.5">رقم القيد</th>
                    <th className="p-3.5">البيان والشارح</th>
                    <th className="p-3.5 text-center">مدين (+)</th>
                    <th className="p-3.5 text-center">دائن (-)</th>
                    <th className="p-3.5 text-center">الرصيد التراكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {ledgerData.transactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {tx.date}
                      </td>
                      <td className="p-3.5 font-mono text-cyan-700 dark:text-cyan-400 font-semibold">
                        {tx.entryNo}
                      </td>
                      <td className="p-3.5 font-medium">
                        {tx.description}
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {tx.debit > 0 ? `${tx.debit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-semibold text-blue-700 dark:text-blue-400">
                        {tx.credit > 0 ? `${tx.credit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">
                        {tx.runningBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                    </tr>
                  ))}
                  {ledgerData.transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        لا توجد حركة حساب مسجلة لهذا الحساب خلال الفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRIAL BALANCE (ميزان المراجعة) */}
      {activeTab === 'TRIAL_BALANCE' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ميزان المراجعة حتى تاريخ:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={e => setAsOfDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            {/* Balance status banner */}
            {trialBalance.isBalanced ? (
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                الميزان متوازن 100% (إجمالي المدين = إجمالي الدائن)
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-4 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                تنبيه: الميزان غير متوازن! الفرق: {trialBalance.diff.toFixed(2)} ج.م
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">كود الحساب</th>
                    <th className="p-3.5">اسم الحساب المحاسبي</th>
                    <th className="p-3.5">نوع الحساب</th>
                    <th className="p-3.5 text-center text-emerald-700 dark:text-emerald-400">أرصدة مدينة (Debit)</th>
                    <th className="p-3.5 text-center text-blue-700 dark:text-blue-400">أرصدة دائنة (Credit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {trialBalance.items.map(item => (
                    <tr key={item.accountCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                        {item.accountCode}
                      </td>
                      <td className="p-3.5 font-semibold">
                        {item.accountName}
                      </td>
                      <td className="p-3.5">
                        {getTypeBadge(item.type as Account['type'])}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {item.debitBalance > 0 ? `${item.debitBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م` : '-'}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                        {item.creditBalance > 0 ? `${item.creditBalance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td colSpan={3} className="p-4 text-left font-bold text-base">
                      إجمالي ميزان المراجعة:
                    </td>
                    <td className="p-4 text-center font-mono text-base text-emerald-700 dark:text-emerald-300">
                      {trialBalance.totalDebitSum.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                    </td>
                    <td className="p-4 text-center font-mono text-base text-blue-700 dark:text-blue-300">
                      {trialBalance.totalCreditSum.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHART OF ACCOUNTS (شجرة ودليل الحسابات) */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بكود الحساب، الاسم، أو الوصف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
              />
            </div>

            {/* Account Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={accountTypeFilter}
                onChange={e => setAccountTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-600"
              >
                <option value="ALL">جميع الفئات المحاسبية</option>
                <option value="ASSET">1- الأصول (Assets)</option>
                <option value="LIABILITY">2- الالتزامات والخصوم (Liabilities)</option>
                <option value="EQUITY">3- حقوق الملكية (Equity)</option>
                <option value="REVENUE">4- الإيرادات (Revenue)</option>
                <option value="EXPENSE">5- المصروفات (Expenses)</option>
              </select>

              {/* View Switcher: Tree vs Table */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setAccountViewMode('TREE')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    accountViewMode === 'TREE'
                      ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="عرض الشجرة الهرمية"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  شجرة
                </button>
                <button
                  onClick={() => setAccountViewMode('TABLE')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    accountViewMode === 'TABLE'
                      ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="عرض الجدول المسطح"
                >
                  <Table className="w-3.5 h-3.5" />
                  جدول
                </button>
              </div>

              <button
                onClick={() => setShowAddAccountModal(true)}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                حساب جديد
              </button>
            </div>
          </div>

          {/* TREE VIEW */}
          {accountViewMode === 'TREE' ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
              {rootAccounts.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  لا توجد حسابات تطابق البحث أو الفلتر المحدد
                </div>
              )}

              {rootAccounts.map(rootAcc => {
                const subAccounts = getChildAccounts(rootAcc.id);
                const liveBalance = getAccountLiveBalance(rootAcc);

                return (
                  <div key={rootAcc.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {/* Header / Parent Account Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 flex items-center justify-center font-bold text-xs font-mono">
                          {rootAcc.code}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            {rootAcc.name}
                            {getTypeBadge(rootAcc.type)}
                            {rootAcc.isSystem && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                نظامي
                              </span>
                            )}
                          </div>
                          {rootAcc.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rootAcc.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          الرصيد: {(liveBalance || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </span>
                        <button
                          onClick={() => handleNavigateToLedger(rootAcc.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 rounded-lg transition-colors border border-cyan-200 dark:border-cyan-800/60 flex items-center gap-1"
                          title="عرض كشف الحساب في دفتر الأستاذ"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          كشف الحساب
                        </button>
                      </div>
                    </div>

                    {/* Sub / Child Accounts List */}
                    {subAccounts.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/50">
                        {subAccounts.map(child => {
                          const childBalance = getAccountLiveBalance(child);
                          const subChildAccounts = getChildAccounts(child.id);

                          return (
                            <div key={child.id} className="p-3 pr-8 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                                  <span className="font-mono font-bold text-xs text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded">
                                    {child.code}
                                  </span>
                                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                    {child.name}
                                  </span>
                                  {child.isHeader && (
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                      رئيسي فرعي
                                    </span>
                                  )}
                                  {child.description && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">
                                      - {child.description}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                    {(childBalance || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                                  </span>
                                  <button
                                    onClick={() => handleNavigateToLedger(child.id)}
                                    className="p-1.5 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-slate-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-950/60 rounded-lg transition-colors"
                                    title="عرض كشف الحساب في دفتر الأستاذ"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Level 3 items if any */}
                              {subChildAccounts.length > 0 && (
                                <div className="mt-2 mr-6 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                                  {subChildAccounts.map(sub3 => {
                                    const sub3Balance = getAccountLiveBalance(sub3);
                                    return (
                                      <div key={sub3.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 dark:bg-slate-800/40">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{sub3.code}</span>
                                          <span className="font-medium text-slate-800 dark:text-slate-200">{sub3.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-semibold">{(sub3Balance || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</span>
                                          <button
                                            onClick={() => handleNavigateToLedger(sub3.id)}
                                            className="text-cyan-600 hover:underline"
                                          >
                                            كشف
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">الكود المحاسبي</th>
                      <th className="p-3.5">اسم الحساب</th>
                      <th className="p-3.5">فئة الحساب</th>
                      <th className="p-3.5 text-center">الرصيد الحالي</th>
                      <th className="p-3.5 text-center">النوع / الحالة</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {filteredAccounts.map(account => {
                      const liveBalance = getAccountLiveBalance(account);
                      return (
                        <tr 
                          key={account.id} 
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${account.isHeader ? 'bg-slate-50/60 dark:bg-slate-800/30 font-bold' : ''}`}
                        >
                          <td className="p-3.5 font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                            {account.code}
                          </td>
                          <td className="p-3.5 font-semibold">
                            {account.name}
                            {account.description && (
                              <span className="block text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">{account.description}</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {getTypeBadge(account.type)}
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {(liveBalance || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                          </td>
                          <td className="p-3.5 text-center">
                            {account.isSystem ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <Shield className="w-3 h-3 text-amber-500" /> حساب نظامي
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">نشط</span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleNavigateToLedger(account.id)}
                              className="px-2.5 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950 rounded-lg transition-colors border border-cyan-200 dark:border-cyan-800 inline-flex items-center gap-1"
                              title="عرض كشف الحساب"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              كشف الحساب
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAccounts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          لا توجد حسابات تطابق البحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FIXED ASSETS & DEPRECIATION (الأصول الثابتة) */}
      {activeTab === 'FIXED_ASSETS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">سجل الأصول الثابتة والإهلاكات</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">إدارة الأصول ومحاسبة الإهلاك الشهري التلقائي بالقسط الثابت</p>
            </div>

            <button
              onClick={() => setShowAddAssetModal(true)}
              className="w-full sm:w-auto px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              تسجيل أصل ثابت جديد
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">الكود</th>
                    <th className="p-3.5">اسم الأصل الثابت</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5 text-center">تكلفة الشراء</th>
                    <th className="p-3.5 text-center">العمر الانتاجي</th>
                    <th className="p-3.5 text-center">مجمع الإهلاك</th>
                    <th className="p-3.5 text-center">القيمة الدفترية النقدية</th>
                    <th className="p-3.5 text-center">إجراء الإهلاك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {fixedAssets.map(asset => {
                    const netBook = asset.purchaseCost - (asset.accumDepreciation || 0);
                    return (
                      <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono font-bold text-cyan-700 dark:text-cyan-400">
                          {asset.code}
                        </td>
                        <td className="p-3.5 font-bold">
                          {asset.name}
                        </td>
                        <td className="p-3.5 text-xs text-slate-600 dark:text-slate-400">
                          {asset.category}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {asset.purchaseCost.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td className="p-3.5 text-center font-semibold text-slate-600 dark:text-slate-400">
                          {asset.usefulLifeYears} سنوات
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                          {(asset.accumDepreciation || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {netBook.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleRunDepreciation(asset.id)}
                            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-semibold transition-colors border border-indigo-200 dark:border-indigo-800"
                          >
                            تشغيل إهلاك شهري
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {fixedAssets.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                        لا توجد أصول ثابتة مسجلة حالياً
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL JOURNAL ENTRY */}
      {showAddEntryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                إنشاء قيد يومية يدوي جديد (Journal Voucher)
              </h3>
              <button onClick={() => setShowAddEntryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">تاريخ القيد</label>
                  <input
                    type="date"
                    required
                    value={entryFormData.date}
                    onChange={e => setEntryFormData({ ...entryFormData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">الرقم المرجعي / المستند</label>
                  <input
                    type="text"
                    placeholder="مثال: فاتورة ورقية 402"
                    value={entryFormData.referenceNo}
                    onChange={e => setEntryFormData({ ...entryFormData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">حالة التوازن</label>
                  <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isEntryBalanced 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {isEntryBalanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {isEntryBalanced ? 'القيد متوازن 100%' : `غير متوازن (الفرق: ${entryDiff.toFixed(2)} ج.م)`}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">البيان العام للقيد *</label>
                <input
                  type="text"
                  required
                  placeholder="شارح القيد والعملية المحاسبية..."
                  value={entryFormData.description}
                  onChange={e => setEntryFormData({ ...entryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Dynamic Line Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden space-y-2">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-2.5 w-1/3">الحساب المحاسبي</th>
                      <th className="p-2.5 text-center">مدين (Debit)</th>
                      <th className="p-2.5 text-center">دائن (Credit)</th>
                      <th className="p-2.5">البيان الخاص بالحساب</th>
                      <th className="p-2.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {entryFormData.lines.map(line => (
                      <tr key={line.id}>
                        <td className="p-2">
                          <select
                            value={line.accountId}
                            onChange={e => handleLineChange(line.id, 'accountId', e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                          >
                            <option value="">-- اختر الحساب --</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                [{acc.code}] {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.debit || ''}
                            onChange={e => handleLineChange(line.id, 'debit', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1.5 text-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.credit || ''}
                            onChange={e => handleLineChange(line.id, 'credit', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1.5 text-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.description || ''}
                            onChange={e => handleLineChange(line.id, 'description', e.target.value)}
                            placeholder="اختياري..."
                            className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(line.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold">
                    <tr>
                      <td className="p-2.5 text-left font-bold">الإجمالي:</td>
                      <td className="p-2.5 text-center font-mono text-emerald-700 dark:text-emerald-400">
                        {totalEntryDebit.toFixed(2)} ج.م
                      </td>
                      <td className="p-2.5 text-center font-mono text-blue-700 dark:text-blue-400">
                        {totalEntryCredit.toFixed(2)} ج.م
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة طرف جديد للقيد
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEntryModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={!isEntryBalanced}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all ${
                      isEntryBalanced 
                        ? 'bg-cyan-700 hover:bg-cyan-800' 
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    حفظ وترحيل القيد
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ENTRY DETAILS */}
      {selectedEntryDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  تفاصيل القيد المحاسبي: <span className="font-mono text-cyan-600">{selectedEntryDetails.entryNo}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">التاريخ: {selectedEntryDetails.date} | المسجل: {selectedEntryDetails.createdBy}</p>
              </div>
              <button onClick={() => setSelectedEntryDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200">
              البيان العام: {selectedEntryDetails.description}
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">كود الحساب</th>
                    <th className="p-3">اسم الحساب</th>
                    <th className="p-3 text-center">مدين</th>
                    <th className="p-3 text-center">دائن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedEntryDetails.lines.map(line => (
                    <tr key={line.id}>
                      <td className="p-3 font-mono font-bold text-cyan-600">{line.accountCode}</td>
                      <td className="p-3 font-semibold">{line.accountName}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">
                        {line.debit > 0 ? `${line.debit.toFixed(2)} ج.م` : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-blue-600">
                        {line.credit > 0 ? `${line.credit.toFixed(2)} ج.م` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEntryDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOUNT */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة حساب جديد في الشجرة</h3>
              <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">الكود المحاسبي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 5108"
                  value={accountFormData.code}
                  onChange={e => setAccountFormData({ ...accountFormData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">اسم الحساب المحاسبي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مصروفات الدعاية والإعلان"
                  value={accountFormData.name}
                  onChange={e => setAccountFormData({ ...accountFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">نوع / طبيعة الحساب *</label>
                <select
                  value={accountFormData.type}
                  onChange={e => setAccountFormData({ ...accountFormData, type: e.target.value as Account['type'] })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                >
                  <option value="ASSET">أصول (Assets - طبيعة مدين)</option>
                  <option value="LIABILITY">التزامات (Liabilities - طبيعة دائن)</option>
                  <option value="EQUITY">حقوق ملكية (Equity - طبيعة دائن)</option>
                  <option value="REVENUE">إيرادات (Revenue - طبيعة دائن)</option>
                  <option value="EXPENSE">مصروفات (Expense - طبيعة مدين)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  حفظ الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIXED ASSET */}
      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">تسجيل أصل ثابت جديد</h3>
              <button onClick={() => setShowAddAssetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">كود الأصل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: AST-104"
                  value={assetFormData.code}
                  onChange={e => setAssetFormData({ ...assetFormData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">اسم الأصل الثابت *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سيارة نقل بضائع"
                  value={assetFormData.name}
                  onChange={e => setAssetFormData({ ...assetFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">تكلفة الشراء (ج.م) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={assetFormData.purchaseCost}
                    onChange={e => setAssetFormData({ ...assetFormData, purchaseCost: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">العمر الانتاجي (سنوات)</label>
                  <input
                    type="number"
                    value={assetFormData.usefulLifeYears}
                    onChange={e => setAssetFormData({ ...assetFormData, usefulLifeYears: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAssetModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  حفظ الأصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
