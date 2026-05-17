import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CustomerProvider } from './context/CustomerContext';
import { SupplierProvider } from './context/SupplierContext';
import { OrderProvider } from './context/OrderContext';
import { CategoryProvider } from './context/CategoryContext';
import { SammelrechnungProvider } from './context/SammelrechnungContext';
import { PortalAuthProvider } from './context/PortalAuthContext';
import { PortalProvider } from './features/portal/context/PortalContext';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortalAuthProvider>
          <ProductProvider>
            <CustomerProvider>
              <SupplierProvider>
                <OrderProvider>
                  <CategoryProvider>
                    <SammelrechnungProvider>
                      <PortalProvider>
                        <AppRoutes />
                      </PortalProvider>
                    </SammelrechnungProvider>
                  </CategoryProvider>
                </OrderProvider>
              </SupplierProvider>
            </CustomerProvider>
          </ProductProvider>
        </PortalAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}