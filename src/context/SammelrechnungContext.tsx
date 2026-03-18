import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Sammelrechnung, SammelrechnungWithDetails } from '../types/sammelrechnung';

interface SammelrechnungContextType {
  sammelrechnungen: SammelrechnungWithDetails[];
  isLoading: boolean;
  error: string | null;
  createSammelrechnung: (data: Partial<Sammelrechnung> & { orders: string[] }) => Promise<void>;
  updateSammelrechnung: (id: string, data: Partial<Sammelrechnung>) => Promise<void>;
  deleteSammelrechnung: (id: string) => Promise<void>;
}

const SammelrechnungContext = createContext<SammelrechnungContextType | undefined>(undefined);

export function SammelrechnungProvider({ children }: { children: React.ReactNode }) {
  const [sammelrechnungen, setSammelrechnungen] = useState<SammelrechnungWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSammelrechnungen = async () => {
    try {
      let allData: any[] = [];
      const pageSize = 1000;
      let currentPage = 0;
      let hasMore = true;

      while (hasMore) {
        const from = currentPage * pageSize;
        const to = from + pageSize - 1;

        const { data, error: fetchError } = await supabase
          .from('sammelrechnungen')
          .select(`
            *,
            customer:customers(
              company_name,
              contact_person,
              email,
              address
            ),
            orders(
              id,
              order_date,
              total_amount,
              items:order_items(
                product:products(
                  name,
                  mwst
                ),
                quantity,
                vk_price,
                total
              )
            )
          `)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          hasMore = data.length === pageSize;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      const transformedData = allData?.map(sr => ({
        ...sr,
        customer: {
          companyName: sr.customer.company_name,
          contactPerson: sr.customer.contact_person,
          email: sr.customer.email,
          address: sr.customer.address
        },
        orders: sr.orders.map((order: any) => ({
          ...order,
          orderDate: new Date(order.order_date),
          items: order.items
        }))
      })) || [];

      setSammelrechnungen(transformedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching sammelrechnungen:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSammelrechnungen();
  }, []);

  const createSammelrechnung = async (data: Partial<Sammelrechnung> & { orders: string[] }) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) throw new Error('Authentication required');

      // Start a transaction
      const { data: sammelrechnung, error: createError } = await supabase
        .from('sammelrechnungen')
        .insert([{
          customer_id: data.customer_id,
          total_netto: data.total_netto,
          total_vat: data.total_vat,
          total_brutto: data.total_brutto,
          status: data.status,
          payment_status: data.payment_status,
          user_id: user.id
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Update orders with sammelrechnung_id
      const { error: updateError } = await supabase
        .from('orders')
        .update({ sammelrechnung_id: sammelrechnung.id })
        .in('id', data.orders);

      if (updateError) throw updateError;

      await fetchSammelrechnungen();
    } catch (err: any) {
      console.error('Error creating sammelrechnung:', err);
      throw err;
    }
  };

  const updateSammelrechnung = async (id: string, data: Partial<Sammelrechnung>) => {
    try {
      const { error: updateError } = await supabase
        .from('sammelrechnungen')
        .update(data)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchSammelrechnungen();
    } catch (err: any) {
      console.error('Error updating sammelrechnung:', err);
      throw err;
    }
  };

  const deleteSammelrechnung = async (id: string) => {
    try {
      // First, remove sammelrechnung_id from associated orders
      const { error: updateError } = await supabase
        .from('orders')
        .update({ sammelrechnung_id: null })
        .eq('sammelrechnung_id', id);

      if (updateError) throw updateError;

      // Then delete the sammelrechnung
      const { error: deleteError } = await supabase
        .from('sammelrechnungen')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchSammelrechnungen();
    } catch (err: any) {
      console.error('Error deleting sammelrechnung:', err);
      throw err;
    }
  };

  return (
    <SammelrechnungContext.Provider value={{
      sammelrechnungen,
      isLoading,
      error,
      createSammelrechnung,
      updateSammelrechnung,
      deleteSammelrechnung,
    }}>
      {children}
    </SammelrechnungContext.Provider>
  );
}

export function useSammelrechnungen() {
  const context = useContext(SammelrechnungContext);
  if (context === undefined) {
    throw new Error('useSammelrechnungen must be used within a SammelrechnungProvider');
  }
  return context;
}