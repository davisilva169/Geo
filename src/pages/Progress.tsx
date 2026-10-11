import { useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { ArrowRight, Clock3, Target, Trophy, Globe2 } from "lucide-react";
import { useStore } from "../store";
import {
  accuracy,
  allSessions,
  byId,
  continents,
  countries,
  deriveStats,
  levelNames,
  modeNames,
  prettyTime,
} from "../domain";
import { Back, Empty, Flag, ModeIcon } from "../components";
export function Progress() {
  const { data } = useStore();
  const [period, setPeriod] = useState(30);
  const [mode, setMode] = useState("all");
  const [kind, setKind] = useState("all");
  const [metric, setMetric] = useState("accuracy");
  const [continent, setContinent] = useState("all");
  const [level, setLevel] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const stats = deriveStats(allSessions(data));
  const list = Object.values(stats);
  const events = allSessions(data)
    .flatMap((s) => s.events)
    .filter((e) => e.kind !== "assist");
  const studied = list.filter((s) => s.seen).length;
  const mastered = list.filter((s) => s.level === 4).length;
  const due = list.filter((s) => s.seen && s.due <= Date.now()).length;
  const sessions = data.sessions.filter(
    (s) =>
      s.startedAt >= Date.now() - period * 86400000 &&
      (mode === "all" || s.mode === mode) &&
      (kind === "all" || s.kind === kind),
  );
  const chart = sessions.map((s) => {
    const answers = s.events.filter((e) => e.kind !== "assist");
    const value =
      metric === "mastery"
        ? Object.values(
            deriveStats(
              data.sessions.filter((old) => old.startedAt <= s.startedAt),
            ),
          ).filter((c) => c.level === 4).length
        : metric === "accuracy"
          ? accuracy(s.events)
          : metric === "time"
            ? Math.round(
                answers.reduce((a, e) => a + e.ms, 0) /
                  Math.max(1, answers.length) /
                  100,
              ) / 10
            : s.score;
    return {
      date: new Date(s.startedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      name: modeNames[s.mode],
      type:
        s.kind === "review"
          ? "Revisão"
          : s.kind === "complete"
            ? "Completa"
            : "Prática",
      value,
      complete: s.kind !== "review" ? value : null,
      review: s.kind === "review" ? value : null,
    };
  });
  const continentData = continents.map((c) => ({
    name: c.replace("América do ", "Am. "),
    dominados: countries.filter(
      (x) => x.continent === c && stats[x.id].level === 4,
    ).length,
    total: countries.filter((x) => x.continent === c).length,
  }));
  const difficult = list
    .filter((s) => s.wrong)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 8);
  const matrix = countries.filter(
    (c) =>
      (continent === "all" || c.continent === continent) &&
      (level === "all" || stats[c.id].level === Number(level)),
  );
  return (
    <>
      <Back />
      <div className="page-heading">
        <div>
          <span className="eyebrow">CADA DESCOBERTA CONTA</span>
          <h1>Meu progresso</h1>
          <p>Um retrato do que você já sabe e do que vem pela frente.</p>
        </div>
        <a href="#/setup/normal?pool=smart" className="button primary">
          Revisão inteligente
          <ArrowRight size={17} />
        </a>
      </div>
      <div className="metric-cards">
        {[
          [Globe2, `${studied} / 196`, "Países estudados"],
          [Trophy, mastered, "Países dominados"],
          [
            Target,
            events.length ? `${accuracy(events)}%` : "—",
            "Precisão global",
          ],
          [Clock3, due, "Revisões vencidas"],
        ].map(([Icon, n, label]) => {
          const I = Icon as typeof Globe2;
          return (
            <div className="panel metric-card" key={String(label)}>
              <I size={22} />
              <strong>{String(n)}</strong>
              <span>{String(label)}</span>
            </div>
          );
        })}
      </div>
      <div className="progress-subline">
        <span>
          Precisão recente:{" "}
          <strong>
            {events.length ? `${accuracy(events.slice(-100))}%` : "—"}
          </strong>
        </span>
        <span>
          <strong>{data.sessions.length}</strong> partidas registradas
        </span>
        <span>
          <strong>
            {prettyTime(allSessions(data).reduce((a, s) => a + s.elapsed, 0))}
          </strong>{" "}
          de prática
        </span>
        <span>
          <strong>{list.filter((s) => s.pending).length}</strong> países com
          erros pendentes
        </span>
      </div>
      <section className="panel chart-panel">
        <div className="section-heading">
          <div>
            <h2>Sua evolução</h2>
            <p className="field-note">
              Cada ponto é uma sessão. Passe o cursor ou toque para explorar.
            </p>
          </div>
          <div className="chart-filters">
            <select
              aria-label="Período"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="3650">Todo o histórico</option>
            </select>
            <select
              aria-label="Modo"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="all">Todos os modos</option>
              <option value="normal">Normal</option>
              <option value="avalanche">Avalanche</option>
              <option value="radar">Radar</option>
            </select>
            <select
              aria-label="Tipo de sessão"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="complete">Completas</option>
              <option value="review">Revisões</option>
              <option value="practice">Práticas</option>
            </select>
          </div>
        </div>
        <div className="pill-options">
          <button
            onClick={() => setMetric("accuracy")}
            className={metric === "accuracy" ? "selected" : ""}
          >
            Precisão (%)
          </button>
          <button
            onClick={() => setMetric("time")}
            className={metric === "time" ? "selected" : ""}
          >
            Tempo médio (s)
          </button>
          <button
            onClick={() => setMetric("mastery")}
            className={metric === "mastery" ? "selected" : ""}
          >
            Países dominados
          </button>
          <button
            onClick={() => setMetric("score")}
            className={metric === "score" ? "selected" : ""}
          >
            Pontuação
          </button>
        </div>
        {chart.length ? (
          <>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={metric === "accuracy" ? [0, 100] : ["auto", "auto"]}
                    width={42}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="complete"
                    name="Sessão / prática"
                    stroke="#7138dc"
                    fill="#7138dc22"
                    dot={{ r: 4 }}
                    connectNulls
                  />
                  <Area
                    type="monotone"
                    dataKey="review"
                    name="Revisão"
                    stroke="#118a86"
                    fill="#118a8622"
                    dot={{ r: 4 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <span>
                <i className="purple-dot" />
                Sessão / prática
              </span>
              <span>
                <i className="teal-dot" />
                Revisão
              </span>
            </div>
            <details>
              <summary>Ver dados em tabela</summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Modo</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.map((d, i) => (
                      <tr key={i}>
                        <td>{d.date}</td>
                        <td>{d.name}</td>
                        <td>{d.type}</td>
                        <td>{d.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <Empty title="Seu gráfico começa na primeira partida">
            Jogue uma sessão para acompanhar sua evolução de verdade.
          </Empty>
        )}
      </section>
      <div className="result-detail-grid">
        <section className="panel">
          <h2>Domínio por continente</h2>
          <div className="continent-progress">
            {continentData.map((c) => (
              <div key={c.name}>
                <span>
                  {c.name}
                  <strong>
                    {c.dominados} / {c.total}
                  </strong>
                </span>
                <div className="progress-track">
                  <i style={{ width: `${(c.dominados / c.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="field-note">
            Dominado exige acertos e revisões em dias diferentes. Consulte a
            fórmula na Ajuda.
          </p>
        </section>
        <section className="panel">
          <h2>Um pouco mais de atenção</h2>
          {difficult.length ? (
            difficult.map((s) => (
              <a
                className="difficulty-row"
                href={`#/collection?country=${s.id}`}
                key={s.id}
              >
                <Flag id={s.id} />
                <span>{byId[s.id].name}</span>
                <strong>
                  {s.wrong} {s.wrong === 1 ? "erro" : "erros"}
                </strong>
                <ArrowRight size={14} />
              </a>
            ))
          ) : (
            <Empty title="Um novo começo">
              Os países que pedirem mais prática vão aparecer aqui.
            </Empty>
          )}
        </section>
      </div>
      <section className="panel spaced">
        <div className="section-heading">
          <div>
            <h2>Seu mapa de conhecimento</h2>
            <p className="field-note">
              Cada quadradinho é um país. Selecione para ver seu histórico.
            </p>
          </div>
          <div className="chart-filters">
            <select
              aria-label="Continente da matriz"
              value={continent}
              onChange={(e) => setContinent(e.target.value)}
            >
              <option value="all">Todos os continentes</option>
              {continents.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Domínio da matriz"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">Todos os níveis</option>
              {levelNames.map((n, i) => (
                <option value={i} key={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="knowledge-matrix">
          {matrix.map((c) => (
            <a
              href={`#/collection?country=${c.id}`}
              className={`knowledge-cell level-${stats[c.id].level}`}
              key={c.id}
              title={`${c.name}: ${levelNames[stats[c.id].level]}`}
              aria-label={`${c.name}: ${levelNames[stats[c.id].level]}`}
            >
              {c.code}
            </a>
          ))}
        </div>
        <div className="matrix-legend">
          {levelNames.map((name, i) => (
            <span key={name}>
              <i className={`level-${i}`} />
              {name}
            </span>
          ))}
        </div>
      </section>
      <section className="panel spaced">
        <h2>Diário de partidas</h2>
        {data.sessions.length ? (
          data.sessions
            .slice()
            .reverse()
            .slice(0, historyPage * 10)
            .map((s) => (
              <a className="history-row" href={`#/results/${s.id}`} key={s.id}>
                <span className={`stat-icon ${s.mode}`}>
                  <ModeIcon mode={s.mode} />
                </span>
                <span>
                  <strong>{modeNames[s.mode]}</strong>
                  <small>
                    {s.kind === "review"
                      ? "Revisão"
                      : s.kind === "complete"
                        ? "Completa"
                        : "Prática"}
                    {s.status === "abandoned" ? " · Interrompida" : ""}
                  </small>
                </span>
                <span>{new Date(s.startedAt).toLocaleDateString("pt-BR")}</span>
                <span>{accuracy(s.events)}%</span>
                <span>{prettyTime(s.elapsed)}</span>
                <ArrowRight size={15} />
              </a>
            ))
        ) : (
          <p className="muted">Suas partidas vão aparecer aqui.</p>
        )}
        {data.sessions.length > historyPage * 10 && (
          <button
            className="button secondary"
            onClick={() => setHistoryPage((p) => p + 1)}
          >
            Mostrar mais
          </button>
        )}
      </section>
    </>
  );
}
