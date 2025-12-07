
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onCancel}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Match Day Team</h2>
            <p className="text-sm text-gray-500">Assign squad players to jerseys for this match.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {Array.from({ length: TEAM_SIZE }, (_, i) => i + 1).map(num => {
               const jersey = num.toString();
               const selectedId = selections[jersey] || '';
               
               return (
                 <div key={jersey} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center space-x-3">
                   <div className="w-10 h-10 bg-slate-900 text-white font-bold font-mono rounded flex items-center justify-center text-lg shadow">
                     {jersey}
                   </div>
                   <select
                     className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                     value={selectedId}
                     onChange={(e) => handleSelect(jersey, e.target.value)}
                   >
                     <option value="">-- Select Player --</option>
                     {squad.map(p => (
                       <option key={p.id} value={p.id}>
                         {p.name} {p.position ? `(${p.position})` : ''}
                       </option>
                     ))}
                   </select>
                 </div>
               );
             })}
           </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-white flex justify-end space-x-4">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit} className="px-8 bg-red-600 hover:bg-red-700">Start Match</Button>
        </div>
      </div>
    </div>
  );
};
