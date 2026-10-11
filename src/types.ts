export type Mode = "normal" | "avalanche" | "radar";
export type Format = "typing" | "names" | "flags" | "mixed";
export type Continent =
  | "África"
  | "América do Norte"
  | "América do Sul"
  | "Ásia"
  | "Europa"
  | "Oceania";
export interface Country {
  id: string;
  code: string;
  name: string;
  aliases: string[];
  continent: Continent;
  region: string;
  similar: string[];
  difficulty: number;
  aspect: number;
  flagNote?: string;
}
export interface Settings {
  sound: boolean;
  volume: number;
  motion: boolean;
  transition: number;
  theme: "light" | "dark" | "system";
  aliases: boolean;
  relief: boolean;
  haptics: boolean;
  dailyGoal: number;
  format: Format;
}
export interface GameConfig {
  mode: Mode;
  format: Format;
  pool: string;
  continent: string;
  count: number;
  weights: number[];
  preset: string;
  lives: number;
  speed: number;
  powers: boolean;
  maxDuration: number;
  grid: number;
  roundTime: number;
  radarProgression?: boolean;
  radarEvent: "classic" | "mirror" | "hunt" | "memory";
  enter: boolean;
  mobile: boolean;
  inputMode: "typing" | "choice";
}
export interface Answer {
  id: string;
  countryId: string;
  selectedId?: string;
  correct: boolean;
  at: number;
  ms: number;
  kind: "answer" | "miss" | "assist";
  format: string;
  input?: string;
}
export interface FallingFlag {
  id: number;
  countryId: string;
  x: number;
  y: number;
  duration: number;
  born: number;
  penalties?: number[];
}
export type Power = "freeze" | "slow" | "shield" | "clear" | "xray" | "life";
export interface AvalancheState {
  elapsed: number;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  flags: FallingFlag[];
  nextId: number;
  spawnAt: number;
  freezeUntil: number;
  slowUntil: number;
  xrayUntil: number;
  shield: boolean;
  charges: Record<Power, number>;
  event: string;
  eventUntil: number;
  nextEventAt: number;
  level: number;
  maxSpeed: number;
  rewarded: number;
  ended: boolean;
}
export interface Runtime {
  feedback?: Answer;
  radarRemaining?: number;
  memoryRevealed?: boolean;
  avalanche?: AvalancheState;
}
export interface Session {
  id: string;
  mode: Mode;
  kind: "complete" | "review" | "practice";
  rootId?: string;
  config: GameConfig;
  startedAt: number;
  finishedAt?: number;
  status: "playing" | "completed" | "abandoned";
  elapsed: number;
  score: number;
  bestCombo: number;
  maxSpeed?: number;
  events: Answer[];
  questionIds: string[];
  cursor: number;
  runtime: Runtime;
}
export interface Snapshot {
  version: 1;
  settings: Settings;
  sessions: Session[];
  active: Session | null;
  achievements: Record<string, number>;
}
export interface CountryStats {
  id: string;
  seen: number;
  correct: number;
  wrong: number;
  streak: number;
  last: number;
  due: number;
  interval: number;
  level: number;
  totalMs: number;
  pending: boolean;
  confusions: Record<string, number>;
  xp: number;
}
