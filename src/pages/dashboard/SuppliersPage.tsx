import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SupplierList } from './components/SupplierList';
import { BackButton } from '../../components/navigation/BackButton';

export function SuppliersPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Button onClick={() => navigate('/dashboard/suppliers/new')}>
          <Plus className="h-5 w-5 mr-2" />
          Add Supplier
        </Button>
      </div>

      <SupplierList />
    </div>
  );
}