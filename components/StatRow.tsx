import React from 'react';

interface StatRowProps {
  label: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const StatRow: React.FC<StatRowProps> = ({
  label,
  value,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
      <span className="text-gray-700 font-semibold text-lg truncate pr-4 flex-1">
        {label}
      </span>
      
      <div className="flex items-center space-x-4 bg-gray-50 p-1 rounded-lg border border-gray-200">
        <button
          onClick={onDecrement}
          className="w-10 h-10 flex items-center justify-center rounded-md bg-white text-red-500 font-bold text-xl shadow-sm border border-gray-200 active:scale-95 transition-transform hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={value <= 0}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        
        <span className="w-12 text-center font-bold text-2xl text-gray-900 tabular-nums leading-none">
          {value}
        </span>
        
        <button
          onClick={onIncrement}
          className="w-10 h-10 flex items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xl shadow-sm border border-blue-700 active:scale-95 transition-transform hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
};