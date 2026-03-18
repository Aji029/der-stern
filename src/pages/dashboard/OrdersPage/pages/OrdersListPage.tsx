import React from 'react';
import { OrdersHeader } from '../components/OrdersHeader';
import { OrdersFilters } from '../components/OrdersFilters';
import { OrdersList } from '../components/OrdersList';
import { OrdersNotifications } from '../components/OrdersNotifications';

export function OrdersListPage() {
  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <OrdersHeader />
      <OrdersFilters />
      <OrdersNotifications />
      <OrdersList />
    </div>
  );
}