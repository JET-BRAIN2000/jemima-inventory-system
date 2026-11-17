import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserProfile, StoreInfo, InventoryItem, SaleLog, ActivePage, ThemeMode } from '../types';
import api from '../api';
import { getCurrencySymbol } from '../data/currencies';

interface AppContextType {
  // Auth
  currentUser: User | null;
  currentProfile: UserProfile | null;
  storeInfo: StoreInfo | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (profile: UserProfile) => Promise<{ success: boolean; message: string }>;
  updateStoreInfo: (store: StoreInfo) => Promise<{ success: boolean; message: string; store?: StoreInfo }>;
  changePassword: (currentPw: string, newPw: string) => Promise<{ success: boolean; message: string }>;

  // Navigation
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;

  // Inventory
  inventory: InventoryItem[];
  refreshInventory: () => Promise<void>;

  // Sales
  sales: SaleLog[];
  refreshSales: () => Promise<void>;

  // Revenue
  revenue: { today: number; week: number; month: number; year: number };
  refreshRevenue: () => void;

  // Currency
  currencySymbol: string;

  // Notification count
  notifCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

function buildStoredUser(): User | null {
  const current = api.auth.getCurrentUser();
  if (!current) return null;
  return {
    user_id: current.user_id,
    username: current.username,
    email: '',
    password: '',
    account_status: 'Active',
    created_date: new Date().toISOString(),
    last_login: null,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(buildStoredUser());
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleLog[]>([]);
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0, year: 0 });

  const currencySymbol = storeInfo?.currency_symbol ?? '$';

  const refreshInventory = useCallback(async () => {
    try {
      const items = (await api.getInventory()) as InventoryItem[];
      setInventory(items);
    } catch (error) {
      console.error('Failed to load inventory', error);
    }
  }, []);

  const refreshSales = useCallback(async () => {
    try {
      const salesData = (await api.getSales()) as SaleLog[];
      setSales(salesData.reverse());
    } catch (error) {
      console.error('Failed to load sales', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = (await api.getProfile()) as UserProfile | null;
      setCurrentProfile(profile);
    } catch (error) {
      console.error('Failed to load profile', error);
    }
  }, []);

  const refreshStore = useCallback(async () => {
    try {
      const store = (await api.getStore()) as StoreInfo | null;
      setStoreInfo(store);
    } catch (error) {
      console.error('Failed to load store info', error);
    }
  }, []);

  const refreshRevenue = useCallback(() => {
    const today = new Date();
    const day = today.toISOString().split('T')[0];
    const weekCutoff = new Date();
    weekCutoff.setDate(weekCutoff.getDate() - 7);
    const monthCutoff = new Date();
    monthCutoff.setDate(monthCutoff.getDate() - 30);
    const yearCutoff = new Date();
    yearCutoff.setDate(yearCutoff.getDate() - 365);

    const todayTotal = sales
      .filter(s => s.transaction_status === 'Completed' && s.sale_timestamp.startsWith(day))
      .reduce((sum, s) => sum + s.total_amount, 0);

    const weekTotal = sales
      .filter(s => s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= weekCutoff)
      .reduce((sum, s) => sum + s.total_amount, 0);

    const monthTotal = sales
      .filter(s => s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= monthCutoff)
      .reduce((sum, s) => sum + s.total_amount, 0);

    const yearTotal = sales
      .filter(s => s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= yearCutoff)
      .reduce((sum, s) => sum + s.total_amount, 0);

    setRevenue({ today: todayTotal, week: weekTotal, month: monthTotal, year: yearTotal });
  }, [sales]);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await api.auth.me();
      if (data?.user) {
        setCurrentUser({
          user_id: data.user.user_id,
          username: data.user.username,
          email: data.user.email,
          password: '',
          account_status: data.user.account_status,
          created_date: data.user.created_date,
          last_login: data.user.last_login,
        });
      } else {
        api.auth.logout();
        setCurrentUser(null);
      }
    } catch (error) {
      api.auth.logout();
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshInventory();
      refreshSales();
      refreshProfile();
      refreshStore();
    }
  }, [currentUser, refreshInventory, refreshSales, refreshProfile, refreshStore]);

  useEffect(() => {
    if (currentUser) {
      refreshAuth();
    }
  }, [currentUser, refreshAuth]);

  useEffect(() => {
    refreshRevenue();
  }, [sales, refreshRevenue]);

  const login = async (username: string, password: string) => {
    try {
      const data = await api.auth.login(username, password);
      const user: User = {
        user_id: data.user_id,
        username: data.username,
        email: '',
        password: '',
        account_status: 'Active',
        created_date: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      setCurrentUser(user);
      await Promise.all([refreshInventory(), refreshSales(), refreshProfile(), refreshStore()]);
      return { success: true, message: 'Login successful!' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Login failed' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await api.auth.register(username, email, password);
      return { success: true, message: 'Account created successfully! Please log in.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    api.auth.logout();
    setCurrentUser(null);
    setCurrentProfile(null);
    setStoreInfo(null);
    setActivePage('dashboard');
    setInventory([]);
    setSales([]);
    setRevenue({ today: 0, week: 0, month: 0, year: 0 });
  };

  const updateProfile = async (profile: UserProfile) => {
    try {
      const payload = {
        full_name:            profile.full_name,
        job_title:            profile.job_title,
        phone_number:         profile.phone_number,
        date_of_birth:        profile.date_of_birth,
        address:              profile.address,
        profile_picture_path: profile.profile_picture_path,
      };
      const result = await api.updateProfile(payload);
      // The server returns a normalised profile (1900-01-01 → '', null → '')
      if (result?.profile) {
        const normalised: UserProfile = {
          user_id:              result.profile.user_id              ?? profile.user_id,
          full_name:            result.profile.full_name            ?? '',
          job_title:            result.profile.job_title            ?? 'Store Owner',
          phone_number:         result.profile.phone_number         ?? '',
          date_of_birth:        result.profile.date_of_birth        ?? '',
          address:              result.profile.address              ?? '',
          profile_picture_path: result.profile.profile_picture_path ?? '',
          date_modified:        result.profile.date_modified        ?? new Date().toISOString(),
        };
        setCurrentProfile(normalised);
        return { success: true, message: 'Profile updated successfully.', profile: normalised };
      } else {
        // Fallback: re-fetch from DB
        await refreshProfile();
      }
      return { success: true, message: 'Profile updated successfully.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Could not update profile' };
    }
  };


  const updateStoreInfo = async (store: StoreInfo) => {
    try {
      const payload = {
        store_name: store.store_name,
        store_description: store.store_description,
        store_address: store.store_address,
        store_phone: store.store_phone,
        store_email: store.store_email,
        store_logo_path: store.store_logo_path,
        base_currency: store.base_currency,
        currency_symbol: getCurrencySymbol(store.base_currency),
        timezone: store.timezone,
      };
      const result = await api.updateStore(payload);
      if (result?.store) {
        const updatedStore = result.store as StoreInfo;
        setStoreInfo(updatedStore);
        return { success: true, message: 'Store information updated successfully.', store: updatedStore };
      }
      await refreshStore();
      return { success: true, message: 'Store information updated successfully.' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Could not update store information' };
    }
  };

  const changePassword = async (currentPw: string, newPw: string) => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };
    try {
      const result = await api.auth.changePassword(currentPw, newPw);
      // Refresh auth data to get updated password_changed_at
      await refreshAuth();
      return { success: true, message: result?.message || 'Password changed successfully!' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Could not change password' };
    }
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const notifCount = inventory.filter(i => i.quantity_current <= 5 && i.quantity_current > 0).length
    + inventory.filter(i => i.quantity_current === 0).length;

  return (
    <AppContext.Provider value={{
      currentUser,
      currentProfile,
      storeInfo,
      login,
      register,
      logout,
      updateProfile,
      updateStoreInfo,
      changePassword,
      activePage,
      setActivePage,
      theme,
      toggleTheme,
      inventory,
      refreshInventory,
      sales,
      refreshSales,
      revenue,
      refreshRevenue,
      currencySymbol,
      notifCount,
    }}>
      <div className={theme === 'dark' ? 'dark' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
