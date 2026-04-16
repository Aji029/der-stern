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
  const { patchEKPrice: patchOrderEKPrice } = useOrders();
  const { products, patchEKPrice: patchProductEKPrice } = useProducts();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePriceAndOrders = async (artikelNr: string, newPrice: number) => {
    // Capture original price so we can revert if DB write fails
    const originalPrice = products.find(p => p.artikelNr === artikelNr)?.ekPrice ?? newPrice;

    // 1. Optimistic update — instant UI feedback, no wait
    patchOrderEKPrice(artikelNr, newPrice);
    patchProductEKPrice(artikelNr, newPrice);

    setIsUpdating(true);
    setError(null);

    try {
      // 2. Update products table
      await updateEKPrice(artikelNr, newPrice);

      // 3. Fetch ALL pending/processing order IDs — paginated to handle >1000
      let allOrderIds: string[] = [];
      let from = 0;
      const PAGE = 1000;

      while (true) {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('id')
          .in('status', ['Pending', 'Processing'])
          .range(from, from + PAGE - 1);

        if (fetchError) throw fetchError;
        if (!data || data.length === 0) break;

        allOrderIds = [...allOrderIds, ...data.map((o: { id: string }) => o.id)];
        if (data.length < PAGE) break;
        from += PAGE;
      }

      // 4. Update order_items in chunks of 100 — avoids URL length limits
      //    and surfaces errors instead of silently swallowing them
      const CHUNK = 100;
      for (let i = 0; i < allOrderIds.length; i += CHUNK) {
        const chunk = allOrderIds.slice(i, i + CHUNK);
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ ek_price: parseFloat(newPrice.toFixed(2)) })
          .eq('product_id', artikelNr)
          .in('order_id', chunk);

        if (updateError) throw updateError;
      }
    } catch (error: any) {
      // DB write failed — revert the optimistic update so UI stays in sync with DB
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

  return {
    updatePriceAndOrders,
    isUpdating,
    error
  };
}