export interface OrderItem {
  id?: string;
  product: {
    artikelNr: string;
    name: string;
    mwst: 'A' | 'B';
  };
  quantity: number;
  ekPrice: number;
  vkPrice: number;
  total: number;
}

export interface Order {
  id: string;
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  };
  items: OrderItem[];
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  totalAmount: number;
  orderDate: Date;
  deliveryDate?: Date;
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
  shippingAddress: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderFormData {
  customerId: string;
  items: OrderItem[];
  deliveryDate: string;
  shippingAddress: string;
  notes: string;
}