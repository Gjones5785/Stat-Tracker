
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
  const [activeTab, setActiveTab] = useState<'roster' | 'stats'>('roster');
  
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

  return (
    <div className="space-y-6">
      {/* Sub-Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'roster' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Squad Roster
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'stats' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Career Statistics
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Player Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Player</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Position</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={e => setNewPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g. Prop"
                  />
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">Add to Squad</Button>
              </form>
            </div>
          </div>

          {/* Roster List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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
                      className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleRosterSort('position')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Position</span>
                        {rosterSort?.key === 'position' && (
                           <span className="text-red-500">{rosterSort.direction === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displaySquad.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        No players in squad. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    displaySquad.map(player => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        {editingId === player.id ? (
                          /* EDIT MODE */
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Player Name"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input 
                                type="text" 
                                value={editPosition}
                                onChange={(e) => setEditPosition(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Position"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button 
                                onClick={saveEditing} 
                                className="inline-flex items-center justify-center p-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button 
                                onClick={cancelEditing} 
                                className="inline-flex items-center justify-center p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </td>
                          </>
                        ) : (
                          /* VIEW MODE */
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{player.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button 
                                  onClick={() => startEditing(player)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
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
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors z-10"
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
                  className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
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
                    className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
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
            <tbody className="bg-white divide-y divide-gray-200">
               {careerStats.map(p => (
                 <tr key={p.id} className="hover:bg-gray-50">
                   <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 sticky left-0 bg-white border-r border-gray-100">{p.name}</td>
                   <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600">{p.games}</td>
                   {STAT_CONFIGS.map(sc => (
                     <td key={sc.key} className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 font-mono">
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
