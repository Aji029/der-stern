import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Package, Users, Factory, ArrowRight } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useCustomers } from '../../context/CustomerContext';
import { useSuppliers } from '../../context/SupplierContext';
import { useOrders } from '../../context/OrderContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/priceCalculations';

interface DayRevenue {
  label: string;
  date: string;
  amount: number;
}

export function DashboardPage() {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { suppliers } = useSuppliers();
  const { orders } = useOrders();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesData, setSalesData] = useState<DayRevenue[]>([]);
  const [salesRange, setSalesRange] = useState<'7' | '30'>('7');

  useEffect(() => {
    supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'Completed')
      .then(({ data }) => {
        const total = (data || []).reduce((sum, o) => sum + parseFloat(o.total_amount || '0'), 0);
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
      .eq('status', 'Completed')
      .gte('order_date', since.toISOString())
      .then(({ data }) => {
        // Build a map of date → revenue
        const map: Record<string, number> = {};
        for (let i = 0; i < days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          map[d.toISOString().slice(0, 10)] = 0;
        }
        (data || []).forEach(o => {
          const key = new Date(o.order_date).toISOString().slice(0, 10);
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

  const statCards = [
    {
      name: 'Total Revenue',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
    },
    {
      name: 'Total Products',
      value: products.length.toString(),
      icon: Package,
      link: '/dashboard/products',
    },
    {
      name: 'Total Customers',
      value: customers.length.toString(),
      icon: Users,
      link: '/dashboard/customers',
    },
    {
      name: 'Total Suppliers',
      value: suppliers.length.toString(),
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
                <div className="flex items-end gap-1 h-44">
                  {salesData.map(d => (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
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
                <p className="text-xs text-gray-400 mt-2 text-right">Completed orders revenue</p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}