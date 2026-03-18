import React, { useState } from 'react';
import { useOrders } from '../../../context/OrderContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { OrderPDF } from '../../../components/OrderPDF';
import { Button } from '../../../components/ui/Button';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { X, AlertTriangle, FileCheck } from 'lucide-react';

interface EndDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EndDayModal({ isOpen, onClose }: EndDayModalProps) {
  const { orders, updateOrder } = useOrders();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime() && order.status !== 'Completed';
  });

  const handleEndDay = async () => {
    setIsProcessing(true);
    try {
      // Update all orders to completed status
      await Promise.all(
        todaysOrders.map(order =>
          updateOrder(order.id, {
            ...order,
            status: 'Completed',
            updated_at: new Date(),
          })
        )
      );
      setIsCompleted(true);
    } catch (error) {
      console.error('Error ending day:', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-900">End Day Operations</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isCompleted ? (
            <>
              <div className="mb-6">
                <div className="flex items-center space-x-2 text-yellow-600 mb-4">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Please Review</span>
                </div>
                <p className="text-gray-600 mb-4">
                  You are about to finalize all orders for {formatDateForDisplay(today)}.
                  This action will:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Mark all pending orders as completed</li>
                  <li>Generate PDF bills for each order</li>
                  <li>Lock orders from further modifications</li>
                </ul>
                <p className="text-sm text-gray-500">
                  Found {todaysOrders.length} orders to process.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEndDay}
                  isLoading={isProcessing}
                  disabled={todaysOrders.length === 0}
                >
                  End Day
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <FileCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Day Ended Successfully
              </h3>
              <p className="text-gray-600 mb-6">
                All orders have been processed and PDFs are ready for download.
              </p>
              <div className="space-y-3">
                {todaysOrders.map(order => (
                  <PDFDownloadLink
                    key={order.id}
                    document={<OrderPDF order={order} />}
                    fileName={`Order_${order.id}_${order.customer.companyName}.pdf`}
                    className="block"
                  >
                    {({ loading }) => (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : `Download ${order.id} PDF`}
                      </Button>
                    )}
                  </PDFDownloadLink>
                ))}
              </div>
              <Button
                className="mt-6 w-full"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}