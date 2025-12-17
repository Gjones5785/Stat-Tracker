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
  const average = (teamTotal / TEAM_SIZE).toFixed(1);
  const percentOfTotal = teamTotal > 0 ? ((value / teamTotal) * 100).toFixed(0) : '0';
  
  // Calculate relative bar width (compared to the team leader for this stat)
  const relativeWidth = maxInTeam > 0 ? (value / maxInTeam) * 100 : 0;

  // MVP Check: Value must match the max and be greater than 0
  const isLeader = maxInTeam > 0 && value === maxInTeam;
  // Shared Leader Check: It is a leader, and more than 1 person has this score
  const isShared = isLeader && leaderCount > 1;

  // Determine styles based on Leader status and whether the stat is negative (bad)
  let containerStyles = 'bg-gray-50 dark:bg-midnight-700/50 border-gray-200 dark:border-midnight-600';
  let barStyles = 'bg-blue-100 dark:bg-neon-blue/20';
  let leaderLabelColor = 'text-green-600 dark:text-neon-green';

  if (isLeader) {
    if (isNegative) {
      // Red styling for bad stats leaders (Errors/Penalties)
      containerStyles = 'bg-red-50 dark:bg-red-900/10 border-red-400 dark:border-red-900 shadow-sm ring-1 ring-red-400/30';
      barStyles = 'bg-red-200/50 dark:bg-red-900/30';
      leaderLabelColor = 'text-red-500 dark:text-red-400';
    } else if (isShared) {
      // Yellow styling for Joint Leaders
      containerStyles = 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-400 dark:border-yellow-700 shadow-sm ring-1 ring-yellow-400/30';
      barStyles = 'bg-yellow-200/50 dark:bg-yellow-900/30';
      leaderLabelColor = 'text-yellow-600 dark:text-neon-yellow';
    } else {
      // Green/Neon styling for Unique Team Leader
      containerStyles = 'bg-green-50 dark:bg-midnight-700 border-green-400 dark:border-neon-green/30 shadow-sm ring-1 ring-green-400/30 dark:ring-neon-green/20';
      barStyles = 'bg-green-200/50 dark:bg-neon-green/20';
      leaderLabelColor = 'text-green-600 dark:text-neon-green';
    }
  }

  return (
    <div className={`flex items-center justify-center rounded-lg ${!hideControls ? 'border p-1' : 'border py-1 px-2'} w-full ${!hideControls ? 'max-w-[120px]' : 'max-w-full'} mx-auto transition-colors ${containerStyles}`}>
      {!hideControls && (
        <button
          onClick={onDecrement}
          disabled={value <= 0 || isReadOnly}
          className={`w-8 h-8 flex items-center justify-center rounded bg-white dark:bg-midnight-800 font-bold text-lg shadow-sm border border-gray-100 dark:border-midnight-600 active:bg-gray-100 dark:active:bg-midnight-700 touch-manipulation z-0 transition-opacity ${
            isReadOnly ? 'opacity-30 cursor-not-allowed text-gray-400' : 'text-red-500 dark:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
      )}
      
      {/* Value Display with Tooltip Trigger */}
      <div className={`group relative flex-1 ${!hideControls ? 'mx-1' : ''} h-8`}>
        <div className={`absolute inset-0 flex items-center justify-center bg-white dark:bg-transparent rounded border ${!hideControls ? 'border-gray-100 dark:border-midnight-600' : 'border-transparent'} overflow-hidden ${!isReadOnly ? 'cursor-help' : ''}`}>
          {/* Visual Trend Bar (Background) */}
          <div 
            className={`absolute bottom-0 left-0 top-0 transition-all duration-300 ease-out ${barStyles}`}
            style={{ width: `${relativeWidth}%` }}
          />
          
          {/* Numeric Value - USES SPORTS FONT */}
          <span className="relative z-10 font-jersey font-medium text-2xl tracking-wide text-gray-900 dark:text-white tabular-nums leading-none pt-1">
            {value}
          </span>
        </div>

        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max hidden group-hover:block z-50 pointer-events-none">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded shadow-lg py-1.5 px-3 relative">
            {/* Tooltip Arrow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-4 border-b-gray-900 dark:border-b-white"></div>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-right">
              <span className="text-gray-400 dark:text-gray-500 text-left">Team Total:</span>
              <span className="font-mono">{teamTotal}</span>
              
              <span className="text-gray-400 dark:text-gray-500 text-left">Team Avg:</span>
              <span className="font-mono">{average}</span>
              
              <span className="text-gray-400 dark:text-gray-500 text-left">Contribution:</span>
              <span className="font-mono">{percentOfTotal}%</span>
              
              {isLeader && (
                 <span className={`col-span-2 text-center font-bold mt-1 uppercase tracking-wide text-[10px] ${leaderLabelColor}`}>
                    {isNegative ? 'Highest Count' : isShared ? 'Joint Leader' : 'Team Leader'}
                 </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {!hideControls && (
        <button
          onClick={onIncrement}
          disabled={isReadOnly}
          className={`w-8 h-8 flex items-center justify-center rounded bg-blue-600 dark:bg-blue-600 text-white font-bold text-lg shadow-sm active:bg-blue-700 dark:active:bg-blue-500 touch-manipulation z-0 transition-opacity ${
            isReadOnly ? 'opacity-30 cursor-not-allowed bg-gray-400 dark:bg-gray-700' : ''
          }`}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      )}
    </div>
  );
};