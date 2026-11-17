import type { NewSale } from './types';

declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('jemima_token');
}

function setToken(value: string | null) {
  if (value) localStorage.setItem('jemima_token', value);
  else localStorage.removeItem('jemima_token');
}

function setCurrentUser(user: { user_id: string; username: string } | null) {
  if (user) localStorage.setItem('jemima_current_user', JSON.stringify(user));
  else localStorage.removeItem('jemima_current_user');
}

function getCurrentUser() {
  const raw = localStorage.getItem('jemima_current_user');
  return raw ? JSON.parse(raw) as { user_id: string; username: string } : null;
}

type JsonRequestInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: any;
  headers?: Record<string, string>;
};

async function request(path: string, options: JsonRequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.error || res.statusText || 'Request failed');
  }
  return data;
}

export const api = {
  auth: {
    async login(username: string, password: string) {
      const data = await request('/api/auth/login', { method: 'POST', body: { username, password } });
      setToken(data.token);
      setCurrentUser({ user_id: data.user_id, username: data.username });
      return data;
    },
    async register(username: string, email: string, password: string) {
      return request('/api/auth/register', { method: 'POST', body: { username, email, password } });
    },
    async me() {
      return request('/api/auth/me');
    },
    async changePassword(current_password: string, new_password: string) {
      return request('/api/auth/change-password', { method: 'POST', body: { current_password, new_password } });
    },
    logout() {
      setToken(null);
      setCurrentUser(null);
    },
    getCurrentUser,
  },
  getInventory() {
    return request('/api/inventory');
  },
  getSales() {
    return request('/api/sales');
  },
  getCategories() {
    return request('/api/categories');
  },
  getProfile() {
    return request('/api/profile');
  },
  getStore() {
    return request('/api/store');
  },
  addCategory(category: { category_name: string; description?: string }) {
    return request('/api/categories', { method: 'POST', body: category });
  },
  addItem(item: { product_name: string; category_id: string; category_name: string; unit_price: number; quantity_initial: number; description?: string }) {
    return request('/api/inventory', { method: 'POST', body: item });
  },
  updateItem(itemId: string, payload: Record<string, any>) {
    return request(`/api/inventory/${itemId}`, { method: 'PUT', body: payload });
  },
  deleteItem(itemId: string) {
    return request(`/api/inventory/${itemId}`, { method: 'DELETE' });
  },
  addSale(sale: NewSale) {
    return request('/api/sales', { method: 'POST', body: sale });
  },
  updateProfile(payload: Record<string, any>) {
    return request('/api/profile', { method: 'PUT', body: payload });
  },
  updateStore(payload: Record<string, any>) {
    return request('/api/store', { method: 'PUT', body: payload });
  },
};

export default api;
