import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, LayoutDashboard, ShoppingBag, ChevronRight, Package, ClipboardList, BarChart3 } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #1a2205 0%, #2e3c0a 40%, #3d5010 70%, #2e3c0a 100%)' }}>

      {/* Star watermark */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-[560px] h-[560px] opacity-[0.07]">
          <svg viewBox="0 0 100 100" fill="#8cb918">
            <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
          </svg>
        </div>
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full border border-[#8cb918]/10" />
        <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full border border-[#8cb918]/8" />
      </div>

      {/* Header / Logo */}
      <header className="relative flex items-center justify-center pt-14 pb-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
               style={{ background: '#8cb918', boxShadow: '0 0 40px rgba(140,185,24,0.35)' }}>
            <Star className="w-10 h-10 text-white fill-white" />
          </div>
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-white/50 text-sm font-medium tracking-[0.35em] uppercase">Der</span>
              <span className="text-white text-4xl font-extrabold tracking-[0.15em] uppercase">Stern</span>
            </div>
            <p className="text-xs font-semibold tracking-[0.45em] uppercase mt-1.5" style={{ color: '#8cb918' }}>
              Vom Grossmarkt Berlin
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-4 pb-10">
        <p className="text-white/35 text-sm mb-10 tracking-widest uppercase">Choose your login</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">

          {/* Admin Card */}
          <button
            onClick={() => navigate('/login')}
            className="group rounded-2xl p-7 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(140,185,24,0.45)'; e.currentTarget.style.background = 'rgba(140,185,24,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(140,185,24,0.18)' }}>
                <LayoutDashboard className="h-6 w-6" style={{ color: '#8cb918' }} />
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-[#8cb918] group-hover:translate-x-0.5 transition-all" />
            </div>

            <h2 className="text-base font-bold text-white mb-1">Admin Dashboard</h2>
            <p className="text-white/35 text-xs mb-5 leading-relaxed">Manage orders, customers, products and reports</p>

            <div className="space-y-1.5 mb-5">
              {[
                { icon: ClipboardList, label: 'Orders & Fulfillment' },
                { icon: Package, label: 'Products & Inventory' },
                { icon: BarChart3, label: 'Reports & Analytics' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-white/25">
                  <Icon className="h-3 w-3" style={{ color: 'rgba(140,185,24,0.45)' }} />
                  {label}
                </div>
              ))}
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8cb918' }}>
                Sign in as Admin <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>

          {/* Customer Card */}
          <button
            onClick={() => navigate('/portal/login')}
            className="group rounded-2xl p-7 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(140,185,24,0.45)'; e.currentTarget.style.background = 'rgba(140,185,24,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(140,185,24,0.18)' }}>
                <ShoppingBag className="h-6 w-6" style={{ color: '#8cb918' }} />
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-[#8cb918] group-hover:translate-x-0.5 transition-all" />
            </div>

            <h2 className="text-base font-bold text-white mb-1">Customer Portal</h2>
            <p className="text-white/35 text-xs mb-5 leading-relaxed">Browse your products and place orders online</p>

            <div className="space-y-1.5 mb-5">
              {[
                { icon: Package, label: 'Browse Your Products' },
                { icon: ShoppingBag, label: 'Place Orders Easily' },
                { icon: ClipboardList, label: 'Track Order Status' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-white/25">
                  <Icon className="h-3 w-3" style={{ color: 'rgba(140,185,24,0.45)' }} />
                  {label}
                </div>
              ))}
            </div>

            <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#8cb918' }}>
                Sign in as Customer <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>

        </div>
      </main>

      <footer className="relative text-center pb-8 text-white/20 text-xs tracking-[0.3em] uppercase">
        © {new Date().getFullYear()} Der Stern · Vom Grossmarkt Berlin
      </footer>
    </div>
  );
}
