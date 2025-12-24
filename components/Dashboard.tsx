import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { MatchHistoryItem, SquadPlayer, TrainingSession, PlaybookItem, GameLogEntry, Player } from '../types';
import { SquadStatsView } from './SquadStatsView';
import { TrainingView } from './TrainingView';
import { MatchPlanner } from './MatchPlanner';
import { LeagueHubView } from './LeagueHubView';
import { ConfirmationModal } from './ConfirmationModal';

// --- HELPER: DATE FORMATTER ---
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y.substring(2)}`;
};

// --- HELPER: SPARKLINE GENERATOR ---
const MatchTrendSparkline: React.FC<{ log: GameLogEntry[]; duration: number; color: string }> = ({ log, duration, color }) => {
  const pathData = useMemo(() => {
    if (!log || log.length === 0 || !duration) return null;
    const sorted = [...log].sort((a, b) => a.timestamp - b.timestamp);
    let cumulative = 0;
    const points = [{ x: 0, y: 0 }];
    
    sorted.forEach(entry => {
      let impact = entry.impactValue || 0;
      if (entry.type === 'try') impact += 8;
      if (entry.type === 'penalty') impact -= 5;
      if (entry.type === 'error') impact -= 4;
      
      cumulative += impact;
      points.push({ x: (entry.timestamp / duration) * 100, y: cumulative });
    });

    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const range = Math.max(maxY - minY, 1);

    return points.map(p => `${p.x},${32 - ((p.y - minY) / range) * 28}`).join(' ');
  }, [log, duration]);

  if (!pathData) return <div className="w-16 h-8 bg-gray-100 dark:bg-white/5 rounded-md opacity-30 flex items-center justify-center text-[8px] font-bold text-gray-400 uppercase tracking-tighter">No Data</div>;

  return (
    <div className="w-16 h-8 relative group/spark">
      <svg viewBox="0 0 100 32" className="w-full h-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pathData}
          className="drop-shadow-sm opacity-80"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 dark:from-black/20 to-transparent opacity-0 group-hover/spark:opacity-100 transition-opacity rounded-md pointer-events-none"></div>
    </div>
  );
};

interface DashboardProps {
  currentUser: string;
  hasActiveMatch: boolean;
  history: MatchHistoryItem[];
  squad: SquadPlayer[];
  onNewMatch: () => void;
  onResumeMatch: () => void;
  onDiscardActiveMatch: () => void;
  onViewMatch: (match: MatchHistoryItem) => void;
  onDeleteMatch: (id: string) => void;
  onEditMatchVotes: (match: MatchHistoryItem) => void;
  onLogout: () => void;
  onAddSquadPlayer: (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => void;
  onRemoveSquadPlayer: (id: string) => void;
  onUpdateSquadPlayer: (id: string, updates: Partial<SquadPlayer>) => void;
  onOpenDrawer: () => void;
  showBadge: boolean;
  pendingActionsCount: number;
  onOpenSettings: () => void;
  trainingHistory: TrainingSession[];
  onSaveTrainingSession: (session: Omit<TrainingSession, 'id'>) => void;
  onUpdateTrainingSession: (id: string, updates: Partial<TrainingSession>) => void;
  /* Fixed Error: removed duplicate onUpdateSquadPlayer from DashboardProps */
  onDeleteTrainingSession: (id: string) => void;
  playbook: PlaybookItem[];
  onAddPlaybookItem: (item: Omit<PlaybookItem, 'id'>) => void;
  onDeletePlaybookItem: (id: string) => void;
  clubName: string;
  onUpdateClubName: (name: string) => void;
  logo: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  hasActiveMatch,
  history,
  squad,
  onNewMatch,
  onResumeMatch,
  onDiscardActiveMatch,
  onViewMatch,
  onDeleteMatch,
  onEditMatchVotes,
  onLogout,
  onAddSquadPlayer,
  onRemoveSquadPlayer,
  onUpdateSquadPlayer,
  onOpenDrawer,
  showBadge,
  pendingActionsCount,
  onOpenSettings,
  trainingHistory,
  onSaveTrainingSession,
  onUpdateTrainingSession,
  /* Fixed Error: removed duplicate onUpdateSquadPlayer from Dashboard destructuring */
  onDeleteTrainingSession,
  playbook,
  onAddPlaybookItem,
  onDeletePlaybookItem,
  clubName,
  onUpdateClubName,
  logo
}) => {
  const [currentTab, setCurrentTab] = useState<'matches' | 'squad' | 'training' | 'planner' | 'hub'>('matches');
  const [openMenuMatchId, setOpenMenuMatchId] = useState<string | null>(null);
  
  const activeSquad = useMemo(() => squad.filter(p => p.active !== false), [squad]);

  const statsSummary = useMemo(() => {
    const wins = history.filter(m => m.result === 'win').length;
    const losses = history.filter(m => m.result === 'loss').length;
    const draws = history.filter(m => m.result === 'draw').length;
    return { wins, losses, draws, total: history.length };
  }, [history]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteMatchId(id);
    setIsDeleteModalOpen(true);
    setOpenMenuMatchId(null);
  };

  const confirmDelete = async () => {
    if (deleteMatchId) {
      try { await onDeleteMatch(deleteMatchId); } 
      catch (error) { console.error("Failed to delete match:", error); }
      setDeleteMatchId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const getPotmName = (match: MatchHistoryItem) => {
    if (!match.voting?.threePointsId) return null;
    const matchPlayers: Player[] = match.data?.players || [];
    const winner = matchPlayers.find(p => p.id === match.voting?.threePointsId);
    return winner ? winner.name : null;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F0F10] flex flex-col font-sans transition-colors duration-300">
      <header className="bg-white/80 dark:bg-[#1A1A1C]/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/50 dark:border-white/5 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#1A1A1C]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 shrink-0 pr-4">
             {logo ? (
               <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm bg-white border border-gray-100 dark:border-transparent dark:bg-white" />
             ) : (
               <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
               </div>
             )}
             <h1 className="font-heading font-bold text-xl tracking-tight text-slate-900 dark:text-white hidden md:inline">LeagueLens<span className="text-brand">.</span></h1>
          </div>

          <div className="flex-1 flex flex-col items-center px-2 min-w-0">
            <input 
              type="text" 
              value={clubName} 
              onChange={(e) => onUpdateClubName(e.target.value)} 
              placeholder="ENTER TEAM NAME" 
              className="bg-transparent text-center font-heading font-bold text-xl text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none uppercase tracking-wider w-full max-w-[300px] truncate"
            />
            <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-0.5">Coach: {currentUser}</span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3 shrink-0 justify-end pl-4">
             <button 
                onClick={onOpenDrawer}
                className="relative w-11 h-11 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-slate-800"
                title="Coach's Clipboard"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
                {showBadge && (
                   <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-brand border-2 border-white text-[10px] font-black items-center justify-center text-white">{pendingActionsCount}</span>
                   </span>
                )}
             </button>

             <button 
               onClick={onOpenSettings} 
               className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all"
               title="App Settings"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
             </button>
             
             <div className="h-6 w-px bg-gray-200 dark:bg-white/10 hidden sm:block mx-1"></div>
             <button onClick={onLogout} className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/20 dark:text-red-400 w-11 h-11 sm:w-auto sm:px-4 sm:py-2 rounded-full flex items-center justify-center">
               <span className="hidden sm:inline">Log Out</span>
               <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-10">
          <div className="bg-gray-200/50 dark:bg-white/5 p-1 rounded-full inline-flex relative flex-wrap justify-center overflow-x-auto max-w-full">
            {['matches', 'squad', 'training', 'planner', 'hub'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setCurrentTab(tab as any)}
                className={`relative z-10 px-5 sm:px-6 py-2 rounded-full text-sm font-heading font-semibold transition-all duration-300 capitalize whitespace-nowrap ${
                  currentTab === tab 
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'matches' ? 'Matches' : tab === 'squad' ? 'Squad' : tab === 'training' ? 'Training' : tab === 'planner' ? 'Planner' : 'Hub'}
              </button>
            ))}
          </div>
        </div>

        {currentTab === 'matches' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="group bg-white dark:bg-[#1A1A1C] rounded-3xl p-8 shadow-apple dark:shadow-none hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-white dark:border-white/5 hover:scale-[1.01]" onClick={onNewMatch}>
                <div className="flex items-start justify-between mb-8">
                   <div className="w-14 h-14 bg-brand/5 dark:bg-brand/10 text-brand rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></div>
                   <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors text-gray-400 dark:text-gray-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></div>
                </div>
                <div><h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">New Match</h2><p className="text-slate-500 dark:text-gray-400 font-medium">Start a blank session.</p></div>
              </div>

              {hasActiveMatch ? (
                 <div className="group bg-white dark:bg-[#1A1A1C] rounded-3xl p-8 shadow-apple dark:shadow-none hover:shadow-apple-hover transition-all duration-300 cursor-pointer border-2 border-green-500/10 dark:border-green-500/20 hover:border-green-500/30 hover:scale-[1.01] relative overflow-hidden" onClick={onResumeMatch}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                   <div className="flex items-start justify-between mb-8 relative z-10"><div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg></div><span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Live</span></div>
                   <div className="relative z-10"><h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">Resume</h2><p className="text-slate-500 dark:text-gray-400 font-medium">Continue active game.</p></div>
                   <button onClick={(e) => { e.stopPropagation(); onDiscardActiveMatch(); }} className="absolute bottom-6 right-6 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors z-30 group-hover:opacity-100" title="Discard active match"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span>Discard</span></button>
                 </div>
              ) : (
                <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-apple dark:shadow-none flex flex-col justify-center animate-in fade-in duration-500">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Season Summary</h3>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">{statsSummary.total} Total Games</span>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
                         <span className="block text-3xl font-heading font-black text-green-600 dark:text-green-400">{statsSummary.wins}</span>
                         <span className="text-[10px] font-bold text-green-700/60 dark:text-green-400/60 uppercase tracking-wide">Wins</span>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
                         <span className="block text-3xl font-heading font-black text-red-600 dark:text-red-400">{statsSummary.losses}</span>
                         <span className="text-[10px] font-bold text-green-700/60 dark:text-green-400/60 uppercase tracking-wide">Losses</span>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-center">
                         <span className="block text-3xl font-heading font-black text-orange-600 dark:text-orange-400">{statsSummary.draws}</span>
                         <span className="text-[10px] font-bold text-orange-700/60 dark:text-green-400/60 uppercase tracking-wide">Draws</span>
                      </div>
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center">Match History<span className="ml-3 bg-gray-200 dark:bg-white/10 text-slate-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">{history.length}</span></h3>
              {history.length === 0 ? (
                <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-apple dark:shadow-none p-12 text-center"><p className="text-gray-400 dark:text-gray-500 font-medium">No completed matches yet.</p></div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {history.map((match) => {
                    const potmName = getPotmName(match);
                    const isMenuOpen = openMenuMatchId === match.id;
                    const formattedDate = formatDisplayDate(match.date);
                    
                    return (
                      <div key={match.id} className="group bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-apple dark:shadow-none hover:shadow-apple-hover transition-all flex items-center border border-transparent hover:border-gray-100 dark:hover:border-white/5 h-24">
                        <div className={`w-1.5 self-stretch ${match.result === 'win' ? 'bg-green-500' : match.result === 'loss' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                        
                        <div className="flex-1 px-6 flex items-center justify-between min-w-0 h-full">
                          
                          <div className="w-24 shrink-0 hidden sm:flex flex-col justify-center items-start leading-none pr-4 border-r border-gray-100 dark:border-white/5 h-12">
                             <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">{formattedDate}</span>
                             <div className={`mt-2 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase inline-block whitespace-nowrap ${match.result === 'win' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : match.result === 'loss' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : match.result === 'draw' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>{match.result}</div>
                          </div>

                          <div className="flex-1 flex items-center justify-center min-w-0 px-2 sm:px-6 h-full cursor-pointer" onClick={() => onViewMatch(match)}>
                             <div className="flex-1 flex flex-col items-end min-w-0 pr-4">
                                <h4 className="text-xs sm:text-base font-heading font-black text-slate-900 dark:text-white truncate uppercase tracking-tight w-full text-right leading-none">{match.teamName || 'Team'}</h4>
                             </div>

                             <div className="shrink-0 flex items-center justify-center">
                                <div className="bg-gray-50 dark:bg-[#090A10] rounded-xl px-4 py-2 border border-gray-200 dark:border-white/10 flex items-center justify-center min-w-[90px] shadow-sm">
                                   <span className="font-jersey text-2xl sm:text-3xl font-bold tracking-[0.1em] text-brand dark:text-blue-400 leading-none pt-1">{match.finalScore}</span>
                                </div>
                             </div>

                             <div className="flex-1 flex flex-col items-start min-w-0 pl-4">
                                <h4 className="text-xs sm:text-base font-heading font-black text-slate-900 dark:text-white truncate uppercase tracking-tight w-full text-left leading-none">{match.opponentName || 'Unknown'}</h4>
                             </div>
                          </div>

                          <div className="w-36 lg:w-48 shrink-0 hidden md:flex items-center justify-center gap-6 px-6 border-l border-gray-100 dark:border-white/5 h-12">
                             {potmName && (
                               <div className="flex flex-col items-center leading-none text-center">
                                 <span className="text-[7px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-1">MVP</span>
                                 <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight whitespace-nowrap overflow-visible">{potmName}</span>
                               </div>
                             )}
                             <div className="hidden lg:block opacity-40 group-hover:opacity-100 transition-opacity">
                                <MatchTrendSparkline 
                                  log={match.data?.gameLog || []} 
                                  duration={match.data?.matchTime || 2400} 
                                  color={match.result === 'win' ? '#22c55e' : match.result === 'loss' ? '#ef4444' : '#f97316'}
                                />
                             </div>
                          </div>

                          <div className="shrink-0 pl-4 border-l border-gray-100 dark:border-white/5 flex items-center space-x-1 sm:space-x-2 h-10">
                            <Button onClick={() => onViewMatch(match)} className="text-[10px] px-4 py-2 rounded-xl bg-brand hover:bg-brand-700 text-white border-none font-black uppercase tracking-widest shadow-sm">View</Button>
                            
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); onEditMatchVotes(match); }}
                              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-white/10 rounded-full transition-all"
                              title="Edit POTM Votes"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </button>

                            <div className="relative">
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuMatchId(isMenuOpen ? null : match.id); }} 
                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all" 
                                title="Actions"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                              </button>

                              {isMenuOpen && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenuMatchId(null)} />
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1A1A1C] border border-gray-100 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                     <button 
                                       onClick={(e) => handleDeleteClick(e, match.id)}
                                       className="w-full flex items-center px-4 py-3 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                     >
                                       <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       Delete
                                     </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="mt-20 pt-10 border-t border-gray-200 dark:border-white/5 flex flex-col items-center">
               <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.3em] mb-4">Stat Tracker Operations</span>
               <button 
                 onClick={onOpenSettings}
                 className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-brand transition-colors bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-gray-100 dark:border-white/5"
               >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 <span>App Settings & User Guide</span>
               </button>
            </div>
          </div>
        )}

        {currentTab === 'squad' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SquadStatsView squad={squad} history={history} onAddPlayer={onAddSquadPlayer} onRemovePlayer={onRemoveSquadPlayer} onUpdatePlayer={onUpdateSquadPlayer} />
          </div>
        )}

        {currentTab === 'training' && (
          <TrainingView squad={activeSquad} history={trainingHistory} onSaveSession={onSaveTrainingSession} onUpdateSession={onUpdateTrainingSession} onDeleteSession={onDeleteTrainingSession} onAddSquadPlayer={onAddSquadPlayer} />
        )}

        {currentTab === 'planner' && (
           <MatchPlanner squad={activeSquad} />
        )}

        {currentTab === 'hub' && (
           <LeagueHubView playbook={playbook} onAddPlaybookItem={onAddPlaybookItem} onDeletePlaybookItem={onDeletePlaybookItem} />
        )}

      </main>

      <ConfirmationModal isOpen={isDeleteModalOpen} title="Delete Match Record?" message="Permanently remove match and stats? This cannot be undone." onConfirm={confirmDelete} onCancel={() => { setDeleteMatchId(null); setIsDeleteModalOpen(false); }} />
    </div>
  );
};