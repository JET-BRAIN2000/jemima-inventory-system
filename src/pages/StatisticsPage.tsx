import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingCart, Award, FileDown } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function StatisticsPage() {
  const { sales, inventory, currencySymbol, theme } = useApp();
  const [period, setPeriod] = useState<Period>('monthly');

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const text = isDark ? 'text-white' : 'text-gray-800';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const fmt = (n: number) => formatCurrency(n, currencySymbol);

  const cutoffDays = { daily: 1, weekly: 7, monthly: 30, yearly: 365 }[period];

  const filteredSales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDays);
    return sales.filter(s => s.transaction_status === 'Completed' && new Date(s.sale_timestamp) >= cutoff);
  }, [sales, cutoffDays]);

  // Item statistics
  const itemStats = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      if (!map[s.item_id]) map[s.item_id] = { name: s.item_name, qty: 0, revenue: 0 };
      map[s.item_id].qty += s.quantity_sold;
      map[s.item_id].revenue += s.total_amount;
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty);
  }, [filteredSales]);

  // Category revenue
  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      const item = inventory.find(i => i.item_id === s.item_id);
      const cat = item?.category_name ?? 'Unknown';
      map[cat] = (map[cat] ?? 0) + s.total_amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredSales, inventory]);

  // Revenue trend (group by day)
  const revenueTrend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredSales.forEach(s => {
      const day = s.sale_timestamp.split('T')[0];
      map[day] = (map[day] ?? 0) + s.total_amount;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        revenue,
      }));
  }, [filteredSales]);

  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.total_amount, 0);
  const totalQty = filteredSales.reduce((s, sale) => s + sale.quantity_sold, 0);
  const avgSaleValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const uniqueItems = new Set(filteredSales.map(s => s.item_id)).size;
  const topItem = itemStats[0];
  const bottomItem = itemStats[itemStats.length - 1];

  const handleExport = () => {
    const rows = [
      ['Product', 'Qty Sold', 'Revenue', '% of Total Revenue'],
      ...itemStats.map(i => [i.name, i.qty, i.revenue.toFixed(2), totalRevenue > 0 ? ((i.revenue / totalRevenue) * 100).toFixed(1) + '%' : '0%']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jemima-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Full report
  const handlePrintReport = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    reportWindow.document.write(`
      <html><head><title>JEMIMA 1 - ${period.toUpperCase()} REPORT</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #059669; } h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f0fdf4; color: #065f46; text-align: left; padding: 8px 12px; font-size: 12px; }
        td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
        .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .card p { margin: 0; font-size: 12px; color: #6b7280; }
        .card h3 { margin: 4px 0 0; font-size: 18px; color: #059669; }
        .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 40px; }
      </style></head><body>
      <h1>🏪 JEMIMA 1 - Provision Store</h1>
      <p>${period.toUpperCase()} REPORT · Generated: ${new Date().toLocaleString()}</p>
      <div class="summary">
        <div class="card"><p>Total Revenue</p><h3>${fmt(totalRevenue)}</h3></div>
        <div class="card"><p>Units Sold</p><h3>${totalQty}</h3></div>
        <div class="card"><p>Transactions</p><h3>${filteredSales.length}</h3></div>
        <div class="card"><p>Unique Items</p><h3>${uniqueItems}</h3></div>
      </div>
      <h2>Sales by Item</h2>
      <table>
        <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>% Share</th></tr>
        ${itemStats.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>${fmt(i.revenue)}</td><td>${totalRevenue > 0 ? ((i.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
      </table>
      <h2>Revenue by Category</h2>
      <table>
        <tr><th>Category</th><th>Revenue</th><th>% Share</th></tr>
        ${categoryRevenue.map(c => `<tr><td>${c.name}</td><td>${fmt(c.value)}</td><td>${totalRevenue > 0 ? ((c.value / totalRevenue) * 100).toFixed(1) : 0}%</td></tr>`).join('')}
      </table>
      <div class="footer">JEMIMA 1 Provision Store Inventory Management System · ${new Date().getFullYear()}</div>
      </body></html>
    `);
    reportWindow.document.close();
    reportWindow.print();
  };

  const periodLabels = { daily: 'Today', weekly: 'Last 7 Days', monthly: 'Last 30 Days', yearly: 'Last 365 Days' };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Period Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={`flex gap-1 p-1 rounded-2xl border ${cardBg} shadow-sm`}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${period === p ? 'bg-emerald-600 text-white shadow-sm' : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all">
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handlePrintReport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all">
            <FileDown className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      <p className={`text-sm ${subtext}`}>Showing statistics for: <strong className="text-emerald-600">{periodLabels[period]}</strong></p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), icon: <TrendingUp className="w-5 h-5" />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Units Sold', value: totalQty.toLocaleString(), icon: <ShoppingCart className="w-5 h-5" />, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Unique Items', value: uniqueItems, icon: <Package className="w-5 h-5" />, bg: 'bg-violet-50', color: 'text-violet-600' },
          { label: 'Avg Sale Value', value: fmt(avgSaleValue), icon: <Award className="w-5 h-5" />, bg: 'bg-orange-50', color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${cardBg} shadow-sm`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className={`text-xs ${subtext}`}>{s.label}</p>
            <p className={`font-extrabold text-lg ${text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top / Bottom Performers */}
      {topItem && bottomItem && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={`rounded-2xl border p-5 ${cardBg} shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className={`font-bold ${text}`}>Best Performer</h3>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className={`font-bold ${text}`}>{topItem.name}</p>
                <p className={`text-sm ${subtext}`}>{topItem.qty} units sold</p>
                <p className="text-sm font-bold text-emerald-600">{fmt(topItem.revenue)}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl border p-5 ${cardBg} shadow-sm`}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className={`font-bold ${text}`}>Lowest Performer</h3>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className={`font-bold ${text}`}>{bottomItem.name}</p>
                <p className={`text-sm ${subtext}`}>{bottomItem.qty} units sold</p>
                <p className="text-sm font-bold text-red-600">{fmt(bottomItem.revenue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue Trend */}
        <div className={`rounded-2xl border p-5 ${cardBg} shadow-sm`}>
          <h3 className={`font-bold mb-4 ${text}`}>Revenue Trend</h3>
          {revenueTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickLine={false} axisLine={false}
                  tickFormatter={v => formatCurrencyCompact(v, currencySymbol)} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [fmt(Number(v)), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie */}
        <div className={`rounded-2xl border p-5 ${cardBg} shadow-sm`}>
          <h3 className={`font-bold mb-4 ${text}`}>Revenue by Category</h3>
          {categoryRevenue.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {categoryRevenue.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [fmt(Number(v)), 'Revenue']} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Items Bar Chart */}
        <div className={`lg:col-span-2 rounded-2xl border p-5 ${cardBg} shadow-sm`}>
          <h3 className={`font-bold mb-4 ${text}`}>Top Items by Quantity Sold</h3>
          {itemStats.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No sales in this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={itemStats.slice(0, 10)} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickLine={false} axisLine={false} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: 'none', borderRadius: 12 }}
                  formatter={(v, n) => [v, n === 'qty' ? 'Units Sold' : 'Revenue']} />
                <Bar dataKey="qty" fill="#10b981" radius={[6, 6, 0, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Full Item Stats Table */}
      <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-bold ${text}`}>Detailed Item Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-100 bg-gray-50'}`}>
                {['Rank', 'Product', 'Qty Sold', 'Revenue', '% of Total', 'Status'].map(h => (
                  <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide ${text}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {itemStats.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400">No sales data for this period</td></tr>
              ) : itemStats.map((item, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className={`text-sm font-semibold ${text}`}>{item.name}</span></td>
                  <td className="px-4 py-3"><span className={`text-sm ${text}`}>{item.qty} units</span></td>
                  <td className="px-4 py-3"><span className="text-sm font-bold text-emerald-600">{fmt(item.revenue)}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} max-w-20`}>
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0}%` }} />
                      </div>
                      <span className={`text-xs ${subtext}`}>{totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {idx === 0 ? <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-yellow-100 text-yellow-700">🏆 Top Seller</span>
                      : idx === itemStats.length - 1 ? <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-red-100 text-red-700">Lowest</span>
                      : <span className="px-2 py-0.5 text-xs rounded-lg bg-gray-100 text-gray-600">Normal</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
