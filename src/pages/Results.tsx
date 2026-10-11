import { useState } from "react";
import {
  ArrowRight,
  RotateCcw,
  Check,
  X,
  Clock3,
  Trophy,
  Zap,
  Sparkles,
  Home,
  Target,
} from "lucide-react";
import { useStore } from "../store";
import {
  accuracy,
  byId,
  defaultConfig,
  failedIds,
  makeSession,
  modeNames,
  prettyTime,
  recordKey,
} from "../domain";
import type { Session } from "../types";
import { Back, Button, Empty, Flag, Modal } from "../components";
export function Results({ id }: { id: string }) {
  const { data, mutate, finish } = useStore();
  const [pending, setPending] = useState<Session | null>(null);
  const s = data.sessions.find((s) => s.id === id);
  if (!s)
    return (
      <Empty title="Resultado não encontrado">
        Esta partida não está neste navegador. <a href="#/">Voltar ao início</a>
      </Empty>
    );
  const errors = failedIds(s);
  const scored = s.events.filter((e) => e.kind !== "assist");
  const correct = scored.filter((e) => e.correct).length;
  const pct = accuracy(s.events);
  const prior = data.sessions.filter(
    (p) =>
      p.id !== s.id &&
      p.startedAt < s.startedAt &&
      p.status === "completed" &&
      p.kind === s.kind &&
      recordKey(p) === recordKey(s),
  );
  const last = prior.at(-1);
  const record =
    s.status === "completed" &&
    s.score > Math.max(0, ...prior.map((p) => p.score));
  const slow = [...scored].sort((a, b) => b.ms - a.ms).slice(0, 5);
  function launch(session: Session) {
    if (data.active) {
      setPending(session);
      return;
    }
    mutate((d) => ({ ...d, active: session }));
    location.hash = "/play";
  }
  function review() {
    const config = {
      ...defaultConfig,
      format: data.settings.format,
      count: errors.length,
    };
    const session = makeSession(config, data, {
      ids: errors,
      rootId: s!.rootId || s!.id,
    });
    launch(session);
  }
  function replay() {
    const session = makeSession(s!.config, data);
    launch(session);
  }
  return (
    <>
      <Back />
      <section className="results-hero panel">
        <span className="result-medal">
          {s.status === "abandoned" ? (
            <Clock3 size={42} />
          ) : (
            <Trophy size={42} />
          )}
        </span>
        <span className="eyebrow">
          {modeNames[s.mode]} ·{" "}
          {s.kind === "review"
            ? "REVISÃO"
            : s.kind === "complete"
              ? "SESSÃO COMPLETA"
              : "PRÁTICA"}
        </span>
        <h1>
          {s.status === "abandoned"
            ? "Uma pausa na jornada."
            : errors.length
              ? "Cada rodada, mais mundo."
              : "Seu repertório acaba de crescer."}
        </h1>
        <p>
          {s.status === "abandoned"
            ? "Partida interrompida. As respostas feitas continuam no seu histórico."
            : errors.length
              ? `Você encontrou ${correct} respostas certas. Vamos cuidar das próximas?`
              : "Todas as respostas desta sessão foram reconhecidas. Que tal um novo desafio?"}
        </p>
        {record && (
          <span className="record-label">
            <Sparkles size={16} />
            Seu melhor placar nesta configuração!
          </span>
        )}
        <div className="result-summary">
          <div
            className="accuracy-ring"
            style={{ "--pct": `${pct}%` } as React.CSSProperties}
          >
            <strong>{pct}%</strong>
            <span>de precisão</span>
          </div>
          <div className="result-numbers">
            <div>
              <Check className="text-teal" />
              <strong>{correct}</strong>
              <span>acertos</span>
            </div>
            <div>
              <X className="text-coral" />
              <strong>{scored.length - correct}</strong>
              <span>erros</span>
            </div>
            <div>
              <Clock3 />
              <strong>{prettyTime(s.elapsed)}</strong>
              <span>tempo ativo</span>
            </div>
            <div>
              <Zap className="text-purple" />
              <strong>{s.score.toLocaleString("pt-BR")}</strong>
              <span>pontos</span>
            </div>
          </div>
        </div>
        <div className="result-actions">
          {errors.length > 0 ? (
            <Button onClick={review}>
              Revisar {errors.length} {errors.length === 1 ? "erro" : "erros"}
              <ArrowRight size={18} />
            </Button>
          ) : (
            <a className="button primary" href="#/setup/normal?pool=smart">
              Próxima descoberta
              <ArrowRight size={18} />
            </a>
          )}
          <Button variant="secondary" onClick={replay}>
            <RotateCcw size={17} />
            Jogar novamente
          </Button>
          <a className="text-link" href="#/">
            <Home size={17} />
            Início
          </a>
        </div>
      </section>
      <div className="result-detail-grid">
        <section className="panel">
          <h2>Seu desempenho</h2>
          <dl className="metric-list">
            <div>
              <dt>Tempo médio por resposta</dt>
              <dd>
                {scored.length
                  ? (
                      scored.reduce((a, e) => a + e.ms, 0) /
                      scored.length /
                      1000
                    ).toFixed(1)
                  : "0"}{" "}
                s
              </dd>
            </div>
            <div>
              <dt>Melhor sequência</dt>
              <dd>{s.bestCombo} acertos</dd>
            </div>
            <div>
              <dt>Países diferentes identificados</dt>
              <dd>
                {
                  new Set(
                    scored.filter((e) => e.correct).map((e) => e.countryId),
                  ).size
                }
              </dd>
            </div>
            <div>
              <dt>Respostas assistidas por poder</dt>
              <dd>{s.events.length - scored.length}</dd>
            </div>
            {s.mode === "avalanche" && (
              <div>
                <dt>Velocidade máxima / preset</dt>
                <dd>
                  {(s.maxSpeed || s.config.speed).toFixed(2)}× ·{" "}
                  {s.config.preset}
                </dd>
              </div>
            )}
            <div>
              <dt>Comparação com a anterior</dt>
              <dd>
                {last
                  ? `${pct - accuracy(last.events) >= 0 ? "+" : ""}${pct - accuracy(last.events)} p.p.`
                  : "Primeira nesta configuração"}
              </dd>
            </div>
          </dl>
          <p className="field-note">
            Comparação entre sessões do mesmo modo, tipo e configuração.
            Respostas assistidas não contam como aprendizado.
          </p>
        </section>
        <section className="panel">
          <h2>
            {errors.length
              ? "Vamos reencontrar estas bandeiras"
              : "Revisão concluída"}
          </h2>
          {errors.length ? (
            <div className="error-countries">
              {errors.map((id) => (
                <a href={`#/collection?country=${id}`} key={id}>
                  <Flag id={id} />
                  <span>{byId[id].name}</span>
                  <ArrowRight size={15} />
                </a>
              ))}
            </div>
          ) : (
            <div className="review-done">
              <Check size={40} />
              <h3>Nenhum erro para revisar.</h3>
              <p>
                Acertar hoje é um passo. As revisões futuras ajudam a confirmar
                que você se lembra.
              </p>
            </div>
          )}
        </section>
      </div>
      {slow.length > 0 && (
        <section className="panel spaced">
          <h2>As bandeiras que pediram mais tempo</h2>
          <div className="slow-countries">
            {slow.map((e) => (
              <a href={`#/collection?country=${e.countryId}`} key={e.id}>
                <Flag id={e.countryId} />
                <strong>{byId[e.countryId].name}</strong>
                <span>{(e.ms / 1000).toFixed(1)} s</span>
              </a>
            ))}
          </div>
        </section>
      )}
      {pending && (
        <Modal
          title="Uma partida está em andamento"
          onClose={() => setPending(null)}
        >
          <p>
            Encerrar a partida atual para iniciar outra? As respostas já feitas
            serão preservadas.
          </p>
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setPending(null);
                location.hash = "/play";
              }}
            >
              Continuar a atual
            </Button>
            <Button
              onClick={() => {
                if (data.active)
                  finish({ ...data.active, status: "abandoned" });
                mutate((d) => ({ ...d, active: pending }));
                location.hash = "/play";
              }}
            >
              Encerrar e começar
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
