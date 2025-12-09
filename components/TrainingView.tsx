
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './Button';
import { SquadPlayer, TrainingSession, TrainingType } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface TrainingViewProps {
  squad: SquadPlayer[];
  history: TrainingSession[];
  onSaveSession: (session: Omit<TrainingSession, 'id'>) => void;
  onUpdateSession: (id: string, updates: Partial<TrainingSession>) => void;
  onDeleteSession: (id: string) => void;
  onAddSquadPlayer: (player: Omit<SquadPlayer, 'id' | 'createdAt'>) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  squad,
  history,
  onSaveSession,
  onUpdateSession,
  onDeleteSession,
  onAddSquadPlayer
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingAttendeesSessionId, setViewingAttendeesSessionId] = useState<string | null>(null);
  
  // Deletion state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Form State
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<TrainingType>('Pitch');
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [newPlayerName, setNewPlayerName] = useState('');

  // Editing Session State
  const [isEditingAttendees, setIsEditingAttendees] = useState(false);
  const [editingAttendeesSet, setEditingAttendeesSet] = useState<Set<string>>(new Set());

  // --- STATS CALCULATION ---
  const attendanceStats = useMemo(() => {
    const stats: Record<string, { pitch: number; gym: number; other: number; total: number }> = {};
    
    // Initialize for all squad members
    squad.forEach(p => {
      stats[p.id] = { pitch: 0, gym: 0, other: 0, total: 0 };
    });

    history.forEach(session => {
      session.attendeeIds.forEach(playerId => {
        // If player still exists in squad
        if (stats[playerId]) {
           stats[playerId].total += 1;
           if (session.type === 'Pitch') stats[playerId].pitch += 1;
           else if (session.type === 'Gym') stats[playerId].gym += 1;
           else stats[playerId].other += 1;
        }
      });
    });

    return Object.entries(stats)
      .map(([id, data]) => {
        const player = squad.find(s => s.id === id);
        return {
          id,
          name: player?.name || 'Unknown',
          ...data,
          percentage: history.length > 0 ? ((data.total / history.length) * 100).toFixed(0) : '0'
        };
      })
      .sort((a, b) => b.total - a.total); // Sort by highest attendance
  }, [squad, history]);

  const avgAttendance = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.attendeeIds.length, 0) / history.length).toFixed(1) 
    : '0';

  // --- HANDLERS ---
  const handleToggleAttendee = (id: string) => {
    const newSet = new Set(selectedAttendees);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAttendees(newSet);
  };

  const handleSelectAll = () => {
    if (selectedAttendees.size === squad.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(squad.map(p => p.id)));
    }
  };

  const handleQuickAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAddSquadPlayer({ name: newPlayerName, position: 'Training Add' });
    setNewPlayerName('');
  };

  const handleSubmitSession = () => {
    onSaveSession({
      date: sessionDate,
      type: sessionType,
      attendeeIds: Array.from(selectedAttendees)
    });
    setIsModalOpen(false);
    // Reset form
    setSelectedAttendees(new Set());
    setSessionDate(new Date().toISOString().split('T')[0]);
  };

  const selectedViewSession = useMemo(() => {
    return history.find(s => s.id === viewingAttendeesSessionId);
  }, [history, viewingAttendeesSessionId]);

  const viewingSessionAttendees = useMemo(() => {
    if (!selectedViewSession) return [];
    return squad.filter(p => selectedViewSession.attendeeIds.includes(p.id));
  }, [squad, selectedViewSession]);

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDeleteSession(pendingDeleteId);
      setPendingDeleteId(null);
    }
  };

  // Edit Handlers
  const handleStartEditing = () => {
    if (selectedViewSession) {
      setEditingAttendeesSet(new Set(selectedViewSession.attendeeIds));
      setIsEditingAttendees(true);
    }
  };

  const handleToggleEditAttendee = (id: string) => {
    const newSet = new Set(editingAttendeesSet);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setEditingAttendeesSet(newSet);
  };

  const handleSaveAttendeeChanges = () => {
    if (selectedViewSession) {
      onUpdateSession(selectedViewSession.id, {
        attendeeIds: Array.from(editingAttendeesSet)
      });
      setIsEditingAttendees(false);
    }
  };

  // Reset edit state when modal closes
  useEffect(() => {
    if (!viewingAttendeesSessionId) {
      setIsEditingAttendees(false);
    }
  }, [viewingAttendeesSessionId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setIsModalOpen(true)}
          className="group bg-slate-900 dark:bg-white rounded-3xl p-6 shadow-apple dark:shadow-none hover:shadow-apple-hover transition-all duration-300 cursor-pointer border border-transparent hover:scale-[1.01] flex flex-col justify-between text-white dark:text-slate-900 h-full min-h-[160px]"
        >
          <div className="w-12 h-12 bg-white/10 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 dark:group-hover:bg-slate-900/20 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-heading font-bold mb-1">Log Session</h3>
            <p className="text-white/60 dark:text-slate-500 text-sm font-medium">Record attendance & type.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col justify-center">
           <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Total Sessions</span>
           <span className="text-4xl font-heading font-black text-slate-900 dark:text-white">{history.length}</span>
           <div className="flex items-center space-x-3 mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
             <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>Pitch: {history.filter(h => h.type === 'Pitch').length}</span>
             <span className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>Gym: {history.filter(h => h.type === 'Gym').length}</span>
           </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl p-6 shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 flex flex-col justify-center">
           <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Avg. Attendance</span>
           <span className="text-4xl font-heading font-black text-slate-900 dark:text-white">{avgAttendance}</span>
           <span className="text-xs font-medium text-gray-400 mt-1">Players per session</span>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'stats' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Attendance Tracker
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Session History
        </button>
      </div>

      <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden min-h-[400px]">
        {activeTab === 'stats' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/5">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Sessions</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance %</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pitch</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gym</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1A1A1C] divide-y divide-gray-200 dark:divide-white/5">
                {attendanceStats.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No data available.</td></tr>
                ) : (
                  attendanceStats.map(stat => (
                    <tr key={stat.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{stat.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono text-slate-700 dark:text-gray-300">{stat.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                           Number(stat.percentage) >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                           Number(stat.percentage) >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                           'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {stat.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{stat.pitch}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">{stat.gym}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
           <div className="p-6 space-y-4">
             {history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No sessions logged yet.</div>
             ) : (
               history.map(session => (
                 <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 group transition-colors hover:border-gray-200 dark:hover:border-white/10">
                    <div>
                       <div className="flex items-center space-x-3 mb-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{new Date(session.date).toLocaleDateString()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                             session.type === 'Pitch' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                             session.type === 'Gym' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' :
                             'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>{session.type}</span>
                       </div>
                       <p className="text-xs text-gray-500 dark:text-gray-400">{session.attendeeIds.length} Attendees</p>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button 
                          onClick={() => setViewingAttendeesSessionId(session.id)}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-white dark:bg-white/5 rounded-lg border border-transparent hover:border-blue-200 shadow-sm"
                          title="View Attendees"
                       >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                       </button>
                       <button 
                          onClick={() => setPendingDeleteId(session.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg bg-white dark:bg-white/5 shadow-sm border border-transparent hover:border-red-100"
                          title="Delete Session"
                       >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                 </div>
               ))
             )}
           </div>
        )}
      </div>

      {/* View/Edit Attendees Modal */}
      {viewingAttendeesSessionId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingAttendeesSessionId(null)} />
           <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl max-w-sm w-full max-h-[70vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-white/10">
              <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                 <div>
                    <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white">
                      {isEditingAttendees ? 'Edit Attendees' : 'Attendees'}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedViewSession ? new Date(selectedViewSession.date).toLocaleDateString() : ''}</p>
                 </div>
                 <div className="flex items-center space-x-2">
                   {!isEditingAttendees && (
                     <button onClick={handleStartEditing} className="p-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors" title="Edit List">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                     </button>
                   )}
                   <button onClick={() => setViewingAttendeesSessionId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                 {isEditingAttendees ? (
                   /* EDIT MODE: Show All Squad with Checkboxes */
                   <div className="space-y-4">
                     <div className="space-y-2">
                       {squad.map(player => (
                          <label key={player.id} className="flex items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors">
                             <input 
                               type="checkbox"
                               checked={editingAttendeesSet.has(player.id)}
                               onChange={() => handleToggleEditAttendee(player.id)}
                               className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                             />
                             <span className="text-sm font-bold text-slate-800 dark:text-gray-200">{player.name}</span>
                          </label>
                       ))}
                       {squad.length === 0 && <p className="text-center text-sm text-gray-400">No squad members.</p>}
                     </div>
                     
                     {/* Add New Player in Edit Mode */}
                     <div className="border-t border-gray-100 dark:border-white/10 pt-4 mt-4">
                       <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Add Missing Player</label>
                       <div className="flex space-x-2">
                          <input 
                            type="text"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Enter name..."
                            className="flex-1 px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-900 dark:text-white placeholder-gray-400"
                          />
                          <Button onClick={handleQuickAddPlayer} variant="secondary" className="whitespace-nowrap text-xs px-3">
                             + Add
                          </Button>
                       </div>
                       <p className="text-[10px] text-gray-400 mt-1">New players will appear in the list above. Check to add them.</p>
                     </div>
                   </div>
                 ) : (
                   /* VIEW MODE: Show Only Attendees */
                   <>
                     {viewingSessionAttendees.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm italic">No attendees found.</p>
                     ) : (
                        viewingSessionAttendees.map(p => (
                           <div key={p.id} className="flex items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center mr-3 shadow-sm border border-gray-100 dark:border-white/5">
                                 <span className="text-[10px] font-bold text-indigo-500">#</span>
                              </div>
                              <span className="text-sm font-bold text-slate-800 dark:text-gray-200">{p.name}</span>
                           </div>
                        ))
                     )}
                   </>
                 )}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex space-x-3 justify-center">
                 {isEditingAttendees ? (
                   <>
                     <Button variant="secondary" onClick={() => setIsEditingAttendees(false)} className="flex-1 text-xs">Cancel</Button>
                     <Button onClick={handleSaveAttendeeChanges} className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                   </>
                 ) : (
                   <Button variant="secondary" onClick={() => setViewingAttendeesSessionId(null)} className="w-full text-xs">Close List</Button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Log Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
               <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Log Training Session</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Session Type</label>
                    <select 
                      value={sessionType}
                      onChange={(e) => setSessionType(e.target.value as TrainingType)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    >
                       <option value="Pitch">Pitch Session</option>
                       <option value="Gym">Gym / Weights</option>
                       <option value="Other">Other / Recovery</option>
                    </select>
                  </div>
               </div>

               <div>
                 <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Attendance ({selectedAttendees.size})</label>
                    <button onClick={handleSelectAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      {selectedAttendees.size === squad.length ? 'Deselect All' : 'Select All'}
                    </button>
                 </div>
                 <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 max-h-60 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {squad.map(player => (
                      <label key={player.id} className="flex items-center space-x-3 p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                         <input 
                           type="checkbox"
                           checked={selectedAttendees.has(player.id)}
                           onChange={() => handleToggleAttendee(player.id)}
                           className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                         />
                         <span className="text-sm font-medium text-slate-700 dark:text-gray-200">{player.name}</span>
                      </label>
                    ))}
                    {squad.length === 0 && <p className="col-span-2 text-center text-sm text-gray-400 py-4">No squad members found.</p>}
                 </div>
               </div>

               <div className="border-t border-gray-100 dark:border-white/10 pt-4">
                 <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2">Add New Player</label>
                 <div className="flex space-x-2">
                    <input 
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Enter name to add & attend..."
                      className="flex-1 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder-gray-400"
                    />
                    <Button onClick={handleQuickAddPlayer} variant="secondary" className="whitespace-nowrap">
                       + Add
                    </Button>
                 </div>
                 <p className="text-[10px] text-gray-400 mt-1">Added players will be saved to your main squad automatically.</p>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex justify-end space-x-3">
               <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
               <Button onClick={handleSubmitSession} className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800">Log Session</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!pendingDeleteId}
        title="Delete Training Session?"
        message="Are you sure you want to remove this session? This will recalculate attendance percentages for all players."
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

    </div>
  );
};