import {
  User, UserProfile, StoreInfo, ProductCategory,
  InventoryItem, SaleLog
} from '../types';

// ─── Seed helpers ─────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const dateOnly = (d: Date) => d.toISOString().split('T')[0];

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USER: User = {
  user_id: 'u001',
  username: 'admin',
  email: 'admin@jemima.store',
  password: 'Admin@123',           // plain for demo — in prod use bcrypt
  account_status: 'Active',
  created_date: '2026-01-01T08:00:00.000Z',
  last_login: null,
};

const SEED_PROFILE: UserProfile = {
  user_id: 'u001',
  full_name: 'Jemima Store Admin',
  job_title: 'Store Owner',
  phone_number: '+234 801 234 5678',
  date_of_birth: '1990-05-15',
  address: '12 Market Street, Lagos, Nigeria',
  profile_picture_path: '',
  date_modified: now(),
};

const SEED_STORE: StoreInfo = {
  store_id: 's001',
  user_id: 'u001',
  store_name: 'Jemima Provision Store',
  store_description: 'Your one-stop shop for quality provisions',
  store_address: '12 Market Street, Lagos, Nigeria',
  store_phone: '+234 801 234 5678',
  store_email: 'info@jemima.store',
  store_logo_path: '',
  base_currency: 'NGN',
  currency_symbol: '₦',
  timezone: 'UTC+1 (West Africa Time)',
  date_created: '2026-01-01T08:00:00.000Z',
  date_modified: now(),
};

const SEED_CATEGORIES: ProductCategory[] = [
  { category_id: 'c001', user_id: 'u001', category_name: 'Grains & Rice', description: 'All grain products', date_created: now() },
  { category_id: 'c002', user_id: 'u001', category_name: 'Cooking Oil', description: 'Vegetable and cooking oils', date_created: now() },
  { category_id: 'c003', user_id: 'u001', category_name: 'Sweeteners', description: 'Sugar and related products', date_created: now() },
  { category_id: 'c004', user_id: 'u001', category_name: 'Seasonings', description: 'Salt, spices, and condiments', date_created: now() },
  { category_id: 'c005', user_id: 'u001', category_name: 'Beverages', description: 'Drinks and beverages', date_created: now() },
  { category_id: 'c006', user_id: 'u001', category_name: 'Dairy & Eggs', description: 'Dairy products and eggs', date_created: now() },
  { category_id: 'c007', user_id: 'u001', category_name: 'Canned Goods', description: 'Tinned and packaged food', date_created: now() },
  { category_id: 'c008', user_id: 'u001', category_name: 'Snacks', description: 'Biscuits, chips, and snacks', date_created: now() },
];

const SEED_ITEMS: InventoryItem[] = [
  { item_id: 'i001', user_id: 'u001', product_name: 'Rice (5kg)', category_id: 'c001', category_name: 'Grains & Rice', unit_price: 4500, quantity_current: 45, quantity_initial: 100, description: 'Premium long-grain parboiled rice', item_status: 'Active', date_added: '2026-01-10T09:00:00.000Z', date_modified: now() },
  { item_id: 'i002', user_id: 'u001', product_name: 'Groundnut Oil (1L)', category_id: 'c002', category_name: 'Cooking Oil', unit_price: 1800, quantity_current: 30, quantity_initial: 60, description: 'Pure groundnut cooking oil', item_status: 'Active', date_added: '2026-01-10T09:00:00.000Z', date_modified: now() },
  { item_id: 'i003', user_id: 'u001', product_name: 'Sugar (1kg)', category_id: 'c003', category_name: 'Sweeteners', unit_price: 1200, quantity_current: 80, quantity_initial: 100, description: 'Refined white sugar', item_status: 'Active', date_added: '2026-01-10T09:00:00.000Z', date_modified: now() },
  { item_id: 'i004', user_id: 'u001', product_name: 'Table Salt (1kg)', category_id: 'c004', category_name: 'Seasonings', unit_price: 400, quantity_current: 7, quantity_initial: 50, description: 'Iodized table salt', item_status: 'Active', date_added: '2026-01-10T09:00:00.000Z', date_modified: now() },
  { item_id: 'i005', user_id: 'u001', product_name: 'Milo (500g)', category_id: 'c005', category_name: 'Beverages', unit_price: 2500, quantity_current: 20, quantity_initial: 40, description: 'Chocolate malt drink', item_status: 'Active', date_added: '2026-01-15T09:00:00.000Z', date_modified: now() },
  { item_id: 'i006', user_id: 'u001', product_name: 'Evaporated Milk (peak)', category_id: 'c006', category_name: 'Dairy & Eggs', unit_price: 650, quantity_current: 0, quantity_initial: 60, description: 'Peak evaporated milk 170g', item_status: 'Active', date_added: '2026-01-15T09:00:00.000Z', date_modified: now() },
  { item_id: 'i007', user_id: 'u001', product_name: 'Tomato Paste (tin)', category_id: 'c007', category_name: 'Canned Goods', unit_price: 350, quantity_current: 55, quantity_initial: 80, description: 'Tomato paste 400g tin', item_status: 'Active', date_added: '2026-01-20T09:00:00.000Z', date_modified: now() },
  { item_id: 'i008', user_id: 'u001', product_name: 'Cabin Biscuits', category_id: 'c008', category_name: 'Snacks', unit_price: 200, quantity_current: 120, quantity_initial: 150, description: 'Cabin cream crackers', item_status: 'Active', date_added: '2026-01-20T09:00:00.000Z', date_modified: now() },
  { item_id: 'i009', user_id: 'u001', product_name: 'Spaghetti (500g)', category_id: 'c001', category_name: 'Grains & Rice', unit_price: 800, quantity_current: 3, quantity_initial: 50, description: 'Golden pasta spaghetti', item_status: 'Active', date_added: '2026-02-01T09:00:00.000Z', date_modified: now() },
  { item_id: 'i010', user_id: 'u001', product_name: 'Vegetable Oil (2L)', category_id: 'c002', category_name: 'Cooking Oil', unit_price: 2800, quantity_current: 18, quantity_initial: 30, description: 'Pure vegetable oil 2 litres', item_status: 'Active', date_added: '2026-02-01T09:00:00.000Z', date_modified: now() },
];

// Generate past sales for 365 days
function generateSeedSales(): SaleLog[] {
  const sales: SaleLog[] = [];
  const methods: SaleLog['payment_method'][] = ['Cash', 'Mobile Money', 'Credit Card', 'Debit Card', 'Check'];
  const customers = ['Amaka', 'Chidi', 'Funmi', 'Emeka', 'Ngozi', 'Tunde', 'Kemi', 'Bola', 'Seun', 'Yemi'];
  let saleNum = 1;

  for (let d = 364; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const salesCount = 3 + Math.floor(Math.random() * 6); // 3-8 sales per day

    for (let s = 0; s < salesCount; s++) {
      const item = SEED_ITEMS[Math.floor(Math.random() * SEED_ITEMS.length)];
      const qty = 1 + Math.floor(Math.random() * 5);
      const total = qty * item.unit_price;
      const saleDate = new Date(date);
      saleDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      sales.push({
        sale_id: `sale-${String(saleNum).padStart(5, '0')}`,
        user_id: 'u001',
        customer_name: customers[Math.floor(Math.random() * customers.length)],
        item_id: item.item_id,
        item_name: item.product_name,
        quantity_sold: qty,
        unit_price: item.unit_price,
        total_amount: total,
        payment_method: methods[Math.floor(Math.random() * methods.length)],
        sale_timestamp: saleDate.toISOString(),
        receipt_number: `RCP-${String(saleNum).padStart(5, '0')}`,
        transaction_status: 'Completed',
      });
      saleNum++;
    }
  }
  return sales;
}

// ─── Local-storage persistence ─────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Initialize store once ─────────────────────────────────────────────────
function initStore() {
  if (!localStorage.getItem('jemima_initialized')) {
    save('jemima_users', [SEED_USER]);
    save('jemima_profiles', [SEED_PROFILE]);
    save('jemima_store_info', SEED_STORE);
    save('jemima_categories', SEED_CATEGORIES);
    save('jemima_inventory', SEED_ITEMS);
    save('jemima_sales', generateSeedSales());
    localStorage.setItem('jemima_initialized', '1');
  }
}

initStore();

// ─── Data Access Layer ─────────────────────────────────────────────────────
export const db = {
  // Users
  getUsers: (): User[] => load('jemima_users', []),
  saveUsers: (u: User[]) => save('jemima_users', u),
  getUserByUsername: (username: string) =>
    db.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase()),
  getUserByEmail: (email: string) =>
    db.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()),
  addUser: (u: User) => { const users = db.getUsers(); users.push(u); db.saveUsers(users); },
  updateUser: (updated: User) => {
    const users = db.getUsers().map(u => u.user_id === updated.user_id ? updated : u);
    db.saveUsers(users);
  },

  // Profiles
  getProfiles: (): UserProfile[] => load('jemima_profiles', []),
  saveProfiles: (p: UserProfile[]) => save('jemima_profiles', p),
  getProfile: (userId: string) => db.getProfiles().find(p => p.user_id === userId),
  addProfile: (p: UserProfile) => { const ps = db.getProfiles(); ps.push(p); db.saveProfiles(ps); },
  updateProfile: (updated: UserProfile) => {
    const ps = db.getProfiles().map(p => p.user_id === updated.user_id ? updated : p);
    db.saveProfiles(ps);
  },

  // Store
  getStoreInfo: (): StoreInfo | null => load<StoreInfo | null>('jemima_store_info', null),
  saveStoreInfo: (s: StoreInfo) => save('jemima_store_info', s),

  // Categories
  getCategories: (): ProductCategory[] => load('jemima_categories', []),
  saveCategories: (c: ProductCategory[]) => save('jemima_categories', c),
  addCategory: (c: ProductCategory) => { const cats = db.getCategories(); cats.push(c); db.saveCategories(cats); },

  // Inventory
  getInventory: (): InventoryItem[] => load('jemima_inventory', []),
  saveInventory: (items: InventoryItem[]) => save('jemima_inventory', items),
  getItem: (itemId: string) => db.getInventory().find(i => i.item_id === itemId),
  addItem: (item: InventoryItem) => { const inv = db.getInventory(); inv.push(item); db.saveInventory(inv); },
  updateItem: (updated: InventoryItem) => {
    const inv = db.getInventory().map(i => i.item_id === updated.item_id ? updated : i);
    db.saveInventory(inv);
  },
  softDeleteItem: (itemId: string) => {
    const inv = db.getInventory().map(i =>
      i.item_id === itemId ? { ...i, item_status: 'Inactive' as const, date_modified: now() } : i
    );
    db.saveInventory(inv);
  },

  // Sales
  getSales: (): SaleLog[] => load('jemima_sales', []),
  saveSales: (s: SaleLog[]) => save('jemima_sales', s),
  addSale: (sale: SaleLog) => { const sales = db.getSales(); sales.push(sale); db.saveSales(sales); },

  // Revenue helpers
  getRevenueToday: (userId: string): number => {
    const today = dateOnly(new Date());
    return db.getSales()
      .filter(s => s.user_id === userId && s.transaction_status === 'Completed' && s.sale_timestamp.startsWith(today))
      .reduce((sum, s) => sum + s.total_amount, 0);
  },
  getRevenueWeek: (userId: string): number => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return db.getSales()
      .filter(s => s.user_id === userId && s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= cutoff)
      .reduce((sum, s) => sum + s.total_amount, 0);
  },
  getRevenueMonth: (userId: string): number => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    return db.getSales()
      .filter(s => s.user_id === userId && s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= cutoff)
      .reduce((sum, s) => sum + s.total_amount, 0);
  },
  getRevenueYear: (userId: string): number => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 365);
    return db.getSales()
      .filter(s => s.user_id === userId && s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= cutoff)
      .reduce((sum, s) => sum + s.total_amount, 0);
  },

  // Counters
  nextItemId: (): string => `i${String(db.getInventory().length + 1).padStart(3, '0')}`,
  nextSaleId: (): string => `sale-${String(db.getSales().length + 1).padStart(5, '0')}`,
  nextCategoryId: (): string => `c${String(db.getCategories().length + 1).padStart(3, '0')}`,
  nextUserId: (): string => `u${String(db.getUsers().length + 1).padStart(3, '0')}`,

  // Session
  getCurrentUser: (): User | null => {
    const id = sessionStorage.getItem('jemima_current_user');
    return id ? db.getUsers().find(u => u.user_id === id) || null : null;
  },
  setCurrentUser: (userId: string) => sessionStorage.setItem('jemima_current_user', userId),
  clearSession: () => sessionStorage.removeItem('jemima_current_user'),
};
