import React, { useState } from 'react';
import { Button } from './Button';
import { IMPACT_WEIGHTS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onSave: (settings: any) => void;
  coachInfo: { name: string; email: string };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  coachInfo
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<'branding' | 'rules' | 'prefs' | 'guide' | 'account'>('branding');

  if (!isOpen) return null;

  const handleUpdate = (key: string, value: any) => {
    setLocalSettings({ ...localSettings, [key]: value });
    
    // IMMEDIATE FEEDBACK: If toggling dark mode, apply class to root right now
    if (key === 'darkMode') {
      if (value) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  };

  const handleWeightUpdate = (key: string, value: number) => {
    setLocalSettings({
      ...localSettings,
      weights: { ...localSettings.weights, [key]: value }
    });
  };

  const saveAndClose = () => {
    onSave(localSettings);
    onClose();
  };

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
        activeTab === id ? 'border-brand text-brand' : 'border-transparent text-gray-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1A1A1C] rounded-[2rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </div>
             <div>
                <h2 className="text-xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">App Settings</h2>
                <div className="flex space-x-2 mt-1 overflow-x-auto no-scrollbar">
                   <TabButton id="branding" label="Branding" />
                   <TabButton id="rules" label="Rules" />
                   <TabButton id="prefs" label="Prefs" />
                   <TabButton id="guide" label="Guide" />
                   <TabButton id="account" label="Account" />
                </div>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar max-h-[60vh]">
          
          {activeTab === 'branding' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Club Name</label>
                    <input 
                      type="text" 
                      value={localSettings.clubName}
                      onChange={(e) => handleUpdate('clubName', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Brand Color</label>
                    <div className="flex items-center space-x-3">
                       <input 
                         type="color" 
                         value={localSettings.primaryColor}
                         onChange={(e) => handleUpdate('primaryColor', e.target.value)}
                         className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                       />
                       <span className="text-xs font-mono font-bold text-gray-500 uppercase">{localSettings.primaryColor}</span>
                    </div>
                 </div>
               </div>
               
               <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2">Club Logo</h4>
                  <p className="text-[10px] text-gray-500 mb-4 uppercase">Upload your transparent PNG logo for reports.</p>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => handleUpdate('logo', reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                  />
               </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Default Half Duration</label>
                    <div className="flex items-center space-x-4">
                       <input 
                         type="number" 
                         value={localSettings.defaultHalfDuration}
                         onChange={(e) => handleUpdate('defaultHalfDuration', parseInt(e.target.value) || 40)}
                         className="w-20 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-center font-jersey text-xl"
                       />
                       <span className="text-xs font-bold text-gray-500">Minutes</span>
                    </div>
                 </div>
                 <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Sin-Bin Duration</label>
                    <div className="flex items-center space-x-4">
                       <input 
                         type="number" 
                         value={localSettings.sinBinDuration}
                         onChange={(e) => handleUpdate('sinBinDuration', parseInt(e.target.value) || 10)}
                         className="w-20 bg-white dark:bg-midnight-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-center font-jersey text-xl"
                       />
                       <span className="text-xs font-bold text-gray-500">Minutes</span>
                    </div>
                 </div>
               </div>
               
               <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div>
                     <h4 className="text-sm font-bold text-slate-800 dark:text-white">Interchange Limit</h4>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Unlimited is common for Juniors.</p>
                  </div>
                  <select 
                    value={localSettings.interchangeLimit}
                    onChange={(e) => handleUpdate('interchangeLimit', e.target.value)}
                    className="bg-white dark:bg-midnight-900 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-xs font-black uppercase"
                  >
                     <option value="Limited">Limited (8)</option>
                     <option value="Unlimited">Unlimited</option>
                  </select>
               </div>
            </div>
          )}

          {activeTab === 'prefs' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                     <span className="text-xs font-black uppercase text-slate-700 dark:text-gray-300 tracking-widest">Dark Mode</span>
                     <button 
                       onClick={() => handleUpdate('darkMode', !localSettings.darkMode)}
                       className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${localSettings.darkMode ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${localSettings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                     <span className="text-xs font-black uppercase text-slate-700 dark:text-gray-300 tracking-widest">Haptic Feedback</span>
                     <button 
                       onClick={() => handleUpdate('hapticFeedback', !localSettings.hapticFeedback)}
                       className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${localSettings.hapticFeedback ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${localSettings.hapticFeedback ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Impact Points Editor</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {Object.entries(localSettings.weights).map(([key, val]) => (
                        <div key={key} className="bg-white dark:bg-midnight-900 border border-gray-100 dark:border-white/5 rounded-xl p-2.5">
                           <span className="block text-[8px] font-black uppercase text-gray-400 mb-1 truncate">{key.replace(/([A-Z])/g, ' $1')}</span>
                           <input 
                             type="number" 
                             value={val as number}
                             onChange={(e) => handleWeightUpdate(key, parseInt(e.target.value) || 0)}
                             className="w-full bg-gray-50 dark:bg-white/5 border-none p-1 text-center font-jersey text-lg"
                           />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="text-center">
                  <h3 className="text-2xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">User Guide</h3>
                  <p className="text-sm text-gray-500 font-medium">Learn how to master LeagueLens analytics.</p>
               </div>
               <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex items-center space-x-4 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm">1</span>
                      <h4 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Build Your Squad</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed pl-12">Go to the <strong>Squad</strong> tab. Add your players once, and they will be saved forever across all matches. This builds the foundation for career statistics.</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex items-center space-x-4 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm">2</span>
                      <h4 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Plan the Match</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed pl-12">Use the <strong>Planner</strong> tab to select availability and map out your starting 13 on the visual field before matchday. Click 'Lock In' to save your selection.</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex items-center space-x-4 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm">3</span>
                      <h4 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Track Stats Live</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed pl-12">Hit <strong>New Match</strong>. Use the <strong>+</strong> / <strong>-</strong> buttons to track core stats. Use the <strong>Impact Play</strong> (lightning bolt) for game-defining moments.</p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex items-center space-x-4 mb-3">
                      <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-black text-sm">4</span>
                      <h4 className="text-lg font-heading font-bold text-slate-900 dark:text-white">Save & Review</h4>
                   </div>
                   <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed pl-12">Click <strong>End Match</strong>. This saves the game to history and updates career totals. You can then review detailed heatmaps and match reports.</p>
                </div>
               </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-8">
               <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-brand text-white rounded-[2rem] flex items-center justify-center text-3xl font-heading font-black shadow-xl">
                    {coachInfo.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-heading font-black text-slate-900 dark:text-white uppercase">{coachInfo.name}</h3>
                    <p className="text-sm font-medium text-gray-400">{coachInfo.email}</p>
                    <div className="mt-2 flex items-center space-x-2">
                       <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase rounded tracking-widest">Premium Active</span>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="#" className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg">📖</div>
                     <span className="text-sm font-bold text-slate-700 dark:text-gray-300">Coaching Manual</span>
                  </a>
                  <a href="#" className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-lg">⚖️</div>
                     <span className="text-sm font-bold text-slate-700 dark:text-gray-300">RFL Official Rules</span>
                  </a>
               </div>

               <div className="text-center pt-4">
                  <p className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-[0.3em]">LeagueLens Analytics • v2.5.0</p>
               </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-midnight-800 flex justify-end space-x-3">
           <Button variant="secondary" onClick={onClose} className="rounded-xl px-6 border-none bg-transparent text-gray-400">Discard</Button>
           <Button onClick={saveAndClose} className="bg-slate-900 dark:bg-white dark:text-slate-900 px-10 rounded-xl shadow-xl active:scale-95 transition-all uppercase tracking-widest font-black text-xs">Save Changes</Button>
        </div>
      </div>
    </div>
  );
};