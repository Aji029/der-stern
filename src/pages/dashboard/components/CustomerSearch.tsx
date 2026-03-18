import React from 'react';
import { Search } from 'lucide-react';

interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CustomerSearch({ searchTerm, onSearchChange }: CustomerSearchProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search customers by name, company, email..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}