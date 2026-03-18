import React from 'react';
import { LucideIcon } from 'lucide-react';
import { formatDateForInput } from '../../../../utils/dateFormatting';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  icon: LucideIcon;
}

export function DateSelector({ selectedDate, onDateChange, icon: Icon }: DateSelectorProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        max={formatDateForInput(new Date())}
        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}