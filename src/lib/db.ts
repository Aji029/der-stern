import type { Product } from '../types/product';
import type { Customer } from '../types/customer';
import type { Supplier } from '../types/supplier';
import type { Order } from '../types/order';

// Local Storage Keys
const STORAGE_KEYS = {
  PRODUCTS: 'der-stern-products',
  CUSTOMERS: 'der-stern-customers',
  SUPPLIERS: 'der-stern-suppliers',
  ORDERS: 'der-stern-orders',
} as const;

// Helper functions
const getStorageData = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    // Parse the data and handle date conversion
    const parsedData = JSON.parse(data, (key, value) => {
      // Convert date strings back to Date objects
      if (key === 'orderDate' || key === 'deliveryDate') {
        return value ? new Date(value) : null;
      }
      return value;
    });
    
    return parsedData;
  } catch (error) {
    console.error(`Error reading from localStorage:`, error);
    return defaultValue;
  }
};

const setStorageData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage:`, error);
  }
};

// Products
export const fetchProducts = async (): Promise<Product[]> => {
  return getStorageData<Product>(STORAGE_KEYS.PRODUCTS, []);
};

export const createProduct = async (product: Omit<Product, 'image'> & { image: File | null }): Promise<void> => {
  const products = await fetchProducts();
  const imageUrl = product.image ? URL.createObjectURL(product.image) : null;
  const newProduct = { ...product, image: imageUrl };
  setStorageData(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
};

export const updateProduct = async (artikelNr: string, product: Omit<Product, 'image'> & { image: File | null }): Promise<void> => {
  const products = await fetchProducts();
  const imageUrl = product.image instanceof File 
    ? URL.createObjectURL(product.image)
    : products.find(p => p.artikelNr === artikelNr)?.image || null;
  
  const updatedProducts = products.map(p => 
    p.artikelNr === artikelNr ? { ...product, image: imageUrl } : p
  );
  setStorageData(STORAGE_KEYS.PRODUCTS, updatedProducts);
};

export const deleteProduct = async (artikelNr: string): Promise<void> => {
  const products = await fetchProducts();
  const updatedProducts = products.filter(p => p.artikelNr !== artikelNr);
  setStorageData(STORAGE_KEYS.PRODUCTS, updatedProducts);
};

// Customers
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

// Suppliers
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

// Orders
export const fetchOrders = async (): Promise<Order[]> => {
  return getStorageData<Order>(STORAGE_KEYS.ORDERS, []);
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<void> => {
  const orders = await fetchOrders();
  const newOrder = {
    ...order,
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    orderDate: new Date(order.orderDate),
    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
  };
  setStorageData(STORAGE_KEYS.ORDERS, [...orders, newOrder]);
};

export const updateOrder = async (id: string, order: Order): Promise<void> => {
  const orders = await fetchOrders();
  const updatedOrders = orders.map(o => o.id === id ? {
    ...order,
    orderDate: new Date(order.orderDate),
    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
  } : o);
  setStorageData(STORAGE_KEYS.ORDERS, updatedOrders);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const orders = await fetchOrders();
  const updatedOrders = orders.filter(o => o.id !== id);
  setStorageData(STORAGE_KEYS.ORDERS, updatedOrders);
};