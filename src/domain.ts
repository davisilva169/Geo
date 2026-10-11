import raw from "./data/countries.json";
import type {
  Country,
  CountryStats,
  GameConfig,
  Session,
  Snapshot,
  Answer,
  Format,
} from "./types";
export const countries = raw as Country[];
export const byId = Object.fromEntries(
  countries.map((c) => [c.id, c]),
) as Record<string, Country>;
export const continents = [
  "África",
  "América do Norte",
  "América do Sul",
  "Ásia",
  "Europa",
  "Oceania",
];
export const levelNames = [
  "Não estudado",
  "Iniciante",
  "Em aprendizado",
  "Familiar",
  "Dominado",
];
export const modeNames = {
  normal: "Normal",
  avalanche: "Avalanche",
  radar: "Radar",
};
export const defaultConfig: GameConfig = {
  mode: "normal",
  format: "typing",
  pool: "all",
  continent: "all",
  count: 20,
  weights: [1, 1, 1],
  preset: "Normal",
  lives: 3,
  speed: 1,
  powers: true,
  maxDuration: 0,
  grid: 9,
  roundTime: 12,
  radarProgression: false,
  radarEvent: "classic",
  enter: true,
  mobile: false,
  inputMode: "typing",
};
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function identify(input: string, aliases = true) {
  const value = normalize(input);
  return countries.find(
    (c) =>
      normalize(c.name) === value ||
      (aliases && c.aliases.some((a) => normalize(a) === value)),
  );
}
export function seeded(seed: string) {
  let n = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  return () => {
    n = (Math.imul(1664525, n) + 1013904223) | 0;
    return (n >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function optionsFor(
  id: string,
  count: number,
  seed: string,
  confusions: string[] = [],
) {
  const random = seeded(seed);
  const similar = shuffle(
    [...new Set([...confusions, ...byId[id].similar])].filter(
      (x) => x !== id && byId[x],
    ),
    random,
  );
  const rest = shuffle(
    countries
      .filter((c) => c.id !== id && !similar.includes(c.id))
      .map((c) => c.id),
    random,
  );
  return shuffle([id, ...[...similar, ...rest].slice(0, count - 1)], random);
}
export function formatFor(
  config: GameConfig,
  seed: string,
): Exclude<Format, "mixed"> {
  if (config.format !== "mixed") return config.format;
  const w = config.weights;
  let n = seeded(seed)() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 3; i++) {
    n -= w[i];
    if (n < 0) return (["typing", "names", "flags"] as const)[i];
  }
  return "typing";
}
export function emptyStats(id: string): CountryStats {
  return {
    id,
    seen: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    last: 0,
    due: 0,
    interval: 0,
    level: 0,
    totalMs: 0,
    pending: false,
    confusions: {},
    xp: 0,
  };
}
const DAY = 86400000;
export function deriveStats(sessions: Session[]): Record<string, CountryStats> {
  const stats = Object.fromEntries(
    countries.map((c) => [c.id, emptyStats(c.id)]),
  );
  const events = sessions
    .flatMap((s) => s.events)
    .filter((e) => e.kind !== "assist")
    .sort((a, b) => a.at - b.at);
  const seen = new Set<string>();
  for (const e of events) {
    if (seen.has(e.id) || !stats[e.countryId]) continue;
    seen.add(e.id);
    const s = stats[e.countryId];
    const oldLast = s.last;
    const oldDue = s.due;
    const wasPending = s.pending;
    s.seen++;
    s.totalMs += e.ms;
    s.last = e.at;
    if (e.correct) {
      s.correct++;
      s.streak++;
      s.pending = false;
      const spaced = oldLast === 0 || e.at - oldLast >= DAY * 0.75;
      if (spaced) s.interval = Math.min(60, Math.max(1, s.interval * 2));
      if (spaced || wasPending) s.due = e.at + Math.max(1, s.interval) * DAY;
      s.xp += s.correct === 1 ? 20 : e.at >= oldDue ? 10 : 1;
    } else {
      s.wrong++;
      s.streak = 0;
      s.pending = true;
      s.interval = 0;
      s.due = e.at + 10 * 60000;
      if (e.selectedId && e.selectedId !== e.countryId)
        s.confusions[e.selectedId] = (s.confusions[e.selectedId] || 0) + 1;
    }
    s.level =
      s.streak === 0
        ? 1
        : s.streak < 2
          ? 2
          : s.streak >= 4 && s.interval >= 8 && s.correct / s.seen >= 0.75
            ? 4
            : 3;
  }
  return stats;
}
export function allSessions(data: Snapshot) {
  return data.active ? [...data.sessions, data.active] : data.sessions;
}
export function failedIds(s: Session) {
  return [
    ...new Set(
      s.events
        .filter((e) => !e.correct && e.kind !== "assist")
        .map((e) => e.countryId),
    ),
  ];
}
export function getPool(
  config: GameConfig,
  data: Snapshot,
  now = Date.now(),
): string[] {
  const stats = deriveStats(allSessions(data));
  let list = countries;
  if (config.continent !== "all")
    list = list.filter((c) => c.continent === config.continent);
  const last = [...data.sessions]
    .reverse()
    .find((s) => s.status === "completed");
  const complete = [...data.sessions]
    .reverse()
    .find(
      (s) =>
        s.status === "completed" &&
        s.kind === "complete" &&
        s.mode === "normal",
    );
  const failed =
    config.pool === "last-complete"
      ? complete
        ? failedIds(complete)
        : []
      : last
        ? failedIds(last)
        : [];
  if (config.pool === "new") list = list.filter((c) => !stats[c.id].seen);
  if (config.pool === "last" || config.pool === "last-complete")
    list = list.filter((c) => failed.includes(c.id));
  if (config.pool === "pending") list = list.filter((c) => stats[c.id].pending);
  if (config.pool === "hard")
    list = list.filter(
      (c) =>
        stats[c.id].wrong > 0 &&
        stats[c.id].wrong / Math.max(1, stats[c.id].seen) >= 0.25,
    );
  if (config.pool === "smart")
    list = list
      .filter((c) => !stats[c.id].seen || stats[c.id].due <= now)
      .sort(
        (a, b) =>
          Number(stats[b.id].pending) - Number(stats[a.id].pending) ||
          stats[a.id].due - stats[b.id].due,
      );
  return list.map((c) => c.id);
}
export function makeSession(
  config: GameConfig,
  data: Snapshot,
  review?: { ids: string[]; rootId: string },
): Session {
  const pool = review?.ids || getPool(config, data);
  const size =
    config.mode === "avalanche"
      ? pool.length
      : config.count === 0
        ? pool.length
        : Math.min(config.count, pool.length);
  const questionIds =
    config.pool === "smart"
      ? pool.slice(0, size)
      : shuffle(pool).slice(0, size);
  const isFull = config.mode === "normal" && questionIds.length === 196;
  return {
    id: crypto.randomUUID(),
    mode: config.mode,
    kind: review ? "review" : isFull ? "complete" : "practice",
    rootId: review?.rootId,
    config,
    startedAt: Date.now(),
    status: "playing",
    elapsed: 0,
    score: 0,
    bestCombo: 0,
    events: [],
    questionIds,
    cursor: 0,
    runtime: {},
  };
}
export function accuracy(events: Answer[]) {
  const scored = events.filter((e) => e.kind !== "assist");
  return scored.length
    ? Math.round((scored.filter((e) => e.correct).length / scored.length) * 100)
    : 0;
}
export function prettyTime(ms: number) {
  const sec = Math.floor(ms / 1000);
  return `${Math.floor(sec / 60)
    .toString()
    .padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
}
export function scoreAnswer(
  difficulty: number,
  ms: number,
  combo: number,
  bonus = false,
) {
  return Math.round(
    (100 + 25 * difficulty + Math.max(0, 50 - Math.floor(ms / 200))) *
      (1 + Math.min(3, Math.floor(combo / 5)) * 0.25) *
      (bonus ? 1.5 : 1),
  );
}
export function recordKey(s: Session) {
  const c = s.config;
  return JSON.stringify([
    s.mode,
    c.preset,
    c.lives,
    c.speed,
    c.powers,
    c.maxDuration,
    c.grid,
    c.roundTime,
    c.radarEvent,
    c.radarProgression || false,
    c.inputMode,
    c.mobile,
    c.enter,
    c.pool,
    c.continent,
    c.count,
  ]);
}
export const achievementDefinitions = [
  {
    id: "first",
    name: "Primeiro destino",
    description: "Identifique sua primeira bandeira.",
    icon: "flag",
  },
  {
    id: "ten",
    name: "Passaporte aberto",
    description: "Conheça 10 países.",
    icon: "book",
  },
  {
    id: "fifty",
    name: "Mundo afora",
    description: "Estude 50 países.",
    icon: "globe",
  },
  {
    id: "hundred",
    name: "Memória de explorador",
    description: "Domine 100 países com revisões espaçadas.",
    icon: "brain",
  },
  {
    id: "world",
    name: "O mundo é seu",
    description: "Domine as 196 bandeiras.",
    icon: "globe",
  },
  {
    id: "review",
    name: "Nenhum erro fica para trás",
    description: "Conclua uma revisão sem erros.",
    icon: "check",
  },
  {
    id: "combo10",
    name: "No ritmo",
    description: "Acerte 10 vezes seguidas.",
    icon: "zap",
  },
  {
    id: "combo50",
    name: "Imparável",
    description: "Acerte 50 vezes seguidas.",
    icon: "zap",
  },
  {
    id: "survive",
    name: "Acima da tempestade",
    description: "Sobreviva por 5 minutos no Avalanche.",
    icon: "mountain",
  },
  {
    id: "radar",
    name: "Olhar de águia",
    description: "Termine um Radar sem erros.",
    icon: "scan",
  },
  {
    id: "continent",
    name: "Um continente na memória",
    description: "Domine todas as bandeiras de um continente.",
    icon: "map",
  },
];
export function earnedAchievements(sessions: Session[]) {
  const stats = Object.values(deriveStats(sessions));
  const studied = stats.filter((s) => s.seen).length;
  const mastered = stats.filter((s) => s.level === 4).length;
  const best = Math.max(0, ...sessions.map((s) => s.bestCombo));
  return [
    stats.some((s) => s.correct) && "first",
    studied >= 10 && "ten",
    studied >= 50 && "fifty",
    mastered >= 100 && "hundred",
    mastered === 196 && "world",
    sessions.some(
      (s) =>
        s.kind === "review" &&
        s.status === "completed" &&
        accuracy(s.events) === 100,
    ) && "review",
    best >= 10 && "combo10",
    best >= 50 && "combo50",
    sessions.some((s) => s.mode === "avalanche" && s.elapsed >= 300000) &&
      "survive",
    sessions.some(
      (s) =>
        s.mode === "radar" &&
        s.status === "completed" &&
        accuracy(s.events) === 100,
    ) && "radar",
    continents.some((cont) =>
      countries
        .filter((c) => c.continent === cont)
        .every((c) => stats.find((s) => s.id === c.id)?.level === 4),
    ) && "continent",
  ].filter(Boolean) as string[];
}
