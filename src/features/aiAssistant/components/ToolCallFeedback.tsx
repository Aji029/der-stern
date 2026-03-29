import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ToolCallStatus } from '../types';

const TOOL_LABELS: Record<string, string> = {
  search_products: 'Search products',
  search_customers: 'Search customers',
  create_order: 'Create order',
  get_pending_orders: 'Load pending orders',
  get_order_summary: 'Order summary',
  get_dashboard_stats: 'Dashboard stats',
};

interface Props {
  toolCalls: ToolCallStatus[];
}

export function ToolCallFeedback({ toolCalls }: Props) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {toolCalls.map((tc, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs"
        >
          {tc.status === 'pending' && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-500 flex-shrink-0" />
          )}
          {tc.status === 'success' && (
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          )}
          {tc.status === 'error' && (
            <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-medium text-gray-700">
              {TOOL_LABELS[tc.name] ?? tc.name}
            </span>
            {tc.summary && (
              <span className="ml-1.5 text-gray-500 truncate">{tc.summary}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
