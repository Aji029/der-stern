import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ClipboardList, ChevronRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { usePortal } from '../../features/portal/context/PortalContext';
import { fetchPortalOrders } from '../../lib/db/portal';
import type { PortalOrder } from '../../types/portal';

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-brand-100 text-brand-800',
  Processing: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export function PortalHomePage() {
  const { profile, isLoadingProfile, profileError } = usePortal();
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile?.customerId) return;
    setIsLoading(true);
    fetchPortalOrders(profile.customerId, 2026)
      .then(data => setOrders(data.slice(0, 5)))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [profile?.customerId]);

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 mb-4 text-lg font-medium">{profileError}</div>
        <p className="text-gray-500">Please contact your administrator to get access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{profile?.companyName ? `, ${profile.companyName}` : ''}!
        </h1>
        <p className="mt-1 text-gray-500">Browse products and manage your orders below.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/portal/products"
          className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-brand-400 hover:shadow-md transition-all group"
        >
          <div className="bg-brand-50 p-3 rounded-lg group-hover:bg-brand-100 transition-colors">
            <Package className="h-6 w-6 text-brand-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Browse Products</h3>
            <p className="text-sm text-gray-500">Search and add items to your cart</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
        </Link>

        <Link
          to="/portal/orders"
          className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-brand-400 hover:shadow-md transition-all group"
        >
          <div className="bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors">
            <ClipboardList className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">My Orders</h3>
            <p className="text-sm text-gray-500">View your order history and status</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/portal/orders" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500 mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No orders yet</h3>
            <p className="text-gray-500 text-sm mb-4">Your orders will appear here once placed.</p>
            <Link
              to="/portal/products"
              className="inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Package className="h-4 w-4 mr-1" />
              Browse products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {orders.map(order => (
                <Link
                  key={order.id}
                  to={`/portal/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {format(order.orderDate, 'MMM d, yyyy')} · {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
