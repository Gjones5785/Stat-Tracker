import React from 'react';
import { Player, StatKey } from '../types';

interface MobileActionOverlayProps {
  player: Player;
  onClose: () => void;
  onStatChange: (playerId: string, key: StatKey, delta: number) => void;
  onToggleField: (playerId: string) => void;
  onCardAction: (playerId: string, type: 'yellow' | 'red') => void;
  onBigPlay: (playerId: string) => void;
}

export const MobileActionOverlay: React.FC<MobileActionOverlayProps> = ({
  player,
  onClose,
  onStatChange,
  onToggleField,
  onCardAction,
  onBigPlay
}) => {
  if (!player) return null;

  const handleStat = (key: StatKey) => {
    onStatChange(player.id, key, 1);
    onClose();
  };

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  const isOff = !player.isOnField && player.cardStatus === 'none';

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full bg-[#F5F5F7] dark:bg-[#0F0F10] rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white dark:bg-[#1A1A1C] border-b border-gray-200 dark:border-white/5 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl flex items-center justify-center text-2xl font-jersey font-bold shadow-lg">
                 {player.number}
              </div>
              <div className="flex flex-col">
                 <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white leading-none">{player.name}</h2>
                 <span className={`text-xs font-bold uppercase tracking-wider mt-1 ${isOff ? 'text-gray-400' : 'text-green-500'}`}>
                    {isOff ? 'Currently Off Field' : 'On Field'}
                 </span>
              </div>
           </div>
           <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 dark:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Main Actions Grid */}
        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
           {/* DEFENSE */}
           <button onClick={() => handleStat('tackles')} className="h-24 bg-white dark:bg-[#1A1A1C] rounded-2xl border-b-4 border-emerald-500 active:border-b-0 active:translate-y-1 transition-all shadow-sm flex flex-col items-center justify-center group">
              <span className="text-3xl mb-1 group-active:scale-90 transition-transform">🛡️</span>
              <span className="font-heading font-black text-lg text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Tackle</span>
           </button>

           {/* ATTACK */}
           <button onClick={() => handleStat('hitUps')} className="h-24 bg-white dark:bg-[#1A1A1C] rounded-2xl border-b-4 border-blue-500 active:border-b-0 active:translate-y-1 transition-all shadow-sm flex flex-col items-center justify-center group">
              <span className="text-3xl mb-1 group-active:scale-90 transition-transform">🏃</span>
              <span className="font-heading font-black text-lg text-blue-600 dark:text-blue-400 uppercase tracking-widest">Run</span>
           </button>

           {/* ERROR (Negative) */}
           <button onClick={() => handleStat('errors')} className="h-24 bg-white dark:bg-[#1A1A1C] rounded-2xl border-b-4 border-orange-500 active:border-b-0 active:translate-y-1 transition-all shadow-sm flex flex-col items-center justify-center group">
              <span className="text-3xl mb-1 group-active:scale-90 transition-transform">👐</span>
              <span className="font-heading font-black text-lg text-orange-600 dark:text-orange-400 uppercase tracking-widest">Error</span>
           </button>

           {/* PENALTY (Negative) */}
           <button onClick={() => handleStat('penaltiesConceded')} className="h-24 bg-white dark:bg-[#1A1A1C] rounded-2xl border-b-4 border-red-500 active:border-b-0 active:translate-y-1 transition-all shadow-sm flex flex-col items-center justify-center group">
              <span className="text-3xl mb-1 group-active:scale-90 transition-transform">🛑</span>
              <span className="font-heading font-black text-lg text-red-600 dark:text-red-400 uppercase tracking-widest">Penalty</span>
           </button>
        </div>

        {/* Secondary Actions */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
           <button onClick={() => handleStat('triesScored')} className="h-16 bg-yellow-400 rounded-xl shadow-lg shadow-yellow-400/20 flex flex-col items-center justify-center active:scale-95 transition-transform text-yellow-900">
              <span className="font-black uppercase text-xs tracking-widest">Try</span>
              <span className="text-lg font-bold leading-none">+1</span>
           </button>
           <button onClick={() => handleStat('kicks')} className="h-16 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 flex flex-col items-center justify-center active:scale-95 transition-transform text-white">
              <span className="font-black uppercase text-xs tracking-widest">Kick</span>
              <span className="text-lg font-bold leading-none">+1</span>
           </button>
           <button onClick={() => handleAction(() => onBigPlay(player.id))} className="h-16 bg-slate-900 dark:bg-white rounded-xl shadow-lg flex flex-col items-center justify-center active:scale-95 transition-transform text-white dark:text-slate-900">
              <span className="font-black uppercase text-xs tracking-widest">Impact</span>
              <span className="text-lg leading-none">⚡</span>
           </button>
        </div>

        {/* Footer Management */}
        <div className="p-4 bg-gray-100 dark:bg-black/20 border-t border-gray-200 dark:border-white/5 grid grid-cols-4 gap-3 shrink-0">
           <button 
             onClick={() => handleAction(() => onToggleField(player.id))} 
             className={`col-span-2 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-sm transition-all ${
               player.isOnField 
                 ? 'bg-white dark:bg-midnight-800 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10' 
                 : 'bg-green-500 text-white shadow-green-500/20'
             }`}
           >
             {player.isOnField ? 'Substitute Off' : 'Sub On'}
           </button>
           
           <button onClick={() => handleAction(() => onCardAction(player.id, 'yellow'))} className="bg-yellow-400 text-yellow-900 rounded-xl font-bold flex items-center justify-center shadow-sm active:scale-95">
              <div className="w-3 h-4 border-2 border-yellow-600 rounded-[2px] bg-yellow-300"></div>
           </button>
           <button onClick={() => handleAction(() => onCardAction(player.id, 'red'))} className="bg-red-600 text-white rounded-xl font-bold flex items-center justify-center shadow-sm active:scale-95">
              <div className="w-3 h-4 border-2 border-red-800 rounded-[2px] bg-red-500"></div>
           </button>
        </div>
      </div>
    </div>
  );
};