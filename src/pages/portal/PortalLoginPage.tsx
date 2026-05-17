import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Star, ChevronLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { usePortalAuth as useAuth } from '../../context/PortalAuthContext';

export function PortalLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/portal/products', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      navigate('/portal/products', { replace: true });
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
         style={{ background: 'linear-gradient(135deg, #1a2205 0%, #2e3c0a 40%, #3d5010 70%, #2e3c0a 100%)' }}>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-1.5 text-sm mb-8"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
               style={{ background: '#8cb918', boxShadow: '0 0 32px rgba(140,185,24,0.35)' }}>
            <Star className="h-8 w-8 text-white fill-white" />
          </div>
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-white/50 text-sm tracking-wider uppercase">Der</span>
              <span className="text-white text-2xl font-extrabold tracking-wider uppercase">Stern</span>
            </div>
            <p className="text-xs tracking-widest uppercase mt-1" style={{ color: '#8cb918' }}>
              Customer Portal
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-8 shadow-2xl rounded-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-lg disabled:opacity-60"
              style={{ background: '#8cb918', boxShadow: '0 4px 16px rgba(140,185,24,0.3)' }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#6d9212'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#8cb918'; }}
            >
              {!isSubmitting && <LogIn className="h-4 w-4" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
