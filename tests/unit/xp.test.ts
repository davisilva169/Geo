import { describe, expect, it } from "vitest";
import {
  levelFromXp,
  progressToNextLevel,
  xpRequiredToAdvance,
  xpThresholdForLevel,
} from "../../src/xp";

describe("progressão de níveis", () => {
  it("usa os custos crescentes da curva de referência", () => {
    expect([1, 2, 3].map(xpRequiredToAdvance)).toEqual([250, 913, 2076]);
    expect([1, 2, 3, 4].map(xpThresholdForLevel)).toEqual([0, 250, 1163, 3239]);
  });

  it("respeita cada lado dos marcos cumulativos e calcula o progresso", () => {
    expect(levelFromXp(249)).toBe(1);
    expect(levelFromXp(250)).toBe(2);
    expect(levelFromXp(1162)).toBe(2);
    expect(levelFromXp(1163)).toBe(3);
    expect(levelFromXp(3238)).toBe(3);
    expect(levelFromXp(3239)).toBe(4);
    expect(progressToNextLevel(500)).toEqual({
      level: 2,
      current: 250,
      needed: 913,
      remaining: 663,
      ratio: 250 / 913,
    });
  });
});
