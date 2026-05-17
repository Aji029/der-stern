import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { SammelrechnungButton } from '../../../../components/sammelrechnung/SammelrechnungButton';
import { useSammelrechnungen } from '../../../../context/SammelrechnungContext';
import { formatDateForDisplay } from '../../../../utils/dateFormatting';
import { formatPrice } from '../../../../utils/priceCalculations';

export function SammelrechnungList() {
  const { sammelrechnungen, deleteSammelrechnung, isLoading } = useSammelrechnungen();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sammelrechnungen.map((sr) => (
              <tr key={sr.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  {sr.number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {sr.customer.companyName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {sr.customer.contactPerson}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateForDisplay(sr.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {sr.orders.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                  {formatPrice(sr.totalBrutto)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    sr.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : sr.status === 'sent'
                      ? 'bg-blue-100 text-blue-800'
                      : sr.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sr.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <SammelrechnungButton 
                      sammelrechnung={sr}
                      className="text-blue-600 hover:text-blue-700"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this Sammelrechnung?')) {
                          deleteSammelrechnung(sr.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}