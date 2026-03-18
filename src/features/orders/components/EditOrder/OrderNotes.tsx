import React from 'react';

interface OrderNotesProps {
  notes: string;
  onChange: (notes: string) => void;
}

export function OrderNotes({ notes, onChange }: OrderNotesProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
        placeholder="Add any additional notes about this order..."
      />
    </div>
  );
}