import { describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  accuracy,
  byId,
  countries,
  defaultConfig,
  deriveStats,
  earnedAchievements,
  failedIds,
  formatFor,
  getPool,
  identify,
  makeSession,
  normalize,
  optionsFor,
  recordKey,
  scoreAnswer,
} from "../../src/domain";
import {
  createAvalanche,
  tickAvalanche,
  answerAvalanche,
  usePower,
} from "../../src/avalanche";
import {
  initialData,
  loadData,
  saveData,
  validateBackup,
} from "../../src/storage";
import type { Answer, Session } from "../../src/types";
const event = (id = "br", correct = true, at = Date.now()): Answer => ({
  id: crypto.randomUUID(),
  countryId: id,
  correct,
  at,
  ms: 1200,
  kind: "answer",
  format: "typing",
});
const session = (events: Answer[] = []): Session => ({
  ...makeSession(defaultConfig, initialData()),
  events,
  status: "completed",
  cursor: events.length,
});
describe("Catálogo auditado", () => {
  it("contém exatamente 196 IDs, nomes e códigos únicos e SVGs existentes", () => {
    expect(countries).toHaveLength(196);
    for (const key of ["id", "name", "code"] as const)
      expect(new Set(countries.map((c) => c[key])).size).toBe(196);
    for (const c of countries) {
      const svg = readFileSync(`public/flags/${c.id}.svg`, "utf8");
      expect(svg).toContain("<svg");
      expect(c.aspect).toBeGreaterThan(0);
      expect(c.similar.every((id) => !!byId[id] && id !== c.id)).toBe(true);
    }
  });
  it("preserva convenção e proporções singulares", () => {
    expect(byId.tw).toBeTruthy();
    expect(byId.xk).toBeTruthy();
    expect(byId.va).toBeTruthy();
    expect(byId.ps).toBeUndefined();
    expect(byId.ch.aspect).toBe(1);
    expect(byId.va.aspect).toBe(1);
    expect(byId.np.aspect).toBeLessThan(1);
  });
  it("normaliza sem aceitar países diferentes por aproximação", () => {
    expect(normalize("  SÃO   TOMÉ E PRÍNCIPE ")).toBe("sao tome e principe");
    expect(identify("brasil")?.id).toBe("br");
    expect(identify("romenia")?.id).toBe("ro");
    expect(identify("chade")?.id).toBe("td");
    expect(identify("brasilx")).toBeUndefined();
    expect(identify("Guiné")?.id).not.toBe("gw");
  });
  it("oferece quatro alternativas únicas e distribui posições sem um lugar fixo", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 150; i++) {
      const opts = optionsFor("td", 4, `seed-${i}`);
      expect(new Set(opts).size).toBe(4);
      expect(opts).toContain("td");
      positions.add(opts.indexOf("td"));
    }
    expect(positions.size).toBe(4);
    expect(optionsFor("br", 25, "grid")).toHaveLength(25);
  });
  it("respeita pesos do modo misto", () => {
    expect(
      formatFor({ ...defaultConfig, format: "mixed", weights: [0, 1, 0] }, "a"),
    ).toBe("names");
  });
});
describe("Aprendizagem e revisão", () => {
  it("revisa 196 erros e depois reduz para os restantes sem apagar o histórico", () => {
    const first = session(countries.map((c) => event(c.id, false)));
    expect(failedIds(first)).toHaveLength(196);
    const data = { ...initialData(), sessions: [first] };
    const review = makeSession({ ...defaultConfig, count: 196 }, data, {
      ids: failedIds(first),
      rootId: first.id,
    });
    expect(review.kind).toBe("review");
    expect(review.questionIds).toHaveLength(196);
    review.events = review.questionIds.map((id, i) =>
      event(id, i >= 16, Date.now() + 100),
    );
    const stats = deriveStats([first, review]);
    expect(Object.values(stats).filter((s) => s.pending)).toHaveLength(16);
    expect(Object.values(stats).every((s) => s.wrong >= 1)).toBe(true);
    expect(failedIds(review)).toHaveLength(16);
  });
  it("suporta nenhum erro e não cria revisão falsa", () => {
    const s = session(countries.map((c) => event(c.id)));
    expect(failedIds(s)).toEqual([]);
    expect(
      getPool(
        { ...defaultConfig, pool: "pending" },
        { ...initialData(), sessions: [s] },
      ),
    ).toEqual([]);
  });
  it("repetição no mesmo dia não simula domínio", () => {
    const stats = deriveStats([
      session(
        Array.from({ length: 20 }, (_, i) =>
          event("br", true, 1000 + i * 1000),
        ),
      ),
    ]);
    expect(stats.br.level).toBe(3);
    expect(stats.br.interval).toBe(1);
  });
  it("revisões espaçadas permitem domínio e erros preservam histórico", () => {
    const day = 86400000;
    const stats = deriveStats([
      session([
        event("br", true, day),
        event("br", true, day * 2),
        event("br", true, day * 4),
        event("br", true, day * 8),
      ]),
    ]);
    expect(stats.br.level).toBe(4);
    expect(stats.br.interval).toBe(8);
    const reset = deriveStats([
      session([event("br", true, day), event("br", false, day * 3)]),
    ]);
    expect(reset.br.pending).toBe(true);
    expect(reset.br.correct).toBe(1);
  });
  it("respostas assistidas não geram domínio, XP nem precisão", () => {
    const e = { ...event(), kind: "assist" as const };
    expect(deriveStats([session([e])]).br.seen).toBe(0);
    expect(accuracy([e])).toBe(0);
  });
  it("separa recordes por vantagens", () => {
    const a = session();
    const b = { ...a, config: { ...a.config, powers: false } };
    expect(recordKey(a)).not.toBe(recordKey(b));
  });
  it("desbloqueia conquistas com eventos reais", () => {
    expect(earnedAchievements([session([event()])])).toContain("first");
    expect(earnedAchievements([])).toEqual([]);
  });
  it("pontua de forma determinística e limita multiplicadores", () => {
    expect(scoreAnswer(1, 1000, 0)).toBe(170);
    expect(scoreAnswer(1, 1000, 100)).toBe(scoreAnswer(1, 1000, 20));
  });
});
describe("Motor Avalanche", () => {
  const config = { ...defaultConfig, mode: "avalanche" as const };
  it("elimina primeiro a duplicata mais perto do chão", () => {
    const a = createAvalanche(config);
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 20, duration: 10000, born: 0 },
      { id: 2, countryId: "br", x: 50, y: 70, duration: 10000, born: 0 },
    ];
    expect(answerAvalanche(a, "br")?.correct).toBe(true);
    expect(a.flags.map((f) => f.id)).toEqual([1]);
  });
  it("aplica colisão uma vez e termina ao zerar vidas", () => {
    const a = createAvalanche({ ...config, lives: 1 });
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 99, duration: 1000, born: 0 },
    ];
    expect(tickAvalanche(a, 100, config, ["br"])).toHaveLength(1);
    expect(a.lives).toBe(0);
    expect(a.ended).toBe(true);
    expect(answerAvalanche(a, "br")).toBeNull();
    expect(tickAvalanche(a, 100, config, ["br"])).toEqual([]);
  });
  it("resposta processada antes da colisão remove a bandeira, sem cobrar vida", () => {
    const a = createAvalanche(config);
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 99, duration: 1000, born: 0 },
    ];
    answerAvalanche(a, "br");
    expect(tickAvalanche(a, 100, config, ["br"])).toHaveLength(0);
    expect(a.lives).toBe(3);
  });
  it("congelar impede movimento e tem cargas limitadas", () => {
    const a = createAvalanche(config);
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 30, duration: 10000, born: 0 },
    ];
    usePower(a, "freeze", config);
    tickAvalanche(a, 100, config, ["br"]);
    expect(a.flags[0].y).toBe(30);
    expect(usePower(a, "freeze", config)).toBe(false);
    expect(usePower(a, "life", config)).toBe(false);
  });
  it("escudo absorve uma queda sem criar acerto", () => {
    const a = createAvalanche(config);
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 99, duration: 1000, born: 0 },
    ];
    usePower(a, "shield", config);
    const events = tickAvalanche(a, 100, config, ["br"]);
    expect(a.lives).toBe(3);
    expect(a.shield).toBe(false);
    expect(events[0].kind).toBe("assist");
  });
  it("raio-X concede resposta assistida sem inflar combo", () => {
    const a = createAvalanche(config);
    a.flags = [
      { id: 1, countryId: "br", x: 20, y: 30, duration: 10000, born: 0 },
    ];
    usePower(a, "xray", config);
    expect(answerAvalanche(a, "br")?.kind).toBe("assist");
    expect(a.combo).toBe(0);
    expect(a.score).toBe(25);
  });
  it("progressão respeita capacidade e duração mínima", () => {
    const a = createAvalanche({ ...config, lives: 10 });
    for (let i = 0; i < 6000; i++) {
      a.lives = 10;
      tickAvalanche(
        a,
        100,
        { ...config, lives: 10 },
        ["br", "jp", "de"],
        () => 0.5,
      );
      expect(a.flags.length).toBeLessThanOrEqual(5);
      expect(a.flags.every((f) => f.duration >= 5500)).toBe(true);
    }
    expect(a.maxSpeed).toBeLessThanOrEqual(2.6);
  });
});
describe("Persistência e backup", () => {
  it("sobrevive a uma nova leitura do IndexedDB", async () => {
    const data = { ...initialData(), sessions: [session([event()])] };
    await saveData(data);
    expect((await loadData()).sessions[0].events[0].countryId).toBe("br");
  });
  it("exportação e importação mantêm dados", () => {
    const data = {
      ...initialData(),
      sessions: [session([event("jp", false)])],
    };
    expect(validateBackup(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
  it("rejeita versão desconhecida, país inválido e duplicação", () => {
    expect(() => validateBackup({ version: 9 })).toThrow();
    const bad = session([{ ...event(), countryId: "xx" }]);
    expect(() =>
      validateBackup({ ...initialData(), sessions: [bad] }),
    ).toThrow();
    const good = session();
    expect(() =>
      validateBackup({ ...initialData(), sessions: [good, good] }),
    ).toThrow();
  });
});
