import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut, ReceiptText } from 'lucide-react';
import { AuthProvider, ProtectedRoute, useAuth } from './lib/auth';
import LoginPage from './pages/LoginPage';
import InvoicesPage from './pages/InvoicesPage';
import TodayPage from './pages/TodayPage';
import InvoiceReview from './InvoiceReview';

function Shell({ children }: { children: React.ReactNode }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <ReceiptText className="w-5 h-5 text-brand-600" />
            Rechnungsabgleich
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="hidden sm:inline">{session?.user.email}</span>
            <button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell>
                  <TodayPage />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Shell>
                  <InvoicesPage />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices/:invoiceId"
            element={
              <ProtectedRoute>
                <Shell>
                  <InvoiceReview />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
