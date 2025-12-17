
import React, { useState, useMemo } from 'react';
import { Drill, DrillCategory, PlaybookItem, TrainingPlan, PlanBlock } from '../types';
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
      { title: 'Marker Defense', content: 'Markers must stand directly in front of the PTB. They cannot move until the ball is cleared or the dummy half runs.' },
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

// --- MOCK DATA FOR LIBRARY (Existing) ---
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
            {id: "d1", type: "defender", x: 40, y: 45, label: "A"}, // Defender stays in
            {id: "d2", type: "defender", x: 55, y: 45, label: "B"}, // Defender commits to 2
            {id: "a1", type: "attacker", x: 35, y: 50, label: "1"}, // 1 runs straight
            {id: "a2", type: "attacker", x: 50, y: 50, label: "2"}, // 2 engages line
            {id: "a3", type: "attacker", x: 70, y: 50, label: "3"}, // 3 stays wide
            {id: "b1", type: "ball", x: 50, y: 50} // Ball with 2
          ]
        },
        {
          id: "f3",
          tokens: [
            {id: "d1", type: "defender", x: 40, y: 45, label: "A"},
            {id: "d2", type: "defender", x: 55, y: 48, label: "B"},
            {id: "a1", type: "attacker", x: 35, y: 30, label: "1"},
            {id: "a2", type: "attacker", x: 50, y: 40, label: "2"}, // 2 passes
            {id: "a3", type: "attacker", x: 70, y: 30, label: "3"}, // 3 catches in space
            {id: "b1", type: "ball", x: 70, y: 30} // Ball with 3
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
          {id: "c1", type: "cone", x: 50, y: 50}, // Center
          {id: "c2", type: "cone", x: 50, y: 20}, // Front 10m
          {id: "c3", type: "cone", x: 50, y: 80}, // Back 10m
          {id: "p1", type: "attacker", x: 50, y: 52, label: "P"} // Start Middle
        ]
      },
      {
        id: "f2",
        tokens: [
          {id: "c1", type: "cone", x: 50, y: 50},
          {id: "c2", type: "cone", x: 50, y: 20},
          {id: "c3", type: "cone", x: 50, y: 80},
          {id: "p1", type: "attacker", x: 50, y: 82, label: "P"} // Backpedal to 10m
        ]
      },
      {
        id: "f3",
        tokens: [
          {id: "c1", type: "cone", x: 50, y: 50},
          {id: "c2", type: "cone", x: 50, y: 20},
          {id: "c3", type: "cone", x: 50, y: 80},
          {id: "p1", type: "attacker", x: 50, y: 52, label: "P"} // Return to middle
        ]
      },
      {
        id: "f4",
        tokens: [
          {id: "c1", type: "cone", x: 50, y: 50},
          {id: "c2", type: "cone", x: 50, y: 20},
          {id: "c3", type: "cone", x: 50, y: 80},
          {id: "p1", type: "attacker", x: 50, y: 22, label: "P"} // Sprint to far 10m
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
          {id: "d1", type: "defender", x: 40, y: 40, label: "A"},
          {id: "d2", type: "defender", x: 50, y: 40, label: "B"},
          {id: "d3", type: "defender", x: 60, y: 40, label: "C"},
          {id: "p1", type: "pad", x: 40, y: 60},
          {id: "p2", type: "pad", x: 50, y: 60},
          {id: "p3", type: "pad", x: 60, y: 60}
        ]
      },
      {
        id: "f2",
        tokens: [
          {id: "d1", type: "defender", x: 40, y: 48, label: "A"},
          {id: "d2", type: "defender", x: 50, y: 48, label: "B"},
          {id: "d3", type: "defender", x: 60, y: 48, label: "C"},
          {id: "p1", type: "pad", x: 40, y: 52},
          {id: "p2", type: "pad", x: 50, y: 52},
          {id: "p3", type: "pad", x: 60, y: 52}
        ]
      },
      {
        id: "f3",
        tokens: [
          {id: "d1", type: "defender", x: 41, y: 54, label: "A"}, // Drive through slightly inside
          {id: "d2", type: "defender", x: 51, y: 54, label: "B"},
          {id: "d3", type: "defender", x: 61, y: 54, label: "C"},
          {id: "p1", type: "pad", x: 40, y: 54},
          {id: "p2", type: "pad", x: 50, y: 54},
          {id: "p3", type: "pad", x: 60, y: 54}
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
          {id: "a1", type: "attacker", x: 50, y: 52, label: "BC"},
          {id: "b1", type: "ball", x: 50, y: 52},
          {id: "dh", type: "attacker", x: 50, y: 65, label: "DH"}
        ]
      },
      {
        id: "f2",
        tokens: [
          {id: "d1", type: "defender", x: 45, y: 45, label: "M"}, // Markers split
          {id: "d2", type: "defender", x: 55, y: 45, label: "M"},
          {id: "a1", type: "attacker", x: 50, y: 52, label: "BC"}, // BC Stands
          {id: "b1", type: "ball", x: 50, y: 55}, // Ball placed
          {id: "dh", type: "attacker", x: 50, y: 60, label: "DH"} // DH moves in
        ]
      },
      {
        id: "f3",
        tokens: [
          {id: "d1", type: "defender", x: 45, y: 45, label: "M"},
          {id: "d2", type: "defender", x: 55, y: 45, label: "M"},
          {id: "a1", type: "attacker", x: 50, y: 52, label: "BC"},
          {id: "dh", type: "attacker", x: 50, y: 40, label: "DH"}, // DH Scoops and runs
          {id: "b1", type: "ball", x: 50, y: 40}
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
      },
      {
        id: "f2",
        tokens: [
          {id: "k1", type: "attacker", x: 50, y: 70, label: "7"},
          {id: "b1", type: "ball", x: 50, y: 45}, // Ball in flight/rolling
          {id: "c1", type: "cone", x: 45, y: 20},
          {id: "c2", type: "cone", x: 55, y: 20},
          {id: "c3", type: "cone", x: 45, y: 30},
          {id: "c4", type: "cone", x: 55, y: 30},
          {id: "ch", type: "attacker", x: 40, y: 50, label: "C"} // Chase
        ]
      },
      {
        id: "f3",
        tokens: [
          {id: "k1", type: "attacker", x: 50, y: 70, label: "7"},
          {id: "b1", type: "ball", x: 50, y: 25}, // Ball in box
          {id: "c1", type: "cone", x: 45, y: 20},
          {id: "c2", type: "cone", x: 55, y: 20},
          {id: "c3", type: "cone", x: 45, y: 30},
          {id: "c4", type: "cone", x: 55, y: 30},
          {id: "ch", type: "attacker", x: 50, y: 25, label: "C"} // Grounding
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
    title: 'Traffic Lights Evasion',
    category: 'Fitness',
    difficulty: 'Beginner',
    durationMin: 10,
    minPlayers: 4,
    description: 'Reaction based evasion game using colored cones or calls.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "a1", type: "attacker", x: 50, y: 80, label: "P"},
          {id: "c_r", type: "cone", x: 20, y: 50}, // Red
          {id: "c_y", type: "cone", x: 50, y: 50}, // Yellow
          {id: "c_g", type: "cone", x: 80, y: 50}, // Green
          {id: "coach", type: "defender", x: 50, y: 20, label: "Coach"}
        ]
      }]
    }),
    steps: [
      'Place Red, Yellow, Green cones 10m apart.',
      'Players start on try line.',
      'Coach calls a color.',
      'Players must sprint to that color, touch cone, and sprint back.'
    ],
    coachingPoints: ['Head up scanning', 'Explosive turn', 'Reaction speed'],
    tags: ['Agility', 'Fun', 'Juniors']
  },
  {
    id: 'd7',
    title: 'Pendulum Defense',
    category: 'Defense',
    difficulty: 'Advanced',
    durationMin: 15,
    minPlayers: 3,
    description: 'Back three positional work to cover kicks.',
    visualData: JSON.stringify({
      pitchType: "full",
      frames: [{
        id: "f1",
        tokens: [
          {id: "fb", type: "defender", x: 50, y: 80, label: "FB"},
          {id: "w1", type: "defender", x: 20, y: 60, label: "W"},
          {id: "w2", type: "defender", x: 80, y: 60, label: "W"},
          {id: "k", type: "attacker", x: 80, y: 20, label: "K"} // Kicker on right
        ]
      },
      {
        id: "f2",
        tokens: [
          {id: "fb", type: "defender", x: 80, y: 80, label: "FB"}, // FB swings right
          {id: "w1", type: "defender", x: 50, y: 70, label: "W"}, // Far wing drops back
          {id: "w2", type: "defender", x: 80, y: 50, label: "W"}, // Near wing presses up
          {id: "k", type: "attacker", x: 80, y: 20, label: "K"}
        ]
      }]
    }),
    steps: [
      'Setup Back 3 (FB, Wingers).',
      'Coach/Kicker stands on one side of field.',
      'As ball moves to that side, the near winger moves up.',
      'FB covers the corner, far winger swings round to cover middle.',
      'Imagine a string connecting the three players.'
    ],
    coachingPoints: ['Communication is key', 'Work rate off the ball', 'Never leave the backfield empty'],
    tags: ['Positioning', 'Back 3', 'Tactics']
  },
  {
    id: 'd8',
    title: 'Draw & Pass Box',
    category: 'Attack',
    difficulty: 'Beginner',
    durationMin: 10,
    minPlayers: 4,
    description: 'Basic 2v1 execution in a confined space.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "c1", type: "cone", x: 40, y: 40},
          {id: "c2", type: "cone", x: 60, y: 40},
          {id: "c3", type: "cone", x: 40, y: 60},
          {id: "c4", type: "cone", x: 60, y: 60},
          {id: "d1", type: "defender", x: 50, y: 40, label: "D"},
          {id: "a1", type: "attacker", x: 45, y: 60, label: "1"},
          {id: "a2", type: "attacker", x: 55, y: 60, label: "2"},
          {id: "b", type: "ball", x: 45, y: 62}
        ]
      }]
    }),
    steps: [
      'Grid 5m x 10m.',
      'Defender stands in middle of far line.',
      'Two attackers advance.',
      'Ball carrier runs at defender\'s inside shoulder to commit them.',
      'Pass to support runner before contact.'
    ],
    coachingPoints: ['Run straight', 'Fix the defender', 'Pass mechanics'],
    tags: ['Passing', 'Fundamentals']
  },
  {
    id: 'd9',
    title: 'Offload Gates',
    category: 'Attack',
    difficulty: 'Intermediate',
    durationMin: 15,
    minPlayers: 6,
    description: 'Encouraging second phase play through contact.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "d1", type: "defender", x: 45, y: 50, label: "D"},
          {id: "d2", type: "defender", x: 55, y: 50, label: "D"},
          {id: "a1", type: "attacker", x: 50, y: 60, label: "BC"},
          {id: "s1", type: "attacker", x: 40, y: 65, label: "S"},
          {id: "b", type: "ball", x: 50, y: 60}
        ]
      }]
    }),
    steps: [
      'Two defenders hold pads creating a "gate".',
      'Attacker runs through contact.',
      'Must free arms and offload to support runner immediately after contact.',
      'Support runner must anticipate the offload.'
    ],
    coachingPoints: ['Win the collision', 'Free the arms', 'Support lines'],
    tags: ['Offloading', 'Contact']
  },
  {
    id: 'd10',
    title: 'Bombs Away',
    category: 'Kicking',
    difficulty: 'Advanced',
    durationMin: 15,
    minPlayers: 4,
    description: 'High ball catching practice under pressure.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "k", type: "attacker", x: 50, y: 20, label: "K"},
          {id: "c1", type: "defender", x: 50, y: 80, label: "C"}, // Catcher
          {id: "ch1", type: "attacker", x: 40, y: 40, label: "Chase"},
          {id: "ch2", type: "attacker", x: 60, y: 40, label: "Chase"},
          {id: "b", type: "ball", x: 50, y: 20}
        ]
      }]
    }),
    steps: [
      'Kicker puts up a high bomb to the try line.',
      'Catcher must judge flight and catch.',
      'Two chasers sprint to apply pressure (holding pads).',
      'Catcher must secure ball and brace for contact.'
    ],
    coachingPoints: ['Eyes on the ball', 'Call early', 'Jump to meet the ball'],
    tags: ['Catching', 'Fullback', 'Wing']
  },
  {
    id: 'd11',
    title: 'Protect the Treasure',
    category: 'Core Skills',
    difficulty: 'Beginner',
    durationMin: 15,
    minPlayers: 10,
    description: 'A fun agility and evasion game where teams must steal "treasure" from a central guarded zone.',
    visualData: JSON.stringify({
      pitchType: "full",
      frames: [{
        id: "f1",
        tokens: [
          {id: "c1", type: "cone", x: 20, y: 20},
          {id: "c2", type: "cone", x: 80, y: 20},
          {id: "c3", type: "cone", x: 20, y: 80},
          {id: "c4", type: "cone", x: 80, y: 80},
          {id: "g1", type: "defender", x: 45, y: 45, label: "G"},
          {id: "g2", type: "defender", x: 55, y: 55, label: "G"},
          {id: "t1", type: "ball", x: 50, y: 50},
          {id: "t2", type: "ball", x: 52, y: 48},
          {id: "a1", type: "attacker", x: 22, y: 22, label: "A"}, // Starting corners
          {id: "a2", type: "attacker", x: 78, y: 78, label: "A"}
        ]
      },
      {
        id: "f2",
        tokens: [
          {id: "c1", type: "cone", x: 20, y: 20},
          {id: "c2", type: "cone", x: 80, y: 20},
          {id: "c3", type: "cone", x: 20, y: 80},
          {id: "c4", type: "cone", x: 80, y: 80},
          {id: "g1", type: "defender", x: 40, y: 40, label: "G"}, // Chasing A1
          {id: "g2", type: "defender", x: 60, y: 60, label: "G"}, // Chasing A2
          {id: "t1", type: "ball", x: 50, y: 50},
          {id: "t2", type: "ball", x: 52, y: 48},
          {id: "a1", type: "attacker", x: 45, y: 42, label: "A"}, // Entering Zone
          {id: "a2", type: "attacker", x: 58, y: 65, label: "A"}
        ]
      }]
    }),
    steps: [
        'Split students into 4/5 teams. Place one group in the middle as guards, others in corner areas.',
        'Place footballs, rugby balls, bibs, cones (treasure) in the center circle.',
        'One student from each group attempts to steal items from the middle and return to their corner.',
        'Guards try to tag/touch thieves. If tagged, they must return empty-handed.',
        'Rotate guard duty.'
    ],
    coachingPoints: [
        'Attackers: Run at pace, do not stop (loses momentum).',
        'Attackers: Use quick footwork when approaching defenders.',
        'Defenders: Stay as a solid unit to restrict space.',
        'Defenders: Constant communication to organize team mates.'
    ],
    tags: ['Agility', 'Evasion', 'Communication', 'Fun']
  },
  {
    id: 'd17',
    title: 'RPS Reaction Chase',
    category: 'Core Skills',
    difficulty: 'Beginner',
    durationMin: 10,
    minPlayers: 3,
    description: 'A fun reaction game combining Rock, Paper, Scissors with catching, passing, and chasing.',
    visualData: JSON.stringify({
      pitchType: "half",
      frames: [{
        id: "f1",
        tokens: [
          {id: "p1", type: "attacker", x: 45, y: 50, label: "P1"},
          {id: "p2", type: "attacker", x: 55, y: 50, label: "P2"},
          {id: "f", type: "attacker", x: 50, y: 40, label: "Feed"},
          {id: "b", type: "ball", x: 50, y: 38},
          {id: "c1", type: "cone", x: 30, y: 50}, // Loser cone left
          {id: "c2", type: "cone", x: 70, y: 50}, // Loser cone right
          {id: "try", type: "cone", x: 50, y: 80} // Try line
        ]
      }]
    }),
    steps: [
        'Two players stand opposite each other. A feeder stands 1m away with back to them holding the ball.',
        'Players play Rock, Paper, Scissors.',
        'The Winner calls for the ball, catches the pass from the feeder, and sprints to the try line.',
        'The Loser must run to a side cone, turn, and chase to tag the winner.',
        'Winner becomes the new feeder. Rotate players.'
    ],
    coachingPoints: [
        'React instantly to the result of the RPS game.',
        'Winner: Loud call for the ball and clean catch before running.',
        'Loser: Explosive turn and speed to make the tag.'
    ],
    tags: ['Reaction', 'Fun', 'Passing', 'Speed']
  }
];

// --- REF'S CORNER COMPONENT ---
const RefCornerView = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search) return RULES_DATA;
    // Return categories that contain matches
    return RULES_DATA.filter(cat => 
      cat.category.toLowerCase().includes(search.toLowerCase()) || 
      cat.rules.some(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  // If a category is selected, we show its rules. If searching, we show all matching rules flattened.
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
      
      {/* Top Bar: Search & Identity */}
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
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
              </div>
              <input 
                 type="text" 
                 className="block w-full pl-12 pr-4 py-5 border-none rounded-3xl bg-white dark:bg-[#1A1A1C] text-slate-900 dark:text-white placeholder-gray-400 focus:ring-0 shadow-apple dark:shadow-none transition-all" 
                 placeholder="Search rules (e.g. 'High Tackle', 'Scrum')..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
         {!search && !activeCategory ? (
            // GRID VIEW
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
                     <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{cat.description}</p>
                     <div className="mt-auto pt-6 flex justify-end">
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            // DETAIL / SEARCH RESULTS VIEW
            <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl shadow-apple dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col min-h-[400px]">
               {/* Header */}
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
                     Back to Categories
                  </button>
               </div>

               {/* Content */}
               <div className="p-6 md:p-8">
                  {displayRules.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayRules.map((rule, idx) => (
                           <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
                              <div className="flex items-start space-x-4">
                                 <div className="flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-gray-600 group-hover:bg-blue-500 transition-colors"></div>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{rule.title}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{rule.content}</p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-3xl">🤷</div>
                        <p className="font-medium">No rules found matching your criteria.</p>
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

// --- MATCH DAY MANAGER COMPONENT ---
const MatchDayManagerView = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const progress = Math.round((checkedItems.size / SAFETY_CHECKLIST.length) * 100);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* COLUMN 1 & 2: Logistics Checklist */}
      <div className="xl:col-span-2 space-y-6">
        {/* Header / Status Card */}
        <div className="bg-slate-900 dark:bg-white rounded-3xl p-6 text-white dark:text-slate-900 shadow-xl relative overflow-hidden">
           <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 translate-x-8"></div>
           <div className="flex items-center justify-between relative z-10">
              <div>
                 <h2 className="text-2xl font-heading font-black tracking-tight mb-1">Pre-Game Command</h2>
                 <p className="text-sm opacity-70 font-medium">Logistics & Safety Checks</p>
              </div>
              <div className="relative w-16 h-16 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20 dark:text-slate-900/20" />
                    <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="text-green-400 dark:text-green-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
                 </svg>
                 <span className="absolute text-xs font-bold">{progress}%</span>
              </div>
           </div>
        </div>

        {/* Checklist */}
        <div className="bg-white dark:bg-[#1A1A1C] rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
           <div className="divide-y divide-gray-100 dark:divide-white/5">
              {SAFETY_CHECKLIST.map(item => {
                 const isChecked = checkedItems.has(item.id);
                 return (
                    <div 
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`flex items-center p-5 cursor-pointer transition-all duration-200 group ${isChecked ? 'bg-gray-50/50 dark:bg-white/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mr-5 shadow-sm transition-all ${isChecked ? 'bg-green-100 dark:bg-green-900/20 grayscale' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5'}`}>
                          {item.icon}
                       </div>
                       <div className="flex-1">
                          <h4 className={`font-bold text-base transition-colors ${isChecked ? 'text-gray-500 line-through decoration-2 decoration-gray-300' : 'text-slate-900 dark:text-white'}`}>{item.label}</h4>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{item.sub}</p>
                       </div>
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-green-500 border-green-500 scale-110' : 'border-gray-200 dark:border-white/20 group-hover:border-green-400'}`}>
                          {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </div>

      {/* COLUMN 3: Safety Cards & Extras */}
      <div className="xl:col-span-1 space-y-6">
         
         {/* CRT CARD - Medical Style */}
         <div className="bg-[#E02020] rounded-3xl p-6 text-white shadow-lg shadow-red-500/20 relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="font-heading font-black text-xl leading-none mb-1">CRT 6</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Concussion Protocol</p>
               </div>
               <svg className="w-8 h-8 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>

            <div className="space-y-4">
               <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                  <span className="block text-[10px] font-bold uppercase mb-1 text-white/70">Red Flags (Call 999)</span>
                  <p className="text-xs font-medium leading-tight">Neck pain, Double vision, Vomiting, Severe headache, Loss of consciousness.</p>
               </div>
               <div className="bg-white text-red-600 rounded-xl p-3 shadow-sm">
                  <span className="block text-[10px] font-bold uppercase mb-1 opacity-70">Action</span>
                  <p className="text-sm font-bold leading-tight">If in doubt, sit them out. Immediate removal. No return to play.</p>
               </div>
            </div>
         </div>

         {/* Touchline Manager - High Vis Style */}
         <div className="bg-yellow-400 rounded-3xl p-1 shadow-lg relative overflow-hidden">
            {/* Striped Caution Pattern */}
            <div className="absolute top-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-4 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] opacity-10"></div>
            
            <div className="bg-yellow-400 p-5 pt-6 pb-6">
               <div className="flex items-center space-x-3 mb-2">
                  <div className="p-1.5 bg-black rounded-lg">
                     <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Touchline Manager</h3>
               </div>
               <p className="text-slate-900 text-xs font-medium leading-relaxed pl-1">
                  Compliance Rule: A designated person wearing a <strong>High-Vis Yellow Vest</strong> must be present to manage spectator behavior. Game cannot proceed without one.
               </p>
            </div>
         </div>

         {/* Coach Speech Assist - Cue Cards Style */}
         <div className="pt-2">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 pl-1">Coach's Cue Cards</h3>
            <div className="space-y-3">
               <div className="bg-white dark:bg-[#252529] p-4 rounded-xl border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Theme: Defense</span>
                     <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-gray-300 font-medium italic">"Defense is an attitude. It's not about size, it's about line speed and working for your mate inside you. Win the collision, win the game."</p>
               </div>

               <div className="bg-white dark:bg-[#252529] p-4 rounded-xl border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">Theme: Fun & Flow</span>
                     <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" /></svg>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-gray-300 font-medium italic">"Mistakes happen. I don't care if you drop the ball, I care how you react. Head up, smile, get back in line. Let's throw the ball around."</p>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

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
  
  // Session Planner State
  const [sessionBlocks, setSessionBlocks] = useState<PlanBlock[]>([]);
  const [sessionTitle, setSessionTitle] = useState('New Training Session');
  
  // For creating new playbook item
  const [isCreating, setIsCreating] = useState(false);
  const [newPlayTitle, setNewPlayTitle] = useState('');
  const [newPlayData, setNewPlayData] = useState('');

  const filteredDrills = useMemo(() => {
    return DRILL_LIBRARY.filter(d => {
      const matchesCategory = filterCategory === 'All' || d.category === filterCategory;
      const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  const categories = ['All', 'Attack', 'Defense', 'Fitness', 'Core Skills', 'Kicking'];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Attack': return 'bg-blue-500';
      case 'Defense': return 'bg-red-500';
      case 'Fitness': return 'bg-purple-500';
      case 'Core Skills': return 'bg-emerald-500';
      case 'Kicking': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Attack': return { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' };
      case 'Defense': return { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-100 dark:border-red-900/30' };
      case 'Fitness': return { bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/30' };
      case 'Core Skills': return { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' };
      case 'Kicking': return { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' };
      default: return { bg: 'bg-slate-50 dark:bg-white/5', text: 'text-slate-700 dark:text-gray-400', border: 'border-slate-100 dark:border-white/5' };
    }
  };

  const handleSavePlay = () => {
    if (!newPlayTitle.trim()) return;
    
    onAddPlaybookItem({
      title: newPlayTitle,
      type: 'Move', // Default to Move for now, could add selector
      content: newPlayData || JSON.stringify({ pitchType: 'half', frames: [{ id: '1', tokens: [] }] }), // Save tactics data
      createdAt: Date.now()
    });
    setIsCreating(false);
    setNewPlayTitle('');
    setNewPlayData('');
  };

  // --- PLANNER LOGIC ---
  const addToPlan = (drill: Drill) => {
    const newBlock: PlanBlock = {
      id: Date.now().toString(),
      type: 'drill',
      title: drill.title,
      durationMin: drill.durationMin,
      drillId: drill.id
    };
    setSessionBlocks([...sessionBlocks, newBlock]);
  };

  const addCustomBlock = () => {
    const newBlock: PlanBlock = {
      id: Date.now().toString(),
      type: 'custom',
      title: 'Water Break / Talk',
      durationMin: 5
    };
    setSessionBlocks([...sessionBlocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setSessionBlocks(sessionBlocks.filter(b => b.id !== id));
  };

  const totalDuration = sessionBlocks.reduce((acc, b) => acc + b.durationMin, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('library')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'library' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Drill Library
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'planner' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Session Planner
        </button>
        <button
          onClick={() => setActiveTab('playbook')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'playbook' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          My Playbook
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rules' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Ref's Corner
        </button>
        <button
          onClick={() => setActiveTab('matchday')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'matchday' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Match Day Manager
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'manual' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
          Coach Manual
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'manual' && <CoachManualView />}
      
      {activeTab === 'rules' && <RefCornerView />}
      
      {activeTab === 'matchday' && <MatchDayManagerView />}

      {activeTab === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: The Timeline */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-[#1A1A1C] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 sticky top-24">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Current Plan</h3>
                       <input 
                         type="text" 
                         value={sessionTitle}
                         onChange={(e) => setSessionTitle(e.target.value)}
                         className="bg-transparent text-sm text-gray-500 dark:text-gray-400 border-none p-0 focus:ring-0 w-full"
                       />
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-2xl font-black ${totalDuration > 60 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                          {totalDuration}
                       </span>
                       <span className="text-[10px] uppercase font-bold text-gray-400">Minutes</span>
                    </div>
                 </div>

                 {sessionBlocks.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                       <p className="text-gray-400 text-sm">Drag drills here or click 'Add' from the library.</p>
                    </div>
                 ) : (
                    <div className="space-y-3 relative">
                       {/* Connection Line */}
                       <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-white/10 z-0"></div>
                       
                       {sessionBlocks.map((block, i) => (
                          <div key={block.id} className="relative z-10 bg-white dark:bg-[#252529] p-3 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex justify-between items-center group">
                             <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-white mr-3 shrink-0">
                                   {i + 1}
                                </div>
                                <div>
                                   <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{block.title}</h4>
                                   <span className="text-xs text-gray-500">{block.durationMin} mins</span>
                                </div>
                             </div>
                             <button onClick={() => removeBlock(block.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                          </div>
                       ))}
                    </div>
                 )}

                 <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 grid grid-cols-2 gap-3">
                    <Button onClick={addCustomBlock} variant="secondary" className="text-xs">Add Break</Button>
                    <Button onClick={() => alert('Plan Saved! (Simulation)')} disabled={sessionBlocks.length === 0} className="text-xs">Save Plan</Button>
                 </div>
              </div>
           </div>

           {/* Right: The Picker (Mini Library) */}
           <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                 Available Drills
                 <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{DRILL_LIBRARY.length}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {DRILL_LIBRARY.map(drill => (
                    <div key={drill.id} className="bg-white dark:bg-[#1A1A1C] p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col justify-between hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
                       <div>
                          <div className="flex justify-between items-start mb-2">
                             <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${drill.category === 'Attack' ? 'bg-blue-50 text-blue-600' : drill.category === 'Defense' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                {drill.category}
                             </span>
                             <span className="text-xs font-bold text-gray-400">{drill.durationMin}m</span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1">{drill.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-4">{drill.description}</p>
                       </div>
                       <Button onClick={() => addToPlan(drill)} variant="secondary" className="w-full text-xs py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 dark:bg-white/5 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 border-none">
                          + Add to Session
                       </Button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="space-y-6">
           {/* Top Filter Bar */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1A1A1C] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
              {/* Search */}
              <div className="relative w-full md:w-80">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
                 <input 
                    type="text" 
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg leading-5 bg-gray-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-black/20 focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-all" 
                    placeholder="Search drills..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              
              {/* Categories - Horizontal Scroll */}
              <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar mask-linear-fade">
                 {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        filterCategory === cat 
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md' 
                          : 'bg-white dark:bg-white/5 text-slate-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                 ))}
              </div>
           </div>

           {/* Grid Layout */}
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredDrills.map(drill => {
                const styles = getCategoryStyles(drill.category);
                return (
                   <div 
                     key={drill.id} 
                     onClick={() => setSelectedDrill(drill)}
                     className="bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-apple-hover dark:hover:shadow-lg dark:hover:shadow-black/50 transition-all duration-300 cursor-pointer group flex flex-col h-full overflow-hidden relative"
                   >
                      {/* Top Accent Line */}
                      <div className={`h-1 w-full ${getCategoryColor(drill.category)}`}></div>
                      
                      <div className="p-6 flex flex-col h-full">
                         <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${styles.bg} ${styles.text} ${styles.border}`}>
                              {drill.category}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                              drill.difficulty === 'Beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                              drill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {drill.difficulty}
                            </span>
                         </div>
                         
                         <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors line-clamp-1">{drill.title}</h4>
                         
                         <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                           {drill.description}
                         </p>
                         
                         <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5 mt-auto">
                            <div className="flex items-center space-x-3 text-xs font-medium text-slate-400 dark:text-gray-500">
                               <span className="flex items-center">
                                 <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 {drill.durationMin}m
                               </span>
                               <span className="flex items-center">
                                 <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                 {drill.minPlayers}+
                               </span>
                            </div>
                            <div className="text-gray-300 dark:text-gray-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-300">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </div>
                         </div>
                      </div>
                   </div>
                );
             })}
           </div>
           
           {filteredDrills.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-[#1A1A1C] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                 <p className="text-gray-400 dark:text-gray-500 font-medium">No drills found matching your search.</p>
                 <button onClick={() => {setFilterCategory('All'); setSearchQuery('');}} className="mt-2 text-sm text-red-600 font-bold hover:underline">Clear filters</button>
              </div>
           )}
        </div>
      )}

      {activeTab === 'playbook' && (
        <div>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">My Tactics & Plays</h3>
              <Button onClick={() => setIsCreating(true)}>+ New Play</Button>
           </div>

           {isCreating ? (
              <div className="bg-white dark:bg-[#1A1A1C] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                 <div className="mb-4">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Play Name</label>
                    <input 
                      type="text" 
                      value={newPlayTitle}
                      onChange={(e) => setNewPlayTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-slate-900 dark:text-white"
                      placeholder="e.g. Block Play Left"
                    />
                 </div>
                 <div className="mb-6">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tactics Board</label>
                    <div className="h-[400px] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                       <TacticsBoard onSave={(data) => setNewPlayData(data)} />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-3">
                    <Button variant="secondary" onClick={() => setIsCreating(false)}>Cancel</Button>
                    <Button onClick={handleSavePlay}>Save to Playbook</Button>
                 </div>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {playbook.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-white dark:bg-[#1A1A1C] rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400">
                       You haven't created any plays yet.
                    </div>
                 ) : (
                    playbook.map(play => (
                       <div key={play.id} className="bg-white dark:bg-[#1A1A1C] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-white/10 group">
                          <div className="h-48 bg-gray-100 dark:bg-white/5 relative">
                             {/* Preview of the board (ReadOnly) */}
                             <div className="absolute inset-0 pointer-events-none transform scale-50 origin-top-left w-[200%] h-[200%]">
                                <TacticsBoard initialData={play.content} isReadOnly={true} />
                             </div>
                          </div>
                          <div className="p-4 flex justify-between items-center">
                             <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{play.title}</h4>
                                <span className="text-xs text-gray-500">{new Date(play.createdAt).toLocaleDateString()}</span>
                             </div>
                             <button 
                               onClick={() => onDeletePlaybookItem(play.id)}
                               className="text-gray-400 hover:text-red-500 transition-colors p-2"
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
      )}

      {/* Drill Detail Modal */}
      {selectedDrill && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDrill(null)} />
            
            <div className="relative bg-white dark:bg-[#1A1A1C] rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
               {/* Header */}
               <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5 shrink-0">
                  <div className="flex items-center space-x-4">
                     <h2 className="text-xl md:text-2xl font-heading font-bold text-slate-900 dark:text-white truncate">{selectedDrill.title}</h2>
                     <div className="hidden md:flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${selectedDrill.category === 'Attack' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{selectedDrill.category}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{selectedDrill.durationMin} mins</span>
                     </div>
                  </div>
                  <button onClick={() => setSelectedDrill(null)} className="text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-white/10 rounded-full p-2 shadow-sm">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* Left: Animation Stage (Darker background for contrast) */}
                  <div className="flex-1 bg-gray-900 dark:bg-black/40 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden group">
                       {selectedDrill.visualData && (
                           <div className="w-full h-full max-w-5xl shadow-2xl rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                              <TacticsBoard initialData={selectedDrill.visualData} isReadOnly={true} />
                           </div>
                       )}
                  </div>

                  {/* Right: Info Scrollable */}
                  <div className="w-full lg:w-[450px] xl:w-[500px] overflow-y-auto bg-white dark:bg-[#1A1A1C] border-l border-gray-200 dark:border-white/10 flex flex-col shrink-0">
                       <div className="p-6 space-y-8">
                          {/* Mobile Metadata */}
                          <div className="flex lg:hidden items-center space-x-3 text-xs font-bold text-gray-500">
                             <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">{selectedDrill.durationMin} min</span>
                             <span className="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">{selectedDrill.minPlayers}+ Players</span>
                          </div>

                          {/* Coaching Points */}
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                             <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 text-sm uppercase tracking-wide flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Coaching Points
                             </h3>
                             <ul className="space-y-2">
                                {selectedDrill.coachingPoints.map((pt, i) => (
                                   <li key={i} className="flex items-start text-sm text-blue-900 dark:text-blue-100">
                                      <span className="mr-2 text-blue-500">•</span>
                                      {pt}
                                   </li>
                                ))}
                             </ul>
                          </div>

                          {/* Description */}
                          <div>
                             <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm uppercase tracking-wide">Description</h3>
                             <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{selectedDrill.description}</p>
                          </div>

                          {/* Setup & Steps */}
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Setup & Steps</h3>
                              <div className="relative border-l-2 border-gray-100 dark:border-white/10 ml-3 space-y-6 pl-6 py-2">
                                 {selectedDrill.steps.map((step, i) => (
                                    <div key={i} className="relative">
                                       <div className="absolute -left-[33px] top-0 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-bold border-4 border-white dark:border-[#1A1A1C]">
                                          {i + 1}
                                       </div>
                                       <p className="text-sm text-gray-700 dark:text-gray-300">{step}</p>
                                    </div>
                                 ))}
                              </div>
                          </div>

                          {/* Tags */}
                          <div>
                             <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Tags</h3>
                             <div className="flex flex-wrap gap-2">
                                {selectedDrill.tags.map(tag => (
                                   <span key={tag} className="text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md font-medium">#{tag}</span>
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
