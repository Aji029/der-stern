import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { useMonthlyInvoices } from '../hooks/useMonthlyInvoices.tsx';
import { Button } from './ui/Button';

export function MonthlyInvoiceGenerator() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const { isGenerating, progress, total, error, generateMonthlyInvoices } = useMonthlyInvoices();

  const handleGenerate = async () => {
    try {
      const result = await generateMonthlyInvoices(selectedYear, selectedMonth);
      if (result.success) {
        alert(`Successfully generated ${result.count} invoices!`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'März' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Dezember' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Monatsrechnungen generieren</h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Wählen Sie einen Monat aus, um alle Rechnungen als ZIP-Datei herunterzuladen.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monat
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jahr
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isGenerating}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isGenerating && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Generiere Rechnungen...</span>
            <span>{progress} / {total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Generiere {progress} von {total}...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Rechnungen herunterladen
          </>
        )}
      </Button>

      <p className="mt-4 text-xs text-gray-500">
        Die Rechnungen werden als einzelne PDF-Dateien in einer ZIP-Datei zusammengefasst und heruntergeladen.
      </p>
    </div>
  );
}
