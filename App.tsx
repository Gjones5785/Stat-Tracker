import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { MatchCharts } from './components/MatchCharts';
import { MatchHistoryItem, SquadPlayer, TrainingSession, PlaybookItem, Player, GameLogEntry, StatKey, PlayerStats, ActionItem, Coach, ActionCategory } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { saveActiveMatchState, loadActiveMatchState, clearActiveMatchState } from './dbUtils';
import { TeamSelectionModal } from './components/TeamSelectionModal';
import { PlayerRow } from './components/PlayerRow';
import { MatchEventLog } from './components/MatchEventLog';
import { Button } from './components/Button';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { BigPlayModal } from './components/BigPlayModal';
import { CardAssignmentModal } from './components/CardAssignmentModal';
import { VotingModal } from './components/VotingModal';
import { CoachDrawer } from './components/CoachDrawer';
import { SettingsModal } from './components/SettingsModal';
import { MobileActionOverlay } from './components/MobileActionOverlay';
import { createInitialPlayers, INITIAL_STATS, STAT_CONFIGS, IMPACT_WEIGHTS } from './constants';

// --- HELPERS ---
const stripUndefined = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj));
};

// --- INTERNAL MATCH TRACKER COMPONENT ---

interface MatchTrackerProps {
  initialState?: any;
  squad: SquadPlayer[];
  onFinish: (matchData: any) => void;
  onDiscard: () => void;
  onExit: () => void;
  onOpenDrawer: () => void;
  showBadge: boolean;
  pendingActionsCount: number;
  clubName: string;
}

const MatchTracker: React.FC<MatchTrackerProps> = ({ 
  initialState, 
  squad, 
  onFinish, 
  onDiscard, 
  onExit,
  onOpenDrawer,
  showBadge,
  pendingActionsCount,
  clubName
}) => {
  const [players, setPlayers] = useState<Player[]>(initialState?.players || createInitialPlayers());
  const [gameLog, setGameLog] = useState<GameLogEntry[]>(initialState?.gameLog || []);
  const [matchTime, setMatchTime] = useState(initialState?.matchTime || 0);
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [period, setPeriod] = useState<'1st' | '2nd'>(initialState?.period || '1st');
  const [opponentScore, setOpponentScore] = useState(initialState?.opponentScore || 0);
  const [homeScoreAdjustment, setHomeScoreAdjustment] = useState(initialState?.homeScoreAdjustment || 0);
  const [teamName, setTeamName] = useState(initialState?.teamName || clubName || 'My Team');
  const [opponentName, setOpponentName] = useState(initialState?.opponentName || 'Opponent');
  
  const [completedSets, setCompletedSets] = useState(initialState?.completedSets || 0);
  const [totalSets, setTotalSets] = useState(initialState?.totalSets || 0);
  
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(!initialState);
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [timerError, setTimerError] = useState(false);
  
  const [locModal, setLocModal] = useState<{ isOpen: boolean; stat?: StatKey }>({ isOpen: false });
  const [bigPlayModal, setBigPlayModal] = useState<{ isOpen: boolean; playerId: string }>({ isOpen: false, playerId: '' });
  const [cardModal, setCardModal] = useState<{ isOpen: boolean; type: 'yellow' | 'red' | null }>({ isOpen: false, type: null });
  const [pendingStat, setPendingStat] = useState<{ playerId: string; key: StatKey; delta: number } | null>(null);
  
  const [selectedMobilePlayerId, setSelectedMobilePlayerId] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
        setPlayers(prev => prev.map(p => {
           if (p.isOnField && p.cardStatus !== 'red') {
             return { ...p, totalSecondsOnField: p.totalSecondsOnField + 1 };
           }
           return p;
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    saveActiveMatchState({
      players, gameLog, matchTime, isRunning, period, opponentScore, homeScoreAdjustment, teamName, opponentName, completedSets, totalSets
    });
  }, [players, gameLog, matchTime, isRunning, period, opponentScore, homeScoreAdjustment, teamName, opponentName, completedSets, totalSets]);

  const sortedPlayersList = useMemo(() => {
    return [...players].sort((a, b) => {
      const getStatusRank = (p: Player) => {
        if (p.cardStatus === 'red') return 4;
        if (p.cardStatus === 'yellow') return 3;
        if (!p.isOnField) return 2;
        return 1;
      };
      const rankA = getStatusRank(a);
      const rankB = getStatusRank(b);
      if (rankA !== rankB) return rankA - rankB;
      const numA = parseInt(a.number) || 999;
      const numB = parseInt(b.number) || 999;
      return numA - numB;
    });
  }, [players]);

  const derivedHomeScore = players.reduce((acc, p) => acc + (p.stats.triesScored * 4) + (p.stats.kicks * 2), 0);
  const teamScore = derivedHomeScore + homeScoreAdjustment;
  const formattedTime = `${Math.floor(matchTime / 60).toString().padStart(2, '0')}:${(matchTime % 60).toString().padStart(2, '0')}`;
  
  const handleTeamSelection = (selections: { jersey: string; squadId: string; name: string }[]) => {
    const newPlayers = createInitialPlayers();
    selections.forEach(sel => {
       const idx = newPlayers.findIndex(p => p.number === sel.jersey);
       if (idx !== -1) {
         newPlayers[idx].id = sel.squadId;
         newPlayers[idx].name = sel.name;
         newPlayers[idx].squadId = sel.squadId;
       }
    });
    setPlayers(newPlayers);
    setIsTeamModalOpen(false);
  };

  const addLogEntry = (playerId: string, type: GameLogEntry['type'], reason?: string, location?: string, impact?: number, coords?: {x: number, y: number}) => {
    const player = players.find(p => p.id === playerId);
    const entry: GameLogEntry = {
      id: Date.now().toString(),
      timestamp: matchTime,
      formattedTime,
      playerId,
      playerName: player?.name || 'Unknown',
      playerNumber: player?.number || '?',
      type,
      period,
      reason,
      location,
      impactValue: impact,
      coordinate: coords
    };
    setGameLog(prev => [entry, ...prev]);
  };

  const updateStat = (playerId: string, key: StatKey, delta: number, skipLog = false) => {
    if (!isRunning && !skipLog) {
       setTimerError(true);
       setTimeout(() => setTimerError(false), 500);
       return; 
    }
    if (!skipLog && (key === 'penaltiesConceded' || key === 'errors' || key === 'triesScored') && delta > 0) {
       setPendingStat({ playerId, key, delta });
       setLocModal({ isOpen: true, stat: key });
       return;
    }
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const newVal = Math.max(0, (p.stats[key] || 0) + delta);
        return { ...p, stats: { ...p.stats, [key]: newVal } };
      }
      return p;
    }));
    if (!skipLog && delta > 0) {
       let type: GameLogEntry['type'] = 'other';
       if (key === 'triesScored') type = 'try';
       if (key === 'penaltiesConceded') type = 'penalty';
       if (key === 'errors') type = 'error';
       addLogEntry(playerId, type, key);
    }
  };

  const handleLocationConfirm = (x: number, y: number, reason: string) => {
    if (pendingStat) {
       setPlayers(prev => prev.map(p => {
         if (p.id === pendingStat.playerId) {
           const newVal = (p.stats[pendingStat.key] || 0) + pendingStat.delta;
           return { ...p, stats: { ...p.stats, [pendingStat.key]: newVal } };
         }
         return p;
       }));
       let type: GameLogEntry['type'] = 'other';
       if (pendingStat.key === 'penaltiesConceded') type = 'penalty';
       if (pendingStat.key === 'errors') type = 'error';
       if (pendingStat.key === 'triesScored') type = 'try';
       addLogEntry(pendingStat.playerId, type, reason, undefined, undefined, { x, y });
       setPendingStat(null);
       setLocModal({ isOpen: false });
    }
  };

  const handleIdentityChange = (id: string, field: 'name' | 'number', value: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleCardAction = (id: string, type: 'yellow' | 'red') => {
     setCardModal({ isOpen: true, type });
     setPendingStat({ playerId: id, key: 'penaltiesConceded', delta: 0 });
  };

  const confirmCard = (playerId: string, reason: string) => {
     const type = cardModal.type;
     setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
           return {
              ...p,
              cardStatus: type || 'none',
              isOnField: false,
              sinBinStartTime: type === 'yellow' ? matchTime : undefined
           };
        }
        return p;
     }));
     addLogEntry(playerId, type === 'yellow' ? 'yellow_card' : 'red_card', reason);
     setCardModal({ isOpen: false, type: null });
  };

  const removeCard = (id: string) => {
     setPlayers(prev => prev.map(p => {
        if (p.id === id) {
           return { ...p, cardStatus: 'none', sinBinStartTime: undefined };
        }
        return p;
     }));
  };

  const handleToggleField = (id: string) => {
     setPlayers(prev => prev.map(p => {
        if (p.id === id) {
           const nextState = !p.isOnField;
           addLogEntry(id, 'substitution', nextState ? 'Interchange ON' : 'Interchange OFF');
           return { ...p, isOnField: nextState, lastSubTime: nextState ? matchTime : p.lastSubTime };
        }
        return p;
     }));
  };

  const handleBigPlayOpen = (id: string) => {
     setBigPlayModal({ isOpen: true, playerId: id });
  };

  const confirmBigPlay = (stat: StatKey, description: string) => {
     const id = bigPlayModal.playerId;
     updateStat(id, stat, 1, true);
     addLogEntry(id, 'big_play', description, undefined, 1);
     setBigPlayModal({ isOpen: false, playerId: '' });
  };

  const handlePeriodEnd = () => {
     setIsRunning(false);
     setIsConfirmEndOpen(true);
  };

  const confirmPeriodEndAction = () => {
     if (period === '1st') {
        setPeriod('2nd');
        setIsConfirmEndOpen(false);
     } else {
        setIsConfirmEndOpen(false);
        setIsVotingOpen(true);
     }
  };

  const finishMatch = (votes: any) => {
     onFinish({
        date: new Date().toISOString().split('T')[0],
        teamName,
        opponentName,
        finalScore: `${teamScore} - ${opponentScore}`,
        result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
        data: {
           players,
           gameLog,
           matchTime,
           period,
           completedSets,
           totalSets,
           homeScoreAdjustment
        },
        voting: votes || null
     });
  };

  const handleSetComplete = () => {
     if (!isRunning) return;
     setCompletedSets(prev => prev + 1);
     setTotalSets(prev => prev + 1);
  };

  const handleSetIncomplete = () => {
     if (!isRunning) return;
     setTotalSets(prev => prev + 1);
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

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F5F5F7] dark:bg-midnight-950 font-sans transition-colors duration-300 overflow-hidden">
       <header className="shrink-0 bg-white dark:bg-midnight-800 border-b border-gray-200 dark:border-midnight-700 shadow-sm z-40 py-2">
          <div className="w-full max-w-[1920px] mx-auto px-4 flex items-center justify-between gap-4 h-full">
             <div className="flex items-center gap-3 shrink-0">
                 <button onClick={onExit} className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-midnight-700 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100 dark:border-midnight-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                 <button onClick={() => setIsRunning(!isRunning)} className={`px-4 py-1.5 rounded-lg border-2 transition-all active:scale-95 flex items-center gap-3 ${isRunning ? 'bg-white text-red-500 border-red-500' : 'bg-green-500 text-white border-green-600'} shadow-sm`}><span className="text-3xl font-jersey font-medium tracking-wider leading-none pt-1">{formattedTime}</span><div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-white'}`}></div></button>
             </div>
             <div className="flex-1 flex items-center justify-center gap-4 px-1 overflow-hidden">
                <div className="flex items-center gap-4 min-w-0"><input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="hidden md:block bg-transparent text-right font-heading font-black text-2xl text-slate-800 dark:text-white w-48 focus:outline-none truncate placeholder-gray-300" placeholder="HOME" /><span className="text-5xl font-jersey font-medium text-blue-600 dark:text-blue-400 tracking-tighter">{teamScore}</span></div>
                <div className="text-gray-300 font-light text-3xl opacity-50 italic">/</div>
                <div className="flex items-center gap-4 min-w-0"><div className="flex items-center"><span className="text-5xl font-jersey font-medium text-red-500 dark:text-red-400 tracking-tighter">{opponentScore}</span><div className="flex flex-col ml-2 space-y-0.5"><button onClick={() => setOpponentScore(opponentScore + 4)} className="w-8 h-5 bg-gray-100 dark:bg-white/10 rounded text-[9px] font-black text-slate-600 dark:text-slate-400 hover:bg-gray-200">+T</button><button onClick={() => setOpponentScore(opponentScore + 2)} className="w-8 h-5 bg-gray-100 dark:bg-white/10 rounded text-[9px] font-black text-slate-600 dark:text-slate-400 hover:bg-gray-200">+K</button></div></div><input value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="hidden md:block bg-transparent text-left font-heading font-black text-2xl text-slate-800 dark:text-white w-48 focus:outline-none truncate placeholder-gray-300" placeholder="AWAY" /></div>
                <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden md:block mx-4"></div>
                <div className={`hidden md:flex items-center gap-4 bg-gray-50 dark:bg-white/5 px-5 py-2 rounded-xl border border-gray-100 dark:border-white/10 ${!isRunning ? 'opacity-30 pointer-events-none' : ''}`}><button onClick={handleSetComplete} className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-95 hover:bg-green-600 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></button><div className="font-jersey text-2xl tracking-[0.1em] text-slate-900 dark:text-white pt-1">{completedSets}/{totalSets} <span className="ml-1 text-[10px] opacity-70 font-sans font-black uppercase text-gray-400">Sets</span></div><button onClick={handleSetIncomplete} className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95 hover:bg-red-600 shadow-sm"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
             </div>
             <div className="flex items-center gap-3 shrink-0"><Button onClick={handlePeriodEnd} variant="secondary" className="px-5 py-2.5 h-auto text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 rounded-lg shadow-none whitespace-nowrap hover:bg-red-100 transition-colors">{period === '1st' ? 'End 1st Half' : 'End Match'}</Button></div>
          </div>
       </header>

       <main className={`flex-1 flex flex-col min-h-0 w-full max-w-[1920px] mx-auto px-1 pt-1 transition-all duration-300 overflow-hidden ${!isRunning ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
          <div className="hidden md:flex flex-1 bg-white dark:bg-midnight-800 rounded-xl shadow-sm border border-gray-200 dark:border-midnight-700 overflow-hidden flex-col min-h-0 mb-4 mx-6">
             <div className="flex-1 overflow-auto custom-scrollbar relative">
               <table className="w-full min-w-max border-collapse text-left">
                  <thead className="bg-gray-100 dark:bg-midnight-900 border-b border-gray-200 dark:border-midnight-700 sticky top-0 z-20">
                     <tr>
                        <th className="p-3 text-left w-16 sticky left-0 z-30 bg-gray-100 dark:bg-midnight-900 border-r border-gray-200 dark:border-midnight-700 shadow-sm text-xs font-black text-gray-400 uppercase tracking-widest pl-5">#</th>
                        <th className="p-3 text-left min-w-[200px] sticky left-[64px] z-30 bg-gray-100 dark:bg-midnight-900 border-r border-gray-200 dark:border-midnight-700 shadow-sm text-xs font-black text-gray-400 uppercase tracking-widest pl-5">Player</th>
                        {STAT_CONFIGS.map(sc => (<th key={sc.key} className="p-3 text-center min-w-[110px] text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{sc.label}</th>))}
                        <th className="p-3 text-center min-w-[90px] w-24 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-tighter">Impact</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-midnight-700">
                     {sortedPlayersList.map((p, i) => (
                        <PlayerRow key={p.id} player={p} isOdd={i % 2 !== 0} onStatChange={updateStat} onIdentityChange={handleIdentityChange} onCardAction={handleCardAction} onRemoveCard={removeCard} onToggleFieldStatus={handleToggleField} onOpenBigPlay={handleBigPlayOpen} teamTotals={teamTotals} maxValues={maxValues} leaderCounts={leaderCounts} />
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
       </main>

       <div className={`hidden md:block shrink-0 bg-white/95 dark:bg-midnight-900/95 backdrop-blur-md border-t border-gray-200 dark:border-midnight-700 p-4 z-50 shadow-md transition-all duration-300 ${!isRunning ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
          <div className="max-w-4xl mx-auto flex items-center justify-center space-x-5">
             <button onClick={() => setIsLogOpen(true)} className="flex items-center justify-center w-12 h-12 bg-gray-50 dark:bg-midnight-800 rounded-xl border border-gray-200 dark:border-midnight-600 shadow-sm active:scale-95 transition-all hover:bg-gray-100 dark:hover:bg-midnight-700"><svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg></button>
             <button onClick={onOpenDrawer} className="relative flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-sm active:scale-95 transition-all hover:bg-slate-800"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>{showBadge && <span className="absolute -top-1 -right-1 flex h-4 w-4"><span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white text-[9px] font-black items-center justify-center text-white">{pendingActionsCount}</span></span>}</button>
             <button onClick={() => setCardModal({ isOpen: true, type: 'yellow' })} className="flex items-center justify-center px-6 h-12 bg-yellow-50 rounded-xl border border-yellow-200 active:scale-95 transition-all hover:bg-yellow-100 shadow-sm"><div className="w-4 h-5 bg-yellow-400 rounded-sm mr-3 border border-yellow-600 shadow-sm"></div><span className="text-xs font-black uppercase text-yellow-700 tracking-wider">Bin</span></button>
             <button onClick={() => setCardModal({ isOpen: true, type: 'red' })} className="flex items-center justify-center px-6 h-12 bg-red-50 rounded-xl border border-red-200 active:scale-95 transition-all hover:bg-red-100 shadow-sm"><div className="w-4 h-5 bg-red-600 rounded-sm mr-3 border border-red-800 shadow-sm"></div><span className="text-xs font-black uppercase text-red-700 tracking-wider">Off</span></button>
             <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-2"></div>
             <button onClick={() => setBigPlayModal({ isOpen: true, playerId: players.find(p => p.isOnField)?.id || players[0].id })} className="flex-1 h-12 bg-slate-900 dark:bg-white rounded-xl shadow-lg flex items-center justify-center space-x-3 active:scale-95 group hover:bg-slate-800 dark:hover:bg-gray-100 transition-colors border border-transparent dark:border-white"><span className="text-xl group-hover:animate-pulse">⚡</span><span className="text-white dark:text-slate-900 font-heading font-black text-sm uppercase tracking-widest">Impact Play</span></button>
          </div>
       </div>

       <TeamSelectionModal isOpen={isTeamModalOpen} squad={squad} onConfirm={handleTeamSelection} onCancel={() => setIsTeamModalOpen(false)} />
       <LocationPickerModal isOpen={locModal.isOpen} title="Mark Location" stat={locModal.stat} onConfirm={handleLocationConfirm} onCancel={() => { setLocModal({ isOpen: false }); setPendingStat(null); }} />
       <CardAssignmentModal isOpen={cardModal.isOpen} type={cardModal.type} players={players} onConfirm={confirmCard} onCancel={() => { setCardModal({ isOpen: false, type: null }); setPendingStat(null); }} />
       <BigPlayModal isOpen={bigPlayModal.isOpen} player={players.find(p => p.id === bigPlayModal.playerId) || players[0]} players={players} onPlayerChange={(id) => setBigPlayModal(prev => ({ ...prev, playerId: id }))} onConfirm={confirmBigPlay} onClose={() => setBigPlayModal({ isOpen: false, playerId: '' })} />
       <MatchEventLog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} events={gameLog} />
       <ConfirmationModal isOpen={isConfirmEndOpen} title={period === '1st' ? "End 1st Half?" : "End Match?"} message={period === '1st' ? "This will pause the timer and switch to 2nd Half." : "Proceed to post-match voting and save results."} onConfirm={confirmPeriodEndAction} onCancel={() => setIsConfirmEndOpen(false)} />
       <VotingModal isOpen={isVotingOpen} players={players} onConfirm={finishMatch} onSkip={() => finishMatch(null)} />
    </div>
  );
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingSession[]>([]);
  const [playbook, setPlaybook] = useState<PlaybookItem[]>([]);
  
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasViewedActions, setHasViewedActions] = useState(false);

  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [viewingMatch, setViewingMatch] = useState<MatchHistoryItem | null>(null);
  const [hasResumableMatch, setHasResumableMatch] = useState(false);
  const [editingVoteMatch, setEditingVoteMatch] = useState<MatchHistoryItem | null>(null);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('LEAGUELENS_SETTINGS');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { clubName: '', logo: null, primaryColor: '#E02020', defaultHalfDuration: 40, sinBinDuration: 10, interchangeLimit: 'Limited', hapticFeedback: true, darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches, weights: { ...IMPACT_WEIGHTS } };
  });

  const activeSquad = useMemo(() => squad.filter(p => p.active !== false), [squad]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        getDoc(doc(db, 'users', u.uid)).then(snap => {
           if (snap.exists()) {
              const data = snap.data();
              setSettings(prev => ({ ...prev, clubName: data.clubName || prev.clubName, logo: data.logo || prev.logo, primaryColor: data.brandColor || prev.primaryColor }));
           }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--brand-primary', settings.primaryColor);
  }, [settings]);

  useEffect(() => {
    loadActiveMatchState().then(data => { if (data) setHasResumableMatch(true); });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubSquad = onSnapshot(query(collection(db, `users/${user.uid}/squad`), orderBy('name')), (snap) => {
      setSquad(snap.docs.map(d => ({ id: d.id, ...d.data() } as SquadPlayer)));
    });
    const unsubMatches = onSnapshot(query(collection(db, `users/${user.uid}/matches`), orderBy('date', 'desc')), (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchHistoryItem)));
    });
    const unsubTraining = onSnapshot(query(collection(db, `users/${user.uid}/training`), orderBy('date', 'desc')), (snap) => {
      setTrainingHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession)));
    });
    const unsubPlaybook = onSnapshot(query(collection(db, `users/${user.uid}/playbook`), orderBy('createdAt', 'desc')), (snap) => {
        setPlaybook(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlaybookItem)));
    });
    const unsubActions = onSnapshot(query(collection(db, `users/${user.uid}/actions`), orderBy('createdAt', 'desc')), (snap) => {
        setActions(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActionItem)));
    });
    const unsubCoaches = onSnapshot(query(collection(db, `users/${user.uid}/coaches`), orderBy('name')), (snap) => {
        setCoaches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coach)));
    });
    return () => { unsubSquad(); unsubMatches(); unsubTraining(); unsubPlaybook(); unsubActions(); unsubCoaches(); };
  }, [user]);

  const handleNewMatch = () => setActiveMatch({});
  const handleResumeMatch = async () => {
    const data = await loadActiveMatchState();
    if (data) setActiveMatch(data);
    else setHasResumableMatch(false);
  };
  const handleExitMatch = () => { setActiveMatch(null); setHasResumableMatch(true); };
  const handleDiscardMatch = async () => { setActiveMatch(null); setHasResumableMatch(false); await clearActiveMatchState(); };
  const handleFinishMatch = async (matchData: any) => {
    if (!user) return;
    try {
      const cleanedData = stripUndefined(matchData);
      await addDoc(collection(db, `users/${user.uid}/matches`), cleanedData);
      await clearActiveMatchState();
      setActiveMatch(null);
      setHasResumableMatch(false);
    } catch (e) { console.error(e); }
  };

  const handleAddSquadPlayer = async (p: any) => { if(!user) return; await addDoc(collection(db, `users/${user.uid}/squad`), { ...p, active: true, createdAt: Date.now() }); };
  const handleRemoveSquadPlayer = async (id: string) => { if(!user) return; await deleteDoc(doc(db, `users/${user.uid}/squad`, id)); };
  const handleUpdateSquadPlayer = async (id: string, updates: any) => { if(!user) return; await updateDoc(doc(db, `users/${user.uid}/squad`, id), updates); };
  const handleSaveTraining = async (session: any) => { if(!user) return; await addDoc(collection(db, `users/${user.uid}/training`), session); };
  const handleUpdateTraining = async (id: string, updates: any) => { if(!user) return; await updateDoc(doc(db, `users/${user.uid}/training`, id), updates); };
  const handleDeleteTraining = async (id: string) => { if(!user) return; await deleteDoc(doc(db, `users/${user.uid}/training`, id)); };
  const handleAddPlaybookItem = async (item: any) => { if(!user) return; await addDoc(collection(db, `users/${user.uid}/playbook`), item); };
  const handleDeletePlaybookItem = async (id: string) => { if(!user) return; await deleteDoc(doc(db, `users/${user.uid}/playbook`, id)); };
  
  const handleDeleteMatch = async (id: string) => { 
    if(!user || !id) return; 
    try {
      // Use consolidated path string for robust deletion
      await deleteDoc(doc(db, `users/${user.uid}/matches/${id}`)); 
    } catch (e) {
      console.error("Deletion failed:", e);
      throw e;
    }
  };

  const handleAddAction = async (content: string, category: ActionCategory) => {
     if (!user) return;
     let matchTimestamp: string | null = null;
     if (activeMatch && typeof activeMatch.matchTime === 'number') {
        const time = activeMatch.matchTime;
        matchTimestamp = `[${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}]`;
     }
     await addDoc(collection(db, `users/${user.uid}/actions`), stripUndefined({ content, category, assignedCoachId: coaches[0]?.id || '', isCompleted: false, timestamp: new Date().toISOString(), matchTimestamp, createdAt: Date.now() }));
  };

  const handleToggleAction = async (id: string) => {
     if (!user) return;
     const item = actions.find(a => a.id === id);
     if (item) await updateDoc(doc(db, `users/${user.uid}/actions`, id), { isCompleted: !item.isCompleted });
  };

  const handleOpenDrawer = () => { setIsDrawerOpen(true); setHasViewedActions(true); };
  const pendingActionsCount = actions.filter(a => !a.isCompleted).length;
  const showNotificationBadge = pendingActionsCount > 0 && !hasViewedActions;

  if (!user) return <AuthScreen onLogin={setUser} />;

  if (activeMatch) return (
    <>
      <MatchTracker initialState={Object.keys(activeMatch).length > 0 ? activeMatch : undefined} squad={activeSquad} onFinish={handleFinishMatch} onDiscard={handleDiscardMatch} onExit={handleExitMatch} onOpenDrawer={handleOpenDrawer} showBadge={showNotificationBadge} pendingActionsCount={pendingActionsCount} clubName={stripUndefined(settings.clubName)} />
      <CoachDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} actions={actions} coaches={coaches} onAddAction={handleAddAction} onToggleAction={handleToggleAction} onDeleteAction={async (id) => { if(!user) return; await deleteDoc(doc(db, `users/${user.uid}/actions`, id)); }} onCycleCoach={()=>{}} onAddCoach={()=>{}} onDeleteCoach={()=>{}} />
    </>
  );

  if (viewingMatch) {
    const { players, gameLog, matchTime, completedSets, totalSets } = viewingMatch.data;
    const scores = viewingMatch.finalScore.split(' - ').map(s => parseInt(s.trim()));
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-midnight-950 flex flex-col">
        <div className="bg-white dark:bg-midnight-800 p-2 shadow-sm border-b flex justify-between items-center sticky top-0 z-50"><button onClick={() => setViewingMatch(null)} className="flex items-center text-slate-600 dark:text-gray-300 font-bold text-xs"><svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7" /></svg>Back</button><h2 className="font-heading font-bold text-slate-900 dark:text-white text-sm">Match Report</h2><div className="w-16"></div></div>
        <div className="flex-1 overflow-hidden">
          <MatchCharts 
            matchData={{ 
              players, 
              leftScore: scores[0] || 0, 
              rightScore: scores[1] || 0, 
              possessionSeconds: matchTime / 2, 
              matchTime, 
              teamName: viewingMatch.teamName, 
              opponentName: viewingMatch.opponentName, 
              gameLog,
              voting: viewingMatch.voting,
              date: viewingMatch.date,
              completedSets,
              totalSets
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard currentUser={user.displayName || user.email || 'Coach'} hasActiveMatch={hasResumableMatch} history={history} squad={squad} onNewMatch={handleNewMatch} onResumeMatch={handleResumeMatch} onDiscardActiveMatch={handleDiscardMatch} onViewMatch={setViewingMatch} onDeleteMatch={handleDeleteMatch} onEditMatchVotes={setEditingVoteMatch} onLogout={() => signOut(auth)} onAddSquadPlayer={handleAddSquadPlayer} onRemoveSquadPlayer={handleRemoveSquadPlayer} onUpdateSquadPlayer={handleUpdateSquadPlayer} darkMode={settings.darkMode} toggleTheme={() => setSettings(prev => ({...prev, darkMode: !prev.darkMode}))} onOpenDrawer={handleOpenDrawer} showBadge={showNotificationBadge} pendingActionsCount={pendingActionsCount} onOpenSettings={() => setIsSettingsOpen(true)} trainingHistory={trainingHistory} onSaveTrainingSession={handleSaveTraining} onUpdateTrainingSession={handleUpdateTraining} onDeleteTrainingSession={handleDeleteTraining} playbook={playbook} onAddPlaybookItem={handleAddPlaybookItem} onDeletePlaybookItem={handleDeletePlaybookItem} clubName={stripUndefined(settings.clubName)} onUpdateClubName={(n) => setSettings(prev => ({...prev, clubName: n}))} logo={settings.logo} />
      {editingVoteMatch && <VotingModal isOpen={true} players={editingVoteMatch.data.players} initialVotes={editingVoteMatch.voting} isEditing={true} onConfirm={async (votes) => { if (!user) return; await updateDoc(doc(db, `users/${user.uid}/matches`, editingVoteMatch.id), { voting: stripUndefined(votes) }); setEditingVoteMatch(null); }} onSkip={() => setEditingVoteMatch(null)} />}
      <CoachDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} actions={actions} coaches={coaches} onAddAction={handleAddAction} onToggleAction={handleToggleAction} onDeleteAction={async (id) => { if(!user) return; await deleteDoc(doc(db, `users/${user.uid}/actions`, id)); }} onCycleCoach={()=>{}} onAddCoach={()=>{}} onDeleteCoach={()=>{}} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSave={setSettings} coachInfo={{ name: user.displayName || 'Coach', email: user.email || '' }} />
    </>
  );
};