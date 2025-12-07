
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
}

export interface SquadPlayer {
  id: string;
  name: string;
  position?: string;
  createdAt: number;
}

export interface GameLogEntry {
  id: string;
  timestamp: number; // raw seconds
  formattedTime: string; // MM:SS
  playerId: string;
  playerName: string;
  playerNumber: string;
  type: 'penalty' | 'try' | 'yellow_card' | 'red_card' | 'other' | 'error';
  reason?: string;
  location?: string; // e.g. "Defensive 20"
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
}
