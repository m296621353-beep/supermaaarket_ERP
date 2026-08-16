import React from 'react';
import { 
  Home, ShoppingCart, ShoppingBag, Package, Users, Truck, 
  Receipt, Landmark, BookOpen, BarChart3, Percent, Puzzle, 
  Settings, ShieldCheck, Languages, LogOut, ChevronLeft, ChevronRight, Store, Lock,
  Building2, UserCheck, Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ScreenType = 
  | 'dashboard' 
  | 'pos' 
  | 'purchases' 
  | 'inventory' 
  | 'branches' 
  | 'customers' 
  | 'suppliers' 
  | 'expenses' 
  | 'treasury' 
  | 'banking'
  | 'payroll'
  | 'ledger'
  | 'taxes'
  | 'reports'
  | 'users' 
  | 'settings';

interface SidebarProps {
  activeScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLoginModal: () => void;
}

interface NavMenuItem {
  id: string;
  screenId?: ScreenType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  phase?: string;
  active: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onSelectScreen,
  collapsed,
  onToggleCollapse,
  onOpenLoginModal
}) => {
  const { logout, user } = useAuth();

  const menuItems: NavMenuItem[] = [
    { id: 'dashboard', screenId: 'dashboard', label: 'الرئيسية', icon: Home, active: true },
    { id: 'pos', screenId: 'pos', label: 'المبيعات / نقطة البيع', icon: ShoppingCart, active: true },
    { id: 'purchases', screenId: 'purchases', label: 'المشتريات', icon: ShoppingBag, active: true },
    { id: 'inventory', screenId: 'inventory', label: 'المخزون', icon: Package, active: true },
    { id: 'branches', screenId: 'branches', label: 'الفروع والمخازن', icon: Store, active: true },
    { id: 'customers', screenId: 'customers', label: 'العملاء', icon: Users, active: true },
    { id: 'suppliers', screenId: 'suppliers', label: 'الموردون', icon: Truck, active: true },
    { id: 'expenses', screenId: 'expenses', label: 'المصروفات', icon: Receipt, active: true },
    { id: 'treasury', screenId: 'treasury', label: 'الخزينة النقدية', icon: Wallet, active: true },
    { id: 'banking', screenId: 'banking', label: 'البنوك والتحويلات', icon: Building2, active: true },
    { id: 'payroll', screenId: 'payroll', label: 'الرواتب والموظفين', icon: UserCheck, active: true },
    { id: 'ledger', screenId: 'ledger', label: 'دليل الحسابات والقيود', icon: BookOpen, active: true },
    { id: 'taxes', screenId: 'taxes', label: 'الضرائب والإقرار الضريبي', icon: Percent, active: true },
    { id: 'reports', screenId: 'reports', label: 'التقارير المتقدمة والقوائم', icon: BarChart3, active: true },
    { id: 'settings', screenId: 'settings', label: 'الإعدادات والنسخ الاحتياطي', icon: Settings, active: true },
    { id: 'users', screenId: 'users', label: 'المستخدمين والصلاحيات', icon: ShieldCheck, active: true },
  ];

  return (
    <>
      {/* Mobile / Tablet Overlay Backdrop when Sidebar is Expanded */}
      {!collapsed && (
        <div 
          onClick={onToggleCollapse}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside 
        className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col border-l border-slate-200 dark:border-slate-800 transition-all duration-300 select-none shadow-xl shrink-0 z-50 ${
          collapsed 
            ? 'max-lg:translate-x-full max-lg:fixed max-lg:inset-y-0 max-lg:right-0 lg:w-16 lg:relative' 
            : 'fixed lg:relative inset-y-0 right-0 w-64 h-screen'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/80">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                س
              </div>
              <div className="truncate">
                <h1 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-wide truncate">نظام السوبرماركت</h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold truncate">إصدار الشركات ERP</p>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shrink-0 mx-auto cursor-pointer"
            title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-2.5 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isSelected = item.screenId && activeScreen === item.screenId;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.active && item.screenId) {
                    onSelectScreen(item.screenId);
                    // On tablet/mobile, auto collapse sidebar on selection to show full screen
                    if (window.innerWidth < 1024) {
                      onToggleCollapse();
                    }
                  }
                }}
                disabled={!item.active}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all relative group cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-2xs border-r-4 border-emerald-600 dark:border-emerald-500'
                    : item.active
                    ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed hover:bg-transparent font-normal'
                }`}
                title={collapsed ? `${item.label}${item.phase ? ` (${item.phase})` : ''}` : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${
                  isSelected 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : item.active 
                    ? 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400' 
                    : 'text-slate-300 dark:text-slate-700'
                }`} />
                
                {!collapsed && (
                  <span className="truncate flex-1 text-right">{item.label}</span>
                )}

                {!collapsed && !item.active && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3 text-slate-400 dark:text-slate-600" />
                    {item.phase && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-normal">
                        {item.phase}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Controls: Language & Logout */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-1">
          <button
            onClick={() => alert('النظام مصمم بالكامل للغة العربية والعملة المصرية ج.م')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
            title={collapsed ? 'تغيير اللغة' : undefined}
          >
            <Languages className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
            {!collapsed && <span className="truncate text-right font-semibold">العربية (مصر)</span>}
          </button>

          <button
            onClick={() => {
              logout();
              onOpenLoginModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition font-semibold"
            title={collapsed ? 'تسجيل الخروج' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
            {!collapsed && <span className="truncate text-right font-bold">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

