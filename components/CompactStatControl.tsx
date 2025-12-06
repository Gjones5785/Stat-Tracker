
import React from 'react';
import { TEAM_SIZE } from '../constants';

interface CompactStatControlProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  teamTotal: number;
  maxInTeam: number;
  isReadOnly?: boolean;
  isNegative?: boolean;
}

export const CompactStatControl: React.FC<CompactStatControlProps> = ({
  value,
  onIncrement,
  onDecrement,
  label,
  teamTotal,
  maxInTeam,
  isReadOnly = false,
  isNegative = false
}) => {
  const average = (teamTotal / TEAM_SIZE).toFixed(1);
  const percentOfTotal = teamTotal > 0 ? ((value / teamTotal) * 100).toFixed(0) : '0';
  
  // Calculate relative bar width (compared to the team leader for this stat)
  const relativeWidth = maxInTeam > 0 ? (value / maxInTeam) * 100 : 0;

  // MVP Check: Value must match the max and be greater than 0
  const isLeader = maxInTeam > 0 && value === maxInTeam;

  // Determine styles based on Leader status and whether the stat is negative (bad)
  let containerStyles = 'bg-gray-50 border-gray-200';
  let barStyles = 'bg-blue-100';
  let leaderLabelColor = 'text-yellow-400';

  if (isLeader) {
    if (isNegative) {
      // Red styling for bad stats leaders (Errors/Penalties)
      containerStyles = 'bg-red-50 border-red-400 shadow-sm ring-1 ring-red-400/30';
      barStyles = 'bg-red-200/50';
      leaderLabelColor = 'text-red-500';
    } else {
      // Gold styling for good stats leaders
      containerStyles = 'bg-yellow-50 border-yellow-400 shadow-sm ring-1 ring-yellow-400/30';
      barStyles = 'bg-yellow-200/50';
      leaderLabelColor = 'text-yellow-400';
    }
  }

  return (
    <div className={`flex items-center justify-center rounded-lg border p-1 w-full max-w-[140px] mx-auto transition-colors ${containerStyles}`}>
      <button
        onClick={onDecrement}
        disabled={value <= 0 || isReadOnly}
        className={`w-8 h-8 flex items-center justify-center rounded bg-white font-bold shadow-sm border border-gray-100 active:bg-gray-100 touch-manipulation z-0 transition-opacity ${
          isReadOnly ? 'opacity-30 cursor-not-allowed' : 'text-red-500 disabled:opacity-30 disabled:cursor-not-allowed'
        }`}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      
      {/* Value Display with Tooltip Trigger */}
      <div className="group relative flex-1 mx-1 h-8">
        <div className={`absolute inset-0 flex items-center justify-center bg-white rounded border border-gray-100 overflow-hidden ${!isReadOnly ? 'cursor-help' : ''}`}>
          {/* Visual Trend Bar (Background) */}
          <div 
            className={`absolute bottom-0 left-0 top-0 transition-all duration-300 ease-out ${barStyles}`}
            style={{ width: `${relativeWidth}%` }}
          />
          
          {/* Numeric Value */}
          <span className="relative z-10 font-bold text-lg text-gray-900 tabular-nums leading-none">
            {value}
          </span>
        </div>

        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs rounded shadow-lg py-1.5 px-3 relative">
            {/* Tooltip Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900"></div>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-right">
              <span className="text-gray-400 text-left">Team Total:</span>
              <span className="font-mono">{teamTotal}</span>
              
              <span className="text-gray-400 text-left">Team Avg:</span>
              <span className="font-mono">{average}</span>
              
              <span className="text-gray-400 text-left">Contribution:</span>
              <span className="font-mono">{percentOfTotal}%</span>
              
              {isLeader && (
                 <span className={`col-span-2 text-center font-bold mt-1 uppercase tracking-wide text-[10px] ${leaderLabelColor}`}>
                    {isNegative ? 'Highest Count' : 'Team Leader'}
                 </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={onIncrement}
        disabled={isReadOnly}
        className={`w-8 h-8 flex items-center justify-center rounded bg-blue-600 text-white font-bold shadow-sm active:bg-blue-700 touch-manipulation z-0 transition-opacity ${
          isReadOnly ? 'opacity-30 cursor-not-allowed bg-gray-400' : ''
        }`}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
};
