
import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { PlayerRow } from './components/PlayerRow';
import { TeamSelectionModal } from './components/TeamSelectionModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CardAssignmentModal } from './components/CardAssignmentModal';
import { MatchCharts } from './components/MatchCharts';
import { Button } from './components/Button';
import { 
  Player, 
  PlayerStats, 
  StatKey, 
  MatchHistoryItem, 
  SquadPlayer, 
  TrainingSession,
  GameLogEntry 
} from './types';
import { INITIAL_STATS, STAT_CONFIGS, TEAM_SIZE } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  orderBy 
} from 'firebase/firestore';

export const App: React.FC = () => {
  // --- THEME ---
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- AUTH ---
  const [user, setUser] = useState<User | null>(null);
  const [userDisplay, setUserDisplay] = useState('Coach');
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Initial fallback to auth profile or email
      if (u) {
        setUserDisplay(u.displayName || u.email?.split('@')[0] || 'Coach');
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // --- USER PROFILE LISTENER (Fix for Username Display) ---
  useEffect(() => {
    if (!user) return;
    
    // Listen to the user's profile document in Firestore
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Priority: Database Username -> Auth Profile Name -> Email Prefix
        if (data.username) {
          setUserDisplay(data.username);
        } else if (user.displayName) {
          setUserDisplay(user.displayName);
        } else {
          setUserDisplay(user.email?.split('@')[0] || 'Coach');
        }

        // Also sync other profile settings if they exist
        if (data.clubName) localStorage.setItem('RUGBY_TRACKER_CLUB_NAME', data.clubName);
        if (data.logo) localStorage.setItem('RUGBY_TRACKER_LOGO', data.logo);
      }
    });
    
    return () => unsubProfile();
  }, [user]);

  // --- DATA ---
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<TrainingSession[]>([]);

  useEffect(() => {
    if (!user) {
        setSquad([]);
        setMatchHistory([]);
        setTrainingHistory([]);
        return;
    }

    const squadRef = collection(db, 'users', user.uid, 'squad');
    const unsubSquad = onSnapshot(query(squadRef, orderBy('name')), (snap) => {
        setSquad(snap.docs.map(d => ({ id: d.id, ...d.data() } as SquadPlayer)));
    });

    const matchesRef = collection(db, 'users', user.uid, 'matches');
    const unsubMatches = onSnapshot(query(matchesRef, orderBy('date', 'desc')), (snap) => {
        setMatchHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchHistoryItem)));
    });

    const trainingRef = collection(db, 'users', user.uid, 'training');
    const unsubTraining = onSnapshot(query(trainingRef, orderBy('date', 'desc')), (snap) => {
        setTrainingHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as TrainingSession)));
    });

    return () => {
        unsubSquad();
        unsubMatches();
        unsubTraining();
    };
  }, [user]);

  // --- STATE: NAVIGATION & MATCH ---
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'tracker'>('dashboard');
  
  // Active Match State
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponentName, setOpponentName] = useState('');
  const [matchTime, setMatchTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [period, setPeriod] = useState<'1st' | '2nd'>('1st');
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [opponentScore, setOpponentScore] = useState(0);
  
  // Modals
  const [isTeamSelectOpen, setIsTeamSelectOpen] = useState(false);
  const [isEndHalfModalOpen, setIsEndHalfModalOpen] = useState(false);
  const [isEndMatchModalOpen, setIsEndMatchModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [viewingMatch, setViewingMatch] = useState<MatchHistoryItem | null>(null);
  
  // Card Assignment State
  const [cardType, setCardType] = useState<'yellow' | 'red' | null>(null);
  const [selectedCardPlayerId, setSelectedCardPlayerId] = useState<string>('');

  // Check for saved match on init
  useEffect(() => {
    const saved = localStorage.getItem('ACTIVE_MATCH_STATE');
    if (saved) {
       const state = JSON.parse(saved);
       setActiveMatchId(state.id);
    }
  }, []);

  const hasActiveMatch = !!activeMatchId;

  // --- ACTIONS ---

  const handleLogout = () => signOut(auth);

  const handleAddSquadPlayer = async (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'squad'), {
        ...player,
        createdAt: Date.now()
    });
  };

  const handleRemoveSquadPlayer = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'squad', id));
  };

  const handleUpdateSquadPlayer = async (id: string, updates: Partial<SquadPlayer>) => {
    if (!user) return;
    const playerRef = doc(db, 'users', user.uid, 'squad', id);
    await updateDoc(playerRef, updates);
  };

  const handleSaveTrainingSession = async (session: Omit<TrainingSession, 'id'>) => {
      if (!user) return;
      await addDoc(collection(db, 'users', user.uid, 'training'), session);
  };
  
  const handleDeleteTrainingSession = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'training', id));
  };

  const handleDeleteHistoryMatch = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'matches', id));
  };

  // Match Management
  const handleNewMatchClick = () => {
    setIsTeamSelectOpen(true);
  };

  const saveActiveState = useCallback((
      p: Player[], 
      t: number, 
      per: '1st' | '2nd', 
      log: GameLogEntry[], 
      oppScore: number, 
      oppName: string,
      id: string
  ) => {
      localStorage.setItem('ACTIVE_MATCH_STATE', JSON.stringify({
          players: p,
          matchTime: t,
          period: per,
          gameLog: log,
          opponentScore: oppScore,
          opponentName: oppName,
          id: id,
          date: new Date().toISOString()
      }));
  }, []);

  const handleStartMatch = (selections: { jersey: string; squadId: string; name: string }[]) => {
    const newPlayers: Player[] = Array.from({ length: TEAM_SIZE }, (_, i) => {
        const jersey = (i + 1).toString();
        const selection = selections.find(s => s.jersey === jersey);
        return {
            id: `player-${i}`,
            name: selection ? selection.name : '',
            number: jersey,
            squadId: selection ? selection.squadId : undefined,
            stats: { ...INITIAL_STATS },
            cardStatus: 'none',
            isOnField: i < 13
        };
    });

    const newId = Date.now().toString();
    const newOpponent = 'Opponent';

    setPlayers(newPlayers);
    setOpponentName(newOpponent);
    setMatchTime(0);
    setPeriod('1st');
    setGameLog([]);
    setOpponentScore(0);
    setActiveMatchId(newId);
    setIsTimerRunning(false);
    
    saveActiveState(newPlayers, 0, '1st', [], 0, newOpponent, newId);
    
    setIsTeamSelectOpen(false);
    setCurrentScreen('tracker');
  };

  const handleResumeMatch = () => {
      const saved = localStorage.getItem('ACTIVE_MATCH_STATE');
      if (saved) {
          const state = JSON.parse(saved);
          setPlayers(state.players);
          setMatchTime(state.matchTime);
          setPeriod(state.period);
          setGameLog(state.gameLog);
          setOpponentScore(state.opponentScore);
          setOpponentName(state.opponentName);
          setActiveMatchId(state.id);
          setCurrentScreen('tracker');
      }
  };

  const handleDiscardActiveMatch = () => {
      if (window.confirm("Are you sure you want to discard the current live match?")) {
          localStorage.removeItem('ACTIVE_MATCH_STATE');
          setActiveMatchId(null); 
          setCurrentScreen('dashboard');
      }
  };
  
  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Persist state when meaningful changes occur
  useEffect(() => {
      if (currentScreen === 'tracker' && activeMatchId) {
          saveActiveState(players, matchTime, period, gameLog, opponentScore, opponentName, activeMatchId);
      }
  }, [players, matchTime, period, gameLog, opponentScore, opponentName, activeMatchId, currentScreen, saveActiveState]);

  // --- STATS HANDLERS ---
  
  const handleStatChange = (playerId: string, stat: StatKey, delta: number) => {
     setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
           const newVal = (p.stats[stat] || 0) + delta;
           return { ...p, stats: { ...p.stats, [stat]: Math.max(0, newVal) } };
        }
        return p;
     }));
  };

  const handleCardAction = (playerId: string, type: 'yellow' | 'red') => {
      setCardType(type);
      setSelectedCardPlayerId(playerId);
      setIsCardModalOpen(true);
  };
  
  const confirmCardAssignment = (playerId: string, reason: string) => {
      setPlayers(prev => prev.map(p => {
          if (p.id === playerId) {
              return { 
                  ...p, 
                  cardStatus: cardType || 'none',
                  isOnField: false // Sent off/Bin
              };
          }
          return p;
      }));
      // Log event
      const player = players.find(p => p.id === playerId);
      if (player) {
          setGameLog(prev => [...prev, {
              id: Date.now().toString(),
              timestamp: matchTime,
              formattedTime: formatTime(matchTime),
              playerId: player.id,
              playerName: player.name,
              playerNumber: player.number,
              type: cardType === 'yellow' ? 'yellow_card' : 'red_card',
              reason,
              period
          }]);
      }
      setIsCardModalOpen(false);
  };
  
  const handleToggleFieldStatus = (playerId: string) => {
      setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isOnField: !p.isOnField } : p));
  };
  
  const handleViewHistoryMatch = (match: MatchHistoryItem) => {
      setViewingMatch(match);
  };

  // Helpers
  const formatTime = (seconds: number) => {
     const m = Math.floor(seconds / 60);
     const s = seconds % 60;
     return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const teamScore = players.reduce((acc, p) => acc + (p.stats.triesScored * 4) + (p.stats.kicks * 2), 0);
  
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

  if (loadingAuth) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0F0F10] text-gray-500">Loading LeagueLens...</div>;

  if (!user) {
    return <AuthScreen onLogin={() => {}} />; 
  }

  return (
    <>
      {currentScreen === 'dashboard' ? (
        <Dashboard
          currentUser={userDisplay}
          hasActiveMatch={hasActiveMatch}
          history={matchHistory}
          squad={squad}
          onNewMatch={handleNewMatchClick}
          onResumeMatch={handleResumeMatch}
          onDiscardActiveMatch={handleDiscardActiveMatch}
          onViewMatch={handleViewHistoryMatch}
          onDeleteMatch={handleDeleteHistoryMatch}
          onLogout={handleLogout}
          onAddSquadPlayer={handleAddSquadPlayer}
          onRemoveSquadPlayer={handleRemoveSquadPlayer}
          onUpdateSquadPlayer={handleUpdateSquadPlayer}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
          trainingHistory={trainingHistory}
          onSaveTrainingSession={handleSaveTrainingSession}
          onDeleteTrainingSession={handleDeleteTrainingSession}
        />
      ) : (
         /* MATCH TRACKER VIEW */
         <div className="min-h-screen bg-gray-100 dark:bg-[#0F0F10] flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white dark:bg-[#1A1A1C] border-b border-gray-200 dark:border-white/5 sticky top-0 z-20 shadow-sm">
               <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <Button variant="secondary" onClick={() => setCurrentScreen('dashboard')} className="text-sm bg-gray-100 dark:bg-white/10 text-slate-700 dark:text-gray-300">← Back</Button>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Timer</span>
                        <div className="flex items-center space-x-2">
                           <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">{formatTime(matchTime)}</span>
                           <button 
                             onClick={() => setIsTimerRunning(!isTimerRunning)}
                             className={`p-1.5 rounded-full transition-colors ${isTimerRunning ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-green-500 bg-green-50 dark:bg-green-900/20'}`}
                           >
                              {isTimerRunning ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                              )}
                           </button>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                     <div className="text-center">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'Team'}</span>
                        <span className="text-3xl font-heading font-black text-blue-600 dark:text-blue-400">{teamScore}</span>
                     </div>
                     <div className="text-2xl font-bold text-gray-300 dark:text-gray-700">-</div>
                     <div className="text-center group">
                         <input 
                           value={opponentName} 
                           onChange={(e) => setOpponentName(e.target.value)}
                           className="block w-24 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-all placeholder-gray-300" 
                           placeholder="OPPONENT"
                         />
                         <div className="flex items-center space-x-2 justify-center">
                            <button onClick={() => setOpponentScore(Math.max(0, opponentScore - 1))} className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">－</button>
                            <span className="text-3xl font-heading font-black text-slate-900 dark:text-white">{opponentScore}</span>
                            <button onClick={() => setOpponentScore(opponentScore + 1)} className="text-gray-300 hover:text-green-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">＋</button>
                         </div>
                     </div>
                  </div>

                  <div className="flex items-center space-x-3">
                     <span className="px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-slate-700 dark:text-white uppercase tracking-wider">{period} Half</span>
                     <Button 
                        onClick={() => period === '1st' ? setIsEndHalfModalOpen(true) : setIsEndMatchModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-500/30"
                     >
                        {period === '1st' ? 'End 1st Half' : 'End Match'}
                     </Button>
                  </div>
               </div>
            </header>

            {/* Players List */}
            <main className="flex-1 overflow-x-auto p-4 md:p-6">
              <div className="min-w-[1000px] bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-apple dark:shadow-none border border-gray-200 dark:border-white/5 overflow-hidden">
                 <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                       <tr>
                          <th className="p-3 text-left w-16 sticky left-0 z-20 bg-gray-50 dark:bg-[#1A1A1C] backdrop-blur text-xs font-bold text-gray-500 uppercase tracking-wider pl-4">#</th>
                          <th className="p-3 text-left min-w-[160px] sticky left-[64px] z-20 bg-gray-50 dark:bg-[#1A1A1C] backdrop-blur text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                          {Object.values(STAT_CONFIGS).map(cfg => (
                             <th key={cfg.key} className="p-3 text-center min-w-[130px] text-xs font-bold text-gray-500 uppercase tracking-wider">{cfg.label}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                       {players.map((p, i) => (
                          <PlayerRow 
                            key={p.id}
                            player={p}
                            isOdd={i % 2 !== 0}
                            onStatChange={handleStatChange}
                            onIdentityChange={(id, f, v) => {
                               setPlayers(prev => prev.map(pl => pl.id === id ? { ...pl, [f]: v } : pl));
                            }}
                            onCardAction={handleCardAction}
                            onToggleFieldStatus={handleToggleFieldStatus}
                            teamTotals={teamTotals}
                            maxValues={maxValues}
                            leaderCounts={leaderCounts}
                          />
                       ))}
                    </tbody>
                 </table>
              </div>
            </main>
         </div>
      )}

      {/* --- MODALS --- */}
      
      <TeamSelectionModal 
        isOpen={isTeamSelectOpen}
        squad={squad}
        onConfirm={handleStartMatch}
        onCancel={() => setIsTeamSelectOpen(false)}
      />

      <ConfirmationModal 
         isOpen={isEndHalfModalOpen}
         title="End First Half?"
         message="This will pause the timer and switch the period to 2nd Half."
         onConfirm={() => {
            setPeriod('2nd');
            setIsTimerRunning(false);
            setIsEndHalfModalOpen(false);
         }}
         onCancel={() => setIsEndHalfModalOpen(false)}
      />

      <ConfirmationModal 
         isOpen={isEndMatchModalOpen}
         title="End Match?"
         message="This will finalize all stats and save the game to history."
         onConfirm={async () => {
             if (user) {
                 const historyItem: MatchHistoryItem = {
                     id: activeMatchId || Date.now().toString(),
                     date: new Date().toISOString().split('T')[0],
                     teamName: localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'My Team',
                     opponentName: opponentName || 'Opponent',
                     finalScore: `${teamScore} - ${opponentScore}`,
                     result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw',
                     data: {
                         players,
                         gameLog,
                         matchTime,
                         fullMatchStats: players.reduce((acc, p) => ({ ...acc, [p.id]: p.stats }), {})
                     }
                 };
                 await addDoc(collection(db, 'users', user.uid, 'matches'), historyItem);
                 
                 localStorage.removeItem('ACTIVE_MATCH_STATE');
                 setActiveMatchId(null);
                 setCurrentScreen('dashboard');
             }
             setIsEndMatchModalOpen(false);
         }}
         onCancel={() => setIsEndMatchModalOpen(false)}
      />

      <CardAssignmentModal
        isOpen={isCardModalOpen}
        type={cardType}
        players={players}
        onConfirm={confirmCardAssignment}
        onCancel={() => setIsCardModalOpen(false)}
      />

      {viewingMatch && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingMatch(null)} />
            <div className="relative bg-white dark:bg-[#1A1A1C] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Match Analysis</h2>
                  <button onClick={() => setViewingMatch(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
               </div>
               <MatchCharts matchData={{
                  players: viewingMatch.data.players || [], 
                  leftScore: parseInt(viewingMatch.finalScore.split('-')[0]),
                  rightScore: parseInt(viewingMatch.finalScore.split('-')[1]),
                  possessionSeconds: (viewingMatch.data.matchTime || 0) * 0.5, 
                  matchTime: viewingMatch.data.matchTime || 0,
                  teamName: viewingMatch.teamName,
                  opponentName: viewingMatch.opponentName
               }} />
            </div>
         </div>
      )}
    </>
  );
};
