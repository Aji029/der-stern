import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Bot, Star, LogOut } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm shadow-xl"
           style={{ background: '#2e3c0a' }}>
        <div className="flex h-full flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                   style={{ background: '#8cb918' }}>
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-white/50 text-xs font-medium tracking-wider uppercase">Der</span>
                <span className="text-white text-base font-extrabold tracking-wider uppercase">Stern</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white/80 p-1 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{
                    background: isActive ? 'rgba(140,185,24,0.2)' : 'transparent',
                    color: isActive ? '#8cb918' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}

            {/* AI Assistant */}
            <button
              onClick={() => { onOpenAI(); onClose(); }}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <Bot className="h-5 w-5 mr-3 flex-shrink-0" />
              AI Assistant
            </button>
          </nav>

          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              onClick={onLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}