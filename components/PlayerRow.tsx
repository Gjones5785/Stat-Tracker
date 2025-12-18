import React, { memo } from 'react';
import { Player, StatKey, PlayerStats } from '../types';
import { STAT_CONFIGS, IMPACT_WEIGHTS } from '../constants';
import { CompactStatControl } from './CompactStatControl';

interface PlayerRowProps {
  player: Player;
  onStatChange: (id: string, key: StatKey, delta: number) => void;
  onIdentityChange: (id: string, field: 'name' | 'number', value: string) => void;
  onCardAction: (id: string, type: 'yellow' | 'red') => void;
  onRemoveCard: (id: string) => void;
  onToggleFieldStatus: (id: string) => void;
  onOpenBigPlay: (playerId: string) => void; 
  isOdd: boolean;
  teamTotals: PlayerStats;
  maxValues: PlayerStats;
  leaderCounts: PlayerStats;
  isReadOnly?: boolean;
  hideControls?: boolean;
}

export const PlayerRow: React.FC<PlayerRowProps> = memo(({
  player,
  onStatChange,
  onIdentityChange,
  onCardAction,
  onRemoveCard,
  onToggleFieldStatus,
  onOpenBigPlay,
  isOdd,
  teamTotals,
  maxValues,
  leaderCounts,
  isReadOnly = false,
  hideControls = false
}) => {
  let rowClass = isOdd ? 'bg-white dark:bg-midnight-800' : 'bg-gray-50/30 dark:bg-midnight-900';
  let statusBadge = null;

  const hasActiveCard = player.cardStatus === 'yellow' || player.cardStatus === 'red';

  if (!player.isOnField && !hasActiveCard) {
    rowClass = 'bg-gray-50 dark:bg-midnight-950 opacity-60'; 
  }

  let jerseyBoxClass = "border-gray-200 bg-white dark:bg-midnight-700 dark:border-midnight-600";
  let jerseyTextClass = "text-slate-700 dark:text-white";

  if (player.cardStatus === 'yellow') {
    rowClass = 'bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-yellow-400';
    jerseyBoxClass = "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-sm";
    statusBadge = (
      <button 
        onClick={() => !isReadOnly && onRemoveCard(player.id)}
        className="mt-1.5 text-[9px] font-black bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md uppercase shadow-sm flex items-center gap-1 active:scale-95 transition-all"
      >
        BIN ✕
      </button>
    );
  } else if (player.cardStatus === 'red') {
    rowClass = 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-600';
    jerseyBoxClass = "border-red-600 bg-red-50 text-red-700 shadow-sm";
    statusBadge = (
      <button 
        onClick={() => !isReadOnly && onRemoveCard(player.id)}
        className="mt-1.5 text-[9px] font-black bg-red-600 text-white px-2 py-1 rounded-md uppercase shadow-sm flex items-center gap-1 active:scale-95 transition-all"
      >
        OFF ✕
      </button>
    );
  } else {
    statusBadge = (
      <button
        onClick={() => !isReadOnly && onToggleFieldStatus(player.id)}
        disabled={isReadOnly}
        className={`mt-1.5 text-[9px] font-black uppercase px-2.5 py-1 rounded-md border transition-all active:scale-95 shadow-sm ${
          player.isOnField 
            ? 'bg-green-50 text-green-600 border-green-200' 
            : 'bg-red-50 text-red-500 border-red-200'
        }`}
      >
        {player.isOnField ? 'ON' : 'OFF'}
      </button>
    );
  }

  const calculateImpact = (stats: PlayerStats, cardStatus: string | undefined) => {
    let score = 0;
    score += stats.tackles * IMPACT_WEIGHTS.tackles;
    score += stats.hitUps * IMPACT_WEIGHTS.hitUps;
    score += stats.triesScored * IMPACT_WEIGHTS.triesScored;
    score += stats.kicks * IMPACT_WEIGHTS.kicks;
    score += stats.errors * IMPACT_WEIGHTS.errors;
    score += stats.penaltiesConceded * IMPACT_WEIGHTS.penaltiesConceded;
    score += (stats.tryAssists || 0) * IMPACT_WEIGHTS.tryAssists;
    score += (stats.lineBreaks || 0) * IMPACT_WEIGHTS.lineBreaks;
    score += (stats.offloads || 0) * IMPACT_WEIGHTS.offloads;
    score += (stats.fortyTwenties || 0) * IMPACT_WEIGHTS.fortyTwenties;
    score += (stats.forcedDropouts || 0) * IMPACT_WEIGHTS.forcedDropouts;
    score += (stats.trySavers || 0) * IMPACT_WEIGHTS.trySavers;
    score += (stats.oneOnOneStrips || 0) * IMPACT_WEIGHTS.oneOnOneStrips;
    score += (stats.missedTackles || 0) * IMPACT_WEIGHTS.missedTackles;
    if (cardStatus === 'yellow') score += IMPACT_WEIGHTS.yellowCard;
    if (cardStatus === 'red') score += IMPACT_WEIGHTS.redCard;
    return score;
  };

  const impactScore = calculateImpact(player.stats, player.cardStatus);
  let impactColor = 'bg-slate-900 dark:bg-midnight-700 text-white dark:text-gray-300 border border-slate-700 dark:border-midnight-600';
  if (impactScore >= 30) impactColor = 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none shadow-md';
  else if (impactScore < 0) impactColor = 'bg-red-600 text-white border-none shadow-sm';

  return (
    <tr className={`${rowClass} border-b border-gray-100 dark:border-midnight-700 transition-colors h-[75px]`}>
      <td className={`p-2 sticky left-0 z-10 ${rowClass} border-r border-gray-100 dark:border-midnight-700`}>
        <div className="flex flex-col items-center justify-center">
          <div className={`w-11 h-11 border-2 rounded-xl flex items-center justify-center shadow-sm transition-all ${jerseyBoxClass}`}>
            <input
              type="text"
              value={player.number}
              onChange={(e) => onIdentityChange(player.id, 'number', e.target.value)}
              className={`w-full text-center font-jersey text-3xl font-medium tracking-wide bg-transparent outline-none ${jerseyTextClass}`}
              disabled={isReadOnly}
            />
          </div>
          {statusBadge}
        </div>
      </td>

      <td className={`p-2 sticky left-[80px] z-10 ${rowClass} border-r border-gray-100 dark:border-midnight-700`}>
        <input
          type="text"
          value={player.name}
          onChange={(e) => onIdentityChange(player.id, 'name', e.target.value)}
          className="w-full px-3 py-2 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-heading font-bold text-sm md:text-base placeholder-gray-200"
          placeholder="Player Name"
          disabled={isReadOnly}
        />
      </td>

      {STAT_CONFIGS.map((config) => (
        <td key={config.key} className="p-2 min-w-[100px]">
          <CompactStatControl
            label={config.label}
            value={player.stats[config.key]}
            onIncrement={() => onStatChange(player.id, config.key, 1)}
            onDecrement={() => onStatChange(player.id, config.key, -1)}
            teamTotal={teamTotals[config.key]}
            maxInTeam={maxValues[config.key]}
            leaderCount={leaderCounts[config.key]}
            isReadOnly={isReadOnly || (hasActiveCard && config.key !== 'penaltiesConceded')}
            isNegative={config.isNegative}
            hideControls={hideControls}
          />
        </td>
      ))}

      <td className="p-2 min-w-[90px] bg-gray-50/20 dark:bg-midnight-900">
         <div className={`flex items-center justify-center h-12 w-full rounded-2xl font-jersey text-3xl shadow-inner ${impactColor}`}>
            {impactScore}
         </div>
      </td>
    </tr>
  );
});

PlayerRow.displayName = 'PlayerRow';