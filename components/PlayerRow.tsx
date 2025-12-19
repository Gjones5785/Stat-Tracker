import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
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
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const [radialPos, setRadialPos] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isReadOnly) return;
    const { clientX, clientY } = e;
    
    longPressTimer.current = setTimeout(() => {
      setRadialPos({ x: clientX, y: clientY });
      setShowRadialMenu(true);
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 600);
  }, [isReadOnly]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const closeRadialMenu = useCallback(() => {
    setShowRadialMenu(false);
  }, []);

  let rowClass = isOdd ? 'bg-white dark:bg-midnight-800' : 'bg-gray-50/30 dark:bg-midnight-900';
  let statusBadge = null;

  const hasActiveCard = player.cardStatus === 'yellow' || player.cardStatus === 'red';

  if (!player.isOnField && !hasActiveCard) {
    rowClass = 'bg-gray-50 dark:bg-midnight-950 opacity-60'; 
  }

  let jerseyBoxClass = "border-gray-200 bg-white dark:bg-midnight-700 dark:border-midnight-600 shadow-sm";
  let jerseyTextClass = "text-slate-900 dark:text-white";

  if (player.cardStatus === 'yellow') {
    rowClass = 'bg-yellow-50/50 dark:bg-yellow-900/10 border-l-4 border-yellow-400';
    jerseyBoxClass = "border-yellow-400 bg-yellow-50 text-yellow-700";
    statusBadge = (
      <button 
        onClick={() => !isReadOnly && onRemoveCard(player.id)}
        className="mt-0.5 text-[7px] font-black bg-yellow-400 text-yellow-900 px-1 py-0.5 rounded uppercase shadow-sm flex items-center gap-1 active:scale-95 transition-all"
      >
        BIN ✕
      </button>
    );
  } else if (player.cardStatus === 'red') {
    rowClass = 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-600';
    jerseyBoxClass = "border-red-600 bg-red-50 text-red-700";
    statusBadge = (
      <button 
        onClick={() => !isReadOnly && onRemoveCard(player.id)}
        className="mt-0.5 text-[7px] font-black bg-red-600 text-white px-1 py-0.5 rounded uppercase shadow-sm flex items-center gap-1 active:scale-95 transition-all"
      >
        OFF ✕
      </button>
    );
  } else {
    statusBadge = (
      <button
        onClick={() => !isReadOnly && onToggleFieldStatus(player.id)}
        disabled={isReadOnly}
        className={`mt-0.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-2 transition-all active:scale-95 ${
          player.isOnField 
            ? 'bg-green-50 text-green-600 border-green-200 shadow-sm' 
            : 'bg-red-50 text-red-500 border-red-200 shadow-sm'
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
    <>
      <tr className={`${rowClass} border-b border-gray-100 dark:border-midnight-700 transition-colors h-[70px]`}>
        <td className={`p-1 sticky left-0 z-10 ${rowClass} border-r border-gray-100 dark:border-midnight-700`}>
          <div className="flex flex-col items-center justify-center">
            <div className={`w-10 h-8 border-2 rounded-lg flex items-center justify-center transition-all ${jerseyBoxClass}`}>
              <input
                type="text"
                value={player.number}
                onChange={(e) => onIdentityChange(player.id, 'number', e.target.value)}
                className={`w-full text-center font-jersey text-2xl font-bold tracking-tight bg-transparent outline-none pt-0.5 ${jerseyTextClass}`}
                disabled={isReadOnly}
              />
            </div>
            {statusBadge}
          </div>
        </td>

        <td 
          className={`p-1 sticky left-[52px] z-10 ${rowClass} border-r border-gray-100 dark:border-midnight-700 select-none`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          <input
            type="text"
            value={player.name}
            onChange={(e) => onIdentityChange(player.id, 'name', e.target.value)}
            className="w-full px-2 py-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white font-heading font-black text-sm placeholder-gray-200 pointer-events-none"
            placeholder="Player Name"
            disabled={isReadOnly}
            readOnly
          />
        </td>

        {STAT_CONFIGS.map((config) => (
          <td key={config.key} className="p-1 min-w-[100px]">
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

        <td className="p-1 min-w-[90px] bg-gray-50/20 dark:bg-midnight-900">
          <div className={`flex items-center justify-center h-9 w-full rounded-xl font-jersey text-2xl shadow-inner ${impactColor}`}>
              {impactScore}
          </div>
        </td>
      </tr>

      {/* Contextual Radial Menu */}
      {showRadialMenu && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" onClick={closeRadialMenu}></div>
          <div 
            className="absolute animate-in zoom-in duration-150"
            style={{ 
              left: Math.min(window.innerWidth - 100, Math.max(100, radialPos.x)), 
              top: Math.min(window.innerHeight - 100, Math.max(100, radialPos.y)),
              transform: 'translate(-50%, -50%)' 
            }}
          >
            {/* Center Identifier */}
            <div className="w-12 h-12 bg-white dark:bg-midnight-800 rounded-full flex items-center justify-center border-2 border-slate-900 dark:border-white shadow-2xl relative z-10">
               <span className="font-heading font-black text-slate-900 dark:text-white text-xs">{player.number}</span>
            </div>

            {/* Radial Buttons */}
            {/* 1. Yellow Card (Top Left) */}
            <button 
              onClick={() => { onCardAction(player.id, 'yellow'); closeRadialMenu(); }}
              className="absolute -top-12 -left-12 w-12 h-12 bg-yellow-400 rounded-full border-2 border-white dark:border-midnight-700 shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:scale-110"
              title="Yellow Card"
            >
              <div className="w-3 h-5 bg-yellow-500 rounded-sm border border-yellow-700 shadow-sm"></div>
            </button>

            {/* 2. Red Card (Top Right) */}
            <button 
              onClick={() => { onCardAction(player.id, 'red'); closeRadialMenu(); }}
              className="absolute -top-12 -right-12 w-12 h-12 bg-red-600 rounded-full border-2 border-white dark:border-midnight-700 shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:scale-110"
              title="Red Card"
            >
              <div className="w-3 h-5 bg-red-700 rounded-sm border border-red-900 shadow-sm"></div>
            </button>

            {/* 3. Impact Play (Bottom) */}
            <button 
              onClick={() => { onOpenBigPlay(player.id); closeRadialMenu(); }}
              className="absolute -bottom-14 left-0 -translate-x-1/2 w-14 h-14 bg-slate-900 dark:bg-white rounded-full border-2 border-white dark:border-midnight-700 shadow-xl flex items-center justify-center active:scale-90 transition-transform hover:scale-110 ml-6"
              title="Impact Play"
            >
              <span className="text-2xl text-white dark:text-slate-900">⚡</span>
            </button>
            
            {/* 4. Close (Center) - Built into backdrop but adding icon hint */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap bg-white/80 dark:bg-midnight-900/80 px-2 py-0.5 rounded-full">Actions</div>
          </div>
        </div>
      )}
    </>
  );
});

PlayerRow.displayName = 'PlayerRow';