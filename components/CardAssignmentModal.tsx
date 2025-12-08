
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Player } from '../types';

interface CardAssignmentModalProps {
  isOpen: boolean;
  type: 'yellow' | 'red' | null;
  players: Player[];
  onConfirm: (playerId: string, reason: string) => void;
  onCancel: () => void;
}

export const CardAssignmentModal: React.FC<CardAssignmentModalProps> = ({
  isOpen,
  type,
  players,
  onConfirm,
  onCancel
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayerId('');
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) return;
    onConfirm(selectedPlayerId, reason);
  };

  const isYellow = type === 'yellow';
  const title = isYellow ? 'Issue Yellow Card' : 'Issue Red Card';
  const bgColor = isYellow ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20';
  const borderColor = isYellow ? 'border-yellow-200 dark:border-yellow-900/30' : 'border-red-200 dark:border-red-900/30';
  
  // Filter players who aren't already sent off
  const eligiblePlayers = players.filter(p => p.cardStatus !== 'red');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      <div className={`relative bg-white dark:bg-[#1A1A1C] rounded-xl shadow-2xl max-w-sm w-full p-6 border ${borderColor} animate-in fade-in zoom-in duration-200`}>
        <div className={`flex items-center space-x-3 mb-6 p-3 rounded-lg ${bgColor}`}>
            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white ${isYellow ? 'bg-yellow-500' : 'bg-red-600'}`}>
                !
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Select Player</label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              required
            >
              <option value="">-- Choose Player --</option>
              {eligiblePlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.number} - {p.name} {p.cardStatus === 'yellow' ? '(Currently in Bin)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400"
              rows={3}
              placeholder="e.g. High Tackle, Professional Foul..."
            />
          </div>

          <div className="flex space-x-3 justify-end pt-2">
            <Button variant="secondary" onClick={onCancel} className="bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20">Cancel</Button>
            <Button 
              type="submit" 
              className={isYellow ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              disabled={!selectedPlayerId}
            >
              Confirm Card
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
