
import { StatConfig, PlayerStats, Player } from './types';

export const INITIAL_STATS: PlayerStats = {
  tackles: 0,
  hitUps: 0,
  penaltiesConceded: 0,
  errors: 0,
  triesScored: 0,
  kicks: 0,
};

export const STAT_CONFIGS: StatConfig[] = [
  { key: 'tackles', label: 'Tackles' },
  { key: 'hitUps', label: 'Hit-ups' },
  { key: 'penaltiesConceded', label: 'Penalties', isNegative: true },
  { key: 'errors', label: 'Errors', isNegative: true },
  { key: 'triesScored', label: 'Tries' },
  { key: 'kicks', label: 'Kicks' },
];

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