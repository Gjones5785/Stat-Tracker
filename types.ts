
export interface PlayerIdentity {
  name: string;
  number: string;
}

export interface PlayerStats {
  tackles: number;
  hitUps: number;
  penaltiesConceded: number;
  errors: number;
  triesScored: number;
  kicks: number;
}

export type StatKey = keyof PlayerStats;

export interface StatConfig {
  key: StatKey;
  label: string;
  isNegative?: boolean;
}

export interface Player {
  id: string;
  name: string;
  number: string;
  stats: PlayerStats;
  isOnField?: boolean;
  squadId?: string; // Link to the squad roster
  cardStatus?: 'none' | 'yellow' | 'red';
  sinBinStartTime?: number; // Match time in seconds when yellow card was issued
  totalSecondsOnField: number; // Accumulated time in seconds
  lastSubTime?: number; // Timestamp of the last time they went ON field
}

export interface SquadPlayer {
  id: string;
  name: string;
  position?: string;
  createdAt: number;
}

export type TrainingType = 'Pitch' | 'Gym' | 'Other';

export interface TrainingSession {
  id: string;
  date: string;
  type: TrainingType;
  attendeeIds: string[]; // List of squad IDs
  notes?: string;
}

export interface GameLogEntry {
  id: string;
  timestamp: number; // raw seconds
  formattedTime: string; // MM:SS
  playerId: string;
  playerName: string;
  playerNumber: string;
  type: 'penalty' | 'try' | 'yellow_card' | 'red_card' | 'other' | 'error' | 'substitution';
  reason?: string;
  location?: string; // e.g. "Defensive 20"
  coordinate?: { x: number; y: number }; // Percentage 0-100 on the pitch (x=0 own line, x=100 opp line)
  period: '1st' | '2nd';
}

export interface MatchHistoryItem {
  id: string;
  date: string;
  teamName: string;
  opponentName: string;
  finalScore: string; // "24 - 10"
  result: 'win' | 'loss' | 'draw' | 'unknown';
  data: any; // Full state dump
  voting?: {
    threePointsId: string;
    twoPointsId: string;
    onePointId: string;
  };
}

// --- LEAGUE HUB TYPES ---

export type DrillCategory = 'Attack' | 'Defense' | 'Fitness' | 'Core Skills' | 'Kicking';
export type DrillDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Drill {
  id: string;
  title: string;
  category: DrillCategory;
  difficulty: DrillDifficulty;
  durationMin: number;
  minPlayers: number;
  description: string;
  steps: string[];
  coachingPoints: string[];
  tags: string[];
  visualData?: string; // JSON string for tactics board
  isPremium?: boolean; // For future monetization
}

export interface PlaybookItem {
  id: string;
  title: string;
  type: 'Move' | 'Drill' | 'Note';
  content: string; // Text description or JSON string for tactics board
  createdAt: number;
}

// --- TACTICS BOARD TYPES ---

export type TokenType = 'attacker' | 'defender' | 'ball' | 'cone' | 'pad';

export interface TacticToken {
  id: string;
  type: TokenType;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  label?: string;
  color?: string;
}

export interface TacticFrame {
  id: string;
  tokens: TacticToken[];
  notes?: string;
}

export interface TacticsData {
  frames: TacticFrame[];
  pitchType: 'full' | 'half';
}
