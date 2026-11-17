import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatCurrency';
import api from '../api';
import { NewSale, SaleLog } from '../types';
import {
  ShoppingCart, Plus, CheckCircle2, AlertCircle, X,
  Printer, Search, ChevronLeft, ChevronRight, Receipt,
  CreditCard, Banknote, Smartphone, FileCheck,
} from 'lucide-react';

interface CartItem {
  item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
}

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  'Cash': <Banknote className="w-4 h-4" />,
  'Credit Card': <CreditCard className="w-4 h-4" />,
  'Debit Card': <CreditCard className="w-4 h-4" />,
  'Mobile Money': <Smartphone className="w-4 h-4" />,
  'Check': <FileCheck className="w-4 h-4" />,
};

export default function SalesPage() {
  const { currentUser, inventory, sales, refreshSales, refreshInventory, refreshRevenue, currencySymbol, theme } = useApp();

  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [customerName, setCustomerName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<SaleLog['payment_method']>('Cash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<SaleLog | null>(null);

  // History filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = isDark ? 'text-white' : 'text-gray-800';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800'}`;

  const fmt = (n: number) => formatCurrency(n, currencySymbol);

  const selectedItem = inventory.find(i => i.item_id === selectedItemId);
  const cartTotal = cart.reduce((s, c) => s + c.unit_price * c.quantity, 0);

  const addToCart = () => {
    if (!selectedItemId) return setMsg({ type: 'error', text: 'Please select an item.' });
    if (!qty || Number(qty) <= 0) return setMsg({ type: 'error', text: 'Enter a valid quantity.' });
    const item = inventory.find(i => i.item_id === selectedItemId);
    if (!item) return setMsg({ type: 'error', text: 'Item not found.' });

    const existingInCart = cart.find(c => c.item_id === selectedItemId);
    const totalQty = (existingInCart?.quantity ?? 0) + parseInt(qty);
    if (totalQty > item.quantity_current) {
      return setMsg({ type: 'error', text: `Only ${item.quantity_current} units of "${item.product_name}" available.` });
    }

    if (existingInCart) {
      setCart(cart.map(c => c.item_id === selectedItemId ? { ...c, quantity: totalQty } : c));
    } else {
      setCart([...cart, { item_id: item.item_id, item_name: item.product_name, unit_price: item.unit_price, quantity: parseInt(qty) }]);
    }
    setSelectedItemId('');
    setQty('');
    setMsg(null);
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.item_id !== id));

  const completeSale = async () => {
    if (cart.length === 0) return setMsg({ type: 'error', text: 'Cart is empty. Add items first.' });
    setLoading(true);
    setMsg(null);

    try {
      let lastSale: SaleLog | null = null;
      for (let index = 0; index < cart.length; index++) {
        const cartItem = cart[index];
        const item = inventory.find(i => i.item_id === cartItem.item_id);
        if (!item || item.quantity_current < cartItem.quantity) {
          throw new Error(`Insufficient stock for "${cartItem.item_name}".`);
        }

        const sale: NewSale = {
          user_id: currentUser!.user_id,
          customer_name: customerName.trim() || 'Walk-in Customer',
          item_id: cartItem.item_id,
          item_name: cartItem.item_name,
          quantity_sold: cartItem.quantity,
          unit_price: cartItem.unit_price,
          total_amount: cartItem.unit_price * cartItem.quantity,
          payment_method: paymentMethod,
          receipt_number: `RCP-${String(sales.length + index + 1).padStart(5, '0')}`,
        };

        const result = await api.addSale(sale);
        lastSale = {
          sale_id: result.sale_id,
          user_id: currentUser!.user_id,
          customer_name: sale.customer_name,
          item_id: sale.item_id,
          item_name: sale.item_name,
          quantity_sold: sale.quantity_sold,
          unit_price: sale.unit_price,
          total_amount: sale.total_amount,
          payment_method: sale.payment_method as SaleLog['payment_method'],
          sale_timestamp: new Date().toISOString(),
          receipt_number: sale.receipt_number,
          transaction_status: 'Completed',
        };
      }

      await refreshSales();
      await refreshInventory();
      refreshRevenue();
      setLastReceipt(lastSale);
      setCart([]);
      setCustomerName('');
    } catch (error: any) {
      setMsg({ type: 'error', text: error?.message || 'Failed to complete sale.' });
    } finally {
      setLoading(false);
    }
  };

  // History filter
  const filteredSales = useMemo(() => {
    return sales.filter(s =>
      s.item_name.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      s.receipt_number.toLowerCase().includes(search.toLowerCase())
    );
  }, [sales, search]);

  const totalPages = Math.ceil(filteredSales.length / PER_PAGE);
  const pageSales = filteredSales.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const todaySales = sales.filter(s => s.sale_timestamp.startsWith(new Date().toISOString().split('T')[0]));
  const todayRevenue = todaySales.reduce((s, sale) => s + sale.total_amount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Tabs */}
      <div className={`flex rounded-2xl border p-1 ${cardBg} shadow-sm w-fit gap-1`}>
        {(['new', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-emerald-600 text-white shadow-sm' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
            {t === 'new' ? '+ New Sale' : 'Sales History'}
          </button>
        ))}
      </div>

      {tab === 'new' ? (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Left: Sale Form */}
          <div className={`rounded-2xl border p-5 ${cardBg} shadow-sm space-y-4`}>
            <h2 className={`font-bold text-lg ${text}`}>Record New Sale</h2>

            {msg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {msg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {msg.text}
              </div>
            )}

            <div>
              <label className={`text-xs font-bold uppercase tracking-wide ${subtext} block mb-1.5`}>Customer Name (optional)</label>
              <input type="text" placeholder="Walk-in Customer" value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wide ${subtext} block mb-1.5`}>Select Item</label>
              <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className={inputCls}>
                <option value="">-- Choose product --</option>
                {inventory.filter(i => i.quantity_current > 0).map(i => (
                  <option key={i.item_id} value={i.item_id}>{i.product_name} (Qty: {i.quantity_current})</option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-emerald-50'} flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-bold ${text}`}>{selectedItem.product_name}</p>
                  <p className={`text-xs ${subtext}`}>{selectedItem.category_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{fmt(selectedItem.unit_price)}</p>
                  <p className={`text-xs ${subtext}`}>{selectedItem.quantity_current} available</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <div className="flex-1">
                <label className={`text-xs font-bold uppercase tracking-wide ${subtext} block mb-1.5`}>Quantity</label>
                <input type="number" min="1" step="1" placeholder="0" value={qty} onChange={e => setQty(e.target.value)} className={inputCls} />
              </div>
              {selectedItem && qty && Number(qty) > 0 && (
                <div className="flex-1">
                  <label className={`text-xs font-bold uppercase tracking-wide ${subtext} block mb-1.5`}>Subtotal</label>
                  <div className={`px-4 py-3 rounded-xl border text-sm font-bold text-emerald-600 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                    {fmt(selectedItem.unit_price * parseInt(qty))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={addToCart}
              className="w-full py-3 rounded-xl border-2 border-dashed border-emerald-300 text-emerald-700 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add to Cart
            </button>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wide ${subtext} block mb-1.5`}>Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Cash', 'Credit Card', 'Debit Card', 'Mobile Money', 'Check'] as SaleLog['payment_method'][]).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${paymentMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {PAYMENT_ICONS[m]} {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart + Summary */}
          <div className={`rounded-2xl border p-5 ${cardBg} shadow-sm flex flex-col`}>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <h2 className={`font-bold text-lg ${text}`}>Cart</h2>
              {cart.length > 0 && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{cart.length}</span>}
            </div>

            {cart.length === 0 ? (
              <div className={`flex-1 flex flex-col items-center justify-center py-10 ${subtext}`}>
                <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Add items to begin a sale</p>
              </div>
            ) : (
              <div className="flex-1 space-y-2 mb-4">
                {cart.map(c => (
                  <div key={c.item_id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${text} truncate`}>{c.item_name}</p>
                      <p className={`text-xs ${subtext}`}>{c.quantity} × {fmt(c.unit_price)}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">{fmt(c.unit_price * c.quantity)}</p>
                    <button onClick={() => removeFromCart(c.item_id)} className="text-red-400 hover:text-red-600 ml-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <>
                <div className={`border-t pt-4 mb-4 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm ${subtext}`}>Items</span>
                    <span className={`text-sm ${text}`}>{cart.reduce((s, c) => s + c.quantity, 0)} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-extrabold text-xl text-emerald-600">{fmt(cartTotal)}</span>
                  </div>
                  <div className={`text-xs mt-1 ${subtext}`}>Payment: {paymentMethod}</div>
                </div>

                <button onClick={completeSale} disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-base hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {loading ? 'Processing...' : `Complete Sale · ${fmt(cartTotal)}`}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Sales History */
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Today's Sales", value: todaySales.length, sub: 'transactions' },
              { label: "Today's Revenue", value: fmt(todayRevenue), sub: 'earned today' },
              { label: 'Total Sales', value: sales.length, sub: 'all time' },
              { label: 'Total Revenue', value: fmt(sales.reduce((s, sale) => s + sale.total_amount, 0)), sub: 'all time' },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
                <p className={`text-xs ${subtext}`}>{s.label}</p>
                <p className={`font-extrabold text-lg ${text}`}>{s.value}</p>
                <p className={`text-xs ${subtext}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search sales..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className={`${inputCls} pl-9`} />
              </div>
              <span className={`text-xs ${subtext}`}>{filteredSales.length} records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
                    {['Receipt', 'Date & Time', 'Customer', 'Item', 'Qty', 'Price', 'Total', 'Payment'].map(h => (
                      <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide ${text}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {pageSales.length === 0 ? (
                    <tr><td colSpan={8} className="py-16 text-center text-gray-400">No sales found</td></tr>
                  ) : pageSales.map(sale => (
                    <tr key={sale.sale_id} className={`transition-colors ${isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3"><span className="text-xs font-mono text-emerald-600 font-bold">{sale.receipt_number}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs ${subtext}`}>{new Date(sale.sale_timestamp).toLocaleString()}</span></td>
                      <td className="px-4 py-3"><span className={`text-sm ${text}`}>{sale.customer_name}</span></td>
                      <td className="px-4 py-3"><span className={`text-sm ${text}`}>{sale.item_name}</span></td>
                      <td className="px-4 py-3"><span className={`text-sm font-semibold ${text}`}>{sale.quantity_sold}</span></td>
                      <td className="px-4 py-3"><span className={`text-sm ${text}`}>{fmt(sale.unit_price)}</span></td>
                      <td className="px-4 py-3"><span className="text-sm font-bold text-emerald-600">{fmt(sale.total_amount)}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{sale.payment_method}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-xs ${subtext}`}>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {lastReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-center text-white">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
              <h3 className="font-extrabold text-lg">Sale Completed!</h3>
              <p className="text-emerald-100 text-sm">{lastReceipt.receipt_number}</p>
            </div>
            <div className="p-5">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} space-y-2 mb-4`}>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Customer</span>
                  <span className={`font-semibold ${text}`}>{lastReceipt.customer_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Item(s)</span>
                  <span className={`font-semibold ${text} text-right max-w-[60%]`}>{cart.length > 0 ? `${cart.length} items` : lastReceipt.item_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Payment</span>
                  <span className={`font-semibold ${text}`}>{lastReceipt.payment_method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={subtext}>Date</span>
                  <span className={`font-semibold ${text}`}>{new Date(lastReceipt.sale_timestamp).toLocaleString()}</span>
                </div>
                <div className={`border-t pt-2 flex justify-between ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <span className="font-bold">Amount Paid</span>
                  <span className="font-extrabold text-lg text-emerald-600">{fmt(lastReceipt.total_amount)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'} hover:bg-gray-50 dark:hover:bg-gray-700`}>
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setLastReceipt(null)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  <Receipt className="w-4 h-4" /> New Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
