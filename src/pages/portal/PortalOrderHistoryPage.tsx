import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ChevronRight, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { usePortal } from '../../features/portal/context/PortalContext';
import { fetchPortalOrders } from '../../lib/db/portal';
import type { PortalOrder } from '../../types/portal';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Pending:    { label: 'Pending',    color: 'bg-brand-100 text-brand-800' },
  Processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  Completed:  { label: 'Delivered',  color: 'bg-green-100 text-green-800' },
  Cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800' },
};

const YEARS = [2026, 2025, 2024];

export function PortalOrderHistoryPage() {
  const { profile } = usePortal();
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    if (!profile?.customerId) return;
    setIsLoading(true);
    setOrders([]);
    fetchPortalOrders(profile.customerId, year)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [profile?.customerId, year]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and review your orders</p>
        </div>

        {/* Year filter */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {YEARS.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                year === y
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-40 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ClipboardList className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No orders in {year}</h3>
          <p className="text-gray-500 text-sm mb-6">
            {year === 2026
              ? 'Start placing your orders and they will appear here.'
              : `No orders were placed in ${year}.`}
          </p>
          {year === 2026 && (
            <Link
              to="/portal/products"
              className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors text-sm"
            >
              <Package className="h-4 w-4" />
              Browse products
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} in {year}</p>
          <div className="grid gap-3">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
              return (
                <Link
                  key={order.id}
                  to={`/portal/orders/${order.id}`}
                  className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-md transition-all flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className="bg-gray-50 group-hover:bg-brand-50 rounded-lg p-2.5 transition-colors flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 text-sm">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(order.orderDate, 'MMM d, yyyy')}
                      {order.itemCount > 0 && ` · ${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}`}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>

                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-brand-600 flex-shrink-0 transition-colors" />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
