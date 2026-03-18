import React, { useState } from 'react';
import { AlertTriangle, Upload } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: 'Pending' | 'Resolved';
  attachments: string[];
}

interface DisputeSectionProps {
  disputes: Dispute[];
  onAddDispute: (dispute: Omit<Dispute, 'id'>) => void;
  onUpdateDispute: (id: string, updates: Partial<Dispute>) => void;
}

export function DisputeSection({ disputes, onAddDispute, onUpdateDispute }: DisputeSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newDispute, setNewDispute] = useState({
    reason: '',
    description: '',
    status: 'Pending' as const,
    attachments: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDispute(newDispute);
    setNewDispute({
      reason: '',
      description: '',
      status: 'Pending',
      attachments: [],
    });
    setIsAdding(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Disputes</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Add Dispute
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={newDispute.reason}
              onChange={(e) => setNewDispute(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newDispute.description}
              onChange={(e) => setNewDispute(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg border-2 border-dashed cursor-pointer hover:bg-gray-50">
                <Upload className="h-8 w-8" />
                <span className="mt-2 text-sm">Click to upload files</span>
                <input type="file" className="hidden" multiple onChange={() => {}} />
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Dispute
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {disputes.map(dispute => (
          <div
            key={dispute.id}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{dispute.reason}</h3>
                <p className="text-sm text-gray-500">{dispute.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                dispute.status === 'Resolved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {dispute.status}
              </span>
            </div>

            {dispute.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dispute.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 rounded-full"
                  >
                    {attachment}
                  </div>
                ))}
              </div>
            )}

            {dispute.status === 'Pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateDispute(dispute.id, { status: 'Resolved' })}
              >
                Mark as Resolved
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}