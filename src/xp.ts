// Custo para passar do nível n ao n + 1, baseado na curva enviada como referência.
const XP_GROWTH_A = 150;
const XP_GROWTH_EXP = 2.25;
const XP_GROWTH_B = 100;

const thresholds = [0, 0]; // índice = nível; nível 1 começa em 0 XP.

export function xpRequiredToAdvance(level: number): number {
  if (level < 1) return 0;
  return Math.floor(XP_GROWTH_A * level ** XP_GROWTH_EXP + XP_GROWTH_B * level);
}

export function xpThresholdForLevel(level: number): number {
  const target = Math.max(1, Math.floor(level));
  while (thresholds.length <= target) {
    const previous = thresholds.length - 1;
    thresholds.push(thresholds[previous] + xpRequiredToAdvance(previous));
  }
  return thresholds[target];
}

export function levelFromXp(xp: number): number {
  const total = Math.max(0, Math.floor(xp));
  let level = 1;
  while (xpThresholdForLevel(level + 1) <= total) level++;
  return level;
}

export function progressToNextLevel(xp: number) {
  const total = Math.max(0, Math.floor(xp));
  const level = levelFromXp(total);
  const current = total - xpThresholdForLevel(level);
  const needed = xpRequiredToAdvance(level);
  return {
    level,
    current,
    needed,
    remaining: needed - current,
    ratio: current / needed,
  };
}
