import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  to: string;
  label: string;
}

export function BackButton({ to, label }: BackButtonProps) {
  return (
    <Link
      to={to}
      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      {label}
    </Link>
  );
}