import React, { useState } from 'react';
import { ActionItem, Coach, ActionCategory } from '../types';
import { Button } from './Button';

interface CoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ActionItem[];
  coaches: Coach[];
  onAddAction: (content: string, category: ActionCategory) => void;
  onToggleAction: (id: string) => void;
  onDeleteAction: (id: string) => void;
  onCycleCoach: (actionId: string) => void;
  onAddCoach: (name: string) => void;
  onDeleteCoach: (id: string) => void;
}

export const CoachDrawer: React.FC<CoachDrawerProps> = ({
  isOpen,
  onClose,
  actions,
  coaches,
  onAddAction,
  onToggleAction,
  onDeleteAction,
  onCycleCoach,
  onAddCoach,
  onDeleteCoach
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'staff'>('notes');
  const [newNote, setNewNote] = useState('');
  const [category, setCategory] = useState<ActionCategory>('Tactical');
  const [staffName, setStaffName] = useState('');

  const categories: ActionCategory[] = ['Tactical', 'Logistics', 'Medical', 'Admin'];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddAction(newNote, category);
    setNewNote('');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;
    onAddCoach(staffName);
    setStaffName('');
  };

  const getCategoryColor = (cat: ActionCategory) => {
    switch (cat) {
      case 'Tactical': return 'bg-blue-500';
      case 'Medical': return 'bg-red-500';
      case 'Logistics': return 'bg-orange-500';
      case 'Admin': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-[400px] bg-white dark:bg-midnight-900 z-[201] shadow-2xl transition-transform duration-300 transform flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-midnight-800">
           <div>
              <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">Coach's Clipboard</h2>
              <div className="flex space-x-4 mt-2">
                 <button onClick={() => setActiveTab('notes')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'notes' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}>Actions & Notes</button>
                 <button onClick={() => setActiveTab('staff')} className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${activeTab === 'staff' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}>Staff</button>
              </div>
           </div>
           <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
           {activeTab === 'notes' ? (
              <div className="space-y-6">
                 {/* Add Note Form */}
                 <form onSubmit={handleAddNote} className="space-y-3 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <textarea 
                       value={newNote}
                       onChange={(e) => setNewNote(e.target.value)}
                       placeholder="Add a game note or action..."
                       className="w-full bg-transparent border-none text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:ring-0 resize-none h-20"
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                       <div className="flex space-x-1">
                          {categories.map(cat => (
                             <button 
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`w-3 h-3 rounded-full ${getCategoryColor(cat)} transition-transform ${category === cat ? 'scale-125 ring-2 ring-white dark:ring-midnight-900 shadow' : 'opacity-40 hover:opacity-100'}`}
                                title={cat}
                             />
                          ))}
                       </div>
                       <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg active:scale-95 transition-all">Add Note</button>
                    </div>
                 </form>

                 {/* Action List */}
                 <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active List</h3>
                    {actions.filter(a => !a.isCompleted).length === 0 && <p className="text-center py-8 text-sm text-gray-400 italic">No pending actions.</p>}
                    {actions.filter(a => !a.isCompleted).sort((a,b) => b.createdAt - a.createdAt).map(item => {
                       const coach = coaches.find(c => c.id === item.assignedCoachId) || (coaches.length > 0 ? coaches[0] : null);
                       return (
                          <div key={item.id} className="group relative flex items-start p-4 bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                             <div className={`w-1 self-stretch rounded-full ${getCategoryColor(item.category)} mr-4`}></div>
                             <div className="flex-1 min-w-0 pr-10">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">{item.category}</span>
                                   {item.matchTimestamp && <span className="text-[10px] font-mono font-bold text-red-500">{item.matchTimestamp}</span>}
                                </div>
                                <p className="text-sm text-slate-800 dark:text-gray-200 leading-relaxed">{item.content}</p>
                             </div>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                                <button 
                                   onClick={() => onCycleCoach(item.id)}
                                   className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm border-2 border-white dark:border-midnight-800 transition-transform active:scale-90 ${coach?.color || 'bg-gray-400'}`}
                                   title={`Assigned to: ${coach?.name || 'Unassigned'}. Click to cycle staff.`}
                                >
                                   {coach?.initials || '?'}
                                </button>
                                <button onClick={() => onToggleAction(item.id)} className="w-5 h-5 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-green-500 hover:border-green-600 transition-colors">
                                   <svg className="w-3 h-3 text-transparent hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </button>
                             </div>
                             <button onClick={() => onDeleteAction(item.id)} className="absolute -left-2 -top-2 w-5 h-5 bg-gray-100 dark:bg-midnight-700 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</button>
                          </div>
                       );
                    })}
                 </div>

                 {/* Completed Section */}
                 {actions.some(a => a.isCompleted) && (
                    <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-white/5 opacity-50">
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</h3>
                       {actions.filter(a => a.isCompleted).map(item => (
                          <div key={item.id} className="flex items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-transparent grayscale">
                             <div className="flex-1 text-xs line-through text-gray-500">{item.content}</div>
                             <button onClick={() => onToggleAction(item.id)} className="p-1 text-gray-400 hover:text-blue-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                             <button onClick={() => onDeleteAction(item.id)} className="p-1 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           ) : (
              <div className="space-y-6">
                 {/* Add Staff Form */}
                 <form onSubmit={handleAddStaff} className="space-y-3 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 block">New Staff Member</label>
                    <div className="flex space-x-2">
                       <input 
                          type="text" 
                          value={staffName}
                          onChange={(e) => setStaffName(e.target.value)}
                          placeholder="e.g. Asst. Coach Dave"
                          className="flex-1 bg-white dark:bg-midnight-800 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                       />
                       <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">Add</button>
                    </div>
                 </form>

                 <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coaching Staff</h3>
                    <div className="grid grid-cols-1 gap-2">
                       {coaches.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-4 bg-white dark:bg-midnight-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm group">
                             <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white dark:border-midnight-700 shadow-sm ${c.color}`}>{c.initials}</div>
                                <span className="font-bold text-slate-800 dark:text-gray-200 text-sm">{c.name}</span>
                             </div>
                             <button onClick={() => onDeleteCoach(c.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                       ))}
                       {coaches.length === 0 && <p className="text-center py-8 text-sm text-gray-400 italic">No staff added yet.</p>}
                    </div>
                 </div>
              </div>
           )}
        </div>

        {/* Status Bar */}
        <div className="p-4 bg-gray-50 dark:bg-midnight-800 border-t border-gray-100 dark:border-white/5 flex justify-center text-[8px] font-black uppercase text-gray-400 tracking-[0.2em]">
           LeagueLens Analytics v2.5.0
        </div>
      </div>
    </>
  );
};