import type { AvalancheState, GameConfig, Answer, Power } from "./types";
import { byId, scoreAnswer } from "./domain";
export const powerNames: Record<Power, string> = {
  freeze: "Congelar",
  slow: "Câmera lenta",
  shield: "Escudo",
  clear: "Limpeza",
  xray: "Raio-X",
  life: "Vida extra",
};
export const powerList = Object.keys(powerNames) as Power[];
export function createAvalanche(config: GameConfig): AvalancheState {
  return {
    elapsed: 0,
    score: 0,
    lives: config.lives,
    combo: 0,
    bestCombo: 0,
    flags: [],
    nextId: 1,
    spawnAt: 0,
    freezeUntil: 0,
    slowUntil: 0,
    xrayUntil: 0,
    shield: false,
    charges: { freeze: 1, slow: 1, shield: 1, clear: 1, xray: 1, life: 1 },
    event: "",
    eventUntil: 0,
    nextEventAt: 35000,
    level: 1,
    maxSpeed: 1,
    rewarded: 0,
    ended: false,
  };
}
export function avalancheEvent(a: AvalancheState) {
  return a.elapsed < a.eventUntil ? a.event : "";
}
export function tickAvalanche(
  a: AvalancheState,
  dt: number,
  c: GameConfig,
  pool: string[],
  random = Math.random,
): Answer[] {
  if (a.ended) return [];
  const events: Answer[] = [];
  dt = Math.max(0, Math.min(dt, 100));
  a.elapsed += dt;
  a.level = 1 + Math.floor(a.elapsed / 30000);
  const speed =
    Math.min(2.6, c.speed * (1 + a.elapsed / 180000)) * (c.mobile ? 0.8 : 1);
  a.maxSpeed = Math.max(a.maxSpeed, speed);
  if (a.elapsed >= a.nextEventAt) {
    a.event = [
      "Tempestade",
      "Duplas perigosas",
      "Momento zen",
      "Bônus de precisão",
      "Desafio regional",
    ][Math.floor(a.elapsed / 35000 - 1) % 5];
    a.eventUntil = a.elapsed + 10000;
    a.nextEventAt += 35000;
  }
  const event = avalancheEvent(a);
  const freeze = a.elapsed < a.freezeUntil;
  const factor =
    (a.elapsed < a.slowUntil ? 0.5 : 1) * (event === "Momento zen" ? 0.6 : 1);
  for (const f of a.flags) {
    if (!freeze) f.y += ((100 * dt) / f.duration) * factor;
    // Each mistake adds a separate smooth 12% descent over 520ms. Positions stay
    // continuous, repeated mistakes stack, and normal collision rules still apply.
    const ease = (t: number) => {
      const x = Math.min(1, t / 520);
      return x * x * (3 - 2 * x);
    };
    if (f.penalties?.length) {
      f.y += f.penalties.reduce(
        (distance, t) => distance + 12 * (ease(t + dt) - ease(t)),
        0,
      );
      f.penalties = f.penalties.map((t) => t + dt).filter((t) => t < 520);
    }
  }
  for (const f of a.flags.filter((f) => f.y >= 100)) {
    a.flags = a.flags.filter((x) => x.id !== f.id);
    if (a.shield) {
      a.shield = false;
      events.push(
        makeArcadeAnswer(f.countryId, false, a.elapsed - f.born, "assist"),
      );
    } else {
      a.lives--;
      a.combo = 0;
      events.push(
        makeArcadeAnswer(f.countryId, false, a.elapsed - f.born, "miss"),
      );
    }
    if (a.lives <= 0) {
      a.lives = 0;
      a.ended = true;
      break;
    }
  }
  if (c.maxDuration > 0 && a.elapsed >= c.maxDuration * 1000) a.ended = true;
  const capacity = c.mobile ? 3 : 5;
  const safe = !a.flags.some((f) => ((100 - f.y) / 100) * f.duration < 1800);
  if (
    !a.ended &&
    !freeze &&
    a.elapsed >= a.spawnAt &&
    a.flags.length < Math.min(capacity, a.level + 1) &&
    safe &&
    pool.length
  ) {
    let candidates = pool;
    if (event === "Duplas perigosas" && a.flags.length) {
      const similar = byId[a.flags[0].countryId].similar.filter((id) =>
        pool.includes(id),
      );
      if (similar.length) candidates = similar;
    }
    if (event === "Desafio regional") {
      const continent =
        byId[pool[Math.floor(a.elapsed / 35000) % pool.length]].continent;
      candidates = pool.filter((id) => byId[id].continent === continent);
    }
    const weighted = candidates.flatMap((id) =>
      Array.from(
        { length: byId[id].difficulty <= Math.min(3, a.level) ? 2 : 1 },
        () => id,
      ),
    );
    const countryId = weighted[Math.floor(random() * weighted.length)];
    const lanes = c.mobile ? [20, 50, 80] : [12, 31, 50, 69, 88];
    const available = lanes.filter(
      (x) => !a.flags.some((f) => Math.abs(f.x - x) < 10 && f.y < 28),
    );
    if (available.length) {
      a.flags.push({
        id: a.nextId++,
        countryId,
        x: available[Math.floor(random() * available.length)],
        y: 0,
        duration: Math.max(5500, 16000 / speed),
        born: a.elapsed,
      });
    }
    a.spawnAt =
      a.elapsed +
      Math.max(c.mobile ? 2600 : 1800, 5500 / speed) *
        (event === "Tempestade" ? 0.75 : 1);
  }
  return events;
}
export function makeArcadeAnswer(
  countryId: string,
  correct: boolean,
  ms: number,
  kind: Answer["kind"] = "answer",
  selectedId?: string,
): Answer {
  return {
    id: crypto.randomUUID(),
    countryId,
    correct,
    ms: Math.round(ms),
    at: Date.now(),
    kind,
    format: "typing",
    selectedId,
  };
}
export function answerAvalanche(a: AvalancheState, id: string): Answer | null {
  if (a.ended) return null;
  const f = a.flags
    .filter((x) => x.countryId === id)
    .sort((x, y) => y.y - x.y)[0];
  if (!f) return null;
  a.flags = a.flags.filter((x) => x.id !== f.id);
  if (a.elapsed < a.xrayUntil) {
    a.score += 25;
    return makeArcadeAnswer(id, true, a.elapsed - f.born, "assist");
  }
  a.combo++;
  a.bestCombo = Math.max(a.bestCombo, a.combo);
  const ms = a.elapsed - f.born;
  a.score += scoreAnswer(
    byId[id].difficulty,
    ms,
    a.combo,
    avalancheEvent(a) === "Bônus de precisão",
  );
  const reward = Math.floor(a.combo / 10);
  if (reward > a.rewarded) {
    const p = powerList[(reward - 1) % powerList.length];
    a.charges[p] = Math.min(2, a.charges[p] + 1);
    a.rewarded = reward;
  }
  return makeArcadeAnswer(id, true, ms);
}
export function usePower(
  a: AvalancheState,
  power: Power,
  c: GameConfig,
): Answer | null | false {
  if (!c.powers || a.ended || a.charges[power] <= 0) return false;
  if (power === "life" && a.lives >= c.lives) return false;
  if (power === "clear" && !a.flags.length) return false;
  a.charges[power]--;
  if (power === "freeze") a.freezeUntil = a.elapsed + 4000;
  if (power === "slow") a.slowUntil = a.elapsed + 7000;
  if (power === "shield") a.shield = true;
  if (power === "xray") a.xrayUntil = a.elapsed + 2500;
  if (power === "life") a.lives = Math.min(c.lives, a.lives + 1);
  if (power === "clear") {
    const f = [...a.flags].sort((x, y) => y.y - x.y)[0];
    a.flags = a.flags.filter((x) => x.id !== f.id);
    a.score += 25;
    return makeArcadeAnswer(f.countryId, false, a.elapsed - f.born, "assist");
  }
  return null;
}

export function penalizeChoice(a: AvalancheState) {
  if (a.ended) return;
  a.combo = 0;
  for (const flag of a.flags) (flag.penalties ||= []).push(0);
}
