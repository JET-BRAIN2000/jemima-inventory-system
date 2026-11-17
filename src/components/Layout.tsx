import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, PackagePlus, Package, ShoppingCart,
  BarChart3, Settings, LogOut, Store, Bell, Sun, Moon,
  Menu, X, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { ActivePage } from '../types';

interface NavItem {
  id: ActivePage;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser, currentProfile, storeInfo, activePage, setActivePage, logout, theme, toggleTheme, notifCount, inventory } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'add-item', label: 'Add Item', icon: <PackagePlus className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
    { id: 'sales', label: 'Sales', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const lowStockItems = inventory.filter(i => i.quantity_current > 0 && i.quantity_current <= 10);
  const outOfStockItems = inventory.filter(i => i.quantity_current === 0);

  const navigate = (page: ActivePage) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-gray-800 dark:text-white truncate">
              {storeInfo?.store_name ?? 'JEMIMA STORE'}
            </p>
            <p className="text-xs text-emerald-600 font-semibold">JEMIMA 1</p>
          </div>
          <button className="ml-auto lg:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(currentProfile?.full_name || currentUser?.username || 'U')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                {currentProfile?.full_name || currentUser?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentProfile?.job_title || 'Store Owner'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${activePage === item.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
              {activePage === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
            </button>
          ))}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className={`
          flex items-center gap-4 px-4 lg:px-6 h-16 border-b flex-shrink-0
          ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1">
            <h1 className={`text-base lg:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {navItems.find(n => n.id === activePage)?.label ?? 'Dashboard'}
            </h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Welcome back, {currentProfile?.full_name || currentUser?.username}!
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute right-0 top-12 w-80 rounded-2xl shadow-xl border z-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">No alerts! All stock levels are fine.</div>
                    ) : (
                      <>
                        {outOfStockItems.map(item => (
                          <div key={item.item_id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{item.product_name}</p>
                              <p className="text-xs text-red-600 font-medium">OUT OF STOCK</p>
                            </div>
                          </div>
                        ))}
                        {lowStockItems.map(item => (
                          <div key={item.item_id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700">
                            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{item.product_name}</p>
                              <p className="text-xs text-yellow-600 font-medium">Low Stock: {item.quantity_current} units</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings shortcut */}
            <button onClick={() => navigate('settings')}
              className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Settings className="w-5 h-5" />
            </button>

            {/* Sign Out */}
            <button onClick={() => setShowLogoutConfirm(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Logout Confirm Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
              <LogOut className="w-7 h-7 text-red-600" />
            </div>
            <h3 className={`text-lg font-bold text-center mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Sign Out?</h3>
            <p className={`text-center text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Are you sure you want to sign out of JEMIMA 1?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                Cancel
              </button>
              <button onClick={() => { logout(); setShowLogoutConfirm(false); }}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all">
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
