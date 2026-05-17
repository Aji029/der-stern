import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  PackageOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  CheckCheck,
  Loader2,
  Box,
} from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem } from '../../types/order';
import { ToastContainer, ToastType } from '../../components/ui/Toast';

type FilterTab = 'to-pack' | 'ready' | 'all';

function PackingBar({ packed, total }: { packed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((packed / total) * 100);
  const color =
    pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-400' : 'bg-yellow-300';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-12 text-right">
        {packed}/{total}
      </span>
    </div>
  );
}

export function FulfillmentPage() {
  const { orders, patchPackedStatus, patchOrderStatus } = useOrders();
  const [activeTab, setActiveTab] = useState<FilterTab>('to-pack');
  const [packingAll, setPackingAll] = useState<Set<string>>(new Set());
  const [togglingItem, setTogglingItem] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Derive packing stats per order
  const enriched = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled')
      .map(order => {
        const total = order.items.length;
        const packed = order.items.filter(i => i.isPacked).length;
        return { order, total, packed, remaining: total - packed };
      });
  }, [orders]);

  // Summary stats
  const stats = useMemo(() => {
    const needsPacking = enriched.filter(e => e.remaining > 0).length;
    const totalItemsToPack = enriched.reduce((s, e) => s + e.remaining, 0);
    const fullyPacked = enriched.filter(e => e.total > 0 && e.remaining === 0).length;
    return { needsPacking, totalItemsToPack, fullyPacked };
  }, [enriched]);

  // Filtered list for current tab
  const filtered = useMemo(() => {
    if (activeTab === 'to-pack') return enriched.filter(e => e.remaining > 0);
    if (activeTab === 'ready') return enriched.filter(e => e.total > 0 && e.remaining === 0);
    return enriched;
  }, [enriched, activeTab]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  // Toggle a single item's packed status
  const handleToggleItem = useCallback(async (order: Order, item: OrderItem) => {
    if (!item.id || togglingItem.has(item.id)) return;
    setTogglingItem(prev => new Set(prev).add(item.id!));

    const newPacked = !item.isPacked;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const packedAt = newPacked ? new Date() : undefined;
      const packedBy = newPacked ? (user?.id ?? undefined) : undefined;

      // 1. Update DB directly (only touches is_packed — no insert/delete cycle)
      await supabase
        .from('order_items')
        .update({
          is_packed: newPacked,
          packed_at: newPacked ? now : null,
          packed_by: newPacked ? (user?.id ?? null) : null,
        })
        .eq('id', item.id!);

      // 2. Optimistic local update — avoids re-inserting all items via updateOrder()
      patchPackedStatus(order.id, [{ itemId: item.id!, isPacked: newPacked, packedAt, packedBy }]);

      // 3. Status transition: Pending ↔ Processing based on packing state
      //    Compute whether ALL items will be packed after this toggle
      const allPackedAfter = order.items.every(i =>
        i.id === item.id ? newPacked : i.isPacked
      );

      if (newPacked && allPackedAfter && order.status === 'Pending') {
        // All items now packed → promote order to Processing
        await supabase.from('orders').update({ status: 'Processing' }).eq('id', order.id);
        patchOrderStatus(order.id, 'Processing');
      } else if (!newPacked && order.status === 'Processing') {
        // Unpacking an item on a Processing order → revert to Pending
        await supabase.from('orders').update({ status: 'Pending' }).eq('id', order.id);
        patchOrderStatus(order.id, 'Pending');
      }
    } catch (err: any) {
      console.error('Toggle item failed:', err);
      addToast(err?.message || 'Failed to update item — please try again', 'error');
    } finally {
      setTogglingItem(prev => {
        const next = new Set(prev);
        next.delete(item.id!);
        return next;
      });
    }
  }, [togglingItem, patchPackedStatus, patchOrderStatus, addToast]);

  const handlePackAll = async (order: Order) => {
    if (packingAll.has(order.id)) return;
    setPackingAll(prev => new Set(prev).add(order.id));

    try {
      const unpacked = order.items.filter(i => !i.isPacked && i.id);
      if (unpacked.length === 0) return;

      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const packedAt = new Date();
      const packedBy = user?.id ?? undefined;

      // 1. Update DB directly for all unpacked items (no insert/delete cycle)
      await Promise.all(
        unpacked.map(item =>
          supabase
            .from('order_items')
            .update({ is_packed: true, packed_at: now, packed_by: user?.id ?? null })
            .eq('id', item.id!)
        )
      );

      // 2. Optimistic local update — no updateOrder() to avoid duplicating items
      patchPackedStatus(
        order.id,
        unpacked.map(item => ({ itemId: item.id!, isPacked: true, packedAt, packedBy }))
      );

      // 3. All items are now packed → promote order status to Processing
      if (order.status === 'Pending') {
        await supabase.from('orders').update({ status: 'Processing' }).eq('id', order.id);
        patchOrderStatus(order.id, 'Processing');
      }

      addToast(`All items packed for order #${order.id}`, 'success');
    } catch (err: any) {
      console.error('Pack all failed:', err);
      addToast(err?.message || 'Pack All failed — please try again', 'error');
    } finally {
      setPackingAll(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'to-pack', label: 'To Pack', count: stats.needsPacking },
    { id: 'ready', label: 'Ready', count: stats.fullyPacked },
    { id: 'all', label: 'All Active', count: enriched.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Fulfillment</h2>
        <p className="text-sm text-gray-500 mt-1">Track and manage packing progress for all active orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="p-2 bg-brand-50 rounded-lg">
            <PackageOpen className="h-6 w-6 text-brand-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Orders to Pack</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.needsPacking}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Items Remaining</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalItemsToPack}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="p-2 bg-green-50 rounded-lg">
            <PackageCheck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Fully Packed</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.fullyPacked}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-4">
          <div className="flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle2 className="h-10 w-10 mb-2 text-green-400" />
            <p className="text-sm font-medium">
              {activeTab === 'to-pack' ? 'All caught up — nothing left to pack!' : 'No orders here yet.'}
            </p>
          </div>
        )}

        {/* ── Mobile card list (sm:hidden) ── */}
        {filtered.length > 0 && (
          <div className="sm:hidden divide-y divide-gray-100">
            {filtered.map(({ order, total, packed, remaining }) => {
              const isPacking = packingAll.has(order.id);
              const allPacked = remaining === 0;
              const isExpanded = expandedOrders.has(order.id);
              const unpackedItems = order.items.filter(i => !i.isPacked);
              return (
                <div key={order.id}>
                  {/* Card header */}
                  <div
                    className={`p-4 ${isExpanded ? 'bg-brand-50/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-800'
                            : order.status === 'Processing' ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>{order.status}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{order.customer.companyName}</p>
                        <p className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString('de-DE')}</p>
                      </div>
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {isExpanded
                          ? <ChevronDown className="h-5 w-5 text-brand-500" />
                          : <ChevronRight className="h-5 w-5 text-gray-400" />
                        }
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <PackingBar packed={packed} total={total} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!allPacked && (
                        <button
                          onClick={() => handlePackAll(order)}
                          disabled={isPacking}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 disabled:opacity-50 transition-colors"
                        >
                          {isPacking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
                          Pack All
                        </button>
                      )}
                      {allPacked && (
                        <span className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm text-green-600 font-medium py-2">
                          <CheckCircle2 className="h-4 w-4" /> All Packed
                        </span>
                      )}
                      <Link
                        to={`/dashboard/orders/${order.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        Edit <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Expanded missing items */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50/60">
                      {unpackedItems.length === 0 ? (
                        <div className="flex items-center gap-2 py-2 text-green-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" /> All items packed
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Missing items ({unpackedItems.length})
                          </p>
                          <div className="space-y-1.5">
                            {unpackedItems.map(item => {
                              const isToggling = item.id ? togglingItem.has(item.id) : false;
                              return (
                                <div
                                  key={item.id ?? item.product.artikelNr}
                                  className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white border border-gray-200 active:bg-brand-50 transition-colors"
                                >
                                  <button
                                    onClick={() => handleToggleItem(order, item)}
                                    disabled={isToggling}
                                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                      isToggling ? 'border-gray-300 bg-gray-100' : 'border-gray-300 hover:border-brand-500'
                                    }`}
                                  >
                                    {isToggling && <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />}
                                  </button>
                                  <Box className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-800 truncate block">{item.product.name}</span>
                                    <span className="text-xs text-gray-400">Art. {item.product.artikelNr}</span>
                                  </div>
                                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    × {item.quantity}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Desktop table (hidden on mobile) ── */}
        {filtered.length > 0 && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">Progress</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filtered.map(({ order, total, packed, remaining }) => {
                  const isPacking = packingAll.has(order.id);
                  const allPacked = remaining === 0;
                  const isExpanded = expandedOrders.has(order.id);
                  const unpackedItems = order.items.filter(i => !i.isPacked);

                  return (
                    <React.Fragment key={order.id}>
                      {/* Main row */}
                      <tr
                        className={`border-b border-gray-100 transition-colors ${
                          isExpanded ? 'bg-brand-50/40' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Expand toggle */}
                        <td className="px-3 py-4">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="p-1 rounded hover:bg-gray-200 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Show missing items'}
                          >
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-brand-600" />
                              : <ChevronRight className="h-4 w-4 text-gray-400" />
                            }
                          </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{order.customer.companyName}</p>
                          <p className="text-xs text-gray-500">{order.customer.contactPerson}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 w-44">
                          {total === 0 ? (
                            <span className="text-xs text-gray-400">No items</span>
                          ) : (
                            <PackingBar packed={packed} total={total} />
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!allPacked && (
                              <button
                                onClick={() => handlePackAll(order)}
                                disabled={isPacking}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 disabled:opacity-50 transition-colors"
                              >
                                {isPacking ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCheck className="h-3.5 w-3.5" />
                                )}
                                Pack All
                              </button>
                            )}
                            {allPacked && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Packed
                              </span>
                            )}
                            <Link
                              to={`/dashboard/orders/${order.id}/edit`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                            >
                              Edit
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded items panel */}
                      {isExpanded && (
                        <tr className="border-b border-gray-200 bg-gray-50/60">
                          <td colSpan={7} className="px-0 py-0">
                            <div className="px-12 py-3">
                              {unpackedItems.length === 0 ? (
                                <div className="flex items-center gap-2 py-2 text-green-600 text-sm font-medium">
                                  <CheckCircle2 className="h-4 w-4" />
                                  All items packed for this order
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Missing items ({unpackedItems.length})
                                  </p>
                                  <div className="space-y-1">
                                    {unpackedItems.map(item => {
                                      const isToggling = item.id ? togglingItem.has(item.id) : false;
                                      return (
                                        <div
                                          key={item.id ?? item.product.artikelNr}
                                          className="flex items-center gap-3 py-2 px-3 rounded-md bg-white border border-gray-200 hover:border-brand-300 transition-colors"
                                        >
                                          {/* Checkbox */}
                                          <button
                                            onClick={() => handleToggleItem(order, item)}
                                            disabled={isToggling}
                                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                              isToggling
                                                ? 'border-gray-300 bg-gray-100 cursor-wait'
                                                : 'border-gray-300 hover:border-brand-500 cursor-pointer'
                                            }`}
                                          >
                                            {isToggling && (
                                              <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                                            )}
                                          </button>

                                          {/* Product icon */}
                                          <Box className="h-4 w-4 text-gray-400 flex-shrink-0" />

                                          {/* Item details */}
                                          <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-800 truncate block">
                                              {item.product.name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              Art. {item.product.artikelNr}
                                            </span>
                                          </div>

                                          {/* Quantity badge */}
                                          <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            × {item.quantity}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
