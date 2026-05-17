import { useState, useEffect } from 'react';
import { supabasePortal as supabase } from '../../../lib/supabasePortal';
import { usePortalAuth as useAuth } from '../../../context/PortalAuthContext';
import type { CustomerProfile } from '../../../types/portal';

export function useCustomerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    supabase
      .from('customers')
      .select('id, company_name, contact_person, address, billing_address')
      .eq('email', user.email)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('No customer account found for this email. Please contact your administrator.');
          setProfile(null);
        } else {
          setProfile({
            customerId: data.id,
            companyName: data.company_name,
            contactPerson: data.contact_person,
            address: data.address || '',
            billingAddress: data.billing_address || undefined,
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [user?.email]);

  return { profile, isLoading, error };
}
