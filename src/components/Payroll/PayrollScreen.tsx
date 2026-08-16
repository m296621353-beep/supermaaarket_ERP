import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Plus, CheckCircle2, DollarSign, Calendar, Users, 
  Wallet, Building2, AlertCircle, Edit2, Trash2, FileCheck, Search, FileText 
} from 'lucide-react';
import { Employee, PayrollRun, PayrollItem, BankAccount } from '../../types';
import { 
  getEmployees, saveEmployee, deleteEmployee, 
  getPayrollRuns, approvePayrollRun, getBankAccounts, getTreasuryBalance 
} from '../../db/dbEngine';

export const PayrollScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll_run' | 'history'>('payroll_run');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [treasuryBal, setTreasuryBal] = useState<number>(0);

  // Employee Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [baseSalary, setBaseSalary] = useState<number>(5000);

  // Payroll Run Form State
  const [monthYear, setMonthYear] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [payrollItems, setPayrollItems] = useState<Array<{
    employeeId: string;
    employeeName: string;
    jobTitle: string;
    baseSalary: number;
    bonus: number;
    deduction: number;
  }>>([]);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    const emps = getEmployees();
    setEmployees(emps);
    setPayrollRuns(getPayrollRuns());
    const banks = getBankAccounts();
    setBankAccounts(banks);
    if (banks.length > 0 && !selectedBankId) setSelectedBankId(banks[0].id);
    setTreasuryBal(getTreasuryBalance());

    // Populate default payroll items for active employees
    const items = emps
      .filter(e => e.status === 'ACTIVE')
      .map(e => ({
        employeeId: e.id,
        employeeName: e.name,
        jobTitle: e.jobTitle,
        baseSalary: e.baseSalary,
        bonus: 0,
        deduction: 0
      }));
    setPayrollItems(items);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBaseSalarySum = payrollItems.reduce((sum, item) => sum + item.baseSalary, 0);
  const totalBonusSum = payrollItems.reduce((sum, item) => sum + (Number(item.bonus) || 0), 0);
  const totalDeductionSum = payrollItems.reduce((sum, item) => sum + (Number(item.deduction) || 0), 0);
  const totalNetSalarySum = totalBaseSalarySum + totalBonusSum - totalDeductionSum;

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !jobTitle) {
      alert('يرجى إدخال اسم الموظف والمسمى الوظيفي');
      return;
    }

    const newEmp: Employee = {
      id: editingEmp ? editingEmp.id : 'emp_' + Date.now(),
      code: empCode || `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      name: empName,
      jobTitle,
      branchId: 'br_main',
      baseSalary: Number(baseSalary) || 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    saveEmployee(newEmp);
    setIsEmpModalOpen(false);
    resetEmpForm();
    loadData();
  };

  const resetEmpForm = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpCode('');
    setJobTitle('');
    setBaseSalary(5000);
  };

  const handleEditEmp = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpCode(emp.code);
    setJobTitle(emp.jobTitle);
    setBaseSalary(emp.baseSalary);
    setIsEmpModalOpen(true);
  };

  const handleDeleteEmp = (id: string) => {
    if (confirm('هل أنت تأكد من حذف الموظف؟')) {
      deleteEmployee(id);
      loadData();
    }
  };

  const handleItemChange = (index: number, field: 'bonus' | 'deduction', value: number) => {
    const updated = [...payrollItems];
    updated[index][field] = Math.max(0, value || 0);
    setPayrollItems(updated);
  };

  const handleApprovePayroll = () => {
    if (payrollItems.length === 0) {
      setMessage({ text: 'لا يوجد موظفون نشطون لإعداد المسير', type: 'error' });
      return;
    }

    if (paymentMethod === 'CASH' && totalNetSalarySum > treasuryBal) {
      setMessage({ text: `رصيد الخزينة النقدية المتاح (${treasuryBal.toFixed(2)} ج.م) لا يكفي لصرف الرواتب الصافية (${totalNetSalarySum.toFixed(2)} ج.م)`, type: 'error' });
      return;
    }

    try {
      const itemsFormatted: PayrollItem[] = payrollItems.map((item, idx) => ({
        id: `payitem_${Date.now()}_${idx}`,
        payrollRunId: '',
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        jobTitle: item.jobTitle,
        baseSalary: item.baseSalary,
        bonus: Number(item.bonus) || 0,
        deduction: Number(item.deduction) || 0,
        netSalary: item.baseSalary + (Number(item.bonus) || 0) - (Number(item.deduction) || 0)
      }));

      const newRun = approvePayrollRun({
        monthYear,
        branchId: 'br_main',
        totalBaseSalary: totalBaseSalarySum,
        totalBonus: totalBonusSum,
        totalDeduction: totalDeductionSum,
        totalNetSalary: totalNetSalarySum,
        paymentMethod,
        bankAccountId: paymentMethod === 'BANK' ? selectedBankId : undefined,
        approvedBy: 'أحمد محمود (المدير)',
        items: itemsFormatted
      });

      setMessage({ text: `تم اعتماد وصرف مسير رواتب شهر ${monthYear} بنجاح وقيد مصروف الأجور بالقيد الآلي!`, type: 'success' });
      loadData();
      setActiveTab('history');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'حدث خطأ أثناء اعتماد الرواتب', type: 'error' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-2xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl text-slate-800 dark:text-slate-100">إدارة الرواتب وأجور الموظفين</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">إعداد مسير الرواتب الشهرية والخصومات والمكافآت مع الترحيل التلقائي لدفتر الأستاذ</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetEmpForm();
            setIsEmpModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => setActiveTab('payroll_run')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'payroll_run'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>إعداد وصرف المسير الشهري</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'employees'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>سجل الموظفين ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>سجل المسيرات المعتمدة ({payrollRuns.length})</span>
        </button>
      </div>

      {/* TAB 1: Payroll Run Form */}
      {activeTab === 'payroll_run' && (
        <div className="space-y-6">
          {/* Settings Row */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الشهر والسنة للمسير</label>
              <input
                type="month"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">طريقة الصرف والخصم المالية</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'BANK')}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
              >
                <option value="CASH">نقداً من الخزينة الرئيسية ({treasuryBal.toFixed(2)} ج.م متاح)</option>
                <option value="BANK">تحويل بنكي مباشر</option>
              </select>
            </div>

            {paymentMethod === 'BANK' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الحساب البنكي الخصم منه</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table of Employee Salaries */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">تفاصيل أجور الموظفين لشهر {monthYear}</h3>
              <span className="text-xs text-slate-500">عدد الموظفين: {payrollItems.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">اسم الموظف</th>
                    <th className="p-3">المسمى الوظيفي</th>
                    <th className="p-3">الراتب الأساسي</th>
                    <th className="p-3">المكافآت والحوافز (+)</th>
                    <th className="p-3">الخصومات والجزاءات (-)</th>
                    <th className="p-3">صافي الراتب المستحق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-200 font-medium">
                  {payrollItems.map((item, idx) => {
                    const net = item.baseSalary + (Number(item.bonus) || 0) - (Number(item.deduction) || 0);
                    return (
                      <tr key={item.employeeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{item.employeeName}</td>
                        <td className="p-3 text-slate-500">{item.jobTitle}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {item.baseSalary.toFixed(2)} ج.م
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={item.bonus}
                            onChange={(e) => handleItemChange(idx, 'bonus', parseFloat(e.target.value))}
                            className="w-24 p-1.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={item.deduction}
                            onChange={(e) => handleItemChange(idx, 'deduction', parseFloat(e.target.value))}
                            className="w-24 p-1.5 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 rounded-lg font-bold text-rose-700 dark:text-rose-300 font-mono"
                          />
                        </td>
                        <td className="p-3 font-black font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          {net.toFixed(2)} ج.م
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Footer & Approval Action */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-500 block">إجمالي الأساسي:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-100">{totalBaseSalarySum.toFixed(2)} ج.م</span>
                </div>
                <div>
                  <span className="text-slate-500 block">إجمالي المكافآت:</span>
                  <span className="font-extrabold text-emerald-600">+{totalBonusSum.toFixed(2)} ج.م</span>
                </div>
                <div>
                  <span className="text-slate-500 block">إجمالي الخصومات:</span>
                  <span className="font-extrabold text-rose-600">-{totalDeductionSum.toFixed(2)} ج.م</span>
                </div>
                <div className="border-r border-slate-300 pr-4">
                  <span className="text-slate-500 block font-bold">صافي المسير النهائي:</span>
                  <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">{totalNetSalarySum.toFixed(2)} ج.م</span>
                </div>
              </div>

              <button
                onClick={handleApprovePayroll}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>اعتماد وصرف الرواتب بالقيد التلقائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Employees Management */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">كود الموظف</th>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">المسمى الوظيفي</th>
                  <th className="p-3">الراتب الأساسي (ج.م)</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-200">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono font-bold text-slate-500">{emp.code}</td>
                    <td className="p-3 font-extrabold text-slate-800 dark:text-slate-100">{emp.name}</td>
                    <td className="p-3 text-slate-500">{emp.jobTitle}</td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {emp.baseSalary.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                        نشط
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditEmp(emp)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteEmp(emp.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: History of Payroll Runs */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden space-y-4 p-4">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
            سجل مسيرات الرواتب المعتمدة سابقاً
          </h3>

          <div className="space-y-3">
            {payrollRuns.map(run => (
              <div key={run.id} className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 bg-emerald-600 text-white rounded text-[11px]">{run.runNo}</span>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">مسير رواتب شهر {run.monthYear}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono dir-ltr">{new Date(run.createdAt).toLocaleDateString('ar-EG')}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-600/60">
                  <div className="text-slate-600 dark:text-slate-300">
                    طريقة الصرف: <span className="font-bold">{run.paymentMethod === 'BANK' ? 'تحويل بنكي' : 'نقداً من الخزينة'}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    عدد الموظفين: <span className="font-bold">{run.items.length} موظف</span>
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                    الصافي المصروف: {run.totalNetSalary.toFixed(2)} ج.م
                  </div>
                </div>
              </div>
            ))}

            {payrollRuns.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                لم يتم اعتماد أي مسير رواتب حتى الآن.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {editingEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الموظف الثلاثي *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">المسمى الوظيفي *</label>
                <input
                  type="text"
                  required
                  placeholder="كاشير، أمين مخزن، مدير فرع..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الراتب الأساسي الشهري (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
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
    </div>
  );
};
