
import React, { useMemo } from 'react';
import { Player, PlayerStats } from '../types';

interface MatchChartsProps {
  matchData: {
    players: Player[];
    leftScore: number;
    rightScore: number;
    possessionSeconds: number;
    matchTime: number;
    teamName: string;
    opponentName: string;
  };
}

export const MatchCharts: React.FC<MatchChartsProps> = ({ matchData }) => {
  const { 
    players, 
    leftScore, 
    rightScore, 
    possessionSeconds, 
    matchTime, 
    teamName, 
    opponentName 
  } = matchData;

  // --- POSSESSION CALC ---
  const attackPct = matchTime > 0 ? (possessionSeconds / matchTime) * 100 : 50;
  const defensePct = 100 - attackPct;

  // Circle Math for Pie Chart
  const radius = 16;
  const circumference = 2 * Math.PI * radius; // ~100.53
  const attackDash = (attackPct / 100) * circumference;

  // --- STATS RANKING ---
  const getTopPlayers = (key: keyof PlayerStats) => {
    return [...players]
      .sort((a, b) => (b.stats[key] || 0) - (a.stats[key] || 0))
      .slice(0, 5)
      .filter(p => p.stats[key] > 0);
  };

  const topTacklers = getTopPlayers('tackles');
  const topCarriers = getTopPlayers('hitUps');

  // Helper for Bar Width
  const getBarWidth = (val: number, max: number) => {
    return max > 0 ? (val / max) * 100 : 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* 1. Score & Possession Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Possession Card */}
        <div className="bg-white rounded-3xl p-6 shadow-apple border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 z-10">Possession</h3>
          
          <div className="relative w-48 h-48 flex items-center justify-center z-10">
            {/* SVG Pie Chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background Circle (Defense/Opponent) */}
              <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-100" strokeWidth="3.5" />
              {/* Foreground Circle (Attack/Team) */}
              <circle 
                cx="18" 
                cy="18" 
                r="16" 
                fill="none" 
                className="stroke-blue-500 transition-all duration-1000 ease-out" 
                strokeWidth="3.5" 
                strokeDasharray={`${attackDash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-heading font-bold text-slate-900">{attackPct.toFixed(0)}%</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase mt-1">Attack</span>
            </div>
          </div>

          <div className="w-full flex justify-between mt-6 px-4 z-10">
             <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-xs font-bold text-slate-700">{teamName}</span>
             </div>
             <div className="flex items-center">
                <span className="text-xs font-bold text-slate-700">{opponentName}</span>
                <span className="w-3 h-3 rounded-full bg-red-100 mr-2 ml-2"></span>
             </div>
          </div>
        </div>

        {/* Score Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 shadow-apple border border-gray-100 flex flex-col relative overflow-hidden">
           <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 z-10">Score Breakdown</h3>
           
           <div className="flex-1 flex flex-col justify-center space-y-8 z-10">
             {/* Team Score */}
             <div>
                <div className="flex justify-between items-end mb-2">
                   <span className="text-xl font-heading font-bold text-slate-900">{teamName}</span>
                   <span className="text-3xl font-heading font-black text-blue-600">{leftScore}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-blue-500" 
                     style={{ width: `${(leftScore / (leftScore + rightScore || 1)) * 100}%` }} 
                   />
                </div>
             </div>

             {/* Opponent Score */}
             <div>
                <div className="flex justify-between items-end mb-2">
                   <span className="text-xl font-heading font-bold text-slate-900">{opponentName}</span>
                   <span className="text-3xl font-heading font-black text-slate-400">{rightScore}</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-red-400" 
                     style={{ width: `${(rightScore / (leftScore + rightScore || 1)) * 100}%` }} 
                   />
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* 2. Top Performers Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top Tacklers */}
        <div className="bg-white rounded-3xl p-6 shadow-apple border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Top Tacklers</h3>
          <div className="space-y-4">
            {topTacklers.length === 0 ? (
               <p className="text-sm text-gray-400 italic">No tackle data yet.</p>
            ) : (
               topTacklers.map((p, i) => (
                 <div key={p.id} className="relative">
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-slate-700 flex items-center">
                       <span className="w-5 h-5 bg-gray-100 rounded text-[10px] flex items-center justify-center mr-2 text-gray-500">{i + 1}</span>
                       {p.name}
                     </span>
                     <span className="font-mono font-bold text-slate-900">{p.stats.tackles}</span>
                   </div>
                   <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-emerald-400 rounded-full" 
                       style={{ width: `${getBarWidth(p.stats.tackles, topTacklers[0].stats.tackles)}%` }}
                     />
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>

        {/* Top Hit-ups */}
        <div className="bg-white rounded-3xl p-6 shadow-apple border border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Top Ball Carriers</h3>
          <div className="space-y-4">
            {topCarriers.length === 0 ? (
               <p className="text-sm text-gray-400 italic">No hit-up data yet.</p>
            ) : (
               topCarriers.map((p, i) => (
                 <div key={p.id} className="relative">
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-slate-700 flex items-center">
                       <span className="w-5 h-5 bg-gray-100 rounded text-[10px] flex items-center justify-center mr-2 text-gray-500">{i + 1}</span>
                       {p.name}
                     </span>
                     <span className="font-mono font-bold text-slate-900">{p.stats.hitUps}</span>
                   </div>
                   <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-amber-400 rounded-full" 
                       style={{ width: `${getBarWidth(p.stats.hitUps, topCarriers[0].stats.hitUps)}%` }}
                     />
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
