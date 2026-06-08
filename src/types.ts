export interface Operator {
  rank?: number;
  name: string;
  status: 'LEGENDARY' | 'ELITE' | 'RECRUIT';
  earnings: number;
  avatarLetter: string;
  isActiveUser?: boolean;
}

export interface BattleLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ArenaState {
  underway: boolean;
  stage: 'idle' | 'scanning' | 'combat' | 'complete';
  opponent: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    avatar: string;
  } | null;
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  tacticalLog: BattleLog[];
  outcome: 'victory' | 'defeat' | null;
  earningsWon: number;
}
