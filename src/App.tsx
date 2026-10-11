import { useEffect, useState, Suspense, lazy } from "react";
import {
  BookOpen,
  ChartNoAxesCombined,
  Flag,
  House,
  Menu,
  Settings as SettingsIcon,
  Trophy,
  CircleHelp,
  X,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { Brand } from "./components";
import { Home } from "./pages/Home";
import { Setup } from "./pages/Setup";
import { QuizGame, AvalancheGame } from "./pages/Games";
import { Results } from "./pages/Results";
const Progress = lazy(() =>
  import("./pages/Progress").then((module) => ({ default: module.Progress })),
);
import { Collection } from "./pages/Collection";
import { Achievements, Help, Settings } from "./pages/Extras";
import { allSessions, deriveStats } from "./domain";
import { levelFromXp } from "./xp";
import type { Mode } from "./types";
function Shell() {
  const { data, ready, error, toast } = useStore();
  const [hash, setHash] = useState(location.hash || "#/");
  const [menu, setMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const change = () => {
      setHash(location.hash || "#/");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    const on = () => setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  const [path, param] = hash.replace(/^#\/?/, "").split("?")[0].split("/");
  const game = path === "play";
  const xp = Object.values(deriveStats(allSessions(data))).reduce(
    (a, s) => a + s.xp,
    0,
  );
  let page;
  if (!ready)
    page = (
      <div className="loading">
        <span className="brand-mark">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
        </span>
        <h2>Preparando seu próximo destino…</h2>
      </div>
    );
  else if (path === "setup" && ["normal", "avalanche", "radar"].includes(param))
    page = <Setup key={hash} mode={param as Mode} />;
  else if (game)
    page = data.active ? (
      data.active.mode === "avalanche" ? (
        <AvalancheGame key={data.active.id} session={data.active} />
      ) : (
        <QuizGame key={data.active.id} session={data.active} />
      )
    ) : (
      <Home />
    );
  else if (path === "results") page = <Results id={param} />;
  else if (path === "progress") page = <Progress />;
  else if (path === "collection") page = <Collection key={hash} />;
  else if (path === "achievements") page = <Achievements />;
  else if (path === "settings") page = <Settings />;
  else if (path === "help") page = <Help />;
  else page = <Home />;
  const links = [
    ["", "Início", House],
    ["collection", "Bandeiras", Flag],
    ["progress", "Meu progresso", ChartNoAxesCombined],
    ["achievements", "Conquistas", Trophy],
  ] as const;
  return (
    <>
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className={menu ? "open" : ""} aria-label="Navegação principal">
            {links.map(([href, label, Icon]) => (
              <a
                key={href}
                href={`#/${href}`}
                className={path === href ? "active" : ""}
              >
                <Icon size={17} />
                {label}
              </a>
            ))}
          </nav>
          <div className="header-right">
            <span className="level-pill">
              <Sparkles size={15} />
              Nível {levelFromXp(xp)}
            </span>
            <a className="icon-button" aria-label="Ajuda" href="#/help">
              <CircleHelp size={20} />
            </a>
            <a
              className="icon-button"
              aria-label="Configurações"
              href="#/settings"
            >
              <SettingsIcon size={20} />
            </a>
            <button
              className="icon-button menu-toggle"
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      {offline && (
        <div className="offline-banner">
          Você está offline. Suas descobertas continuam sendo salvas neste
          navegador.
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <a href="#/settings">Exportar dados</a>
        </div>
      )}
      <main
        id="main"
        tabIndex={-1}
        className={`main-container ${game ? "game-container" : ""}`}
      >
        <Suspense
          fallback={
            <div className="loading">
              <h2>Preparando suas descobertas…</h2>
            </div>
          }
        >
          {page}
        </Suspense>
      </main>
      {!game && (
        <footer className="site-footer">
          <Brand />
          <span>Seu mundo fica maior a cada descoberta.</span>
          <a href="#/help">Como jogar</a>
          <a href="#/settings">Seus dados</a>
          <span className="footer-local">
            <CheckCircle2 size={14} />
            Sem cadastro. No seu ritmo.
          </span>
        </footer>
      )}
      {toast && (
        <div role="status" className="toast">
          <Trophy size={21} />
          {toast}
        </div>
      )}
    </>
  );
}
export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
