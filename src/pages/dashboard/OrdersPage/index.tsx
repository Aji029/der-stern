import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { OrdersListPage } from './pages/OrdersListPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';

export function OrdersPage() {
  return (
    <Routes>
      <Route index element={<OrdersListPage />} />
      <Route path=":id/details" element={<OrderDetailsPage />} />
    </Routes>
  );
}