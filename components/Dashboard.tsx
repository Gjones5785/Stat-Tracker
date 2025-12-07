
import React, { useState } from 'react';
import { Button } from './Button';
import { MatchHistoryItem, SquadPlayer } from '../types';
import { SquadStatsView } from './SquadStatsView';

interface DashboardProps {
  currentUser: string;
  hasActiveMatch: boolean;
  history: MatchHistoryItem[];
  squad: SquadPlayer[];
  onNewMatch: () => void;
  onResumeMatch: () => void;
  onViewMatch: (match: MatchHistoryItem) => void;
  onDeleteMatch: (id: string) => void;
  onLogout: () => void;
  onAddSquadPlayer: (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => void;
  onRemoveSquadPlayer: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  hasActiveMatch,
  history,
  squad,
  onNewMatch,
  onResumeMatch,
  onViewMatch,
  onDeleteMatch,
  onLogout,
  onAddSquadPlayer,
  onRemoveSquadPlayer
}) => {
  const [currentTab, setCurrentTab] = useState<'matches' | 'squad'>('matches');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-red-500/20">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
               </svg>
             </div>
             <span className="font-bold text-lg tracking-tight hidden sm:inline">Rugby League Stat Tracker</span>
             <span className="font-bold text-lg tracking-tight sm:hidden">RL Tracker</span>
          </div>
          <div className="flex items-center space-x-4">
             <span className="text-sm text-slate-400 hidden sm:inline">Coach: <span className="text-white font-semibold">{currentUser}</span></span>
             <button onClick={onLogout} className="text-sm text-slate-400 hover:text-white transition-colors">Log Out</button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8">
          <button 
            onClick={() => setCurrentTab('matches')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'matches' 
                ? 'border-red-500 text-white' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Matches
          </button>
          <button 
            onClick={() => setCurrentTab('squad')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              currentTab === 'squad' 
                ? 'border-red-500 text-white' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Squad & Stats
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {currentTab === 'matches' ? (
          <>
            {/* Hero Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* New Match Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-start justify-between hover:shadow-md transition-shadow group cursor-pointer" onClick={onNewMatch}>
                <div>
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                     </svg>
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900 mb-2">New Match</h2>
                   <p className="text-gray-500">Start a blank tracking session for a new game.</p>
                </div>
                <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                  Start Tracking <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>

              {/* Resume Card */}
              {hasActiveMatch ? (
                 <div className="bg-white rounded-2xl shadow-sm border border-green-100 ring-1 ring-green-500/20 p-8 flex flex-col items-start justify-between hover:shadow-md transition-shadow group cursor-pointer bg-gradient-to-br from-white to-green-50/50" onClick={onResumeMatch}>
                   <div>
                      <div className="flex items-center justify-between w-full mb-4">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide animate-pulse">Live</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Match</h2>
                      <p className="text-gray-500">Continue tracking your active game in progress.</p>
                   </div>
                   <div className="mt-6 flex items-center text-green-600 font-semibold group-hover:translate-x-1 transition-transform">
                     Resume <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                   </div>
                 </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center text-center opacity-75">
                   <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center mb-4">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <h3 className="text-lg font-bold text-gray-400">No Active Match</h3>
                   <p className="text-sm text-gray-400 mt-1">Start a new match to begin tracking stats.</p>
                </div>
              )}
            </div>

            {/* History Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                Match History
                <span className="ml-3 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{history.length}</span>
              </h3>
              
              {history.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                   <p className="text-gray-500">No completed matches found in history.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {history.map((match) => (
                    <div key={match.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewMatch(match)}>
                         <div className="flex items-center space-x-2 mb-1">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{match.date}</span>
                           <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                             match.result === 'win' ? 'bg-green-100 text-green-700' :
                             match.result === 'loss' ? 'bg-red-100 text-red-700' : 
                             match.result === 'draw' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                           }`}>
                             {match.result}
                           </span>
                         </div>
                         <h4 className="text-lg font-bold text-gray-900 truncate">
                           {match.opponentName ? `vs ${match.opponentName}` : 'vs Unknown Opponent'}
                         </h4>
                         <p className="text-sm text-gray-500">
                            Score: <span className="font-mono font-semibold text-gray-700">{match.finalScore}</span> • Team: {match.teamName || 'Unknown'}
                         </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="secondary" onClick={() => onViewMatch(match)} className="text-xs px-3 py-1.5">View</Button>
                        <button 
                          onClick={() => onDeleteMatch(match.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Match"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <SquadStatsView 
            squad={squad} 
            history={history} 
            onAddPlayer={onAddSquadPlayer}
            onRemovePlayer={onRemoveSquadPlayer}
          />
        )}

      </main>
    </div>
  );
};
