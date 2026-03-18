import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useSuppliers } from '../../../context/SupplierContext';
import type { Supplier } from '../../../types/supplier';

const INITIAL_SUPPLIER_DATA: Omit<Supplier, 'id'> = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  taxId: '',
};

export function AddSupplierForm() {
  const navigate = useNavigate();
  const { addSupplier } = useSuppliers();
  const [formData, setFormData] = useState(INITIAL_SUPPLIER_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await addSupplier(formData);
      navigate('/dashboard/suppliers');
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert('Failed to create supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Add New Supplier</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Company Name"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />
          
          <Input
            label="Tax ID"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate('/dashboard/suppliers')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            isLoading={isSubmitting}
          >
            Create Supplier
          </Button>
        </div>
      </form>
    </div>
  );
}