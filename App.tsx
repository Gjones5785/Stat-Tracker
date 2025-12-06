import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PlayerRow } from './components/PlayerRow';
import { Button } from './components/Button';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AuthScreen } from './components/AuthScreen';
import { Player, StatKey, PlayerStats } from './types';
import { STAT_CONFIGS, createInitialPlayers, INITIAL_STATS } from './constants';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<string | null>(null);

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

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isTimerResetModalOpen, setIsTimerResetModalOpen] = useState(false);
  
  // Auto-Save / Resume State
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- SESSION CHECK ---
  useEffect(() => {
    const sessionUser = localStorage.getItem('RUGBY_TRACKER_SESSION');
    if (sessionUser) {
      setCurrentUser(sessionUser);
    }
  }, []);

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
  // --- END TIMER LOGIC ---

  // --- AUTO-SAVE LOGIC ---

  // 1. Load on User Login
  useEffect(() => {
    if (!currentUser) {
      setIsInitialized(false);
      return;
    }

    const key = `RUGBY_TRACKER_STATE_${currentUser}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const parsed: any = JSON.parse(saved);
        const hasData = 
          (parsed.teamName && parsed.teamName.trim() !== '') ||
          (parsed.opponentName && parsed.opponentName.trim() !== '') ||
          parsed.leftScore !== '0' ||
          parsed.rightScore !== '0' ||
          (parsed.completedSets as number) > 0 ||
          (parsed.totalSets as number) > 0 ||
          (parsed.matchTime as number) > 0 ||
          (parsed.players && parsed.players.some((p: Player) => Object.values(p.stats).some((val: any) => (val as number) > 0)));

        if (hasData) {
          setIsResumeModalOpen(true);
          return;
        }
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    // No relevant data found, start fresh
    setPlayers(createInitialPlayers());
    setTeamName('');
    setOpponentName('');
    setLeftScore('0');
    setRightScore('0');
    setCompletedSets(0);
    setTotalSets(0);
    setMatchTime(0);
    setIsInitialized(true);
  }, [currentUser]);

  // 2. Save on Change
  useEffect(() => {
    if (!currentUser || !isInitialized) return;

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
      matchTime
    };
    
    localStorage.setItem(key, JSON.stringify(stateToSave));
  }, [
    currentUser, isInitialized,
    players, teamName, opponentName, leftScore, rightScore, 
    completedSets, totalSets, gameStatus, 
    firstHalfStats, fullMatchStats, viewMode, 
    matchTime
  ]);

  const handleResumeMatch = useCallback(() => {
    if (!currentUser) return;
    try {
      const key = `RUGBY_TRACKER_STATE_${currentUser}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPlayers(parsed.players);
        setTeamName(parsed.teamName);
        setOpponentName(parsed.opponentName || '');
        setLeftScore(parsed.leftScore);
        setRightScore(parsed.rightScore);
        setCompletedSets(parsed.completedSets);
        setTotalSets(parsed.totalSets);
        setGameStatus(parsed.gameStatus);
        setFirstHalfStats(parsed.firstHalfStats);
        setFullMatchStats(parsed.fullMatchStats);
        setViewMode(parsed.viewMode);
        setMatchTime(parsed.matchTime || 0);
      }
    } catch (e) {
      console.error("Error resuming match", e);
    }
    setIsResumeModalOpen(false);
    setIsInitialized(true);
  }, [currentUser]);

  const handleStartNewMatch = useCallback(() => {
    if (currentUser) {
      localStorage.removeItem(`RUGBY_TRACKER_STATE_${currentUser}`);
    }
    setPlayers(createInitialPlayers());
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
    setIsResumeModalOpen(false);
    setIsInitialized(true);
  }, [currentUser]);

  // --- END AUTO-SAVE LOGIC ---

  // Auth Handlers
  const handleLogin = (username: string) => {
    localStorage.setItem('RUGBY_TRACKER_SESSION', username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('RUGBY_TRACKER_SESSION');
    setCurrentUser(null);
    setIsInitialized(false);
    setPlayers(createInitialPlayers()); // Reset UI state
  };


  // Derived state
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
          stats: {
            ...p.stats,
            [key]: newValue
          }
        };
      })
    );
  }, [players, gameStatus, viewMode, firstHalfStats]);

  const handleIdentityChange = useCallback((id: string, field: 'name' | 'number', value: string) => {
    if (gameStatus === 'finished') return; 
    setPlayers(currentPlayers =>
      currentPlayers.map(player => 
        player.id === id ? { ...player, [field]: value } : player
      )
    );
  }, [gameStatus]);

  const handlePlayerAttributeChange = useCallback((id: string, field: keyof Player, value: any) => {
    setPlayers(currentPlayers =>
      currentPlayers.map(player => 
        player.id === id ? { ...player, [field]: value } : player
      )
    );
  }, []);

  const handleSetComplete = useCallback(() => {
    if (gameStatus === 'finished') return;
    setCompletedSets(c => c + 1);
    setTotalSets(t => t + 1);
  }, [gameStatus]);

  const handleSetFail = useCallback(() => {
    if (gameStatus === 'finished') return;
    setTotalSets(t => t + 1);
  }, [gameStatus]);

  const executeGamePhaseChange = useCallback(() => {
    setIsTimerRunning(false);

    if (gameStatus === '1st') {
      const snapshot: Record<string, PlayerStats> = {};
      players.forEach(p => {
        snapshot[p.id] = { ...p.stats };
      });
      setFirstHalfStats(snapshot);
      setGameStatus('2nd');
    } else if (gameStatus === '2nd') {
      const snapshot: Record<string, PlayerStats> = {};
      players.forEach(p => {
        snapshot[p.id] = { ...p.stats };
      });
      setFullMatchStats(snapshot);
      setGameStatus('finished');
      setViewMode('total');
    }
    setIsPhaseModalOpen(false);
  }, [gameStatus, players]);

  const performReset = useCallback(() => {
    handleStartNewMatch();
    setIsResetModalOpen(false);
  }, [handleStartNewMatch]);

  const downloadStats = useCallback(() => {
    const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
    const safeTeamName = teamName.replace(/[^a-z0-9]/gi, '_') || 'Team';
    const filename = `${safeTeamName}_Stats_${dateStr}.csv`;

    const escapeCsv = (val: string | number) => {
        const str = String(val);
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
    const baseHeaderRow = `#,Player Name,On Field,${statHeaders}`;

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
        block += `${p.number},${escapeCsv(p.name)},${p.isOnField ? 'Yes' : 'No'},${statsValues}\n`;
      });
      return block + '\n';
    };

    const finalStatsSource = (gameStatus === 'finished' && fullMatchStats) ? fullMatchStats : null; 
    csvContent += generateBlock("FULL MATCH STATISTICS", finalStatsSource);

    if (firstHalfStats) {
      csvContent += generateBlock("1ST HALF STATISTICS", firstHalfStats);
      csvContent += generateBlock("2ND HALF STATISTICS", finalStatsSource, firstHalfStats);
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
  }, [players, fullMatchStats, firstHalfStats, gameStatus, teamName, opponentName, leftScore, rightScore, completedSets, totalSets, matchTime, currentUser]);

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      <ConfirmationModal 
        isOpen={isResumeModalOpen}
        title="Resume Previous Match?"
        message="We found an unfinished match in your saved history. Would you like to restore it?"
        onConfirm={handleResumeMatch}
        onCancel={handleStartNewMatch}
      />

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
          : "Are you sure you want to end the Match? This will finalize all statistics and prevent further editing."}
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
                     disabled={gameStatus === 'finished'}
                     className="w-10 text-center font-bold text-lg text-blue-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0 disabled:text-gray-400"
                  />
                  <span className="text-gray-400 font-light text-lg">/</span>
                  <input
                     type="number"
                     value={totalSets}
                     onChange={(e) => setTotalSets(Number(e.target.value))}
                     disabled={gameStatus === 'finished'}
                     className="w-10 text-center font-bold text-lg text-gray-600 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none p-0 disabled:text-gray-400"
                  />
               </div>
               <div className="flex space-x-2">
                   <button onClick={handleSetComplete} disabled={gameStatus === 'finished'} className="bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">+ Comp</button>
                   <button onClick={handleSetFail} disabled={gameStatus === 'finished'} className="bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase disabled:opacity-50">+ Miss</button>
               </div>
             </div>
          </div>

          {/* Center: Scores & Name */}
          <div className="flex-1 flex flex-col justify-center items-center px-2">
             <div className="flex justify-center items-center space-x-2 sm:space-x-8">
              <input type="number" value={leftScore} onChange={(e) => setLeftScore(e.target.value)} disabled={gameStatus === 'finished'} className="w-12 sm:w-20 text-center text-3xl font-black text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none placeholder-gray-300 disabled:text-gray-400" placeholder="0" />
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={gameStatus === 'finished'} placeholder="ENTER TEAM NAME" className="w-full min-w-[120px] max-w-[200px] sm:max-w-md text-center text-xl sm:text-3xl font-black text-gray-800 placeholder-gray-300 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none uppercase disabled:text-gray-500" />
              <input type="number" value={rightScore} onChange={(e) => setRightScore(e.target.value)} disabled={gameStatus === 'finished'} className="w-12 sm:w-20 text-center text-3xl font-black text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-blue-500 outline-none placeholder-gray-300 disabled:text-gray-400" placeholder="0" />
            </div>
            <input 
              type="text" 
              value={opponentName} 
              onChange={(e) => setOpponentName(e.target.value)} 
              disabled={gameStatus === 'finished'} 
              placeholder="VS OPPONENT" 
              className="mt-1 w-full max-w-[200px] text-center text-xs font-bold text-gray-500 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none uppercase tracking-wider disabled:text-gray-300" 
            />
          </div>
          
          {/* Right: Actions */}
          <div className="flex-none w-auto sm:w-64 flex justify-end items-center space-x-3">
             <div className="hidden lg:flex flex-col items-end mr-2">
               <span className="text-[10px] text-gray-400 uppercase tracking-wider">Coach</span>
               <span className="text-xs font-bold text-gray-700 truncate max-w-[80px]">{currentUser}</span>
             </div>
             
             <button 
               type="button"
               onClick={handleLogout}
               className="text-gray-400 hover:text-red-500 p-2"
               title="Log Out"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
             </button>

            <Button variant="secondary" onClick={downloadStats} className="text-xs sm:text-sm px-3 py-2 shadow-sm bg-gray-100 border border-gray-200 text-gray-600">
              <span className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="hidden sm:inline">Export</span>
              </span>
            </Button>
            <Button variant="danger" onClick={() => setIsResetModalOpen(true)} className="text-xs sm:text-sm px-3 py-2 shadow-sm">Reset</Button>
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
            disabled={gameStatus === 'finished'}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
              isTimerRunning 
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            } ${gameStatus === 'finished' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
             disabled={matchTime === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Right: End Phase Button */}
        {gameStatus !== 'finished' ? (
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
          <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Match Complete
          </span>
        )}
      </div>

      {/* Main Table Area */}
      <main className="flex-1 overflow-auto relative w-full z-0">
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
                onAttributeChange={handlePlayerAttributeChange}
                teamTotals={statsMeta.totals}
                maxValues={statsMeta.maxValues}
                isReadOnly={gameStatus === 'finished' || (viewMode === '1st' && gameStatus !== '1st')}
              />
            ))}
          </tbody>
        </table>
      </main>
      
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-400 flex justify-between flex-none z-10">
        <div className="flex items-center space-x-2">
           <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
           <span>Indicates Team Leader (MVP)</span>
        </div>
        <span className="hidden sm:inline">Use tablet in landscape for best experience</span>
      </div>
    </div>
  );
};

export default App;