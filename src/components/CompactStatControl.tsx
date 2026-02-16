import React from 'react';
import { TEAM_SIZE } from '../constants';

interface CompactStatControlProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  teamTotal: number;
  maxInTeam: number;
  leaderCount?: number;
  isReadOnly?: boolean;
  isNegative?: boolean;
  hideControls?: boolean;
}

export const CompactStatControl: React.FC<CompactStatControlProps> = ({
  value,
  onIncrement,
  onDecrement,
  label,
  teamTotal,
  maxInTeam,
  leaderCount = 1,
  isReadOnly = false,
  isNegative = false,
  hideControls = false
}) => {
  const relativeWidth = maxInTeam > 0 ? (value / maxInTeam) * 100 : 0;
  const isLeader = maxInTeam > 0 && value === maxInTeam;

  return (
    <div className={`flex items-center justify-between w-full max-w-[100px] md:max-w-[110px] mx-auto p-0 rounded-lg transition-all ${isLeader ? 'ring-1 ring-inset ring-black/5 dark:ring-white/10' : ''}`}>
      {!hideControls && (
        <button
          onClick={onDecrement}
          disabled={value <= 0 || isReadOnly}
          className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-5 active:scale-90"
        >
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
        </button>
      )}
      
      <div className="relative flex-1 h-7 md:h-9 mx-1">
        <div className={`absolute inset-0 bg-white dark:bg-midnight-800 rounded border-2 flex items-center justify-center overflow-hidden shadow-sm transition-colors ${isLeader && !isNegative ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-midnight-800'} ${isLeader ? 'border-blue-400 dark:border-blue-600' : 'border-gray-100 dark:border-midnight-600'}`}>
           <div 
            className={`absolute left-0 bottom-0 top-0 transition-all duration-300 ${isNegative ? 'bg-red-500/10' : 'bg-blue-500/10'}`}
            style={{ width: `${relativeWidth}%` }}
          />
          <span className={`relative z-10 font-jersey font-medium text-lg md:text-2xl tracking-tight ${isLeader ? 'scale-110' : ''} text-slate-800 dark:text-white tabular-nums pt-0.5 transition-transform`}>
            {value}
          </span>
        </div>
      </div>
      
      {!hideControls && (
        <button
          onClick={onIncrement}
          disabled={isReadOnly}
          className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm active:scale-90 transition-all hover:bg-blue-700 disabled:bg-gray-200"
        >
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
      )}
    </div>
  );
};