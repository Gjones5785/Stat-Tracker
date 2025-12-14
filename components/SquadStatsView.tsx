
import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { SquadPlayer, MatchHistoryItem, Player, PlayerStats } from '../types';
import { STAT_CONFIGS } from '../constants';

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
  
  // Sort State for Roster Tab
  const [rosterSort, setRosterSort] = useState<{ key: 'name' | 'position'; direction: 'asc' | 'desc' } | null>(null);
  
  // Sort State for Stats Tab
  const [statSort, setStatSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'games', 
    direction: 'desc' 
  });
  
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
      // Default numbers to High-to-Low (desc), Text to A-Z (asc)
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
      wins: number
    }> = {};

    // Initialize map with current squad to ensure they appear even if 0 games
    squad.forEach(p => {
      statsMap[p.id] = {
        name: p.name,
        games: 0,
        wins: 0,
        stats: {
          tackles: 0,
          hitUps: 0,
          penaltiesConceded: 0,
          errors: 0,
          triesScored: 0,
          kicks: 0
        }
      };
    });

    history.forEach(match => {
      const matchPlayers: Player[] = match.data.players || [];
      const isWin = match.result === 'win';

      matchPlayers.forEach(mp => {
        // Try to find by squadId first, then fallback to name match
        let squadId = mp.squadId;
        
        if (!squadId) {
          // Fuzzy name match
          const found = squad.find(s => s.name.toLowerCase() === mp.name.toLowerCase());
          if (found) squadId = found.id;
        }

        if (squadId && statsMap[squadId]) {
          const entry = statsMap[squadId];
          entry.games += 1;
          if (isWin) entry.wins += 1;
          
          // Sum stats (using full match stats if available, otherwise just current stats)
          const finalStats = (match.data.fullMatchStats && match.data.fullMatchStats[mp.id]) || mp.stats;

          Object.keys(finalStats).forEach(k => {
             const key = k as keyof PlayerStats;
             if (typeof finalStats[key] === 'number') {
                entry.stats[key] += finalStats[key];
             }
          });
        }
      });
    });

    // Convert map to array
    const aggregated = Object.entries(statsMap).map(([id, data]) => ({ id, ...data }));

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

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    const scores: Record<string, { total: number; threes: number; twos: number; ones: number; name: string }> = {};

    history.forEach(match => {
      if (match.voting) {
        const { threePointsId, twoPointsId, onePointId } = match.voting;
        const matchPlayers = match.data.players || [];

        // Helper to get name from ID in that specific match context (or squad fallback)
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
           // We try to normalize ID to squad ID if possible, otherwise use the match player ID
           // This handles cases where match player IDs might be temporary 'player-0' if not linked properly
           // However, the VotingModal now uses exact IDs from the match player list.
           // Ideally, match player objects should have a `squadId`.
           // Let's try to map match player ID to squad ID for aggregation.
           
           let finalId = id;
           let name = getName(id);
           
           const matchPlayer = matchPlayers.find((p: Player) => p.id === id);
           if (matchPlayer && matchPlayer.squadId) {
             finalId = matchPlayer.squadId;
             // Ensure name is up to date from squad if possible
             const sq = squad.find(s => s.id === finalId);
             if (sq) name = sq.name;
           } else {
             // Fallback: name match against squad
             const sq = squad.find(s => s.name === name);
             if (sq) finalId = sq.id;
           }

           if (!scores[finalId]) {
             scores[finalId] = { total: 0, threes: 0, twos: 0, ones: 0, name };
           }
           scores[finalId].total += points;
           // @ts-ignore
           scores[finalId][type] += 1;
        });
      }
    });

    return Object.entries(scores)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [history, squad]);

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'roster' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Squad Roster
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'stats' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Career Statistics
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'leaderboard' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Player of the Year
        </button>
      </div>

      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
           {/* Top 3 Podium */}
           <div className="lg:col-span-3 mb-4">
              <div className="flex justify-center items-end space-x-4 h-64">
                 {/* 2nd Place */}
                 {leaderboard[1] && (
                   <div className="flex flex-col items-center w-1/3 max-w-[150px]">
                      <div className="mb-2 text-center">
                         <span className="block text-sm font-bold text-slate-600 dark:text-gray-300">{leaderboard[1].name}</span>
                         <span className="text-xs text-gray-400">{leaderboard[1].total} pts</span>
                      </div>
                      <div className="w-full bg-slate-300 dark:bg-slate-700 h-32 rounded-t-xl relative flex items-center justify-center shadow-lg">
                         <span className="text-4xl font-heading font-black text-white/50">2</span>
                      </div>
                   </div>
                 )}
                 {/* 1st Place */}
                 {leaderboard[0] ? (
                   <div className="flex flex-col items-center w-1/3 max-w-[150px] z-10">
                      <div className="mb-2 text-center">
                         <span className="text-2xl mb-1 block">👑</span>
                         <span className="block text-lg font-heading font-black text-slate-900 dark:text-white">{leaderboard[0].name}</span>
                         <span className="text-sm font-bold text-yellow-500">{leaderboard[0].total} pts</span>
                      </div>
                      <div className="w-full bg-yellow-400 h-40 rounded-t-xl relative flex items-center justify-center shadow-xl">
                         <span className="text-5xl font-heading font-black text-white/50">1</span>
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-center justify-center h-full text-gray-400">No votes recorded yet.</div>
                 )}
                 {/* 3rd Place */}
                 {leaderboard[2] && (
                   <div className="flex flex-col items-center w-1/3 max-w-[150px]">
                      <div className="mb-2 text-center">
                         <span className="block text-sm font-bold text-slate-600 dark:text-gray-300">{leaderboard[2].name}</span>
                         <span className="text-xs text-gray-400">{leaderboard[2].total} pts</span>
                      </div>
                      <div className="w-full bg-orange-300 dark:bg-orange-800 h-24 rounded-t-xl relative flex items-center justify-center shadow-lg">
                         <span className="text-3xl font-heading font-black text-white/50">3</span>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Full Table */}
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
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                             <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm">
                                {p.total}
                             </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 dark:text-yellow-500 font-bold">{p.threes}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{p.twos}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">{p.ones}</td>
                       </tr>
                    ))}
                    {leaderboard.length === 0 && (
                       <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No votes recorded this season.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Player Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#1A1A1C] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Player</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white placeholder-gray-400"
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Position</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={e => setNewPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-slate-900 dark:text-white placeholder-gray-400"
                    placeholder="e.g. Prop"
                  />
                </div>
                <Button type="submit" className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800">Add to Squad</Button>
              </form>
            </div>
          </div>

          {/* Roster List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1A1A1C] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      onClick={() => handleRosterSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {rosterSort?.key === 'name' && (
                           <span className="text-red-500">{rosterSort.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      onClick={() => handleRosterSort('position')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Position</span>
                        {rosterSort?.key === 'position' && (
                           <span className="text-red-500">{rosterSort.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1A1A1C] divide-y divide-gray-200 dark:divide-white/10">
                  {displaySquad.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        No players in squad. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    displaySquad.map(player => (
                      <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        {editingId === player.id ? (
                          /* EDIT MODE */
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-white/20 rounded text-sm text-slate-900 dark:text-white bg-white dark:bg-white/5 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Player Name"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input 
                                type="text" 
                                value={editPosition}
                                onChange={(e) => setEditPosition(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 dark:border-white/20 rounded text-sm text-slate-900 dark:text-white bg-white dark:bg-white/5 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Position"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button 
                                onClick={saveEditing} 
                                className="inline-flex items-center justify-center p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 transition-colors"
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button 
                                onClick={cancelEditing} 
                                className="inline-flex items-center justify-center p-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </td>
                          </>
                        ) : (
                          /* VIEW MODE */
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{player.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{player.position || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => startEditing(player)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Edit Player"
                                >
                                  {/* Pencil Icon */}
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => {
                                      if(window.confirm('Remove player from squad?')) onRemovePlayer(player.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Remove Player"
                                >
                                  {/* Trash Icon */}
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
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
                 <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                   <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-[#1A1A1C] border-r border-gray-100 dark:border-white/5">{p.name}</td>
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
                   <td colSpan={STAT_CONFIGS.length + 2} className="px-6 py-12 text-center text-gray-400">
                     No stats recorded yet.
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
