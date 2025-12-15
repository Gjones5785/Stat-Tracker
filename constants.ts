
import { StatConfig, PlayerStats, Player } from './types';

export const INITIAL_STATS: PlayerStats = {
  // Base
  tackles: 0,
  hitUps: 0,
  penaltiesConceded: 0,
  errors: 0,
  triesScored: 0,
  kicks: 0,
  
  // Advanced
  tryAssists: 0,
  lineBreaks: 0,
  offloads: 0,
  trySavers: 0,
  missedTackles: 0,
  oneOnOneStrips: 0,
  forcedDropouts: 0,
  fortyTwenties: 0
};

// Only the "Base" stats are shown in the main table columns (except Impact)
export const STAT_CONFIGS: StatConfig[] = [
  { key: 'tackles', label: 'Tackles' },
  { key: 'hitUps', label: 'Hit-ups' },
  { key: 'penaltiesConceded', label: 'Penalties', isNegative: true },
  { key: 'errors', label: 'Errors', isNegative: true },
  { key: 'triesScored', label: 'Tries' },
  { key: 'kicks', label: 'Kicks' },
];

export const IMPACT_WEIGHTS = {
  // Attack
  triesScored: 8,
  tryAssists: 6,
  lineBreaks: 4,
  offloads: 3,
  hitUps: 2,
  kicks: 1,
  fortyTwenties: 8,
  forcedDropouts: 4,
  
  // Defense
  trySavers: 10,
  oneOnOneStrips: 6,
  tackles: 1,
  
  // Negative
  penaltiesConceded: -5,
  errors: -4,
  missedTackles: -2,
  
  // Cards
  yellowCard: -20,
  redCard: -50
};

export const TEAM_SIZE = 18;

export const createInitialPlayers = (): Player[] => 
  Array.from({ length: TEAM_SIZE }, (_, i) => ({
    id: `player-${i}`,
    name: '',
    number: (i + 1).toString(),
    stats: { ...INITIAL_STATS },
    cardStatus: 'none',
    // First 13 are starters (On Field), rest are bench (Off)
    isOnField: i < 13,
    totalSecondsOnField: 0,
    lastSubTime: i < 13 ? 0 : undefined // Starters start at 0
  }));
