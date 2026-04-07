import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, Users, Factory, ArrowRight, ClipboardList, CheckCircle2, Circle } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useSuppliers } from '../../context/SupplierContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/priceCalculations';
import { formatDateForInput, formatDateForDisplay } from '../../utils/dateFormatting';
import { useTodaysPick } from './hooks/useTodaysPick';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface DayRevenue {
  label: string;
  date: string;
  amount: number;
}

export function DashboardPage() {
  const { orders } = useOrders();
  const { suppliers } = useSuppliers();
  const today = formatDateForInput(new Date());
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesData, setSalesData] = useState<DayRevenue[]>([]);
  const [salesRange, setSalesRange] = useState<'7' | '30'>('7');
  const [counts, setCounts] = useState({ products: 0, customers: 0, suppliers: 0 });

  // Lightweight count-only queries — no bulk data fetched
  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('suppliers').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('status', 'Completed'),
    ]).then(([products, customers, suppliers, revenue]) => {
      setCounts({
        products: products.count ?? 0,
        customers: customers.count ?? 0,
        suppliers: suppliers.count ?? 0,
      });
      const total = (revenue.data || []).reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
      setTotalRevenue(total);
    });
  }, []);

  useEffect(() => {
    const days = parseInt(salesRange);
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    supabase
      .from('orders')
      .select('order_date, total_amount')
      .not('status', 'eq', 'Cancelled')
      .gte('order_date', since.toISOString())
      .then(({ data }) => {
        // Build a map of date → revenue using local dates to avoid timezone off-by-one
        const toLocalKey = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
        const map: Record<string, number> = {};
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (days - 2 - i)); // end at today+1 to catch timezone-shifted orders
          map[toLocalKey(d)] = 0;
        }
        (data || []).forEach(o => {
          const key = toLocalKey(new Date(o.order_date));
          if (key in map) map[key] += parseFloat(o.total_amount || '0');
        });
        const result: DayRevenue[] = Object.entries(map).map(([date, amount]) => {
          const d = new Date(date + 'T12:00:00');
          const label = days === 7
            ? d.toLocaleDateString('en-DE', { weekday: 'short' })
            : d.toLocaleDateString('en-DE', { day: '2-digit', month: 'short' });
          return { label, date, amount };
        });
        setSalesData(result);
      });
  }, [salesRange]);

  // ── Today's Pick widget data ────────────────────────────────────────────────
  const { groupedOrders: todayGroups } = useTodaysPick(today);
  const [pickedArr] = useLocalStorage<string[]>(`der-stern-picked-${today}`, []);
  const pickedToday = useMemo(() => new Set(pickedArr), [pickedArr]);

  const totalPickItems = todayGroups.reduce((s, g) => s + g.items.length, 0);
  const totalPickedItems = todayGroups.reduce(
    (s, g) => s + g.items.filter(i => i.product?.artikelNr && pickedToday.has(i.product.artikelNr)).length,
    0
  );
  const pickPct = totalPickItems > 0 ? Math.round((totalPickedItems / totalPickItems) * 100) : 0;
  const allPickDone = totalPickItems > 0 && totalPickedItems === totalPickItems;
  // ────────────────────────────────────────────────────────────────────────────

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
    },
    {
      name: 'Total Products',
      value: counts.products.toString(),
      icon: Package,
      link: '/dashboard/products',
    },
    {
      name: 'Total Customers',
      value: counts.customers.toString(),
      icon: Users,
      link: '/dashboard/customers',
    },
    {
      name: 'Total Suppliers',
      value: counts.suppliers.toString(),
      icon: Factory,
      link: '/dashboard/suppliers',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Icon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              {stat.link && (
                <Link
                  to={stat.link}
                  className="mt-4 inline-flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700"
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link
              to="/dashboard/orders"
              className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{order.customer.companyName}</p>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(order.totalAmount)}</p>
                  <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Sales Overview</h3>
            <select
              value={salesRange}
              onChange={e => setSalesRange(e.target.value as '7' | '30')}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
          {salesData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No data
            </div>
          ) : (() => {
            const max = Math.max(...salesData.map(d => d.amount), 1);
            return (
              <div className="h-56 flex flex-col justify-end">
                <div className="flex gap-1 h-44">
                  {salesData.map(d => (
                    <div key={d.date} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        {formatPrice(d.amount)}
                      </div>
                      <div
                        className="w-full rounded-t-sm bg-yellow-400 transition-all duration-300"
                        style={{ height: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  ))}
                </div>
                {/* X-axis labels */}
                <div className="flex gap-1 mt-2">
                  {salesData.map((d, i) => (
                    <div key={d.date} className="flex-1 text-center text-xs text-gray-500 truncate">
                      {salesRange === '7' || i % 5 === 0 ? d.label : ''}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Orders revenue (excl. cancelled)</p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Today's Pick Overview ─────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <ClipboardList className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Today's Pick</h3>
              <p className="text-xs text-gray-500">{formatDateForDisplay(today)}</p>
            </div>
          </div>
          <Link
            to="/dashboard/todays-pick"
            className="inline-flex items-center text-sm font-medium text-yellow-600 hover:text-yellow-700"
          >
            View Picks
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {todayGroups.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No items to pick today.</p>
        ) : (
          <div className="space-y-4">
            {/* Overall progress bar */}
            {allPickDone ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-green-700">
                  🎉 All {totalPickItems} items picked for today!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{totalPickedItems} / {totalPickItems} items picked</span>
                  <span className="font-medium">{pickPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${pickPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Per-supplier rows */}
            <div className="divide-y divide-gray-100">
              {todayGroups.map(group => {
                const supplierPickedCount = group.items.filter(
                  i => i.product?.artikelNr && pickedToday.has(i.product.artikelNr)
                ).length;
                const supplierTotal = group.items.length;
                const isComplete = supplierPickedCount === supplierTotal && supplierTotal > 0;
                const hasStarted = supplierPickedCount > 0;

                return (
                  <div key={group.supplierId} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : hasStarted ? (
                        <div className="h-4 w-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium truncate ${isComplete ? 'text-green-700' : 'text-gray-700'}`}>
                        {group.supplierName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-green-100 text-green-700'
                          : hasStarted
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isComplete ? '✓ Complete' : hasStarted ? `${supplierPickedCount}/${supplierTotal}` : `${supplierTotal} items`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
