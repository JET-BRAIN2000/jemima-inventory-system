export interface User {
  user_id: string;
  username: string;
  email: string;
  password: string;
  account_status: 'Active' | 'Inactive';
  created_date: string;
  last_login: string | null;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  job_title: 'Store Owner' | 'Manager' | 'Cashier' | 'Sales Representative' | 'Accountant';
  phone_number: string;
  date_of_birth: string;
  address: string;
  profile_picture_path: string;
  date_modified: string;
}

export interface StoreInfo {
  store_id: string;
  user_id: string;
  store_name: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_logo_path: string;
  base_currency: string;
  currency_symbol: string;
  timezone: string;
  date_created: string;
  date_modified: string;
}

export interface ProductCategory {
  category_id: string;
  user_id: string;
  category_name: string;
  description: string;
  date_created: string;
}

export interface InventoryItem {
  item_id: string;
  user_id: string;
  product_name: string;
  category_id: string;
  category_name: string;
  unit_price: number;
  quantity_current: number;
  quantity_initial: number;
  description: string;
  item_status: 'Active' | 'Inactive';
  date_added: string;
  date_modified: string;
}

export interface SaleLog {
  sale_id: string;
  user_id: string;
  customer_name: string;
  item_id: string;
  item_name: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  payment_method: 'Cash' | 'Credit Card' | 'Debit Card' | 'Mobile Money' | 'Check';
  sale_timestamp: string;
  receipt_number: string;
  transaction_status: 'Completed' | 'Pending' | 'Cancelled';
}

export type NewSale = Omit<SaleLog, 'sale_id' | 'sale_timestamp' | 'transaction_status'>;

export interface DailyRevenue {
  revenue_id: string;
  user_id: string;
  sale_date: string;
  daily_total: number;
  weekly_total: number;
  monthly_total: number;
  yearly_total: number;
  last_updated: string;
}

export type ActivePage =
  | 'dashboard'
  | 'add-item'
  | 'inventory'
  | 'sales'
  | 'statistics'
  | 'settings';

export type ThemeMode = 'light' | 'dark';
