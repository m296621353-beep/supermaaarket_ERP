import React, { useState, useEffect } from 'react';
import { 
  Building2, User, Calendar, Clock, Bell, Maximize, Minimize, Store, ChevronDown, Sun, Moon, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../db/dbEngine';

interface HeaderProps {
  onOpenLoginModal: () => void;
  activeScreenName: string;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenLoginModal, 
  activeScreenName, 
  onToggleSidebar 
}) => {
  const { user, activeBranch, branches, setActiveBranchId } = useAuth();
  const { theme, toggleTheme, isFullscreen, toggleFullscreen } = useTheme();
  const settings = getSettings();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      // Format time in Arabic style e.g., 05:30:45 م
      const timeStr = now.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
      });
      // Format date in DD/MM/YYYY
      const dateStr = now.toLocaleDateString('ar-EG', { 
        year: 'numeric', month: '2-digit', day: '2-digit' 
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    { id: '1', title: 'تنفيض مخزون 18 صنف', desc: 'أصناف أو شكت على النفاذ بالمخزن الرئيسي', type: 'warning' },
    { id: '2', title: 'انتهاء صلاحية قريب', desc: '32 صنف خلال الـ 30 يوماً القادمة', type: 'info' },
    { id: '3', title: 'تجاوز حد الائتمان', desc: 'عميل سوبرماركت التوفيق تجاوز حد الائتمان', type: 'danger' }
  ];

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-1.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-3 shadow-2xs select-none sticky top-0 z-30 transition-colors">
      {/* Right Side: Fixed/Pinned Sidebar Toggle & Header Title on Mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-20 bg-white dark:bg-slate-800 py-0.5 pl-1.5 border-l sm:border-l-0 border-slate-200 dark:border-slate-700">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/80 transition cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
            title="توسيع / طي القائمة الجانبية"
          >
            <Menu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/60 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs shrink-0">
          <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs whitespace-nowrap">{activeScreenName}</span>
        </div>
      </div>

      {/* Center Status Pills: Horizontally Scrollable in Mobile View (< sm), Regular Flex on Desktop (sm+) */}
      <div className="flex-1 flex items-center justify-start sm:justify-end gap-1.5 sm:gap-2 py-0.5 overflow-x-auto sm:overflow-x-visible scrollbar-none min-w-0 px-1 touch-pan-x">
        
        {/* Network & Cloud Status Badge */}
        <span 
          title={isOnline ? "متصل سحابياً مع Firebase Firestore (تزامن فوري مفعّل)" : "وضع عدم الاتصال: يعمل محلياً مع الحفظ التلقائي عند عودة الإنترنت"}
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border shadow-2xs shrink-0 whitespace-nowrap transition-colors ${
            isOnline 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50' 
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>{isOnline ? 'سحابي متصل' : 'بدون إنترنت (محلي)'}</span>
        </span>

        {/* Branch Selector Pill */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setShowBranchDropdown(!showBranchDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-medium transition shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-right">
              <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">الفرع</div>
              <div className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100">{activeBranch?.name || 'الرئيسي'}</div>
            </div>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
          </button>

          {showBranchDropdown && (
            <>
              {/* Backdrop overlay to close when clicking outside */}
              <div 
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-3xs sm:bg-transparent" 
                onClick={() => setShowBranchDropdown(false)}
              />
              <div className="fixed top-12 left-3 right-3 sm:absolute sm:top-full sm:right-0 sm:left-auto sm:w-56 mt-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span>اختر الفرع الحالي</span>
                  <button onClick={() => setShowBranchDropdown(false)} className="text-slate-400 hover:text-slate-600 sm:hidden">✕</button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {branches.map(br => (
                    <button
                      key={br.id}
                      onClick={() => {
                        setActiveBranchId(br.id);
                        setShowBranchDropdown(false);
                      }}
                      className={`w-full text-right px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-slate-700/60 transition ${
                        activeBranch?.id === br.id ? 'bg-emerald-50/80 dark:bg-emerald-950/60 font-bold text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{br.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{br.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Badge */}
        <button 
          onClick={onOpenLoginModal}
          className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-medium transition shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
          title="تبديل المستخدم"
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-right">
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">المستخدم</div>
            <div className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-100">{user ? user.name : 'زائر'}</div>
          </div>
        </button>

        {/* Date Display Pill */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs shadow-2xs shrink-0 whitespace-nowrap">
          <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div className="text-right">
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">التاريخ</div>
            <div className="font-bold font-mono text-[10px] sm:text-xs text-slate-800 dark:text-slate-100">{currentDate || '10/08/2025'}</div>
          </div>
        </div>

        {/* Time Display Pill */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs shadow-2xs shrink-0 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <div className="text-right">
            <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">الوقت</div>
            <div className="font-bold font-mono text-[10px] sm:text-xs text-slate-800 dark:text-slate-100">{currentTime || '05:30:45 م'}</div>
          </div>
        </div>
      </div>

      {/* Left Side: Fixed/Pinned Theme & Notification Quick Action Controls on Mobile */}
      <div className="flex items-center gap-1.5 shrink-0 z-20 bg-white dark:bg-slate-800 py-0.5 pr-1 border-r sm:border-r-0 border-slate-200 dark:border-slate-700">
        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-500 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
          title={theme === 'dark' ? 'التبديل إلى الوضع الفاتح (Light Mode)' : 'التبديل إلى الوضع الداكن (Dark Mode)'}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />}
        </button>

        {/* Notifications Button */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowBranchDropdown(false);
            }}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative border border-slate-200 dark:border-slate-700 transition shadow-2xs cursor-pointer flex items-center justify-center"
            title="التنبيهات"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center shadow-2xs">
              3
            </span>
          </button>

          {showNotifications && (
            <>
              {/* Backdrop overlay to close when clicking outside */}
              <div 
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-3xs sm:bg-transparent" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="fixed top-12 left-3 right-3 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:w-80 mt-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>التنبيهات الذكية (3)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline font-bold">قراءة الكل</button>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 sm:hidden">✕</button>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs transition">
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${n.type === 'danger' ? 'bg-rose-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                        {n.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pr-3.5">{n.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-2xs cursor-pointer items-center justify-center shrink-0"
          title={isFullscreen ? 'خروج من الشاشة الكاملة (F11)' : 'ملء الشاشة (F11)'}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>
      </div>
    </header>
  );
};
