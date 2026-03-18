import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';

export function OrdersNotifications() {
  const { notifications } = useOrders();

  if (!notifications.length) return null;

  return (
    <div className="space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`flex items-center p-4 rounded-lg ${
            notification.type === 'warning'
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : notification.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 mr-2" />
          ) : (
            <CheckCircle className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      ))}
    </div>
  );
}