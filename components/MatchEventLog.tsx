
import React, { useState } from 'react';
import { GameLogEntry } from '../types';

interface MatchEventLogProps {
  events: GameLogEntry[];
}

export const MatchEventLog: React.FC<MatchEventLogProps> = ({ events }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Sort events by timestamp descending (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'try':
        return <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">T</div>;
      case 'penalty':
        return <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">!</div>;
      case 'error':
        return <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold">E</div>;
      case 'yellow_card':
        return <div className="w-5 h-6 bg-yellow-400 rounded-sm shadow-sm"></div>;
      case 'red_card':
        return <div className="w-5 h-6 bg-red-600 rounded-sm shadow-sm"></div>;
      case 'substitution':
        return <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 flex items-center justify-center"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></div>;
      default: // kick or other
        return <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">K</div>;
    }
  };

  const getEventLabel = (event: GameLogEntry) => {
    switch (event.type) {
      case 'try': return 'Try Scored';
      case 'penalty': return 'Penalty Conceded';
      case 'error': return 'Error';
      case 'yellow_card': return 'Yellow Card';
      case 'red_card': return 'Red Card';
      case 'substitution': return event.reason || 'Substitution';
      default: return 'Kick / Conversion';
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-apple dark:shadow-none border border-gray-200 dark:border-white/5 overflow-hidden mt-6 mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <span className="font-heading font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide">Match Log</span>
          <span className="bg-gray-200 dark:bg-white/20 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {events.length} Events
          </span>
        </div>
        
        <svg 
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="max-h-[400px] overflow-y-auto p-4 bg-white dark:bg-[#1A1A1C]">
          {sortedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm italic">
              No events recorded yet. Start the timer and track stats.
            </div>
          ) : (
            <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-3 space-y-6 pl-6 py-2">
              {sortedEvents.map((event) => (
                <div key={event.id} className="relative flex items-start group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-[#1A1A1C] group-hover:bg-blue-500 transition-colors"></div>
                  
                  {/* Time */}
                  <div className="flex flex-col mr-4 min-w-[50px]">
                     <span className="text-xs font-bold text-slate-900 dark:text-white">{event.formattedTime}</span>
                     <span className="text-[10px] text-gray-400 font-medium uppercase">{event.period}</span>
                  </div>

                  {/* Icon */}
                  <div className="mr-3 mt-0.5">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-200">
                      {getEventLabel(event)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-slate-700 dark:text-gray-300">#{event.playerNumber} {event.playerName}</span>
                      {event.location && <span className="ml-1">• {event.location}</span>}
                    </p>
                    {event.reason && event.type !== 'substitution' && (
                       <p className="text-[10px] text-gray-400 italic mt-0.5">"{event.reason}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
