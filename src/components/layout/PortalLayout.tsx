import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Star, ShoppingCart, Package, ClipboardList, LogOut } from 'lucide-react';
import { usePortalAuth as useAuth } from '../../context/PortalAuthContext';
import { usePortal } from '../../features/portal/context/PortalContext';

export function PortalLayout() {
  const { logout, user } = useAuth();
  const { cartCount, profile } = usePortal();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav — brand olive */}
      <header className="sticky top-0 z-40" style={{ background: '#2e3c0a', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/portal/products" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ background: '#8cb918' }}>
                <Star className="h-4 w-4 text-white fill-white" />
              </div>
              <div className="hidden sm:flex items-baseline gap-1.5">
                <span className="text-white/50 text-xs font-medium tracking-wider uppercase">Der</span>
                <span className="text-white text-lg font-extrabold tracking-wider uppercase">Stern</span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/portal/products"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive('/portal/products') ? 'rgba(140,185,24,0.2)' : 'transparent',
                  color: isActive('/portal/products') ? '#8cb918' : 'rgba(255,255,255,0.55)',
                }}
              >
                <Package className="h-4 w-4" />
                Products
              </Link>
              <Link
                to="/portal/orders"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: isActive('/portal/orders') ? 'rgba(140,185,24,0.2)' : 'transparent',
                  color: isActive('/portal/orders') ? '#8cb918' : 'rgba(255,255,255,0.55)',
                }}
              >
                <ClipboardList className="h-4 w-4" />
                My Orders
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Cart */}
              <Link
                to="/portal/cart"
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: isActive('/portal/cart') ? '#8cb918' : 'rgba(255,255,255,0.6)' }}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
                        style={{ background: '#8cb918' }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
                <span className="hidden sm:inline">Cart</span>
              </Link>

              {/* User name */}
              <div className="hidden sm:flex items-center gap-2 text-sm pl-3"
                   style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
                <span className="font-medium">{profile?.companyName || user?.name || user?.email}</span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden flex" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link
            to="/portal/products"
            className="flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors"
            style={{ color: isActive('/portal/products') ? '#8cb918' : 'rgba(255,255,255,0.45)' }}
          >
            <Package className="h-5 w-5 mb-0.5" />
            Products
          </Link>
          <Link
            to="/portal/orders"
            className="flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors"
            style={{ color: isActive('/portal/orders') ? '#8cb918' : 'rgba(255,255,255,0.45)' }}
          >
            <ClipboardList className="h-5 w-5 mb-0.5" />
            Orders
          </Link>
          <Link
            to="/portal/cart"
            className="flex-1 flex flex-col items-center py-2 text-xs font-medium relative transition-colors"
            style={{ color: isActive('/portal/cart') ? '#8cb918' : 'rgba(255,255,255,0.45)' }}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
                      style={{ background: '#8cb918', fontSize: '0.6rem' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            Cart
          </Link>
        </nav>
      </header>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
