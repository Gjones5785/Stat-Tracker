
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PlayerRow } from './components/PlayerRow';
import { Button } from './components/Button';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Toggle } from './components/Toggle';
import { NoteModal } from './components/NoteModal';
import { TeamSelectionModal } from './components/TeamSelectionModal';
import { Player, StatKey, PlayerStats, GameLogEntry, MatchHistoryItem, SquadPlayer } from './types';
import { STAT_CONFIGS, createInitialPlayers, INITIAL_STATS } from './constants';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // --- NAVIGATION STATE ---
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'tracker'>('dashboard');

  // --- HISTORY STATE ---
  const [matchHistory, setMatchHistory] = useState<MatchHistoryItem[]>([]);

  // --- SQUAD STATE ---
  const [squad, setSquad] = useState<SquadPlayer[]>([]);

  // --- APP STATE ---
  const [players, setPlayers] = useState<Player[]>(createInitialPlayers);
  const [teamName, setTeamName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [leftScore, setLeftScore] = useState('0');
  const [rightScore, setRightScore] = useState('0');
  
  // Sets State
  const [completedSets, setCompletedSets] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  // Game Management State
  const [gameStatus, setGameStatus] = useState<'1st' | '2nd' | 'finished'>('1st');
  const [firstHalfStats, setFirstHalfStats] = useState<Record<string, PlayerStats> | null>(null);
  const [fullMatchStats, setFullMatchStats] = useState<Record<string, PlayerStats> | null>(null);
  const [viewMode, setViewMode] = useState<'total' | '1st' | '2nd'>('total');

  // Match Timer State
  const [matchTime, setMatchTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Logs & Settings
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [settings, setSettings] = useState({
    promptPenaltyReason: true
  });
  const [pendingPenaltyLogId, setPendingPenaltyLogId] = useState<string | null>(null);
  const [pendingPenaltyPlayerName, setPendingPenaltyPlayerName] = useState('');

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isTimerResetModalOpen, setIsTimerResetModalOpen] = useState(false);
  const [isTeamSelectionOpen, setIsTeamSelectionOpen] = useState(false);
  
  // Internal Flags
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasActiveMatch, setHasActiveMatch] = useState(false);

  // --- SESSION & HISTORY LOADING ---
  useEffect(() => {
    const sessionUser = localStorage.getItem('RUGBY_TRACKER_SESSION');
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setMatchHistory([]);
      setSquad([]);
      setHasActiveMatch(false);
      return;
    }

    // Load History
    try {
      const historyKey = `RUGBY_TRACKER_HISTORY_${currentUser}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        setMatchHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }

    // Load Squad
    try {
      const squadKey = `RUGBY_TRACKER_SQUAD_${currentUser}`;
      const savedSquad = localStorage.getItem(squadKey);
      if (savedSquad) {
        setSquad(JSON.parse(savedSquad));
      }
    } catch (e) {
      console.error("Failed to load squad", e);
    }

    // Check Active Match
    const stateKey = `RUGBY_TRACKER_STATE_${currentUser}`;
    const savedState = localStorage.getItem(stateKey);
    setHasActiveMatch(!!savedState);

  }, [currentUser]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetTimer = () => {
    setIsTimerResetModalOpen(true);
  };

  const performTimerReset = () => {
    setIsTimerRunning(false);
    setMatchTime(0);
    setIsTimerResetModalOpen(false);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- DATA LOADING HELPERS ---
  const loadStateData = (data: any) => {
    if (data.players) setPlayers(data.players);
    if (data.teamName !== undefined) setTeamName(data.teamName);
    if (data.opponentName !== undefined) setOpponentName(data.opponentName);
    if (data.leftScore !== undefined) setLeftScore(data.leftScore);
    if (data.rightScore !== undefined) setRightScore(data.rightScore);
    if (data.completedSets !== undefined) setCompletedSets(data.completedSets);
    if (data.totalSets !== undefined) setTotalSets(data.totalSets);
    if (data.gameStatus) setGameStatus(data.gameStatus);
    if (data.firstHalfStats !== undefined) setFirstHalfStats(data.firstHalfStats);
    if (data.fullMatchStats !== undefined) setFullMatchStats(data.fullMatchStats);
    if (data.viewMode) setViewMode(data.viewMode);
    if (data.matchTime !== undefined) setMatchTime(data.matchTime);
    if (data.gameLog) setGameLog(data.gameLog);
    if (data.settings) setSettings(data.settings);
  };

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if (!currentUser || !isInitialized || currentScreen !== 'tracker') return;

    const hasData = 
      teamName.trim() !== '' ||
      opponentName.trim() !== '' ||
      leftScore !== '0' ||
      rightScore !== '0' ||
      completedSets > 0 ||
      totalSets > 0 ||
      matchTime > 0 ||
      players.some(p => Object.values(p.stats).some((val: any) => (val as number) > 0));

    const key = `RUGBY_TRACKER_STATE_${currentUser}`;

    if (!hasData) {
      localStorage.removeItem(key);
      setHasActiveMatch(false);
      return;
    }

    const stateToSave = {
      players,
      teamName,
      opponentName,
      leftScore,
      rightScore,
      completedSets,
      totalSets,
      gameStatus,
      firstHalfStats,
      fullMatchStats,
      viewMode,
      matchTime,
      gameLog,
      settings
    };
    
    localStorage.setItem(key, JSON.stringify(stateToSave));
    setHasActiveMatch(true);
  }, [
    currentUser, isInitialized, currentScreen,
    players, teamName, opponentName, leftScore, rightScore, 
    completedSets, totalSets, gameStatus, 
    firstHalfStats, fullMatchStats, viewMode, 
    matchTime, gameLog, settings
  ]);


  // --- SQUAD HANDLERS ---
  const handleAddSquadPlayer = (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    const newPlayer: SquadPlayer = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      ...player
    };
    const newSquad = [...squad, newPlayer];
    setSquad(newSquad);
    localStorage.setItem(`RUGBY_TRACKER_SQUAD_${currentUser}`, JSON.stringify(newSquad));
  };

  const handleRemoveSquadPlayer = (id: string) => {
    if (!currentUser) return;
    const newSquad = squad.filter(p => p.id !== id);
    setSquad(newSquad);
    localStorage.setItem(`RUGBY_TRACKER_SQUAD_${currentUser}`, JSON.stringify(newSquad));
  };


  // --- MATCH INITIALIZATION ---

  const handleNewMatchClick = () => {
    // If squad exists, show selection modal first
    if (squad.length > 0) {
      setIsTeamSelectionOpen(true);
    } else {
      // No squad, just start empty match
      startNewMatch([]); 
    }
  };

  const startNewMatch = (selections: { jersey: string; squadId: string; name: string }[]) => {
    // Clear active state
    if (currentUser) {
       localStorage.removeItem(`RUGBY_TRACKER_STATE_${currentUser}`);
    }
    
    // Initialize Players
    const initialPlayers = createInitialPlayers().map(p => {
       const selection = selections.find(s => s.jersey === p.number);
       if (selection) {
         return { ...p, name: selection.name, squadId: selection.squadId };
       }
       return p;
    });

    // Reset State
    setPlayers(initialPlayers);
    setTeamName('');
    setOpponentName('');
    setLeftScore('0');
    setRightScore('0');
    setCompletedSets(0);
    setTotalSets(0);
    setMatchTime(0);
    setGameStatus('1st');
    setViewMode('total');
    setFirstHalfStats(null);
    setFullMatchStats(null);
    setGameLog([]);
    
    setHasActiveMatch(false);
    setIsInitialized(true);
    setCurrentScreen('tracker');
    setIsTeamSelectionOpen(false);
  };

  const handleResumeMatch = () => {
    if (!currentUser) return;
    try {
      const key = `RUGBY_TRACKER_STATE_${currentUser}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        loadStateData(parsed);
      }
    } catch (e) {
      console.error("Error resuming match", e);
    }
    setIsInitialized(true);
    setCurrentScreen('tracker');
  };

  const handleViewHistoryMatch = (match: MatchHistoryItem) => {
    loadStateData(match.data);
    setGameStatus('finished');
    setIsInitialized(false); 
    setCurrentScreen('tracker');
  };

  const handleDeleteHistoryMatch = (id: string) => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to delete this match record?")) {
      const newHistory = matchHistory.filter(m => m.id !== id);
      setMatchHistory(newHistory);
      localStorage.setItem(`RUGBY_TRACKER_HISTORY_${currentUser}`, JSON.stringify(newHistory));
    }
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  // --- AUTH HANDLERS ---
  const handleLogin = (username: string) => {
    localStorage.setItem('RUGBY_TRACKER_SESSION', username);
    setCurrentUser(username);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('RUGBY_TRACKER_SESSION');
    setCurrentUser(null);
    setIsInitialized(false);
    setCurrentScreen('dashboard');
  };


  // --- TRACKER LOGIC ---

  const displayPlayers = useMemo(() => {
    const sourceStats = (gameStatus === 'finished' && fullMatchStats) 
      ? players.map(p => ({ ...p, stats: fullMatchStats[p.id] || p.stats }))
      : players;

    return sourceStats.map(player => {
      const currentStats = player.stats;
      const htStats = firstHalfStats?.[player.id] || INITIAL_STATS;

      let displayedStats = { ...currentStats };

      if (viewMode === '1st') {
        displayedStats = firstHalfStats ? htStats : currentStats;
      } else if (viewMode === '2nd') {
        if (!firstHalfStats) {
          (Object.keys(displayedStats) as StatKey[]).forEach(k => displayedStats[k] = 0);
        } else {
          (Object.keys(displayedStats) as StatKey[]).forEach(k => {
            displayedStats[k] = Math.max(0, currentStats[k] - htStats[k]);
          });
        }
      }

      return {
        ...player,
        stats: displayedStats
      };
    });
  }, [players, firstHalfStats, fullMatchStats, viewMode, gameStatus]);

  const statsMeta = useMemo(() => {
    const totals = { ...INITIAL_STATS };
    const maxValues = { ...INITIAL_STATS };

    displayPlayers.forEach(p => {
      (Object.keys(p.stats) as StatKey[]).forEach(key => {
        const val = p.stats[key];
        totals[key] += val;
        if (val > maxValues[key]) {
          maxValues[key] = val;
        }
      });
    });
    return { totals, maxValues };
  }, [displayPlayers]);

  const handleStatChange = useCallback((id: string, key: StatKey, delta: number) => {
    if (!isInitialized) return;
    if (gameStatus === 'finished') return;
    if (viewMode === '1st' && gameStatus === '2nd') return;

    const player = players.find(p => p.id === id);
    if (!player) return;

    const currentValue = player.stats[key];
    const newValue = currentValue + delta;

    let minAllowed = 0;
    if (viewMode === '2nd' && firstHalfStats) {
      minAllowed = firstHalfStats[player.id]?.[key] || 0;
    }

    if (newValue < minAllowed) return;

    if (key === 'triesScored') {
      setLeftScore(prev => String(Math.max(0, parseInt(prev || '0', 10) + (delta * 4))));
    } else if (key === 'kicks') {
      setLeftScore(prev => String(Math.max(0, parseInt(prev || '0', 10) + (delta * 2))));
    }

    setPlayers(currentPlayers => 
      currentPlayers.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          stats: { ...p.stats, [key]: newValue }
        };
      })
    );

    if (key === 'penaltiesConceded' && delta > 0) {
      const newLogId = Date.now().toString();
      const newEntry: GameLogEntry = {
        id: newLogId,
        timestamp: matchTime,
        formattedTime: formatTime(matchTime),
        playerId: player.id,
        playerName: player.name || 'Unknown Player',
        playerNumber: player.number,
        type: 'penalty',
        period: gameStatus === '1st' ? '1st' : '2nd'
      };

      setGameLog(prev => [...prev, newEntry]);

      if (settings.promptPenaltyReason) {
        setPendingPenaltyLogId(newLogId);
        setPendingPenaltyPlayerName(player.name || `Player ${player.number}`);
      }
    }
  }, [players, gameStatus, viewMode, firstHalfStats, matchTime, settings.promptPenaltyReason, isInitialized]);

  const handlePenaltyNoteSubmit = (note: string) => {
    if (pendingPenaltyLogId && note.trim() !== '') {
      setGameLog(prev => prev.map(entry => 
        entry.id === pendingPenaltyLogId ? { ...entry, reason: note } : entry
      ));
    }
    setPendingPenaltyLogId(null);
    setPendingPenaltyPlayerName('');
  };

  const handleIdentityChange = useCallback((id: string, field: 'name' | 'number', value: string) => {
    if (gameStatus === 'finished' || !isInitialized) return; 
    setPlayers(currentPlayers =>
      currentPlayers.map(player => 
        player.id === id ? { ...player, [field]: value } : player
      )
    );
  }, [gameStatus, isInitialized]);

  const handleSetComplete = useCallback(() => {
    if (gameStatus === 'finished' || !isInitialized) return;
    setCompletedSets(c => c + 1);
    setTotalSets(t => t + 1);
  }, [gameStatus, isInitialized]);

  const handleSetFail = useCallback(() => {
    if (gameStatus === 'finished' || !isInitialized) return;
    setTotalSets(t => t + 1);
  }, [gameStatus, isInitialized]);

  // --- GAME PHASE & HISTORY SAVING ---
  const executeGamePhaseChange = useCallback(() => {
    setIsTimerRunning(false);

    if (gameStatus === '1st') {
      const snapshot: Record<string, PlayerStats> = {};
      players.forEach(p => {
        snapshot[p.id] = { ...p.stats };
      });
      setFirstHalfStats(snapshot);
      setGameStatus('2nd');
      setIsPhaseModalOpen(false);
    } else if (gameStatus === '2nd') {
      // END MATCH -> SAVE TO HISTORY
      if (!currentUser) return;

      const snapshot: Record<string, PlayerStats> = {};
      players.forEach(p => {
        snapshot[p.id] = { ...p.stats };
      });
      
      const lScore = parseInt(leftScore || '0', 10);
      const rScore = parseInt(rightScore || '0', 10);
      
      // Create History Item
      const historyItem: MatchHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        teamName: teamName || 'Unknown Team',
        opponentName: opponentName || 'Unknown Opponent',
        finalScore: `${leftScore} - ${rightScore}`,
        result: lScore > rScore ? 'win' : lScore < rScore ? 'loss' : 'draw',
        data: {
           players, teamName, opponentName, leftScore, rightScore, 
           completedSets, totalSets, gameStatus: 'finished', 
           firstHalfStats, fullMatchStats: snapshot, matchTime, gameLog, settings
        }
      };

      const newHistory = [historyItem, ...matchHistory];
      setMatchHistory(newHistory);
      localStorage.setItem(`RUGBY_TRACKER_HISTORY_${currentUser}`, JSON.stringify(newHistory));

      // Clear Active Slot
      localStorage.removeItem(`RUGBY_TRACKER_STATE_${currentUser}`);
      setHasActiveMatch(false);

      setIsPhaseModalOpen(false);
      setCurrentScreen('dashboard');
    }
  }, [gameStatus, players, currentUser, leftScore, rightScore, teamName, opponentName, completedSets, totalSets, firstHalfStats, matchTime, gameLog, settings, matchHistory]);

  const performReset = useCallback(() => {
    // If we have a squad, maybe re-open selection? Or just blank it.
    // Let's just blank it for now, user can reset manually.
    // Or better: call startNewMatch with empty.
    startNewMatch([]);
    setIsResetModalOpen(false);
  }, []);

  const downloadStats = useCallback(() => {
    const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
    const safeTeamName = teamName.replace(/[^a-z0-9]/gi, '_') || 'Team';
    const filename = `${safeTeamName}_Stats_${dateStr}.csv`;

    const escapeCsv = (val: string | number | undefined) => {
        const str = String(val || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    let csvContent = "\uFEFF";

    csvContent += `Team Name,${escapeCsv(teamName || 'Unknown')}\n`;
    csvContent += `Opponent,${escapeCsv(opponentName || '')}\n`;
    csvContent += `Final Score,${leftScore} - ${rightScore}\n`;
    csvContent += `Sets Completed,${completedSets} / ${totalSets}\n`;
    csvContent += `Match Time,${formatTime(matchTime)}\n`;
    csvContent += `Date,${new Date().toLocaleDateString()}\n`;
    csvContent += `Coach,${escapeCsv(currentUser || 'Unknown')}\n\n`;

    const statHeaders = STAT_CONFIGS.map(c => escapeCsv(c.label)).join(',');
    const baseHeaderRow = `#,Player Name,${statHeaders}`;

    const generateBlock = (title: string, sourceStats: Record<string, PlayerStats> | null, subtractStats?: Record<string, PlayerStats> | null) => {
      let block = `${title}\n${baseHeaderRow}\n`;
      players.forEach(p => {
        let stats = sourceStats ? (sourceStats[p.id] || p.stats) : p.stats;
        if (subtractStats) {
           const sub = subtractStats[p.id];
           if (sub) {
             const calculated = { ...stats }; 
             (Object.keys(calculated) as StatKey[]).forEach(k => {
               calculated[k] = Math.max(0, stats[k] - sub[k]);
             });
             stats = calculated;
           }
        }
        const statsValues = STAT_CONFIGS.map(c => stats[c.key]).join(',');
        block += `${p.number},${escapeCsv(p.name)},${statsValues}\n`;
      });
      return block + '\n';
    };

    const finalStatsSource = (gameStatus === 'finished' && fullMatchStats) ? fullMatchStats : null; 
    csvContent += generateBlock("FULL MATCH STATISTICS", finalStatsSource);

    if (firstHalfStats) {
      csvContent += generateBlock("1ST HALF STATISTICS", firstHalfStats);
      csvContent += generateBlock("2ND HALF STATISTICS", finalStatsSource, firstHalfStats);
    }

    if (gameLog.length > 0) {
      csvContent += "MATCH EVENT LOG\n";
      csvContent += "Time,Period,Player #,Player Name,Event Type,Notes\n";
      gameLog.forEach(entry => {
        csvContent += `${entry.formattedTime},${entry.period},${escapeCsv(entry.playerNumber)},${escapeCsv(entry.playerName)},${escapeCsv(entry.type)},${escapeCsv(entry.reason)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [players, fullMatchStats, firstHalfStats, gameStatus, teamName, opponentName, leftScore, rightScore, completedSets, totalSets, matchTime, currentUser, gameLog]);


  // --- RENDER ---

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <TeamSelectionModal 
         isOpen={isTeamSelectionOpen}
         squad={squad}
         onConfirm={startNewMatch}
         onCancel={() => setIsTeamSelectionOpen(false)}
      />

      {currentScreen === 'dashboard' ? (
        <Dashboard
          currentUser={currentUser}
          hasActiveMatch={hasActiveMatch}
          history={matchHistory}
          squad={squad}
          onNewMatch={handleNewMatchClick}
          onResumeMatch={handleResumeMatch}
          onViewMatch={handleViewHistoryMatch}
          onDeleteMatch={handleDeleteHistoryMatch}
          onLogout={handleLogout}
          onAddSquadPlayer={handleAddSquadPlayer}
          onRemoveSquadPlayer={handleRemoveSquadPlayer}
        />
      ) : (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
          
          <ConfirmationModal 
            isOpen={isResetModalOpen}
            title="Reset All Stats?"
            message="Are you sure you'd like to reset the stats? This will clear all numbers, player names, scores, sets, and the team name."
            onConfirm={performReset}
            onCancel={() => setIsResetModalOpen(false)}
          />

          <ConfirmationModal 
            isOpen={isPhaseModalOpen}
            title={gameStatus === '1st' ? "End 1st Half?" : "End Match?"}
            message={gameStatus === '1st' 
              ? "Are you sure you want to end the 1st Half? This will lock current stats as the 1st Half record." 
              : "Are you sure you want to end the Match? This will finalize all statistics, save it to your history, and return you to the dashboard."}
            onConfirm={executeGamePhaseChange}
            onCancel={() => setIsPhaseModalOpen(false)}
          />

          <ConfirmationModal 
            isOpen={isTimerResetModalOpen}
            title="Reset Match Timer?"
            message="Are you sure you want to reset the match timer to 00:00?"
            onConfirm={performTimerReset}
            onCancel={() => setIsTimerResetModalOpen(false)}
          />

          <NoteModal
            isOpen={!!pendingPenaltyLogId}
            title="Penalty Reason"
            playerName={pendingPenaltyPlayerName}
            onSubmit={handlePenaltyNoteSubmit}
            onClose={() => {
              setPendingPenaltyLogId(null);
              setPendingPenaltyPlayerName('');
            }}
          />

          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 flex-none z-50 relative">
            <div className="max-w-full mx-auto px-4 py-2 flex items-center justify-between">
              
              {/* Left: Sets */}
              <div className="flex-none w-auto sm:w-64 flex flex-col items-center justify-center sm:items-start">
                 <div className="flex flex-col items-center justify-center">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Completed Sets</span>
                   <div className="flex items-center justify-center space-x-2 mb-1">
                      <input
                         type="number"
                         value={completedSets}
                         onChange={(e) => setCompletedSets(Number(e.target.value))}
                         disabled={gameStatus === 'finished' || !isInitialized}
                         className="w-10 text-center font-bold text-lg text-blue-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0 disabled:text-gray-400"
                      />
                      <span className="text-gray-400 font-light text-lg">/</span>
                      <input
                         type="number"
                         value={totalSets}
                         onChange={(e) => setTotalSets(Number(e.target.value))}
                         disabled={gameStatus === 'finished' || !isInitialized}
                         className="w-10 text-center font-bold text-lg text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0 disabled:text-gray-400"
                      />
                   </div>
                   <div className="flex space-x-2">
                       <button onClick={handleSetComplete} disabled={gameStatus === 'finished' || !isInitialized} className="bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">+ Comp</button>
                       <button onClick={handleSetFail} disabled={gameStatus === 'finished' || !isInitialized} className="bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">+ Miss</button>
                   </div>
                 </div>
              </div>

              {/* Center: Scores & Name */}
              <div className="flex-1 flex flex-col justify-center items-center px-2">
                 <div className="flex justify-center items-center space-x-2 sm:space-x-8">
                  <input type="number" value={leftScore} onChange={(e) => setLeftScore(e.target.value)} disabled={gameStatus === 'finished' || !isInitialized} className="w-12 sm:w-20 text-center text-3xl font-black text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none placeholder-gray-300 disabled:text-gray-400" placeholder="0" />
                  <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={gameStatus === 'finished' || !isInitialized} placeholder="ENTER TEAM NAME" className="w-full min-w-[120px] max-w-[200px] sm:max-w-md text-center text-xl sm:text-3xl font-black text-gray-800 placeholder-gray-300 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none uppercase disabled:text-gray-500" />
                  <input type="number" value={rightScore} onChange={(e) => setRightScore(e.target.value)} disabled={gameStatus === 'finished' || !isInitialized} className="w-12 sm:w-20 text-center text-3xl font-black text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none placeholder-gray-300 disabled:text-gray-400" placeholder="0" />
                </div>
                <input 
                  type="text" 
                  value={opponentName} 
                  onChange={(e) => setOpponentName(e.target.value)} 
                  disabled={gameStatus === 'finished' || !isInitialized} 
                  placeholder="VS OPPONENT" 
                  className="mt-1 w-full max-w-[200px] text-center text-xs font-bold text-gray-500 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none uppercase tracking-wider disabled:text-gray-300" 
                />
              </div>
              
              {/* Right: Actions */}
              <div className="flex-none w-auto sm:w-64 flex justify-end items-center space-x-3">
                 <Button variant="secondary" onClick={handleBackToDashboard} className="text-xs sm:text-sm px-3 py-2 shadow-sm bg-gray-100 border border-gray-200 text-gray-600">
                   <span className="flex items-center">
                     <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     <span className="hidden sm:inline">Dashboard</span>
                   </span>
                 </Button>

                <Button variant="secondary" onClick={downloadStats} className="text-xs sm:text-sm px-3 py-2 shadow-sm bg-gray-100 border border-gray-200 text-gray-600">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span className="hidden sm:inline">Export</span>
                  </span>
                </Button>
                
                {isInitialized && (
                  <Button variant="danger" onClick={() => setIsResetModalOpen(true)} className="text-xs sm:text-sm px-3 py-2 shadow-sm">Reset</Button>
                )}
              </div>
            </div>
          </header>

          {/* Game Control Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-40 relative">
            {/* Left: View Toggles */}
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Game Period:</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('total')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Full Game</button>
                <button onClick={() => setViewMode('1st')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === '1st' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>1st Half</button>
                <button onClick={() => setViewMode('2nd')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === '2nd' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>2nd Half</button>
              </div>
            </div>

            {/* Center: Match Timer */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
              <button 
                type="button"
                onClick={toggleTimer}
                disabled={gameStatus === 'finished' || !isInitialized}
                className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                  isTimerRunning 
                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                } ${gameStatus === 'finished' || !isInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isTimerRunning ? "Pause Timer" : "Start Timer"}
              >
                {isTimerRunning ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <span className={`text-xl font-mono font-bold tabular-nums leading-none tracking-tight ${isTimerRunning ? 'text-gray-900' : 'text-gray-500'}`}>
                {formatTime(matchTime)}
              </span>

              <button 
                 type="button"
                 onClick={resetTimer}
                 className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                 title="Reset Timer"
                 disabled={matchTime === 0 || !isInitialized}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Right: End Phase Button */}
            {gameStatus !== 'finished' && isInitialized ? (
              <button
                type="button"
                onClick={() => setIsPhaseModalOpen(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors shadow-sm ${
                  gameStatus === '1st'
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200'
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {gameStatus === '1st' ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
                <span>{gameStatus === '1st' ? 'End 1st Half' : 'End Match'}</span>
              </button>
            ) : (
               gameStatus === 'finished' && (
                  <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Match Complete
                  </span>
               )
            )}
          </div>

          {/* Main Table Area */}
          <main className="flex-1 overflow-auto relative w-full z-0 mx-auto">
            <table className="min-w-max border-collapse mx-auto">
              <thead className="bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider sticky top-0 z-30 shadow-sm">
                <tr>
                  <th className="p-3 sticky left-0 z-30 bg-gray-100 border-b border-gray-200 border-r text-center w-[56px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">#</th>
                  <th className="p-3 sticky left-[56px] z-30 bg-gray-100 border-b border-gray-200 border-r text-left w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Player Name</th>
                  {STAT_CONFIGS.map(config => (
                    <th key={config.key} className="p-3 border-b border-gray-200 text-center min-w-[160px]">
                      <div className="flex flex-col items-center">
                        <span>{config.label}</span>
                        <span className="text-[10px] text-gray-400 font-normal normal-case">
                          {viewMode === 'total' ? 'Full' : viewMode === '1st' ? '1st Half' : '2nd Half'} Total: {statsMeta.totals[config.key]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayPlayers.map((player, index) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    isOdd={index % 2 !== 0}
                    onStatChange={handleStatChange}
                    onIdentityChange={handleIdentityChange}
                    teamTotals={statsMeta.totals}
                    maxValues={statsMeta.maxValues}
                    isReadOnly={gameStatus === 'finished' || (viewMode === '1st' && gameStatus !== '1st') || !isInitialized}
                  />
                ))}
              </tbody>
            </table>
          </main>
          
          {/* Bottom Control Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-3 flex-none z-20 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Toggle 
                label="Penalty Reasons" 
                description="Prompt for note when penalty is conceded"
                checked={settings.promptPenaltyReason}
                onChange={(val) => setSettings(s => ({ ...s, promptPenaltyReason: val }))}
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400">
               <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
               <span className="hidden sm:inline">Indicates Team Leader (MVP)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
