
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PlayerRow } from './components/PlayerRow';
import { Button } from './components/Button';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Toggle } from './components/Toggle';
import { NoteModal } from './components/NoteModal';
import { NotificationModal } from './components/NotificationModal';
import { TeamSelectionModal } from './components/TeamSelectionModal';
import { CardAssignmentModal } from './components/CardAssignmentModal';
import { Player, StatKey, PlayerStats, GameLogEntry, MatchHistoryItem, SquadPlayer } from './types';
import { STAT_CONFIGS, createInitialPlayers, INITIAL_STATS } from './constants';
import { MatchCharts } from './components/MatchCharts';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // --- THEME STATE ---
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('LEAGUELENS_THEME') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('LEAGUELENS_THEME', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('LEAGUELENS_THEME', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

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
  
  // Possession State
  const [possessionSeconds, setPossessionSeconds] = useState(0); // Time in Attack
  const [possessionMode, setPossessionMode] = useState<'attack' | 'defense'>('attack');

  // Logs & Settings
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const [isMatchLogOpen, setIsMatchLogOpen] = useState(false); // Collapsible state
  const [settings, setSettings] = useState({
    promptPenaltyReason: true,
    promptErrorReason: true
  });
  const [pendingPenaltyLogId, setPendingPenaltyLogId] = useState<string | null>(null);
  const [pendingPenaltyPlayerName, setPendingPenaltyPlayerName] = useState('');
  const [pendingEventType, setPendingEventType] = useState<'penalty' | 'error' | null>(null);

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isTimerResetModalOpen, setIsTimerResetModalOpen] = useState(false);
  const [isTeamSelectionOpen, setIsTeamSelectionOpen] = useState(false);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [cardAssignmentState, setCardAssignmentState] = useState<{ isOpen: boolean; type: 'yellow' | 'red' | null }>({ isOpen: false, type: null });
  const [notification, setNotification] = useState<{title: string, message: string} | null>(null);
  
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

  // --- TIMER LOGIC & SIN BIN CHECK ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMatchTime(prev => {
          const nextTime = prev + 1;
          
          // Check for Sin Bin completion (9 minutes = 540 seconds for warning)
          setPlayers(currentPlayers => {
            currentPlayers.forEach(p => {
              if (p.cardStatus === 'yellow' && p.sinBinStartTime !== undefined) {
                const timeInBin = nextTime - p.sinBinStartTime;
                if (timeInBin === 540) { // Exactly 9 minutes (1 min remaining)
                   setNotification({
                     title: "Sin Bin Warning",
                     message: `${p.name || `Player ${p.number}`} has 1 minute remaining in the Sin Bin. Prepare for return.`
                   });
                }
              }
            });
            return currentPlayers;
          });

          return nextTime;
        });

        // Track Possession
        if (possessionMode === 'attack') {
          setPossessionSeconds(prev => prev + 1);
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, possessionMode]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  
  const resetTimer = () => {
    setIsTimerResetModalOpen(true);
  };

  const performTimerReset = () => {
    setIsTimerRunning(false);
    setMatchTime(0);
    setPossessionSeconds(0);
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
    if (data.possessionSeconds !== undefined) setPossessionSeconds(data.possessionSeconds);
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
      players.some(p => Object.values(p.stats).some((val: number) => val > 0));

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
      settings,
      possessionSeconds
    };
    
    localStorage.setItem(key, JSON.stringify(stateToSave));
    setHasActiveMatch(true);
  }, [
    currentUser, isInitialized, currentScreen,
    players, teamName, opponentName, leftScore, rightScore, 
    completedSets, totalSets, gameStatus, 
    firstHalfStats, fullMatchStats, viewMode, 
    matchTime, gameLog, settings, possessionSeconds
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
    if (squad.length > 0) {
      setIsTeamSelectionOpen(true);
    } else {
      startNewMatch([]); 
    }
  };

  const startNewMatch = (selections: { jersey: string; squadId: string; name: string }[]) => {
    if (currentUser) {
       localStorage.removeItem(`RUGBY_TRACKER_STATE_${currentUser}`);
    }
    
    const initialPlayers = createInitialPlayers().map(p => {
       const selection = selections.find(s => s.jersey === p.number);
       if (selection) {
         return { ...p, name: selection.name, squadId: selection.squadId };
       }
       return p;
    });

    setPlayers(initialPlayers);
    
    // Set team name from stored preference
    const storedTeamName = localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || '';
    setTeamName(storedTeamName);
    
    setOpponentName('');
    setLeftScore('0');
    setRightScore('0');
    setCompletedSets(0);
    setTotalSets(0);
    setMatchTime(0);
    setPossessionSeconds(0);
    setIsTimerRunning(false); 
    setGameStatus('1st');
    setViewMode('total');
    setFirstHalfStats(null);
    setFullMatchStats(null);
    setGameLog([]);
    setIsMatchLogOpen(false);
    
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

  const handleDiscardActiveMatch = () => {
    if (!currentUser) return;
    setIsDiscardModalOpen(true);
  };

  const performDiscardMatch = () => {
    if (currentUser) {
      localStorage.removeItem(`RUGBY_TRACKER_STATE_${currentUser}`);
      setHasActiveMatch(false);
    }
    setIsDiscardModalOpen(false);
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
    // 1. Get base stats depending on mode
    const sourceStats = (gameStatus === 'finished' && fullMatchStats) 
      ? players.map(p => ({ ...p, stats: fullMatchStats[p.id] || p.stats }))
      : players;

    // 2. Map stats for view mode (1st/2nd half diffs)
    const mappedPlayers = sourceStats.map(player => {
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

    // 3. SORT: Players "On Field" go to top, "Off Field" to bottom.
    //    Secondary sort by Jersey Number numerical value.
    return mappedPlayers.sort((a, b) => {
      // If both have same field status, sort by number
      if (a.isOnField === b.isOnField) {
        return parseInt(a.number) - parseInt(b.number);
      }
      // Otherwise, OnField (true) comes first
      return a.isOnField ? -1 : 1;
    });

  }, [players, firstHalfStats, fullMatchStats, viewMode, gameStatus]);

  const statsMeta = useMemo(() => {
    const totals = { ...INITIAL_STATS };
    const maxValues = { ...INITIAL_STATS };
    const leaderCounts = { ...INITIAL_STATS };

    displayPlayers.forEach(p => {
      (Object.keys(p.stats) as StatKey[]).forEach(key => {
        const val = p.stats[key];
        totals[key] += val;
        
        // Logic to track Max Value AND how many people have it
        if (val > maxValues[key]) {
          maxValues[key] = val;
          leaderCounts[key] = 1; // New max found, reset count to 1
        } else if (val === maxValues[key] && val > 0) {
          leaderCounts[key] += 1; // Tie found, increment count
        }
      });
    });
    return { totals, maxValues, leaderCounts };
  }, [displayPlayers]);

  const handleOpponentScore = useCallback((type: 'try' | 'kick') => {
    if (!isInitialized || gameStatus === 'finished') return;
    
    const points = type === 'try' ? 4 : 2;
    setRightScore(prev => String(Math.max(0, parseInt(prev || '0', 10) + points)));

    const nameToUse = opponentName.trim() || 'Opponent';

    const newEntry: GameLogEntry = {
      id: Date.now().toString(),
      timestamp: matchTime,
      formattedTime: formatTime(matchTime),
      playerId: 'opponent',
      playerName: nameToUse,
      playerNumber: '-',
      type: 'other',
      reason: type === 'try' ? `${nameToUse} Try Scored` : `${nameToUse} Kick Goal`,
      period: gameStatus === '1st' ? '1st' : '2nd'
    };
    setGameLog(prev => [newEntry, ...prev]);

  }, [isInitialized, gameStatus, matchTime, opponentName]);

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

    // --- LOGGING ---
    // Log Penalties or Errors
    if ((key === 'penaltiesConceded' || key === 'errors') && delta > 0) {
      const type = key === 'penaltiesConceded' ? 'penalty' : 'error';
      const newLogId = Date.now().toString();
      const newEntry: GameLogEntry = {
        id: newLogId,
        timestamp: matchTime,
        formattedTime: formatTime(matchTime),
        playerId: player.id,
        playerName: player.name || 'Unknown Player',
        playerNumber: player.number,
        type: type,
        period: gameStatus === '1st' ? '1st' : '2nd'
      };
      setGameLog(prev => [newEntry, ...prev]);
      
      const shouldPrompt = type === 'penalty' ? settings.promptPenaltyReason : settings.promptErrorReason;
      
      if (shouldPrompt) {
        setPendingPenaltyLogId(newLogId);
        setPendingPenaltyPlayerName(player.name || `Player ${player.number}`);
        setPendingEventType(type);
      }
    }
    // Log Tries
    if (key === 'triesScored' && delta > 0) {
      const newEntry: GameLogEntry = {
        id: Date.now().toString(),
        timestamp: matchTime,
        formattedTime: formatTime(matchTime),
        playerId: player.id,
        playerName: player.name || 'Unknown Player',
        playerNumber: player.number,
        type: 'try',
        period: gameStatus === '1st' ? '1st' : '2nd'
      };
      setGameLog(prev => [newEntry, ...prev]);
    }

  }, [players, gameStatus, viewMode, firstHalfStats, matchTime, settings, isInitialized]);

  const handleToggleFieldStatus = useCallback((id: string) => {
    if (!isInitialized || gameStatus === 'finished') return;

    // Log the substitution event
    const player = players.find(p => p.id === id);
    if (player) {
      const isComingOn = !player.isOnField; // Toggling status
      const newEntry: GameLogEntry = {
        id: Date.now().toString(),
        timestamp: matchTime,
        formattedTime: formatTime(matchTime),
        playerId: player.id,
        playerName: player.name || 'Unknown Player',
        playerNumber: player.number,
        type: 'substitution',
        reason: isComingOn ? 'Subbed On' : 'Subbed Off',
        period: gameStatus === '1st' ? '1st' : '2nd'
      };
      setGameLog(prev => [newEntry, ...prev]);
    }

    setPlayers(currentPlayers => 
      currentPlayers.map(p => 
        p.id === id ? { ...p, isOnField: !p.isOnField } : p
      )
    );
  }, [isInitialized, gameStatus, players, matchTime]);

  const handleCardAssignment = (playerId: string, reason: string) => {
    if (!isInitialized || gameStatus === 'finished') return;
    const type = cardAssignmentState.type;
    if (!type) return;

    setPlayers(currentPlayers => 
      currentPlayers.map(p => {
        if (p.id !== playerId) return p;

        const newEntry: GameLogEntry = {
          id: Date.now().toString(),
          timestamp: matchTime,
          formattedTime: formatTime(matchTime),
          playerId: p.id,
          playerName: p.name || 'Unknown Player',
          playerNumber: p.number,
          type: type === 'yellow' ? 'yellow_card' : 'red_card',
          reason: reason,
          period: gameStatus === '1st' ? '1st' : '2nd'
        };
        setGameLog(prev => [newEntry, ...prev]);

        return {
           ...p,
           cardStatus: type,
           sinBinStartTime: type === 'yellow' ? matchTime : undefined
        };
      })
    );
    setCardAssignmentState({ isOpen: false, type: null });
  };
  
  const handleCardAction = useCallback((id: string, type: 'yellow' | 'red') => {
    if (!isInitialized || gameStatus === 'finished') return;

    setPlayers(currentPlayers => 
      currentPlayers.map(p => {
        if (p.id !== id) return p;

        if (p.cardStatus === type) {
           const newEntry: GameLogEntry = {
            id: Date.now().toString(),
            timestamp: matchTime,
            formattedTime: formatTime(matchTime),
            playerId: p.id,
            playerName: p.name || 'Unknown Player',
            playerNumber: p.number,
            type: 'other',
            reason: type === 'yellow' ? 'Returned from Sin Bin' : 'Card Rescinded',
            period: gameStatus === '1st' ? '1st' : '2nd'
          };
          setGameLog(prev => [newEntry, ...prev]);

          return { ...p, cardStatus: 'none', sinBinStartTime: undefined };
        }
        return p;
      })
    );
  }, [matchTime, gameStatus, isInitialized]);

  const handleEventDetailsSubmit = (note: string, location?: string) => {
    if (pendingPenaltyLogId) {
      setGameLog(prev => prev.map(entry => 
        entry.id === pendingPenaltyLogId ? { ...entry, reason: note, location: location } : entry
      ));
    }
    setPendingPenaltyLogId(null);
    setPendingPenaltyPlayerName('');
    setPendingEventType(null);
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
      if (!currentUser) return;

      const snapshot: Record<string, PlayerStats> = {};
      players.forEach(p => {
        snapshot[p.id] = { ...p.stats };
      });
      
      const lScore = parseInt(leftScore || '0', 10);
      const rScore = parseInt(rightScore || '0', 10);
      
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
           firstHalfStats, fullMatchStats: snapshot, matchTime, gameLog, settings, possessionSeconds
        }
      };

      const newHistory = [historyItem, ...matchHistory];
      setMatchHistory(newHistory);
      localStorage.setItem(`RUGBY_TRACKER_HISTORY_${currentUser}`, JSON.stringify(newHistory));

      localStorage.removeItem(`RUGBY_TRACKER_STATE_${currentUser}`);
      setHasActiveMatch(false);

      setIsPhaseModalOpen(false);
      setCurrentScreen('dashboard');
    }
  }, [gameStatus, players, currentUser, leftScore, rightScore, teamName, opponentName, completedSets, totalSets, firstHalfStats, matchTime, gameLog, settings, matchHistory, possessionSeconds]);

  const performReset = useCallback(() => {
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
    csvContent += `Possession (Attack),${formatTime(possessionSeconds)}\n`;
    csvContent += `Date,${new Date().toLocaleDateString()}\n`;
    csvContent += `Coach,${escapeCsv(currentUser || 'Unknown')}\n\n`;

    const statHeaders = STAT_CONFIGS.map(c => escapeCsv(c.label)).join(',');
    const baseHeaderRow = `#,Player Name,On Field,Card,${statHeaders}`;

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
        const cardVal = p.cardStatus && p.cardStatus !== 'none' ? p.cardStatus.toUpperCase() : '';
        const onFieldVal = p.isOnField ? 'YES' : 'NO';
        block += `${p.number},${escapeCsv(p.name)},${onFieldVal},${cardVal},${statsValues}\n`;
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
      csvContent += "Time,Period,Player #,Player Name,Event Type,Location,Notes\n";
      gameLog.forEach(entry => {
        csvContent += `${entry.formattedTime},${entry.period},${escapeCsv(entry.playerNumber)},${escapeCsv(entry.playerName)},${escapeCsv(entry.type)},${escapeCsv(entry.location)},${escapeCsv(entry.reason)}\n`;
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
  }, [players, fullMatchStats, firstHalfStats, gameStatus, teamName, opponentName, leftScore, rightScore, completedSets, totalSets, matchTime, currentUser, gameLog, possessionSeconds]);


  // --- RENDER ---

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <>
      <ConfirmationModal 
        isOpen={isDiscardModalOpen}
        title="Discard Active Match?"
        message="Are you sure you want to discard the active match? All unsaved progress will be lost and this cannot be undone."
        onConfirm={performDiscardMatch}
        onCancel={() => setIsDiscardModalOpen(false)}
      />

      <TeamSelectionModal 
         isOpen={isTeamSelectionOpen}
         squad={squad}
         onConfirm={startNewMatch}
         onCancel={() => setIsTeamSelectionOpen(false)}
      />
      
      <NotificationModal 
        isOpen={!!notification}
        title={notification?.title || ''}
        message={notification?.message || ''}
        onClose={() => setNotification(null)}
      />
      
      <CardAssignmentModal
        isOpen={cardAssignmentState.isOpen}
        type={cardAssignmentState.type}
        players={players}
        onConfirm={handleCardAssignment}
        onCancel={() => setCardAssignmentState({ isOpen: false, type: null })}
      />

      {currentScreen === 'dashboard' ? (
        <Dashboard
          currentUser={currentUser}
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
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      ) : (
        <div className="flex flex-col h-screen bg-[#F5F5F7] dark:bg-[#0F0F10] overflow-hidden font-sans transition-colors duration-300">
          
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
            title={pendingEventType === 'penalty' ? "Penalty Details" : "Error Details"}
            playerName={pendingPenaltyPlayerName}
            showLocation={true}
            onSubmit={handleEventDetailsSubmit}
            onClose={() => {
              setPendingPenaltyLogId(null);
              setPendingPenaltyPlayerName('');
              setPendingEventType(null);
            }}
          />

          {/* Header */}
          <header className="bg-white/80 dark:bg-[#1A1A1C]/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-white/5 flex-none z-50 relative supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#1A1A1C]/60 transition-colors">
            <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
              
              {/* Left: Sets */}
              <div className="flex-none w-auto sm:w-64 flex flex-col items-center justify-center sm:items-start">
                 <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-white/5 rounded-xl p-2 border border-gray-100 dark:border-white/5 shadow-sm">
                   <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Completed Sets</span>
                   <div className="flex items-center justify-center space-x-2 mb-1">
                      <input
                         type="number"
                         value={completedSets}
                         onChange={(e) => setCompletedSets(Number(e.target.value))}
                         disabled={gameStatus === 'finished' || !isInitialized}
                         className="w-10 text-center font-heading font-bold text-xl text-blue-600 dark:text-blue-400 bg-transparent outline-none p-0 disabled:text-gray-400 dark:disabled:text-gray-600"
                      />
                      <span className="text-gray-300 dark:text-gray-600 font-light text-xl">/</span>
                      <input
                         type="number"
                         value={totalSets}
                         onChange={(e) => setTotalSets(Number(e.target.value))}
                         disabled={gameStatus === 'finished' || !isInitialized}
                         className="w-10 text-center font-heading font-bold text-xl text-gray-600 dark:text-gray-300 bg-transparent outline-none p-0 disabled:text-gray-400 dark:disabled:text-gray-600"
                      />
                   </div>
                   <div className="flex space-x-2">
                       <button onClick={handleSetComplete} disabled={gameStatus === 'finished' || !isInitialized} className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50 transition-colors">+ Comp</button>
                       <button onClick={handleSetFail} disabled={gameStatus === 'finished' || !isInitialized} className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase disabled:opacity-50 transition-colors">+ Miss</button>
                   </div>
                 </div>
              </div>

              {/* Center: Scores & Name */}
              <div className="flex-1 flex flex-col justify-center items-center px-2">
                 <div className="flex justify-center items-center space-x-4 sm:space-x-8 bg-white/50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                  {/* Left Score */}
                  <input type="number" value={leftScore} onChange={(e) => setLeftScore(e.target.value)} disabled={gameStatus === 'finished' || !isInitialized} className="w-16 text-center text-4xl font-heading font-black text-slate-800 dark:text-white bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600" placeholder="0" />
                  
                  <div className="flex flex-col items-center">
                    <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} disabled={gameStatus === 'finished' || !isInitialized} placeholder="TEAM NAME" className="w-full min-w-[120px] max-w-[240px] text-center text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-transparent outline-none uppercase tracking-tight disabled:text-gray-500 dark:disabled:text-gray-500" />
                    <input 
                      type="text" 
                      value={opponentName} 
                      onChange={(e) => setOpponentName(e.target.value)} 
                      disabled={gameStatus === 'finished' || !isInitialized} 
                      placeholder="VS OPPONENT" 
                      className="mt-0.5 w-full max-w-[200px] text-center text-xs font-semibold text-gray-400 dark:text-gray-500 bg-transparent outline-none uppercase tracking-widest disabled:text-gray-300 dark:disabled:text-gray-700" 
                    />
                  </div>

                  {/* Right Score with Buttons */}
                  <div className="flex items-center space-x-2">
                    <input type="number" value={rightScore} onChange={(e) => setRightScore(e.target.value)} disabled={gameStatus === 'finished' || !isInitialized} className="w-16 text-center text-4xl font-heading font-black text-slate-800 dark:text-white bg-transparent outline-none placeholder-gray-300 dark:placeholder-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600" placeholder="0" />
                    <div className="flex flex-col space-y-1">
                      <button 
                         onClick={() => handleOpponentScore('try')}
                         disabled={gameStatus === 'finished' || !isInitialized}
                         className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-slate-600 dark:text-gray-300 rounded shadow-sm hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-900/30 transition-colors disabled:opacity-50"
                         title="Opponent Try (+4)"
                      >
                        T
                      </button>
                      <button 
                         onClick={() => handleOpponentScore('kick')}
                         disabled={gameStatus === 'finished' || !isInitialized}
                         className="w-6 h-6 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-slate-600 dark:text-gray-300 rounded shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-900/30 transition-colors disabled:opacity-50"
                         title="Opponent Kick (+2)"
                      >
                        K
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right: Actions */}
              <div className="flex-none w-auto sm:w-64 flex justify-end items-center space-x-3">
                 <Button variant="secondary" onClick={handleBackToDashboard} className="text-xs sm:text-sm px-4 py-2 shadow-sm bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 rounded-full border border-gray-100 dark:border-white/5">
                   <span className="flex items-center">
                     <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     <span className="hidden sm:inline">Exit</span>
                   </span>
                 </Button>

                <Button variant="secondary" onClick={downloadStats} className="text-xs sm:text-sm px-4 py-2 shadow-sm bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 rounded-full border border-gray-100 dark:border-white/5">
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span className="hidden sm:inline">Export</span>
                  </span>
                </Button>
                
                {isInitialized && gameStatus !== 'finished' && (
                  <Button variant="danger" onClick={() => setIsResetModalOpen(true)} className="text-xs sm:text-sm px-4 py-2 shadow-sm rounded-full">Reset</Button>
                )}

                <button 
                   onClick={toggleTheme} 
                   className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                   title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                 >
                   {darkMode ? (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                   ) : (
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                   )}
                 </button>
              </div>
            </div>
          </header>

          {/* Game Control Toolbar */}
          <div className="bg-white/80 dark:bg-[#1A1A1C]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-white/5 px-4 py-3 flex items-center justify-between shadow-sm z-40 relative transition-colors">
            {/* Left: View Toggles */}
            <div className="flex items-center space-x-4">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:inline">View:</span>
              <div className="flex bg-gray-100/80 dark:bg-white/10 p-1 rounded-lg">
                <button onClick={() => setViewMode('total')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'total' ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Full Game</button>
                <button onClick={() => setViewMode('1st')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === '1st' ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>1st Half</button>
                <button onClick={() => setViewMode('2nd')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === '2nd' ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>2nd Half</button>
              </div>
            </div>

            {/* Center: Match Timer & Possession */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-4">
              {/* Possession Widget */}
              <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/10 rounded-full p-1 border border-gray-200 dark:border-white/5">
                <button 
                  onClick={() => setPossessionMode('attack')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${possessionMode === 'attack' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Attack
                </button>
                <div className="px-2 w-24">
                   {/* Progress Bar */}
                   <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-blue-500" 
                         style={{ width: `${matchTime > 0 ? (possessionSeconds / matchTime) * 100 : 50}%` }}
                      />
                   </div>
                   <div className="text-[9px] text-center font-mono mt-0.5 text-gray-500 dark:text-gray-400">
                      {matchTime > 0 ? ((possessionSeconds / matchTime) * 100).toFixed(0) : 0}% Poss.
                   </div>
                </div>
                <button 
                  onClick={() => setPossessionMode('defense')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${possessionMode === 'defense' ? 'bg-white dark:bg-white/20 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Defend
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center space-x-3 bg-white dark:bg-white/5 px-4 py-1.5 rounded-full border border-gray-100 dark:border-white/5 shadow-apple dark:shadow-none">
                <button 
                  type="button"
                  onClick={toggleTimer}
                  disabled={gameStatus === 'finished' || !isInitialized}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                    isTimerRunning 
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50' 
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  } ${gameStatus === 'finished' || !isInitialized ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                >
                  {isTimerRunning ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                <span className={`text-2xl font-mono font-medium tabular-nums leading-none tracking-tight ${isTimerRunning ? 'text-slate-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                  {formatTime(matchTime)}
                </span>

                <button 
                  type="button"
                  onClick={resetTimer}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  title="Reset Timer"
                  disabled={matchTime === 0 || !isInitialized}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right: End Phase Button */}
            {gameStatus !== 'finished' && isInitialized ? (
              <button
                type="button"
                onClick={() => setIsPhaseModalOpen(true)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-full text-xs font-bold transition-colors shadow-sm ${
                  gameStatus === '1st'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-900/50'
                    : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-900/50'
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
                  <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-100 dark:border-green-900/30 shadow-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Match Complete
                  </span>
               )
            )}
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto relative w-full z-0 mx-auto px-4 py-4">
            
            {gameStatus === 'finished' && fullMatchStats ? (
               <MatchCharts matchData={{
                  players: displayPlayers,
                  leftScore: parseInt(leftScore || '0'),
                  rightScore: parseInt(rightScore || '0'),
                  possessionSeconds,
                  matchTime,
                  teamName: teamName || 'Team',
                  opponentName: opponentName || 'Opponent'
               }} />
            ) : (
            <div className="bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden mx-auto max-w-full transition-colors">
                <div className="overflow-x-auto">
                    <table className="min-w-max border-collapse w-full mx-auto">
                    <thead className="bg-gray-50/50 dark:bg-white/5 text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <tr>
                        <th className="p-4 sticky left-0 z-30 bg-gray-50/95 dark:bg-[#1A1A1C]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 text-center w-[60px]">#</th>
                        <th className="p-4 sticky left-[60px] z-30 bg-gray-50/95 dark:bg-[#1A1A1C]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 text-left w-[200px] border-r border-gray-100 dark:border-white/5">Player Name</th>
                        {STAT_CONFIGS.map(config => (
                            <th key={config.key} className="p-4 border-b border-gray-100 dark:border-white/5 text-center min-w-[160px]">
                            <div className="flex flex-col items-center">
                                <span className="font-heading text-slate-700 dark:text-gray-200">{config.label}</span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal normal-case mt-0.5">
                                {viewMode === 'total' ? 'Full' : viewMode === '1st' ? '1st Half' : '2nd Half'} Total: {statsMeta.totals[config.key]}
                                </span>
                            </div>
                            </th>
                        ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {displayPlayers.map((player, index) => (
                        <PlayerRow
                            key={player.id}
                            player={player}
                            isOdd={index % 2 !== 0}
                            onStatChange={handleStatChange}
                            onIdentityChange={handleIdentityChange}
                            onCardAction={handleCardAction}
                            onToggleFieldStatus={handleToggleFieldStatus}
                            teamTotals={statsMeta.totals}
                            maxValues={statsMeta.maxValues}
                            leaderCounts={statsMeta.leaderCounts}
                            isReadOnly={gameStatus === 'finished' || (viewMode === '1st' && gameStatus !== '1st') || !isInitialized}
                        />
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Collapsible Match Event Log */}
            <div className="max-w-[calc(100%-1rem)] mx-auto mt-8 mb-24">
                <button 
                  onClick={() => setIsMatchLogOpen(!isMatchLogOpen)}
                  className="w-full flex items-center justify-between bg-white dark:bg-[#1A1A1C] px-6 py-4 rounded-2xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-white text-left">Match Log</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-left">{gameLog.length} Events Recorded</p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${isMatchLogOpen ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMatchLogOpen && gameLog.length > 0 && (
                    <div className="mt-4 bg-white dark:bg-[#1A1A1C] border border-gray-100 dark:border-white/5 rounded-2xl shadow-apple dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <table className="min-w-full divide-y divide-gray-50 dark:divide-white/5">
                            <thead className="bg-gray-50/50 dark:bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Player</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Event</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-[#1A1A1C] divide-y divide-gray-50 dark:divide-white/5">
                                {gameLog.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {entry.formattedTime} <span className="text-xs text-gray-300 dark:text-gray-600 ml-1">({entry.period})</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                                            {entry.playerName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                                entry.type === 'penalty' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 
                                                entry.type === 'error' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' : 
                                                entry.type === 'try' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                                                entry.type === 'yellow_card' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                                                entry.type === 'red_card' ? 'bg-red-600 text-white' :
                                                entry.type === 'substitution' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                                                'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {entry.type === 'penalty' ? 'Penalty' : 
                                                 entry.type === 'error' ? 'Error' :
                                                 entry.type === 'try' ? 'Try' :
                                                 entry.type === 'yellow_card' ? 'Yellow Card' :
                                                 entry.type === 'red_card' ? 'Red Card' : 
                                                 entry.type === 'substitution' ? 'Substitution' : entry.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {entry.location || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {entry.reason ? (
                                                <span className="italic">{entry.reason}</span>
                                            ) : (
                                                <span className="text-gray-300 dark:text-gray-600">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
          </main>
          
          {/* Bottom Control Bar */}
          <div className="bg-white/80 dark:bg-[#1A1A1C]/80 backdrop-blur-md border-t border-gray-200/50 dark:border-white/5 px-6 py-4 flex-none z-20 flex items-center justify-between pb-8 safe-area-bottom transition-colors">
            <div className="flex items-center space-x-6">
              <Toggle 
                label="Penalty Details" 
                description="Prompt for info"
                checked={settings.promptPenaltyReason}
                onChange={(val) => setSettings(s => ({ ...s, promptPenaltyReason: val }))}
              />
              
              <Toggle 
                label="Error Details" 
                description="Prompt for info"
                checked={settings.promptErrorReason}
                onChange={(val) => setSettings(s => ({ ...s, promptErrorReason: val }))}
              />
              
              <div className="h-8 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
              
              <button 
                onClick={() => setCardAssignmentState({ isOpen: true, type: 'yellow' })}
                disabled={gameStatus === 'finished' || !isInitialized}
                className="flex items-center px-4 py-2 bg-yellow-100/50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-yellow-200/50 dark:border-yellow-700/30"
              >
                 <span className="w-4 h-4 bg-yellow-400 rounded-sm mr-2.5 shadow-sm"></span>
                 Yellow Card
              </button>
              
              <button 
                onClick={() => setCardAssignmentState({ isOpen: true, type: 'red' })}
                disabled={gameStatus === 'finished' || !isInitialized}
                className="flex items-center px-4 py-2 bg-red-100/50 dark:bg-red-900/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200/50 dark:border-red-700/30"
              >
                 <span className="w-4 h-4 bg-red-500 rounded-sm mr-2.5 shadow-sm"></span>
                 Red Card
              </button>
            </div>

            <div className="flex items-center space-x-2 text-xs font-medium text-gray-400 dark:text-gray-500">
               <span className="inline-block w-2 h-2 rounded-full bg-yellow-400/80"></span>
               <span className="hidden sm:inline">Team Leader</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
