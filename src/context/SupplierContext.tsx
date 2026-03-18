import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../lib/db/suppliers';
import type { Supplier } from '../types/supplier';

interface SupplierContextType {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplier: (id: string) => Supplier | undefined;
  isLoading: boolean;
  error: string | null;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export function SupplierProvider({ children }: { children: React.ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSuppliers();
      setSuppliers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const addSupplierContext = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      setIsLoading(true);
      await createSupplier(supplier);
      await loadSuppliers(); // Reload suppliers after creation
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupplierContext = async (id: string, supplier: Supplier) => {
    try {
      setIsLoading(true);
      await updateSupplier(id, supplier);
      await loadSuppliers(); // Reload suppliers after update
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupplierContext = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteSupplier(id);
      await loadSuppliers(); // Reload suppliers after deletion
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSupplier = (id: string) => {
    return suppliers.find(supplier => supplier.id === id);
  };

  return (
    <SupplierContext.Provider value={{
      suppliers,
      addSupplier: addSupplierContext,
      updateSupplier: updateSupplierContext,
      deleteSupplier: deleteSupplierContext,
      getSupplier,
      isLoading,
      error,
    }}>
      {children}
    </SupplierContext.Provider>
  );
}

export function useSuppliers() {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
}