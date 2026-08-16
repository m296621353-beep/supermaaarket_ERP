import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Sidebar, ScreenType } from './components/Sidebar';
import { DashboardScreen } from './components/Dashboard/DashboardScreen';
import { POSScreen } from './components/POS/POSScreen';
import { InventoryScreen } from './components/Inventory/InventoryScreen';
import { BranchesScreen } from './components/Branches/BranchesScreen';
import { UsersScreen } from './components/Users/UsersScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { CustomersScreen } from './components/Customers/CustomersScreen';
import { SuppliersScreen } from './components/Suppliers/SuppliersScreen';
import { PurchasesScreen } from './components/Purchases/PurchasesScreen';
import { ExpensesScreen } from './components/Expenses/ExpensesScreen';
import { TreasuryScreen } from './components/Treasury/TreasuryScreen';
import { BankingScreen } from './components/Banking/BankingScreen';
import { PayrollScreen } from './components/Payroll/PayrollScreen';
import { GeneralLedgerScreen } from './components/Accounting/GeneralLedgerScreen';
import { TaxReportScreen } from './components/Accounting/TaxReportScreen';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { LoginModal } from './components/LoginModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('pos'); // POS as flagship view default or dashboard
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global Navigation & Help Shortcuts Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F1 or Shift+? -> Open Shortcuts Helper
      if (e.key === 'F1' || (e.shiftKey && e.key === '?')) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // Alt + 1-0 Global Navigation (supports numbers regardless of active keyboard layout)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
          e.preventDefault();
          setActiveScreen('dashboard');
        } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
          e.preventDefault();
          setActiveScreen('pos');
        } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
          e.preventDefault();
          setActiveScreen('purchases');
        } else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
          e.preventDefault();
          setActiveScreen('inventory');
        } else if (e.key === '5' || e.code === 'Digit5' || e.code === 'Numpad5') {
          e.preventDefault();
          setActiveScreen('treasury');
        } else if (e.key === '6' || e.code === 'Digit6' || e.code === 'Numpad6') {
          e.preventDefault();
          setActiveScreen('banking');
        } else if (e.key === '7' || e.code === 'Digit7' || e.code === 'Numpad7') {
          e.preventDefault();
          setActiveScreen('payroll');
        } else if (e.key === '8' || e.code === 'Digit8' || e.code === 'Numpad8') {
          e.preventDefault();
          setActiveScreen('ledger');
        } else if (e.key === '9' || e.code === 'Digit9' || e.code === 'Numpad9') {
          e.preventDefault();
          setActiveScreen('reports');
        } else if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
          e.preventDefault();
          setActiveScreen('settings');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const screenNames: Record<ScreenType, string> = {
    dashboard: 'الشاشة الرئيسية - ERP Dashboard',
    pos: 'نقطة البيع الكاشير (POS)',
    purchases: 'إدارة المشتريات وفواتير التوريد',
    inventory: 'إدارة المنتجات والمخزون',
    branches: 'إدارة الفروع والمخازن',
    customers: 'سجل العملاء وإدارة الحسابات',
    suppliers: 'سجل الموردين وشركات التوزيع',
    expenses: 'إدارة المصروفات والنثريات',
    treasury: 'الخزينة النقدية الرئيسية',
    banking: 'الحسابات البنكية والتحويلات',
    payroll: 'إدارة الموظفين ومسيرات الرواتب',
    ledger: 'الحسابات العامة والقيود المحاسبية',
    taxes: 'الضرائب والإقرار الضريبي 14%',
    reports: 'التقارير المتقدمة والقوائم المالية',
    users: 'المستخدمين والصلاحيات والأنشطة',
    settings: 'إعدادات النظام والنسخ الاحتياطي'
  };

  return (
    <div dir="rtl" className="flex h-screen bg-[#f5f7fa] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      
      {/* Right Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        onSelectScreen={(s) => setActiveScreen(s)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Status Bar */}
        <Header 
          onOpenLoginModal={() => setShowLoginModal(true)} 
          activeScreenName={screenNames[activeScreen]} 
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-y-auto relative">
          <ErrorBoundary>
            {activeScreen === 'dashboard' && <DashboardScreen onNavigate={(s) => setActiveScreen(s)} />}
            {activeScreen === 'pos' && <POSScreen />}
            {activeScreen === 'purchases' && <PurchasesScreen />}
            {activeScreen === 'inventory' && <InventoryScreen />}
            {activeScreen === 'branches' && <BranchesScreen />}
            {activeScreen === 'customers' && <CustomersScreen />}
            {activeScreen === 'suppliers' && <SuppliersScreen />}
            {activeScreen === 'expenses' && <ExpensesScreen />}
            {activeScreen === 'treasury' && <TreasuryScreen />}
            {activeScreen === 'banking' && <BankingScreen />}
            {activeScreen === 'payroll' && <PayrollScreen />}
            {activeScreen === 'ledger' && <GeneralLedgerScreen />}
            {activeScreen === 'taxes' && <TaxReportScreen />}
            {activeScreen === 'reports' && <ReportsScreen />}
            {activeScreen === 'users' && <UsersScreen />}
            {activeScreen === 'settings' && <SettingsScreen />}
          </ErrorBoundary>
        </main>

      </div>

      {/* Login / User Switcher Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
