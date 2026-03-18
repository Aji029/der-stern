import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { CustomerList } from './components/CustomerList';
import { BackButton } from '../../components/navigation/BackButton';

export function CustomersPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Button onClick={() => navigate('/dashboard/customers/new')}>
          <Plus className="h-5 w-5 mr-2" />
          Add Customer
        </Button>
      </div>

      <CustomerList />
    </div>
  );
}