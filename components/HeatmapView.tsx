
import React, { useState, useMemo } from 'react';
import { GameLogEntry } from '../types';

interface HeatmapViewProps {
  gameLog: GameLogEntry[];
}

type EventFilter = 'all' | 'try' | 'error' | 'penalty';

export const HeatmapView: React.FC<HeatmapViewProps> = ({ gameLog }) => {
  const [filter, setFilter] = useState<EventFilter>('all');

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
     return '';
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Event Heatmap</h3>
        
        {/* Filters */}
        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
           <button 
             onClick={() => setFilter('all')}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-white dark:bg-white/10 shadow-sm text-slate-900 dark:text-white' : 'text-gray-500'}`}
           >
             All
           </button>
           <button 
             onClick={() => setFilter('try')}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'try' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-500'}`}
           >
             Tries
           </button>
           <button 
             onClick={() => setFilter('error')}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'error' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'text-gray-500'}`}
           >
             Errors
           </button>
           <button 
             onClick={() => setFilter('penalty')}
             className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'penalty' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-gray-500'}`}
           >
             Pens
           </button>
        </div>
      </div>

      <div className="relative w-full aspect-[16/9] bg-[#2d6a36] rounded-xl border-4 border-white dark:border-gray-700 overflow-hidden shadow-inner">
         {/* Rugby League Pitch SVG Overlay */}
         <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none select-none">
              {/* Base Grass Pattern */}
              <defs>
                <pattern id="heatmapGrass" width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect width="10" height="10" fill="#2d6a36"/>
                  <path d="M0 10L10 0" stroke="#347a40" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#heatmapGrass)" />

              {/* FIELD MARKINGS */}
              <line x1="10%" y1="0" x2="10%" y2="100%" stroke="white" strokeWidth="2" />
              <line x1="90%" y1="0" x2="90%" y2="100%" stroke="white" strokeWidth="2" />

              <line x1="18%" y1="0" x2="18%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="82%" y1="0" x2="82%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />

              <line x1="26%" y1="0" x2="26%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="74%" y1="0" x2="74%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />

              <line x1="34%" y1="0" x2="34%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
              <line x1="66%" y1="0" x2="66%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />

              {/* 40m Lines (RED) */}
              <line x1="42%" y1="0" x2="42%" y2="100%" stroke="#ef4444" strokeWidth="2" opacity="0.9" />
              <line x1="58%" y1="0" x2="58%" y2="100%" stroke="#ef4444" strokeWidth="2" opacity="0.9" />

              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" />

              {/* Horizontal Dashes & Numbers */}
              {[10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90].map((x, i) => (
                  <g key={x}>
                    <line x1={`${x}%`} y1="10%" x2={`${x}%`} y2="11%" stroke="white" strokeWidth="2" />
                    <line x1={`${x}%`} y1="25%" x2={`${x}%`} y2="26%" stroke="white" strokeWidth="2" />
                    <line x1={`${x}%`} y1="75%" x2={`${x}%`} y2="74%" stroke="white" strokeWidth="2" />
                    <line x1={`${x}%`} y1="90%" x2={`${x}%`} y2="89%" stroke="white" strokeWidth="2" />
                  </g>
              ))}

              <g className="text-[8px] sm:text-[10px] font-black text-white/40 select-none" style={{ textAnchor: 'middle', dominantBaseline: 'middle' }}>
                 <text x="18%" y="20%">10</text>
                 <text x="26%" y="20%">20</text>
                 <text x="34%" y="20%">30</text>
                 <text x="42%" y="20%" fill="#fca5a5" fillOpacity="0.6">40</text>
                 <text x="50%" y="20%">50</text>
                 <text x="58%" y="20%" fill="#fca5a5" fillOpacity="0.6">40</text>
                 <text x="66%" y="20%">30</text>
                 <text x="74%" y="20%">20</text>
                 <text x="82%" y="20%">10</text>

                 <text x="18%" y="80%">10</text>
                 <text x="26%" y="80%">20</text>
                 <text x="34%" y="80%">30</text>
                 <text x="42%" y="80%" fill="#fca5a5" fillOpacity="0.6">40</text>
                 <text x="50%" y="80%">50</text>
                 <text x="58%" y="80%" fill="#fca5a5" fillOpacity="0.6">40</text>
                 <text x="66%" y="80%">30</text>
                 <text x="74%" y="80%">20</text>
                 <text x="82%" y="80%">10</text>
              </g>
         </svg>

         {/* Orientation Labels */}
         <div className="absolute bottom-2 left-3 text-[9px] font-bold text-white/60 uppercase pointer-events-none px-2 py-1 bg-black/20 rounded">My Goal Line</div>
         <div className="absolute bottom-2 right-3 text-[9px] font-bold text-white/60 uppercase pointer-events-none px-2 py-1 bg-black/20 rounded">Opp Goal Line</div>

         {/* Data Points */}
         {filteredEvents.map(event => (
            <div 
               key={event.id}
               className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border border-white group cursor-help z-10 ${getDotStyle(event.type)} transition-transform hover:scale-150`}
               style={{ left: `${event.coordinate!.x}%`, top: `${event.coordinate!.y}%` }}
            >
               {/* Tooltip */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded z-20 shadow-lg border border-white/10">
                  <span className="font-bold text-xs block">{getLabel(event.type)}</span>
                  <span className="text-gray-300">{event.playerName} • {event.formattedTime}</span>
               </div>
            </div>
         ))}

         {filteredEvents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <p className="text-white/30 text-sm font-medium italic">No location data for selected filter</p>
            </div>
         )}
      </div>
      
      <div className="flex justify-center space-x-6 mt-6">
         <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded-full mr-2 shadow-sm"></div><span className="text-xs font-bold text-gray-500 dark:text-gray-400">Tries</span></div>
         <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2 shadow-sm"></div><span className="text-xs font-bold text-gray-500 dark:text-gray-400">Errors</span></div>
         <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm"></div><span className="text-xs font-bold text-gray-500 dark:text-gray-400">Penalties</span></div>
      </div>
    </div>
  );
};
