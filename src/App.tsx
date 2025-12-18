import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { MatchCharts } from './components/MatchCharts';
import { MatchHistoryItem, SquadPlayer, TrainingSession, PlaybookItem, Player, GameLogEntry, StatKey, PlayerStats } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { saveActiveMatchState, loadActiveMatchState, clearActiveMatchState } from './dbUtils';
import { TeamSelectionModal } from './components/TeamSelectionModal';
import { PlayerRow } from './components/PlayerRow';
import { MatchEventLog } from './components/MatchEventLog';
import { Button } from './components/Button';
import { ConfirmationModal } from './components/ConfirmationModal';
import { NoteModal } from './components/NoteModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { BigPlayModal } from './components/BigPlayModal';
import { CardAssignmentModal } from './components/CardAssignmentModal';
import { NotificationModal } from './components/NotificationModal';
import { VotingModal } from './components/VotingModal';
import { createInitialPlayers, INITIAL_STATS } from './constants';

// --- INTERNAL MATCH TRACKER COMPONENT ---

interface MatchTrackerProps {
  initialState?: any;
  squad: SquadPlayer[];
  onFinish: (matchData: any) => void;
  onDiscard: () => void;
  onExit: () => void;
}

const MatchTracker: React.FC<MatchTrackerProps> = ({ initialState, squad, onFinish, onDiscard, onExit }) => {
  const [players, setPlayers] = useState<Player[]>(initialState?.players || createInitialPlayers());
  const [gameLog, setGameLog] = useState<GameLogEntry[]>(initialState?.gameLog || []);
  const [matchTime, setMatchTime] = useState(initialState?.matchTime || 0);
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [period, setPeriod] = useState<'1st' | '2nd'>(initialState?.period || '1st');
  const [opponentScore, setOpponentScore] = useState(initialState?.opponentScore || 0);
  const [homeScoreAdjustment, setHomeScoreAdjustment] = useState(initialState?.homeScoreAdjustment || 0);
  const [teamName, setTeamName] = useState(initialState?.teamName || localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'My Team');
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
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

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
    if (!skipLog && (key === 'penaltiesConceded' || key === 'errors') && delta > 0) {
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

  const confirmBigPlay = (stat: StatKey, desc: string) => {
     const id = bigPlayModal.playerId;
     updateStat(id, stat, 1, true);
     addLogEntry(id, 'big_play', desc, undefined, 1);
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
     try {
       const matchData = {
          date: new Date().toISOString().split('T')[0],
          teamName: teamName || 'My Team',
          opponentName: opponentName || 'Opponent',
          finalScore: `${teamScore} - ${opponentScore}`,
          result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
          data: {
             players: JSON.parse(JSON.stringify(players)),
             gameLog: JSON.parse(JSON.stringify(gameLog)),
             matchTime,
             period,
             sets: { completed: completedSets, total: totalSets },
             homeScoreAdjustment
          },
          voting: votes || null
       };
       onFinish(matchData);
     } catch (err) {
       console.error("Error finishing match:", err);
     }
  };

  const handleSetComplete = () => {
     if (!isRunning) { setTimerError(true); setTimeout(() => setTimerError(false), 500); return; }
     setCompletedSets(prev => prev + 1);
     setTotalSets(prev => prev + 1);
  };

  const handleSetIncomplete = () => {
     if (!isRunning) { setTimerError(true); setTimeout(() => setTimerError(false), 500); return; }
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
       {/* ULTRA-COMPACT HEADER FOR TABLET */}
       <header className="shrink-0 bg-white dark:bg-midnight-800 border-b border-gray-200 dark:border-midnight-700 shadow-sm z-40 py-1">
          <div className="w-full max-w-[1920px] mx-auto px-4 flex items-center justify-between gap-2">
             {/* Left Side: Navigation & Clock */}
             <div className="flex items-center gap-2 shrink-0">
                 <button onClick={onExit} className="w-7 h-7 flex items-center justify-center rounded bg-gray-50 dark:bg-midnight-700 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                 </button>
                 <button 
                   onClick={() => setIsRunning(!isRunning)}
                   className={`px-3 py-1 rounded-lg border-2 transition-all active:scale-95 flex items-center gap-2 ${isRunning ? 'bg-white text-red-500 border-red-500' : 'bg-green-500 text-white border-green-600'} ${timerError ? 'animate-shake' : ''}`}
                 >
                    <span className="text-2xl font-jersey font-medium tracking-wider leading-none">{formattedTime}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-white'}`}></div>
                 </button>
             </div>

             {/* Combined Center: Scoreboard & Completion (ALL ON ONE LINE) */}
             <div className="flex-1 flex items-center justify-center gap-4 px-2 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                   <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-transparent text-right font-heading font-black text-xs md:text-sm text-slate-800 dark:text-white w-20 md:w-32 focus:outline-none truncate" />
                   <input type="number" value={teamScore} onChange={(e) => setHomeScoreAdjustment((parseInt(e.target.value) || 0) - derivedHomeScore)} className="text-3xl font-jersey font-medium text-blue-600 dark:text-neon-blue w-10 text-center bg-transparent outline-none" />
                </div>
                <div className="text-gray-300 font-light">-</div>
                <div className="flex items-center gap-2 min-w-0">
                   <div className="flex items-center">
                     <input type="number" value={opponentScore} onChange={(e) => setOpponentScore(Math.max(0, parseInt(e.target.value) || 0))} className="text-3xl font-jersey font-medium text-red-500 dark:text-red-400 w-10 text-center bg-transparent outline-none" />
                     <div className="flex flex-col scale-75 origin-left">
                        <button onClick={() => setOpponentScore(opponentScore + 4)} className="w-5 h-4 bg-gray-100 rounded text-[7px] font-black mb-0.5">+T</button>
                        <button onClick={() => setOpponentScore(opponentScore + 2)} className="w-5 h-4 bg-gray-100 rounded text-[7px] font-black">+K</button>
                     </div>
                   </div>
                   <input value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="bg-transparent text-left font-heading font-black text-xs md:text-sm text-slate-800 dark:text-white w-20 md:w-32 focus:outline-none truncate" />
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 hidden md:block"></div>

                {/* Inline Set Completion */}
                <div className={`hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full border border-gray-100 dark:border-white/10 ${!isRunning ? 'opacity-30 pointer-events-none' : ''}`}>
                   <button onClick={handleSetComplete} className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center active:scale-95"><svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg></button>
                   <div className="font-jersey text-sm tracking-widest text-slate-900 dark:text-white">{completedSets}/{totalSets} <span className="ml-1 text-[8px] opacity-70">Sets</span></div>
                   <button onClick={handleSetIncomplete} className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95"><svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
             </div>

             {/* Right Side: Branding & Controls */}
             <div className="flex items-center gap-3 shrink-0">
                <div className="hidden lg:flex flex-col items-end">
                   <span className="font-heading font-black text-[10px] tracking-tight text-slate-900 dark:text-white uppercase">LeagueLens<span className="text-red-600">.</span></span>
                </div>
                <Button onClick={handlePeriodEnd} variant="secondary" className="px-3 py-1 h-auto text-[9px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 rounded shadow-none whitespace-nowrap">
                   {period === '1st' ? 'End 1st' : 'End Match'}
                </Button>
             </div>
          </div>
       </header>

       {/* MAIN CONTENT AREA - EVEN HIGHER DENSITY */}
       <main className={`flex-1 flex flex-col min-h-0 w-full max-w-[1920px] mx-auto px-1 pt-1 transition-all duration-300 ${!isRunning ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
          <div className="flex-1 bg-white dark:bg-midnight-800 rounded-lg shadow-sm border border-gray-200 dark:border-midnight-700 overflow-hidden flex flex-col min-h-0 mb-1">
             <div className="flex-1 overflow-auto custom-scrollbar relative">
               <table className="w-full min-w-max border-collapse text-left">
                  <thead className="bg-gray-50 dark:bg-midnight-900 border-b border-gray-200 dark:border-midnight-700 sticky top-0 z-20">
                     <tr>
                        <th className="p-1 text-left w-12 sticky left-0 z-30 bg-gray-50 dark:bg-midnight-900 border-r border-gray-200 dark:border-midnight-700 shadow-sm text-[8px] font-black text-gray-400 uppercase tracking-widest pl-2">#</th>
                        <th className="p-1 text-left min-w-[140px] sticky left-[48px] z-30 bg-gray-50 dark:bg-midnight-900 border-r border-gray-200 dark:border-midnight-700 shadow-sm text-[8px] font-black text-gray-400 uppercase tracking-widest pl-2">Player</th>
                        {Object.keys(INITIAL_STATS).slice(0, 6).map(k => (
                           <th key={k} className="p-1 text-center min-w-[80px] text-[7px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                        ))}
                        <th className="p-1 text-center min-w-[70px] w-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[7px] tracking-tighter">Impact</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-midnight-700">
                     {sortedPlayersList.map((p, i) => (
                        <PlayerRow 
                           key={p.id}
                           player={p}
                           isOdd={i % 2 !== 0}
                           onStatChange={updateStat}
                           onIdentityChange={handleIdentityChange}
                           onCardAction={handleCardAction}
                           onRemoveCard={removeCard}
                           onToggleFieldStatus={handleToggleField}
                           onOpenBigPlay={handleBigPlayOpen}
                           teamTotals={teamTotals}
                           maxValues={maxValues}
                           leaderCounts={leaderCounts}
                        />
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
       </main>

       {/* ULTRA-COMPACT FLOATING FOOTER */}
       <div className={`shrink-0 bg-white/95 dark:bg-midnight-900/95 backdrop-blur-md border-t border-gray-200 p-1 z-50 shadow-md transition-all duration-300 ${!isRunning ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
          <div className="max-w-xl mx-auto flex items-center justify-center space-x-2">
             <button onClick={() => setIsLogOpen(true)} className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded border border-gray-200 shadow-sm active:scale-95 transition-all">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
             </button>
             <button onClick={() => setCardModal({ isOpen: true, type: 'yellow' })} className="flex items-center justify-center px-2 h-8 bg-yellow-50 rounded border border-yellow-200 active:scale-95 transition-all">
                <div className="w-2.5 h-3.5 bg-yellow-400 rounded-sm mr-1.5 border border-yellow-600"></div>
                <span className="text-[7px] font-black uppercase text-yellow-700">Bin</span>
             </button>
             <button onClick={() => setCardModal({ isOpen: true, type: 'red' })} className="flex items-center justify-center px-2 h-8 bg-red-50 rounded border border-red-200 active:scale-95 transition-all">
                <div className="w-2.5 h-3.5 bg-red-600 rounded-sm mr-1.5 border border-red-800"></div>
                <span className="text-[7px] font-black uppercase text-red-700">Off</span>
             </button>
             <div className="w-px h-5 bg-gray-200 mx-1"></div>
             <button 
               onClick={() => setBigPlayModal({ isOpen: true, playerId: players.find(p => p.isOnField)?.id || players[0].id })} 
               className="flex-1 h-8 bg-slate-900 dark:bg-white rounded shadow-sm flex items-center justify-center space-x-1 active:scale-95 group"
             >
                <span className="text-sm group-hover:animate-pulse">⚡</span>
                <span className="text-white dark:text-slate-900 font-heading font-black text-[10px] uppercase tracking-widest">Impact Play</span>
             </button>
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
  
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [viewingMatch, setViewingMatch] = useState<MatchHistoryItem | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [hasResumableMatch, setHasResumableMatch] = useState(false);
  const [editingVoteMatch, setEditingVoteMatch] = useState<MatchHistoryItem | null>(null);

  const activeSquad = useMemo(() => squad.filter(p => p.active !== false), [squad]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setSquad([]); setHistory([]); setTrainingHistory([]); setPlaybook([]); }
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

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
    return () => { unsubSquad(); unsubMatches(); unsubTraining(); unsubPlaybook(); };
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
      await addDoc(collection(db, `users/${user.uid}/matches`), matchData);
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
  const handleDeleteMatch = async (id: string) => { if(!user) return; await deleteDoc(doc(db, `users/${user.uid}/matches`, id)); };

  if (!user) return <AuthScreen onLogin={setUser} />;

  if (activeMatch) return (
    <MatchTracker 
      initialState={Object.keys(activeMatch).length > 0 ? activeMatch : undefined}
      squad={activeSquad}
      onFinish={handleFinishMatch}
      onDiscard={handleDiscardMatch}
      onExit={handleExitMatch}
    />
  );

  if (viewingMatch) {
    const { players, gameLog, matchTime } = viewingMatch.data;
    const scores = viewingMatch.finalScore.split(' - ').map(s => parseInt(s.trim()));
    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-midnight-950 flex flex-col">
        <div className="bg-white dark:bg-midnight-800 p-2 shadow-sm border-b flex justify-between items-center sticky top-0 z-50">
           <button onClick={() => setViewingMatch(null)} className="flex items-center text-slate-600 dark:text-gray-300 font-bold text-xs">
             <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7" /></svg>
             Back
           </button>
           <h2 className="font-heading font-bold text-slate-900 dark:text-white text-sm">Match Report</h2>
           <div className="w-16"></div> 
        </div>
        <div className="flex-1 overflow-hidden">
           <MatchCharts matchData={{ players, leftScore: scores[0] || 0, rightScore: scores[1] || 0, possessionSeconds: matchTime / 2, matchTime, teamName: viewingMatch.teamName, opponentName: viewingMatch.opponentName, gameLog }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard 
        currentUser={user.displayName || user.email || 'Coach'}
        hasActiveMatch={hasResumableMatch}
        history={history}
        squad={squad}
        onNewMatch={handleNewMatch}
        onResumeMatch={handleResumeMatch}
        onDiscardActiveMatch={handleDiscardMatch}
        onViewMatch={setViewingMatch}
        onDeleteMatch={handleDeleteMatch}
        onEditMatchVotes={setEditingVoteMatch}
        onLogout={() => signOut(auth)}
        onAddSquadPlayer={handleAddSquadPlayer}
        onRemoveSquadPlayer={handleRemoveSquadPlayer}
        onUpdateSquadPlayer={handleUpdateSquadPlayer}
        darkMode={darkMode}
        toggleTheme={() => setDarkMode(!darkMode)}
        trainingHistory={trainingHistory}
        onSaveTrainingSession={handleSaveTraining}
        onUpdateTrainingSession={handleUpdateTraining}
        onDeleteTrainingSession={handleDeleteTraining}
        playbook={playbook}
        onAddPlaybookItem={handleAddPlaybookItem}
        onDeletePlaybookItem={handleDeletePlaybookItem}
      />
      {editingVoteMatch && (
        <VotingModal 
          isOpen={true}
          players={editingVoteMatch.data.players}
          initialVotes={editingVoteMatch.voting}
          isEditing={true}
          onConfirm={async (votes) => {
            if (!user) return;
            await updateDoc(doc(db, `users/${user.uid}/matches`, editingVoteMatch.id), { voting: votes });
            setEditingVoteMatch(null);
          }}
          onSkip={() => setEditingVoteMatch(null)}
        />
      )}
    </>
  );
};
