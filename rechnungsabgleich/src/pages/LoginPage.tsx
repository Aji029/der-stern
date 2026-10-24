import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { session, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError((err as Error).message ?? 'Anmeldung fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 justify-center text-gray-900">
          <ReceiptText className="w-6 h-6 text-brand-600" />
          <h1 className="text-lg font-semibold">Rechnungsabgleich</h1>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg py-2 font-medium"
        >
          {isSubmitting ? 'Anmelden …' : 'Anmelden'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Dieselben Zugangsdaten wie bei der Stern.
        </p>
      </form>
    </div>
  );
}
