import { supabase } from '../lib/supabase';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';

export function useSupplierUpdate() {
  const { refreshOrders, patchItemSupplier } = useOrders();
  const { patchSupplier: patchProductSupplier } = useProducts();

  const updateSupplierAcrossOrders = async (artikelNr: string, supplierId: string) => {
    // 1. Optimistic update — instant feedback on Orders, Products, and Today's Pick
    patchItemSupplier(artikelNr, supplierId);
    patchProductSupplier(artikelNr, supplierId);

    try {
      // 2. DB write — updates products table + all order_items atomically
      const { error } = await supabase.rpc('update_supplier_across_orders', {
        p_product_id: artikelNr,
        p_supplier_id: supplierId
      });
      if (error) throw error;

      // 3. Silent background sync — no loading spinner
      await refreshOrders(true);
    } catch (err: any) {
      console.error('Error updating supplier across orders:', err);
      throw err;
    }
  };

  return { updateSupplierAcrossOrders };
}
