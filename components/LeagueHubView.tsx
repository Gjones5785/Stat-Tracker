
import React, { useState } from 'react';
import { Drill, DrillCategory, PlaybookItem } from '../types';
import { Button } from './Button';
import { TacticsBoard } from './TacticsBoard';
import { ConfirmationModal } from './ConfirmationModal';
import { CoachManualView } from './CoachManualView';

// --- MOCK DATA FOR LIBRARY ---
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
            {id: "d1", type: "defender", x: 45, y: 50, label: "A"},
            {id: "d2", type: "defender", x: 55, "y": 50, label: "B"},
            {id: "a1", type: "attacker", x: 35, y: 50, label: "1"},
            {id: "a2", type: "attacker", x: 50, y: 50, label: "2"},
            {id: "a3", type: "attacker", x: 65, y: 50, label: "3"},
            {id: "b1", type: "ball", x: 52, y: 52}
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
    title: 'Inside Shoulder Defense',
    category: 'Defense',
    difficulty: 'Beginner',
    durationMin: 20,
    minPlayers: 6,
    description: 'Working in pods to improve line speed and contact placement.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "d1", type: "defender", x: 40, y: 60, label: "A"},
          {id: "d2", type: "defender", x: 50, y: 60, label: "B"},
          {id: "d3", type: "defender", x: 60, y: 60, label: "C"},
          {id: "p1", type: "pad", x: 40, y: 40},
          {id: "p2", type: "pad", x: 50, y: 40},
          {id: "p3", type: "pad", x: 60, y: 40}
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
          {id: "d1", type: "defender", x: 48, y: 45, label: "M"},
          {id: "d2", type: "defender", x: 52, y: 45, label: "M"},
          {id: "a1", type: "attacker", x: 50, y: 50, label: "BC"},
          {id: "b1", type: "ball", x: 50, y: 52},
          {id: "dh", type: "attacker", x: 50, y: 60, label: "DH"}
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
  },
  {
    id: 'd5',
    title: 'Grubber Accuracy',
    category: 'Kicking',
    difficulty: 'Intermediate',
    durationMin: 10,
    minPlayers: 2,
    description: 'Kicking into a small target box behind the defensive line.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "k1", type: "attacker", x: 50, y: 70, label: "7"},
          {id: "b1", type: "ball", x: 50, y: 68},
          {id: "c1", type: "cone", x: 45, y: 20},
          {id: "c2", type: "cone", x: 55, y: 20},
          {id: "c3", type: "cone", x: 45, y: 30},
          {id: "c4", type: "cone", x: 55, y: 30},
          {id: "ch", type: "attacker", x: 30, y: 70, label: "C"}
        ]
      }]
    }),
    steps: [
        'Mark a 2m x 2m box 10m away.',
        'Halfback approaches line and drops ball to foot.',
        'Kick must land or stop inside the box.',
        'Chaser sprints to ground the ball.'
    ],
    coachingPoints: [
        'Head over the ball',
        'Strike the top half of the ball for end-over-end',
        'Weight of the kick is crucial'
    ],
    tags: ['Short Kicking', 'Halves']
  },
  {
    id: 'd6',
    title: 'Red Zone Goal Line D',
    category: 'Defense',
    difficulty: 'Advanced',
    durationMin: 20,
    minPlayers: 13,
    description: 'Full width defensive line sliding to prevent tries on the goal line.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "d1", type: "defender", x: 10, y: 15, label: "W"},
          {id: "d2", type: "defender", x: 20, y: 15, label: "C"},
          {id: "d3", type: "defender", x: 30, y: 15, label: "3"},
          {id: "d4", type: "defender", x: 40, y: 15, label: "Pr"},
          {id: "d5", type: "defender", x: 50, y: 15, label: "H"},
          {id: "d6", type: "defender", x: 60, y: 15, label: "Pr"},
          {id: "d7", type: "defender", x: 70, y: 15, label: "3"},
          {id: "d8", type: "defender", x: 80, y: 15, label: "C"},
          {id: "d9", type: "defender", x: 90, y: 15, label: "W"},
          {id: "a1", type: "attacker", x: 30, y: 40, label: "Atk"},
          {id: "a2", type: "attacker", x: 50, y: 40, label: "Atk"},
          {id: "a3", type: "attacker", x: 70, y: 40, label: "Atk"},
          {id: "b1", type: "ball", x: 50, y: 38}
        ]
      }]
    }),
    steps: [
        'Attackers run waves at the goal line.',
        'Defenders must slide and fill gaps.',
        'Communication from the inside out.',
        'First movement is off the line, then lateral.'
    ],
    coachingPoints: [
        'Trust the inside man',
        'Do not over-chase',
        'Win the collision on the line'
    ],
    tags: ['Team', 'Structure']
  },
  {
    id: 'd7',
    title: '2v1 Channel Drill',
    category: 'Core Skills',
    difficulty: 'Beginner',
    durationMin: 10,
    minPlayers: 3,
    description: 'Fundamental draw and pass practice in a narrow channel to isolate a defender.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "d1", type: "defender", x: 50, y: 40, label: "D"},
          {id: "a1", type: "attacker", x: 45, y: 70, label: "BC"},
          {id: "a2", type: "attacker", x: 55, y: 75, label: "S"},
          {id: "b1", type: "ball", x: 45, y: 72}
        ]
      }, {
        id: "f2",
        tokens: [
           {id: "d1", type: "defender", x: 48, y: 60, label: "D"},
           {id: "a1", type: "attacker", x: 48, y: 62, label: "BC"},
           {id: "a2", type: "attacker", x: 55, y: 60, label: "S"},
           {id: "b1", type: "ball", x: 52, y: 61}
        ]
      }]
    }),
    steps: [
        'Set up a 5m wide channel.',
        '1 Defender in the middle, 2 Attackers approaching.',
        'Ball carrier runs at the inside shoulder of the defender.',
        'Support runner holds depth and width.',
        'Execute pass before contact.'
    ],
    coachingPoints: [
        'Engage the defender fully',
        'Pass across the face, not at the player',
        'Support player must call for the ball'
    ],
    tags: ['Passing', 'Decision Making']
  },
  {
    id: 'd8',
    title: 'Marker Splitting',
    category: 'Attack',
    difficulty: 'Intermediate',
    durationMin: 15,
    minPlayers: 4,
    description: 'Dummy half work to exploit lazy markers around the ruck.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "m1", type: "defender", x: 45, y: 50, label: "M1"},
          {id: "m2", type: "defender", x: 55, y: 48, label: "M2"},
          {id: "ptb", type: "attacker", x: 50, y: 55, label: "PTB"},
          {id: "dh", type: "attacker", x: 50, y: 60, label: "DH"},
          {id: "b1", type: "ball", x: 50, y: 58}
        ]
      }]
    }),
    steps: [
        'Play the ball with two markers not square (staggered).',
        'Dummy half scoops and runs at the gap.',
        'If M1 overchases, step inside.',
        'If M2 stays wide, run through the middle.'
    ],
    coachingPoints: [
        'Explosive speed from zero',
        'Scan markers before picking up',
        'Low body height'
    ],
    tags: ['Hooker', 'Ruck', 'Individual Skill']
  },
  {
    id: 'd9',
    title: 'Defensive Pendulum',
    category: 'Defense',
    difficulty: 'Advanced',
    durationMin: 20,
    minPlayers: 3,
    description: 'Back three positioning drill to ensure field coverage against kicks.',
    visualData: JSON.stringify({
      pitchType: "full",
      frames: [{
        id: "f1",
        tokens: [
          {id: "fb", type: "defender", x: 50, y: 80, label: "FB"},
          {id: "lw", type: "defender", x: 20, y: 60, label: "LW"},
          {id: "rw", type: "defender", x: 80, y: 60, label: "RW"},
          {id: "k", type: "attacker", x: 80, y: 20, label: "K"},
          {id: "b", type: "ball", x: 80, y: 22}
        ]
      }, {
        id: "f2",
        tokens: [
          {id: "fb", type: "defender", x: 70, y: 70, label: "FB"},
          {id: "lw", type: "defender", x: 40, y: 80, label: "LW"},
          {id: "rw", type: "defender", x: 80, y: 50, label: "RW"},
          {id: "k", type: "attacker", x: 80, y: 20, label: "K"},
          {id: "b", type: "ball", x: 80, y: 60}
        ]
      }]
    }),
    steps: [
        'Coach/Kicker stands on one side of the field.',
        'As kicker shapes to kick, Winger drops back.',
        'Fullback slides across to cover.',
        'Opposite Winger swings into Fullback position.',
        'Like a pendulum string.'
    ],
    coachingPoints: [
        'Communication is key ("I\'ve got back!")',
        'Move early, don\'t wait for the kick',
        'Never leave the backfield empty'
    ],
    tags: ['Positioning', 'Back 3', 'Tactical']
  },
  {
    id: 'd10',
    title: 'Bomb Defusal',
    category: 'Kicking',
    difficulty: 'Intermediate',
    durationMin: 15,
    minPlayers: 4,
    description: 'Practice catching high kicks under pressure from chasers.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "c", type: "defender", x: 50, y: 80, label: "C"},
          {id: "ch1", type: "attacker", x: 40, y: 40, label: "Ch"},
          {id: "ch2", type: "attacker", x: 60, y: 40, label: "Ch"},
          {id: "k", type: "attacker", x: 50, y: 20, label: "K"},
          {id: "b", type: "ball", x: 50, y: 50}
        ]
      }]
    }),
    steps: [
        'Kicker puts up a high bomb.',
        'Catcher must track ball flight.',
        '2 Chasers run down with tackle shields/pads.',
        'Catcher jumps or secures ball while absorbing contact.'
    ],
    coachingPoints: [
        'Eyes on the ball the whole way',
        'Turn body sideways to protect ribs',
        'Call "My Ball" loudly'
    ],
    tags: ['Catching', 'High Ball', 'Courage']
  }
];

interface LeagueHubViewProps {
  playbook?: PlaybookItem[];
  onAddPlaybookItem?: (item: Omit<PlaybookItem, 'id'>) => void;
  onDeletePlaybookItem?: (id: string) => void;
}

export const LeagueHubView: React.FC<LeagueHubViewProps> = ({
  playbook = [],
  onAddPlaybookItem = (item) => {},
  onDeletePlaybookItem = (id) => {}
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'playbook' | 'education'>('library');
  const [selectedCategory, setSelectedCategory] = useState<DrillCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isNewPlayModalOpen, setIsNewPlayModalOpen] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Playbook Item View State
  const [viewingPlaybookItem, setViewingPlaybookItem] = useState<PlaybookItem | null>(null);
  
  // New Play Form
  const [newPlayTitle, setNewPlayTitle] = useState('');
  const [newPlayContent, setNewPlayContent] = useState(''); // Holds Text OR JSON string
  const [newPlayType, setNewPlayType] = useState<'Move' | 'Drill' | 'Note'>('Move');

  // Filter Drills
  const filteredDrills = DRILL_LIBRARY.filter(drill => {
    const matchesCategory = selectedCategory === 'All' || drill.category === selectedCategory;
    const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          drill.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreatePlay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayTitle.trim()) return;

    onAddPlaybookItem({
      title: newPlayTitle,
      type: newPlayType,
      content: newPlayContent,
      createdAt: Date.now()
    });

    setIsNewPlayModalOpen(false);
    setNewPlayTitle('');
    setNewPlayContent('');
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeletePlaybookItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  // Helper to determine if content is JSON (Tactics Board) or Plain Text
  const isTacticsData = (content: string) => {
    return content.trim().startsWith('{');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 dark:bg-white rounded-3xl p-8 mb-8 relative overflow-hidden text-white dark:text-slate-900 shadow-xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
         
         <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight mb-2">LeagueHub<span className="text-red-500">.</span></h2>
            <p className="text-white/60 dark:text-slate-500 font-medium max-w-xl text-lg">
              Your digital coaching assistant. Browse verified drills, build your own playbook, or access the education manual.
            </p>
            
            <div className="flex space-x-2 md:space-x-4 mt-8 overflow-x-auto no-scrollbar">
               <button 
                  onClick={() => setActiveTab('library')}
                  className={`px-4 md:px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'library' ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-lg transform scale-105' : 'bg-white/10 text-white hover:bg-white/20 dark:bg-slate-900/10 dark:text-slate-900'}`}
               >
                  Drill Library
               </button>
               <button 
                  onClick={() => setActiveTab('playbook')}
                  className={`px-4 md:px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'playbook' ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-lg transform scale-105' : 'bg-white/10 text-white hover:bg-white/20 dark:bg-slate-900/10 dark:text-slate-900'}`}
               >
                  My Playbook
               </button>
               <button 
                  onClick={() => setActiveTab('education')}
                  className={`px-4 md:px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'education' ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-lg transform scale-105' : 'bg-white/10 text-white hover:bg-white/20 dark:bg-slate-900/10 dark:text-slate-900'}`}
               >
                  Coach Education
               </button>
            </div>
         </div>
      </div>

      {/* --- EDUCATION TAB --- */}
      {activeTab === 'education' && (
        <CoachManualView />
      )}

      {/* --- LIBRARY TAB --- */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar w-full md:w-auto">
                {(['All', 'Attack', 'Defense', 'Fitness', 'Core Skills', 'Kicking'] as const).map(cat => (
                   <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                   >
                      {cat}
                   </button>
                ))}
             </div>
             <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Search drills..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredDrills.map(drill => (
                <div 
                  key={drill.id} 
                  onClick={() => setSelectedDrill(drill)}
                  className="group bg-white dark:bg-[#1A1A1C] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden hover:shadow-apple-hover transition-all duration-300 flex flex-col h-full cursor-pointer hover:border-blue-500/30 hover:-translate-y-1"
                >
                   {/* Card Header Color Stripe */}
                   <div className={`h-2 w-full ${
                      drill.category === 'Attack' ? 'bg-blue-500' :
                      drill.category === 'Defense' ? 'bg-red-500' :
                      drill.category === 'Fitness' ? 'bg-amber-500' :
                      'bg-purple-500'
                   }`}></div>
                   
                   <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                         <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                            drill.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                            drill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                         }`}>
                           {drill.difficulty}
                         </span>
                         <span className="text-xs font-bold text-gray-400 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {drill.durationMin}m
                         </span>
                      </div>

                      <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                         {drill.title}
                      </h3>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">
                         {drill.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-2">
                         {drill.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded">
                               #{tag}
                            </span>
                         ))}
                      </div>
                   </div>
                </div>
             ))}
             {filteredDrills.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                   <p>No drills found matching your criteria.</p>
                </div>
             )}
          </div>
        </div>
      )}

      {/* --- PLAYBOOK TAB --- */}
      {activeTab === 'playbook' && (
         <div className="space-y-8">
            <div className="flex justify-between items-center">
               <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Saved Plays</h3>
                  <p className="text-sm text-gray-500">Private notes and diagrams for your team.</p>
               </div>
               <Button onClick={() => setIsNewPlayModalOpen(true)} className="bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg hover:shadow-xl">
                  + New Item
               </Button>
            </div>

            {playbook.length === 0 ? (
               <div className="bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mb-4 text-gray-400">
                     <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your playbook is empty</h4>
                  <p className="text-gray-500 max-w-sm mb-6">Start building your library of set moves, custom drills, and tactical notes.</p>
                  <Button variant="secondary" onClick={() => setIsNewPlayModalOpen(true)}>Create First Play</Button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {playbook.map(item => (
                     <div key={item.id} onClick={() => setViewingPlaybookItem(item)} className="group bg-white dark:bg-[#1A1A1C] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:border-blue-500/50 transition-all relative cursor-pointer">
                        <div className="flex justify-between items-start mb-3">
                           <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block ${
                              item.type === 'Move' ? 'bg-purple-100 text-purple-700' :
                              item.type === 'Drill' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                           }`}>
                              {item.type}
                           </span>
                           <div className="flex items-center space-x-2">
                             <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation();
                                 setItemToDelete(item.id);
                               }}
                               className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-2 rounded-lg"
                               title="Delete Item"
                             >
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                           </div>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                        
                        {isTacticsData(item.content) ? (
                           <div className="w-full h-24 bg-green-700 rounded-lg opacity-80 flex items-center justify-center border-2 border-white/20">
                              <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                Interactive Board
                              </span>
                           </div>
                        ) : (
                           <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap line-clamp-3">{item.content}</p>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </div>
      )}

      {/* NEW PLAY MODAL */}
      {isNewPlayModalOpen && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewPlayModalOpen(false)} />
            <div className={`relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl w-full p-6 animate-in zoom-in-95 flex flex-col ${newPlayType !== 'Note' ? 'max-w-4xl h-[90vh]' : 'max-w-md'}`}>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Playbook Item</h3>
                  <button onClick={() => setIsNewPlayModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
               </div>
               
               <form onSubmit={handleCreatePlay} className="flex-1 flex flex-col space-y-4 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Title</label>
                        <input 
                           type="text" 
                           required 
                           value={newPlayTitle}
                           onChange={e => setNewPlayTitle(e.target.value)}
                           className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                           placeholder="e.g. Block Play Left"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Type</label>
                        <div className="flex space-x-2">
                           {(['Move', 'Drill', 'Note'] as const).map(t => (
                              <button
                                 key={t}
                                 type="button"
                                 onClick={() => setNewPlayType(t)}
                                 className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${newPlayType === t ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                              >
                                 {t}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                     <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Content</label>
                     
                     {newPlayType === 'Note' ? (
                        <textarea 
                           required 
                           value={newPlayContent}
                           onChange={e => setNewPlayContent(e.target.value)}
                           className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white h-32 resize-none"
                           placeholder="Type your notes here..."
                        />
                     ) : (
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col">
                           <TacticsBoard 
                              onSave={(jsonString) => setNewPlayContent(jsonString)} 
                           />
                        </div>
                     )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 shrink-0">
                     <Button variant="secondary" onClick={() => setIsNewPlayModalOpen(false)}>Cancel</Button>
                     <Button type="submit" className="bg-slate-900 dark:bg-white dark:text-slate-900">Save Item</Button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* VIEW PLAYBOOK ITEM MODAL */}
      {viewingPlaybookItem && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingPlaybookItem(null)} />
            <div className={`relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl w-full p-6 animate-in zoom-in-95 flex flex-col ${isTacticsData(viewingPlaybookItem.content) ? 'max-w-4xl h-[85vh]' : 'max-w-lg'}`}>
               <div className="flex justify-between items-start mb-4">
                  <div>
                     <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2 inline-block ${
                        viewingPlaybookItem.type === 'Move' ? 'bg-purple-100 text-purple-700' :
                        viewingPlaybookItem.type === 'Drill' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                     }`}>
                        {viewingPlaybookItem.type}
                     </span>
                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingPlaybookItem.title}</h3>
                  </div>
                  <button onClick={() => setViewingPlaybookItem(null)} className="bg-gray-100 dark:bg-white/10 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-500 transition-colors">✕</button>
               </div>

               <div className="flex-1 overflow-auto">
                  {isTacticsData(viewingPlaybookItem.content) ? (
                     <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A1C] h-full flex flex-col">
                        <TacticsBoard key={viewingPlaybookItem.id} initialData={viewingPlaybookItem.content} isReadOnly={true} />
                     </div>
                  ) : (
                     <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{viewingPlaybookItem.content}</p>
                  )}
               </div>
               
               <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 text-right">
                  <Button onClick={() => setViewingPlaybookItem(null)}>Close</Button>
               </div>
            </div>
         </div>
      )}

      {/* DRILL DETAIL MODAL (Existing) */}
      {selectedDrill && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDrill(null)} />
            <div className="relative bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
               <div className={`p-6 ${
                   selectedDrill.category === 'Attack' ? 'bg-blue-600' :
                   selectedDrill.category === 'Defense' ? 'bg-red-600' :
                   selectedDrill.category === 'Fitness' ? 'bg-amber-500' :
                   selectedDrill.category === 'Core Skills' ? 'bg-green-600' :
                   selectedDrill.category === 'Kicking' ? 'bg-teal-600' :
                   'bg-purple-600'
               } text-white shrink-0`}>
                  <div className="flex justify-between items-start">
                     <div>
                        <div className="flex space-x-2 mb-2">
                           <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{selectedDrill.category}</span>
                           <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{selectedDrill.difficulty}</span>
                        </div>
                        <h2 className="text-3xl font-heading font-bold">{selectedDrill.title}</h2>
                     </div>
                     <button onClick={() => setSelectedDrill(null)} className="bg-white/10 hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-white transition-colors">✕</button>
                  </div>
               </div>
               
               <div className="p-8 overflow-y-auto">
                  
                  {/* VISUAL DIAGRAM */}
                  {selectedDrill.visualData && (
                     <div className="w-full mb-8">
                        <TacticsBoard key={selectedDrill.id} initialData={selectedDrill.visualData} isReadOnly={true} />
                     </div>
                  )}

                  <div className="prose dark:prose-invert max-w-none">
                     <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-8">{selectedDrill.description}</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                           <h4 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-wider">Setup & Steps</h4>
                           <ul className="space-y-3">
                              {(selectedDrill.steps || []).map((step, i) => (
                                 <li key={i} className="flex items-start">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center mr-3 mt-0.5">{i+1}</span>
                                    <span className="text-slate-700 dark:text-gray-200 text-sm">{step}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                        <div>
                           <h4 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-wider">Coaching Points</h4>
                           <ul className="space-y-3">
                              {(selectedDrill.coachingPoints || []).map((point, i) => (
                                 <li key={i} className="flex items-start">
                                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span className="text-slate-700 dark:text-gray-200 text-sm">{point}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>

                     <div className="border-t border-gray-100 dark:border-white/5 pt-6 flex justify-between items-center">
                        <div className="flex space-x-2">
                           {selectedDrill.tags.map(t => (
                              <span key={t} className="text-xs text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded">#{t}</span>
                           ))}
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                           Min Players: {selectedDrill.minPlayers}
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-end shrink-0">
                  <Button onClick={() => setSelectedDrill(null)}>Close Drill</Button>
               </div>
            </div>
         </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!itemToDelete}
        title="Delete Play?"
        message="Are you sure you want to remove this item from your playbook? This cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
