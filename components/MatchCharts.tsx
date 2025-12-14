
import React, { useState } from 'react';
import { Player, PlayerStats, GameLogEntry, StatKey } from '../types';
import { SocialShareCard } from './SocialShareCard';
import { PlayerRow } from './PlayerRow';
import { HeatmapView } from './HeatmapView';
import { INITIAL_STATS, STAT_CONFIGS } from '../constants';

interface MatchChartsProps {
  matchData: {
    players: Player[];
    leftScore: number;
    rightScore: number;
    possessionSeconds: number;
    matchTime: number;
    teamName: string;
    opponentName: string;
    gameLog?: GameLogEntry[];
  };
}

export const MatchCharts: React.FC<MatchChartsProps> = ({ matchData }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'heatmap' | 'matchLog' | 'playerStats' | 'playedTime' | 'social'>('analytics');
  
  const { 
    players, 
    leftScore, 
    rightScore, 
    possessionSeconds, 
    matchTime, 
    teamName, 
    opponentName,
    gameLog = [] 
  } = matchData;

  // --- POSSESSION CALC ---
  const attackPct = matchTime > 0 ? (possessionSeconds / matchTime) * 100 : 50;
  
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
  
  // Get Try Scorers for Social Card
  const tryScorers = [...players]
    .filter(p => p.stats.triesScored > 0)
    .sort((a, b) => b.stats.triesScored - a.stats.triesScored)
    .map(p => ({ name: p.name, tries: p.stats.triesScored }));

  // Helper for Bar Width
  const getBarWidth = (val: number, max: number) => {
    return max > 0 ? (val / max) * 100 : 0;
  };

  // --- PLAYED TIME SORTING ---
  const sortedByTime = [...players].sort((a, b) => (b.totalSecondsOnField || 0) - (a.totalSecondsOnField || 0));
  const maxTime = Math.max(...players.map(p => p.totalSecondsOnField || 0), 1); // Avoid div/0

  const formatPlayedTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // --- PLAYER STATS CALCS ---
  const teamTotals: PlayerStats = { ...INITIAL_STATS };
  const maxValues: PlayerStats = { ...INITIAL_STATS };
  const leaderCounts: PlayerStats = { ...INITIAL_STATS };

  players.forEach(p => {
     (Object.keys(INITIAL_STATS) as StatKey[]).forEach(key => {
        const val = p.stats[key];
        teamTotals[key] += val;
        if (val > maxValues[key]) {
           maxValues[key] = val;
           leaderCounts[key] = 1;
        } else if (val === maxValues[key] && val > 0) {
           leaderCounts[key]++;
        }
     });
  });

  // --- LOG HELPERS ---
  const sortedEvents = [...gameLog].sort((a, b) => b.timestamp - a.timestamp);
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'try':
        return <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">T</div>;
      case 'penalty':
        return <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">!</div>;
      case 'error':
        return <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold">E</div>;
      case 'yellow_card':
        return <div className="w-5 h-6 bg-yellow-400 rounded-sm shadow-sm"></div>;
      case 'red_card':
        return <div className="w-5 h-6 bg-red-600 rounded-sm shadow-sm"></div>;
      case 'substitution':
        return <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 flex items-center justify-center"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>;
      default: 
        return <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">K</div>;
    }
  };

  const getEventLabel = (event: GameLogEntry) => {
    switch (event.type) {
      case 'try': return 'Try Scored';
      case 'penalty': return 'Penalty Conceded';
      case 'error': return 'Error';
      case 'yellow_card': return 'Yellow Card';
      case 'red_card': return 'Red Card';
      case 'substitution': return event.reason || 'Substitution';
      default: return 'Kick / Conversion';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Tab Switcher */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-lg inline-flex flex-wrap justify-center gap-1">
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
          >
            Analytics
          </button>
          <button 
             onClick={() => setActiveTab('heatmap')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'heatmap' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
          >
            Heatmaps
          </button>
          <button 
             onClick={() => setActiveTab('matchLog')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'matchLog' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
          >
            Match Log
          </button>
          <button 
             onClick={() => setActiveTab('playerStats')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'playerStats' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
          >
            Player Stats
          </button>
          <button 
             onClick={() => setActiveTab('playedTime')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'playedTime' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
          >
            Played Time
          </button>
          <button 
             onClick={() => setActiveTab('social')}
             className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'social' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
          >
            Social Card
          </button>
        </div>
      </div>

      {activeTab === 'heatmap' && (
        <HeatmapView gameLog={gameLog} />
      )}

      {activeTab === 'matchLog' && (
         <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
             <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Full Match Log</h3>
             <div className="max-h-[500px] overflow-y-auto pr-2">
               {sortedEvents.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No events recorded for this match.</p>
               ) : (
                  <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-3 space-y-6 pl-6 py-2">
                    {sortedEvents.map((event) => (
                      <div key={event.id} className="relative flex items-start group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#1A1A1C]"></div>
                        
                        {/* Time */}
                        <div className="flex flex-col mr-4 min-w-[50px]">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{event.formattedTime}</span>
                          <span className="text-[10px] text-gray-400 font-medium uppercase">{event.period}</span>
                        </div>

                        {/* Icon */}
                        <div className="mr-3 mt-0.5">
                          {getEventIcon(event.type)}
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                            {getEventLabel(event)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold text-slate-700 dark:text-gray-300">#{event.playerNumber} {event.playerName}</span>
                            {event.location && <span className="ml-1">• {event.location}</span>}
                          </p>
                          {event.reason && event.type !== 'substitution' && (
                            <p className="text-[10px] text-gray-400 italic mt-0.5">"{event.reason}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
               )}
             </div>
         </div>
      )}

      {/* Other tabs remain unchanged in logic but included for context in this full file update */}
      {activeTab === 'playerStats' && (
         <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-1 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-track]:bg-transparent">
                 <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5 sticky top-0 z-20">
                       <tr>
                          <th className="p-3 text-left w-16 bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider pl-4">#</th>
                          <th className="p-3 text-left min-w-[160px] bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                          {Object.values(STAT_CONFIGS).map(cfg => (
                             <th key={cfg.key} className="p-3 text-center min-w-[90px] bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider">{cfg.label}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                       {players.map((p, i) => (
                          <PlayerRow 
                            key={p.id}
                            player={p}
                            isOdd={i % 2 !== 0}
                            onStatChange={() => {}}
                            onIdentityChange={() => {}}
                            onCardAction={() => {}}
                            onRemoveCard={() => {}}
                            onToggleFieldStatus={() => {}}
                            teamTotals={teamTotals}
                            maxValues={maxValues}
                            leaderCounts={leaderCounts}
                            isReadOnly={true}
                            hideControls={true}
                          />
                       ))}
                    </tbody>
                 </table>
            </div>
         </div>
      )}

      {activeTab === 'playedTime' && (
        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
             <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Played Time Breakdown</h3>
             <div className="space-y-4">
                {sortedByTime.map((p, i) => {
                  const pct = getBarWidth(p.totalSecondsOnField || 0, maxTime);
                  return (
                    <div key={p.id} className="relative">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center">
                          <span className="w-6 h-6 bg-gray-100 dark:bg-white/10 rounded text-xs flex items-center justify-center mr-3 text-gray-500 dark:text-gray-400 font-mono">#{p.number}</span>
                          {p.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatPlayedTime(p.totalSecondsOnField || 0)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
             </div>
        </div>
      )}

      {activeTab === 'social' && (
        <SocialShareCard 
          teamName={teamName}
          opponentName={opponentName}
          leftScore={leftScore}
          rightScore={rightScore}
          date={new Date().toLocaleDateString()}
          possession={Number(attackPct.toFixed(0))}
          scorers={tryScorers}
        />
      )}
      
      {activeTab === 'analytics' && (
        <>
        {/* 1. Score & Possession Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Possession Card */}
          <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 z-10">Possession</h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center z-10">
              {/* SVG Pie Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Circle (Defense/Opponent) */}
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-100 dark:stroke-red-900/30" strokeWidth="3.5" />
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
                <span className="text-3xl font-heading font-bold text-slate-900 dark:text-white">{attackPct.toFixed(0)}%</span>
                <span className="text-[10px] font-bold text-blue-500 uppercase mt-1">Attack</span>
              </div>
            </div>

            <div className="w-full flex justify-between mt-6 px-4 z-10">
               <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{teamName}</span>
               </div>
               <div className="flex items-center">
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{opponentName}</span>
                  <span className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/40 mr-2 ml-2"></span>
               </div>
            </div>
          </div>

          {/* Score Breakdown Card */}
          <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col relative overflow-hidden transition-colors">
             <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 z-10">Score Breakdown</h3>
             
             <div className="flex-1 flex flex-col justify-center space-y-8 z-10">
               {/* Team Score */}
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xl font-heading font-bold text-slate-900 dark:text-white">{teamName}</span>
                     <span className="text-3xl font-heading font-black text-blue-600 dark:text-blue-400">{leftScore}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-blue-500" 
                       style={{ width: `${(leftScore / (leftScore + rightScore || 1)) * 100}%` }} 
                     />
                  </div>
               </div>

               {/* Opponent Score */}
               <div>
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xl font-heading font-bold text-slate-900 dark:text-white">{opponentName}</span>
                     <span className="text-3xl font-heading font-black text-slate-400 dark:text-gray-600">{rightScore}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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
          <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 transition-colors">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Top Tacklers</h3>
            <div className="space-y-4">
              {topTacklers.length === 0 ? (
                 <p className="text-sm text-gray-400 dark:text-gray-600 italic">No tackle data yet.</p>
              ) : (
                 topTacklers.map((p, i) => (
                   <div key={p.id} className="relative">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center">
                         <span className="w-5 h-5 bg-gray-100 dark:bg-white/10 rounded text-[10px] flex items-center justify-center mr-2 text-gray-500 dark:text-gray-400">{i + 1}</span>
                         {p.name}
                       </span>
                       <span className="font-mono font-bold text-slate-900 dark:text-white">{p.stats.tackles}</span>
                     </div>
                     <div className="w-full h-2 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
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
          <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 transition-colors">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Top Ball Carriers</h3>
            <div className="space-y-4">
              {topCarriers.length === 0 ? (
                 <p className="text-sm text-gray-400 dark:text-gray-600 italic">No hit-up data yet.</p>
              ) : (
                 topCarriers.map((p, i) => (
                   <div key={p.id} className="relative">
                     <div className="flex justify-between text-sm mb-1">
                       <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center">
                         <span className="w-5 h-5 bg-gray-100 dark:bg-white/10 rounded text-[10px] flex items-center justify-center mr-2 text-gray-500 dark:text-gray-400">{i + 1}</span>
                         {p.name}
                       </span>
                       <span className="font-mono font-bold text-slate-900 dark:text-white">{p.stats.hitUps}</span>
                     </div>
                     <div className="w-full h-2 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
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
        </>
      )}
    </div>
  );
};
