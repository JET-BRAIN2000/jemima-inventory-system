import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../api';
import { InventoryItem } from '../types';
import {
  Package, Search, Edit3, Trash2, CheckCircle2, AlertCircle,
  TrendingUp, AlertTriangle, X, Save, Eye,
} from 'lucide-react';

type SortKey = 'product_name' | 'unit_price' | 'quantity_current' | 'category_name';

export default function InventoryPage() {
  const { inventory, refreshInventory, currencySymbol, theme, setActivePage } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'instock' | 'low' | 'out'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('product_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = isDark ? 'text-white' : 'text-gray-800';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800'}`;

  const categories = [...new Set(inventory.map(i => i.category_name))].sort();
  const fmt = (n: number) => formatCurrency(n, currencySymbol);

  const filtered = useMemo(() => {
    return inventory
      .filter(i => {
        const matchSearch = i.product_name.toLowerCase().includes(search.toLowerCase()) ||
          i.category_name.toLowerCase().includes(search.toLowerCase());
        const matchCat = !categoryFilter || i.category_name === categoryFilter;
        const matchStatus = statusFilter === 'all' ? true
          : statusFilter === 'out' ? i.quantity_current === 0
          : statusFilter === 'low' ? i.quantity_current > 0 && i.quantity_current <= 10
          : i.quantity_current > 10;
        return matchSearch && matchCat && matchStatus;
      })
      .sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [inventory, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const totalValue = inventory.reduce((s, i) => s + i.unit_price * i.quantity_current, 0);
  const totalUnits = inventory.reduce((s, i) => s + i.quantity_current, 0);
  const lowStock = inventory.filter(i => i.quantity_current > 0 && i.quantity_current <= 10).length;
  const outOfStock = inventory.filter(i => i.quantity_current === 0).length;

  const getStockBadge = (qty: number) => {
    if (qty === 0) return <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-red-100 text-red-700">Out of Stock</span>;
    if (qty <= 10) return <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-yellow-100 text-yellow-700">Low Stock</span>;
    return <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700">In Stock</span>;
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = async (item: InventoryItem) => {
    try {
      await api.deleteItem(item.item_id);
      await refreshInventory();
      setDeleteConfirm(null);
      setMsg({ type: 'success', text: `"${item.product_name}" removed from inventory.` });
      setTimeout(() => setMsg(null), 3000);
    } catch (error: any) {
      setMsg({ type: 'error', text: error?.message || 'Failed to remove item.' });
    }
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    if (editItem.unit_price <= 0) return setMsg({ type: 'error', text: 'Price must be greater than 0.' });
    try {
      await api.updateItem(editItem.item_id, {
        product_name: editItem.product_name,
        category_name: editItem.category_name,
        unit_price: editItem.unit_price,
        quantity_current: editItem.quantity_current,
        description: editItem.description,
      });
      await refreshInventory();
      setEditItem(null);
      setMsg({ type: 'success', text: `"${editItem.product_name}" updated successfully!` });
      setTimeout(() => setMsg(null), 3000);
    } catch (error: any) {
      setMsg({ type: 'error', text: error?.message || 'Failed to update item.' });
    }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className={`text-left text-xs font-bold uppercase tracking-wide hover:text-emerald-600 ${text}`}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: inventory.length, icon: <Package className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Total Units', value: totalUnits.toLocaleString(), icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Low Stock', value: lowStock, icon: <AlertTriangle className="w-5 h-5" />, bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Out of Stock', value: outOfStock, icon: <AlertTriangle className="w-5 h-5" />, bg: 'bg-red-50', color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className={`text-xs ${subtext}`}>{s.label}</p>
            <p className={`font-extrabold text-lg ${text}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className={`rounded-2xl border p-4 ${cardBg} shadow-sm flex items-center gap-4`}>
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-xs ${subtext}`}>Total Inventory Value</p>
          <p className={`text-2xl font-extrabold ${text}`}>{fmt(totalValue)}</p>
        </div>
        <button onClick={() => setActivePage('add-item')} className="ml-auto px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all">
          + Add Item
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              className={`${inputCls} w-full pl-9`} />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={inputCls}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1">
            {(['all', 'instock', 'low', 'out'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? 'bg-emerald-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {s === 'all' ? 'All' : s === 'instock' ? 'In Stock' : s === 'low' ? 'Low' : 'Out'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
                <th className="px-4 py-3 text-left"><SortBtn k="product_name" label="Product" /></th>
                <th className="px-4 py-3 text-left"><SortBtn k="category_name" label="Category" /></th>
                <th className="px-4 py-3 text-right"><SortBtn k="unit_price" label="Price" /></th>
                <th className="px-4 py-3 text-right"><SortBtn k="quantity_current" label="Qty" /></th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-400">No items found</td></tr>
              ) : filtered.map(item => (
                <tr key={item.item_id} className={`transition-colors ${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${text}`}>{item.product_name}</p>
                        <p className={`text-xs ${subtext}`}>ID: {item.item_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{item.category_name}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${text}`}>{fmt(item.unit_price)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${item.quantity_current === 0 ? 'text-red-600' : item.quantity_current <= 10 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                      {item.quantity_current}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStockBadge(item.quantity_current)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm ${text}`}>{fmt(item.unit_price * item.quantity_current)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => setViewItem(item)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => setEditItem({ ...item })} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(item)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-xs ${subtext}`}>Showing {filtered.length} of {inventory.length} items</p>
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold text-lg ${text}`}>Edit Item</h3>
              <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`text-xs font-semibold ${subtext} uppercase tracking-wide block mb-1`}>Product Name</label>
                <input type="text" value={editItem.product_name} onChange={e => setEditItem({ ...editItem, product_name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-emerald-400`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold ${subtext} uppercase tracking-wide block mb-1`}>Unit Price</label>
                  <input type="number" min="0.01" step="0.01" value={editItem.unit_price} onChange={e => setEditItem({ ...editItem, unit_price: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-emerald-400`} />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${subtext} uppercase tracking-wide block mb-1`}>Quantity</label>
                  <input type="number" min="0" step="1" value={editItem.quantity_current} onChange={e => setEditItem({ ...editItem, quantity_current: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-emerald-400`} />
                </div>
              </div>
              <div>
                <label className={`text-xs font-semibold ${subtext} uppercase tracking-wide block mb-1`}>Description</label>
                <textarea value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} rows={2}
                  className={`w-full px-4 py-3 rounded-xl border text-sm resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-emerald-400`} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditItem(null)} className={`flex-1 py-3 rounded-xl border text-sm font-semibold ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'} hover:bg-gray-50 transition-all`}>Cancel</button>
              <button onClick={handleEditSave} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-bold text-lg ${text}`}>Item Details</h3>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Package className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className={`font-bold text-lg ${text}`}>{viewItem.product_name}</p>
                <p className={`text-sm ${subtext}`}>{viewItem.category_name}</p>
                {getStockBadge(viewItem.quantity_current)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Item ID', value: viewItem.item_id },
                { label: 'Unit Price', value: fmt(viewItem.unit_price) },
                { label: 'Current Qty', value: viewItem.quantity_current },
                { label: 'Initial Qty', value: viewItem.quantity_initial },
                { label: 'Total Value', value: fmt(viewItem.unit_price * viewItem.quantity_current) },
                { label: 'Units Sold', value: viewItem.quantity_initial - viewItem.quantity_current },
                { label: 'Date Added', value: new Date(viewItem.date_added).toLocaleDateString() },
                { label: 'Last Updated', value: new Date(viewItem.date_modified).toLocaleDateString() },
              ].map((row, i) => (
                <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-xs ${subtext}`}>{row.label}</p>
                  <p className={`font-bold text-sm ${text}`}>{row.value}</p>
                </div>
              ))}
            </div>
            {viewItem.description && (
              <div className={`mt-4 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-xs ${subtext} mb-1`}>Description</p>
                <p className={`text-sm ${text}`}>{viewItem.description}</p>
              </div>
            )}
            <button onClick={() => setViewItem(null)} className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">Close</button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className={`font-bold text-lg text-center mb-2 ${text}`}>Remove Item?</h3>
            <p className={`text-center text-sm mb-6 ${subtext}`}>
              Are you sure you want to remove <strong>"{deleteConfirm.product_name}"</strong> from inventory? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className={`flex-1 py-3 rounded-xl border text-sm font-semibold ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'}`}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
