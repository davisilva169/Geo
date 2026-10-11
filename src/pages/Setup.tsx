import { useState } from "react";
import {
  ArrowRight,
  Check,
  Settings2,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import { useStore } from "../store";
import {
  defaultConfig,
  getPool,
  makeSession,
  modeNames,
  continents,
} from "../domain";
import { Back, Button, Flag, ModeIcon, Modal } from "../components";
import type { GameConfig, Mode } from "../types";
export function Setup({ mode }: { mode: Mode }) {
  const { data, mutate, finish } = useStore();
  const remembered = data.sessions
    .filter((s) => s.mode === mode)
    .at(-1)?.config;
  const [config, setConfig] = useState<GameConfig>({
    ...defaultConfig,
    ...remembered,
    mode,
    format: data.settings.format,
    pool:
      new URLSearchParams(location.hash.split("?")[1]).get("pool") ||
      remembered?.pool ||
      "all",
    mobile: matchMedia("(pointer: coarse)").matches,
  });
  const [confirm, setConfirm] = useState(false);
  const pool = getPool(config, data);
  const change = (patch: Partial<GameConfig>) =>
    setConfig((c) => ({ ...c, ...patch }));
  function start() {
    if (data.active) {
      setConfirm(true);
      return;
    }
    launch();
  }
  function launch() {
    const session = makeSession(config, data);
    mutate((d) => ({ ...d, active: session }));
    location.hash = "/play";
  }
  return (
    <>
      <Back />
      <div className="page-heading">
        <span className={`page-mode-icon ${mode}`}>
          <ModeIcon mode={mode} size={30} />
        </span>
        <div>
          <span className="eyebrow">MONTE SUA PARTIDA</span>
          <h1>{modeNames[mode]}</h1>
          <p>
            {mode === "normal"
              ? "O próximo país que você vai lembrar começa aqui."
              : mode === "avalanche"
                ? "Acerte antes de cair. Encontre o seu ritmo."
                : "Treine seu olhar para reconhecer cada detalhe."}
          </p>
        </div>
      </div>
      <div className="setup-layout">
        <section className="panel setup-panel">
          {mode === "normal" && (
            <fieldset>
              <legend>Como você quer responder?</legend>
              <div className="selection-grid">
                {[
                  ["typing", "Digitar o país", "Bandeira → nome"],
                  ["names", "Escolher um nome", "4 alternativas"],
                  ["flags", "Escolher a bandeira", "Nome → 4 bandeiras"],
                  ["mixed", "Um pouco de tudo", "Alterne os formatos"],
                ].map(([value, title, hint]) => (
                  <button
                    key={value}
                    className={`selection ${config.format === value ? "selected" : ""}`}
                    onClick={() =>
                      change({ format: value as GameConfig["format"] })
                    }
                  >
                    <strong>
                      {title}
                      {config.format === value && <Check size={17} />}
                    </strong>
                    <span>{hint}</span>
                  </button>
                ))}
              </div>
              {config.format === "mixed" && (
                <div className="form-grid">
                  {["Digitação", "Nomes", "Bandeiras"].map((label, i) => (
                    <label key={label}>
                      {label} (peso)
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={config.weights[i]}
                        onChange={(e) =>
                          change({
                            weights: config.weights.map((n, j) =>
                              j === i
                                ? Math.max(
                                    0,
                                    Math.min(10, Number(e.target.value)),
                                  )
                                : n,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}
          <fieldset>
            <legend>Seu mapa de estudo</legend>
            <div className="form-grid">
              <label>
                Quais países?
                <select
                  aria-label="Quais países?"
                  value={config.pool}
                  onChange={(e) => change({ pool: e.target.value })}
                >
                  <option value="all">Todos os países</option>
                  <option value="new">Nunca estudados</option>
                  <option value="last-complete">
                    Erros da última sessão completa
                  </option>
                  <option value="last">Erros da sessão anterior</option>
                  <option value="pending">Todos os erros pendentes</option>
                  <option value="hard">Países difíceis no histórico</option>
                  <option value="smart">Revisão inteligente</option>
                </select>
              </label>
              <label>
                Continente
                <select
                  aria-label="Continente"
                  value={config.continent}
                  onChange={(e) => change({ continent: e.target.value })}
                >
                  <option value="all">O mundo todo</option>
                  {continents.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="field-note">
              {pool.length} países disponíveis
              {config.pool === "smart"
                ? " · Prioriza erros e revisões vencidas."
                : ""}
              .
            </p>
          </fieldset>
          {mode === "normal" && (
            <fieldset>
              <legend>Quanto mundo cabe nesta sessão?</legend>
              <div className="pill-options">
                {[10, 20, 50, 100, 196].map((n) => (
                  <button
                    key={n}
                    className={config.count === n ? "selected" : ""}
                    onClick={() => change({ count: n })}
                  >
                    {n} bandeiras
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {mode === "avalanche" && (
            <>
              <fieldset>
                <legend>Encontre seu ritmo</legend>
                <div className="pill-options">
                  {[
                    ["Relaxado", 0.65, 5],
                    ["Normal", 1, 3],
                    ["Difícil", 1.4, 3],
                    ["Insano", 1.9, 1],
                    ["Personalizado", config.speed, config.lives],
                  ].map(([name, speed, lives]) => (
                    <button
                      key={name}
                      className={config.preset === name ? "selected" : ""}
                      onClick={() =>
                        change({
                          preset: String(name),
                          speed: Number(speed),
                          lives: Number(lives),
                        })
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="form-grid">
                  <label>
                    Vidas
                    <select
                      aria-label="Vidas"
                      value={config.lives}
                      onChange={(e) =>
                        change({
                          lives: Number(e.target.value),
                          preset: "Personalizado",
                        })
                      }
                    >
                      {[1, 3, 5, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "vida" : "vidas"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Velocidade inicial: {config.speed.toFixed(2)}×
                    <input
                      type="range"
                      min=".5"
                      max="2.5"
                      step=".05"
                      value={config.speed}
                      onChange={(e) =>
                        change({
                          speed: Number(e.target.value),
                          preset: "Personalizado",
                        })
                      }
                    />
                  </label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Do seu jeito</legend>
                <div className="form-grid">
                  <label>
                    Limite de duração
                    <select
                      aria-label="Limite de duração"
                      value={config.maxDuration}
                      onChange={(e) =>
                        change({ maxDuration: Number(e.target.value) })
                      }
                    >
                      <option value="0">Sem limite</option>
                      <option value="60">1 minuto</option>
                      <option value="180">3 minutos</option>
                      <option value="300">5 minutos</option>
                      <option value="600">10 minutos</option>
                    </select>
                  </label>
                  <label>
                    Entrada
                    <select
                      aria-label="Entrada"
                      value={config.inputMode}
                      onChange={(e) =>
                        change({
                          inputMode: e.target.value as GameConfig["inputMode"],
                        })
                      }
                    >
                      <option value="typing">Digitação</option>
                      <option value="choice">Escolha rápida (toque)</option>
                    </select>
                  </label>
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={config.powers}
                    onChange={(e) => change({ powers: e.target.checked })}
                  />
                  Poderes e bônus ativados
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={config.enter}
                    onChange={(e) => change({ enter: e.target.checked })}
                  />
                  Confirmar respostas com Enter
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={config.mobile}
                    onChange={(e) => change({ mobile: e.target.checked })}
                  />
                  Ritmo adaptado para celular
                </label>
              </fieldset>
            </>
          )}
          {mode === "radar" && (
            <>
              <fieldset>
                <legend>Quanto mais parecidas, mais interessante</legend>
                <div className="selection-grid">
                  {[
                    [4, "Fácil"],
                    [9, "Normal"],
                    [16, "Difícil"],
                    [25, "Especialista"],
                  ].map(([value, name]) => (
                    <button
                      key={value}
                      className={`selection ${config.grid === value ? "selected" : ""}`}
                      onClick={() => change({ grid: Number(value) })}
                    >
                      <strong>
                        {name}
                        {config.grid === value && <Check size={17} />}
                      </strong>
                      <span>{value} bandeiras na grade</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Configure seu desafio</legend>
                <div className="form-grid">
                  <label>
                    Rodadas
                    <select
                      aria-label="Rodadas"
                      value={config.count}
                      onChange={(e) =>
                        change({ count: Number(e.target.value) })
                      }
                    >
                      {[10, 20, 25, 50].map((n) => (
                        <option key={n} value={n}>
                          {n} rodadas
                        </option>
                      ))}
                      <option value="0">Infinito</option>
                    </select>
                  </label>
                  <label>
                    Segundos por rodada
                    <input
                      type="number"
                      min="3"
                      max="60"
                      value={config.roundTime}
                      onChange={(e) =>
                        change({
                          roundTime: Math.min(
                            60,
                            Math.max(3, Number(e.target.value)),
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Evento
                    <select
                      aria-label="Evento"
                      value={config.radarEvent}
                      onChange={(e) =>
                        change({
                          radarEvent: e.target
                            .value as GameConfig["radarEvent"],
                        })
                      }
                    >
                      <option value="classic">Clássico</option>
                      <option value="mirror">
                        Espelho · bandeiras semelhantes
                      </option>
                      <option value="hunt">Caça rápida · grupos de 5</option>
                      <option value="memory">
                        Memória · memorize as posições
                      </option>
                    </select>
                  </label>
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={config.radarProgression || false}
                    onChange={(e) =>
                      change({ radarProgression: e.target.checked })
                    }
                  />
                  Aumentar a grade a cada 5 rodadas
                </label>
                <p className="field-note">
                  Em telas pequenas, 25 bandeiras podem exigir rolagem. Recordes
                  de celular são separados.
                </p>
              </fieldset>
            </>
          )}
        </section>
        <aside className="setup-summary panel">
          <span className="eyebrow">SEU PRÓXIMO DESAFIO</span>
          <div className="flag-stack">
            <Flag id="br" />
            <Flag id="jp" />
            <Flag id="fr" />
          </div>
          <h2>
            {mode === "avalanche"
              ? "Até onde você chega?"
              : `${config.count === 0 ? "Sem limite de" : Math.min(config.count, pool.length)} ${mode === "radar" ? "rodadas" : "bandeiras"}`}
          </h2>
          <p>
            {config.continent === "all"
              ? "O mundo todo espera por você."
              : config.continent}
          </p>
          <div className="summary-line">
            <ShieldCheck size={18} />
            Progresso salvo automaticamente
          </div>
          <div className="summary-line">
            <Sparkles size={18} />
            Seus erros viram aprendizado
          </div>
          <Button
            onClick={start}
            disabled={!pool.length || !config.weights.some(Boolean)}
            className="full"
          >
            Começar partida
            <ArrowRight size={18} />
          </Button>
          {!pool.length && (
            <p role="status" className="warning">
              Nenhum país nesse filtro. Escolha outro conjunto.
            </p>
          )}
          <p className="field-note">
            <Info size={14} />
            Você pode pausar quando quiser.
          </p>
        </aside>
      </div>
      {confirm && (
        <Modal
          title="Você tem uma partida em andamento"
          onClose={() => setConfirm(false)}
        >
          <p>
            Continue de onde parou ou encerre a partida atual. As respostas já
            registradas serão preservadas.
          </p>
          <div className="modal-actions">
            <Button onClick={() => (location.hash = "/play")}>
              Continuar partida
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (data.active)
                  finish({ ...data.active, status: "abandoned" });
                setConfirm(false);
                launch();
              }}
            >
              Encerrar e começar outra
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
