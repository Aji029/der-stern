import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil as Edit, Banknote, Loader, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { InvoiceButton } from './InvoiceButton';
import { CustomInvoiceButton } from './CustomInvoiceButton';
import { DeliveryNoteButton } from './DeliveryNoteButton';
import { ToastContainer } from './ui/Toast';
import { useToast } from '../hooks/useToast';
import { formatPrice } from '../utils/priceCalculations';
import { formatDateForDisplay } from '../utils/dateFormatting';
import { supabase } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';
import type { Order } from '../types/order';

type OrderStatusFilter = 'pending' | 'completed' | 'all';

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  statusFilter?: OrderStatusFilter;
  onRefresh?: () => void;
}

export function OrderList({ orders, isLoading, error, statusFilter = 'all', onRefresh }: OrderListProps) {
  const navigate = useNavigate();
  const { refreshOrders } = useOrders();
  const toast = useToast();
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [optimisticCompleted, setOptimisticCompleted] = useState<Set<string>>(new Set());

  const handleMarkCompleted = async (orderId: string) => {
    if (completing.has(orderId)) return;

    // Immediately start fade-out animation
    setFadingOut(prev => new Set(prev).add(orderId));
    setCompleting(prev => new Set(prev).add(orderId));

    try {
      // Run Supabase update and wait for animation in parallel
      await Promise.all([
        supabase
          .from('orders')
          .update({ status: 'Completed', updated_at: new Date().toISOString() })
          .eq('id', orderId),
        new Promise(resolve => setTimeout(resolve, 350)), // let animation finish
      ]);

      // Remove from DOM and show success feedback
      setOptimisticCompleted(prev => new Set(prev).add(orderId));
      setFadingOut(prev => { const n = new Set(prev); n.delete(orderId); return n; });
      toast.success('Bestellung als abgeschlossen markiert');

      // Refresh data in background (race-condition-safe now)
      onRefresh?.();
      await refreshOrders();

    } catch (err) {
      console.error('Failed to update order status:', err);
      // Rollback — fade the row back in
      setFadingOut(prev => { const n = new Set(prev); n.delete(orderId); return n; });
      toast.error('Fehler beim Aktualisieren der Bestellung');
    } finally {
      setCompleting(prev => { const n = new Set(prev); n.delete(orderId); return n; });
    }
  };

  // Filter out orders that have been optimistically marked as completed
  const visibleOrders = orders.filter(o => !optimisticCompleted.has(o.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 mb-2">Error loading orders</p>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (visibleOrders.length === 0) {
    const emptyMessages = {
      pending: {
        title: 'No pending orders',
        subtitle: 'All caught up! No orders need attention right now.'
      },
      completed: {
        title: 'No completed orders',
        subtitle: 'Completed orders will appear here once orders are fulfilled.'
      },
      all: {
        title: 'No orders found',
        subtitle: 'Try adjusting your filters or create a new order'
      }
    };

    const message = emptyMessages[statusFilter];

    return (
      <div className="bg-white p-8 text-center">
        <p className="text-gray-500 text-lg">{message.title}</p>
        <p className="text-sm text-gray-400 mt-2">{message.subtitle}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50"
                style={{
                  transition: 'opacity 0.3s ease',
                  opacity: fadingOut.has(order.id) ? 0 : 1,
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.customer.companyName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.customer.contactPerson}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateForDisplay(order.orderDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className="bg-blue-50 text-blue-600 py-1 px-2 rounded-full text-xs font-medium">
                    {order.items.length} items
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatPrice(order.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {(order.status === 'Pending' || order.status === 'Processing') ? (
                    <button
                      onClick={() => handleMarkCompleted(order.id)}
                      disabled={completing.has(order.id)}
                      title="Als Abgeschlossen markieren"
                      className={`group inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-all cursor-pointer hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                        order.status === 'Processing'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {completing.has(order.id)
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <CheckCircle2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      }
                      {order.status}
                    </button>
                  ) : (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                      className="hover:bg-gray-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DeliveryNoteButton order={order} />
                    <CustomInvoiceButton
                      order={order}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      <Banknote className="h-4 w-4" />
                    </CustomInvoiceButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 p-3">
        {visibleOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm"
            style={{
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              opacity: fadingOut.has(order.id) ? 0 : 1,
              transform: fadingOut.has(order.id) ? 'translateX(-12px) scale(0.98)' : 'none',
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {order.customer.companyName}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {order.customer.contactPerson}
                </div>
              </div>
              {(order.status === 'Pending' || order.status === 'Processing') ? (
                <button
                  onClick={() => handleMarkCompleted(order.id)}
                  disabled={completing.has(order.id)}
                  title="Als Abgeschlossen markieren"
                  className={`ml-2 group inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer active:scale-95 disabled:opacity-60 ${
                    order.status === 'Processing'
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  {completing.has(order.id)
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <CheckCircle2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  }
                  {order.status}
                </button>
              ) : (
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  order.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {order.status}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <div className="font-medium">{formatDateForDisplay(order.orderDate)}</div>
              </div>
              <div>
                <span className="text-gray-500">Items:</span>
                <div className="font-medium">{order.items.length} items</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Total:</span>
                <div className="font-bold text-lg">{formatPrice(order.totalAmount)}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <DeliveryNoteButton order={order} />
              <CustomInvoiceButton
                order={order}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <Banknote className="h-4 w-4" />
              </CustomInvoiceButton>
            </div>
          </div>
        ))}
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}