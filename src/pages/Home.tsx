import {
  ArrowRight,
  Check,
  Flag as FlagIcon,
  Globe2,
  Sparkles,
  Trophy,
  Target,
  Clock3,
  ChevronRight,
  BookOpen,
  Zap,
  Radar,
} from "lucide-react";
import { useStore } from "../store";
import {
  allSessions,
  deriveStats,
  accuracy,
  prettyTime,
  modeNames,
} from "../domain";
import { GlobeArt, ModeIcon } from "../components";
import { progressToNextLevel } from "../xp";
import type { Mode } from "../types";
const modes: {
  id: Mode;
  tag: string;
  title: string;
  description: string;
  feature: string;
}[] = [
  {
    id: "normal",
    tag: "NO SEU RITMO",
    title: "Conheça cada bandeira.",
    description:
      "Aprenda, teste sua memória e transforme os erros em novas descobertas.",
    feature: "Flashcards · Revisão inteligente",
  },
  {
    id: "avalanche",
    tag: "UM POUCO DE ADRENALINA",
    title: "Pense rápido. Vá mais longe.",
    description:
      "As bandeiras estão caindo! Acerte os países, faça combos e salve suas vidas.",
    feature: "Sobrevivência · Combos e poderes",
  },
  {
    id: "radar",
    tag: "AFINE O SEU OLHAR",
    title: "Bateu o olho, encontrou.",
    description:
      "Encontre a bandeira certa entre várias. Seu olhar vai ficar cada vez mais afiado.",
    feature: "Reconhecimento · Contra o tempo",
  },
];
export function Home() {
  const { data } = useStore();
  const stats = Object.values(deriveStats(allSessions(data)));
  const studied = stats.filter((s) => s.seen).length,
    mastered = stats.filter((s) => s.level === 4).length,
    pending = stats.filter((s) => s.pending).length;
  const events = allSessions(data).flatMap((s) => s.events);
  const xp = stats.reduce((a, s) => a + s.xp, 0);
  const level = progressToNextLevel(xp);
  const today = new Date().toDateString();
  const practice = events.filter(
    (e) => new Date(e.at).toDateString() === today && e.kind !== "assist",
  ).length;
  const last = data.sessions.slice(-3).reverse();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-dot" />
            SEU PRÓXIMO DESTINO É APRENDER
          </div>
          <h1>
            O mundo é grande.
            <br />
            <span>Seu repertório também.</span>
          </h1>
          <p>
            Uma bandeira de cada vez. Treine sua memória,
            <br className="desktop-break" /> desafie seus reflexos e descubra
            até onde você chega.
          </p>
          <div className="hero-actions">
            <a
              href={data.active ? "#/play" : "#/setup/normal"}
              className="button primary"
            >
              {data.active ? "Continuar partida" : "Vamos jogar"}
              <ArrowRight size={19} />
            </a>
            <a href="#/collection" className="text-link">
              Explorar bandeiras
              <ChevronRight size={17} />
            </a>
          </div>
          <div className="hero-foot">
            <span>
              <Check size={14} />
              196 bandeiras
            </span>
            <span>
              <Check size={14} />3 formas de jogar
            </span>
            <span>
              <Check size={14} />
              No seu ritmo
            </span>
          </div>
        </div>
        <GlobeArt />
      </section>
      <section className="overview-strip" aria-label="Seu resumo">
        <div>
          <span className="stat-icon lavender">
            <FlagIcon size={21} />
          </span>
          <span>
            <strong>
              {studied}
              <small> / 196</small>
            </strong>
            <label>Países estudados</label>
          </span>
        </div>
        <div>
          <span className="stat-icon teal">
            <Target size={21} />
          </span>
          <span>
            <strong>{events.length ? `${accuracy(events)}%` : "—"}</strong>
            <label>Precisão geral</label>
          </span>
        </div>
        <div>
          <span className="stat-icon gold">
            <Trophy size={21} />
          </span>
          <span>
            <strong>{mastered}</strong>
            <label>Países dominados</label>
          </span>
        </div>
        <a href="#/progress">
          <span className="stat-icon pink">
            <Sparkles size={21} />
          </span>
          <span>
            <strong>Nível {level.level}</strong>
            <label>
              {level.current} / {level.needed} XP
            </label>
          </span>
          <ChevronRight size={17} />
        </a>
      </section>
      <section className="mode-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ESCOLHA SUA PRÓXIMA AVENTURA</span>
            <h2>Como você quer jogar hoje?</h2>
          </div>
          <span className="muted small">
            Três modos. Um mundo de descobertas.
          </span>
        </div>
        <div className="mode-grid">
          {modes.map((m) => (
            <a
              className={`mode-card ${m.id}`}
              href={`#/setup/${m.id}`}
              key={m.id}
            >
              <div className="mode-illustration">
                <div className="mode-orbit" />
                <span className="mode-art-icon">
                  {m.id === "normal" ? (
                    <BookOpen size={69} strokeWidth={1.7} />
                  ) : m.id === "avalanche" ? (
                    <Zap size={82} fill="currentColor" strokeWidth={1} />
                  ) : (
                    <Radar size={79} strokeWidth={1.5} />
                  )}
                </span>
                <span className="mode-spark">✦</span>
                <span className="mode-tag">{m.tag}</span>
              </div>
              <div className="mode-card-body">
                <div className="mode-card-title">
                  <h3>{modeNames[m.id]}</h3>
                  <span className="arrow-circle">
                    <ArrowRight size={20} />
                  </span>
                </div>
                <strong>{m.title}</strong>
                <p>{m.description}</p>
                <div className="mode-feature">
                  <ModeIcon mode={m.id} size={15} />
                  {m.feature}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
      <div className="home-bottom">
        <section className="review-banner">
          <div className="review-symbol">
            <Sparkles size={27} />
          </div>
          <div>
            <span className="eyebrow">APRENDER É REENCONTRAR</span>
            <h3>
              {pending
                ? `${pending} bandeiras merecem outra chance.`
                : "Um pouquinho hoje. Um mundo amanhã."}
            </h3>
            <p>
              {pending
                ? "Revise seus erros e consolide cada descoberta."
                : "Suas revisões aparecem aqui depois da primeira partida."}
            </p>
          </div>
          <a
            className="button secondary"
            href={pending ? "#/setup/normal?pool=pending" : "#/setup/normal"}
          >
            {pending ? "Revisar agora" : "Começar a aprender"}
            <ArrowRight size={17} />
          </a>
        </section>
        <section className="daily-card">
          <span className="stat-icon gold">
            <Target size={22} />
          </span>
          <div>
            <strong>Seu ritmo, suas descobertas</strong>
            <p>
              {practice}
              {data.settings.dailyGoal
                ? ` / ${data.settings.dailyGoal}`
                : ""}{" "}
              respostas hoje
            </p>
            <div className="progress-track">
              <i
                style={{
                  width: `${Math.min(100, (practice / Math.max(1, data.settings.dailyGoal)) * 100)}%`,
                }}
              />
            </div>
          </div>
        </section>
      </div>
      {last.length > 0 && (
        <section className="recent-section">
          <div className="section-heading">
            <h2>Suas últimas viagens</h2>
            <a className="text-link" href="#/progress">
              Ver progresso
              <ArrowRight size={16} />
            </a>
          </div>
          {last.map((s) => (
            <a href={`#/results/${s.id}`} className="history-row" key={s.id}>
              <span className={`stat-icon ${s.mode}`}>
                <ModeIcon mode={s.mode} />
              </span>
              <span>
                <strong>{modeNames[s.mode]}</strong>
                <small>
                  {s.kind === "review"
                    ? "Revisão"
                    : s.kind === "complete"
                      ? "Sessão completa"
                      : "Prática"}{" "}
                  · {new Date(s.startedAt).toLocaleDateString("pt-BR")}
                </small>
              </span>
              <span>{accuracy(s.events)}% de precisão</span>
              <span>
                <Clock3 size={15} />
                {prettyTime(s.elapsed)}
              </span>
              <ChevronRight size={17} />
            </a>
          ))}
        </section>
      )}
      <div className="home-note">
        <Globe2 size={16} />
        Feito para mentes curiosas. Seu progresso é salvo neste navegador.
      </div>
    </>
  );
}
