
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
  onOpenBigPlay: (playerId: string) => void; // New Prop
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
  // Determine Row Background based on Card Status
  let rowClass = isOdd ? 'bg-white dark:bg-[#1A1A1C]' : 'bg-gray-50 dark:bg-white/5';
  let nameBadge = null;

  const hasActiveCard = player.cardStatus === 'yellow' || player.cardStatus === 'red';

  // Visual dimming for players OFF the field, unless they have a card
  if (!player.isOnField && !hasActiveCard) {
    rowClass = 'bg-gray-100/50 dark:bg-white/5 opacity-75'; 
  }

  if (player.cardStatus === 'yellow') {
    rowClass = 'bg-yellow-50 dark:bg-yellow-900/10';
    nameBadge = (
      <button 
        onClick={() => !isReadOnly && onRemoveCard(player.id)}
        disabled={isReadOnly}
        className="ml-2 text-[10px] font-bold bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-1.5 py-0.5 rounded uppercase hover:bg-yellow-500 transition-colors cursor-pointer shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed group"
        title="Click to remove Sin Bin status"
      >
        Sin Bin
        <span className="ml-1 text-[8px] opacity-70 group-hover:opacity-100 bg-black/10 rounded-full w-3 h-3 flex items-center justify-center">✕</span>
      </button>
    );
  } else if (player.cardStatus === 'red') {
    rowClass = 'bg-red-50 dark:bg-red-900/10';
    nameBadge = (
      <button 
        onClick={() => !isReadOnly && onRemoveCard(player.id)}
        disabled={isReadOnly}
        className="ml-2 text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded uppercase hover:bg-red-700 transition-colors cursor-pointer shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed group"
        title="Click to remove Red Card status"
      >
        Sent Off
        <span className="ml-1 text-[8px] opacity-70 group-hover:opacity-100 bg-black/10 rounded-full w-3 h-3 flex items-center justify-center">✕</span>
      </button>
    );
  }

  // --- IMPACT CALCULATION (Live View) ---
  const calculateImpact = (stats: PlayerStats, cardStatus: string | undefined) => {
    let score = 0;
    // Base
    score += stats.tackles * IMPACT_WEIGHTS.tackles;
    score += stats.hitUps * IMPACT_WEIGHTS.hitUps;
    score += stats.triesScored * IMPACT_WEIGHTS.triesScored;
    score += stats.kicks * IMPACT_WEIGHTS.kicks;
    score += stats.errors * IMPACT_WEIGHTS.errors;
    score += stats.penaltiesConceded * IMPACT_WEIGHTS.penaltiesConceded;
    
    // Advanced
    score += (stats.tryAssists || 0) * IMPACT_WEIGHTS.tryAssists;
    score += (stats.lineBreaks || 0) * IMPACT_WEIGHTS.lineBreaks;
    score += (stats.offloads || 0) * IMPACT_WEIGHTS.offloads;
    score += (stats.fortyTwenties || 0) * IMPACT_WEIGHTS.fortyTwenties;
    score += (stats.forcedDropouts || 0) * IMPACT_WEIGHTS.forcedDropouts;
    score += (stats.trySavers || 0) * IMPACT_WEIGHTS.trySavers;
    score += (stats.oneOnOneStrips || 0) * IMPACT_WEIGHTS.oneOnOneStrips;
    score += (stats.missedTackles || 0) * IMPACT_WEIGHTS.missedTackles;

    // Cards
    if (cardStatus === 'yellow') score += IMPACT_WEIGHTS.yellowCard;
    if (cardStatus === 'red') score += IMPACT_WEIGHTS.redCard;

    return score;
  };

  const impactScore = calculateImpact(player.stats, player.cardStatus);
  
  // Improved Impact Styling: High Contrast
  let impactColor = 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-700 dark:border-white shadow-lg';
  
  if (impactScore >= 30) impactColor = 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white border-none shadow-md shadow-yellow-500/30'; // Elite
  else if (impactScore < 0) impactColor = 'bg-red-600 text-white border border-red-700 shadow-sm'; // Negative

  return (
    <tr className={`${rowClass} border-b border-gray-200 dark:border-white/5 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
      {/* Sticky Jersey Number with ON/OFF Toggle */}
      <td className={`p-2 sticky left-0 z-10 ${rowClass} border-r border-gray-200 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
        <div className="flex flex-col items-center space-y-1">
          <input
            type="text"
            value={player.number}
            onChange={(e) => onIdentityChange(player.id, 'number', e.target.value)}
            className="w-12 text-center font-mono font-bold bg-transparent border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none py-1 text-slate-900 dark:text-white"
            placeholder="#"
            disabled={isReadOnly}
          />
          
          <button
            onClick={() => !isReadOnly && onToggleFieldStatus(player.id)}
            disabled={isReadOnly}
            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border shadow-sm transition-all active:scale-95 ${
              player.isOnField 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            {player.isOnField ? 'ON' : 'OFF'}
          </button>
        </div>
      </td>

      {/* Sticky Name + Big Play Trigger */}
      <td className={`p-2 sticky left-[56px] z-10 ${rowClass} border-r border-gray-200 dark:border-white/5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[190px]`}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={player.name}
            onChange={(e) => onIdentityChange(player.id, 'name', e.target.value)}
            className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded outline-none transition-all placeholder-gray-400 dark:placeholder-gray-600 text-slate-900 dark:text-white"
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
        // Reduce width if controls are hidden to allow more stats to fit. 
        // 115px fits the new compact control (approx 104px content width)
        const cellClass = hideControls ? "p-2 min-w-[90px]" : "p-2 min-w-[115px]";

        return (
          <td key={config.key} className={cellClass}>
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
              hideControls={hideControls}
            />
          </td>
        );
      })}

      {/* IMPACT COLUMN */}
      <td className={`p-2 min-w-[90px] border-l border-gray-200 dark:border-white/5 bg-gray-100/50 dark:bg-white/5`}>
         <div className={`flex items-center justify-center h-10 w-full rounded-xl font-black text-xl transition-colors ${impactColor}`}>
            {impactScore}
         </div>
      </td>
    </tr>
  );
});

PlayerRow.displayName = 'PlayerRow';
