import React, { useState } from 'react';
import { BarChart, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SalesReport } from './components/reports/SalesReport';
import { InventoryReport } from './components/reports/InventoryReport';
import { CustomerReport } from './components/reports/CustomerReport';

type ReportType = 'sales' | 'inventory' | 'customers';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');

  const reports = [
    { id: 'sales', name: 'Sales Report', component: SalesReport },
    { id: 'inventory', name: 'Inventory Report', component: InventoryReport },
    { id: 'customers', name: 'Customer Report', component: CustomerReport },
  ] as const;

  const ActiveReportComponent = reports.find(r => r.id === activeReport)?.component || SalesReport;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <Button>
          <Download className="h-5 w-5 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeReport === report.id
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {report.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <ActiveReportComponent />
        </div>
      </div>
    </div>
  );
}