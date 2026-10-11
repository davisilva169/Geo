import { describe, it, expect } from "vitest";
import { countries, defaultConfig, makeSession } from "../../src/domain";
import { initialData } from "../../src/storage";
import { quizFeedback, recordQuizAnswer, advanceQuiz } from "../../src/quiz";
import {
  createAvalanche,
  penalizeChoice,
  tickAvalanche,
} from "../../src/avalanche";
import type { Answer } from "../../src/types";
describe("Normal: regressão de sessões longas", () => {
  it("registra e avança todos os 196 países exatamente uma vez", () => {
    let s = makeSession({ ...defaultConfig, count: 196 }, initialData());
    for (let i = 0; i < 196; i++) {
      const e: Answer = {
        id: String(i),
        countryId: s.questionIds[i],
        correct: true,
        kind: "answer",
        format: "typing",
        at: Date.now(),
        ms: 1000,
      };
      s = recordQuizAnswer(s, i, e, i * 1000);
      expect(quizFeedback(s)?.id).toBe(String(i));
      s = advanceQuiz(s, i, 12000);
    }
    expect(s.status).toBe("completed");
    expect(s.events).toHaveLength(196);
  });
  it("recupera uma resposta persistida mesmo se o checkpoint de feedback faltar", () => {
    let s = makeSession({ ...defaultConfig, count: 196 }, initialData());
    for (let i = 0; i < 154; i++) {
      const e: Answer = {
        id: String(i),
        countryId: s.questionIds[i],
        correct: true,
        kind: "answer",
        format: "typing",
        at: Date.now(),
        ms: 1000,
      };
      s = recordQuizAnswer(s, i, e, i * 1000);
      if (i < 153) s = advanceQuiz(s, i, 12000);
    }
    s = { ...s, runtime: { radarRemaining: 10000 } };
    expect(s.cursor).toBe(153);
    expect(quizFeedback(s)?.id).toBe("153");
    s = advanceQuiz(s, 153, 12000);
    expect(s.cursor).toBe(154);
    expect(quizFeedback(s)).toBeUndefined();
  });
  it("ignora Enter duplicado e avanço de uma renderização antiga", () => {
    let s = makeSession(defaultConfig, initialData());
    const e: Answer = {
      id: "one",
      countryId: s.questionIds[0],
      correct: true,
      kind: "answer",
      format: "typing",
      at: Date.now(),
      ms: 1000,
    };
    s = recordQuizAnswer(s, 0, e, 1000);
    expect(recordQuizAnswer(s, 0, e, 1000)).toBe(s);
    s = advanceQuiz(s, 0, 12000);
    expect(advanceQuiz(s, 0, 12000)).toBe(s);
    expect(s.cursor).toBe(1);
  });
});
describe("Avalanche: punição progressiva por escolha errada", () => {
  const c = {
    ...defaultConfig,
    mode: "avalanche" as const,
    inputMode: "choice" as const,
  };
  function fixture() {
    const a = createAvalanche(c);
    a.freezeUntil = 10000;
    a.spawnAt = 10000;
    a.combo = 7;
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 10, duration: 15000, born: 0 },
      { id: 2, countryId: "jp", x: 60, y: 30, duration: 15000, born: 0 },
    ];
    return a;
  }
  it("move TODAS as bandeiras 12% com continuidade, mesmo congeladas", () => {
    const a = fixture();
    penalizeChoice(a);
    expect(a.combo).toBe(0);
    expect(a.flags[0].y).toBe(10);
    tickAvalanche(a, 100, c, ["br"]);
    expect(a.flags[0].y).toBeGreaterThan(10);
    expect(a.flags[0].y).toBeLessThan(22);
    for (let i = 0; i < 5; i++) tickAvalanche(a, 100, c, ["br"]);
    expect(a.flags[0].y).toBeCloseTo(22);
    expect(a.flags[1].y).toBeCloseTo(42);
  });
  it("erros seguidos acumulam a queda em vez de reiniciar a punição", () => {
    const a = fixture();
    penalizeChoice(a);
    tickAvalanche(a, 100, c, ["br"]);
    penalizeChoice(a);
    for (let i = 0; i < 6; i++) tickAvalanche(a, 100, c, ["br"]);
    expect(a.flags[0].y).toBeCloseTo(34);
    expect(a.flags[1].y).toBeCloseTo(54);
  });
  it("a queda extra pode cobrar vidas e terminar a partida", () => {
    const a = fixture();
    a.lives = 1;
    a.flags[0].y = 95;
    penalizeChoice(a);
    let misses = 0;
    for (let i = 0; i < 6; i++)
      misses += tickAvalanche(a, 100, c, ["br"]).length;
    expect(misses).toBe(1);
    expect(a.lives).toBe(0);
    expect(a.ended).toBe(true);
  });
});
