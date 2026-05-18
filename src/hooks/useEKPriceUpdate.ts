import { useState } from 'react';
import { updatePriceDirectly } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';

export async function updateEKPrice(artikelNr: string, newPrice: number): Promise<void> {
  if (!artikelNr || typeof newPrice !== 'number' || newPrice < 0) {
    throw new Error('Invalid input parameters');
  }
  await updatePriceDirectly(artikelNr, newPrice, 'ek_price');
}

export function useEKPriceUpdate() {
  const { patchEKPrice: patchOrderEKPrice } = useOrders();
  const { products, patchEKPrice: patchProductEKPrice } = useProducts();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePriceAndOrders = async (artikelNr: string, newPrice: number) => {
    const originalPrice = products.find(p => p.artikelNr === artikelNr)?.ekPrice ?? newPrice;

    patchOrderEKPrice(artikelNr, newPrice);
    patchProductEKPrice(artikelNr, newPrice);

    setIsUpdating(true);
    setError(null);

    try {
      // Single write — DB triggers cascade the change to order_items automatically
      await updateEKPrice(artikelNr, newPrice);
    } catch (error: any) {
      patchOrderEKPrice(artikelNr, originalPrice);
      patchProductEKPrice(artikelNr, originalPrice);
      const message = error?.message || 'Failed to update price';
      setError(message);
      console.error('EK price update failed:', message, error);
      throw new Error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updatePriceAndOrders, isUpdating, error };
}
