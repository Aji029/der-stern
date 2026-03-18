import { useState } from 'react';
import { supabase, updatePriceDirectly } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';

export async function updateEKPrice(artikelNr: string, newPrice: number): Promise<void> {
  if (!artikelNr || typeof newPrice !== 'number' || newPrice < 0) {
    throw new Error('Invalid input parameters');
  }
  await updatePriceDirectly(artikelNr, newPrice, 'ek_price');
}

export function useEKPriceUpdate() {
  const { patchEKPrice: patchOrderEKPrice, refreshOrders } = useOrders();
  const { patchEKPrice: patchProductEKPrice, refreshProducts } = useProducts();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePriceAndOrders = async (artikelNr: string, newPrice: number) => {
    // 1. Optimistic update — instant UI feedback, no wait
    patchOrderEKPrice(artikelNr, newPrice);
    patchProductEKPrice(artikelNr, newPrice);

    setIsUpdating(true);
    setError(null);

    try {
      // 2. Update products table
      await updateEKPrice(artikelNr, newPrice);

      // 3. Update order_items for pending/processing orders
      const { data: affectedOrderRows } = await supabase
        .from('orders')
        .select('id')
        .in('status', ['Pending', 'Processing']);

      if (affectedOrderRows && affectedOrderRows.length > 0) {
        await supabase
          .from('order_items')
          .update({ ek_price: parseFloat(newPrice.toFixed(2)) })
          .eq('product_id', artikelNr)
          .in('order_id', affectedOrderRows.map(o => o.id));
      }
    } catch (error: any) {
      // On failure revert by re-fetching the real data
      await Promise.all([refreshOrders(), refreshProducts()]);
      const handledError = supabase.handleError(error);
      setError(handledError.message);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updatePriceAndOrders,
    isUpdating,
    error
  };
}