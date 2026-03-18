export interface OrderItem {
  id?: string;
  product: {
    artikelNr: string;
    name: string;
    mwst: 'A' | 'B';
    supplierId?: string;
  };
  quantity: number;
  ekPrice: number;
  vkPrice: number;
  total: number;
  isPacked?: boolean;
  packedAt?: Date;
  packedBy?: string;
}

export interface OrderDiscount {
  type: 'fixed';
  value: number;
  description: string;
  item: OrderItem; // Add reference to the discount product
}

export interface Order {
  id: string;
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    idNumber: string;
    address: string;
    billingAddress?: string;
  };
  items: OrderItem[];
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  totalAmount: number;
  discount?: OrderDiscount;
  finalAmount: number;
  orderDate: Date;
  deliveryDate?: Date;
  paymentStatus: 'Pending' | 'Paid' | 'Overdue';
  shippingAddress: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}