import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../lib/db/customers';
import type { Customer } from '../types/customer';

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  isLoading: boolean;
  error: string | null;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const addCustomerContext = async (customer: Omit<Customer, 'id'>) => {
    try {
      setIsLoading(true);
      await createCustomer(customer);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomerContext = async (id: string, customer: Customer) => {
    try {
      setIsLoading(true);
      await updateCustomer(id, customer);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCustomerContext = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteCustomer(id);
      await loadCustomers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomer = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  return (
    <CustomerContext.Provider value={{
      customers,
      addCustomer: addCustomerContext,
      updateCustomer: updateCustomerContext,
      deleteCustomer: deleteCustomerContext,
      getCustomer,
      isLoading,
      error,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}