import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Drill, DrillCategory, PlaybookItem, TrainingPlan, PlanBlock, DrillDifficulty } from '../types';
import { Button } from './Button';
import { TacticsBoard } from './TacticsBoard';
import { ConfirmationModal } from './ConfirmationModal';
import { CoachManualView } from './CoachManualView';

// --- REF'S CORNER DATA (RFL TIERS 4-6) ---
const RULES_DATA = [
  {
    category: 'Match Basics',
    description: 'Timings, scoring, and substitutions.',
    icon: '⏱️',
    color: 'bg-blue-500',
    rules: [
      { title: 'Duration', content: 'Open Age: 80 mins (40 each way). Youth ages vary (e.g., U16 30m halves). Time off is generally NOT played in community games unless specified by the league.' },
      { title: 'Interchanges', content: 'Tier 4-6: Usually limited to 4 substitutes with 8 interchanges (rolling). Note: Some junior leagues allow unlimited interchanges to maximize participation.' },
      { title: 'Golden Point', content: 'In community league fixtures, if scores are level at full time, the match is drawn. Extra time/Golden Point typically only applies in Knockout Cup competitions.' },
      { title: 'Scoring', content: 'Try: 4 points. Conversion: 2 points. Penalty Goal: 2 points. Drop Goal: 1 point.' }
    ]
  },
  {
    category: 'Foul Play',
    description: 'High tackles, dissent, and misconduct.',
    icon: '🚫',
    color: 'bg-red-500',
    rules: [
      { title: 'High Tackle', content: 'Any contact with the head or neck is a penalty. "Seatbelt" tackles are now strictly penalized. Intentional contact is a Red Card.' },
      { title: 'Shoulder Charge', content: 'Strictly illegal. Defenders must attempt to wrap their arms. Penalty + potential Sin Bin/Dismissal.' },
      { title: 'Dissent', content: 'Only the Captain may speak to the Referee. Dissent can result in a penalty, 10m march forward, or Sin Bin (10 mins).' },
      { title: 'Ball Stripping', content: 'Allowed only in 1-on-1 tackles. If a second defender has touched the attacker at any point, the ball cannot be stripped.' }
    ]
  },
  {
    category: 'The Ruck',
    description: 'Play the ball, markers, and holding down.',
    icon: '🏉',
    color: 'bg-emerald-500',
    rules: [
      { title: 'Marker Defence', content: 'Markers must stand directly in front of the PTB. They cannot move until the ball is cleared or the dummy half runs.' },
      { title: 'Play the Ball', content: 'Must be played backwards with the foot. Rolling the ball or not touching it with the foot is a turnover (handover).' },
      { title: 'Flopping', content: 'Defenders must clear the ruck immediately. Lying on the player to slow the game ("flopping") is a penalty.' }
    ]
  },
  {
    category: 'Restart Rules',
    description: 'Kicks, scrums, and dropouts.',
    icon: '👟',
    color: 'bg-orange-500',
    rules: [
      { title: '40/20 Kick', content: 'If a kick from inside your 40m lands inside the opponent 20m and bounces out, the kicking team gets the feed at the scrum (or tap restart in some junior rules).' },
      { title: 'Goal Line Dropout', content: 'Required when the ball becomes dead in the in-goal area from a defender\'s touch or is grounded by a defender.' },
      { title: 'Kick Out on Full', content: 'Handover to the non-kicking team at the point where the ball was kicked.' }
    ]
  }
];

// --- GOVERNANCE & SAFETY DATA ---
const SAFETY_CHECKLIST = [
  { id: '1', label: 'Technical Area Set Up', sub: 'Roped off 1m from touchline.', icon: '🏗️' },
  { id: '2', label: 'Touchline Manager (Yellow Vest)', sub: 'Mandatory. Vest visible.', icon: '🦺' },
  { id: '3', label: 'First Aid Kit Verified', sub: 'Ice, bandages, foil blankets.', icon: '⛑️' },
  { id: '4', label: 'Water Carriers', sub: 'Must wear bibs. No coaching.', icon: '💧' },
  { id: '5', label: 'Pitch Inspection', sub: 'Glass, debris, padded posts.', icon: '🔍' },
  { id: '6', label: 'Rugby Balls (Match Ready)', sub: 'Inflated correctly.', icon: '🏉' }
];

// --- DRILL LIBRARY DATA ---
const DRILL_LIBRARY: Drill[] = [
  {
    id: 'd1',
    title: '3-on-2 Overlap Generator',
    category: 'Attack',
    difficulty: 'Intermediate',
    durationMin: 15,
    minPlayers: 5,
    description: 'A grid drill focusing on drawing the defender and executing the pass at the line.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [
        {
          id: "f1",
          tokens: [
            {id: "d1", type: "defender", x: 40, y: 30, label: "A"},
            {id: "d2", type: "defender", x: 60, y: 30, label: "B"},
            {id: "a1", type: "attacker", x: 35, y: 70, label: "1"},
            {id: "a2", type: "attacker", x: 50, y: 70, label: "2"},
            {id: "a3", type: "attacker", x: 65, y: 70, label: "3"},
            {id: "b1", type: "ball", x: 37, y: 72}
          ]
        },
        {
          id: "f2",
          tokens: [
            {id: "d1", type: "defender", x: 40, y: 45, label: "A"},
            {id: "d2", type: "defender", x: 55, y: 45, label: "B"},
            {id: "a1", type: "attacker", x: 35, y: 50, label: "1"},
            {id: "a2", type: "attacker", x: 50, y: 50, label: "2"},
            {id: "a3", type: "attacker", x: 70, y: 50, label: "3"},
            {id: "b1", type: "ball", x: 50, y: 50}
          ]
        },
        {
          id: "f3",
          tokens: [
            {id: "d1", type: "defender", x: 40, y: 45, label: "A"},
            {id: "d2", type: "defender", x: 55, y: 48, label: "B"},
            {id: "a1", type: "attacker", x: 35, y: 30, label: "1"},
            {id: "a2", type: "attacker", x: 50, y: 40, label: "2"},
            {id: "a3", type: "attacker", x: 70, y: 30, label: "3"},
            {id: "b1", type: "ball", x: 70, y: 30}
          ]
        }
      ]
    }),
    steps: [
        'Set up a 10m x 10m grid.',
        'Defenders (2) start on one line, Attackers (3) on the other.',
        'On whistle, attackers move forward passing the ball.',
        'Defenders must choose who to mark, creating the overlap.',
        'Attackers must identify the free man and execute.'
    ],
    coachingPoints: [
        'Fix the defender before passing',
        'Call the ball early',
        'Run straight lines',
        'Hands up ready to receive'
    ],
    tags: ['Passing', 'Decision Making', 'Backs']
  },
  {
    id: 'd2',
    title: 'The "Malcolm" Drill',
    category: 'Fitness',
    difficulty: 'Advanced',
    durationMin: 10,
    minPlayers: 1,
    description: 'A classic conditioning drill that combines down-ups with shuttle runs.',
    visualData: JSON.stringify({
      pitchType: "full",
      frames: [{
        id: "f1",
        tokens: [
          {id: "c1", type: "cone", x: 50, y: 50},
          {id: "c2", type: "cone", x: 50, y: 20},
          {id: "c3", type: "cone", x: 50, y: 80},
          {id: "p1", type: "attacker", x: 50, y: 52, label: "P"}
        ]
      },
      {
        id: "f2",
        tokens: [
          {id: "c1", type: "cone", x: 50, y: 50},
          {id: "c2", type: "cone", x: 50, y: 20},
          {id: "c3", type: "cone", x: 50, y: 80},
          {id: "p1", type: "attacker", x: 50, y: 82, label: "P"}
        ]
      }]
    }),
    steps: [
        'Start on the halfway line on chest.',
        'Get up, backpedal to the 10m line, get down on chest.',
        'Get up, sprint back to halfway, get down on chest.',
        'Get up, sprint through to opposite 10m line.',
        'Repeat continuously for 6 reps.'
    ],
    coachingPoints: [
        'Chest to ground every time',
        'Explode out of the turn',
        'Mental toughness when fatigued'
    ],
    tags: ['Conditioning', 'Mental Toughness']
  },
  {
    id: 'd3',
    title: 'Inside Shoulder Defence',
    category: 'Defence',
    difficulty: 'Beginner',
    durationMin: 20,
    minPlayers: 6,
    description: 'Working in pods to improve line speed and contact placement.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "d1", type: "defender", x: 40, y: 40, label: "A"},
          {id: "d2", type: "defender", x: 50, y: 40, label: "B"},
          {id: "d3", type: "defender", x: 60, y: 40, label: "C"}
        ]
      }]
    }),
    steps: [
        'Groups of 3 defenders vs 3 attackers holding pads.',
        'Defenders move up together on "Go".',
        'Target the inside shoulder of the attacker.',
        'Drive through the contact.'
    ],
    coachingPoints: [
        'Line integrity - move as one',
        'Head placement correct (cheek to cheek)',
        'Leg drive after contact'
    ],
    tags: ['Tackling', 'Structure']
  },
  {
    id: 'd4',
    title: 'Play the Ball Speed',
    category: 'Core Skills',
    difficulty: 'Intermediate',
    durationMin: 15,
    minPlayers: 4,
    description: 'Drill focuses on the wrestler winning the ruck and the ball carrier getting a quick placement.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "d1", type: "defender", x: 48, y: 48, label: "M"},
          {id: "d2", type: "defender", x: 52, y: 48, label: "M"},
          {id: "a1", type: "attacker", x: 50, y: 52, label: "BC"}
        ]
      }]
    }),
    steps: [
        '1 Ball Carrier vs 2 Defenders.',
        'Tackle is made, carrier must fight to front.',
        'Defenders must peel off quickly at marker.',
        'Dummy half services the ball immediately.'
    ],
    coachingPoints: [
        'Fight to elbows and knees',
        'Clear separation from defender',
        'Place ball, do not roll it'
    ],
    tags: ['Ruck', 'Contact']
  }
];

// --- HELPER COMPONENTS ---

const RefCornerView = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search) return RULES_DATA;
    return RULES_DATA.filter(cat => 
      cat.category.toLowerCase().includes(search.toLowerCase()) || 
      cat.rules.some(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  const displayRules = useMemo(() => {
    if (activeCategory) {
      const cat = RULES_DATA.find(c => c.category === activeCategory);
      return cat ? cat.rules : [];
    }
    if (search) {
      return RULES_DATA.flatMap(c => c.rules.filter(r => 
        r.title.toLowerCase().includes(search.toLowerCase()) || 
        r.content.toLowerCase().includes(search.toLowerCase())
      ));
    }
    return [];
  }, [activeCategory, search]);

  const activeCategoryData = RULES_DATA.find(c => c.category === activeCategory);

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 text-white dark:text-slate-900 shadow-xl relative overflow-hidden group">
           <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 dark:bg-black/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
           <div className="relative z-10 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-white/10 dark:border-black/5">
                 👮
              </div>
              <div>
                 <h2 className="text-xl font-heading font-black tracking-tight">Ref's Corner</h2>
                 <p className="text-xs opacity-70 font-medium">RFL Tier 4-6 Rulebook</p>
              </div>
           </div>
        </div>
        <div className="md:col-span-2">
           <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-14 flex items-center pointer-events-none">
                 <svg className="h-6 w-6 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
              <input 
                 type="text" 
                 className="block w-full pl-14 pr-4 py-5 border-none rounded-3xl bg-white dark:bg-[#1A1A1C] text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 shadow-apple dark:shadow-none transition-all text-lg font-medium" 
                 placeholder="Search rules (e.g. 'High Tackle', 'Scrum')..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>
      </div>
      <div>
         {!search && !activeCategory ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {RULES_DATA.map((cat, i) => (
                  <div 
                    key={i}
                    onClick={() => setActiveCategory(cat.category)}
                    className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 cursor-pointer hover:shadow-apple-hover hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 group flex flex-col h-full"
                  >
                     <div className={`w-14 h-14 ${cat.color} bg-opacity-10 dark:bg-opacity-20 text-3xl flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        {cat.icon}
                     </div>
                     <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.category}</h3>
                     <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{cat.description}</p>
                  </div>
               ))}
            </div>
         ) : (
            <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col min-h-[400px]">
               <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                  <div className="flex items-center space-x-4">
                     {activeCategory && activeCategoryData && (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${activeCategoryData.color} bg-opacity-10 dark:bg-opacity-20`}>
                           {activeCategoryData.icon}
                        </div>
                     )}
                     <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">
                        {activeCategory || `Search Results: "${search}"`}
                     </h3>
                  </div>
                  <button 
                     onClick={() => { setActiveCategory(null); setSearch(''); }}
                     className="text-sm font-bold text-gray-500 hover:text-slate-900 dark:hover:text-white flex items-center px-4 py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                     <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     Back
                  </button>
               </div>
               <div className="p-6 md:p-8">
                  {displayRules.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayRules.map((rule, idx) => (
                           <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-2">{rule.title}</h4>
                                <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">{rule.content}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <p className="font-medium">No rules found.</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

const MatchDayManagerView = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const progress = Math.round((checkedItems.size / SAFETY_CHECKLIST.length) * 100);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 text-white dark:text-slate-900 shadow-xl relative overflow-hidden">
           <div className="flex items-center justify-between relative z-10">
              <div>
                 <h2 className="text-3xl font-heading font-black tracking-tight mb-1">Pre-Game Command</h2>
                 <p className="text-sm opacity-70 font-medium uppercase tracking-widest">Logistics & Safety Checks</p>
              </div>
              <div className="text-4xl font-black">{progress}%</div>
           </div>
        </div>
        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
           <div className="divide-y divide-gray-100 dark:divide-white/5">
              {SAFETY_CHECKLIST.map(item => {
                 const isChecked = checkedItems.has(item.id);
                 return (
                    <div 
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`flex items-center p-6 cursor-pointer transition-all duration-200 group ${isChecked ? 'bg-gray-50/50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mr-5 shadow-sm ${isChecked ? 'bg-green-100 dark:bg-green-900/20' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5'}`}>
                          {item.icon}
                       </div>
                       <div className="flex-1">
                          <h4 className={`font-bold text-lg ${isChecked ? 'text-gray-500 line-through' : 'text-slate-900 dark:text-white'}`}>{item.label}</h4>
                          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium mt-0.5">{item.sub}</p>
                       </div>
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-200 dark:border-white/20'}`}>
                          {isChecked && <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </div>
      <div className="xl:col-span-1 space-y-6">
         <div className="bg-[#E02020] rounded-3xl p-8 text-white shadow-lg relative overflow-hidden group">
            <h3 className="font-heading font-black text-2xl mb-1">CRT 6</h3>
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6 opacity-80">Concussion Protocol</p>
            <div className="space-y-4">
               <div className="bg-black/20 rounded-xl p-4">
                  <span className="block text-[10px] font-bold uppercase mb-1">Red Flags</span>
                  <p className="text-sm font-bold">Immediate removal if suspected. Neck pain, seizures, or vomiting.</p>
               </div>
               <div className="bg-white text-red-600 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-bold">If in doubt, sit them out. No return to play today.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- MAIN HUB COMPONENT ---

interface LeagueHubViewProps {
  playbook: PlaybookItem[];
  onAddPlaybookItem: (item: Omit<PlaybookItem, 'id'>) => void;
  onDeletePlaybookItem: (id: string) => void;
}

export const LeagueHubView: React.FC<LeagueHubViewProps> = ({ 
  playbook, 
  onAddPlaybookItem, 
  onDeletePlaybookItem 
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'planner' | 'playbook' | 'manual' | 'rules' | 'matchday'>('library');
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sessionBlocks, setSessionBlocks] = useState<PlanBlock[]>([]);
  const [sessionTitle, setSessionTitle] = useState('New Training Session');
  
  // PLAYBOOK WIZARD STATE
  const [isCreating, setIsCreating] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newPlayTitle, setNewPlayTitle] = useState('');
  const [newPlayCategory, setNewPlayCategory] = useState<DrillCategory>('Attack');
  const [newPlayDifficulty, setNewPlayDifficulty] = useState<DrillDifficulty>('Intermediate');
  const [newPlayData, setNewPlayData] = useState('');
  const [newCoachingPoints, setNewCoachingPoints] = useState<string[]>(['']);

  const filteredDrills = useMemo(() => {
    return DRILL_LIBRARY.filter(d => {
      const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  const categories = ['All', 'Attack', 'Defence', 'Fitness', 'Core Skills', 'Kicking'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Attack': return 'bg-blue-600';
      case 'Defence': return 'bg-red-600';
      case 'Fitness': return 'bg-purple-600';
      case 'Core Skills': return 'bg-emerald-600';
      case 'Kicking': return 'bg-amber-500';
      default: return 'bg-slate-900';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Beginner': return 'bg-green-600 text-white';
      case 'Intermediate': return 'bg-amber-500 text-white';
      case 'Advanced': return 'bg-red-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleSavePlay = () => {
    if (!newPlayTitle.trim()) return;
    onAddPlaybookItem({
      title: newPlayTitle,
      type: 'Move',
      content: JSON.stringify({
          title: newPlayTitle,
          category: newPlayCategory,
          difficulty: newPlayDifficulty,
          visualData: newPlayData || JSON.stringify({ pitchType: 'half', frames: [{ id: '1', tokens: [] }] }),
          coachingPoints: newCoachingPoints.filter(p => p.trim() !== '')
      }),
      createdAt: Date.now()
    });
    resetWizard();
  };

  const resetWizard = () => {
    setIsCreating(false);
    setWizardStep(1);
    setNewPlayTitle('');
    setNewPlayCategory('Attack');
    setNewPlayDifficulty('Intermediate');
    setNewPlayData('');
    setNewCoachingPoints(['']);
  };

  const handlePointChange = (index: number, value: string) => {
    const updated = [...newCoachingPoints];
    updated[index] = value;
    setNewCoachingPoints(updated);
  };

  const handlePointKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const updated = [...newCoachingPoints];
      updated.splice(index + 1, 0, '');
      setNewCoachingPoints(updated);
      // Timeout to focus next input would be ideal here but sticking to simple management
    } else if (e.key === 'Backspace' && newCoachingPoints[index] === '' && newCoachingPoints.length > 1) {
      e.preventDefault();
      const updated = [...newCoachingPoints];
      updated.splice(index, 1);
      setNewCoachingPoints(updated);
    }
  };

  const addToPlan = (drill: Drill) => {
    setSessionBlocks([...sessionBlocks, {
      id: Date.now().toString(),
      type: 'drill',
      title: drill.title,
      durationMin: drill.durationMin,
      drillId: drill.id
    }]);
  };

  const totalDuration = sessionBlocks.reduce((acc, b) => acc + b.durationMin, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative min-h-[600px]">
      {/* Tab Navigation - Optimized for Mobile Scrolling */}
      <div className="relative">
        <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar pb-px">
          {[
            { id: 'library', label: 'Drill Library' },
            { id: 'planner', label: 'Session Planner' },
            { id: 'playbook', label: 'My Playbook' },
            { id: 'rules', label: "Ref's Corner" },
            { id: 'matchday', label: 'Match Day Manager' },
            { id: 'manual', label: 'Coach Manual' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); resetWizard(); }}
              className={`py-4 px-6 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F5F5F7] dark:from-[#0F0F10] to-transparent pointer-events-none md:hidden"></div>
      </div>

      {/* CONTENT */}
      {activeTab === 'manual' && <CoachManualView />}
      {activeTab === 'rules' && <RefCornerView />}
      {activeTab === 'matchday' && <MatchDayManagerView />}

      {activeTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-[#1A1A1C] p-8 rounded-3xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 sticky top-24">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Current Plan</h3>
                       <input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className="bg-transparent text-sm text-gray-500 dark:text-gray-400 border-none p-0 focus:ring-0 w-full font-bold mt-1" />
                    </div>
                    <div className="text-right">
                       <span className={`text-4xl font-black ${totalDuration > 60 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{totalDuration}</span>
                       <span className="block text-[10px] uppercase font-bold text-gray-400">Mins</span>
                    </div>
                 </div>
                 {sessionBlocks.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                       <p className="text-gray-400 text-sm font-medium">Add drills to your session.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {sessionBlocks.map((block, i) => (
                          <div key={block.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center group">
                             <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black mr-3 shadow-sm">{i + 1}</div>
                                <div className="min-w-0">
                                   <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{block.title}</h4>
                                   <span className="text-xs text-gray-400 font-bold">{block.durationMin}m</span>
                                </div>
                             </div>
                             <button onClick={() => setSessionBlocks(sessionBlocks.filter(b => b.id !== block.id))} className="text-gray-400 hover:text-red-500 p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                       ))}
                    </div>
                 )}
                 <div className="mt-8 grid grid-cols-2 gap-4">
                    <Button variant="secondary" onClick={() => setSessionBlocks([...sessionBlocks, { id: Date.now().toString(), type: 'custom', title: 'Break', durationMin: 5 }])}>Add Break</Button>
                    <Button onClick={() => alert('Plan Saved!')} disabled={sessionBlocks.length === 0}>Save Plan</Button>
                 </div>
              </div>
           </div>
           <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {DRILL_LIBRARY.map(drill => (
                    <div key={drill.id} className="bg-white dark:bg-[#1A1A1C] p-6 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-blue-500 transition-colors flex flex-col justify-between">
                       <div>
                          <div className="flex justify-between items-start mb-4">
                             <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${drill.category === 'Defence' ? 'bg-red-600' : getCategoryColor(drill.category)} text-white`}>{drill.category}</span>
                             <span className="text-xs font-black text-gray-400 uppercase">{drill.durationMin}m</span>
                          </div>
                          <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2">{drill.title}</h4>
                          <p className="text-sm text-slate-700 dark:text-gray-400 line-clamp-2">{drill.description}</p>
                       </div>
                       <Button onClick={() => addToPlan(drill)} variant="secondary" className="mt-6 w-full text-xs font-bold uppercase tracking-widest py-3">+ Add to Session</Button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative w-full md:flex-1">
                 <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
                 <input 
                    type="text" 
                    className="block w-full pl-14 pr-12 py-3 bg-white dark:bg-[#1A1A1C] border border-gray-100 dark:border-white/5 rounded-2xl text-lg font-medium shadow-apple dark:shadow-none focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-400" 
                    placeholder="Search drills..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 md:pb-0">
                 {categories.map(cat => {
                    const color = getCategoryColor(cat);
                    const isActive = filterCategory === cat;
                    const colorClass = color.replace('bg-', '');
                    
                    return (
                       <button 
                         key={cat}
                         onClick={() => setFilterCategory(cat)}
                         className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border min-w-[90px] flex items-center justify-center ${
                           isActive 
                             ? `${color} text-white border-transparent shadow-lg scale-105` 
                             : `bg-${colorClass}/5 text-${colorClass} border-${colorClass}/20 hover:bg-${colorClass}/10`
                         }`}
                       >
                         {cat}
                       </button>
                    );
                 })}
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             {filteredDrills.map(drill => (
                <div 
                  key={drill.id} 
                  onClick={() => setSelectedDrill(drill)}
                  className="bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 hover:shadow-apple-hover transition-all duration-300 cursor-pointer group overflow-hidden active:scale-[0.98]"
                >
                   <div className={`h-1 w-full ${getCategoryColor(drill.category)}`}></div>
                   <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                         <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${getCategoryColor(drill.category)} text-white`}>
                           {drill.category}
                         </span>
                         <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${getDifficultyColor(drill.difficulty)}`}>
                           {drill.difficulty}
                         </span>
                      </div>
                      <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors line-clamp-1">{drill.title}</h4>
                      <p className="text-sm text-slate-700 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed flex-1 font-medium">{drill.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                         <div className="flex items-center space-x-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {drill.durationMin}m
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                              {drill.minPlayers}+
                            </span>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-300">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                         </div>
                      </div>
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'playbook' && (
        <div className="space-y-6">
           {!isCreating ? (
              <>
                 {playbook.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white dark:bg-[#1A1A1C] rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-white/5">
                        <div className="w-32 h-32 bg-[#2d6a36]/10 rounded-full flex items-center justify-center relative">
                           <div className="absolute inset-4 border border-white/20 rounded-full border-dashed"></div>
                           <span className="text-4xl">📋</span>
                        </div>
                        <div className="text-center">
                           <h3 className="text-2xl font-heading font-black text-slate-900 dark:text-white mb-2">Your Playbook is Empty</h3>
                           <p className="text-slate-500 dark:text-gray-400 font-medium">Start designing unique match moves and training drills.</p>
                        </div>
                        <Button 
                          onClick={() => setIsCreating(true)} 
                          className="px-10 py-4 bg-[#E02020] hover:bg-red-700 text-white rounded-2xl shadow-xl hover:scale-105 transition-all text-lg font-black uppercase tracking-widest"
                        >
                          + Create Your First Play
                        </Button>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {playbook.map(play => {
                           const playData = JSON.parse(play.content);
                           return (
                              <div key={play.id} className="bg-white dark:bg-[#1A1A1C] rounded-3xl overflow-hidden shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 group hover:shadow-apple-hover transition-all duration-300">
                                 <div className="h-40 bg-slate-900 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-40 scale-50 origin-top-left w-[200%] h-[200%] pointer-events-none">
                                       <TacticsBoard initialData={playData.visualData} isReadOnly={true} />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4">
                                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${getCategoryColor(playData.category)} text-white`}>{playData.category}</span>
                                    </div>
                                 </div>
                                 <div className="p-6">
                                    <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-1">{play.title}</h4>
                                    <p className="text-xs text-gray-500 font-medium mb-4">{new Date(play.createdAt).toLocaleDateString()}</p>
                                    <div className="flex justify-end space-x-2">
                                       <button onClick={() => onDeletePlaybookItem(play.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                       <Button variant="secondary" className="text-[10px] py-1 px-3">View Details</Button>
                                    </div>
                                 </div>
                              </div>
                           );
                       })}
                    </div>
                 )}
                 
                 {/* Mobile FAB */}
                 <button 
                    onClick={() => setIsCreating(true)}
                    className="fixed bottom-6 right-6 w-16 h-16 bg-[#E02020] text-white rounded-full shadow-2xl flex items-center justify-center text-3xl font-black active:scale-90 transition-all z-[60] sm:hidden"
                 >
                    +
                 </button>
              </>
           ) : (
              /* WIZARD STEP-BY-STEP */
              <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
                 {/* Wizard Header */}
                 <div className="flex items-center justify-between">
                    <div>
                       <h3 className="text-3xl font-heading font-black text-slate-900 dark:text-white">Create New Play</h3>
                       <div className="flex items-center space-x-2 mt-2">
                          {[1, 2, 3].map(step => (
                             <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${wizardStep === step ? 'w-10 bg-red-600' : 'w-4 bg-gray-200 dark:bg-white/10'}`}></div>
                          ))}
                       </div>
                    </div>
                    <button onClick={resetWizard} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest">Cancel</button>
                 </div>

                 {/* Step 1: Metadata */}
                 {wizardStep === 1 && (
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Play Title</label>
                          <input 
                            type="text" 
                            autoFocus
                            value={newPlayTitle}
                            onChange={(e) => setNewPlayTitle(e.target.value)}
                            className="w-full bg-transparent border-b-2 border-gray-200 dark:border-white/10 focus:border-red-600 outline-none py-4 text-3xl font-heading font-bold text-slate-900 dark:text-white transition-all placeholder-gray-300"
                            placeholder="Name your play..."
                          />
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-xs font-black uppercase tracking-widest text-gray-400">Select Category</label>
                             <div className="grid grid-cols-2 gap-3">
                                {['Attack', 'Defence', 'Fitness', 'Core Skills', 'Kicking'].map(cat => {
                                   const color = getCategoryColor(cat);
                                   const isActive = newPlayCategory === cat;
                                   return (
                                      <button 
                                        key={cat} 
                                        onClick={() => setNewPlayCategory(cat as any)}
                                        className={`p-4 rounded-2xl border-2 text-sm font-black uppercase tracking-wide transition-all ${isActive ? `${color} text-white border-transparent shadow-lg scale-105` : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/5 hover:border-gray-200'}`}
                                      >
                                         {cat}
                                      </button>
                                   );
                                })}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-xs font-black uppercase tracking-widest text-gray-400">Select Difficulty</label>
                             <div className="flex flex-col space-y-3">
                                {['Beginner', 'Intermediate', 'Advanced'].map(diff => {
                                   const color = getDifficultyColor(diff);
                                   const isActive = newPlayDifficulty === diff;
                                   return (
                                      <button 
                                        key={diff} 
                                        onClick={() => setNewPlayDifficulty(diff as any)}
                                        className={`p-4 rounded-2xl border-2 text-sm font-black uppercase tracking-wide transition-all flex items-center justify-between ${isActive ? `${color} border-transparent shadow-lg scale-102` : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/5 hover:border-gray-200'}`}
                                      >
                                         {diff}
                                         {isActive && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                      </button>
                                   );
                                })}
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex justify-end pt-8">
                          <Button disabled={!newPlayTitle.trim()} onClick={() => setWizardStep(2)} className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Next Step: The Board</Button>
                       </div>
                    </div>
                 )}

                 {/* Step 2: Visuals */}
                 {wizardStep === 2 && (
                    <div className="space-y-6">
                       <div className="p-1 bg-gray-50 dark:bg-white/5 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 h-[500px]">
                          <TacticsBoard onSave={(data) => setNewPlayData(data)} />
                       </div>
                       <div className="flex justify-between items-center">
                          <Button variant="secondary" onClick={() => setWizardStep(1)}>Back to Basics</Button>
                          <Button onClick={() => setWizardStep(3)} className="px-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Final Step: Notes</Button>
                       </div>
                    </div>
                 )}

                 {/* Step 3: Coaching Points */}
                 {wizardStep === 3 && (
                    <div className="space-y-8">
                       <div className="bg-white dark:bg-[#1A1A1C] p-8 rounded-[2rem] shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-6">Coaching Points (Bulleted List)</label>
                          <div className="space-y-4">
                             {newCoachingPoints.map((point, idx) => (
                                <div key={idx} className="flex items-center group">
                                   <div className="w-8 h-8 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center text-sm font-black mr-4 shrink-0">•</div>
                                   <input 
                                     autoFocus={idx === newCoachingPoints.length - 1}
                                     type="text"
                                     value={point}
                                     onChange={(e) => handlePointChange(idx, e.target.value)}
                                     onKeyDown={(e) => handlePointKeyDown(e, idx)}
                                     className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 dark:text-white font-bold text-lg placeholder-gray-300"
                                     placeholder="Type a point and hit Enter..."
                                   />
                                   <button 
                                      onClick={() => {
                                        const updated = [...newCoachingPoints];
                                        updated.splice(idx, 1);
                                        setNewCoachingPoints(updated.length ? updated : ['']);
                                      }}
                                      className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                   >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                   </button>
                                </div>
                             ))}
                          </div>
                          <button 
                            onClick={() => setNewCoachingPoints([...newCoachingPoints, ''])}
                            className="mt-6 text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-widest pl-12"
                          >
                             + Add Another Point
                          </button>
                       </div>

                       <div className="flex justify-between items-center">
                          <Button variant="secondary" onClick={() => setWizardStep(2)}>Back to Board</Button>
                          <Button onClick={handleSavePlay} className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/20">Finish & Save Play</Button>
                       </div>
                    </div>
                 )}
              </div>
           )}
        </div>
      )}

      {/* Drill Detail Modal Integration Placeholder */}
      {selectedDrill && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedDrill(null)} />
            <div className="relative bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 shrink-0">
                  <h2 className="text-2xl font-heading font-black text-slate-900 dark:text-white">{selectedDrill.title}</h2>
                  <button onClick={() => setSelectedDrill(null)} className="text-gray-400 hover:text-slate-900 dark:hover:text-white p-2">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  <div className="flex-1 bg-gray-900 dark:bg-black/40 flex items-center justify-center p-4 lg:p-12 relative overflow-hidden">
                       {selectedDrill.visualData && (
                           <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
                              <TacticsBoard initialData={selectedDrill.visualData} isReadOnly={true} />
                           </div>
                       )}
                  </div>
                  <div className="w-full lg:w-[400px] overflow-y-auto bg-white dark:bg-[#1A1A1C] border-l border-gray-100 dark:border-white/5 p-8 flex flex-col shrink-0">
                       <div className="space-y-8">
                          <div className={`p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10`}>
                             <h3 className="font-black text-blue-800 dark:text-blue-300 mb-4 text-sm uppercase tracking-widest flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Coaching Points
                             </h3>
                             <ul className="space-y-3">
                                {selectedDrill.coachingPoints.map((pt, i) => (
                                   <li key={i} className="flex items-start text-sm text-blue-900 dark:text-blue-100 font-bold">
                                      <span className="mr-2 text-blue-500">•</span>{pt}
                                   </li>
                                ))}
                             </ul>
                          </div>
                          <div>
                             <h3 className="font-black text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-widest">Setup & Steps</h3>
                             <div className="space-y-6">
                                {selectedDrill.steps.map((step, i) => (
                                   <div key={i} className="flex">
                                      <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-black mr-4 shrink-0 shadow-sm">{i + 1}</div>
                                      <p className="text-sm text-slate-700 dark:text-gray-300 font-medium leading-relaxed">{step}</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};