import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AIAssistantPanel, useAIAssistant } from '../../features/aiAssistant';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart,
  Bell,
  LogOut,
  Star,
  Factory,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Menu,
  FileText,
  PackageCheck,
  Bot,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { MobileNav } from './MobileNav';
import { BottomTabBar } from './BottomTabBar';
import { useSidebar } from '../../hooks/useSidebar';
import { GlobalSearch } from './GlobalSearch';

export const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Suppliers', href: '/dashboard/suppliers', icon: Factory },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Sammelrechnungen', href: '/dashboard/sammelrechnungen', icon: FileText },
  { name: 'E-Rechnung', href: '/dashboard/erechnung', icon: Receipt },
  { name: "Today's Pick", href: '/dashboard/todays-pick', icon: Calendar },
  { name: 'Fulfillment', href: '/dashboard/fulfillment', icon: PackageCheck },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    isCollapsed,
    setIsCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useSidebar();

  const { messages, isLoading: aiLoading, isOpen: isAIOpen, open: openAI, close: closeAI, sendMessage, resetChat } = useAIAssistant();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getCurrentPageName = () => {
    const path = location.pathname;
    if (path.includes('/suppliers/') && path.includes('/products')) return 'Supplier Products';
    return navigation.find(item => item.href === path)?.name || 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:relative lg:flex lg:flex-col">
          <div
            className={`flex flex-col h-full transition-all duration-300 ease-in-out group ${
              isCollapsed ? 'w-16 hover:w-64' : 'w-64'
            }`}
            style={{ background: '#2e3c0a', borderRight: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                     style={{ background: '#8cb918' }}>
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
                <div className={`ml-2.5 transition-all duration-300 overflow-hidden ${
                  isCollapsed ? 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto' : 'opacity-100 w-auto'
                }`}>
                  <div className="flex items-baseline gap-1 whitespace-nowrap">
                    <span className="text-white/50 text-xs font-medium tracking-wider uppercase">Der</span>
                    <span className="text-white text-lg font-extrabold tracking-wider uppercase">Stern</span>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-2 space-y-0.5">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                      style={{
                        background: isActive ? 'rgba(140,185,24,0.2)' : 'transparent',
                        color: isActive ? '#8cb918' : 'rgba(255,255,255,0.55)',
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                        isCollapsed ? 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto' : 'opacity-100 w-auto'
                      }`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}

                {/* AI Assistant — opens overlay panel, styled identical to nav items */}
                <button
                  onClick={openAI}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                  style={{
                    background: isAIOpen ? 'rgba(140,185,24,0.2)' : 'transparent',
                    color: isAIOpen ? '#8cb918' : 'rgba(255,255,255,0.55)',
                  }}
                  onMouseEnter={e => { if (!isAIOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; } }}
                  onMouseLeave={e => { if (!isAIOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; } }}
                >
                  <Bot className="w-5 h-5 flex-shrink-0" />
                  <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                    isCollapsed ? 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto' : 'opacity-100 w-auto'
                  }`}>
                    AI Assistant
                  </span>
                </button>
              </nav>
            </div>

            <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                  isCollapsed ? 'opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto' : 'opacity-100 w-auto'
                }`}>
                  Sign out
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-lg focus:outline-none transition-colors"
              style={{ background: '#3d5010', border: '1px solid rgba(255,255,255,0.12)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4e6314')}
              onMouseLeave={e => (e.currentTarget.style.background = '#3d5010')}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed
                ? <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                : <ChevronLeft  className="h-3.5 w-3.5 text-white/70" />
              }
            </button>
          </div>
        </div>

        {/* Mobile slide-out menu (via More button in bottom tab bar) */}
        <MobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
          onOpenAI={openAI}
        />

        {/* Main content */}
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Top header */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
              <div className="flex items-center">
                <button
                  className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-600"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-gray-900 ml-2 lg:ml-0">
                  {getCurrentPageName()}
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                {/* Search hidden on mobile — bottom tab bar handles navigation */}
                <div className="hidden sm:block">
                  <GlobalSearch />
                </div>
                <button className="p-1 text-gray-400 hover:text-brand-500 transition-colors duration-200">
                  <Bell className="w-6 h-6" />
                </button>
                {/* Username hidden on mobile to save header space */}
                <div className="hidden sm:flex items-center">
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area — extra bottom padding on mobile for bottom tab bar */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 pb-24 lg:pb-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar — mobile/tablet only */}
      <BottomTabBar onMorePress={() => setIsMobileMenuOpen(true)} />

      {/* AI Assistant panel overlay */}
      {isAIOpen && (
        <AIAssistantPanel
          messages={messages}
          isLoading={aiLoading}
          onSend={sendMessage}
          onReset={resetChat}
          onClose={closeAI}
        />
      )}
    </div>
  );
}
