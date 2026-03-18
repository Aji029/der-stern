import { STORAGE_KEYS } from './constants';
import { getStorageData, setStorageData } from './utils';
import type { Supplier } from '../../types/supplier';

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  return getStorageData<Supplier>(STORAGE_KEYS.SUPPLIERS, []);
};

export const createSupplier = async (supplier: Supplier): Promise<void> => {
  const suppliers = await fetchSuppliers();
  setStorageData(STORAGE_KEYS.SUPPLIERS, [...suppliers, supplier]);
};

export const updateSupplier = async (id: string, supplier: Supplier): Promise<void> => {
  const suppliers = await fetchSuppliers();
  const updatedSuppliers = suppliers.map(s => s.id === id ? supplier : s);
  setStorageData(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const suppliers = await fetchSuppliers();
  const updatedSuppliers = suppliers.filter(s => s.id !== id);
  setStorageData(STORAGE_KEYS.SUPPLIERS, updatedSuppliers);
};