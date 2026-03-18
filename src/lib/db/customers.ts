import { supabase } from '../supabase';
import type { Customer } from '../../types/customer';

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    let allCustomers: any[] = [];
    const pageSize = 1000;
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name', { ascending: true })
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        allCustomers = [...allCustomers, ...data];
        hasMore = data.length === pageSize;
        currentPage++;
      } else {
        hasMore = false;
      }
    }

    return allCustomers ? mapCustomersFromDB(allCustomers) : [];
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
}

export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error } = await supabase
      .from('customers')
      .insert([{
        company_name: customer.companyName,
        contact_person: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        id_number: customer.idNumber,
        billing_address: customer.billingAddress,
        user_id: user?.id
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to create customer:', error);
    throw error;
  }
}

export async function updateCustomer(id: string, customer: Customer): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .update({
        company_name: customer.companyName,
        contact_person: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        id_number: customer.idNumber,
        billing_address: customer.billingAddress
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw error;
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete customer:', error);
    throw error;
  }
}

// Helper function to map database fields to frontend model
function mapCustomersFromDB(data: any[]): Customer[] {
  return data.map(item => ({
    id: item.id,
    companyName: item.company_name,
    contactPerson: item.contact_person,
    email: item.email,
    phone: item.phone || '',
    address: item.address || '',
    idNumber: item.id_number || '',
    billingAddress: item.billing_address || ''
  }));
}