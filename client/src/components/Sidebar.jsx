import React from 'react';
import {
  LayoutDashboard,
  Package,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  X,
  DollarSign,
  Users,
} from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../hooks/useLanguage';

export const Sidebar = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen
}) => {
  const { t, isRTL } = useLanguage();

  // The off-screen transform is picked in JS rather than with `rtl:`/`ltr:`
  // variants: those compile to `[dir="..."] .class`, which outranks the
  // `lg:translate-x-0` that pins the sidebar open on desktop.
  const closedTransform = isRTL ? 'translate-x-full' : '-translate-x-full';

  const menuItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { id: 'products', labelKey: 'nav.products', icon: Package },
    { id: 'stock', labelKey: 'nav.stock', icon: TrendingUp },
    { id: 'currentStock', labelKey: 'nav.currentStock', icon: Package },
    { id: 'analytics', labelKey: 'nav.analytics', icon: BarChart3 },
    { id: 'sales', labelKey: 'nav.sales', icon: TrendingUp },
    { id: 'damages', labelKey: 'nav.damages', icon: AlertTriangle },
    { id: 'vendor-management', labelKey: 'nav.vendors', icon: Users },
    { id: 'vendor-transactions', labelKey: 'nav.vendorAccounts', icon: DollarSign },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 h-screen bg-white dark:bg-slate-900 z-50 transition-transform duration-300
          ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l border-slate-200 dark:border-slate-800
          ${isOpen ? 'translate-x-0' : closedTransform}
          lg:translate-x-0 lg:static
          w-64
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg hover-scale">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient">{t('common.appName')}</h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-200">{t('common.warehouse')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden icon-button"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 w-full  overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setIsOpen(false);
              }}
              className={`nav-item w-full group ${activeView === item.id ? 'active' : ''}`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${activeView === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100'}`} />
              <span className={`whitespace-nowrap ${activeView === item.id ? 'text-primary-700 dark:text-primary-300' : ''}`}>{t(item.labelKey)}</span>
              
            </button>
          ))}
        </nav>

        {/* Appearance & language */}
        <div className="hidden lg:block px-4 py-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider">{t('common.theme')}</span>
            <ThemeSwitcher />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider">{t('common.language')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50  dark:bg-slate-900">
          <p className="text-xs text-center text-slate-600 dark:text-slate-200">{t('common.copyright')}</p>
        </div>
      </div>
    </>
  );
};