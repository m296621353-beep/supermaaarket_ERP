import React, { useState } from 'react';
import { User, Lock, Store, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(usernameInput)) {
      setError('');
      onClose();
    } else {
      setError('اسم المستخدم غير موجود أو الحساب غير نشط!');
    }
  };

  const quickLogin = (uname: string) => {
    login(uname);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative select-none">
        
        <button onClick={onClose} className="absolute top-4 left-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-600/20">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="font-black text-lg text-slate-900 dark:text-slate-100">تسجيل دخول المستخدم</h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1">اختر حساباً للتبديل السريع أو ادخل اسم المستخدم</p>
        </div>

        {error && (
          <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold p-2.5 rounded-xl text-center mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم المستخدم</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="مثال: admin أو cashier1"
                className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            دخول للنظام
          </button>
        </form>

        {/* Quick User Switcher Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 block text-center">تبديل سريع لحسابات العرض التجريبي:</span>
          
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            <button
              onClick={() => quickLogin('admin')}
              className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition text-center cursor-pointer"
            >
              المدير admin
            </button>
            <button
              onClick={() => quickLogin('cashier1')}
              className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/60 transition text-center cursor-pointer"
            >
              كاشير cashier1
            </button>
            <button
              onClick={() => quickLogin('storekeeper')}
              className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/60 transition text-center cursor-pointer"
            >
              مخزن storekeeper
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
