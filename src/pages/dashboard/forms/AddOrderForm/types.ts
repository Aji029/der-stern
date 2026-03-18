import type { OrderItem } from '../../../../types/order';

export interface OrderFormData {
  customerId: string;
  items: OrderItem[];
  deliveryDate: string;
  shippingAddress: string;
  notes: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
}