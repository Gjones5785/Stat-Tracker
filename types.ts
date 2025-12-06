
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
}
