import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('./pages/dashboard/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CustomersPage = lazy(() => import('./pages/dashboard/CustomersPage').then(m => ({ default: m.CustomersPage })));
const SuppliersPage = lazy(() => import('./pages/dashboard/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const OrdersPage = lazy(() => import('./pages/dashboard/OrdersPage').then(m => ({ default: m.OrdersPage })));
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage').then(m => ({ default: m.ReportsPage })));
const TodaysPickPage = lazy(() => import('./pages/dashboard/TodaysPickPage').then(m => ({ default: m.TodaysPickPage })));
const SammelrechnungPage = lazy(() => import('./pages/dashboard/SammelrechnungPage').then(m => ({ default: m.SammelrechnungPage })));
const AddProductForm = lazy(() => import('./pages/dashboard/forms/AddProductForm').then(m => ({ default: m.AddProductForm })));
const EditProductForm = lazy(() => import('./pages/dashboard/forms/EditProductForm').then(m => ({ default: m.EditProductForm })));
const AddCustomerForm = lazy(() => import('./pages/dashboard/forms/AddCustomerForm').then(m => ({ default: m.AddCustomerForm })));
const EditCustomerForm = lazy(() => import('./pages/dashboard/forms/EditCustomerForm').then(m => ({ default: m.EditCustomerForm })));
const AddSupplierForm = lazy(() => import('./pages/dashboard/forms/AddSupplierForm').then(m => ({ default: m.AddSupplierForm })));
const EditSupplierForm = lazy(() => import('./pages/dashboard/forms/EditSupplierForm').then(m => ({ default: m.EditSupplierForm })));
const AddOrderForm = lazy(() => import('./pages/dashboard/forms/AddOrderForm').then(m => ({ default: m.AddOrderForm })));
const EditOrderForm = lazy(() => import('./pages/dashboard/forms/EditOrderForm').then(m => ({ default: m.EditOrderForm })));
const SupplierProductsPage = lazy(() => import('./pages/dashboard/SupplierProductsPage').then(m => ({ default: m.SupplierProductsPage })));
const FulfillmentPage = lazy(() => import('./pages/dashboard/FulfillmentPage').then(m => ({ default: m.FulfillmentPage })));
const ERechenungPage = lazy(() => import('./pages/dashboard/ERechenungPage').then(m => ({ default: m.ERechenungPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
        <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
        <Route path="products/new" element={<Suspense fallback={<PageLoader />}><AddProductForm /></Suspense>} />
        <Route path="products/:artikelNr/edit" element={<Suspense fallback={<PageLoader />}><EditProductForm /></Suspense>} />
        <Route path="customers" element={<Suspense fallback={<PageLoader />}><CustomersPage /></Suspense>} />
        <Route path="customers/new" element={<Suspense fallback={<PageLoader />}><AddCustomerForm /></Suspense>} />
        <Route path="customers/:id/edit" element={<Suspense fallback={<PageLoader />}><EditCustomerForm /></Suspense>} />
        <Route path="suppliers" element={<Suspense fallback={<PageLoader />}><SuppliersPage /></Suspense>} />
        <Route path="suppliers/new" element={<Suspense fallback={<PageLoader />}><AddSupplierForm /></Suspense>} />
        <Route path="suppliers/:id/edit" element={<Suspense fallback={<PageLoader />}><EditSupplierForm /></Suspense>} />
        <Route path="suppliers/:supplierId/products" element={<Suspense fallback={<PageLoader />}><SupplierProductsPage /></Suspense>} />
        <Route path="orders" element={<Suspense fallback={<PageLoader />}><OrdersPage /></Suspense>} />
        <Route path="orders/new" element={<Suspense fallback={<PageLoader />}><AddOrderForm /></Suspense>} />
        <Route path="orders/:id/edit" element={<Suspense fallback={<PageLoader />}><EditOrderForm /></Suspense>} />
        <Route path="sammelrechnungen" element={<Suspense fallback={<PageLoader />}><SammelrechnungPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="todays-pick" element={<Suspense fallback={<PageLoader />}><TodaysPickPage /></Suspense>} />
        <Route path="fulfillment" element={<Suspense fallback={<PageLoader />}><FulfillmentPage /></Suspense>} />
        <Route path="erechnung" element={<Suspense fallback={<PageLoader />}><ERechenungPage /></Suspense>} />
      </Route>

      {/* Root Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
