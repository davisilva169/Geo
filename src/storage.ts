import { openDB } from "idb";
import type { Snapshot, Session, Answer } from "./types";
import { byId } from "./domain";
export const initialData = (): Snapshot => ({
  version: 1,
  settings: {
    sound: true,
    volume: 0.25,
    motion: true,
    transition: 1,
    theme: "light",
    aliases: true,
    relief: true,
    haptics: false,
    dailyGoal: 20,
    format: "typing",
  },
  sessions: [],
  active: null,
  achievements: {},
});
const db = () =>
  openDB("geo-learning", 1, {
    upgrade(database) {
      database.createObjectStore("state");
    },
  });
export async function loadData(): Promise<Snapshot> {
  const database = await db();
  const stored = await database.get("state", "snapshot");
  database.close();
  return stored ? validateBackup(stored) : initialData();
}
let queue = Promise.resolve();
export function saveData(data: Snapshot) {
  const copy = structuredClone(data);
  const task = queue
    .catch(() => {})
    .then(async () => {
      const database = await db();
      await database.put("state", copy, "snapshot");
      database.close();
    });
  queue = task;
  return task;
}
export function flushData() {
  return queue;
}
const finite = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0;
function validEvent(e: Answer) {
  return (
    e &&
    typeof e.id === "string" &&
    !!byId[e.countryId] &&
    (!e.selectedId || !!byId[e.selectedId]) &&
    typeof e.correct === "boolean" &&
    finite(e.at) &&
    finite(e.ms) &&
    ["answer", "miss", "assist"].includes(e.kind) &&
    typeof e.format === "string"
  );
}
function validSession(s: Session) {
  const c = s?.config;
  return (
    s &&
    typeof s.id === "string" &&
    ["normal", "avalanche", "radar"].includes(s.mode) &&
    ["complete", "review", "practice"].includes(s.kind) &&
    ["playing", "completed", "abandoned"].includes(s.status) &&
    finite(s.startedAt) &&
    finite(s.elapsed) &&
    finite(s.score) &&
    finite(s.bestCombo) &&
    Array.isArray(s.events) &&
    s.events.every(validEvent) &&
    Array.isArray(s.questionIds) &&
    s.questionIds.length > 0 &&
    s.questionIds.every((id) => !!byId[id]) &&
    Number.isInteger(s.cursor) &&
    s.cursor >= 0 &&
    s.cursor <= s.events.length &&
    c &&
    ["typing", "names", "flags", "mixed"].includes(c.format) &&
    [
      "all",
      "new",
      "last",
      "last-complete",
      "pending",
      "hard",
      "smart",
    ].includes(c.pool) &&
    finite(c.count) &&
    [1, 3, 5, 10].includes(c.lives) &&
    c.speed >= 0.3 &&
    c.speed <= 3 &&
    [4, 9, 16, 25].includes(c.grid) &&
    c.roundTime >= 3 &&
    c.roundTime <= 60 &&
    finite(c.maxDuration) &&
    typeof c.powers === "boolean" &&
    Array.isArray(c.weights) &&
    c.weights.length === 3 &&
    c.weights.every(finite) &&
    c.weights.reduce((a, b) => a + b, 0) > 0 &&
    s.runtime &&
    typeof s.runtime === "object"
  );
}
export function validateBackup(value: unknown): Snapshot {
  if (!value || typeof value !== "object")
    throw Error("Este arquivo não contém um backup do Geo.");
  const data = value as Snapshot;
  if (data.version !== 1)
    throw Error(
      "Versão de backup incompatível. Seus dados atuais foram preservados.",
    );
  if (
    !Array.isArray(data.sessions) ||
    data.sessions.length > 100000 ||
    !data.sessions.every(validSession) ||
    (data.active !== null && !validSession(data.active))
  )
    throw Error("O histórico do backup está incompleto ou inválido.");
  const ids = data.sessions.map((s) => s.id);
  if (
    new Set(ids).size !== ids.length ||
    (data.active && ids.includes(data.active.id))
  )
    throw Error("O backup contém sessões duplicadas.");
  const prefs = data.settings;
  const defaults = initialData();
  if (
    !prefs ||
    !["light", "dark", "system"].includes(prefs.theme) ||
    !finite(prefs.volume) ||
    prefs.volume > 1 ||
    !finite(prefs.dailyGoal) ||
    prefs.dailyGoal > 196 ||
    !["typing", "names", "flags", "mixed"].includes(prefs.format)
  )
    throw Error("Preferências inválidas no backup.");
  for (const k of ["sound", "motion", "aliases", "relief", "haptics"] as const)
    if (typeof prefs[k] !== "boolean")
      throw Error("Preferências inválidas no backup.");
  const result = {
    ...defaults,
    ...data,
    settings: { ...defaults.settings, ...prefs },
    achievements: { ...data.achievements },
  };
  // Runtime is validated separately; unknown in-flight snapshots resume from a safe checkpoint.
  if (
    result.active?.runtime.feedback &&
    !validEvent(result.active.runtime.feedback)
  )
    throw Error("Resposta de retomada inválida.");
  if (result.active?.runtime.avalanche) {
    const a = result.active.runtime.avalanche;
    if (
      !finite(a.elapsed) ||
      !finite(a.lives) ||
      !Array.isArray(a.flags) ||
      a.flags.some(
        (f) =>
          !byId[f.countryId] ||
          !finite(f.x) ||
          !finite(f.y) ||
          !finite(f.duration),
      ) ||
      !a.charges
    )
      throw Error("Estado da partida inválido.");
  }
  return result;
}
export function downloadBackup(data: Snapshot, prefix = "geo-backup") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
