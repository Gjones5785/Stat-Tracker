
import React, { useState, useEffect } from 'react';
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
  onDiscardActiveMatch: () => void;
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
  onDiscardActiveMatch,
  onViewMatch,
  onDeleteMatch,
  onLogout,
  onAddSquadPlayer,
  onRemoveSquadPlayer
}) => {
  const [currentTab, setCurrentTab] = useState<'matches' | 'squad'>('matches');
  const [showGuide, setShowGuide] = useState(false);
  const [isGuideDismissed, setIsGuideDismissed] = useState(() => {
    return localStorage.getItem('RL_TRACKER_GUIDE_DISMISSED') === 'true';
  });

  // Logo State
  const [logoSrc, setLogoSrc] = useState('logo.png');
  const [logoError, setLogoError] = useState(false);

  // Team Name State
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('RUGBY_TRACKER_LOGO');
    if (saved) {
      setLogoSrc(saved);
      setLogoError(false);
    }
    const savedName = localStorage.getItem('RUGBY_TRACKER_CLUB_NAME');
    if (savedName) {
      setClubName(savedName);
    }
  }, []);

  const handleClubNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClubName(val);
    localStorage.setItem('RUGBY_TRACKER_CLUB_NAME', val);
  };

  const handleDismissGuide = () => {
    setIsGuideDismissed(true);
    localStorage.setItem('RL_TRACKER_GUIDE_DISMISSED', 'true');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
      {/* Apple-style Blur Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex items-center space-x-3 w-1/4">
             {!logoError ? (
               <img 
                 src={logoSrc} 
                 alt="Logo" 
                 className="w-9 h-9 rounded-xl object-contain shadow-sm bg-white border border-gray-100"
                 onError={() => setLogoError(true)}
               />
             ) : (
               <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                 </svg>
               </div>
             )}
             <span className="font-heading font-bold text-xl tracking-tight text-slate-900 hidden sm:inline">LeagueLens</span>
          </div>

          {/* Center: Team Name Input */}
          <div className="flex-1 flex justify-center px-2">
            <input 
              type="text" 
              value={clubName}
              onChange={handleClubNameChange}
              placeholder="ENTER TEAM NAME" 
              className="bg-transparent text-center font-heading font-bold text-lg text-slate-900 placeholder-gray-400 focus:outline-none focus:placeholder-gray-200 uppercase tracking-wide w-full max-w-[250px] border-b border-transparent focus:border-gray-200 transition-all hover:border-gray-100 pb-0.5"
            />
          </div>

          {/* Right: User & Logout */}
          <div className="flex items-center space-x-4 w-1/4 justify-end">
             <span className="text-sm font-medium text-slate-500 hidden sm:inline">Coach: <span className="text-slate-900 font-heading">{currentUser}</span></span>
             <button onClick={onLogout} className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-full">Log Out</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Segmented Control Navigation */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-200/50 p-1 rounded-full inline-flex relative">
            <button 
              onClick={() => setCurrentTab('matches')}
              className={`relative z-10 px-8 py-2 rounded-full text-sm font-heading font-semibold transition-all duration-300 ${
                currentTab === 'matches' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Matches
            </button>
            <button 
              onClick={() => setCurrentTab('squad')}
              className={`relative z-10 px-8 py-2 rounded-full text-sm font-heading font-semibold transition-all duration-300 ${
                currentTab === 'squad' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Squad & Stats
            </button>
          </div>
        </div>

        {currentTab === 'matches' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* New Match Card */}
              <div 
                className="group bg-white rounded-3xl p-8 shadow-apple hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-white hover:scale-[1.01]" 
                onClick={onNewMatch}
              >
                <div className="flex items-start justify-between mb-8">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6">
                     <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                     </svg>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                   </div>
                </div>
                <div>
                   <h2 className="text-3xl font-heading font-bold text-slate-900 mb-2">New Match</h2>
                   <p className="text-slate-500 font-medium">Start a blank session.</p>
                </div>
              </div>

              {/* Resume Card */}
              {hasActiveMatch ? (
                 <div 
                    className="group bg-white rounded-3xl p-8 shadow-apple hover:shadow-apple-hover transition-all duration-300 cursor-pointer border-2 border-green-500/10 hover:border-green-500/30 hover:scale-[1.01] relative overflow-hidden" 
                    onClick={onResumeMatch}
                 >
                   <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                   
                   <div className="flex items-start justify-between mb-8 relative z-10">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6">
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        </div>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">Live</span>
                   </div>
                   <div className="relative z-10">
                      <h2 className="text-3xl font-heading font-bold text-slate-900 mb-2">Resume</h2>
                      <p className="text-slate-500 font-medium">Continue active game.</p>
                   </div>

                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       onDiscardActiveMatch();
                     }}
                     className="absolute bottom-6 right-6 flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors z-30 group-hover:opacity-100"
                     title="Discard active match"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                     <span>Discard</span>
                   </button>
                 </div>
              ) : (
                <div className="bg-gray-100/50 rounded-3xl p-8 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                   <h3 className="text-lg font-heading font-bold text-gray-400">No Active Match</h3>
                   <p className="text-sm text-gray-400 mt-1">Ready to start tracking.</p>
                </div>
              )}
            </div>

            {/* How to Use Guide */}
            {!isGuideDismissed && (
              <div className="mb-12">
                <button 
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-apple border border-gray-100 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-heading font-bold text-slate-800">How to use this app</span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${showGuide ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showGuide && (
                  <div className="mt-4 bg-white rounded-3xl shadow-apple border border-gray-100 p-6 sm:p-8 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {/* Step 1 */}
                      <div className="relative">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Step 1</div>
                        <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">Build Squad</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Go to the <strong>Squad & Stats</strong> tab. Add your players once, and they will be saved forever. You can track their career stats here too.
                        </p>
                      </div>
                      
                      {/* Step 2 */}
                      <div className="relative">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Step 2</div>
                        <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">Start Match</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Click <strong>New Match</strong>. Use the simple dropdowns to assign your squad players to the match-day jersey numbers.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Step 3</div>
                        <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">Track Live</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Use the <strong>+</strong> / <strong>-</strong> buttons to track stats. Use the <strong>T</strong> / <strong>K</strong> buttons for opponent scores. Use <strong>Red/Yellow</strong> buttons for cards.
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Step 4</div>
                        <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">Save Game</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Click <strong>End 1st Half</strong> then <strong>End Match</strong>. This saves the game to your History and updates all Career Stats automatically.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                      <button 
                        onClick={handleDismissGuide}
                        className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors uppercase tracking-widest"
                      >
                        Don't show this guide again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History Section */}
            <div>
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-6 flex items-center">
                Match History
                <span className="ml-3 bg-gray-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">{history.length}</span>
              </h3>
              
              {history.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-apple p-12 text-center">
                   <p className="text-gray-400 font-medium">No completed matches yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((match) => (
                    <div key={match.id} className="group bg-white rounded-2xl p-5 shadow-apple hover:shadow-apple-hover transition-all flex items-center justify-between border border-transparent hover:border-gray-100">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewMatch(match)}>
                         <div className="flex items-center space-x-3 mb-1.5">
                           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{match.date}</span>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                             match.result === 'win' ? 'bg-green-100 text-green-700' :
                             match.result === 'loss' ? 'bg-red-100 text-red-700' : 
                             match.result === 'draw' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                           }`}>
                             {match.result}
                           </span>
                         </div>
                         <h4 className="text-xl font-heading font-bold text-slate-900 truncate">
                           {match.opponentName || 'Unknown Opponent'}
                         </h4>
                         <p className="text-sm text-gray-500 font-medium mt-0.5">
                            {match.teamName} <span className="mx-2 text-gray-300">|</span> <span className="font-mono text-slate-700">{match.finalScore}</span>
                         </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 pl-4 border-l border-gray-100">
                        <Button variant="secondary" onClick={() => onViewMatch(match)} className="text-xs px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-slate-700 border-none font-semibold">View</Button>
                        <button 
                          onClick={() => onDeleteMatch(match.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SquadStatsView 
                squad={squad} 
                history={history} 
                onAddPlayer={onAddSquadPlayer}
                onRemovePlayer={onRemoveSquadPlayer}
            />
          </div>
        )}

      </main>
    </div>
  );
};
