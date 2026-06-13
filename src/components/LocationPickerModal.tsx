import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { StatKey } from '../types';

interface LocationPickerModalProps {
  isOpen: boolean;
  title: string;
  stat?: StatKey; // To determine which list to show
  onConfirm: (x: number, y: number, reason: string) => void;
  onCancel: () => void;
}

const PENALTY_OPTIONS = [
  "Biting",
  "Blocking (Escort)",
  "Cannonball Tackle",
  "Chicken Wing",
  "Crusher Tackle",
  "Dangerous Contact",
  "Dangerous Throw",
  "Delaying the Restart (Time Wasting)",
  "Dissent",
  "Double Movement",
  "Downtown (Chaser Offside)",
  "Dragging Opponent over Touchline (After Held)",
  "Eye Gouging",
  "Flopping",
  "Hand on Ball",
  "High Tackle",
  "Hip Drop",
  "Holding Back",
  "Holding Down",
  "Illegal Ball Strip (Two-on-One Strip)",
  "Incorrect Play-the-Ball",
  "Incorrect Restart",
  "Late Hit",
  "Leg Pull",
  "Marker Not Square",
  "Obstruction",
  "Offside",
  "Professional Foul",
  "Scrum Infringement",
  "Shoulder Charge",
  "Spear Tackle",
  "Striking (Punching/Kicking/Kneeing)",
  "Tripping",
  "Voluntary Tackle",
  "Walking Off the Mark",
  "Other"
];

const ERROR_OPTIONS = [
  "Knock On",
  "Forward Pass",
  "Play the Ball Error",
  "Pass Out / Bad Pass",
  "Failed Catch / Drop",
  "Kick Out on Full",
  "Incorrect Restart",
  "Lost in Tackle",
  "Other"
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  title,
  stat,
  onConfirm,
  onCancel
}) => {
  const [coordinate, setCoordinate] = useState<{ x: number; y: number } | null>(null);
  const [searchText, setSearchText] = useState('');
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPenalty = stat === 'penaltiesConceded';
  const isError = stat === 'errors';
  const showList = isPenalty || isError;
  const allOptions = isPenalty ? PENALTY_OPTIONS : (isError ? ERROR_OPTIONS : []);

  const filteredOptions = useMemo(() => {
    if (!searchText) return allOptions;
    return allOptions.filter(opt => 
      opt.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [allOptions, searchText]);

  useEffect(() => {
    if (isOpen) {
      setCoordinate(null);
      setSearchText('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setCoordinate({ x, y });
  };

  const handleConfirm = () => {
    if (coordinate) {
      const reason = searchText || (showList ? "Unspecified" : "");
      onConfirm(coordinate.x, coordinate.y, reason);
    }
  };

  const handleOptionClick = (opt: string) => {
    if (opt === 'Other') {
      setSearchText('');
      inputRef.current?.focus();
    } else {
      setSearchText(opt);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <div className="text-center mb-4 shrink-0">
          <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">1. Mark Event Location</p>
        </div>

        <div className="relative w-full aspect-[16/9] mb-4 shadow-xl rounded-xl overflow-hidden border-4 border-white dark:border-midnight-700 ring-1 ring-gray-200 dark:ring-white/5 shrink-0">
           <div 
             ref={pitchRef}
             onClick={handlePitchClick}
             className="absolute inset-0 bg-[#34a15a] cursor-crosshair"
           >
              <svg viewBox="0 0 100 56.25" width="100%" height="100%" className="absolute inset-0 pointer-events-none select-none">
                  {/* Field Background */}
                  <rect width="100" height="56.25" fill="#34a15a" />

                  {/* Field Perimeter */}
                  <rect x="0" y="0" width="100" height="56.25" fill="none" stroke="white" strokeWidth="0.5" opacity="0.4" />

                  {/* Main Lines */}
                  <line x1="10" y1="0" x2="10" y2="56.25" stroke="white" strokeWidth="0.8" />
                  <line x1="90" y1="0" x2="90" y2="56.25" stroke="white" strokeWidth="0.8" />
                  <line x1="50" y1="0" x2="50" y2="56.25" stroke="white" strokeWidth="0.6" />
                  
                  {/* Yardage Lines */}
                  {[18, 26, 34, 42, 58, 66, 74, 82].map(x => (
                    <line key={x} x1={x} y1="0" x2={x} y2="56.25" stroke={ (x === 42 || x === 58) ? "#ef4444" : "white" } strokeWidth={ (x === 42 || x === 58) ? "0.6" : "0.3"} opacity="0.6" />
                  ))}

                  {/* Yardage Numbers */}
                  <g className="font-jersey fill-white" style={{ fontSize: '3px', fontWeight: 'bold', opacity: 0.8 }}>
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

                  {/* HOME / AWAY Wording positioned inside In-Goal Areas */}
                  <g className="font-heading" style={{ fontWeight: 900, fill: 'white', opacity: 0.9 }}>
                    <text 
                      x="5" 
                      y="28.125" 
                      fontSize="4" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      transform="rotate(-90, 5, 28.125)"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      HOME
                    </text>
                    <text 
                      x="95" 
                      y="28.125" 
                      fontSize="4" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      transform="rotate(90, 95, 28.125)"
                      style={{ letterSpacing: '0.1em' }}
                    >
                      AWAY
                    </text>
                  </g>
              </svg>

              {/* Interaction Marker */}
              {coordinate && (
                <div 
                  className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center z-10"
                  style={{ left: `${coordinate.x}%`, top: `${coordinate.y}%` }}
                >
                   <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></div>
                   <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-2xl relative z-10"></div>
                </div>
              )}
           </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col mb-4">
           <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 text-center tracking-widest">
             2. {showList ? `Identify ${isPenalty ? 'Infringement' : 'Error'}` : 'Add Details'}
           </label>
           
           <div className="relative mb-2 shrink-0 group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input
               ref={inputRef}
               type="text"
               value={searchText}
               onChange={(e) => setSearchText(e.target.value)}
               placeholder={showList ? "Filter list or type custom note..." : "e.g. Intercept, Tackle..."}
               className="w-full pl-9 pr-10 py-3 bg-gray-50 dark:bg-midnight-900 border-2 border-gray-100 dark:border-midnight-700 rounded-xl focus:ring-0 focus:border-blue-500 outline-none text-slate-900 dark:text-white placeholder-gray-400 transition-all font-bold text-sm"
               autoComplete="off"
             />
             {searchText && (
               <button 
                 onClick={() => setSearchText('')}
                 className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-midnight-700 rounded-full text-gray-500 hover:text-red-500 transition-colors"
               >
                 ✕
               </button>
             )}
           </div>

           {showList && (
             <div className="flex-1 overflow-y-auto rounded-xl border-2 border-gray-100 dark:border-midnight-700 bg-white dark:bg-[#090A10] custom-scrollbar shadow-inner">
               {filteredOptions.length > 0 ? (
                 <div className="divide-y divide-gray-50 dark:divide-midnight-800">
                   {filteredOptions.map((opt) => {
                     const isSelected = searchText === opt;
                     return (
                       <button
                         key={opt}
                         onClick={() => handleOptionClick(opt)}
                         className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex justify-between items-center ${
                           isSelected 
                             ? 'bg-blue-600 text-white' 
                             : 'text-slate-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-midnight-800'
                         }`}
                       >
                         <span className="uppercase tracking-tight">{opt}</span>
                         {isSelected && <span className="font-black">✓</span>}
                       </button>
                     );
                   })}
                 </div>
               ) : (
                 <div className="p-8 text-center text-gray-400 text-xs font-medium italic">
                   No match found. Proceed with custom note: "{searchText}"
                 </div>
               )}
             </div>
           )}
        </div>

        <div className="flex space-x-3 shrink-0">
          <Button variant="secondary" onClick={onCancel} className="flex-1 py-3 text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-midnight-700 text-gray-500 dark:text-gray-400 border-none rounded-xl transition-all active:scale-[0.98]">Skip Details</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!coordinate}
            className="flex-1 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-30"
          >
            Log Event
          </Button>
        </div>
      </div>
    </div>
  );
};