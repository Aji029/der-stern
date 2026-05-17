import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Truck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { usePortal } from '../../features/portal/context/PortalContext';
import { fetchPortalOrderDetail } from '../../lib/db/portal';
import type { PortalOrderDetail } from '../../types/portal';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Pending: {
    label: 'Order Received',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-brand-600 bg-brand-50 border-brand-200',
  },
  Processing: {
    label: 'Being Prepared',
    icon: <Truck className="h-5 w-5" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  Completed: {
    label: 'Delivered',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  Cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
};

const STATUS_ORDER = ['Pending', 'Processing', 'Completed'];

export function PortalOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = usePortal();
  const location = useLocation();
  const justPlaced = (location.state as any)?.justPlaced;
  const [order, setOrder] = useState<PortalOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || !profile?.customerId) return;
    fetchPortalOrderDetail(id, profile.customerId)
      .then(data => {
        if (!data) setNotFound(true);
        else setOrder(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id, profile?.customerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Order not found.</p>
        <Link to="/portal/orders" className="text-blue-600 hover:underline text-sm">
          Back to orders
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status];
  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/portal/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 gap-1">
        <ChevronLeft className="h-4 w-4" />
        Back to orders
      </Link>

      {justPlaced && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-700">
          <CheckCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-semibold">Order placed successfully!</p>
            <p className="text-sm text-green-600">We'll prepare your order and update the status below.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {format(order.orderDate, 'MMMM d, yyyy')}
            </p>
          </div>
          {statusCfg && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${statusCfg.color}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
          )}
        </div>

        {order.status !== 'Cancelled' && (
          <div className="flex items-center gap-0 mt-4">
            {STATUS_ORDER.map((status, idx) => {
              const done = idx <= currentStatusIdx;
              const current = idx === currentStatusIdx;
              return (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full border-2 ${
                      done ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-300'
                    } ${current ? 'ring-2 ring-brand-300' : ''}`} />
                    <span className={`text-xs mt-1 ${done ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                      {STATUS_CONFIG[status]?.label}
                    </span>
                  </div>
                  {idx < STATUS_ORDER.length - 1 && (
                    <div className={`flex-1 h-0.5 mb-4 ${idx < currentStatusIdx ? 'bg-brand-400' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900 text-sm">Items ({order.itemCount})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                <p className="text-xs text-gray-400">Art. Nr: {item.artikelNr}</p>
              </div>
              <span className="text-sm text-gray-600 font-medium">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {(order.shippingAddress || order.notes) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          {order.shippingAddress && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery Address</p>
              <p className="text-sm text-gray-700 mt-1">{order.shippingAddress}</p>
            </div>
          )}
          {order.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</p>
              <p className="text-sm text-gray-700 mt-1">{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
