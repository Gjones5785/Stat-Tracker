import React, { useState, useMemo, useEffect } from 'react';
import { Player, PlayerStats, GameLogEntry, StatKey, MatchHistoryItem } from '../types';
import { SocialShareCard } from './SocialShareCard';
import { PlayerRow } from './PlayerRow';
import { HeatmapView } from './HeatmapView';
import { INITIAL_STATS, STAT_CONFIGS, IMPACT_WEIGHTS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { Button } from './Button';

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
    voting?: {
      threePointsId: string;
      twoPointsId: string;
      onePointId: string;
    };
    date?: string;
    completedSets?: number;
    totalSets?: number;
  };
}

export const MatchCharts: React.FC<MatchChartsProps> = ({ matchData }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'heatmap' | 'matchLog' | 'playerStats' | 'playedTime' | 'social'>('analytics');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintPending, setIsPrintPending] = useState(false);
  const [strategicSummary, setStrategicSummary] = useState<string | null>(null);
  
  const { 
    players, 
    leftScore, 
    rightScore, 
    matchTime, 
    teamName, 
    opponentName,
    gameLog = [],
    voting,
    date,
    completedSets = 0,
    totalSets = 0
  } = matchData;

  // Trigger print once the summary is ready and state updated
  useEffect(() => {
    if (isPrintPending && strategicSummary) {
      window.print();
      setIsPrintPending(false);
      setIsExporting(false);
    }
  }, [isPrintPending, strategicSummary]);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'number', 
    direction: 'asc' 
  });

  // --- POSSESSION CALC BASED ON SET COMPLETION ---
  const completionPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const completionDash = (completionPct / 100) * circumference;

  // --- STATS RANKING ---
  const getTopPlayers = (key: keyof PlayerStats) => {
    return [...players]
      .sort((a, b) => (b.stats[key] || 0) - (a.stats[key] || 0))
      .slice(0, 5)
      .filter(p => p.stats[key] > 0);
  };

  const topTacklers = getTopPlayers('tackles');
  const topCarriers = getTopPlayers('hitUps');
  
  const tryScorers = [...players]
    .filter(p => p.stats.triesScored > 0)
    .sort((a, b) => b.stats.triesScored - a.stats.triesScored)
    .map(p => ({ name: p.name, tries: p.stats.triesScored }));

  const getBarWidth = (val: number, max: number) => max > 0 ? (val / max) * 100 : 0;

  const sortedByTime = [...players].sort((a, b) => (b.totalSecondsOnField || 0) - (a.totalSecondsOnField || 0));
  const maxTime = Math.max(...players.map(p => p.totalSecondsOnField || 0), 1);

  const formatPlayedTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

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

  const sortedEvents = [...gameLog].sort((a, b) => b.timestamp - a.timestamp);
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'try': return <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">T</div>;
      case 'penalty': return <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>;
      case 'error': return <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">E</div>;
      case 'yellow_card': return <div className="w-5 h-6 bg-yellow-400 rounded-sm shadow-sm"></div>;
      case 'red_card': return <div className="w-5 h-6 bg-red-600 rounded-sm shadow-sm"></div>;
      case 'substitution': return <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">S</div>;
      case 'big_play': return <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-[10px] font-bold">⚡</div>;
      default: return <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">K</div>;
    }
  };

  const calculateImpactScore = (player: Player) => {
    const { stats, cardStatus } = player;
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

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      if (key === 'number' || key === 'name') return { key, direction: 'asc' };
      return { key, direction: 'desc' };
    });
  };

  const sortedPlayers = useMemo(() => {
    const data = [...players];
    return data.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: number | string = 0;
      let valB: number | string = 0;
      switch(key) {
        case 'number': valA = parseInt(a.number) || 0; valB = parseInt(b.number) || 0; break;
        case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case 'impact': valA = calculateImpactScore(a); valB = calculateImpactScore(b); break;
        default: valA = a.stats[key as keyof PlayerStats] || 0; valB = b.stats[key as keyof PlayerStats] || 0;
      }
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [players, sortConfig]);

  const handleExportGamePack = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this rugby league match and write a professional 3-paragraph coaching summary.
      Match: ${teamName} (${leftScore}) vs ${opponentName} (${rightScore}).
      Team Stats: Tackles: ${teamTotals.tackles}, Hit-ups: ${teamTotals.hitUps}, Errors: ${teamTotals.errors}, Penalties: ${teamTotals.penaltiesConceded}.
      Completion Rate: ${completionPct.toFixed(0)}% (${completedSets}/${totalSets} sets).
      Winner: ${leftScore > rightScore ? teamName : rightScore > leftScore ? opponentName : 'Draw'}.
      
      Requirements:
      P1: Summary of game flow and outcome.
      P2: Highlight individual performance benchmarks (Impact Scores and key defensive work).
      P3: Actionable tactical takeaway for the next training session based on stats.
      Tone: Professional, expert, and encouraging. Under 250 words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setStrategicSummary(response.text || "Report generated without AI summary.");
      setIsPrintPending(true);

    } catch (error) {
      console.error("Export failed:", error);
      setStrategicSummary("Summary generation unavailable due to network error. Standard report follows.");
      setIsPrintPending(true);
    }
  };

  const getVotedPlayerName = (id: string) => {
    const p = players.find(player => player.id === id);
    return p ? p.name : 'Unassigned';
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Styles for Printing */}
      <style>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { background: white !important; color: black !important; font-size: 10pt; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-break { page-break-before: always; }
          .print-card { border: 1px solid #eee !important; box-shadow: none !important; padding: 15px; margin-bottom: 20px; }
          .print-header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
          #root { display: block !important; }
          main { overflow: visible !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border-bottom: 1px solid #ddd !important; padding: 6px !important; text-align: left !important; }
          tr { page-break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>
      
      {/* EXPORT OVERLAY */}
      {isExporting && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white no-print">
           <div className="w-16 h-16 border-4 border-white/20 border-t-brand rounded-full animate-spin mb-6"></div>
           <h2 className="text-2xl font-heading font-black uppercase tracking-widest">Compiling Pack</h2>
           <p className="text-gray-400 mt-2 font-medium">Gemini is processing performance metrics...</p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="shrink-0 flex items-center justify-between py-6 px-6 no-print">
        <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-lg inline-flex flex-wrap justify-center gap-1">
          {['analytics', 'heatmap', 'matchLog', 'playerStats', 'playedTime', 'social'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === tab ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('Stats', ' Stats').replace('Time', ' Time').replace('Log', ' Log')}
            </button>
          ))}
        </div>
        <Button 
          onClick={handleExportGamePack}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export Game Pack
        </Button>
      </div>

      {/* PRINT CONTENT (Visible only during print) */}
      <div className="print-only p-4 text-slate-900">
         <div className="print-header flex justify-between items-end">
            <div>
               <h1 className="text-4xl font-heading font-black uppercase tracking-tight">Performance Report</h1>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">{date || 'Match Date Placeholder'}</p>
            </div>
            <div className="text-right">
               <h2 className="text-2xl font-heading font-black text-brand uppercase">{teamName} vs {opponentName}</h2>
               <p className="text-xl font-jersey font-medium tracking-widest">Score: {leftScore} - {rightScore}</p>
            </div>
         </div>

         {strategicSummary && (
            <div className="mb-8 p-6 bg-slate-50 border-l-4 border-slate-900 rounded-r-xl">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">AI Strategic Breakdown</h3>
               <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
                  {strategicSummary}
               </div>
            </div>
         )}

         <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="print-card bg-slate-50 rounded-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Team Match Totals</h3>
               <div className="grid grid-cols-2 gap-y-4">
                  <div><span className="block text-[8px] font-bold text-gray-400 uppercase">Tackles</span><span className="text-2xl font-black">{teamTotals.tackles}</span></div>
                  <div><span className="block text-[8px] font-bold text-gray-400 uppercase">Hit-Ups</span><span className="text-2xl font-black">{teamTotals.hitUps}</span></div>
                  <div><span className="block text-[8px] font-bold text-gray-400 uppercase">Completion</span><span className="text-2xl font-black">{completionPct.toFixed(0)}%</span></div>
                  <div><span className="block text-[8px] font-bold text-gray-400 uppercase">Penalties</span><span className="text-2xl font-black">{teamTotals.penaltiesConceded}</span></div>
               </div>
            </div>
            
            <div className="print-card bg-yellow-50 rounded-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-4">3-2-1 POTM Results</h3>
               {voting ? (
                 <div className="space-y-3">
                   <div className="flex justify-between items-center pb-2 border-b border-yellow-100"><span className="text-xs font-bold uppercase tracking-tight">3 Points</span><span className="text-sm font-black uppercase">{getVotedPlayerName(voting.threePointsId)}</span></div>
                   <div className="flex justify-between items-center pb-2 border-b border-yellow-100"><span className="text-xs font-bold uppercase tracking-tight">2 Points</span><span className="text-sm font-black uppercase">{getVotedPlayerName(voting.twoPointsId)}</span></div>
                   <div className="flex justify-between items-center"><span className="text-xs font-bold uppercase tracking-tight">1 Point</span><span className="text-sm font-black uppercase">{getVotedPlayerName(voting.onePointId)}</span></div>
                 </div>
               ) : (
                 <p className="text-xs text-gray-400 italic">Voting data unavailable for this match.</p>
               )}
            </div>
         </div>

         <div className="page-break pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">Full Player Statistics</h3>
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-100">
                     <th className="text-[9px] uppercase">#</th>
                     <th className="text-[9px] uppercase">Player Name</th>
                     {STAT_CONFIGS.map(cfg => <th key={cfg.key} className="text-[9px] uppercase text-center">{cfg.label}</th>)}
                     <th className="text-[9px] uppercase text-center">Impact</th>
                  </tr>
               </thead>
               <tbody>
                  {sortedPlayers.map(p => (
                     <tr key={p.id}>
                        <td className="font-bold">{p.number}</td>
                        <td className="font-black uppercase">{p.name || 'Unknown'}</td>
                        {STAT_CONFIGS.map(cfg => <td key={cfg.key} className="text-center font-mono">{p.stats[cfg.key]}</td>)}
                        <td className="text-center font-black text-brand">{calculateImpactScore(p)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* SCREEN CONTENT */}
      <div className="flex-1 overflow-hidden relative no-print">
        {activeTab === 'heatmap' && (
          <div className="h-full overflow-y-auto px-6 pb-12 custom-scrollbar">
            <HeatmapView gameLog={gameLog} />
          </div>
        )}

        {activeTab === 'matchLog' && (
           <div className="h-full overflow-y-auto px-6 pb-12 custom-scrollbar">
             <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
                 <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Match Timeline</h3>
                 <div className="pr-2">
                   {sortedEvents.length === 0 ? (
                      <p className="text-center text-gray-400 py-8">No specific events logged.</p>
                   ) : (
                      <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-3 space-y-6 pl-6 py-2">
                        {sortedEvents.map((event) => (
                          <div key={event.id} className="relative flex items-start group">
                            <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#1A1A1C]"></div>
                            <div className="flex flex-col mr-4 min-w-[50px]">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{event.formattedTime}</span>
                              <span className="text-[10px] text-gray-400 font-medium uppercase">{event.period}</span>
                            </div>
                            <div className="mr-3 mt-0.5">{getEventIcon(event.type)}</div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                                {event.type === 'try' ? 'Try Scored' : event.type === 'penalty' ? 'Penalty' : event.type === 'error' ? 'Error' : event.type === 'big_play' ? 'Impact Play' : event.reason || 'Event'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-slate-700 dark:text-gray-300">#{event.playerNumber} {event.playerName}</span>
                                {event.location && <span className="ml-1">• {event.location}</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                   )}
                 </div>
             </div>
           </div>
        )}

        {activeTab === 'playerStats' && (
           <div className="h-full w-full overflow-auto px-6 pb-12 custom-scrollbar">
             <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-1 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 inline-block min-w-full align-middle">
                  <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                         <tr>
                            <th className="p-3 text-left w-16 bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider pl-4 cursor-pointer hover:bg-gray-100 transition-colors sticky top-0 z-20" onClick={() => handleSort('number')}>
                              <div className="flex items-center space-x-1"><span>#</span>{sortConfig.key === 'number' && <span className="text-red-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div>
                            </th>
                            <th className="p-3 text-left min-w-[160px] bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors sticky top-0 z-20" onClick={() => handleSort('name')}>
                              <div className="flex items-center space-x-1"><span>Player</span>{sortConfig.key === 'name' && <span className="text-red-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div>
                            </th>
                            {Object.values(STAT_CONFIGS).map(cfg => (
                               <th key={cfg.key} className="p-3 text-center min-w-[90px] bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors sticky top-0 z-20" onClick={() => handleSort(cfg.key)}>
                                  <div className="flex items-center justify-center space-x-1"><span>{cfg.label}</span>{sortConfig.key === cfg.key && <span className="text-red-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div>
                               </th>
                            ))}
                            <th className="p-3 text-center min-w-[100px] bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider border-l border-gray-200 dark:border-white/5 cursor-pointer hover:bg-gray-100 transition-colors sticky top-0 z-20" onClick={() => handleSort('impact')}>
                              <div className="flex items-center justify-center space-x-1"><span>Impact</span>{sortConfig.key === 'impact' && <span className="text-red-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}</div>
                            </th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                         {sortedPlayers.map((p, i) => (
                            <PlayerRow 
                              key={p.id} player={p} isOdd={i % 2 !== 0} onStatChange={() => {}} onIdentityChange={() => {}} onCardAction={() => {}} onRemoveCard={() => {}} onToggleFieldStatus={() => {}} onOpenBigPlay={() => {}} teamTotals={teamTotals} maxValues={maxValues} leaderCounts={leaderCounts} isReadOnly={true} hideControls={true}
                            />
                         ))}
                      </tbody>
                   </table>
             </div>
           </div>
        )}

        {activeTab === 'social' && (
          <div className="h-full overflow-y-auto px-6 pb-12 custom-scrollbar">
            <SocialShareCard teamName={teamName} opponentName={opponentName} leftScore={leftScore} rightScore={rightScore} date={date || new Date().toLocaleDateString()} possession={Number(completionPct.toFixed(0))} scorers={tryScorers} />
          </div>
        )}

        {activeTab === 'playedTime' && (
          <div className="h-full overflow-y-auto px-6 pb-12 space-y-4 custom-scrollbar">
            <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Total Minutes Played</h3>
              <div className="space-y-4">
                {sortedByTime.map(p => (
                  <div key={p.id} className="flex items-center group">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-xs font-black mr-4 border border-gray-100 dark:border-white/5">#{p.number}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold truncate text-slate-900 dark:text-white">{p.name}</span>
                        <span className="text-xs font-mono font-bold text-slate-400">{formatPlayedTime(p.totalSecondsOnField)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 dark:bg-white transition-all duration-1000" style={{ width: `${(p.totalSecondsOnField / maxTime) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="h-full overflow-y-auto px-6 pb-12 space-y-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 z-10">Possession (Set Completion)</h3>
                <div className="relative w-48 h-48 flex items-center justify-center z-10">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-red-100 dark:stroke-red-900/30" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-500 transition-all duration-1000 ease-out" strokeWidth="3.5" strokeDasharray={`${completionDash} ${circumference}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-heading font-bold text-slate-900 dark:text-white">{completionPct.toFixed(0)}%</span>
                    <span className="text-[10px] font-bold text-blue-500 uppercase mt-1">Efficiency</span>
                  </div>
                </div>
                <div className="w-full flex justify-between mt-6 px-4 z-10">
                   <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Completed: {completedSets}</span>
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                   </div>
                   <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Total: {totalSets}</span>
                      <div className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/40 mt-1 ml-2"></div>
                   </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col relative overflow-hidden transition-colors">
                 <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 z-10">Score Breakdown</h3>
                 <div className="flex-1 flex flex-col justify-center space-y-8 z-10">
                   <div>
                      <div className="flex justify-between items-end mb-2"><span className="text-xl font-heading font-bold text-slate-900 dark:text-white">{teamName}</span><span className="text-3xl font-heading font-black text-blue-600 dark:text-blue-400">{leftScore}</span></div>
                      <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(leftScore / (leftScore + rightScore || 1)) * 100}%` }} /></div>
                   </div>
                   <div>
                      <div className="flex justify-between items-end mb-2"><span className="text-xl font-heading font-bold text-slate-900 dark:text-white">{opponentName}</span><span className="text-3xl font-heading font-black text-slate-400 dark:text-gray-600">{rightScore}</span></div>
                      <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-red-400" style={{ width: `${(rightScore / (leftScore + rightScore || 1)) * 100}%` }} /></div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Top Tacklers</h3>
                <div className="space-y-3">
                  {topTacklers.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-xs italic">No data</p>
                  ) : (
                    topTacklers.map(p => (
                      <div key={p.id} className="flex items-center">
                        <span className="w-8 text-xs font-bold text-gray-400">#{p.number}</span>
                        <span className="flex-1 text-sm font-bold truncate text-slate-900 dark:text-white">{p.name}</span>
                        <div className="flex-1 px-4">
                          <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getBarWidth(p.stats.tackles, topTacklers[0].stats.tackles)}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{p.stats.tackles}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Top Carriers</h3>
                <div className="space-y-3">
                  {topCarriers.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-xs italic">No data</p>
                  ) : (
                    topCarriers.map(p => (
                      <div key={p.id} className="flex items-center">
                        <span className="w-8 text-xs font-bold text-gray-400">#{p.number}</span>
                        <span className="flex-1 text-sm font-bold truncate text-slate-900 dark:text-white">{p.name}</span>
                        <div className="flex-1 px-4">
                          <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getBarWidth(p.stats.hitUps, topCarriers[0].stats.hitUps)}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{p.stats.hitUps}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};