
import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { SquadPlayer, MatchHistoryItem, Player, PlayerStats } from '../types';
import { STAT_CONFIGS } from '../constants';

interface SquadStatsViewProps {
  squad: SquadPlayer[];
  history: MatchHistoryItem[];
  onAddPlayer: (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => void;
  onRemovePlayer: (id: string) => void;
}

export const SquadStatsView: React.FC<SquadStatsViewProps> = ({
  squad,
  history,
  onAddPlayer,
  onRemovePlayer
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'stats'>('roster');
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');

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

  // Aggregated Stats Calculation
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
          // The history item stores `fullMatchStats` usually in `data.fullMatchStats` or `data.players` has the final stats
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

    return Object.entries(statsMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.games - a.games); // Default sort by games played
  }, [squad, history]);

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="e.g. John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Position</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={e => setNewPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
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
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {squad.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        No players in squad. Add one to get started.
                      </td>
                    </tr>
                  ) : (
                    squad.map(player => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{player.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.position || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => {
                                if(window.confirm('Remove player from squad?')) onRemovePlayer(player.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
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
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Player</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Matches</th>
                {STAT_CONFIGS.map(sc => (
                  <th key={sc.key} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {sc.label}
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
