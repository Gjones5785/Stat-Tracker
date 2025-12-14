
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Player } from '../types';

interface VotingModalProps {
  isOpen: boolean;
  players: Player[];
  initialVotes?: { threePointsId: string; twoPointsId: string; onePointId: string };
  isEditing?: boolean;
  onConfirm: (votes: { threePointsId: string; twoPointsId: string; onePointId: string }) => void;
  onSkip: () => void;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  players,
  initialVotes,
  isEditing = false,
  onConfirm,
  onSkip
}) => {
  const [threePoints, setThreePoints] = useState('');
  const [twoPoints, setTwoPoints] = useState('');
  const [onePoint, setOnePoint] = useState('');

  // Reset selections when modal opens to prevent auto-population from previous state
  useEffect(() => {
    if (isOpen) {
      if (initialVotes) {
        setThreePoints(initialVotes.threePointsId || '');
        setTwoPoints(initialVotes.twoPointsId || '');
        setOnePoint(initialVotes.onePointId || '');
      } else {
        setThreePoints('');
        setTwoPoints('');
        setOnePoint('');
      }
    }
  }, [isOpen, initialVotes]);

  if (!isOpen) return null;

  // Filter out players who didn't play (optional, but good practice) - checking totalSecondsOnField > 0 or isOnField history
  // For simplicity, we list all players in the match squad
  const sortedPlayers = [...players].sort((a, b) => parseInt(a.number) - parseInt(b.number));

  const handleSubmit = () => {
    if (threePoints && twoPoints && onePoint) {
      onConfirm({
        threePointsId: threePoints,
        twoPointsId: twoPoints,
        onePointId: onePoint
      });
    }
  };

  // Logic to clear other selections if a player is moved to a new position
  const handleThreePointsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setThreePoints(newVal);
    if (newVal && newVal === twoPoints) setTwoPoints('');
    if (newVal && newVal === onePoint) setOnePoint('');
  };

  const handleTwoPointsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setTwoPoints(newVal);
    if (newVal && newVal === threePoints) setThreePoints('');
    if (newVal && newVal === onePoint) setOnePoint('');
  };

  const handleOnePointChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setOnePoint(newVal);
    if (newVal && newVal === threePoints) setThreePoints('');
    if (newVal && newVal === twoPoints) setTwoPoints('');
  };

  // Validation: All fields filled AND all selected players are unique
  const isComplete = 
    threePoints && 
    twoPoints && 
    onePoint && 
    threePoints !== twoPoints && 
    threePoints !== onePoint && 
    twoPoints !== onePoint;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in duration-200">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4 shadow-sm ring-4 ring-yellow-50 dark:ring-yellow-900/10">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Player of the Match</h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            {isEditing ? 'Update your 3-2-1 votes for this match.' : 'Cast your 3-2-1 votes for the leaderboard.'}
          </p>
        </div>

        <div className="space-y-5">
          {/* 3 Points (Gold) */}
          <div className="relative group">
            <label className="block text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 mb-1 ml-1 tracking-wider">3 Points (Best of the Pitch)</label>
            <div className="relative">
              <select
                value={threePoints}
                onChange={handleThreePointsChange}
                className="w-full pl-4 pr-10 py-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none appearance-none text-slate-900 dark:text-white font-medium transition-shadow shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="">Select Player...</option>
                {sortedPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-yellow-600 dark:text-yellow-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* 2 Points (Silver) */}
          <div className="relative group">
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1 ml-1 tracking-wider">2 Points</label>
            <div className="relative">
              <select
                value={twoPoints}
                onChange={handleTwoPointsChange}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none appearance-none text-slate-900 dark:text-white font-medium transition-shadow shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="">Select Player...</option>
                {sortedPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 dark:text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* 1 Point (Bronze) */}
          <div className="relative group">
            <label className="block text-xs font-bold uppercase text-orange-600 dark:text-orange-500 mb-1 ml-1 tracking-wider">1 Point</label>
            <div className="relative">
              <select
                value={onePoint}
                onChange={handleOnePointChange}
                className="w-full pl-4 pr-10 py-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none appearance-none text-slate-900 dark:text-white font-medium transition-shadow shadow-sm hover:shadow-md cursor-pointer"
              >
                <option value="">Select Player...</option>
                {sortedPlayers.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-orange-600 dark:text-orange-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Message if duplicates selected */}
        {threePoints && twoPoints && onePoint && !isComplete && (
           <p className="text-red-500 text-xs text-center mt-4 font-bold animate-in fade-in">
             Please ensure 3 different players are selected.
           </p>
        )}

        <div className="flex flex-col space-y-3 mt-8">
          <Button 
            onClick={handleSubmit} 
            disabled={!isComplete}
            className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isEditing ? 'Update Votes' : 'Submit & Finish Match'}
          </Button>
          <button 
            onClick={onSkip}
            className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest py-2"
          >
            {isEditing ? 'Cancel' : 'Skip Voting'}
          </button>
        </div>
      </div>
    </div>
  );
};
