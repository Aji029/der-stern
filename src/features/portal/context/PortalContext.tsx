import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCustomerProfile } from '../hooks/useCustomerProfile';
import type { PortalCartItem, CustomerProfile } from '../../../types/portal';

interface PortalContextType {
  profile: CustomerProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  cart: PortalCartItem[];
  cartCount: number;
  addToCart: (item: Omit<PortalCartItem, 'quantity'>, quantity: number) => void;
  removeFromCart: (artikelNr: string) => void;
  updateQuantity: (artikelNr: string, quantity: number) => void;
  clearCart: () => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export function PortalProvider({ children }: { children: ReactNode }) {
  const { profile, isLoading: isLoadingProfile, error: profileError } = useCustomerProfile();
  const [cart, setCart] = useState<PortalCartItem[]>([]);

  const addToCart = (item: Omit<PortalCartItem, 'quantity'>, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.artikelNr === item.artikelNr);
      if (existing) {
        return prev.map(i =>
          i.artikelNr === item.artikelNr
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (artikelNr: string) => {
    setCart(prev => prev.filter(i => i.artikelNr !== artikelNr));
  };

  const updateQuantity = (artikelNr: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(artikelNr);
      return;
    }
    setCart(prev =>
      prev.map(i => i.artikelNr === artikelNr ? { ...i, quantity } : i)
    );
  };

  const clearCart = () => setCart([]);

  return (
    <PortalContext.Provider value={{
      profile,
      isLoadingProfile,
      profileError,
      cart,
      cartCount: cart.reduce((sum, i) => sum + i.quantity, 0),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within PortalProvider');
  return ctx;
}
