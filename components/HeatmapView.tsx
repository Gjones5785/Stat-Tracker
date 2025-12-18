import React, { useState, useMemo } from 'react';
import { GameLogEntry } from '../types';

interface HeatmapViewProps {
  gameLog: GameLogEntry[];
}

type EventFilter = 'all' | 'try' | 'error' | 'penalty';

export const HeatmapView: React.FC<HeatmapViewProps> = ({ gameLog }) => {
  const [filter, setFilter] = useState<EventFilter>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return gameLog.filter(event => {
      if (!event.coordinate) return false;
      if (filter === 'all') return ['try', 'error', 'penalty'].includes(event.type);
      return event.type === filter;
    });
  }, [gameLog, filter]);

  const getDotStyle = (type: string) => {
    switch (type) {
      case 'try': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] border-blue-200';
      case 'penalty': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border-red-200';
      case 'error': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] border-orange-200';
      default: return 'bg-gray-400';
    }
  };

  const getLabel = (type: string) => {
     if (type === 'try') return 'Try';
     if (type === 'penalty') return 'Penalty';
     if (type === 'error') return 'Error';
     return type;
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Match Heatmap</h3>
        
        {/* Filters */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
           <button 
             onClick={() => { setFilter('all'); setSelectedEventId(null); }}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
           >
             All
           </button>
           <button 
             onClick={() => { setFilter('try'); setSelectedEventId(null); }}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'try' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}
           >
             Tries
           </button>
           <button 
             onClick={() => { setFilter('error'); setSelectedEventId(null); }}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'error' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-gray-500'}`}
           >
             Errors
           </button>
           <button 
             onClick={() => { setFilter('penalty'); setSelectedEventId(null); }}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'penalty' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-gray-500'}`}
           >
             Pens
           </button>
        </div>
      </div>

      <div className="relative w-full aspect-[16/9] bg-[#34a15a] rounded-xl border-4 border-white dark:border-midnight-700 overflow-hidden shadow-inner">
         <svg viewBox="0 0 100 56.25" width="100%" height="100%" className="absolute inset-0 pointer-events-none select-none z-0">
              {/* Field Background */}
              <rect width="100" height="56.25" fill="#34a15a" />

              {/* Perimeter */}
              <rect x="0" y="0" width="100" height="56.25" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />

              {/* Lines marking system */}
              <line x1="10" y1="0" x2="10" y2="56.25" stroke="white" strokeWidth="0.8" />
              <line x1="90" y1="0" x2="90" y2="56.25" stroke="white" strokeWidth="0.8" />
              <line x1="50" y1="0" x2="50" y2="56.25" stroke="white" strokeWidth="0.6" />
              
              {/* Yardage Lines */}
              {[18, 26, 34, 42, 58, 66, 74, 82].map(x => (
                <line key={x} x1={x} y1="0" x2={x} y2="56.25" stroke={ (x === 42 || x === 58) ? "#ef4444" : "white" } strokeWidth="0.3" opacity="0.4" />
              ))}

              {/* Yardage Numbers */}
              <g className="font-jersey fill-white" style={{ fontSize: '2px', fontWeight: 'bold', opacity: 0.5 }}>
                <text x="18" y="15" textAnchor="middle">&lt; 10</text>
                <text x="26" y="15" textAnchor="middle">&lt; 20</text>
                <text x="34" y="15" textAnchor="middle">&lt; 30</text>
                <text x="42" y="15" textAnchor="middle">&lt; 40</text>
                <text x="50" y="15" textAnchor="middle">50</text>
                <text x="58" y="15" textAnchor="middle">40 &gt;</text>
                <text x="66" y="15" textAnchor="middle">30 &gt;</text>
                <text x="74" y="15" textAnchor="middle">20 &gt;</text>
                <text x="82" y="15" textAnchor="middle">10 &gt;</text>
                
                <text x="18" y="48" textAnchor="middle">&lt; 10</text>
                <text x="26" y="48" textAnchor="middle">&lt; 20</text>
                <text x="34" y="48" textAnchor="middle">&lt; 30</text>
                <text x="42" y="48" textAnchor="middle">&lt; 40</text>
                <text x="50" y="48" textAnchor="middle">50</text>
                <text x="58" y="48" textAnchor="middle">40 &gt;</text>
                <text x="66" y="48" textAnchor="middle">30 &gt;</text>
                <text x="74" y="48" textAnchor="middle">20 &gt;</text>
                <text x="82" y="48" textAnchor="middle">10 &gt;</text>
              </g>

              {/* Home/Away Labels in End Sections */}
              <g className="font-heading" style={{ fontWeight: 900, fill: 'white', opacity: 0.6 }}>
                <text 
                  x="5" 
                  y="28.125" 
                  fontSize="3.5" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  transform="rotate(-90, 5, 28.125)"
                >
                  HOME
                </text>
                <text 
                  x="95" 
                  y="28.125" 
                  fontSize="3.5" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  transform="rotate(90, 95, 28.125)"
                >
                  AWAY
                </text>
              </g>
         </svg>

         <div className="absolute inset-0 z-0" onClick={() => setSelectedEventId(null)}></div>

         {filteredEvents.map(event => {
            const isSelected = selectedEventId === event.id;
            const zIndex = isSelected ? 'z-30' : 'z-10';
            
            return (
              <div 
                 key={event.id}
                 onClick={(e) => { e.stopPropagation(); setSelectedEventId(isSelected ? null : event.id); }}
                 className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border border-white group cursor-pointer ${zIndex} ${getDotStyle(event.type)} transition-all duration-200 ${isSelected ? 'scale-150 ring-2 ring-white shadow-xl' : 'hover:scale-125'}`}
                 style={{ left: `${event.coordinate!.x}%`, top: `${event.coordinate!.y}%` }}
              >
                 <div 
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[160px] bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl border border-white/10 transform transition-all duration-200 origin-bottom pointer-events-none ${
                      isSelected 
                        ? 'opacity-100 scale-100 visible translate-y-0' 
                        : 'opacity-0 scale-90 invisible translate-y-2'
                    }`}
                 >
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/10 gap-4">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${event.type === 'try' ? 'bg-blue-500' : event.type === 'penalty' ? 'bg-red-500' : 'bg-orange-500'}`}>
                         {getLabel(event.type)}
                       </span>
                       <span className="font-mono text-[9px] text-gray-400">{event.formattedTime}</span>
                    </div>
                    <div className="leading-tight mb-1">
                       <div className="font-black text-sm truncate text-white">{event.playerName}</div>
                       <div className="text-[10px] font-bold text-gray-400">JERSEY #{event.playerNumber}</div>
                    </div>
                    {event.reason && (
                       <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[10px] italic text-yellow-100/90 leading-snug break-words">
                          "{event.reason}"
                       </div>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[6px] border-transparent border-t-slate-900/95"></div>
                 </div>
              </div>
            );
         })}

         {filteredEvents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
               <p className="text-white/20 text-xs font-black uppercase tracking-widest">No events in this view</p>
            </div>
         )}
      </div>
      
      <div className="flex justify-center space-x-8 mt-6">
         <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2 shadow-sm"></div><span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Tries</span></div>
         <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2 shadow-sm"></div><span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Errors</span></div>
         <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm"></div><span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Penalties</span></div>
      </div>
    </div>
  );
};