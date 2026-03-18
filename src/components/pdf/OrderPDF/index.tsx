import React from 'react';
import { OrderLayout } from './OrderLayout';
import type { Order } from '../../../types/order';

interface OrderPDFProps {
  order: Order;
}

export function OrderPDF({ order }: OrderPDFProps) {
  return <OrderLayout order={order} />;
}