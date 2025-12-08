import React, { memo } from 'react';
import { Player, StatKey, PlayerStats } from '../types';
import { STAT_CONFIGS } from '../constants';
import { CompactStatControl } from './CompactStatControl';

interface PlayerRowProps {
  player: Player;
  onStatChange: (id: string, key: StatKey, delta: number) => void;
  onIdentityChange: (id: string, field: 'name' | 'number', value: string) => void;
  onCardAction: (id: string, type: 'yellow' | 'red') => void;
  onToggleFieldStatus: (id: string) => void;
  isOdd: boolean;
  teamTotals: PlayerStats;
  maxValues: PlayerStats;
  leaderCounts: PlayerStats;
  isReadOnly?: boolean;
}

export const PlayerRow: React.FC<PlayerRowProps> = memo(({
  player,
  onStatChange,
  onIdentityChange,
  onCardAction,
  onToggleFieldStatus,
  isOdd,
  teamTotals,
  maxValues,
  leaderCounts,
  isReadOnly = false
}) => {
  // Determine Row Background based on Card Status
  let rowClass = isOdd ? 'bg-white' : 'bg-gray-50';
  let nameBadge = null;

  const hasActiveCard = player.cardStatus === 'yellow' || player.cardStatus === 'red';

  // Visual dimming for players OFF the field, unless they have a card
  if (!player.isOnField && !hasActiveCard) {
    rowClass = 'bg-gray-100/50 opacity-75'; 
  }

  if (player.cardStatus === 'yellow') {
    rowClass = 'bg-yellow-50';
    nameBadge = (
      <button 
        onClick={() => !isReadOnly && onCardAction(player.id, 'yellow')}
        disabled={isReadOnly}
        className="ml-2 text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded uppercase hover:bg-yellow-500 transition-colors cursor-pointer shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        title="Click to end Sin Bin"
      >
        Sin Bin
        <span className="ml-1 text-[8px] opacity-70">✕</span>
      </button>
    );
  } else if (player.cardStatus === 'red') {
    rowClass = 'bg-red-50';
    nameBadge = (
      <button 
        onClick={() => !isReadOnly && onCardAction(player.id, 'red')}
        disabled={isReadOnly}
        className="ml-2 text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded uppercase hover:bg-red-700 transition-colors cursor-pointer shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        title="Click to rescind Red Card"
      >
        Sent Off
        <span className="ml-1 text-[8px] opacity-70">✕</span>
      </button>
    );
  }

  return (
    <tr className={`${rowClass} border-b border-gray-200 hover:bg-blue-50/30 transition-colors`}>
      {/* Sticky Jersey Number with ON/OFF Toggle */}
      <td className={`p-2 sticky left-0 z-10 ${rowClass} border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
        <div className="flex flex-col items-center space-y-1">
          <input
            type="text"
            value={player.number}
            onChange={(e) => onIdentityChange(player.id, 'number', e.target.value)}
            className="w-12 text-center font-mono font-bold bg-transparent border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none py-1"
            placeholder="#"
            disabled={isReadOnly}
          />
          
          <button
            onClick={() => !isReadOnly && onToggleFieldStatus(player.id)}
            disabled={isReadOnly}
            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border shadow-sm transition-all active:scale-95 ${
              player.isOnField 
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
            }`}
          >
            {player.isOnField ? 'ON' : 'OFF'}
          </button>
        </div>
      </td>

      {/* Sticky Name */}
      <td className={`p-2 sticky left-[56px] z-10 ${rowClass} border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[160px]`}>
        <div className="flex items-center">
          <input
            type="text"
            value={player.name}
            onChange={(e) => onIdentityChange(player.id, 'name', e.target.value)}
            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded outline-none transition-all placeholder-gray-400"
            placeholder="Player Name"
            disabled={isReadOnly}
          />
          {nameBadge}
        </div>
      </td>

      {/* Stats Columns */}
      {STAT_CONFIGS.map((config) => {
        // Logic: Input is disabled if read-only OR if player has a card AND the stat is NOT penalties.
        const isStatDisabled = isReadOnly || (hasActiveCard && config.key !== 'penaltiesConceded');

        return (
          <td key={config.key} className="p-2 min-w-[130px]">
            <CompactStatControl
              label={config.label}
              value={player.stats[config.key]}
              onIncrement={() => onStatChange(player.id, config.key, 1)}
              onDecrement={() => onStatChange(player.id, config.key, -1)}
              teamTotal={teamTotals[config.key]}
              maxInTeam={maxValues[config.key]}
              leaderCount={leaderCounts[config.key]}
              isReadOnly={isStatDisabled}
              isNegative={config.isNegative}
            />
          </td>
        );
      })}
    </tr>
  );
});

PlayerRow.displayName = 'PlayerRow';