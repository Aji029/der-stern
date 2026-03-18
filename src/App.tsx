import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CustomerProvider } from './context/CustomerContext';
import { SupplierProvider } from './context/SupplierContext';
import { OrderProvider } from './context/OrderContext';
import { CategoryProvider } from './context/CategoryContext';
import { SammelrechnungProvider } from './context/SammelrechnungContext';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CustomerProvider>
            <SupplierProvider>
              <OrderProvider>
                <CategoryProvider>
                  <SammelrechnungProvider>
                    <AppRoutes />
                  </SammelrechnungProvider>
                </CategoryProvider>
              </OrderProvider>
            </SupplierProvider>
          </CustomerProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}