import { useState } from 'react';
import { updatePriceDirectly } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';

export function useVKPriceUpdate() {
  const { patchVKPrice: patchOrderVKPrice } = useOrders();
  const { products, patchVKPrice: patchProductVKPrice } = useProducts();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVKPriceAndOrders = async (artikelNr: string, newPrice: number) => {
    if (!artikelNr || typeof newPrice !== 'number' || newPrice < 0) {
      throw new Error('Invalid input parameters');
    }

    const originalPrice = products.find(p => p.artikelNr === artikelNr)?.vkPrice ?? newPrice;

    // 1. Optimistic update — instant UI feedback across all pages
    patchOrderVKPrice(artikelNr, newPrice);
    patchProductVKPrice(artikelNr, newPrice);

    setIsUpdating(true);
    setError(null);

    try {
      // 2. Single write — DB triggers cascade the change to order_items automatically
      await updatePriceDirectly(artikelNr, newPrice, 'vk_price');
    } catch (err: any) {
      patchOrderVKPrice(artikelNr, originalPrice);
      patchProductVKPrice(artikelNr, originalPrice);
      const message = err?.message || 'Failed to update VK price';
      setError(message);
      console.error('VK price update failed:', message, err);
      throw new Error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateVKPriceAndOrders, isUpdating, error };
}
