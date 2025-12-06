
import React, { memo } from 'react';
import { Player, StatKey, PlayerStats } from '../types';
import { STAT_CONFIGS } from '../constants';
import { CompactStatControl } from './CompactStatControl';

interface PlayerRowProps {
  player: Player;
  onStatChange: (id: string, key: StatKey, delta: number) => void;
  onIdentityChange: (id: string, field: 'name' | 'number', value: string) => void;
  isOdd: boolean;
  teamTotals: PlayerStats;
  maxValues: PlayerStats;
  isReadOnly?: boolean;
}

export const PlayerRow: React.FC<PlayerRowProps> = memo(({
  player,
  onStatChange,
  onIdentityChange,
  isOdd,
  teamTotals,
  maxValues,
  isReadOnly = false
}) => {
  const rowClass = isOdd ? 'bg-white' : 'bg-gray-50';

  return (
    <tr className={`${rowClass} border-b border-gray-200 hover:bg-blue-50/30 transition-colors`}>
      {/* Sticky Jersey Number */}
      <td className={`p-2 sticky left-0 z-10 ${rowClass} border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
        <input
          type="text"
          value={player.number}
          onChange={(e) => onIdentityChange(player.id, 'number', e.target.value)}
          className="w-12 text-center font-mono font-bold bg-transparent border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none py-1"
          placeholder="#"
        />
      </td>

      {/* Sticky Name */}
      <td className={`p-2 sticky left-[56px] z-10 ${rowClass} border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[160px]`}>
        <input
          type="text"
          value={player.name}
          onChange={(e) => onIdentityChange(player.id, 'name', e.target.value)}
          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-white rounded outline-none transition-all placeholder-gray-400"
          placeholder="Player Name"
        />
      </td>

      {/* Stats Columns */}
      {STAT_CONFIGS.map((config) => (
        <td key={config.key} className="p-2 min-w-[130px]">
          <CompactStatControl
            label={config.label}
            value={player.stats[config.key]}
            onIncrement={() => onStatChange(player.id, config.key, 1)}
            onDecrement={() => onStatChange(player.id, config.key, -1)}
            teamTotal={teamTotals[config.key]}
            maxInTeam={maxValues[config.key]}
            isReadOnly={isReadOnly}
            isNegative={config.isNegative}
          />
        </td>
      ))}
    </tr>
  );
});

PlayerRow.displayName = 'PlayerRow';
