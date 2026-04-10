import { useState } from 'react';
import { supabase, updatePriceDirectly } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';

export function useVKPriceUpdate() {
  const { patchVKPrice: patchOrderVKPrice } = useOrders();
  const { patchVKPrice: patchProductVKPrice } = useProducts();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVKPriceAndOrders = async (artikelNr: string, newPrice: number) => {
    if (!artikelNr || typeof newPrice !== 'number' || newPrice < 0) {
      throw new Error('Invalid input parameters');
    }

    // 1. Optimistic update — instant UI feedback across all pages
    patchOrderVKPrice(artikelNr, newPrice);
    patchProductVKPrice(artikelNr, newPrice);

    setIsUpdating(true);
    setError(null);

    try {
      // 2. Update products.vk_price in DB
      await updatePriceDirectly(artikelNr, newPrice, 'vk_price');

      // 3. Update vk_price in all Pending/Processing order_items for this product
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

      const CHUNK = 100;
      for (let i = 0; i < allOrderIds.length; i += CHUNK) {
        const chunk = allOrderIds.slice(i, i + CHUNK);
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ vk_price: parseFloat(newPrice.toFixed(2)) })
          .eq('product_id', artikelNr)
          .in('order_id', chunk);

        if (updateError) throw updateError;
      }
    } catch (err: any) {
      // Keep optimistic state — don't revert UI on DB error
      const handledError = supabase.handleError ? supabase.handleError(err) : err;
      const message = handledError?.message || err?.message || 'Failed to update VK price';
      setError(message);
      console.error('VK price update failed:', message, err);
      throw new Error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateVKPriceAndOrders, isUpdating, error };
}
