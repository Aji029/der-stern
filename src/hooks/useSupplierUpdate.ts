import { supabase } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';

export function useSupplierUpdate() {
  const { refreshOrders } = useOrders();

  const updateSupplierAcrossOrders = async (productId: string, supplierId: string) => {
    try {
      const { error } = await supabase.rpc('update_supplier_across_orders', {
        p_product_id: productId,
        p_supplier_id: supplierId
      });

      if (error) throw error;

      // Refresh orders to update UI
      await refreshOrders();
    } catch (err: any) {
      console.error('Error updating supplier across orders:', err);
      throw err;
    }
  };

  return { updateSupplierAcrossOrders };
}