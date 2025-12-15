
import React, { useState, useRef, useEffect } from 'react';
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
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoordinate(null);
      setReason('');
      setCustomReason('');
      // Focus appropriate input
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
        else if (selectRef.current) selectRef.current.focus();
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
      const finalReason = reason === 'Other' ? customReason : reason;
      onConfirm(coordinate.x, coordinate.y, finalReason);
    }
  };

  const isPenalty = stat === 'penaltiesConceded';
  const isError = stat === 'errors';
  const showList = isPenalty || isError;
  const options = isPenalty ? PENALTY_OPTIONS : ERROR_OPTIONS;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="text-center mb-4">
          <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tap location & select reason.</p>
        </div>

        {/* Pitch Container */}
        <div className="relative w-full aspect-[16/9] mb-4 shadow-2xl rounded-lg overflow-hidden border-4 border-white dark:border-gray-800 ring-1 ring-gray-200 dark:ring-white/10">
           <div 
             ref={pitchRef}
             onClick={handlePitchClick}
             className="absolute inset-0 bg-[#2d6a36] cursor-crosshair"
           >
              {/* Rugby League Pitch SVG Overlay */}
              <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none select-none">
                  {/* Base Grass Pattern (Subtle) */}
                  <defs>
                    <pattern id="grassPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                      <rect width="10" height="10" fill="#2d6a36"/>
                      <path d="M0 10L10 0" stroke="#347a40" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grassPattern)" />

                  {/* FIELD MARKINGS (0-100% Width mapping: 10% in-goal, 80% field, 10% in-goal) */}
                  
                  {/* Try Lines */}
                  <line x1="10%" y1="0" x2="10%" y2="100%" stroke="white" strokeWidth="2" />
                  <line x1="90%" y1="0" x2="90%" y2="100%" stroke="white" strokeWidth="2" />

                  {/* 10m Lines */}
                  <line x1="18%" y1="0" x2="18%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
                  <line x1="82%" y1="0" x2="82%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />

                  {/* 20m Lines */}
                  <line x1="26%" y1="0" x2="26%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
                  <line x1="74%" y1="0" x2="74%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />

                  {/* 30m Lines */}
                  <line x1="34%" y1="0" x2="34%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />
                  <line x1="66%" y1="0" x2="66%" y2="100%" stroke="white" strokeWidth="1" opacity="0.6" />

                  {/* 40m Lines (RED) */}
                  <line x1="42%" y1="0" x2="42%" y2="100%" stroke="#ef4444" strokeWidth="2" opacity="0.9" />
                  <line x1="58%" y1="0" x2="58%" y2="100%" stroke="#ef4444" strokeWidth="2" opacity="0.9" />

                  {/* 50m Line (Halfway) */}
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="2" />

                  {/* Horizontal Dashes (Scrum Lines) & Numbers */}
                  {[10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90].map((x, i) => (
                      <g key={x}>
                        {/* Top Hash */}
                        <line x1={`${x}%`} y1="10%" x2={`${x}%`} y2="11%" stroke="white" strokeWidth="2" />
                        <line x1={`${x}%`} y1="25%" x2={`${x}%`} y2="26%" stroke="white" strokeWidth="2" />
                        
                        {/* Bottom Hash */}
                        <line x1={`${x}%`} y1="75%" x2={`${x}%`} y2="74%" stroke="white" strokeWidth="2" />
                        <line x1={`${x}%`} y1="90%" x2={`${x}%`} y2="89%" stroke="white" strokeWidth="2" />
                      </g>
                  ))}

                  {/* Distance Numbers */}
                  <g className="text-[8px] sm:text-[10px] font-black text-white/40 select-none" style={{ textAnchor: 'middle', dominantBaseline: 'middle' }}>
                     {/* Top Row */}
                     <text x="18%" y="20%">10</text>
                     <text x="26%" y="20%">20</text>
                     <text x="34%" y="20%">30</text>
                     <text x="42%" y="20%" fill="#fca5a5" fillOpacity="0.6">40</text>
                     <text x="50%" y="20%">50</text>
                     <text x="58%" y="20%" fill="#fca5a5" fillOpacity="0.6">40</text>
                     <text x="66%" y="20%">30</text>
                     <text x="74%" y="20%">20</text>
                     <text x="82%" y="20%">10</text>

                     {/* Bottom Row */}
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

              {/* Goal Posts (Visual only) */}
              <div className="absolute top-1/2 left-[10%] -translate-y-1/2 -translate-x-1/2 h-[30%] w-[1px] bg-white opacity-50"></div>
              <div className="absolute top-1/2 right-[10%] -translate-y-1/2 translate-x-1/2 h-[30%] w-[1px] bg-white opacity-50"></div>

              {/* Orientation Labels */}
              <div className="absolute top-2 left-2 text-[8px] font-bold text-white/50 uppercase pointer-events-none tracking-widest">My In-Goal</div>
              <div className="absolute top-2 right-2 text-[8px] font-bold text-white/50 uppercase pointer-events-none tracking-widest">Opp In-Goal</div>

              {/* Selected Point Marker */}
              {coordinate && (
                <div 
                  className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-yellow-400 rounded-full border-2 border-white shadow-xl animate-bounce z-10"
                  style={{ left: `${coordinate.x}%`, top: `${coordinate.y}%` }}
                >
                   <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-75"></div>
                </div>
              )}
           </div>
        </div>

        {/* Reason Input Area */}
        <div className="mb-6">
           <label htmlFor="reason" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 ml-1">
             {showList ? 'Select Type' : 'Reason / Note (Optional)'}
           </label>
           
           {showList ? (
             <div className="space-y-2">
               <select
                 ref={selectRef}
                 id="reason"
                 value={reason}
                 onChange={(e) => setReason(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all appearance-none"
               >
                 <option value="">-- Select {isPenalty ? 'Infringement' : 'Error'} --</option>
                 {options.map((opt) => (
                   <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
               {/* Custom Arrow for select */}
               <div className="pointer-events-none absolute right-10 bottom-[108px] hidden">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </div>

               {reason === 'Other' && (
                 <input
                   type="text"
                   value={customReason}
                   onChange={(e) => setCustomReason(e.target.value)}
                   placeholder="Enter details..."
                   className="w-full px-4 py-2 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white animate-in fade-in slide-in-from-top-1"
                 />
               )}
             </div>
           ) : (
             <input
               ref={inputRef}
               id="reason"
               type="text"
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               placeholder="e.g. Intercept, Kick chase..."
               className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder-gray-400 transition-all"
               autoComplete="off"
             />
           )}
        </div>

        <div className="flex space-x-3">
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
