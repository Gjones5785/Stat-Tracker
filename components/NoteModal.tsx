import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

interface NoteModalProps {
  isOpen: boolean;
  title: string;
  playerName: string;
  onSubmit: (note: string) => void;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, title, playerName, onSubmit, onClose }) => {
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      // Focus input on open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(note);
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
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-4">Player: <span className="font-semibold text-gray-800">{playerName || 'Unknown'}</span></p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-xs font-bold uppercase text-gray-500 mb-1">Reason (Optional)</label>
            <input
              ref={inputRef}
              id="reason"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="e.g. High Tackle, Offside..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex space-x-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={onClose}
              className="text-xs"
            >
              Skip
            </Button>
            <Button 
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              Save Note
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
