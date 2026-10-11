import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Snapshot, Session, Settings } from "./types";
import { earnedAchievements, achievementDefinitions } from "./domain";
import { initialData, loadData, saveData } from "./storage";
interface Store {
  data: Snapshot;
  ready: boolean;
  error: string;
  toast: string;
  mutate: (fn: (d: Snapshot) => Snapshot) => void;
  updateActive: (
    patch: Partial<Session> | ((current: Session) => Session),
  ) => void;
  finish: (session: Session) => void;
  settings: (patch: Partial<Settings>) => void;
  replace: (snapshot: Snapshot) => void;
  notify: (message: string) => void;
}
const Context = createContext<Store>(null!);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Snapshot>(initialData);
  const dataRef = useRef(data);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  useEffect(() => {
    loadData()
      .then((d) => {
        dataRef.current = d;
        setData(d);
        setReady(true);
      })
      .catch(() => {
        setError(
          "Não foi possível abrir os dados locais. Exporte seu progresso antes de fechar e verifique o armazenamento do navegador.",
        );
        setReady(true);
      });
  }, []);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(id);
    }
  }, [toast]);
  function mutate(fn: (d: Snapshot) => Snapshot) {
    const next = fn(dataRef.current);
    dataRef.current = next;
    setData(next);
    saveData(next).catch(() =>
      setError(
        "Não foi possível salvar. Exporte um backup antes de fechar esta página.",
      ),
    );
  }
  function finish(session: Session) {
    mutate((d) => {
      const finished = {
        ...session,
        finishedAt: Date.now(),
        runtime: {},
        status:
          session.status === "abandoned"
            ? ("abandoned" as const)
            : ("completed" as const),
      };
      const sessions = [
        ...d.sessions.filter((s) => s.id !== finished.id),
        finished,
      ];
      const earned = earnedAchievements(sessions);
      const newOnes = earned.filter((id) => !d.achievements[id]);
      if (newOnes.length)
        setToast(
          `Conquista desbloqueada: ${achievementDefinitions.find((a) => a.id === newOnes[0])?.name}`,
        );
      return {
        ...d,
        active: null,
        sessions,
        achievements: {
          ...d.achievements,
          ...Object.fromEntries(newOnes.map((id) => [id, Date.now()])),
        },
      };
    });
  }
  useEffect(() => {
    const dark =
      data.settings.theme === "dark" ||
      (data.settings.theme === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.motion = data.settings.motion
      ? "full"
      : "reduced";
    document.documentElement.style.setProperty(
      "--motion-speed",
      String(data.settings.transition),
    );
  }, [data.settings]);
  return (
    <Context.Provider
      value={{
        data,
        ready,
        error,
        toast,
        mutate,
        updateActive: (patch) =>
          mutate((d) =>
            d.active
              ? {
                  ...d,
                  active:
                    typeof patch === "function"
                      ? patch(d.active)
                      : { ...d.active, ...patch },
                }
              : d,
          ),
        finish,
        settings: (patch) =>
          mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
        replace: (snapshot) => mutate(() => snapshot),
        notify: setToast,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
