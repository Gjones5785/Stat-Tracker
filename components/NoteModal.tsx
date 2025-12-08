
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

interface NoteModalProps {
  isOpen: boolean;
  title: string;
  playerName: string;
  showLocation?: boolean;
  onSubmit: (note: string, location?: string) => void;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ 
  isOpen, 
  title, 
  playerName, 
  showLocation = false, 
  onSubmit, 
  onClose 
}) => {
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setLocation('');
      // Focus input on open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(note, location);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Player: <span className="font-semibold text-gray-800 dark:text-gray-200">{playerName || 'Unknown'}</span></p>
        
        <form onSubmit={handleSubmit}>
          {showLocation && (
            <div className="mb-4">
              <label htmlFor="location" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Field Position</label>
              <select
                id="location"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white text-gray-900"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">-- Select Location --</option>
                <option value="Defensive 20">Defensive 20</option>
                <option value="Mid-field">Mid-field</option>
                <option value="Attacking 20">Attacking 20</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="reason" className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Reason (Optional)</label>
            <input
              ref={inputRef}
              id="reason"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white text-gray-900 placeholder-gray-400"
              placeholder="e.g. High Tackle, Knock on..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex space-x-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={onClose}
              className="text-xs bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20"
            >
              Skip
            </Button>
            <Button 
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              Save Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
