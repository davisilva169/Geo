import { useState } from "react";
import { Search, ArrowRight, Clock3, Check, X, Info } from "lucide-react";
import { useStore } from "../store";
import {
  allSessions,
  byId,
  continents,
  countries,
  deriveStats,
  levelNames,
  normalize,
} from "../domain";
import { Back, Empty, Flag, Modal } from "../components";
export function Collection() {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("all");
  const [level, setLevel] = useState("all");
  const [selected, setSelected] = useState<string | null>(
    new URLSearchParams(location.hash.split("?")[1]).get("country"),
  );
  const stats = deriveStats(allSessions(data));
  const list = countries.filter(
    (c) =>
      (continent === "all" || c.continent === continent) &&
      (level === "all" || stats[c.id].level === Number(level)) &&
      normalize(`${c.name} ${c.aliases.join(" ")}`).includes(normalize(query)),
  );
  const c = selected ? byId[selected] : null;
  const s = c ? stats[c.id] : null;
  const history = c
    ? allSessions(data)
        .flatMap((s) => s.events)
        .filter((e) => e.countryId === c.id)
        .slice(-15)
        .reverse()
    : [];
  return (
    <>
      <Back />
      <div className="page-heading">
        <div>
          <span className="eyebrow">196 PEQUENOS MUNDOS</span>
          <h1>Coleção de bandeiras</h1>
          <p>Conheça os detalhes. Encontre as diferenças. Guarde na memória.</p>
        </div>
        <span className="collection-count">{list.length} bandeiras</span>
      </div>
      <div className="collection-toolbar">
        <label className="search-field">
          <Search size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Encontre um país…"
            aria-label="Buscar país"
          />
        </label>
        <select
          aria-label="Filtrar continente"
          value={continent}
          onChange={(e) => setContinent(e.target.value)}
        >
          <option value="all">Todos os continentes</option>
          {continents.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar domínio"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">Todos os níveis</option>
          {levelNames.map((n, i) => (
            <option key={n} value={i}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="collection-grid">
        {list.map((c) => (
          <button
            className="country-card"
            key={c.id}
            onClick={() => setSelected(c.id)}
          >
            <div className="country-flag">
              <Flag id={c.id} />
            </div>
            <strong>{c.name}</strong>
            <span>{c.continent}</span>
            <small className={`mastery-label level-${stats[c.id].level}`}>
              {levelNames[stats[c.id].level]}
            </small>
          </button>
        ))}
      </div>
      {!list.length && (
        <Empty title="Nenhuma bandeira por aqui">
          Tente outro nome ou ajuste os filtros.
        </Empty>
      )}
      {c && s && (
        <Modal title={c.name} onClose={() => setSelected(null)}>
          <div className="country-detail">
            <Flag id={c.id} />
            <span className={`mastery-label level-${s.level}`}>
              {levelNames[s.level]}
            </span>
            <p>
              {c.continent} · {c.region}
            </p>
            {c.flagNote && (
              <p className="country-note">
                <Info size={17} />
                {c.flagNote}
              </p>
            )}
            <div className="country-stat-grid">
              <span>
                <strong>{s.correct}</strong>Acertos
              </span>
              <span>
                <strong>{s.wrong}</strong>Erros
              </span>
              <span>
                <strong>
                  {s.seen ? Math.round((s.correct / s.seen) * 100) + "%" : "—"}
                </strong>
                Precisão
              </span>
              <span>
                <strong>
                  {s.seen ? (s.totalMs / s.seen / 1000).toFixed(1) + "s" : "—"}
                </strong>
                Tempo médio
              </span>
            </div>
            <dl className="metric-list">
              <div>
                <dt>Última revisão</dt>
                <dd>
                  {s.last
                    ? new Date(s.last).toLocaleDateString("pt-BR")
                    : "Ainda não estudado"}
                </dd>
              </div>
              <div>
                <dt>Próxima revisão</dt>
                <dd>
                  {s.due
                    ? new Date(s.due).toLocaleDateString("pt-BR")
                    : "Na primeira sessão"}
                </dd>
              </div>
              <div>
                <dt>Acertos consecutivos</dt>
                <dd>{s.streak}</dd>
              </div>
            </dl>
            <h3>Olhe com atenção também</h3>
            <div className="similar-flags">
              {c.similar.map((id) => (
                <button key={id} onClick={() => setSelected(id)}>
                  <Flag id={id} />
                  <span>{byId[id].name}</span>
                </button>
              ))}
            </div>
            {Object.keys(s.confusions).length > 0 && (
              <>
                <h3>Suas confusões mais frequentes</h3>
                {Object.entries(s.confusions)
                  .sort((a, b) => b[1] - a[1])
                  .map(([id, n]) => (
                    <p key={id}>
                      {byId[id].name}: {n} {n === 1 ? "vez" : "vezes"}
                    </p>
                  ))}
              </>
            )}
            <h3>Respostas recentes</h3>
            {history.length ? (
              <div className="country-history">
                {history.map((e) => (
                  <div key={e.id}>
                    {e.correct ? (
                      <Check size={16} className="text-teal" />
                    ) : (
                      <X size={16} className="text-coral" />
                    )}
                    <span>
                      {e.kind === "assist"
                        ? "Assistida"
                        : e.correct
                          ? "Acerto"
                          : "Erro"}
                    </span>
                    <time>{new Date(e.at).toLocaleDateString("pt-BR")}</time>
                    <span>{(e.ms / 1000).toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                Comece uma partida para construir este histórico.
              </p>
            )}
            <details>
              <summary>Nomes alternativos aceitos</summary>
              <p>{c.aliases.join(", ")}</p>
            </details>
          </div>
        </Modal>
      )}
    </>
  );
}
