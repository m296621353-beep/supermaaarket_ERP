import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, History, Plus, CheckCircle, XCircle, Lock, Edit3 } from 'lucide-react';
import { User, Role, AuditLog, Branch, ModulePermissions } from '../../types';
import { getUsers, getRoles, getBranches, getAuditLogs, saveUser } from '../../db/dbEngine';

export const UsersScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // User Add/Edit Modal
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    roleId: 'role_cashier',
    branchId: 'br_main',
    active: true
  });

  const loadData = () => {
    setUsers(getUsers());
    setRoles(getRoles());
    setBranches(getBranches());
    setAuditLogs(getAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      name: '',
      roleId: roles[2]?.id || 'role_cashier',
      branchId: branches[0]?.id || 'br_main',
      active: true
    });
    setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      name: u.name,
      roleId: u.roleId,
      branchId: u.branchId,
      active: u.active
    });
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.name.trim()) return;

    const newUserObj: User = {
      id: editingUser ? editingUser.id : 'usr_' + Date.now(),
      username: userForm.username.trim().toLowerCase(),
      name: userForm.name.trim(),
      roleId: userForm.roleId,
      branchId: userForm.branchId,
      active: userForm.active,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString()
    };

    saveUser(newUserObj);
    setShowUserModal(false);
    loadData();
  };

  return (
    <div className="p-4 space-y-4 bg-slate-100 dark:bg-slate-900 min-h-[calc(100vh-62px)] select-none transition-colors">
      
      {/* Header & Tabs */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-base text-slate-800 dark:text-slate-100">المستخدمين والصلاحيات وسجل الأنشطة</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400">إدارة حسابات الكاشيرية والمدراء وتحديد صلاحيات كل شاشة بدقة</p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'users' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
          >
            المستخدمين ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'roles' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
          >
            الأدوار والصلاحيات ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${activeTab === 'audit' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}
          >
            سجل العمليات Audit Log
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openAddUser}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">اسم المستخدم</th>
                  <th className="p-3">الاسم بالكامل</th>
                  <th className="p-3">الدور / الوظيفة</th>
                  <th className="p-3">الفرع المرتبط</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">تاريخ الإنشاء</th>
                  <th className="p-3 text-center w-20">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                {users.map((u) => {
                  const roleObj = roles.find(r => r.id === u.roleId);
                  const branchObj = branches.find(b => b.id === u.branchId);

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{u.username}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-bold border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200">
                          {roleObj?.name || u.roleId}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{branchObj?.name || 'الفرع الرئيسي'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        }`}>
                          {u.active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openEditUser(u)}
                          className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles & Permissions Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{r.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{r.description}</p>
                </div>
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Module Permissions Breakdown */}
              <div className="space-y-1.5 text-xs">
                {Object.entries(r.permissions).map(([modKey, permVal]) => {
                  const perm = permVal as ModulePermissions;
                  return (
                    <div key={modKey} className="p-2 bg-slate-50 dark:bg-slate-700/60 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {modKey === 'dashboard' ? 'الرئيسية' :
                         modKey === 'pos' ? 'نقطة البيع' :
                         modKey === 'inventory' ? 'المخزون والمنتجات' :
                         modKey === 'branches' ? 'الفروع والمخازن' :
                         modKey === 'users' ? 'المستخدمين' : 'الإعدادات'}
                      </span>
                      <div className="flex gap-1 text-[10px] font-mono font-bold">
                        <span className={`px-1.5 py-0.5 rounded ${perm.view ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>عرض</span>
                        <span className={`px-1.5 py-0.5 rounded ${perm.add ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>إضافة</span>
                        <span className={`px-1.5 py-0.5 rounded ${perm.edit ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>تعديل</span>
                        <span className={`px-1.5 py-0.5 rounded ${perm.delete ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>حذف</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 font-extrabold text-xs text-slate-700 dark:text-slate-300">
            سجل العمليات والأنشطة (Audit Log)
          </div>
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">المستخدم</th>
                <th className="p-3">نوع العملية</th>
                <th className="p-3">الشاشة / الوحدة</th>
                <th className="p-3">تفاصيل العملية</th>
                <th className="p-3 text-left">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{log.userName}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{log.module}</td>
                  <td className="p-3 text-slate-800 dark:text-slate-200">{log.details}</td>
                  <td className="p-3 text-left font-mono text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              {editingUser ? 'تعديل بيانات مستخدم' : 'إضافة مستخدم جديد'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الدخول (Username)</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="cashier3"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="محمد أحمد"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الدور / الصلاحية</label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الفرع المرتبط</label>
                  <select
                    value={userForm.branchId}
                    onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-800 dark:text-slate-100"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={userForm.active}
                  onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">حساب نشط ومصرح له بالدخول</span>
              </label>

              <div className="flex gap-2 pt-3">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">
                  حفظ الحساب
                </button>
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
