
import React from 'react';
import { Button } from './Button';
import { Player, StatKey } from '../types';
import { IMPACT_WEIGHTS } from '../constants';

interface BigPlayModalProps {
  isOpen: boolean;
  player: Player | null;
  players: Player[];
  onPlayerChange: (id: string) => void;
  onConfirm: (stat: StatKey, description: string) => void;
  onClose: () => void;
}

export const BigPlayModal: React.FC<BigPlayModalProps> = ({
  isOpen,
  player,
  players,
  onPlayerChange,
  onConfirm,
  onClose
}) => {
  if (!isOpen || !player) return null;

  const handleSelect = (stat: StatKey, label: string) => {
    onConfirm(stat, label);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const numA = parseInt(a.number);
    const numB = parseInt(b.number);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.number.localeCompare(b.number);
  });

  const BigPlayButton = ({ stat, label, points, colorClass, borderClass }: { stat: StatKey, label: string, points: number, colorClass: string, borderClass?: string }) => (
    <button
      onClick={() => handleSelect(stat, label)}
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all transform active:scale-95 hover:shadow-lg ${colorClass} ${borderClass}`}
    >
      <span className="text-sm font-bold uppercase tracking-wide mb-1 font-heading">{label}</span>
      <span className={`text-xl font-jersey font-medium px-2 py-0.5 rounded bg-black/20 backdrop-blur-sm min-w-[3rem]`}>
        {points > 0 ? '+' : ''}{points}
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-midnight-800 rounded-2xl shadow-2xl dark:shadow-neon-blue max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-midnight-700">
        
        {/* Header */}
        <div className="bg-slate-900 dark:bg-midnight-900 p-6 flex justify-between items-center border-b border-gray-100 dark:border-midnight-700">
          <div>
            <h2 className="text-2xl font-heading font-black text-white italic tracking-wider flex items-center gap-2 drop-shadow-md">
              <span className="text-yellow-400 text-3xl">⚡</span> 
              IMPACT PLAY
            </h2>
            
            {/* Player Selector */}
            <div className="mt-2 flex items-center">
               <span className="text-slate-400 text-sm font-medium mr-2 uppercase tracking-widest">Target:</span>
               <div className="relative">
                  <select 
                    value={player.id}
                    onChange={(e) => onPlayerChange(e.target.value)}
                    className="appearance-none bg-slate-800 dark:bg-midnight-800 text-white pl-3 pr-8 py-1 rounded-lg text-lg font-jersey font-medium border border-slate-700 dark:border-midnight-600 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none cursor-pointer tracking-wide"
                  >
                    {sortedPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        #{p.number} {p.name || 'Unknown'} {!p.isOnField && '(OFF)'}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Attack Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-500 dark:bg-neon-blue rounded-full mr-2 shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span> Attack
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <BigPlayButton 
                stat="tryAssists" 
                label="Try Assist" 
                points={IMPACT_WEIGHTS.tryAssists} 
                colorClass="bg-blue-500 border-blue-600 text-white hover:bg-blue-600 dark:bg-blue-600 dark:border-neon-blue dark:shadow-neon-blue" 
              />
              <BigPlayButton 
                stat="lineBreaks" 
                label="Line Break" 
                points={IMPACT_WEIGHTS.lineBreaks} 
                colorClass="bg-blue-50 dark:bg-midnight-700/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-midnight-700 hover:border-blue-300 dark:hover:border-neon-blue" 
              />
              <BigPlayButton 
                stat="offloads" 
                label="Offload" 
                points={IMPACT_WEIGHTS.offloads} 
                colorClass="bg-blue-50 dark:bg-midnight-700/50 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-midnight-700 hover:border-blue-300 dark:hover:border-neon-blue" 
              />
              <BigPlayButton 
                stat="fortyTwenties" 
                label="40/20 Kick" 
                points={IMPACT_WEIGHTS.fortyTwenties} 
                colorClass="bg-indigo-500 border-indigo-600 text-white hover:bg-indigo-600 dark:bg-indigo-600 dark:border-indigo-400" 
              />
              <BigPlayButton 
                stat="forcedDropouts" 
                label="Forced Drop-out" 
                points={IMPACT_WEIGHTS.forcedDropouts} 
                colorClass="bg-indigo-50 dark:bg-midnight-700/50 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-midnight-700 hover:border-indigo-300 dark:hover:border-indigo-400" 
              />
            </div>
          </div>

          {/* Defense Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-500 dark:bg-neon-green rounded-full mr-2 shadow-[0_0_8px_rgba(57,255,20,0.8)]"></span> Defense
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <BigPlayButton 
                stat="trySavers" 
                label="Try Saver" 
                points={IMPACT_WEIGHTS.trySavers} 
                colorClass="bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600 dark:bg-green-600 dark:border-neon-green dark:shadow-neon-green" 
              />
              <BigPlayButton 
                stat="oneOnOneStrips" 
                label="1-on-1 Strip" 
                points={IMPACT_WEIGHTS.oneOnOneStrips} 
                colorClass="bg-emerald-50 dark:bg-midnight-700/50 border-emerald-200 dark:border-green-900 text-emerald-700 dark:text-green-300 hover:bg-emerald-100 dark:hover:bg-midnight-700 hover:border-emerald-300 dark:hover:border-neon-green" 
              />
            </div>
          </div>

          {/* Negative Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center">
              <span className="w-2 h-2 bg-red-500 dark:bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Negative
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <BigPlayButton 
                stat="missedTackles" 
                label="Missed Tackle" 
                points={IMPACT_WEIGHTS.missedTackles} 
                colorClass="bg-red-50 dark:bg-midnight-700/50 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-midnight-700 hover:border-red-300 dark:hover:border-red-500" 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
