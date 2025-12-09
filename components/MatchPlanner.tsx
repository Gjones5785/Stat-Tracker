
import React, { useState, useEffect } from 'react';
import { SquadPlayer } from '../types';
import { Button } from './Button';
import { ConfirmationModal } from './ConfirmationModal';

interface MatchPlannerProps {
  squad: SquadPlayer[];
}

interface AssignedPlayer {
  jersey: string;
  squadId: string | null;
}

const COLOR_OPTIONS = [
  '#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#000000', '#FFFFFF', '#94A3B8'
];

export const MatchPlanner: React.FC<MatchPlannerProps> = ({ squad }) => {
  const [availableIds, setAvailableIds] = useState<string[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#FACC15');
  const [useDualColor, setUseDualColor] = useState(false);
  
  // Lazy initializer: Collapse setup if user has previously saved configuration
  const [isSetupOpen, setIsSetupOpen] = useState(() => {
    return !localStorage.getItem('MATCH_PLANNER_DRAFT');
  });
  
  const [assignments, setAssignments] = useState<AssignedPlayer[]>(
    Array.from({ length: 18 }, (_, i) => ({ jersey: (i + 1).toString(), squadId: null }))
  );
  
  const [selectingJersey, setSelectingJersey] = useState<string | null>(null);
  
  // Custom Confirmation Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearPositionsModalOpen, setIsClearPositionsModalOpen] = useState(false);

  // Persistence: Load on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('MATCH_PLANNER_DRAFT');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.assignments) setAssignments(parsed.assignments);
        if (parsed.availableIds) setAvailableIds(parsed.availableIds);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.secondaryColor) setSecondaryColor(parsed.secondaryColor);
        if (parsed.useDualColor !== undefined) setUseDualColor(parsed.useDualColor);
      }
    } catch (e) {
      console.error("Failed to load planner draft:", e);
    }
  }, []);

  // Persistence: Save on changes
  useEffect(() => {
    localStorage.setItem('MATCH_PLANNER_DRAFT', JSON.stringify({
      assignments,
      availableIds,
      primaryColor,
      secondaryColor,
      useDualColor
    }));
  }, [assignments, availableIds, primaryColor, secondaryColor, useDualColor]);

  const isAvailable = (id: string) => availableIds.includes(id);

  const toggleAvailability = (id: string) => {
    if (availableIds.includes(id)) {
        // Removing availability: must also remove from any jersey assignment
        setAssignments(prev => prev.map(a => a.squadId === id ? { ...a, squadId: null } : a));
        setAvailableIds(prev => prev.filter(pId => pId !== id));
    } else {
        // Adding availability
        setAvailableIds(prev => [...prev, id]);
    }
  };

  const assignPlayer = (jersey: string, squadId: string | null) => {
    setAssignments(prev => prev.map(a => a.jersey === jersey ? { ...a, squadId } : a));
    setSelectingJersey(null);
  };

  const confirmResetAvailability = () => {
    // 1. Clear Availability list
    setAvailableIds([]);
    // 2. Clear lineup draft
    setAssignments(prev => prev.map(a => ({ ...a, squadId: null })));
    // 3. Clear local storage explicitly to be safe
    localStorage.removeItem('MATCH_PLANNER_DRAFT');
    setIsResetModalOpen(false);
  };

  const confirmClearPositions = () => {
    setAssignments(prev => prev.map(a => ({ ...a, squadId: null })));
    setIsClearPositionsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPlayerName = (id: string | null) => {
    if (!id) return null;
    return squad.find(s => s.id === id)?.name || null;
  };

  const getUnassignedAvailable = () => {
    const assignedIds = new Set(assignments.map(a => a.squadId).filter(Boolean));
    return squad.filter(s => availableIds.includes(s.id) && !assignedIds.has(s.id));
  };

  const positions: Record<string, { top: string; left: string }> = {
    '1': { top: '85%', left: '50%' },
    '2': { top: '75%', left: '80%' },
    '3': { top: '70%', left: '70%' },
    '4': { top: '70%', left: '30%' },
    '5': { top: '75%', left: '20%' },
    '6': { top: '60%', left: '60%' },
    '7': { top: '50%', left: '50%' },
    '13': { top: '40%', left: '50%' },
    '12': { top: '30%', left: '60%' },
    '11': { top: '30%', left: '40%' },
    '10': { top: '15%', left: '75%' },
    '9': { top: '15%', left: '50%' },
    '8': { top: '15%', left: '25%' }
  };

  const getJerseyBackground = () => {
    if (useDualColor) {
      return `linear-gradient(135deg, ${primaryColor} 50%, ${secondaryColor} 50%)`;
    }
    return primaryColor;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:block">
      <style>{`
        @media print {
          header, footer, nav, aside, .print-hide { display: none !important; }
          body { background: white !important; }
          .print-area { margin: 0 !important; width: 100% !important; border: none !important; shadow: none !important; }
          .print-center { display: flex; flex-direction: column; align-items: center; width: 100% !important; }
          @page { margin: 1cm; size: auto; }
        }
      `}</style>

      {/* Sidebar: Availability Grid */}
      <div className="lg:col-span-1 print-hide">
        <div className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 h-full min-h-[500px] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Availability</h3>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="text-[9px] font-bold uppercase text-red-500 hover:text-red-600 transition-colors tracking-widest border border-red-200 dark:border-red-900 px-2 py-1 rounded"
            >
              Reset
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-6 font-medium">Toggle who is fit for match day.</p>
          
          <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
              {squad.map(player => (
                <div 
                  key={player.id} 
                  onClick={() => toggleAvailability(player.id)}
                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer border transition-all ${
                    isAvailable(player.id) 
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 ring-1 ring-green-100 dark:ring-green-900/20' 
                    : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400 opacity-60'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate pr-1">{player.name}</span>
                    <span className="text-[8px] uppercase font-bold text-gray-400 truncate leading-none mt-0.5">{player.position || 'Player'}</span>
                  </div>
                  {isAvailable(player.id) && (
                    <svg className="w-3.5 h-3.5 text-green-500 shrink-0 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                </div>
              ))}
            </div>
            {squad.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-12 italic">No squad members found. Add players in Squad & Stats tab.</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 space-y-6 print:space-y-4 print-area">
        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-apple border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-300 print-hide">
           <button 
             onClick={() => setIsSetupOpen(!isSetupOpen)}
             className="w-full p-4 flex justify-between items-center bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
           >
             <h3 className="text-sm font-heading font-black text-slate-900 dark:text-white uppercase tracking-widest">Jersey Setup</h3>
             <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isSetupOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
             </svg>
           </button>
           
           {isSetupOpen && (
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Primary Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setPrimaryColor(c)}
                        className={`w-8 h-8 rounded-full border-2 ${primaryColor === c ? 'border-blue-500 scale-110' : 'border-transparent dark:border-white/10'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Secondary Color</label>
                    <button 
                      onClick={() => setUseDualColor(!useDualColor)}
                      className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase transition-colors shadow-sm ${useDualColor ? 'bg-blue-600 text-white' : 'bg-white dark:bg-white/10 text-gray-500 border border-gray-200 dark:border-white/5'}`}
                    >
                      {useDualColor ? 'Dual On' : 'Dual Off'}
                    </button>
                  </div>
                  <div className={`flex flex-wrap gap-2 transition-opacity ${useDualColor ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    {COLOR_OPTIONS.map(c => (
                      <button 
                        key={c} 
                        onClick={() => setSecondaryColor(c)}
                        className={`w-8 h-8 rounded-full border-2 ${secondaryColor === c ? 'border-blue-500 scale-110' : 'border-transparent dark:border-white/10'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
             </div>
           )}
        </div>

        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple border border-gray-100 dark:border-white/5 relative flex flex-col print:shadow-none print:border-none print-area">
           <div className="flex justify-between items-center mb-6 print:mb-8">
              <div>
                <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white print:text-2xl">Lineup Draft</h3>
                <p className="hidden print:block text-slate-500 text-sm font-heading font-bold uppercase tracking-widest mt-1">
                  {localStorage.getItem('RUGBY_TRACKER_CLUB_NAME') || 'Team Roster'}
                </p>
              </div>
              <div className="flex space-x-3 print-hide">
                 <Button onClick={handlePrint} className="text-xs py-1 px-4 bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Lineup
                 </Button>
                 <Button onClick={() => setIsClearPositionsModalOpen(true)} variant="secondary" className="text-xs py-1 px-4 border-gray-200 dark:border-white/10 shadow-none">Reset All Positions</Button>
              </div>
           </div>

           <div className="relative bg-green-600 dark:bg-green-800 rounded-2xl w-full aspect-[2/3] max-w-lg mx-auto overflow-hidden shadow-inner border-4 border-white shrink-0 mb-8 print:mb-12 print-center">
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(line => (
                <div key={line} className={`absolute left-0 w-full h-px ${line === 50 ? 'bg-white' : 'bg-white/50'}`} style={{ top: `${line}%` }}></div>
              ))}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"></div>
              
              {Object.entries(positions).map(([jersey, pos]) => {
                 const assignment = assignments.find(a => a.jersey === jersey);
                 const rawName = getPlayerName(assignment?.squadId || null);
                 const nameParts = rawName ? rawName.split(' ') : [];

                 return (
                    <div 
                       key={jersey}
                       onClick={() => setSelectingJersey(jersey)}
                       className="absolute flex flex-col items-center group cursor-pointer z-10 print:pointer-events-none"
                       style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                    >
                       <div 
                          className={`w-10 h-10 md:w-12 md:h-12 border-2 border-white/20 rounded-lg flex items-center justify-center text-white font-bold shadow-lg transition-transform group-hover:scale-110 group-hover:-translate-y-1 ${!assignment?.squadId ? 'opacity-30 bg-gray-600' : ''}`}
                          style={{ background: assignment?.squadId ? getJerseyBackground() : undefined }}
                       >
                          <span className={`drop-shadow-sm ${assignment?.squadId && primaryColor === '#FFFFFF' ? 'text-gray-900' : 'text-white'}`}>
                            {jersey}
                          </span>
                       </div>
                       
                       <div className="mt-1.5 flex flex-col items-center space-y-0.5 max-w-[80px] md:max-w-[100px]">
                          {nameParts.map((part, idx) => (
                            <span 
                              key={idx} 
                              className={`text-[10px] md:text-[12px] leading-tight font-black text-white tracking-widest uppercase bg-black/70 px-2 rounded backdrop-blur-sm shadow-md ring-1 ring-white/10 ${!rawName ? 'invisible' : ''}`}
                            >
                              {part}
                            </span>
                          ))}
                       </div>
                    </div>
                 );
              })}
           </div>

           <div className="mt-4 pt-6 border-t border-gray-100 dark:border-white/5 print:border-slate-200">
              <h4 className="text-sm font-heading font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-center print:text-slate-900">Substitutes & 18th Man</h4>
              
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
                 <div className="flex gap-4">
                    {['14', '15', '16', '17'].map(num => {
                       const assignment = assignments.find(a => a.jersey === num);
                       const rawName = getPlayerName(assignment?.squadId || null);
                       const nameParts = rawName ? rawName.split(' ') : [];

                       return (
                          <div 
                             key={num}
                             onClick={() => setSelectingJersey(num)}
                             className="flex flex-col items-center group cursor-pointer print:pointer-events-none"
                          >
                             <div 
                                className={`w-10 h-10 border-2 border-white/20 rounded-lg flex items-center justify-center text-white font-bold shadow transition-all group-hover:scale-110 ${!assignment?.squadId ? 'opacity-30 bg-gray-600' : ''}`}
                                style={{ background: assignment?.squadId ? getJerseyBackground() : undefined }}
                             >
                                <span className={`text-xs ${assignment?.squadId && primaryColor === '#FFFFFF' ? 'text-gray-900' : 'text-white'}`}>{num}</span>
                             </div>
                             <div className="mt-1 flex flex-col items-center min-h-[30px] max-w-[60px]">
                                {nameParts.map((part, idx) => (
                                   <span key={idx} className={`text-[8px] font-black text-gray-500 uppercase tracking-tighter text-center ${!rawName ? 'invisible' : ''}`}>{part}</span>
                                ))}
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 <div className="w-px h-10 bg-gray-200 dark:bg-white/10 print:bg-slate-200"></div>

                 <div className="flex flex-col items-center group cursor-pointer print:pointer-events-none" onClick={() => setSelectingJersey('18')}>
                    <div 
                       className={`w-10 h-10 border-2 border-white/20 rounded-lg flex items-center justify-center text-white font-bold shadow transition-all group-hover:scale-110 ring-2 ring-indigo-500/20 ${!assignments.find(a => a.jersey === '18')?.squadId ? 'opacity-30 bg-gray-600' : ''}`}
                       style={{ background: assignments.find(a => a.jersey === '18')?.squadId ? getJerseyBackground() : undefined }}
                    >
                       <span className={`text-xs ${assignments.find(a => a.jersey === '18')?.squadId && primaryColor === '#FFFFFF' ? 'text-gray-900' : 'text-white'}`}>18</span>
                    </div>
                    <span className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">18th Man</span>
                    <div className="mt-0.5 flex flex-col items-center min-h-[30px] max-w-[60px]">
                       {getPlayerName(assignments.find(a => a.jersey === '18')?.squadId || null)?.split(' ').map((part, idx) => (
                          <span key={idx} className="text-[8px] font-black text-gray-500 uppercase tracking-tighter text-center">{part}</span>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {selectingJersey && (
              <div className="absolute inset-0 z-40 p-12 animate-in fade-in duration-300 flex items-center justify-center print:hidden">
                 <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-3xl" onClick={() => setSelectingJersey(null)}></div>
                 <div className="relative z-50 bg-white dark:bg-[#1A1A1C] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 max-h-[80%] w-full max-w-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                       <h4 className="text-xl font-heading font-bold">Assign Jersey #{selectingJersey}</h4>
                       <button onClick={() => setSelectingJersey(null)} className="text-gray-400">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                       <div 
                         onClick={() => assignPlayer(selectingJersey, null)}
                         className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl font-bold text-red-500 cursor-pointer border border-transparent hover:border-red-500/30 text-center"
                       >
                          Clear Position
                       </div>
                       {getUnassignedAvailable().map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => assignPlayer(selectingJersey, p.id)}
                            className="p-4 bg-white dark:bg-white/10 rounded-2xl font-bold cursor-pointer border border-gray-100 dark:border-white/5 hover:border-blue-500/50"
                          >
                             {p.name}
                          </div>
                       ))}
                       {getUnassignedAvailable().length === 0 && (
                          <p className="text-center text-gray-500 py-8 italic text-sm">No unassigned available players.</p>
                       )}
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={isResetModalOpen}
        title="Reset Planner?"
        message="This will clear availability status and all field assignments for this session. Are you sure?"
        onConfirm={confirmResetAvailability}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <ConfirmationModal 
        isOpen={isClearPositionsModalOpen}
        title="Clear All Positions?"
        message="This will remove all players from the field draft without affecting availability. Are you sure?"
        onConfirm={confirmClearPositions}
        onCancel={() => setIsClearPositionsModalOpen(false)}
      />
    </div>
  );
};
