import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Fetches and saves a customer-specific default VK (selling price) for a product.
 * Returns null when no custom price has been set for this customer+product combo.
 */
export function useCustomerProductPrice(customerId?: string, productId?: string) {
  const [customVK, setCustomVK] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!customerId || !productId) {
      setCustomVK(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.rpc('get_customer_product_price', {
        p_customer_id: customerId,
        p_product_id: productId,
      });
      if (fetchError) throw fetchError;
      setCustomVK(data ?? null);
    } catch (err: any) {
      console.error('Error fetching customer product price:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, productId]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const saveCustomVK = useCallback(async (price: number) => {
    if (!customerId || !productId) return;
    setIsSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: upsertError } = await supabase
        .from('customer_product_prices')
        .upsert(
          {
            customer_id: customerId,
            product_id: productId,
            vk_price: price,
            user_id: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'customer_id,product_id,user_id' }
        );
      if (upsertError) throw upsertError;
      setCustomVK(price);
    } catch (err: any) {
      console.error('Error saving customer product price:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }, [customerId, productId]);

  return { customVK, isLoading, isSaving, error, saveCustomVK };
}
