import { STORAGE_KEYS } from './constants';
import { getStorageData, setStorageData } from './utils';
import type { Customer } from '../../types/customer';

export const fetchCustomers = async (): Promise<Customer[]> => {
  return getStorageData<Customer>(STORAGE_KEYS.CUSTOMERS, []);
};

export const createCustomer = async (customer: Customer): Promise<void> => {
  const customers = await fetchCustomers();
  setStorageData(STORAGE_KEYS.CUSTOMERS, [...customers, customer]);
};

export const updateCustomer = async (id: string, customer: Customer): Promise<void> => {
  const customers = await fetchCustomers();
  const updatedCustomers = customers.map(c => c.id === id ? customer : c);
  setStorageData(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const customers = await fetchCustomers();
  const updatedCustomers = customers.filter(c => c.id !== id);
  setStorageData(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
};