
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
// (Included here to keep file count static as per requirements)

interface MatchTrackerProps {
  initialState?: any;
  squad: SquadPlayer[];
  onFinish: (matchData: any) => void;
  onDiscard: () => void;
}

const MatchTracker: React.FC<MatchTrackerProps> = ({ initialState, squad, onFinish, onDiscard }) => {
  // State
  const [players, setPlayers] = useState<Player[]>(initialState?.players || createInitialPlayers());
  const [gameLog, setGameLog] = useState<GameLogEntry[]>(initialState?.gameLog || []);
  const [matchTime, setMatchTime] = useState(initialState?.matchTime || 0);
  const [isRunning, setIsRunning] = useState(initialState?.isRunning || false);
  const [period, setPeriod] = useState<'1st' | '2nd'>(initialState?.period || '1st');
  const [opponentScore, setOpponentScore] = useState(initialState?.opponentScore || 0);
  const [teamName, setTeamName] = useState(initialState?.teamName || localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'My Team');
  const [opponentName, setOpponentName] = useState(initialState?.opponentName || 'Opponent');
  
  // UI State
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(!initialState); // Open if new match
  const [isConfirmEndOpen, setIsConfirmEndOpen] = useState(false);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  
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
                // But typically sin bin time doesn't count towards "Seconds On Field" for stats?
                // Let's assume it doesn't.
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
      players, gameLog, matchTime, isRunning, period, opponentScore, teamName, opponentName
    });
  }, [players, gameLog, matchTime, isRunning, period, opponentScore, teamName, opponentName]);

  // Derived Stats
  const teamScore = players.reduce((acc, p) => acc + (p.stats.triesScored * 4) + (p.stats.kicks * 2), 0);
  const formattedTime = `${Math.floor(matchTime / 60).toString().padStart(2, '0')}:${(matchTime % 60).toString().padStart(2, '0')}`;

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
     addLogEntry(id, 'big_play', desc, undefined, 1); // We can refine impact score later
     setBigPlayModal({ isOpen: false, playerId: '' });
  };

  const finishMatch = (votes: any) => {
     const matchData = {
        date: new Date().toISOString().split('T')[0],
        teamName,
        opponentName,
        finalScore: `${teamScore} - ${opponentScore}`,
        result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
        data: {
           players,
           gameLog,
           matchTime,
           period
        },
        voting: votes
     };
     onFinish(matchData);
  };

  // Calculations for UI
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
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0F0F10] pb-24 font-sans">
       {/* Sticky Header */}
       <header className="bg-white/90 dark:bg-[#1A1A1C]/90 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200 dark:border-white/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
             <div className="flex items-center space-x-4">
                <div className="text-center">
                   <input 
                     value={teamName} 
                     onChange={(e) => setTeamName(e.target.value)}
                     className="bg-transparent font-heading font-black text-xl text-right text-slate-900 dark:text-white w-32 focus:outline-none placeholder-gray-400"
                     placeholder="Home"
                   />
                   <div className="text-3xl font-heading font-black text-blue-600 leading-none">{teamScore}</div>
                </div>
                <div className="flex flex-col items-center px-4">
                   <div className="bg-gray-100 dark:bg-white/10 rounded-lg px-4 py-1 font-mono font-bold text-2xl text-slate-900 dark:text-white mb-1 min-w-[100px] text-center">
                      {formattedTime}
                   </div>
                   <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setIsRunning(!isRunning)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-white shadow-sm transition-transform active:scale-95 ${isRunning ? 'bg-yellow-500' : 'bg-green-500'}`}
                      >
                         {isRunning ? '||' : '▶'}
                      </button>
                      <span className="text-xs font-bold text-gray-400 uppercase">{period}</span>
                   </div>
                </div>
                <div className="text-center">
                   <input 
                     value={opponentName} 
                     onChange={(e) => setOpponentName(e.target.value)}
                     className="bg-transparent font-heading font-black text-xl text-left text-slate-900 dark:text-white w-32 focus:outline-none placeholder-gray-400"
                     placeholder="Away"
                   />
                   <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => setOpponentScore(Math.max(0, opponentScore - 1))} className="text-gray-400 hover:text-red-500">-</button>
                      <div className="text-3xl font-heading font-black text-red-500 leading-none">{opponentScore}</div>
                      <button onClick={() => setOpponentScore(opponentScore + 4)} className="text-gray-400 hover:text-green-500 text-xs font-bold">+T</button>
                      <button onClick={() => setOpponentScore(opponentScore + 2)} className="text-gray-400 hover:text-green-500 text-xs font-bold">+K</button>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={() => setIsTeamModalOpen(true)} className="hidden md:block text-xs">Roster</Button>
                <Button onClick={() => setIsConfirmEndOpen(true)} className="bg-red-600 hover:bg-red-700 text-xs">End Match</Button>
             </div>
          </div>
       </header>

       {/* Main Content */}
       <main className="max-w-7xl mx-auto px-2 sm:px-4 pt-4">
          <div className="bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                     <tr>
                        <th className="p-3 text-left w-12 sticky left-0 z-10 bg-gray-50 dark:bg-[#1A1A1C]">#</th>
                        <th className="p-3 text-left min-w-[150px] sticky left-[48px] z-10 bg-gray-50 dark:bg-[#1A1A1C]">Player</th>
                        {INITIAL_STATS && Object.keys(INITIAL_STATS).slice(0, 6).map(k => (
                           <th key={k} className="p-3 text-center min-w-[130px] text-xs font-bold text-gray-500 uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                        ))}
                        <th className="p-3 text-center w-20">Impact</th>
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
          player={players.find(p => p.id === bigPlayModal.playerId) || null} 
          onConfirm={confirmBigPlay} 
          onClose={() => setBigPlayModal({ isOpen: false, playerId: '' })} 
       />

       <ConfirmationModal 
          isOpen={isConfirmEndOpen} 
          title="End Match?" 
          message="This will conclude the session. You can proceed to voting." 
          onConfirm={() => { setIsConfirmEndOpen(false); setIsVotingOpen(true); setIsRunning(false); }} 
          onCancel={() => setIsConfirmEndOpen(false)} 
       />

       <VotingModal 
          isOpen={isVotingOpen} 
          players={players} 
          onConfirm={finishMatch} 
          onSkip={() => finishMatch(undefined)} 
       />
    </div>
  );
};

// --- APP COMPONENT ---

export const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  // App Data
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [training, setTraining] = useState<TrainingSession[]>([]);
  const [playbook, setPlaybook] = useState<PlaybookItem[]>([]);

  // UI State
  const [viewingMatch, setViewingMatch] = useState<MatchHistoryItem | null>(null);
  const [activeMatch, setActiveMatch] = useState<any>(null);

  // Theme Toggle
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    // Load active match from IndexedDB
    loadActiveMatchState().then(state => {
       if (state) setActiveMatch(state);
    });

    const squadUnsub = onSnapshot(query(collection(db, `users/${user.uid}/squad`), orderBy('name')), (snap) => {
       setSquad(snap.docs.map(d => ({ id: d.id, ...d.data() } as SquadPlayer)));
    });

    const historyUnsub = onSnapshot(query(collection(db, `users/${user.uid}/matches`), orderBy('date', 'desc')), (snap) => {
       setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchHistoryItem)));
    });

    const trainingUnsub = onSnapshot(query(collection(db, `users/${user.uid}/training`), orderBy('date', 'desc')), (snap) => {
       setTraining(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession)));
    });

    const playbookUnsub = onSnapshot(query(collection(db, `users/${user.uid}/playbook`), orderBy('createdAt', 'desc')), (snap) => {
       setPlaybook(snap.docs.map(d => ({ id: d.id, ...d.data() } as PlaybookItem)));
    });

    return () => {
       squadUnsub();
       historyUnsub();
       trainingUnsub();
       playbookUnsub();
    };
  }, [user]);

  // Handlers
  const handleNewMatch = () => {
     setActiveMatch({}); // Empty object triggers new match mode
  };

  const handleResumeMatch = () => {
     // Already handled by state, but button calls this to ensure UI switches
  };

  const handleDiscardMatch = async () => {
     if (window.confirm("Discard current match? Data will be lost.")) {
        await clearActiveMatchState();
        setActiveMatch(null);
     }
  };

  const handleMatchFinish = async (matchData: any) => {
     if (!user) return;
     try {
        await addDoc(collection(db, `users/${user.uid}/matches`), matchData);
        await clearActiveMatchState();
        setActiveMatch(null);
     } catch (e) {
        console.error("Error saving match:", e);
        alert("Failed to save match. Check console.");
     }
  };

  // Squad Handlers
  const handleAddSquadPlayer = async (player: any) => {
     if (!user) return;
     await addDoc(collection(db, `users/${user.uid}/squad`), { ...player, createdAt: Date.now() });
  };
  const handleRemoveSquadPlayer = async (id: string) => {
     if (!user) return;
     await deleteDoc(doc(db, `users/${user.uid}/squad`, id));
  };
  const handleUpdateSquadPlayer = async (id: string, updates: any) => {
     if (!user) return;
     await updateDoc(doc(db, `users/${user.uid}/squad`, id), updates);
  };

  // Other Handlers
  const handleDeleteMatch = async (id: string) => {
     if (!user) return;
     await deleteDoc(doc(db, `users/${user.uid}/matches`, id));
  };

  const handleUpdateMatch = async (match: MatchHistoryItem) => {
     // For editing votes etc
     if (!user) return;
     setViewingMatch(null); // Close modal if open
     // TODO: Implement edit modal if needed, or just update votes directly
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#0F0F10]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
  }

  if (!user) {
     return <AuthScreen onLogin={() => {}} />;
  }

  if (activeMatch) {
     return (
        <MatchTracker 
           initialState={Object.keys(activeMatch).length > 0 ? activeMatch : undefined}
           squad={squad}
           onFinish={handleMatchFinish}
           onDiscard={handleDiscardMatch}
        />
     );
  }

  return (
    <>
      <Dashboard 
         currentUser={user.displayName || 'Coach'}
         hasActiveMatch={!!activeMatch}
         history={history}
         squad={squad}
         onNewMatch={handleNewMatch}
         onResumeMatch={handleResumeMatch}
         onDiscardActiveMatch={handleDiscardMatch}
         onViewMatch={setViewingMatch}
         onDeleteMatch={handleDeleteMatch}
         onEditMatchVotes={(m) => { /* TODO */ }}
         onLogout={handleLogout}
         onAddSquadPlayer={handleAddSquadPlayer}
         onRemoveSquadPlayer={handleRemoveSquadPlayer}
         onUpdateSquadPlayer={handleUpdateSquadPlayer}
         darkMode={darkMode}
         toggleTheme={() => setDarkMode(!darkMode)}
         trainingHistory={training}
         onSaveTrainingSession={(s) => addDoc(collection(db, `users/${user.uid}/training`), s)}
         onUpdateTrainingSession={(id, u) => updateDoc(doc(db, `users/${user.uid}/training`, id), u)}
         onDeleteTrainingSession={(id) => deleteDoc(doc(db, `users/${user.uid}/training`, id))}
         playbook={playbook}
         onAddPlaybookItem={(p) => addDoc(collection(db, `users/${user.uid}/playbook`), p)}
         onDeletePlaybookItem={(id) => deleteDoc(doc(db, `users/${user.uid}/playbook`, id))}
      />

      {viewingMatch && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingMatch(null)} />
            <div className="relative bg-white dark:bg-[#1A1A1C] w-full max-w-5xl h-[85vh] flex flex-col rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1A1C] z-10 shrink-0">
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Match Analysis</h2>
                  <button onClick={() => setViewingMatch(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
               </div>
               <div className="flex-1 overflow-hidden flex flex-col bg-[#F5F5F7] dark:bg-[#0F0F10]">
                  <MatchCharts matchData={{ 
                     players: viewingMatch.data.players || [], 
                     leftScore: parseInt(viewingMatch.finalScore.split('-')[0]), 
                     rightScore: parseInt(viewingMatch.finalScore.split('-')[1]), 
                     possessionSeconds: (viewingMatch.data.matchTime || 0) * 0.5, 
                     matchTime: viewingMatch.data.matchTime || 0, 
                     teamName: viewingMatch.teamName, 
                     opponentName: viewingMatch.opponentName, 
                     gameLog: viewingMatch.data.gameLog || [] 
                  }} />
               </div>
            </div>
         </div>
      )}
    </>
  );
};
