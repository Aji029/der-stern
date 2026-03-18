import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomerList } from './components/sammelrechnung/CustomerList';
import { OrderSelection } from './components/sammelrechnung/OrderSelection';
import { SammelrechnungList } from './components/sammelrechnung/SammelrechnungList';
import { useSammelrechnungen } from '../../context/SammelrechnungContext';

export function SammelrechnungPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { createSammelrechnung, isLoading } = useSammelrechnungen();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sammelrechnungen</h1>
        <Button onClick={() => setSelectedCustomerId(null)}>
          <Plus className="h-5 w-5 mr-2" />
          Create New
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <CustomerList
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
          />
        </div>
        
        {selectedCustomerId && (
          <div>
            <OrderSelection
              customerId={selectedCustomerId}
              onCreateSammelrechnung={createSammelrechnung}
            />
          </div>
        )}
      </div>

      <SammelrechnungList />
    </div>
  );
}