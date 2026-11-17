import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../api';
import { ProductCategory } from '../types';
import { PackagePlus, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddItemPage() {
  const { currentUser, refreshInventory, setActivePage, theme } = useApp();

  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [unitPrice, setUnitPrice] = useState('');
  const [initialQty, setInitialQty] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = (await api.getCategories()) as ProductCategory[];
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories', error);
      }
    };
    loadCategories();
  }, []);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`;

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    if (categories.find(c => c.category_name.toLowerCase() === newCategory.trim().toLowerCase())) {
      setMsg({ type: 'error', text: 'Category already exists.' });
      return;
    }

    setLoading(true);
    try {
      const result = await api.addCategory({ category_name: newCategory.trim(), description: '' });
      const cat: ProductCategory = {
        category_id: result.category_id,
        user_id: currentUser!.user_id,
        category_name: result.category_name,
        description: result.description || '',
        date_created: new Date().toISOString(),
      };
      setCategories(prev => [...prev, cat]);
      setCategoryId(cat.category_id);
      setNewCategory('');
      setShowNewCat(false);
      setMsg({ type: 'success', text: `Category "${cat.category_name}" created!` });
      setTimeout(() => setMsg(null), 2000);
    } catch (error: any) {
      setMsg({ type: 'error', text: error?.message || 'Failed to create category.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!productName.trim()) return setMsg({ type: 'error', text: 'Product name is required.' });
    if (!categoryId) return setMsg({ type: 'error', text: 'Please select a category.' });
    if (!unitPrice || Number(unitPrice) <= 0) return setMsg({ type: 'error', text: 'Unit price must be greater than 0.' });
    if (!initialQty || Number(initialQty) <= 0 || !Number.isInteger(Number(initialQty))) return setMsg({ type: 'error', text: 'Quantity must be a positive whole number.' });

    const existing = categories.find(c => c.category_id === categoryId);
    if (!existing) return setMsg({ type: 'error', text: 'Selected category is invalid.' });

    setLoading(true);
    try {
      const category = categories.find(c => c.category_id === categoryId);
      await api.addItem({
        product_name: productName.trim(),
        category_id: categoryId,
        category_name: category?.category_name ?? '',
        unit_price: parseFloat(Number(unitPrice).toFixed(2)),
        quantity_initial: parseInt(initialQty),
        description: description.trim(),
      });

      await refreshInventory();
      setMsg({ type: 'success', text: `"${productName.trim()}" has been added to inventory!` });
      setProductName('');
      setCategoryId('');
      setUnitPrice('');
      setInitialQty('');
      setDescription('');
    } catch (error: any) {
      setMsg({ type: 'error', text: error?.message || 'Failed to add item.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-gray-800'}`}>Add New Item</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Add a new product to your store inventory</p>
        </div>

        <div className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}>
          {msg && (
            <div className={`flex items-center gap-2.5 p-4 rounded-xl mb-6 text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {msg.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Name */}
            <div>
              <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Rice (5kg), Groundnut Oil (1L)..."
                value={productName}
                onChange={e => setProductName(e.target.value)}
                maxLength={150}
              />
            </div>

            {/* Category */}
            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select
                  className={`${inputCls} flex-1`}
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCat(!showNewCat)}
                  className="px-3 py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
                  title="Add new category"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showNewCat && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="New category name..."
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Price + Qty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Unit Price <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Initial Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="0"
                  min="1"
                  step="1"
                  value={initialQty}
                  onChange={e => setInitialQty(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>Description <span className={`text-xs normal-case ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(optional)</span></label>
              <textarea
                className={`${inputCls} resize-none`}
                placeholder="Product description..."
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={500}
              />
            </div>

            {/* Preview */}
            {productName && unitPrice && initialQty && (
              <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600 bg-gray-750' : 'border-emerald-200 bg-emerald-50/50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-emerald-700'}`}>Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <PackagePlus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{productName}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {categories.find(c => c.category_id === categoryId)?.category_name || 'Category'} · {initialQty} units @ {unitPrice}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivePage('inventory')}
                className={`flex-1 py-3.5 rounded-xl border text-sm font-semibold transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                View Inventory
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-60 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save to Inventory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
