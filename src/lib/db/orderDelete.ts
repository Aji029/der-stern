import { supabase } from '../supabase';

export async function deleteOrder(id: string): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) throw new Error('Authentication required');

    // First delete order items (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    // Then delete the order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (orderError) throw orderError;
  } catch (error) {
    console.error('Failed to delete order:', error);
    throw error;
  }
}