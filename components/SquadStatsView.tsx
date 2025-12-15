
import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { SquadPlayer, MatchHistoryItem, Player, PlayerStats } from '../types';
import { STAT_CONFIGS, INITIAL_STATS, IMPACT_WEIGHTS } from '../constants';

// --- HELPER: IMPACT CALCULATION ---
const calculateImpact = (stats: PlayerStats) => {
  let score = 0;
  // Base
  score += stats.tackles * IMPACT_WEIGHTS.tackles;
  score += stats.hitUps * IMPACT_WEIGHTS.hitUps;
  score += stats.triesScored * IMPACT_WEIGHTS.triesScored;
  score += stats.kicks * IMPACT_WEIGHTS.kicks;
  score += stats.errors * IMPACT_WEIGHTS.errors;
  score += stats.penaltiesConceded * IMPACT_WEIGHTS.penaltiesConceded;
  
  // Advanced
  score += (stats.tryAssists || 0) * IMPACT_WEIGHTS.tryAssists;
  score += (stats.lineBreaks || 0) * IMPACT_WEIGHTS.lineBreaks;
  score += (stats.offloads || 0) * IMPACT_WEIGHTS.offloads;
  score += (stats.fortyTwenties || 0) * IMPACT_WEIGHTS.fortyTwenties;
  score += (stats.forcedDropouts || 0) * IMPACT_WEIGHTS.forcedDropouts;
  score += (stats.trySavers || 0) * IMPACT_WEIGHTS.trySavers;
  score += (stats.oneOnOneStrips || 0) * IMPACT_WEIGHTS.oneOnOneStrips;
  score += (stats.missedTackles || 0) * IMPACT_WEIGHTS.missedTackles;

  return score;
};

// --- SUB-COMPONENT: FUT CARD MODAL ---
interface PlayerCardModalProps {
  player: SquadPlayer;
  history: MatchHistoryItem[];
  onClose: () => void;
}

const PlayerCardModal: React.FC<PlayerCardModalProps> = ({ player, history, onClose }) => {
  const [showLegend, setShowLegend] = useState(false);

  // 1. Calculate Aggregated Stats & Averages
  const playerStats = useMemo(() => {
    let games = 0;
    const totals: PlayerStats & { impact: number } = { ...INITIAL_STATS, impact: 0 };

    history.forEach(match => {
      const matchPlayers = match.data.players || [];
      const pData = matchPlayers.find((p: Player) => 
        p.squadId === player.id || p.name.toLowerCase() === player.name.toLowerCase()
      );

      if (pData) {
        games++;
        // Sum basic stats
        (Object.keys(INITIAL_STATS) as (keyof PlayerStats)[]).forEach(k => {
           totals[k] += pData.stats[k] || 0;
        });
        // Sum impact
        totals.impact += calculateImpact(pData.stats);
      }
    });

    // Averages (avoid div/0)
    const div = games || 1;
    return {
      games,
      avg: {
        tackles: totals.tackles / div,
        hitUps: totals.hitUps / div,
        impact: totals.impact / div,
        tries: totals.triesScored / div,
        assists: (totals.tryAssists || 0) / div,
        errors: totals.errors / div,
        penalties: totals.penaltiesConceded / div,
        offloads: (totals.offloads || 0) / div,
        lineBreaks: (totals.lineBreaks || 0) / div,
        kicks: (totals.kicks || 0) / div,
        trySavers: (totals.trySavers || 0) / div,
      }
    };
  }, [history, player]);

  // 2. Map to "FUT" Attributes (0-99 Scale)
  const getRating = (val: number, maxExpected: number) => {
    return Math.min(99, Math.max(10, Math.round((val / maxExpected) * 99)));
  };

  // We define "Max Expected" values for a single game average to normalize to 99
  // These might need tuning based on level of play
  const attributes = {
    RUN: getRating(playerStats.avg.hitUps, 15),          // Running (Hitups)
    TRY: getRating(playerStats.avg.tries * 2 + playerStats.avg.lineBreaks, 3), // Try Scoring Ability
    PAS: getRating(playerStats.avg.assists * 3 + playerStats.avg.offloads, 4), // Playmaking (Assists + Offloads)
    DEF: getRating(playerStats.avg.tackles, 25),         // Defense (Tackles)
    PHY: getRating(playerStats.avg.impact, 40),          // Physicality (Impact Score)
    DIS: Math.max(10, 99 - Math.round((playerStats.avg.errors + playerStats.avg.penalties) * 15)) // Discipline (Inverse of errors)
  };

  // Overall Rating (Weighted Average)
  const overall = Math.round(
    (attributes.RUN + attributes.TRY + attributes.PAS + attributes.DEF * 1.5 + attributes.PHY + attributes.DIS) / 6.5
  );

  // Card Theme based on OVR
  let cardTheme = {
    bg: 'bg-gradient-to-br from-yellow-600 via-yellow-200 to-yellow-600', // Gold
    border: 'border-yellow-400',
    text: 'text-slate-900',
    glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]'
  };

  if (overall < 65) {
    cardTheme = {
      bg: 'bg-gradient-to-br from-orange-700 via-orange-300 to-orange-700', // Bronze
      border: 'border-orange-400',
      text: 'text-slate-900',
      glow: 'shadow-[0_0_30px_rgba(194,65,12,0.4)]'
    };
  } else if (overall < 75) {
    cardTheme = {
      bg: 'bg-gradient-to-br from-slate-400 via-slate-100 to-slate-400', // Silver
      border: 'border-slate-300',
      text: 'text-slate-900',
      glow: 'shadow-[0_0_30px_rgba(148,163,184,0.4)]'
    };
  } else if (overall >= 90) {
    cardTheme = {
      bg: 'bg-gradient-to-br from-blue-600 via-cyan-400 to-blue-800', // TOTY / Special
      border: 'border-cyan-400',
      text: 'text-white',
      glow: 'shadow-[0_0_40px_rgba(34,211,238,0.6)]'
    };
  }

  // 3. Radar Chart Logic
  // Points: RUN, TRY, PAS, DIS, PHY, DEF (Clockwise from top)
  // Center is 50,50. Radius 40.
  const chartData = [
    { label: 'RUN', value: attributes.RUN },
    { label: 'TRY', value: attributes.TRY },
    { label: 'PAS', value: attributes.PAS },
    { label: 'DIS', value: attributes.DIS },
    { label: 'PHY', value: attributes.PHY },
    { label: 'DEF', value: attributes.DEF },
  ];

  const getPoint = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / 100) * 40; // max radius 40
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    return `${x},${y}`;
  };

  const polygonPoints = chartData.map((d, i) => getPoint(d.value, i, 6)).join(' ');
  const bgPoints = chartData.map((_, i) => getPoint(100, i, 6)).join(' ');
  const midPoints = chartData.map((_, i) => getPoint(50, i, 6)).join(' ');

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* THE CARD */}
        <div className={`relative w-[320px] h-[500px] rounded-t-3xl rounded-b-xl overflow-hidden ${cardTheme.glow} transition-all`}>
           {/* Card Frame/Background */}
           <div className={`absolute inset-0 ${cardTheme.bg} p-[6px]`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
              {/* Inner Dark Area */}
              <div className="w-full h-full bg-slate-900/90 rounded-t-[20px] rounded-b-lg relative overflow-hidden flex flex-col">
                 
                 {/* Top Section: Rating, Position, Nation/Club */}
                 <div className="flex p-5 relative z-10">
                    <div className="flex flex-col items-center mr-4">
                       <span className={`text-5xl font-heading font-black tracking-tighter ${overall >= 90 ? 'text-cyan-300' : 'text-yellow-100'} drop-shadow-md`}>{overall}</span>
                       <span className="text-sm font-bold text-white/80 uppercase tracking-widest mt-1">{player.position ? player.position.substring(0, 3) : 'PLY'}</span>
                       <div className="w-8 h-[1px] bg-white/20 my-2"></div>
                       {/* Club Logo Placeholder */}
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">🛡️</div>
                    </div>
                    
                    {/* Player Image Placeholder (Silhouette) */}
                    <div className="flex-1 flex justify-center items-end relative">
                       <div className="w-32 h-32 bg-gradient-to-t from-black/50 to-transparent absolute bottom-0 z-0"></div>
                       <svg className="w-32 h-36 text-white/20 relative z-10 drop-shadow-2xl" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    </div>

                    {/* Info Toggle */}
                    <button 
                      onClick={() => setShowLegend(!showLegend)}
                      className="absolute top-4 right-2 text-white/30 hover:text-white transition-colors p-2"
                      title="What do these stats mean?"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                 </div>

                 {/* Name Plate */}
                 <div className="text-center relative z-20 -mt-2 mb-2">
                    <h2 className="text-2xl font-heading font-black text-white uppercase tracking-wider drop-shadow-lg">{player.name}</h2>
                    <div className="w-2/3 h-[2px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mt-1"></div>
                 </div>

                 {/* Stats Section Container */}
                 <div className="flex-1 relative z-10">
                    {showLegend ? (
                      <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center p-6 animate-in fade-in">
                         <div className="space-y-3 w-full">
                           <h4 className="text-white font-bold text-center border-b border-white/10 pb-2 mb-2">Stat Definitions</h4>
                           <div className="grid grid-cols-1 gap-2 text-xs">
                             <div className="flex justify-between items-center"><span className="font-bold text-yellow-400 w-8">RUN</span> <span className="text-gray-300">Carrying (Hit-ups & Metres)</span></div>
                             <div className="flex justify-between items-center"><span className="font-bold text-yellow-400 w-8">DEF</span> <span className="text-gray-300">Defense (Tackles Made)</span></div>
                             <div className="flex justify-between items-center"><span className="font-bold text-yellow-400 w-8">PHY</span> <span className="text-gray-300">Physicality (Impact Score)</span></div>
                             <div className="flex justify-between items-center"><span className="font-bold text-yellow-400 w-8">TRY</span> <span className="text-gray-300">Scoring (Tries & Breaks)</span></div>
                             <div className="flex justify-between items-center"><span className="font-bold text-yellow-400 w-8">PAS</span> <span className="text-gray-300">Playmaking (Assists/Offloads)</span></div>
                             <div className="flex justify-between items-center"><span className="font-bold text-yellow-400 w-8">DIS</span> <span className="text-gray-300">Discipline (Low Errors)</span></div>
                           </div>
                           <button onClick={() => setShowLegend(false)} className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded text-xs text-white">Close info</button>
                         </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 px-5 pb-5 h-full">
                        {/* Left: Attributes */}
                        <div className="flex flex-col justify-center space-y-1.5 text-sm">
                          <div className="flex items-center justify-between text-white/90">
                              <span className="font-bold mr-2 text-white/60">RUN</span>
                              <span className="font-heading font-bold text-yellow-400">{attributes.RUN}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90">
                              <span className="font-bold mr-2 text-white/60">DEF</span>
                              <span className="font-heading font-bold text-yellow-400">{attributes.DEF}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90">
                              <span className="font-bold mr-2 text-white/60">PHY</span>
                              <span className="font-heading font-bold text-yellow-400">{attributes.PHY}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90">
                              <span className="font-bold mr-2 text-white/60">TRY</span>
                              <span className="font-heading font-bold text-yellow-400">{attributes.TRY}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90">
                              <span className="font-bold mr-2 text-white/60">PAS</span>
                              <span className="font-heading font-bold text-yellow-400">{attributes.PAS}</span>
                          </div>
                          <div className="flex items-center justify-between text-white/90">
                              <span className="font-bold mr-2 text-white/60">DIS</span>
                              <span className="font-heading font-bold text-yellow-400">{attributes.DIS}</span>
                          </div>
                        </div>

                        {/* Right: Radar Chart */}
                        <div className="flex items-center justify-center relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full max-w-[120px] drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                              {/* Background Web */}
                              <polygon points={bgPoints} fill="#1e293b" stroke="#475569" strokeWidth="1" opacity="0.5" />
                              <polygon points={midPoints} fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.3" />
                              
                              {/* Data Shape */}
                              <polygon 
                                  points={polygonPoints} 
                                  fill={overall >= 90 ? "rgba(34, 211, 238, 0.5)" : "rgba(250, 204, 21, 0.5)"}
                                  stroke={overall >= 90 ? "#22d3ee" : "#facc15"} 
                                  strokeWidth="2" 
                              />
                              
                              {/* Labels (Simplified dots for cleaner look on card) */}
                              {chartData.map((d, i) => {
                                  const [x, y] = getPoint(115, i, 6).split(','); // Push labels out a bit
                                  return (
                                    <text 
                                        key={i} 
                                        x={x} 
                                        y={y} 
                                        fontSize="8" 
                                        fill="rgba(255,255,255,0.5)" 
                                        textAnchor="middle" 
                                        dominantBaseline="middle"
                                        fontWeight="bold"
                                    >
                                        {d.label[0]}
                                    </text>
                                  );
                              })}
                            </svg>
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Bottom Decor */}
                 <div className="h-2 bg-gradient-to-r from-transparent via-white/10 to-transparent mt-auto"></div>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-4">
           <button onClick={onClose} className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-sm transition-colors border border-white/10">
              Close
           </button>
           <button className="px-6 py-2 rounded-full bg-white text-slate-900 font-bold hover:scale-105 transition-transform shadow-lg flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Share Card
           </button>
        </div>

      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface SquadStatsViewProps {
  squad: SquadPlayer[];
  history: MatchHistoryItem[];
  onAddPlayer: (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, updates: Partial<SquadPlayer>) => void;
}

export const SquadStatsView: React.FC<SquadStatsViewProps> = ({
  squad,
  history,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'stats' | 'leaderboard'>('roster');
  
  // Sort State
  const [rosterSort, setRosterSort] = useState<{ key: 'name' | 'position'; direction: 'asc' | 'desc' } | null>(null);
  const [statSort, setStatSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'form', // Default sort by form
    direction: 'desc' 
  });
  
  // Trend Analysis State
  const [selectedCardPlayer, setSelectedCardPlayer] = useState<SquadPlayer | null>(null);

  // Add Player Form State
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');

  // Edit Player State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    onAddPlayer({
      name: newName,
      position: newPosition
    });
    
    setNewName('');
    setNewPosition('');
  };

  const handleRosterSort = (key: 'name' | 'position') => {
    setRosterSort(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleStatSort = (key: string) => {
    setStatSort(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: key === 'name' ? 'asc' : 'desc' };
    });
  };

  // Editing Handlers
  const startEditing = (player: SquadPlayer) => {
    setEditingId(player.id);
    setEditName(player.name);
    setEditPosition(player.position || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditPosition('');
  };

  const saveEditing = () => {
    if (editingId && editName.trim()) {
      onUpdatePlayer(editingId, { name: editName, position: editPosition });
      cancelEditing();
    }
  };

  // Sort Logic for Roster
  const displaySquad = useMemo(() => {
    if (!rosterSort) return squad;
    
    return [...squad].sort((a, b) => {
      const valA = (a[rosterSort.key] || '').toLowerCase();
      const valB = (b[rosterSort.key] || '').toLowerCase();
      
      if (valA < valB) return rosterSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return rosterSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [squad, rosterSort]);

  // Aggregated Stats Calculation with Sort
  const careerStats = useMemo(() => {
    const statsMap: Record<string, { 
      games: number, 
      stats: PlayerStats, 
      name: string,
      wins: number,
      historyImpacts: number[], // Store all impact scores for history
      rawPlayer: SquadPlayer
    }> = {};

    // Initialize map with current squad
    squad.forEach(p => {
      statsMap[p.id] = {
        name: p.name,
        games: 0,
        wins: 0,
        stats: { ...INITIAL_STATS },
        historyImpacts: [],
        rawPlayer: p
      };
    });

    history.forEach(match => {
      const matchPlayers: Player[] = match.data.players || [];
      const isWin = match.result === 'win';

      matchPlayers.forEach(mp => {
        let squadId = mp.squadId;
        if (!squadId) {
          const found = squad.find(s => s.name.toLowerCase() === mp.name.toLowerCase());
          if (found) squadId = found.id;
        }

        if (squadId && statsMap[squadId]) {
          const entry = statsMap[squadId];
          entry.games += 1;
          if (isWin) entry.wins += 1;
          
          const finalStats = (match.data.fullMatchStats && match.data.fullMatchStats[mp.id]) || mp.stats;
          
          // Calculate impact for this specific match
          const matchImpact = calculateImpact(finalStats);
          entry.historyImpacts.push(matchImpact);

          Object.keys(finalStats).forEach(k => {
             const key = k as keyof PlayerStats;
             if (typeof finalStats[key] === 'number') {
                entry.stats[key] += finalStats[key];
             }
          });
        }
      });
    });

    // Convert map to array and calculate Form
    const aggregated = Object.entries(statsMap).map(([id, data]) => {
        // Calculate Form Rating (Avg Impact normalized to 0-99)
        // Benchmark: 35 average impact points = 99 Rating
        const totalImpact = data.historyImpacts.reduce((a, b) => a + b, 0);
        const avgImpact = data.games > 0 ? totalImpact / data.games : 0;
        const formRating = Math.min(99, Math.round((avgImpact / 35) * 99)); // 35 is "Elite" benchmark
        
        // Get last 5 games for sparkline (or less if fewer games)
        const recentForm = data.historyImpacts.slice(-5);

        return { 
            id, 
            ...data,
            formRating: data.games > 0 ? formRating : 0,
            recentForm
        };
    });

    // Apply Sorting
    return aggregated.sort((a, b) => {
      const { key, direction } = statSort;
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (key === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (key === 'games') {
        valA = a.games;
        valB = b.games;
      } else if (key === 'form') {
        valA = a.formRating;
        valB = b.formRating;
      } else {
        // Stats key
        valA = a.stats[key as keyof PlayerStats] || 0;
        valB = b.stats[key as keyof PlayerStats] || 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

  }, [squad, history, statSort]);

  // Leaderboard Calculation (omitted for brevity, same as before)
  const leaderboard = useMemo(() => {
    const scores: Record<string, { total: number; threes: number; twos: number; ones: number; name: string }> = {};
    history.forEach(match => {
      if (match.voting) {
        const { threePointsId, twoPointsId, onePointId } = match.voting;
        const matchPlayers = match.data.players || [];
        const getName = (id: string) => {
           const matchPlayer = matchPlayers.find((p: Player) => p.id === id);
           if (matchPlayer) return matchPlayer.name;
           const squadPlayer = squad.find(s => s.id === id);
           return squadPlayer ? squadPlayer.name : 'Unknown';
        };
        [
          { id: threePointsId, points: 3, type: 'threes' },
          { id: twoPointsId, points: 2, type: 'twos' },
          { id: onePointId, points: 1, type: 'ones' }
        ].forEach(({ id, points, type }) => {
           let finalId = id;
           let name = getName(id);
           const matchPlayer = matchPlayers.find((p: Player) => p.id === id);
           if (matchPlayer && matchPlayer.squadId) {
             finalId = matchPlayer.squadId;
             const sq = squad.find(s => s.id === finalId);
             if (sq) name = sq.name;
           } else {
             const sq = squad.find(s => s.name === name);
             if (sq) finalId = sq.id;
           }
           if (!scores[finalId]) scores[finalId] = { total: 0, threes: 0, twos: 0, ones: 0, name };
           scores[finalId].total += points;
           // @ts-ignore
           scores[finalId][type] += 1;
        });
      }
    });
    return Object.entries(scores).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.total - a.total);
  }, [history, squad]);

  const getFormColor = (rating: number) => {
      if (rating >= 90) return 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]'; // Elite
      if (rating >= 75) return 'bg-gradient-to-r from-yellow-500 to-amber-400 text-white'; // Gold
      if (rating >= 60) return 'bg-gray-400 text-white'; // Silver
      return 'bg-orange-700/80 text-white'; // Bronze
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('roster')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'roster' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Squad Roster</button>
        <button onClick={() => setActiveTab('stats')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'stats' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Career Statistics</button>
        <button onClick={() => setActiveTab('leaderboard')} className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'leaderboard' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Player of the Year</button>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
           <div className="lg:col-span-3 mb-4">
              <div className="flex justify-center items-end space-x-4 h-64">
                 {leaderboard[1] && <div className="flex flex-col items-center w-1/3 max-w-[150px]"><div className="mb-2 text-center"><span className="block text-sm font-bold text-slate-600 dark:text-gray-300">{leaderboard[1].name}</span><span className="text-xs text-gray-400">{leaderboard[1].total} pts</span></div><div className="w-full bg-slate-300 dark:bg-slate-700 h-32 rounded-t-xl relative flex items-center justify-center shadow-lg"><span className="text-4xl font-heading font-black text-white/50">2</span></div></div>}
                 {leaderboard[0] ? <div className="flex flex-col items-center w-1/3 max-w-[150px] z-10"><div className="mb-2 text-center"><span className="text-2xl mb-1 block">👑</span><span className="block text-lg font-heading font-black text-slate-900 dark:text-white">{leaderboard[0].name}</span><span className="text-sm font-bold text-yellow-500">{leaderboard[0].total} pts</span></div><div className="w-full bg-yellow-400 h-40 rounded-t-xl relative flex items-center justify-center shadow-xl"><span className="text-5xl font-heading font-black text-white/50">1</span></div></div> : <div className="flex items-center justify-center h-full text-gray-400">No votes recorded yet.</div>}
                 {leaderboard[2] && <div className="flex flex-col items-center w-1/3 max-w-[150px]"><div className="mb-2 text-center"><span className="block text-sm font-bold text-slate-600 dark:text-gray-300">{leaderboard[2].name}</span><span className="text-xs text-gray-400">{leaderboard[2].total} pts</span></div><div className="w-full bg-orange-300 dark:bg-orange-800 h-24 rounded-t-xl relative flex items-center justify-center shadow-lg"><span className="text-3xl font-heading font-black text-white/50">3</span></div></div>}
              </div>
           </div>
           <div className="lg:col-span-3 bg-white dark:bg-[#1A1A1C] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                 <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                       <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
                       <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Points</th>
                       <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-yellow-600 dark:text-yellow-500">3 Pts</th>
                       <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">2 Pts</th>
                       <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">1 Pt</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white dark:bg-[#1A1A1C] divide-y divide-gray-200 dark:divide-white/5">
                    {leaderboard.map((p, i) => (
                       <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-400 dark:text-gray-500">#{i + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center"><span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm">{p.total}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 dark:text-yellow-500 font-bold">{p.threes}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{p.twos}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{p.ones}</td>
                       </tr>
                    ))}
                    {leaderboard.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No votes recorded this season.</td></tr>}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1A1A1C] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Player</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Name</label><input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white placeholder-gray-400" placeholder="e.g. John Smith" /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Position</label><input type="text" value={newPosition} onChange={e => setNewPosition(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white placeholder-gray-400" placeholder="e.g. Prop" /></div>
                <Button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800">Add to Squad</Button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1A1A1C] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" onClick={() => handleRosterSort('name')}><div className="flex items-center space-x-1"><span>Name</span>{rosterSort?.key === 'name' && <span className="text-red-500">{rosterSort.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" onClick={() => handleRosterSort('position')}><div className="flex items-center space-x-1"><span>Position</span>{rosterSort?.key === 'position' && <span className="text-red-500">{rosterSort.direction === 'asc' ? '↑' : '↓'}</span>}</div></th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A1A1C] divide-y divide-gray-200 dark:divide-white/10">
                  {displaySquad.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">No players in squad. Add one to get started.</td></tr>
                  ) : (
                    displaySquad.map(player => (
                      <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        {editingId === player.id ? (
                          <><td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2 py-1 border border-gray-300 dark:border-white/20 rounded text-sm text-slate-900 dark:text-white bg-white dark:bg-white/5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Player Name" /></td><td className="px-6 py-4 whitespace-nowrap"><input type="text" value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className="w-full px-2 py-1 border border-gray-300 dark:border-white/20 rounded text-sm text-slate-900 dark:text-white bg-white dark:bg-white/5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Position" /></td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2"><button onClick={saveEditing} className="inline-flex items-center justify-center p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 transition-colors" title="Save"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button><button onClick={cancelEditing} className="inline-flex items-center justify-center p-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 transition-colors" title="Cancel"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td></>
                        ) : (
                          <><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{player.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{player.position || '-'}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="flex justify-end space-x-2"><button onClick={() => startEditing(player)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit Player"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button><button onClick={() => { if(window.confirm('Remove player from squad?')) onRemovePlayer(player.id); }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove Player"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></div></td></>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <>
          <div className="bg-white dark:bg-[#1A1A1C] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-[#1A1A1C] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors z-10"
                    onClick={() => handleStatSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Player</span>
                      {statSort.key === 'name' && (
                        <span className="text-red-500">{statSort.direction === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => handleStatSort('form')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Form</span>
                      {statSort.key === 'form' && (
                        <span className="text-red-500">{statSort.direction === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    onClick={() => handleStatSort('games')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Matches</span>
                      {statSort.key === 'games' && (
                        <span className="text-red-500">{statSort.direction === 'desc' ? '↓' : '↑'}</span>
                      )}
                    </div>
                  </th>
                  {STAT_CONFIGS.map(sc => (
                    <th 
                      key={sc.key} 
                      onClick={() => handleStatSort(sc.key)}
                      className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>{sc.label}</span>
                        {statSort.key === sc.key && (
                          <span className="text-red-500">{statSort.direction === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1A1A1C] divide-y divide-gray-200 dark:divide-white/10">
                {careerStats.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedCardPlayer(p.rawPlayer)}
                    className="hover:bg-blue-50 dark:hover:bg-white/10 cursor-pointer transition-colors"
                    title="View Player Card"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-[#1A1A1C] border-r border-gray-100 dark:border-white/5 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      {p.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                        {p.games > 0 ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-8 inline-block text-center ${getFormColor(p.formRating)}`}>
                                {p.formRating}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-300">-</span>
                        )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400">{p.games}</td>
                    {STAT_CONFIGS.map(sc => (
                      <td key={sc.key} className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-900 dark:text-gray-200 font-mono">
                        {p.stats[sc.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {careerStats.length === 0 && (
                  <tr>
                    <td colSpan={STAT_CONFIGS.length + 3} className="px-6 py-12 text-center text-gray-400">
                      No stats recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Card Modal Integration */}
          {selectedCardPlayer && (
            <PlayerCardModal 
              player={selectedCardPlayer}
              history={history}
              onClose={() => setSelectedCardPlayer(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
