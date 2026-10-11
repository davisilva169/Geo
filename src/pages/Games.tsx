import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  LogOut,
  Check,
  X,
  ArrowRight,
  Eye,
  SkipForward,
  Heart,
  Zap,
  Trophy,
  Clock3,
  Shield,
  Snowflake,
} from "lucide-react";
import { useStore } from "../store";
import {
  accuracy,
  byId,
  formatFor,
  identify,
  optionsFor,
  prettyTime,
  scoreAnswer,
  shuffle,
  modeNames,
  deriveStats,
  allSessions,
} from "../domain";
import {
  Button,
  Flag,
  Modal,
  ModeIcon,
  playSound,
  powerIcons,
  SoundToggle,
} from "../components";
import { usePause, useActiveClock } from "../game-hooks";
import {
  answerAvalanche,
  avalancheEvent,
  createAvalanche,
  makeArcadeAnswer,
  powerList,
  powerNames,
  tickAvalanche,
  usePower,
  penalizeChoice,
} from "../avalanche";
import type { Answer, Session, Power } from "../types";
import { quizFeedback, recordQuizAnswer, advanceQuiz } from "../quiz";
function sequence(events: Answer[]) {
  let n = 0;
  for (let i = events.length - 1; i >= 0 && events[i].correct; i--) n++;
  return n;
}
function GameTop({
  s,
  paused,
  setPaused,
  onExit,
}: {
  s: Session;
  paused: boolean;
  setPaused: (p: boolean) => void;
  onExit: () => void;
}) {
  return (
    <div className="game-top">
      <span className={`game-mode ${s.mode}`}>
        <ModeIcon mode={s.mode} size={19} />
        {modeNames[s.mode]}
        <span className="game-kind">
          {s.kind === "review"
            ? "Revisão de erros"
            : s.config.continent === "all"
              ? "Mundo"
              : s.config.continent}
        </span>
      </span>
      <div className="game-top-actions">
        <SoundToggle />
        <button
          className="icon-button"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Retomar" : "Pausar"}
        >
          {paused ? <Play size={19} /> : <Pause size={19} />}
        </button>
        <button
          className="icon-button"
          onClick={onExit}
          aria-label="Sair da partida"
        >
          <LogOut size={19} />
        </button>
      </div>
    </div>
  );
}
function PauseDialog({
  resume,
  exit,
}: {
  resume: () => void;
  exit: () => void;
}) {
  return (
    <Modal title="Uma pausa para respirar" onClose={resume}>
      <p>O relógio está parado. Volte quando estiver pronto.</p>
      <div className="modal-actions">
        <Button onClick={resume}>
          <Play size={17} />
          Continuar
        </Button>
        <Button variant="ghost" onClick={exit}>
          Encerrar partida
        </Button>
      </div>
    </Modal>
  );
}
function ExitDialog({
  cancel,
  exit,
}: {
  cancel: () => void;
  exit: () => void;
}) {
  return (
    <Modal title="Encerrar esta partida?" onClose={cancel}>
      <p>
        Suas respostas serão preservadas no histórico. Esta sessão ficará
        marcada como interrompida.
      </p>
      <div className="modal-actions">
        <Button onClick={cancel}>Continuar jogando</Button>
        <Button variant="danger" onClick={exit}>
          Encerrar partida
        </Button>
      </div>
    </Modal>
  );
}
export function QuizGame({ session }: { session: Session }) {
  const { data, updateActive, finish } = useStore();
  const s = useRef(session);
  s.current = session;
  const [paused, setPaused] = usePause(
    session.elapsed > 0 && !session.runtime.feedback,
  );
  const [exit, setExit] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const feedback = quizFeedback(session);
  const radar = session.mode === "radar";
  const [elapsed, time] = useActiveClock(
    paused || exit || !!feedback,
    session.elapsed,
  );
  const roundStart = useRef(session.elapsed);
  const remainingStart = useRef(
    session.runtime.radarRemaining ??
      session.config.roundTime *
        1000 *
        (session.config.radarEvent === "hunt" ? 5 : 1) +
        (session.config.radarEvent === "memory" ? 2000 : 0),
  );
  const [remaining, setRemaining] = useState(remainingStart.current);
  const id = session.questionIds[session.cursor];
  const c = byId[id];
  const format = radar
    ? "flags"
    : formatFor(session.config, `${session.id}-${session.cursor}`);
  const stats = deriveStats(allSessions(data));
  const confused = Object.keys(stats[id]?.confusions || {});
  const grid =
    radar && session.config.radarProgression
      ? [4, 9, 16, 25][
          Math.min(
            3,
            [4, 9, 16, 25].indexOf(session.config.grid) +
              Math.floor(session.cursor / 5),
          )
        ]
      : session.config.grid;
  const options = optionsFor(
    id,
    radar ? grid : 4,
    `${session.id}-${session.cursor}`,
    session.config.radarEvent === "mirror"
      ? [...byId[id].similar, ...confused]
      : confused,
  );
  const memory = radar && session.config.radarEvent === "memory";
  const memoryHidden =
    memory &&
    (elapsed - roundStart.current >= 2000 ||
      session.runtime.memoryRevealed === true);
  const saveTick = useRef(0);
  useEffect(() => {
    if (!paused && !feedback && !exit) inputRef.current?.focus();
    if (feedback) nextRef.current?.focus();
  }, [session.cursor, paused, feedback, exit]);
  useEffect(() => {
    const left = remainingStart.current - (elapsed - roundStart.current);
    setRemaining(Math.max(0, left));
    if (radar && left <= 0 && !paused && !feedback) respond(undefined, "miss");
    if (elapsed - saveTick.current >= 1000) {
      saveTick.current = elapsed;
      updateActive((current) =>
        current.cursor !== session.cursor
          ? current
          : {
              ...current,
              elapsed: Math.max(current.elapsed, elapsed),
              runtime: {
                ...current.runtime,
                radarRemaining: Math.max(0, left),
                memoryRevealed: memoryHidden,
              },
            },
      );
    }
  }, [elapsed]);
  function respond(selectedId?: string, kind: Answer["kind"] = "answer") {
    const latest = s.current;
    if (
      quizFeedback(latest) ||
      paused ||
      exit ||
      latest.cursor !== session.cursor
    )
      return;
    const isCorrect = selectedId === id && kind === "answer";
    const answer: Answer = {
      id: crypto.randomUUID(),
      countryId: id,
      selectedId,
      correct: isCorrect,
      kind,
      format: radar ? `radar-${latest.config.radarEvent}` : format,
      at: Date.now(),
      ms: Math.max(0, Math.round(time.current - roundStart.current)),
      input: input || undefined,
    };
    s.current = recordQuizAnswer(latest, session.cursor, answer, time.current);
    updateActive((current) =>
      recordQuizAnswer(current, session.cursor, answer, time.current),
    );
    playSound(isCorrect, data.settings);
  }
  function next() {
    const latest = s.current;
    if (!quizFeedback(latest) || latest.cursor !== session.cursor) return;
    const hunt = radar && latest.config.radarEvent === "hunt";
    remainingStart.current =
      hunt && (latest.cursor + 1) % 5 !== 0
        ? Math.max(0, remaining)
        : latest.config.roundTime * 1000 * (hunt ? 5 : 1) + (memory ? 2000 : 0);
    const advanced = advanceQuiz(
      latest,
      session.cursor,
      remainingStart.current,
    );
    s.current = advanced;
    if (advanced.status === "completed") {
      finish({ ...advanced, elapsed: time.current });
      location.hash = `/results/${latest.id}`;
      return;
    }
    roundStart.current = time.current;
    setInput("");
    setRemaining(remainingStart.current);
    updateActive((current) =>
      advanceQuiz(current, session.cursor, remainingStart.current),
    );
  }
  function leave() {
    finish({ ...s.current, status: "abandoned", elapsed: time.current });
    location.hash = `/results/${session.id}`;
  }
  if (!c) return <p role="alert">Esta sessão não contém perguntas.</p>;
  return (
    <section className={`game-shell ${radar ? "radar-game" : "normal-game"}`}>
      <GameTop
        s={session}
        paused={paused}
        setPaused={setPaused}
        onExit={() => {
          setPaused(true);
          setExit(true);
        }}
      />
      <div className="question-status">
        <span>
          {radar ? "Rodada" : "Bandeira"} <strong>{session.cursor + 1}</strong>
          {session.config.count > 0 && ` de ${session.questionIds.length}`}
        </span>
        <span>
          <Zap size={16} />
          {session.score.toLocaleString("pt-BR")} pontos
        </span>
        <span>{accuracy(session.events)}% de acerto</span>
      </div>
      <div className="progress-track">
        <i
          style={{
            width: `${(session.cursor / session.questionIds.length) * 100}%`,
          }}
        />
      </div>
      <div className={paused ? "paused-content" : ""}>
        {radar ? (
          <>
            <div className="radar-heading">
              <span className="eyebrow">
                {memory
                  ? "MEMORIZE AS POSIÇÕES E ENCONTRE"
                  : "ENCONTRE A BANDEIRA DE"}
              </span>
              <h1>{c.name}</h1>
              <span className={`countdown ${remaining < 4000 ? "urgent" : ""}`}>
                <Clock3 size={19} />
                {(remaining / 1000).toFixed(1)} s
              </span>
            </div>
            {memory && (
              <p className="field-note center">
                {memoryHidden
                  ? "Onde estava a bandeira?"
                  : "Observe a grade. Ela será ocultada em 2 segundos."}
              </p>
            )}
            <div
              className={`radar-grid grid-${grid}`}
              role="group"
              aria-label={`Bandeiras: encontre ${c.name}`}
            >
              {options.map((option, index) => (
                <button
                  key={option}
                  aria-label={`Bandeira ${index + 1}`}
                  disabled={!!feedback || paused || (memory && !memoryHidden)}
                  className={`flag-option ${feedback && option === id ? "correct" : ""} ${feedback?.selectedId === option && !feedback.correct ? "incorrect" : ""}`}
                  onClick={() => respond(option)}
                >
                  <Flag
                    id={option}
                    label={false}
                    hidden={memoryHidden && !feedback}
                  />
                  {feedback && option === id && (
                    <span className="answer-badge">
                      <Check size={17} />
                    </span>
                  )}
                  <kbd>{index + 1}</kbd>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flashcard-stage">
              {format === "flags" ? (
                <>
                  <span className="eyebrow">ENCONTRE A BANDEIRA DE</span>
                  <h1>{c.name}</h1>
                </>
              ) : (
                <Flag id={id} label={false} className="hero-flag" />
              )}
            </div>
            <div className="question-prompt">
              <h1>
                {format === "flags" ? "Qual é a bandeira?" : "Qual é o país?"}
              </h1>
              <p>
                {format === "typing"
                  ? "Você conhece essa. Confie na sua memória."
                  : "Escolha uma das quatro opções abaixo."}
              </p>
            </div>
            {format === "typing" ? (
              <form
                className="answer-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  respond(identify(input, data.settings.aliases)?.id);
                }}
              >
                <label className="sr-only" htmlFor="answer">
                  Nome do país
                </label>
                <input
                  id="answer"
                  ref={inputRef}
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite o nome do país…"
                  disabled={!!feedback || paused}
                />
                <Button type="submit" disabled={!!feedback || !input.trim()}>
                  Confirmar
                  <ArrowRight size={19} />
                </Button>
              </form>
            ) : (
              <div
                className={`answer-options ${format === "flags" ? "flags" : ""}`}
              >
                {options.map((option, index) => (
                  <button
                    key={option}
                    disabled={!!feedback || paused}
                    onClick={() => respond(option)}
                    className={`answer-option ${feedback && option === id ? "correct" : ""} ${feedback?.selectedId === option && !feedback.correct ? "incorrect" : ""}`}
                    aria-label={
                      format === "flags"
                        ? `Bandeira ${index + 1}`
                        : byId[option].name
                    }
                  >
                    <kbd>{index + 1}</kbd>
                    {format === "flags" ? (
                      <Flag id={option} label={false} />
                    ) : (
                      byId[option].name
                    )}
                    {feedback && option === id && <Check size={18} />}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {feedback ? (
          <div
            className={`feedback ${feedback.correct ? "good" : "bad"}`}
            role="status"
          >
            <span className="feedback-icon">
              {feedback.correct ? <Check /> : <X />}
            </span>
            <div>
              <strong>
                {feedback.correct
                  ? "Isso! Mais uma para o repertório."
                  : `A resposta é ${c.name}.`}
              </strong>
              <p>
                {!feedback.correct && feedback.selectedId
                  ? `Você escolheu ${byId[feedback.selectedId].name}. Vamos revisar depois.`
                  : feedback.correct
                    ? "Cada acerto é um novo destino."
                    : "Ela vai entrar na sua revisão."}
              </p>
            </div>
            <button ref={nextRef} className="button primary" onClick={next}>
              {session.cursor + 1 === session.questionIds.length &&
              session.config.count > 0
                ? "Ver resultado"
                : "Próxima"}
              <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className="question-tools">
            {!radar && (
              <button
                className="text-link"
                onClick={() => respond(undefined, "miss")}
              >
                <Eye size={17} />
                Revelar resposta
              </button>
            )}
            <button
              className="text-link"
              onClick={() => respond(undefined, "miss")}
            >
              <SkipForward size={17} />
              Pular
            </button>
            <span>
              <Clock3 size={15} />
              {prettyTime(elapsed)}
            </span>
          </div>
        )}
      </div>
      <p className="game-hint">
        {radar ? "Encontre, selecione, aprenda." : "Enter para confirmar"} · Esc
        para pausar · Seu progresso está sendo salvo
      </p>
      {paused && !exit && (
        <PauseDialog
          resume={() => setPaused(false)}
          exit={() => setExit(true)}
        />
      )}{" "}
      {exit && (
        <ExitDialog
          cancel={() => {
            setExit(false);
            setPaused(false);
          }}
          exit={leave}
        />
      )}
    </section>
  );
}

export function AvalancheGame({ session }: { session: Session }) {
  const { data, updateActive, finish } = useStore();
  const s = useRef(session);
  s.current = session;
  const engine = useRef(
    session.runtime.avalanche || createAvalanche(session.config),
  );
  const [view, setView] = useState(() => structuredClone(engine.current));
  const [paused, setPaused] = usePause(!!session.runtime.avalanche);
  const [exit, setExit] = useState(false);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState(
    "Identifique uma bandeira antes de ela tocar o chão.",
  );
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const inputRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  const settings = useRef(data.settings);
  settings.current = data.settings;
  const eventBuffer = useRef<Answer[]>([]);
  const callback = useRef({ updateActive, finish });
  callback.current = { updateActive, finish };
  const height = useRef(350);
  const field = useRef<HTMLDivElement>(null);
  const lastSaved = useRef(0);
  function save() {
    const a = engine.current;
    const events = [...s.current.events, ...eventBuffer.current];
    eventBuffer.current = [];
    const patch = {
      elapsed: a.elapsed,
      events,
      score: a.score,
      bestCombo: a.bestCombo,
      maxSpeed: a.maxSpeed,
      runtime: { avalanche: structuredClone(a) },
    };
    s.current = { ...s.current, ...patch };
    callback.current.updateActive(patch);
  }
  function end(abandoned = false) {
    if (finished.current) return;
    finished.current = true;
    save();
    callback.current.finish({
      ...s.current,
      status: abandoned ? "abandoned" : "completed",
    });
    location.hash = `/results/${s.current.id}`;
  }
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    const measure = () =>
      (height.current = Math.max(100, el.clientHeight - 72));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!paused && !exit) inputRef.current?.focus();
    else save();
  }, [paused, exit]);
  useEffect(() => {
    if (paused || exit) return;
    let previous = performance.now();
    let lastRender = 0;
    let frame = 0;
    function tick(now: number) {
      const a = engine.current;
      const events = tickAvalanche(
        a,
        now - previous,
        s.current.config,
        s.current.questionIds,
      );
      previous = now;
      if (events.length) {
        eventBuffer.current.push(...events);
        playSound(false, settings.current);
        setMessage("Uma bandeira passou. Respire e continue.");
      }
      for (const f of a.flags) {
        const node = nodes.current.get(f.id);
        if (node)
          node.style.transform = `translate(-50%, ${(f.y / 100) * height.current}px)`;
      }
      if (now - lastRender > 90) {
        setView(structuredClone(a));
        lastRender = now;
      }
      if (a.elapsed - lastSaved.current > 1000) {
        save();
        lastSaved.current = a.elapsed;
      }
      if (a.ended) {
        end();
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, exit]);
  function answer(text: string, explicit = true) {
    if (paused || exit || finished.current) return;
    const id = identify(text, settings.current.aliases)?.id;
    const a = engine.current;
    const event = id ? answerAvalanche(a, id) : null;
    if (event) {
      eventBuffer.current.push({
        ...event,
        input: text,
        format: s.current.config.inputMode,
      });
      setInput("");
      setMessage(
        `${byId[event.countryId].name}! ${a.combo > 1 ? `Combo de ${a.combo} acertos.` : "Boa!"}`,
      );
      playSound(true, settings.current);
      save();
      setView(structuredClone(a));
    } else if (explicit && text.trim() && a.flags.length) {
      const target = [...a.flags].sort((x, y) => y.y - x.y)[0];
      a.combo = 0;
      if (s.current.config.inputMode === "choice") penalizeChoice(a);
      eventBuffer.current.push({
        ...makeArcadeAnswer(target.countryId, false, 0, "answer", id),
        input: text,
      });
      setMessage(
        s.current.config.inputMode === "choice"
          ? "Resposta errada! Todas as bandeiras descem um pouco mais."
          : "Nenhuma bandeira com esse nome na tela. Tente outra vez.",
      );
      playSound(false, settings.current);
      save();
      setView(structuredClone(a));
    }
  }
  function activate(p: Power) {
    if (paused || exit) return;
    const result = usePower(engine.current, p, s.current.config);
    if (result === false) return;
    if (result) eventBuffer.current.push(result);
    setMessage(`${powerNames[p]} ativado!`);
    save();
    setView(structuredClone(engine.current));
    inputRef.current?.focus();
  }
  const actRef = useRef(activate);
  actRef.current = activate;
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (
        e.key >= "1" &&
        e.key <= "6" &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        actRef.current(powerList[i]);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  const event = avalancheEvent(view);
  const critical = [...view.flags].sort((a, b) => b.y - a.y)[0];
  const choices = critical
    ? optionsFor(critical.countryId, 4, `${session.id}-${critical.id}`)
    : [];
  return (
    <section className="game-shell avalanche-game">
      <GameTop
        s={session}
        paused={paused}
        setPaused={setPaused}
        onExit={() => {
          setPaused(true);
          setExit(true);
        }}
      />
      <div className="arcade-hud">
        <div>
          <span className="eyebrow">PONTUAÇÃO</span>
          <strong>{view.score.toLocaleString("pt-BR")}</strong>
        </div>
        <span className="combo-badge">
          <Zap size={17} fill="currentColor" />
          Combo ×{view.combo}
        </span>
        <span
          className="lives"
          aria-label={`${view.lives} vidas de ${session.config.lives}`}
        >
          {session.config.lives <= 5 ? (
            Array.from({ length: session.config.lives }, (_, i) => (
              <Heart
                key={i}
                size={24}
                className={i < view.lives ? "alive" : ""}
                fill={i < view.lives ? "currentColor" : "none"}
              />
            ))
          ) : (
            <>
              <Heart fill="currentColor" className="alive" />
              {view.lives}/{session.config.lives}
            </>
          )}
          {view.shield && <Shield className="shield-active" size={24} />}
        </span>
        <span className="arcade-time">
          <Clock3 size={16} />
          {prettyTime(view.elapsed)}
        </span>
      </div>
      <div
        ref={field}
        className={`falling-field ${paused ? "paused-content" : ""} ${view.freezeUntil > view.elapsed ? "frozen" : ""}`}
        aria-label="Área de queda das bandeiras"
      >
        <div className="field-grid" />
        {event && <div className="event-banner">{event}</div>}
        {view.flags.map((f) => (
          <div
            key={f.id}
            ref={(el) => {
              if (el) nodes.current.set(f.id, el);
              else nodes.current.delete(f.id);
            }}
            className={`falling-flag ${f.y > 75 ? "critical" : ""}`}
            style={{
              left: `${f.x}%`,
              transform: `translate(-50%, ${(f.y / 100) * height.current}px)`,
            }}
          >
            <Flag id={f.countryId} label={false} />
            {view.xrayUntil > view.elapsed && (
              <span className="xray-label">{byId[f.countryId].name}</span>
            )}
          </div>
        ))}
        {view.flags.length === 0 && (
          <span className="field-ready">
            Olhos no céu. A próxima está chegando.
          </span>
        )}
        <div className="floor-line" />
        <span className="field-level">ONDA {view.level}</span>
      </div>
      <div className="arcade-controls">
        <p className="arcade-feedback" role="status">
          {message}
        </p>
        {session.config.inputMode === "choice" ? (
          <div className="quick-choices">
            {choices.map((id) => (
              <button
                className="button secondary"
                key={id}
                onClick={() => answer(byId[id].name)}
                disabled={paused}
              >
                {byId[id].name}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="arcade-answer"
            onSubmit={(e) => {
              e.preventDefault();
              answer(input);
            }}
          >
            <label htmlFor="avalanche-answer" className="sr-only">
              Nome de um país na tela
            </label>
            <input
              ref={inputRef}
              id="avalanche-answer"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (!session.config.enter) answer(e.target.value, false);
              }}
              autoComplete="off"
              spellCheck={false}
              placeholder="Digite um país na tela…"
              disabled={paused}
            />
            <Button type="submit" disabled={paused || !input.trim()}>
              <ArrowRight size={23} />
              <span className="sr-only">Confirmar</span>
            </Button>
          </form>
        )}
        {session.config.powers && (
          <div className="powers">
            {powerList.map((p, i) => {
              const Icon = powerIcons[p];
              const duration =
                p === "freeze"
                  ? view.freezeUntil - view.elapsed
                  : p === "slow"
                    ? view.slowUntil - view.elapsed
                    : p === "xray"
                      ? view.xrayUntil - view.elapsed
                      : 0;
              return (
                <button
                  className={`power ${p} ${duration > 0 ? "active" : ""}`}
                  key={p}
                  title={`${powerNames[p]} — tecla ${i + 1}`}
                  aria-label={`${powerNames[p]}, ${view.charges[p]} disponível`}
                  onClick={() => activate(p)}
                  disabled={
                    paused ||
                    !view.charges[p] ||
                    (p === "life" && view.lives >= session.config.lives)
                  }
                >
                  <Icon size={22} />
                  <span>
                    {duration > 0
                      ? `${Math.ceil(duration / 1000)}s`
                      : powerNames[p]}
                  </span>
                  <kbd>{i + 1}</kbd>
                  <b>{view.charges[p]}</b>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <p className="game-hint">
        Esc para pausar · {session.config.powers ? "1–6 para poderes · " : ""}
        Erros quebram o combo
      </p>
      {paused && !exit && (
        <PauseDialog
          resume={() => setPaused(false)}
          exit={() => setExit(true)}
        />
      )}{" "}
      {exit && (
        <ExitDialog
          cancel={() => {
            setExit(false);
            setPaused(false);
          }}
          exit={() => end(true)}
        />
      )}
    </section>
  );
}
