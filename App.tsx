
import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { AuthScreen } from './components/AuthScreen';
import { PlayerRow } from './components/PlayerRow';
import { TeamSelectionModal } from './components/TeamSelectionModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CardAssignmentModal } from './components/CardAssignmentModal';
import { NoteModal } from './components/NoteModal';
import { NotificationModal } from './components/NotificationModal';
import { MatchCharts } from './components/MatchCharts';
import { MatchEventLog } from './components/MatchEventLog';
import { MatchPlanner } from './components/MatchPlanner';
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
      if (u) {
        setUserDisplay(u.displayName || u.email?.split('@')[0] || 'Coach');
        // Reset scroll when user explicitly logs in
        window.scrollTo(0, 0);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.username) setUserDisplay(data.username);
        else if (user.displayName) setUserDisplay(user.displayName);
        else setUserDisplay(user.email?.split('@')[0] || 'Coach');

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
        setMatchHistory(snap.docs.map(d => ({ ...d.data(), id: d.id } as MatchHistoryItem)));
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
  
  // RESET SCROLL ON SCREEN CHANGE
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponentName, setOpponentName] = useState('');
  const [matchTime, setMatchTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [period, setPeriod] = useState<'1st' | '2nd'>('1st');
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [opponentScore, setOpponentScore] = useState(0);
  const [homeScoreAdjustment, setHomeScoreAdjustment] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  
  const [isTeamSelectOpen, setIsTeamSelectOpen] = useState(false);
  const [isEndHalfModalOpen, setIsEndHalfModalOpen] = useState(false);
  const [isEndMatchModalOpen, setIsEndMatchModalOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [viewingMatch, setViewingMatch] = useState<MatchHistoryItem | null>(null);
  const [notificationConfig, setNotificationConfig] = useState<{ isOpen: boolean; title: string; message: string; } | null>(null);
  const [noteModalConfig, setNoteModalConfig] = useState<{ isOpen: boolean; playerId: string; stat: StatKey; playerName: string; } | null>(null);
  const [cardType, setCardType] = useState<'yellow' | 'red' | null>(null);
  const [selectedCardPlayerId, setSelectedCardPlayerId] = useState<string>('');
  const [removeCardId, setRemoveCardId] = useState<string | null>(null);

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
  
  const handleUpdateTrainingSession = async (id: string, updates: Partial<TrainingSession>) => {
      if (!user) return;
      const sessionRef = doc(db, 'users', user.uid, 'training', id);
      await updateDoc(sessionRef, updates);
  };
  
  const handleDeleteTrainingSession = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'training', id));
  };

  const handleDeleteHistoryMatch = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.uid, 'matches', id));
  };

  const handleNewMatchClick = () => {
    setIsTeamSelectOpen(true);
  };

  const saveActiveState = useCallback((
      p: Player[], t: number, per: '1st' | '2nd', log: GameLogEntry[], oppScore: number, oppName: string, id: string, sc: number, ts: number, hAdj: number
  ) => {
      localStorage.setItem('ACTIVE_MATCH_STATE', JSON.stringify({
          players: p, matchTime: t, period: per, gameLog: log, opponentScore: oppScore, opponentName: oppName, id: id, setsCompleted: sc, totalSets: ts, homeScoreAdjustment: hAdj, date: new Date().toISOString()
      }));
  }, []);

  const handleStartMatch = (selections: { jersey: string; squadId: string; name: string }[]) => {
    const newPlayers: Player[] = Array.from({ length: TEAM_SIZE }, (_, i) => {
        const jersey = (i + 1).toString();
        const selection = selections.find(s => s.jersey === jersey);
        const isOnField = i < 13;
        return {
            id: `player-${i}`,
            name: selection ? selection.name : '',
            number: jersey,
            ...(selection && selection.squadId ? { squadId: selection.squadId } : {}),
            stats: { ...INITIAL_STATS },
            cardStatus: 'none',
            isOnField: isOnField,
            totalSecondsOnField: 0,
            lastSubTime: isOnField ? 0 : undefined
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
    setSetsCompleted(0);
    setTotalSets(0);
    setHomeScoreAdjustment(0);
    setActiveMatchId(newId);
    setIsTimerRunning(false);
    saveActiveState(newPlayers, 0, '1st', [], 0, newOpponent, newId, 0, 0, 0);
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
          setSetsCompleted(state.setsCompleted || 0);
          setTotalSets(state.totalSets || 0);
          setHomeScoreAdjustment(state.homeScoreAdjustment || 0);
          setActiveMatchId(state.id);
          setCurrentScreen('tracker');
      }
  };

  const handleDiscardActiveMatch = () => setIsDiscardModalOpen(true);
  const onConfirmDiscard = () => {
      localStorage.removeItem('ACTIVE_MATCH_STATE');
      setActiveMatchId(null); 
      setCurrentScreen('dashboard');
      setPlayers([]);
      setMatchTime(0);
      setGameLog([]);
      setOpponentScore(0);
      setSetsCompleted(0);
      setTotalSets(0);
      setOpponentName('');
      setHomeScoreAdjustment(0);
      setIsDiscardModalOpen(false);
    };
  
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setMatchTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    players.forEach(p => {
      if (p.cardStatus === 'yellow' && p.sinBinStartTime !== undefined) {
        if (matchTime - p.sinBinStartTime === 540) {
          setNotificationConfig({
            isOpen: true,
            title: 'Sin Bin Warning',
            message: `${p.number} - ${p.name} has been in the bin for 9 minutes. They are due back on the field in 1 minute.`
          });
        }
      }
    });
  }, [matchTime, players]);

  useEffect(() => {
      if (currentScreen === 'tracker' && activeMatchId) {
          saveActiveState(players, matchTime, period, gameLog, opponentScore, opponentName, activeMatchId, setsCompleted, totalSets, homeScoreAdjustment);
      }
  }, [players, matchTime, period, gameLog, opponentScore, opponentName, activeMatchId, currentScreen, saveActiveState, setsCompleted, totalSets, homeScoreAdjustment]);

  const checkTimerActive = () => {
    if (!isTimerRunning) {
      alert("Please start the match timer to record statistics and events.");
      return false;
    }
    return true;
  };

  const updatePlayerStatsState = (playerId: string, stat: StatKey, delta: number) => {
     setPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
           const newVal = (p.stats[stat] || 0) + delta;
           return { ...p, stats: { ...p.stats, [stat]: Math.max(0, newVal) } };
        }
        return p;
     }));
  };

  const handleStatChange = (playerId: string, stat: StatKey, delta: number) => {
     if (!checkTimerActive()) return;
     if (delta > 0 && (stat === 'penaltiesConceded' || stat === 'errors')) {
       const p = players.find(pl => pl.id === playerId);
       if (p) {
         setNoteModalConfig({ isOpen: true, playerId, stat, playerName: p.name });
       }
       return;
     }
     updatePlayerStatsState(playerId, stat, delta);
     if (delta > 0) {
        const player = players.find(p => p.id === playerId);
        if (player) {
           if (stat === 'triesScored') {
              setGameLog(prev => [...prev, { id: Date.now().toString(), timestamp: matchTime, formattedTime: formatTime(matchTime), playerId: player.id, playerName: player.name, playerNumber: player.number, type: 'try', period }]);
           } else if (stat === 'kicks') {
              setGameLog(prev => [...prev, { id: Date.now().toString(), timestamp: matchTime, formattedTime: formatTime(matchTime), playerId: player.id, playerName: player.name, playerNumber: player.number, type: 'other', reason: 'Kick / Conversion', period }]);
           }
        }
     }
  };

  const handleNoteSubmit = (note: string, location?: string) => {
    if (noteModalConfig) {
      updatePlayerStatsState(noteModalConfig.playerId, noteModalConfig.stat, 1);
      const player = players.find(p => p.id === noteModalConfig.playerId);
      if (player) {
          const type = noteModalConfig.stat === 'penaltiesConceded' ? 'penalty' : 'error';
          setGameLog(prev => [...prev, { id: Date.now().toString(), timestamp: matchTime, formattedTime: formatTime(matchTime), playerId: player.id, playerName: player.name, playerNumber: player.number, type: type, reason: note, location: location, period }]);
      }
      setNoteModalConfig(null);
    }
  };

  const handleCardAction = (playerId: string, type: 'yellow' | 'red') => {
      if (!checkTimerActive()) return;
      setCardType(type);
      setSelectedCardPlayerId(playerId);
      setIsCardModalOpen(true);
  };

  const handleOpponentScoreChange = (delta: number) => { if (!checkTimerActive()) return; setOpponentScore(prev => Math.max(0, prev + delta)); };
  const handleHomeScoreChange = (delta: number) => { if (!checkTimerActive()) return; setHomeScoreAdjustment(prev => prev + delta); };
  const handleSetIncrement = () => { if (!checkTimerActive()) return; setSetsCompleted(p => p + 1); setTotalSets(p => p + 1); };
  const handleMissedSet = () => { if (!checkTimerActive()) return; setTotalSets(p => p + 1); };
  const handleRemoveCard = (playerId: string) => { if (!checkTimerActive()) return; setRemoveCardId(playerId); };
  
  const sortPlayers = (list: Player[]) => {
    return [...list].sort((a, b) => {
      if (!!a.isOnField === !!b.isOnField) return parseInt(a.number || '0') - parseInt(b.number || '0');
      return a.isOnField ? -1 : 1;
    });
  };

  const confirmRemoveCard = () => {
    if (removeCardId) {
      setPlayers(prev => {
          const updated = prev.map(p => {
              if (p.id === removeCardId) return { ...p, cardStatus: 'none', sinBinStartTime: undefined, isOnField: true, lastSubTime: matchTime };
              return p;
          });
          return sortPlayers(updated);
      });
      setRemoveCardId(null);
    }
  };
  
  const confirmCardAssignment = (playerId: string, reason: string) => {
      setPlayers(prev => {
          const updated = prev.map(p => {
              if (p.id === playerId) {
                  const sessionTime = p.lastSubTime !== undefined ? matchTime - p.lastSubTime : 0;
                  const newTotalTime = p.totalSecondsOnField + sessionTime;
                  return { 
                      ...p, cardStatus: cardType || 'none', isOnField: false, sinBinStartTime: cardType === 'yellow' ? matchTime : undefined, totalSecondsOnField: newTotalTime, lastSubTime: undefined
                  };
              }
              return p;
          });
          return sortPlayers(updated);
      });
      const player = players.find(p => p.id === playerId);
      if (player) {
          setGameLog(prev => [...prev, { id: Date.now().toString(), timestamp: matchTime, formattedTime: formatTime(matchTime), playerId: player.id, playerName: player.name, playerNumber: player.number, type: cardType === 'yellow' ? 'yellow_card' : 'red_card', reason, period }]);
      }
      setIsCardModalOpen(false);
  };
  
  const handleToggleFieldStatus = (playerId: string) => {
      if (!checkTimerActive()) return;
      const player = players.find(p => p.id === playerId);
      if (player) {
          const action = player.isOnField ? 'Subbed Off' : 'Subbed On';
          setGameLog(prev => [...prev, { id: Date.now().toString(), timestamp: matchTime, formattedTime: formatTime(matchTime), playerId: player.id, playerName: player.name, playerNumber: player.number, type: 'substitution', reason: action, period }]);
      }
      setPlayers(prev => {
          const updated = prev.map(p => {
              if (p.id === playerId) {
                 const newStatus = !p.isOnField;
                 let newTotalTime = p.totalSecondsOnField;
                 let newLastSubTime = p.lastSubTime;
                 if (newStatus) newLastSubTime = matchTime;
                 else { const sessionTime = p.lastSubTime !== undefined ? matchTime - p.lastSubTime : 0; newTotalTime += sessionTime; newLastSubTime = undefined; }
                 return { ...p, isOnField: newStatus, totalSecondsOnField: newTotalTime, lastSubTime: newLastSubTime };
              }
              return p;
          });
          return sortPlayers(updated);
      });
  };
  
  const handleViewHistoryMatch = (match: MatchHistoryItem) => setViewingMatch(match);
  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };

  const teamScore = Math.max(0, players.reduce((acc, p) => acc + (p.stats.triesScored * 4) + (p.stats.kicks * 2), 0) + homeScoreAdjustment);
  
  const teamTotals: PlayerStats = { ...INITIAL_STATS };
  const maxValues: PlayerStats = { ...INITIAL_STATS };
  const leaderCounts: PlayerStats = { ...INITIAL_STATS };

  players.forEach(p => {
     (Object.keys(INITIAL_STATS) as StatKey[]).forEach(key => {
        const val = p.stats[key];
        teamTotals[key] += val;
        if (val > maxValues[key]) { maxValues[key] = val; leaderCounts[key] = 1; }
        else if (val === maxValues[key] && val > 0) { leaderCounts[key]++; }
     });
  });
  
  const getRemoveCardMessage = () => {
    const p = players.find(pl => pl.id === removeCardId);
    if (p?.cardStatus === 'red') return "This will remove the Red Card and return the player to the field.";
    return "This will remove the Yellow Card, reset the Sin Bin timer, and return the player to the field.";
  };

  if (loadingAuth) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0F0F10] text-gray-500">Loading LeagueLens...</div>;
  if (!user) return <AuthScreen onLogin={() => {}} />; 

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
          onUpdateTrainingSession={handleUpdateTrainingSession}
          onDeleteTrainingSession={handleDeleteTrainingSession}
        />
      ) : (
         <div className="h-screen overflow-hidden bg-gray-100 dark:bg-[#0F0F10] flex flex-col font-sans">
            <header className="bg-white dark:bg-[#1A1A1C] border-b border-gray-200 dark:border-white/5 shadow-sm shrink-0">
               <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                  <div onClick={() => setIsTimerRunning(!isTimerRunning)} className="bg-white dark:bg-[#1A1A1C] rounded-2xl px-5 py-2 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center min-w-[160px] shadow-sm cursor-pointer hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group select-none">
                     <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3 mt-1">
                          {isTimerRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-3 w-3 transition-colors duration-300 ${isTimerRunning ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                        </div>
                        <span className={`text-4xl font-heading font-medium tabular-nums tracking-tight leading-none transition-colors ${isTimerRunning ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{formatTime(matchTime)}</span>
                     </div>
                     <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] ml-5">{period} Half</span>
                  </div>

                  <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
                     <div className="flex items-center justify-center w-full mb-3 px-2">
                         <div className="flex-1 flex items-center justify-end min-w-0">
                            <span className="text-right text-sm font-bold text-gray-500 uppercase tracking-wider truncate flex-1 min-w-0 h-6 flex items-center justify-end">{localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'Team'}</span>
                            <div className="relative w-32 flex items-center justify-center shrink-0 mx-2">
                                <button onClick={() => handleHomeScoreChange(-1)} disabled={!isTimerRunning} className="absolute left-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-0 p-1">－</button>
                                <span className="text-4xl font-heading font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">{teamScore}</span>
                                <button onClick={() => handleHomeScoreChange(1)} disabled={!isTimerRunning} className="absolute right-0 text-gray-300 hover:text-green-500 transition-colors disabled:opacity-0 p-1">＋</button>
                            </div>
                         </div>
                         <div className="w-px h-8 bg-gray-200 dark:bg-white/10 mx-2 shrink-0"></div>
                         <div className="flex-1 flex items-center justify-start min-w-0">
                            <div className="relative w-32 flex items-center justify-center shrink-0 mx-2">
                                <button onClick={() => handleOpponentScoreChange(-1)} disabled={!isTimerRunning} className="absolute left-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-0 p-1">－</button>
                                <span className={`text-4xl font-heading font-black text-slate-900 dark:text-white tabular-nums leading-none transition-opacity ${!isTimerRunning ? 'opacity-60' : ''}`}>{opponentScore}</span>
                                <button onClick={() => handleOpponentScoreChange(1)} disabled={!isTimerRunning} className="absolute right-0 text-gray-300 hover:text-green-500 transition-colors disabled:opacity-0 p-1">＋</button>
                            </div>
                            <div className="flex-1 flex items-center min-w-0 gap-3">
                                <input value={opponentName} onChange={(e) => setOpponentName(e.target.value)} className="text-left text-sm font-bold text-gray-500 uppercase tracking-wider bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-all placeholder-gray-300 w-full min-w-0 h-6" placeholder="OPPONENT"/>
                                <div className={`flex flex-col space-y-1 transition-opacity shrink-0 ${!isTimerRunning ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <button onClick={() => handleOpponentScoreChange(4)} disabled={!isTimerRunning} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded hover:bg-blue-200 disabled:cursor-not-allowed w-5 flex items-center justify-center">T</button>
                                    <button onClick={() => handleOpponentScoreChange(2)} disabled={!isTimerRunning} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded hover:bg-slate-300 disabled:cursor-not-allowed w-5 flex items-center justify-center">K</button>
                                </div>
                            </div>
                         </div>
                     </div>
                     <div className={`flex items-center space-x-3 bg-white dark:bg-white/10 px-4 py-1.5 rounded-full border border-gray-100 dark:border-white/5 shadow-sm transition-opacity ${!isTimerRunning ? 'opacity-50' : ''}`}>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sets</span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{setsCompleted}/{totalSets}</span>
                          <span className="text-[10px] font-medium text-gray-400 border-r border-gray-200 dark:border-white/10 pr-3 mr-1">{totalSets > 0 ? Math.round((setsCompleted / totalSets) * 100) : 0}%</span>
                          <div className="flex space-x-1">
                              <button onClick={handleSetIncrement} disabled={!isTimerRunning} className="w-5 h-5 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg></button>
                              <button onClick={handleMissedSet} disabled={!isTimerRunning} className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg></button>
                          </div>
                     </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/5 rounded-2xl px-4 py-3 border border-gray-200 dark:border-white/10 flex items-center space-x-3 shadow-sm min-h-[88px]">
                     <Button onClick={() => period === '1st' ? setIsEndHalfModalOpen(true) : setIsEndMatchModalOpen(true)} className="h-10 text-xs bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 shadow-lg border-none">{period === '1st' ? 'End 1st Half' : 'End Match'}</Button>
                     <Button variant="secondary" onClick={() => setCurrentScreen('dashboard')} className="h-10 text-xs bg-white dark:bg-white/10 border border-gray-200 dark:border-white/5 shadow-sm">Back</Button>
                  </div>
               </div>
            </header>

            {!isTimerRunning && (
              <div className="bg-orange-100 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-800/50 px-4 py-2 text-center z-10 backdrop-blur-sm shrink-0">
                 <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide flex items-center justify-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Timer Paused • Start timer to record stats</p>
              </div>
            )}

            <main className="flex-1 overflow-auto px-4 md:px-6 pb-4 md:pb-6 pt-0 relative">
              <div className="min-w-[1000px] bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-apple dark:shadow-none border border-gray-200 dark:border-white/5 mt-4 md:mt-6">
                 <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-white/5">
                       <tr>
                          <th className="p-3 text-left w-16 sticky left-0 top-0 z-50 bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider pl-4">#</th>
                          <th className="p-3 text-left min-w-[160px] sticky left-[64px] top-0 z-50 bg-gray-50 dark:bg-[#1A1A1C] text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                          {Object.values(STAT_CONFIGS).map(cfg => (
                             <th key={cfg.key} className="p-3 text-center min-w-[130px] text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-40 bg-gray-50 dark:bg-[#1A1A1C]">{cfg.label}</th>
                          ))}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                       {players.map((p, i) => (
                          <PlayerRow key={p.id} player={p} isOdd={i % 2 !== 0} onStatChange={handleStatChange} onIdentityChange={(id, f, v) => setPlayers(prev => prev.map(pl => pl.id === id ? { ...pl, [f]: v } : pl))} onCardAction={handleCardAction} onRemoveCard={handleRemoveCard} onToggleFieldStatus={handleToggleFieldStatus} teamTotals={teamTotals} maxValues={maxValues} leaderCounts={leaderCounts} isReadOnly={!isTimerRunning} />
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="max-w-4xl mx-auto">
                <MatchEventLog events={gameLog} />
              </div>
            </main>

            <div className="bg-white dark:bg-[#1A1A1C] border-t border-gray-200 dark:border-white/5 p-4 z-30 pb-safe shrink-0">
              <div className="max-w-4xl mx-auto flex items-center justify-center space-x-4">
                <Button onClick={() => handleCardAction('', 'yellow')} disabled={!isTimerRunning} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border border-yellow-500 font-bold text-xs uppercase tracking-wide max-w-[180px] shadow-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400">Issue Yellow Card</Button>
                <Button onClick={() => handleCardAction('', 'red')} disabled={!isTimerRunning} className="flex-1 bg-red-600 hover:bg-red-700 text-white border border-red-700 font-bold text-xs uppercase tracking-wide max-w-[180px] shadow-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400">Issue Red Card</Button>
              </div>
            </div>
         </div>
      )}

      <TeamSelectionModal isOpen={isTeamSelectOpen} squad={squad} onConfirm={handleStartMatch} onCancel={() => setIsTeamSelectOpen(false)} />
      <ConfirmationModal isOpen={isEndHalfModalOpen} title="End First Half?" message="This will pause the timer and switch the period to 2nd Half." onConfirm={() => { setPeriod('2nd'); setIsTimerRunning(false); setIsEndHalfModalOpen(false); }} onCancel={() => setIsEndHalfModalOpen(false)} />
      <ConfirmationModal isOpen={isEndMatchModalOpen} title="End Match?" message="This will finalize all stats and save the game to history." onConfirm={async () => { if (user) { const finalizedPlayers = players.map(p => { if (p.isOnField && p.lastSubTime !== undefined) { const sessionTime = matchTime - p.lastSubTime; return { ...p, totalSecondsOnField: p.totalSecondsOnField + sessionTime }; } return p; }); const rawData = { players: finalizedPlayers, gameLog, matchTime, setsCompleted, totalSets, homeScoreAdjustment, fullMatchStats: finalizedPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p.stats }), {}) }; const cleanData = JSON.parse(JSON.stringify(rawData)); const historyItem: MatchHistoryItem = { id: activeMatchId || Date.now().toString(), date: new Date().toISOString().split('T')[0], teamName: localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'My Team', opponentName: opponentName || 'Opponent', finalScore: `${teamScore} - ${opponentScore}`, result: teamScore > opponentScore ? 'win' : teamScore < opponentScore ? 'loss' : 'draw', data: cleanData }; await addDoc(collection(db, 'users', user.uid, 'matches'), historyItem); localStorage.removeItem('ACTIVE_MATCH_STATE'); setActiveMatchId(null); setCurrentScreen('dashboard'); } setIsEndMatchModalOpen(false); }} onCancel={() => setIsEndMatchModalOpen(false)} />
      <ConfirmationModal isOpen={isDiscardModalOpen} title="Discard Active Match?" message="Are you sure you want to discard the current live match? This action cannot be undone and all data will be lost." onConfirm={onConfirmDiscard} onCancel={() => setIsDiscardModalOpen(false)} />
      <ConfirmationModal isOpen={!!removeCardId} title="Remove Card?" message={getRemoveCardMessage()} onConfirm={confirmRemoveCard} onCancel={() => setRemoveCardId(null)} />
      <CardAssignmentModal isOpen={isCardModalOpen} type={cardType} players={players} onConfirm={confirmCardAssignment} onCancel={() => setIsCardModalOpen(false)} />
      <NoteModal isOpen={noteModalConfig?.isOpen || false} title={noteModalConfig?.stat === 'penaltiesConceded' ? 'Penalty Reason' : 'Error Reason'} playerName={noteModalConfig?.playerName || ''} showLocation={true} onSubmit={handleNoteSubmit} onClose={() => setNoteModalConfig(null)} />
      <NotificationModal isOpen={notificationConfig?.isOpen || false} title={notificationConfig?.title || ''} message={notificationConfig?.message || ''} onClose={() => setNotificationConfig(null)} />

      {viewingMatch && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingMatch(null)} />
            <div className="relative bg-white dark:bg-[#1A1A1C] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 animate-in zoom-in-95 duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Match Analysis</h2>
                  <button onClick={() => setViewingMatch(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
               </div>
               <MatchCharts matchData={{ players: viewingMatch.data.players || [], leftScore: parseInt(viewingMatch.finalScore.split('-')[0]), rightScore: parseInt(viewingMatch.finalScore.split('-')[1]), possessionSeconds: (viewingMatch.data.matchTime || 0) * 0.5, matchTime: viewingMatch.data.matchTime || 0, teamName: viewingMatch.teamName, opponentName: viewingMatch.opponentName, gameLog: viewingMatch.data.gameLog || [] }} />
            </div>
         </div>
      )}
    </>
  );
};
