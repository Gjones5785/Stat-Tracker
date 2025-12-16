
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // State
  const [players, setPlayers] = useState<Player[]>(initialState?.players || createInitialPlayers());
  const [gameLog, setGameLog] = useState<GameLogEntry[]>(initialState?.gameLog || []);
  const [matchTime, setMatchTime] = useState(initialState?.matchTime || 0);
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [period, setPeriod] = useState<'1st' | '2nd'>(initialState?.period || '1st');
  const [opponentScore, setOpponentScore] = useState(initialState?.opponentScore || 0);
  const [teamName, setTeamName] = useState(initialState?.teamName || localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'My Team');
  const [opponentName, setOpponentName] = useState(initialState?.opponentName || 'Opponent');
  
  // Set Counters (Restored)
  const [completedSets, setCompletedSets] = useState(initialState?.completedSets || 0);
  const [totalSets, setTotalSets] = useState(initialState?.totalSets || 0);
  
  // UI State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(!initialState); // Open if new match
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [timerError, setTimerError] = useState(false);
  
  // Event Modals State
  const [noteModal, setNoteModal] = useState<{ isOpen: boolean; playerId: string }>({ isOpen: false, playerId: '' });
  const [locModal, setLocModal] = useState<{ isOpen: boolean; stat?: StatKey }>({ isOpen: false });
  const [bigPlayModal, setBigPlayModal] = useState<{ isOpen: boolean; playerId: string }>({ isOpen: false, playerId: '' });
  const [cardModal, setCardModal] = useState<{ isOpen: boolean; type: 'yellow' | 'red' | null }>({ isOpen: false, type: null });
  const [pendingStat, setPendingStat] = useState<{ playerId: string; key: StatKey; delta: number } | null>(null);

  // Timer
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
        // Update on-field time
        setPlayers(prev => prev.map(p => {
           if (p.isOnField && p.cardStatus !== 'red') {
             // If yellow card, check duration (10 mins = 600s)
             if (p.cardStatus === 'yellow' && p.sinBinStartTime) {
                const timeInBin = matchTime - p.sinBinStartTime;
                // Note: We don't auto-remove card, just track time. 
                return p;
             }
             return { ...p, totalSecondsOnField: p.totalSecondsOnField + 1 };
           }
           return p;
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, matchTime]);

  // Auto-Save
  useEffect(() => {
    saveActiveMatchState({
      players, gameLog, matchTime, isRunning, period, opponentScore, teamName, opponentName, completedSets, totalSets
    });
  }, [players, gameLog, matchTime, isRunning, period, opponentScore, teamName, opponentName, completedSets, totalSets]);

  // Derived Stats
  const teamScore = players.reduce((acc, p) => acc + (p.stats.triesScored * 4) + (p.stats.kicks * 2), 0);
  const formattedTime = `${Math.floor(matchTime / 60).toString().padStart(2, '0')}:${(matchTime % 60).toString().padStart(2, '0')}`;
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // -- Handlers --

  const handleTeamSelection = (selections: { jersey: string; squadId: string; name: string }[]) => {
    const newPlayers = createInitialPlayers(); // Reset
    
    // Apply selections
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
    // ENFORCE TIMER RUNNING FOR STATS
    if (!isRunning && !skipLog) {
       setTimerError(true);
       setTimeout(() => setTimerError(false), 500);
       return; 
    }

    // If it's a complex stat that needs location (Penalties, Errors), open modal first
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
       // Simple log for clicks
       let type: GameLogEntry['type'] = 'other';
       if (key === 'triesScored') type = 'try';
       // We handle penalties/errors via modal usually, but if direct click:
       if (key === 'penaltiesConceded') type = 'penalty';
       if (key === 'errors') type = 'error';
       
       addLogEntry(playerId, type, key);
    }
  };

  const handleLocationConfirm = (x: number, y: number, reason: string) => {
    if (pendingStat) {
       // Commit the stat update
       setPlayers(prev => prev.map(p => {
         if (p.id === pendingStat.playerId) {
           const newVal = (p.stats[pendingStat.key] || 0) + pendingStat.delta;
           return { ...p, stats: { ...p.stats, [pendingStat.key]: newVal } };
         }
         return p;
       }));
       
       // Log with location
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
     setPendingStat({ playerId: id, key: 'penaltiesConceded', delta: 0 }); // Placeholder to store ID
  };

  const confirmCard = (playerId: string, reason: string) => {
     const type = cardModal.type;
     setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
           return {
              ...p,
              cardStatus: type || 'none',
              isOnField: false, // Sent off
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
           if (nextState) {
              // Going ON
              addLogEntry(id, 'substitution', 'Interchange ON');
              return { ...p, isOnField: true, lastSubTime: matchTime };
           } else {
              // Going OFF
              addLogEntry(id, 'substitution', 'Interchange OFF');
              return { ...p, isOnField: false };
           }
        }
        return p;
     }));
  };

  const handleBigPlayOpen = (id: string) => {
     setBigPlayModal({ isOpen: true, playerId: id });
  };

  const confirmBigPlay = (stat: StatKey, desc: string) => {
     const id = bigPlayModal.playerId;
     // Update stat
     updateStat(id, stat, 1, true);
     // Log
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
       const cleanPlayers = JSON.parse(JSON.stringify(players));
       const cleanLog = JSON.parse(JSON.stringify(gameLog));
       
       const matchData = {
          date: new Date().toISOString().split('T')[0],
          teamName: teamName || 'My Team',
          opponentName: opponentName || 'Opponent',
          finalScore: `${teamScore} - ${opponentScore}`,
          result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
          data: {
             players: cleanPlayers,
             gameLog: cleanLog,
             matchTime,
             period,
             sets: { completed: completedSets, total: totalSets }
          },
          voting: votes || null
       };
       onFinish(matchData);
     } catch (err) {
       console.error("Error packaging match data:", err);
       alert("An error occurred finishing the match. Data has been logged to console.");
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
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F0F10] pb-40 font-sans">
       {/* Sticky Header */}
       <header className="bg-white dark:bg-[#1A1A1C] sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 shadow-sm transition-all">
          <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
             
             {/* LEFT: BACK & TIMER (Auto Width) */}
             <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                 {/* Back Button */}
                 <button 
                    onClick={onExit}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    title="Back to Home"
                 >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                 </button>

                 <div className="flex flex-col items-center relative shrink-0">
                    <button 
                      onClick={() => setIsRunning(!isRunning)}
                      className={`relative flex flex-col items-center justify-center w-32 py-2 rounded-xl border-2 transition-all duration-200 group active:scale-95 shadow-sm ${
                        isRunning 
                          ? 'bg-white dark:bg-[#1A1A1C] border-red-500 text-red-500' 
                          : 'bg-green-500 border-green-600 text-white hover:bg-green-600 hover:shadow-md'
                      } ${timerError ? 'animate-shake' : ''}`}
                    >
                       <span className="text-3xl font-mono font-black tracking-tight leading-none">{formattedTime}</span>
                    </button>
                    
                    {/* Warning Tooltip */}
                    {!isRunning && (
                       <div className="absolute top-full mt-2 w-full z-50">
                          <div className="bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-bold py-1 px-1 rounded-md border border-red-100 dark:border-red-900/50 text-center whitespace-nowrap shadow-sm animate-bounce w-full overflow-hidden text-ellipsis">
                             Start Timer
                          </div>
                       </div>
                    )}
                 </div>
             </div>

             {/* MIDDLE: SCOREBOARD & SETS (Flex Grow - Takes all available space) */}
             <div className="flex-1 flex flex-col items-center justify-center min-w-0 overflow-hidden">
                {/* Teams & Scores */}
                <div className="flex items-center justify-center w-full space-x-1 sm:space-x-3">
                   
                   {/* Home Team - Flex Grow to Left */}
                   <div className="flex items-center justify-end flex-1 min-w-0 space-x-1.5 sm:space-x-2">
                      <input 
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="bg-transparent text-right font-heading font-bold text-sm sm:text-lg md:text-xl text-slate-900 dark:text-white w-full min-w-[40px] focus:outline-none focus:border-b border-transparent focus:border-gray-300 transition-colors placeholder-gray-400 truncate"
                        placeholder="Home"
                      />
                      <div className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-blue-600 dark:text-blue-400 leading-none shrink-0 w-[30px] sm:w-[40px] text-center">{teamScore}</div>
                   </div>
                   
                   {/* VS */}
                   <div className="text-gray-300 text-sm sm:text-lg font-light pb-1 shrink-0 px-1">-</div>

                   {/* Away Team - Flex Grow to Right */}
                   <div className="flex items-center justify-start flex-1 min-w-0 space-x-1.5 sm:space-x-2">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-red-500 dark:text-red-400 leading-none shrink-0 w-[30px] sm:w-[40px] text-center">{opponentScore}</div>
                      
                      {/* Score Controls - Moved closer to name */}
                      <div className="flex flex-col space-y-0.5 shrink-0 z-10">
                         <div className="flex space-x-0.5">
                            <button onClick={() => setOpponentScore(opponentScore + 4)} className="w-5 h-4 bg-gray-100 dark:bg-white/10 hover:bg-green-100 text-[8px] font-bold rounded-tl text-gray-600 flex items-center justify-center" title="Add Try (+4)">+T</button>
                            <button onClick={() => setOpponentScore(opponentScore + 2)} className="w-5 h-4 bg-gray-100 dark:bg-white/10 hover:bg-green-100 text-[8px] font-bold rounded-tr text-gray-600 flex items-center justify-center" title="Add Kick (+2)">+K</button>
                         </div>
                         <div className="flex space-x-0.5">
                            <button onClick={() => setOpponentScore(opponentScore + 1)} className="w-5 h-4 bg-gray-100 dark:bg-white/10 hover:bg-green-100 text-[8px] font-bold rounded-bl text-gray-600 flex items-center justify-center" title="Add Point (+1)">+1</button>
                            <button onClick={() => setOpponentScore(Math.max(0, opponentScore - 1))} className="w-5 h-4 bg-gray-100 dark:bg-white/10 hover:bg-red-100 text-[8px] font-bold rounded-br text-gray-600 flex items-center justify-center" title="Remove Point (-1)">-1</button>
                         </div>
                      </div>

                      <input 
                        value={opponentName}
                        onChange={(e) => setOpponentName(e.target.value)}
                        className="bg-transparent text-left font-heading font-bold text-sm sm:text-lg md:text-xl text-slate-900 dark:text-white w-full min-w-[40px] focus:outline-none focus:border-b border-transparent focus:border-gray-300 transition-colors placeholder-gray-400 truncate"
                        placeholder="Away"
                      />
                   </div>
                </div>

                {/* Set Counter */}
                <div className={`flex items-center space-x-3 mt-1 bg-gray-50 dark:bg-white/5 px-2 sm:px-3 py-0.5 rounded-full border border-gray-100 dark:border-white/5 transition-opacity ${!isRunning ? 'opacity-30 pointer-events-none' : ''}`}>
                   <button 
                     onClick={handleSetComplete}
                     className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                     title="Complete Set"
                  >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </button>
                   
                   <div className="flex items-baseline space-x-1.5">
                      <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-gray-200 font-mono tracking-tight">{completedSets}/{totalSets}</span>
                      <span className={`text-[8px] sm:text-[9px] font-bold ${completionRate >= 80 ? 'text-green-500' : completionRate >= 65 ? 'text-yellow-500' : 'text-red-500'}`}>
                         ({completionRate}%)
                      </span>
                   </div>

                   <button 
                     onClick={handleSetIncomplete}
                     className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                     title="Incomplete Set"
                  >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
             </div>

             {/* RIGHT: ACTIONS (Auto Width) */}
             <div className="flex justify-end shrink-0">
                <Button 
                  onClick={handlePeriodEnd} 
                  variant="secondary"
                  className="px-2 sm:px-4 py-2 h-auto text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 border-none shadow-sm whitespace-nowrap min-w-[70px] sm:min-w-[80px]"
                >
                   {period === '1st' ? 'End 1st' : 'End Match'}
                </Button>
             </div>
          </div>
       </header>

       {/* Main Content - Greyed out when !isRunning */}
       <main className={`w-full max-w-[1920px] mx-auto px-2 sm:px-4 pt-4 transition-all duration-300 ${!isRunning ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
          <div className="bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                     <tr>
                        <th className="p-3 text-left w-12 sticky left-0 z-10 bg-gray-50 dark:bg-[#1A1A1C]">#</th>
                        <th className="p-3 text-left min-w-[150px] sticky left-[48px] z-10 bg-gray-50 dark:bg-[#1A1A1C]">Player</th>
                        {INITIAL_STATS && Object.keys(INITIAL_STATS).slice(0, 6).map(k => (
                           <th key={k} className="p-3 text-center min-w-[115px] text-xs font-bold text-gray-500 uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                        ))}
                        <th className="p-3 text-center w-24 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase text-xs tracking-wider sticky right-0 z-10">Impact</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                     {players.map((p, i) => (
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

          <MatchEventLog events={gameLog} />
       </main>

       {/* Sticky Bottom Action Bar - High Z-Index to stay on top, disabled when not running */}
       <div className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1A1A1C]/95 backdrop-blur-md border-t border-gray-200 dark:border-white/10 p-4 z-[60] shadow-[0_-10px_20px_rgba(0,0,0,0.1)] transition-all duration-300 ${!isRunning ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
          <div className="max-w-4xl mx-auto flex items-center justify-center space-x-4">
             <button 
               onClick={() => setCardModal({ isOpen: true, type: 'yellow' })}
               className="flex flex-col items-center justify-center w-20 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-900/30 hover:bg-yellow-100 transition-colors group active:scale-95"
             >
                <div className="w-6 h-8 bg-yellow-400 rounded-sm shadow-sm group-hover:scale-110 transition-transform mb-1"></div>
                <span className="text-[9px] font-bold text-yellow-700 dark:text-yellow-500 uppercase">Yellow</span>
             </button>

             <button 
               onClick={() => setCardModal({ isOpen: true, type: 'red' })}
               className="flex flex-col items-center justify-center w-20 h-16 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/30 hover:bg-red-100 transition-colors group active:scale-95"
             >
                <div className="w-6 h-8 bg-red-600 rounded-sm shadow-sm group-hover:scale-110 transition-transform mb-1"></div>
                <span className="text-[9px] font-bold text-red-700 dark:text-red-500 uppercase">Red</span>
             </button>

             <div className="w-px h-10 bg-gray-200 dark:bg-white/10 mx-2"></div>

             <button 
               onClick={() => setBigPlayModal({ isOpen: true, playerId: players.find(p => p.isOnField)?.id || players[0].id })} // Default to first on field
               className="flex-1 max-w-xs h-16 bg-slate-900 dark:bg-white rounded-xl shadow-lg flex items-center justify-center space-x-3 hover:scale-[1.02] transition-transform active:scale-95"
             >
                <span className="text-2xl">⚡</span>
                <div className="flex flex-col items-start">
                   <span className="text-white dark:text-slate-900 font-bold text-sm">Log Impact Play</span>
                   <span className="text-white/60 dark:text-slate-500 text-[10px] uppercase tracking-wider">Select Player</span>
                </div>
             </button>
          </div>
       </div>

       {/* Modals */}
       <TeamSelectionModal 
          isOpen={isTeamModalOpen} 
          squad={squad} 
          onConfirm={handleTeamSelection} 
          onCancel={() => setIsTeamModalOpen(false)} 
       />
       
       <LocationPickerModal 
          isOpen={locModal.isOpen} 
          title="Tap Location"
          stat={locModal.stat}
          onConfirm={handleLocationConfirm}
          onCancel={() => { setLocModal({ isOpen: false }); setPendingStat(null); }}
       />

       <CardAssignmentModal 
          isOpen={cardModal.isOpen} 
          type={cardModal.type} 
          players={players} 
          onConfirm={confirmCard} 
          onCancel={() => { setCardModal({ isOpen: false, type: null }); setPendingStat(null); }} 
       />

       <BigPlayModal 
          isOpen={bigPlayModal.isOpen} 
          player={players.find(p => p.id === bigPlayModal.playerId) || players[0]} // Fallback to avoid null
          players={players}
          onPlayerChange={(id) => setBigPlayModal(prev => ({ ...prev, playerId: id }))}
          onConfirm={confirmBigPlay} 
          onClose={() => setBigPlayModal({ isOpen: false, playerId: '' })} 
       />

       <ConfirmationModal 
          isOpen={isConfirmEndOpen} 
          title={period === '1st' ? "End 1st Half?" : "End Match?"}
          message={period === '1st' ? "This will pause the timer and switch to 2nd Half." : "This will conclude the session. You can proceed to voting."} 
          onConfirm={confirmPeriodEndAction} 
          onCancel={() => setIsConfirmEndOpen(false)} 
       />

       <VotingModal 
          isOpen={isVotingOpen} 
          players={players} 
          onConfirm={finishMatch} 
          onSkip={() => finishMatch(null)} 
       />
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

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Load Data (handled by subscriptions below)
      } else {
        setSquad([]);
        setHistory([]);
        setTrainingHistory([]);
        setPlaybook([]);
      }
    });
    return unsubscribe;
  }, []);

  // Theme Effect
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Check for active match on mount
  useEffect(() => {
    loadActiveMatchState().then(data => {
      if (data) setHasResumableMatch(true);
    });
  }, []);

  // Subscriptions to subcollections
  useEffect(() => {
    if (!user) return;
    
    // Squad
    const qSquad = query(collection(db, `users/${user.uid}/squad`), orderBy('name'));
    const unsubSquad = onSnapshot(qSquad, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SquadPlayer));
      setSquad(list);
    });

    // Matches
    const qMatches = query(collection(db, `users/${user.uid}/matches`), orderBy('date', 'desc'));
    const unsubMatches = onSnapshot(qMatches, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchHistoryItem));
      setHistory(list);
    });

    // Training
    const qTraining = query(collection(db, `users/${user.uid}/training`), orderBy('date', 'desc'));
    const unsubTraining = onSnapshot(qTraining, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession));
      setTrainingHistory(list);
    });

    // Playbook
    const qPlaybook = query(collection(db, `users/${user.uid}/playbook`), orderBy('createdAt', 'desc'));
    const unsubPlaybook = onSnapshot(qPlaybook, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PlaybookItem));
        setPlaybook(list);
    });

    return () => {
      unsubSquad();
      unsubMatches();
      unsubTraining();
      unsubPlaybook();
    };
  }, [user]);

  // Handlers
  const handleNewMatch = () => setActiveMatch({}); // Empty object signifies new match
  
  const handleResumeMatch = async () => {
    const data = await loadActiveMatchState();
    if (data) {
      setActiveMatch(data);
    } else {
      setHasResumableMatch(false);
    }
  };

  const handleExitMatch = () => {
    setActiveMatch(null);
    setHasResumableMatch(true); 
  };

  const handleDiscardMatch = async () => {
    setActiveMatch(null);
    setHasResumableMatch(false);
    await clearActiveMatchState();
  };

  const handleFinishMatch = async (matchData: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/matches`), matchData);
      await clearActiveMatchState();
      setActiveMatch(null);
      setHasResumableMatch(false);
    } catch (e) {
      console.error("Error saving match", e);
      alert("Error saving match. Check console.");
    }
  };

  // Squad Handlers
  const handleAddSquadPlayer = async (p: any) => {
    if(!user) return;
    await addDoc(collection(db, `users/${user.uid}/squad`), { ...p, createdAt: Date.now() });
  };
  const handleRemoveSquadPlayer = async (id: string) => {
    if(!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/squad`, id));
  };
  const handleUpdateSquadPlayer = async (id: string, updates: any) => {
    if(!user) return;
    await updateDoc(doc(db, `users/${user.uid}/squad`, id), updates);
  };

  // Training Handlers
  const handleSaveTraining = async (session: any) => {
    if(!user) return;
    await addDoc(collection(db, `users/${user.uid}/training`), session);
  };
  const handleUpdateTraining = async (id: string, updates: any) => {
    if(!user) return;
    await updateDoc(doc(db, `users/${user.uid}/training`, id), updates);
  };
  const handleDeleteTraining = async (id: string) => {
    if(!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/training`, id));
  };

  // Playbook Handlers
  const handleAddPlaybookItem = async (item: any) => {
    if(!user) return;
    await addDoc(collection(db, `users/${user.uid}/playbook`), item);
  };
  const handleDeletePlaybookItem = async (id: string) => {
    if(!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/playbook`, id));
  };

  const handleDeleteMatch = async (id: string) => {
    if(!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/matches`, id));
  }

  const handleEditVotes = (match: MatchHistoryItem) => {
     setEditingVoteMatch(match);
  };

  const handleUpdateVotes = async (votes: any) => {
    if (!user || !editingVoteMatch) return;
    try {
        await updateDoc(doc(db, `users/${user.uid}/matches`, editingVoteMatch.id), {
            voting: votes
        });
        setEditingVoteMatch(null);
    } catch (e) {
        console.error("Error updating votes", e);
    }
  };

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (activeMatch) {
    return (
      <MatchTracker 
        initialState={Object.keys(activeMatch).length > 0 ? activeMatch : undefined}
        squad={squad}
        onFinish={handleFinishMatch}
        onDiscard={handleDiscardMatch}
        onExit={handleExitMatch}
      />
    );
  }

  if (viewingMatch) {
    // Process match data for charts
    const { players, gameLog, matchTime } = viewingMatch.data;
    const scores = viewingMatch.finalScore.split(' - ').map(s => parseInt(s.trim()));
    const leftScore = scores[0] || 0;
    const rightScore = scores[1] || 0;

    const chartData = {
      players,
      leftScore,
      rightScore,
      possessionSeconds: matchTime / 2, // Estimate if not tracked
      matchTime,
      teamName: viewingMatch.teamName,
      opponentName: viewingMatch.opponentName,
      gameLog
    };

    return (
      <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F0F10] flex flex-col">
        <div className="bg-white dark:bg-[#1A1A1C] p-4 shadow-sm border-b border-gray-200 dark:border-white/10 flex justify-between items-center sticky top-0 z-50">
           <button onClick={() => setViewingMatch(null)} className="flex items-center text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-bold">
             <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             Back to Dashboard
           </button>
           <h2 className="font-heading font-bold text-slate-900 dark:text-white hidden sm:block">Match Report</h2>
           <div className="w-20"></div> 
        </div>
        <div className="flex-1 overflow-hidden">
           <MatchCharts matchData={chartData} />
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
        onEditMatchVotes={handleEditVotes}
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
          onConfirm={handleUpdateVotes}
          onSkip={() => setEditingVoteMatch(null)}
        />
      )}
    </>
  );
};
