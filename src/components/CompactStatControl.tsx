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
    <div className={`flex items-center justify-between w-full max-w-[80px] mx-auto p-0 rounded transition-all ${isLeader ? (isNegative ? 'bg-red-50/30' : 'bg-blue-50/20') : ''}`}>
      {!hideControls && (
        <button
          onClick={onDecrement}
          disabled={value <= 0 || isReadOnly}
          className="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 transition-colors disabled:opacity-5"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
        </button>
      )}
      
      <div className="relative flex-1 h-6 mx-0.5">
        <div className="absolute inset-0 bg-white dark:bg-midnight-800 rounded border border-gray-100 dark:border-midnight-600 flex items-center justify-center overflow-hidden shadow-sm">
           <div 
            className={`absolute left-0 bottom-0 top-0 transition-all duration-300 ${isNegative ? 'bg-red-500/10' : 'bg-blue-500/10'}`}
            style={{ width: `${relativeWidth}%` }}
          />
          <span className="relative z-10 font-jersey font-medium text-base tracking-tight text-slate-800 dark:text-white tabular-nums">
            {value}
          </span>
        </div>
      </div>
      
      {!hideControls && (
        <button
          onClick={onIncrement}
          disabled={isReadOnly}
          className="w-5 h-5 flex items-center justify-center rounded bg-blue-600 text-white shadow-sm active:scale-90 transition-all hover:bg-blue-700 disabled:bg-gray-200"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </button>
      )}
    </div>
  );
};
