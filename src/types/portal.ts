export interface PortalProduct {
  artikelNr: string;
  name: string;
  mwst: 'A' | 'B';
  supplierId?: string;
  istBestand: number;
}

export interface PortalCartItem {
  artikelNr: string;
  name: string;
  mwst: 'A' | 'B';
  supplierId?: string;
  quantity: number;
}

export interface PortalOrder {
  id: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  orderDate: Date;
  deliveryDate?: Date;
  itemCount: number;
}

export interface PortalOrderItem {
  artikelNr: string;
  name: string;
  quantity: number;
}

export interface PortalOrderDetail extends PortalOrder {
  items: PortalOrderItem[];
  shippingAddress: string;
  notes?: string;
}

export interface CustomerProfile {
  customerId: string;
  companyName: string;
  contactPerson: string;
  address: string;
  billingAddress?: string;
}
