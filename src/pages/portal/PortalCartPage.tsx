import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Package, AlertCircle } from 'lucide-react';
import { usePortal } from '../../features/portal/context/PortalContext';
import { usePortalAuth as useAuth } from '../../context/PortalAuthContext';
import { createPortalOrder } from '../../lib/db/portal';
import { Button } from '../../components/ui/Button';

export function PortalCartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, profile } = usePortal();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!profile || !user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const orderId = await createPortalOrder({
        customerId: profile.customerId,
        userId: user.id,
        cart,
        shippingAddress: profile.address,
        notes: notes.trim() || undefined,
      });
      clearCart();
      navigate(`/portal/orders/${orderId}`, { state: { justPlaced: true } });
    } catch (err: any) {
      setError('Failed to place order. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add products before placing an order.</p>
        <Link
          to="/portal/products"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition-colors"
        >
          <Package className="h-4 w-4" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>

      {/* Cart items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {cart.map(item => (
            <div key={item.artikelNr} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-400">Art. Nr: {item.artikelNr}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={e => updateQuantity(item.artikelNr, parseFloat(e.target.value) || 1)}
                  className="w-20 px-2 py-1.5 border rounded-lg text-sm text-center focus:ring-1 focus:ring-brand-400"
                />
                <button
                  onClick={() => removeFromCart(item.artikelNr)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Special instructions or delivery notes..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400 focus:border-brand-400 text-sm"
        />
      </div>

      {/* Delivery address */}
      {profile?.address && (
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
          <p className="font-medium text-gray-700 mb-1">Delivery address</p>
          <p className="text-gray-500">{profile.address}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/portal/products')}
          className="flex-1"
        >
          Continue Shopping
        </Button>
        <Button
          onClick={handlePlaceOrder}
          isLoading={isSubmitting}
          disabled={isSubmitting || !profile}
          className="flex-1 bg-brand-500 hover:bg-brand-600 text-white border-0"
        >
          Place Order ({cart.length} item{cart.length !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );
}
