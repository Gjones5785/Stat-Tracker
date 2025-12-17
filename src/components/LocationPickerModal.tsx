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

  // Determine list options based on stat type
  const isPenalty = stat === 'penaltiesConceded';
  const isError = stat === 'errors';
  const showList = isPenalty || isError;
  const allOptions = isPenalty ? PENALTY_OPTIONS : (isError ? ERROR_OPTIONS : []);

  // Filter options based on user search
  const filteredOptions = useMemo(() => {
    if (!searchText) return allOptions;
    // If text matches exactly one option, we still show list, but highlighting it.
    // If text is just a fragment, we filter.
    return allOptions.filter(opt => 
      opt.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [allOptions, searchText]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoordinate(null);
      setSearchText('');
      // Focus input
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

    // Calculate percentage position
    // x: 0 = Left (Own line), 100 = Right (Opponent line)
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    setCoordinate({ x, y });
  };

  const handleConfirm = () => {
    if (coordinate) {
      // Use search text as reason. If it matches a list item, great. If not, it's a custom note.
      // If list is shown but text is empty, default to "Unspecified"
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      {/* Modal Container - Max height limited to screen to prevent overflow */}
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="text-center mb-4 shrink-0">
          <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">1. Tap location on pitch</p>
        </div>

        {/* Pitch Container */}
        <div className="relative w-full aspect-[16/9] mb-4 shadow-lg rounded-lg overflow-hidden border-4 border-white dark:border-gray-800 ring-1 ring-gray-200 dark:ring-white/10 shrink-0">
           <div 
             ref={pitchRef}
             onClick={handlePitchClick}
             className="absolute inset-0 bg-[#2d6a36] cursor-crosshair"
           >
              {/* Rugby League Pitch SVG Overlay */}
              <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none select-none">
                  {/* Base Grass Pattern */}
                  <defs>
                    <pattern id="grassPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <rect width="10" height="10" fill="#2d6a36"/>
                      <path d="M0 10L10 0" stroke="#347a40" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grassPattern)" />

                  {/* FIELD MARKINGS */}
                  <line x1="10%" y1="0" x2="10%" y2="100%" stroke="white" strokeWidth="2" />
                  <line x1="90%" y1="0" x2="90%" y2="100%" stroke="white" strokeWidth="2" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" />
                  {/* 10m lines */}
                  <line x1="18%" y1="0" x2="18%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
                  <line x1="82%" y1="0" x2="82%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
                  {/* 40m Lines (RED) */}
                  <line x1="42%" y1="0" x2="42%" y2="100%" stroke="#ef4444" strokeWidth="2" opacity="0.9" />
                  <line x1="58%" y1="0" x2="58%" y2="100%" stroke="#ef4444" strokeWidth="2" opacity="0.9" />
              </svg>

              {/* Selected Point Marker */}
              {coordinate && (
                <div 
                  className="absolute w-6 h-6 -ml-3 -mt-3 bg-yellow-400 rounded-full border-2 border-white shadow-xl animate-bounce z-10"
                  style={{ left: `${coordinate.x}%`, top: `${coordinate.y}%` }}
                >
                   <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></div>
                </div>
              )}
           </div>
        </div>

        {/* Reason Selection Area - Flexes to fill remaining height */}
        <div className="flex-1 min-h-0 flex flex-col mb-4">
           <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 text-center">
             2. {showList ? `Select ${isPenalty ? 'Infringement' : 'Error Type'}` : 'Enter Reason / Note'}
           </label>
           
           {/* Search / Input Box */}
           <div className="relative mb-2 shrink-0">
             <input
               ref={inputRef}
               type="text"
               value={searchText}
               onChange={(e) => setSearchText(e.target.value)}
               placeholder={showList ? "Search list or type custom..." : "e.g. Intercept, Kick chase..."}
               className="w-full px-4 py-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder-gray-400 transition-all font-medium"
               autoComplete="off"
             />
             {searchText && (
               <button 
                 onClick={() => setSearchText('')}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
               >
                 ✕
               </button>
             )}
           </div>

           {/* Scrollable List - Standard Divs (No native Select) */}
           {showList && (
             <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#11121C] custom-scrollbar shadow-inner min-h-[100px]">
               {filteredOptions.length > 0 ? (
                 <div className="divide-y divide-gray-100 dark:divide-white/5">
                   {filteredOptions.map((opt) => {
                     const isSelected = searchText === opt;
                     return (
                       <button
                         key={opt}
                         onClick={() => handleOptionClick(opt)}
                         className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex justify-between items-center ${
                           isSelected 
                             ? 'bg-blue-600 text-white' 
                             : 'text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                         }`}
                       >
                         <span>{opt}</span>
                         {isSelected && <span className="font-bold">✓</span>}
                       </button>
                     );
                   })}
                 </div>
               ) : (
                 <div className="p-4 text-center text-gray-400 text-sm italic">
                   No preset options found. Using "{searchText}" as custom note.
                 </div>
               )}
             </div>
           )}
        </div>

        <div className="flex space-x-3 shrink-0">
          <Button variant="secondary" onClick={onCancel} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">Skip Details</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!coordinate}
            className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};