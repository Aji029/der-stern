export interface Sammelrechnung {
  id: string;
  number: string;
  customerId: string;
  totalNetto: number;
  totalVat: number;
  totalBrutto: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'overdue';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SammelrechnungWithDetails extends Sammelrechnung {
  customer: {
    companyName: string;
    contactPerson: string;
    email: string;
    address: string;
  };
  orders: Array<{
    id: string;
    orderDate: Date;
    totalAmount: number;
    items: Array<{
      product: {
        name: string;
      };
      quantity: number;
    }>;
  }>;
}