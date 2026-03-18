import React from 'react';

interface MwstSelectProps {
  value: 'A' | 'B';
  onChange: (value: 'A' | 'B') => void;
  className?: string;
  disabled?: boolean;
}

export function MwstSelect({ value, onChange, className = '', disabled = false }: MwstSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'A' | 'B')}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 ${className}`}
      disabled={disabled}
    >
      <option value="A">7%</option>
      <option value="B">19%</option>
    </select>
  );
}