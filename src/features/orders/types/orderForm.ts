export interface OrderFormData {
  customerId: string;
  items: OrderItem[];
  deliveryDate: string;
  shippingAddress: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
}