import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, PackageCheck, Calendar, Menu } from 'lucide-react';

const bottomTabs = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, exact: false },
  { name: 'Fulfillment', href: '/dashboard/fulfillment', icon: PackageCheck, exact: false },
  { name: "Today's", href: '/dashboard/todays-pick', icon: Calendar, exact: false },
];

interface BottomTabBarProps {
  onMorePress: () => void;
}

export function BottomTabBar({ onMorePress }: BottomTabBarProps) {
  const location = useLocation();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-200 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {bottomTabs.map(tab => {
        const Icon = tab.icon;
        const active = isActive(tab.href, tab.exact);
        return (
          <Link
            key={tab.name}
            to={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors active:bg-yellow-50 ${
              active ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-yellow-500' : 'text-gray-400'}`} />
            <span className={`text-[10px] font-medium ${active ? 'text-yellow-600' : 'text-gray-400'}`}>
              {tab.name}
            </span>
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-yellow-400 rounded-full" />
            )}
          </Link>
        );
      })}
      <button
        onClick={onMorePress}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] text-gray-400 active:bg-gray-50 transition-colors"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </div>
  );
}
