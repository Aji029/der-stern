export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms?: string;
  supplierType?: string;
  rating?: number;
  notes?: string;
}
