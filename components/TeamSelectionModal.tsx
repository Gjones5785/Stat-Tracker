import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { SquadPlayer } from '../types';
import { TEAM_SIZE } from '../constants';

interface TeamSelectionModalProps {
  isOpen: boolean;
  squad: SquadPlayer[];
  onConfirm: (selections: { jersey: string; squadId: string; name: string }[]) => void;
  onCancel: () => void;
}

export const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({
  isOpen,
  squad,
  onConfirm,
  onCancel
}) => {
  // Map of Jersey Number (string) -> SquadPlayerId
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setSelections({});
    }
  }, [isOpen]);

  const handleSelect = (jersey: string, squadId: string) => {
    setSelections(prev => ({
      ...prev,
      [jersey]: squadId
    }));
  };

  const handleImportLocked = () => {
    try {
      const saved = localStorage.getItem('LOCKED_MATCH_TEAM');
      if (saved) {
        const assignments = JSON.parse(saved); // Array of {jersey, squadId}
        const newSelections: Record<string, string> = {};
        
        let importedCount = 0;
        if (Array.isArray(assignments)) {
            assignments.forEach((a: any) => {
                if (a.squadId) {
                // Verify the squad player still exists
                if (squad.some(p => p.id === a.squadId)) {
                    newSelections[a.jersey] = a.squadId;
                    importedCount++;
                }
                }
            });
        }
        
        if (importedCount > 0) {
            setSelections(newSelections);
        } else {
            alert("No valid locked team found. Please lock a team in the Planner first.");
        }
      } else {
        alert("No locked team found. Go to the Planner and click 'Lock In Squad'.");
      }
    } catch (e) {
      console.error("Failed to load locked team", e);
    }
  };

  const handleSubmit = () => {
    const result = [];
    for (let i = 1; i <= TEAM_SIZE; i++) {
       const jersey = i.toString();
       const squadId = selections[jersey];
       if (squadId) {
         const player = squad.find(p => p.id === squadId);
         if (player) {
           result.push({ jersey, squadId, name: player.name });
         }
       }
    }
    onConfirm(result);
  };

  // Helper to get all IDs currently assigned to ANY jersey
  const getAllSelectedIds = () => Object.values(selections).filter(Boolean);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Match Day Team</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Assign squad players to jerseys for this match.</p>
          </div>
          <button 
             onClick={handleImportLocked}
             className="text-xs font-bold text-brand hover:text-brand-700 bg-brand/5 dark:bg-brand/10 px-3 py-2 rounded-lg transition-colors border border-brand/20 flex items-center space-x-1"
             title="Import the locked team from the Planner tab"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
             <span>Load Locked Squad</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 dark:bg-[#0F0F10]">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {Array.from({ length: TEAM_SIZE }, (_, i) => i + 1).map(num => {
               const jersey = num.toString();
               const selectedId = selections[jersey] || '';
               
               // Calculate which players are available for THIS dropdown
               const allSelectedIds = getAllSelectedIds();
               const availablePlayers = squad.filter(p => {
                 const isTaken = allSelectedIds.includes(p.id);
                 const isSelectedHere = p.id === selectedId;
                 return !isTaken || isSelectedHere;
               });

               return (
                 <div key={jersey} className="bg-white dark:bg-[#1A1A1C] p-3 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm flex items-center space-x-3">
                   <div className="w-10 h-10 flex-shrink-0 bg-slate-900 dark:bg-slate-800 text-white font-bold font-mono rounded flex items-center justify-center text-lg shadow">
                     {jersey}
                   </div>
                   <select
                     className="flex-1 p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-sm focus:ring-2 focus:ring-brand outline-none w-full min-w-0 text-gray-900 dark:text-white"
                     value={selectedId}
                     onChange={(e) => handleSelect(jersey, e.target.value)}
                   >
                     <option value="">-- Select Player --</option>
                     {availablePlayers.map(p => (
                       <option key={p.id} value={p.id}>
                         {p.name}
                       </option>
                     ))}
                   </select>
                 </div>
               );
             })}
           </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A1C] flex justify-end space-x-4">
          <Button variant="secondary" onClick={onCancel} className="bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200">Cancel</Button>
          <Button onClick={handleSubmit} className="px-8 bg-brand hover:bg-brand-700 shadow-brand">Start Match</Button>
        </div>
      </div>
    </div>
  );
};