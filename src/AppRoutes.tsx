import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProductsPage } from './pages/dashboard/ProductsPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { SuppliersPage } from './pages/dashboard/SuppliersPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { TodaysPickPage } from './pages/dashboard/TodaysPickPage';
import { SammelrechnungPage } from './pages/dashboard/SammelrechnungPage';
import { AddProductForm } from './pages/dashboard/forms/AddProductForm';
import { EditProductForm } from './pages/dashboard/forms/EditProductForm';
import { AddCustomerForm } from './pages/dashboard/forms/AddCustomerForm';
import { EditCustomerForm } from './pages/dashboard/forms/EditCustomerForm';
import { AddSupplierForm } from './pages/dashboard/forms/AddSupplierForm';
import { EditSupplierForm } from './pages/dashboard/forms/EditSupplierForm';
import { AddOrderForm } from './pages/dashboard/forms/AddOrderForm';
import { EditOrderForm } from './pages/dashboard/forms/EditOrderForm';
import { SupplierProductsPage } from './pages/dashboard/SupplierProductsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<AddProductForm />} />
        <Route path="products/:artikelNr/edit" element={<EditProductForm />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<AddCustomerForm />} />
        <Route path="customers/:id/edit" element={<EditCustomerForm />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="suppliers/new" element={<AddSupplierForm />} />
        <Route path="suppliers/:id/edit" element={<EditSupplierForm />} />
        <Route path="suppliers/:supplierId/products" element={<SupplierProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<AddOrderForm />} />
        <Route path="orders/:id/edit" element={<EditOrderForm />} />
        <Route path="sammelrechnungen" element={<SammelrechnungPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="todays-pick" element={<TodaysPickPage />} />
      </Route>

      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}