import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePortalAuth as useAuth } from '../context/PortalAuthContext';

interface CustomerPortalRouteProps {
  children: React.ReactNode;
}

export function CustomerPortalRoute({ children }: CustomerPortalRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
