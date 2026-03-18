import React from 'react';

export type OrderStatusFilter = 'pending' | 'completed' | 'all';

interface StatusTabsProps {
  activeTab: OrderStatusFilter;
  onTabChange: (tab: OrderStatusFilter) => void;
  counts?: {
    pending: number;
    completed: number;
    all: number;
  };
}

export function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
  const tabs = [
    { id: 'pending' as OrderStatusFilter, label: 'Pending', count: counts?.pending },
    { id: 'completed' as OrderStatusFilter, label: 'Completed', count: counts?.completed },
    { id: 'all' as OrderStatusFilter, label: 'All Orders', count: counts?.all },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex space-x-4 px-4 md:px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
              ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs font-semibold
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
