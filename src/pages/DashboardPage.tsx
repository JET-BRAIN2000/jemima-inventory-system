import { useApp } from '../context/AppContext';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency';
import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Package, AlertTriangle, BarChart2, ArrowRight, Clock,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

export default function DashboardPage() {
  const { revenue, inventory, sales, currencySymbol, theme, setActivePage } = useApp();

  const [chartData, setChartData] = useState<{ day: string; revenue: number }[]>([]);

  useEffect(() => {
    // Build last-14-days revenue chart from loaded sales data
    const data: { day: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRevenue = sales
        .filter(s => s.transaction_status === 'Completed' && s.sale_timestamp.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total_amount, 0);
      data.push({
        day: d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
      });
    }
    setChartData(data);
  }, [sales]);

  const activeItems = inventory.filter(i => i.item_status === 'Active');
  const lowStockItems = activeItems.filter(i => i.quantity_current > 0 && i.quantity_current <= 10);
  const outOfStockItems = activeItems.filter(i => i.quantity_current === 0);
  const totalInventoryValue = activeItems.reduce((sum, i) => sum + i.unit_price * i.quantity_current, 0);

  const recentSales = sales.slice(0, 5);

  const fmt = (n: number) => formatCurrency(n, currencySymbol);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = isDark ? 'text-white' : 'text-gray-800';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';

  const revenueCards = [
    { label: "Today's Revenue", value: revenue.today, icon: <DollarSign className="w-5 h-5" />, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { label: 'Weekly Revenue', value: revenue.week, icon: <TrendingUp className="w-5 h-5" />, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Monthly Revenue', value: revenue.month, icon: <BarChart2 className="w-5 h-5" />, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', iconColor: 'text-violet-600' },
    { label: 'Yearly Revenue', value: revenue.year, icon: <TrendingDown className="w-5 h-5" />, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', iconColor: 'text-orange-600' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card, idx) => (
          <div key={idx} className={`rounded-2xl border p-4 lg:p-5 ${cardBg} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center ${card.iconColor}`}>
                {card.icon}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                Live
              </span>
            </div>
            <p className={`text-xs font-medium ${subtext} mb-1`}>{card.label}</p>
            <p className={`text-lg lg:text-xl font-extrabold ${text}`}>{fmt(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Chart + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className={`lg:col-span-2 rounded-2xl border p-4 lg:p-5 ${cardBg} shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`font-bold ${text}`}>Revenue Trend</h2>
              <p className={`text-xs ${subtext}`}>Last 14 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickLine={false} axisLine={false}
                tickFormatter={v => formatCurrencyCompact(v, currencySymbol)} />
              <Tooltip
                contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: isDark ? '#f3f4f6' : '#374151', fontWeight: 600, fontSize: 11 }}
                formatter={(v) => [fmt(Number(v)), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className={`text-xs ${subtext}`}>Total Products</p>
                <p className={`font-bold text-lg ${text}`}>{activeItems.length}</p>
              </div>
            </div>
            <div className={`text-xs ${subtext}`}>Total Value: <span className="font-bold text-emerald-600">{fmt(totalInventoryValue)}</span></div>
          </div>

          <div className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className={`text-xs ${subtext}`}>Stock Alerts</p>
                <p className={`font-bold text-lg ${text}`}>{lowStockItems.length + outOfStockItems.length}</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-semibold">{outOfStockItems.length} Out of Stock</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-semibold">{lowStockItems.length} Low Stock</span>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className={`text-xs ${subtext}`}>Total Sales</p>
                <p className={`font-bold text-lg ${text}`}>{sales.length}</p>
              </div>
            </div>
            <button onClick={() => setActivePage('sales')}
              className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
              View all sales <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sales + Low Stock */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-bold ${text}`}>Recent Sales</h2>
            <button onClick={() => setActivePage('sales')} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {recentSales.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No sales recorded yet</div>
            ) : recentSales.map(sale => (
              <div key={sale.sale_id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${text} truncate`}>{sale.item_name}</p>
                  <div className={`flex items-center gap-2 text-xs ${subtext}`}>
                    <Clock className="w-3 h-3" />
                    {new Date(sale.sale_timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">{fmt(sale.total_amount)}</p>
                  <p className={`text-xs ${subtext}`}>{sale.quantity_sold} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`font-bold ${text}`}>Stock Alerts</h2>
            <button onClick={() => setActivePage('inventory')} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">✅ All stock levels are healthy</div>
            ) : (
              <>
                {outOfStockItems.slice(0, 3).map(item => (
                  <div key={item.item_id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${text} truncate`}>{item.product_name}</p>
                      <p className={`text-xs ${subtext}`}>{item.category_name}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg">OUT OF STOCK</span>
                  </div>
                ))}
                {lowStockItems.slice(0, 4).map(item => (
                  <div key={item.item_id} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${text} truncate`}>{item.product_name}</p>
                      <p className={`text-xs ${subtext}`}>{item.category_name}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg">{item.quantity_current} left</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
