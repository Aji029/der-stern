import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Bot } from 'lucide-react';
import { Button } from '../ui/Button';
import { navigation } from './DashboardLayout';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenAI: () => void;
}

export function MobileNav({ isOpen, onClose, onLogout, onOpenAI }: MobileNavProps) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-gray-800/50" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white shadow-xl">
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-xl font-semibold">Menu</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}

            {/* AI Assistant */}
            <button
              onClick={() => { onOpenAI(); onClose(); }}
              className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
            >
              <Bot className="h-5 w-5 mr-3 flex-shrink-0" />
              AI Assistant
            </button>
          </nav>

          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={onLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}