import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PriceHistory {
  vk_price: number;
  order_date: string;
}

export function usePriceHistory(productId: string) {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        if (!productId) {
          setHistory([]);
          return;
        }
        
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .rpc('get_product_price_history', {
            p_product_id: productId,
            p_limit: 3
          });

        if (fetchError) throw fetchError;

        setHistory(data || []);
      } catch (err: any) {
        console.error('Error fetching price history:', err);
        setError(err.message);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [productId]);

  return { history, isLoading, error };
}