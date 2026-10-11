import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  X,
  Check,
  Globe2,
  Zap,
  Radar,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  BookOpen,
  Mountain,
  Compass,
  Shield,
  Snowflake,
  Timer,
  Eye,
  Heart,
} from "lucide-react";
import { byId } from "./domain";
import { useStore } from "./store";
import type { Mode, Settings } from "./types";
export const ModeIcon = ({ mode, size = 24 }: { mode: Mode; size?: number }) =>
  mode === "normal" ? (
    <BookOpen size={size} />
  ) : mode === "avalanche" ? (
    <Zap size={size} />
  ) : (
    <Radar size={size} />
  );
export const icons = {
  check: Check,
  globe: Globe2,
  zap: Zap,
  book: BookOpen,
  mountain: Mountain,
  map: Compass,
  brain: Sparkles,
  flag: Trophy,
  scan: Radar,
};
export function Flag({
  id,
  hidden = false,
  className = "",
  label = true,
}: {
  id: string;
  hidden?: boolean;
  className?: string;
  label?: boolean;
}) {
  const { data } = useStore();
  const c = byId[id];
  return (
    <span
      className={`flag-wrap ${data.settings.relief ? "relief" : ""} ${className}`}
      style={{ aspectRatio: c.aspect || 1.5 }}
    >
      {hidden ? (
        <span className="flag-hidden">?</span>
      ) : (
        <img
          src={`${import.meta.env.BASE_URL}flags/${id}.svg`}
          alt={label ? `Bandeira de ${c.name}` : "Bandeira a identificar"}
          draggable="false"
        />
      )}
    </span>
  );
}
export function Brand() {
  return (
    <a className="brand" href="#/">
      <span className="brand-mark">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
      </span>
      Geo<span className="brand-dot">.</span>
    </a>
  );
}
export function SoundToggle() {
  const { data, settings } = useStore();
  return (
    <button
      className="icon-button"
      aria-label={data.settings.sound ? "Desativar som" : "Ativar som"}
      onClick={() => settings({ sound: !data.settings.sound })}
    >
      {data.settings.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
    </button>
  );
}
export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`button ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
export function Back({
  href = "#/",
  children = "Voltar",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a className="back-link" href={href}>
      <ArrowLeft size={17} />
      {children}
    </a>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => old?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Compass size={34} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function GlobeArt() {
  return (
    <div className="globe-art" aria-hidden="true">
      <span className="orbit orbit-one" />
      <span className="orbit orbit-two" />
      <div className="planet">
        <svg viewBox="0 0 240 240">
          <defs>
            <radialGradient id="sea" cx="30%" cy="22%" r="80%">
              <stop stopColor="#90e5ef" />
              <stop offset=".55" stopColor="#529bdc" />
              <stop offset="1" stopColor="#5656b7" />
            </radialGradient>
            <linearGradient id="land" x2=".7" y2="1">
              <stop stopColor="#caf1b1" />
              <stop offset="1" stopColor="#73caa7" />
            </linearGradient>
            <clipPath id="world-clip">
              <circle cx="120" cy="120" r="115" />
            </clipPath>
          </defs>
          <circle cx="120" cy="120" r="115" fill="url(#sea)" />
          <g clipPath="url(#world-clip)" fill="url(#land)">
            <path d="M12 48 44 28 67 33 91 19 113 30 99 46 77 49 70 61 88 80 79 93 52 90 47 107 31 102 17 81Z" />
            <path d="m65 110 24 5 12 22 21 8-9 22-12 15-7 27-10 13-5-31-10-23 6-16-15-23Z" />
            <path d="m129 44 20-16 23 9 15-8 36 31 18 41-22 5-21-15-16 9-17-20-23 3-14-13Z" />
            <path d="m137 86 26 2 19 25-8 27-19 24-13-3-8-29-18-22 4-17Z" />
            <path d="m193 162 25-8 19 19-5 15-25-2-15-11Z" />
            <path d="m179 144 5-11 5 6-3 14Z" />
          </g>
          <circle
            cx="120"
            cy="120"
            r="114"
            fill="none"
            stroke="white"
            strokeOpacity=".15"
            strokeWidth="2"
          />
        </svg>
      </div>
      <span className="floating-chip chip-bolt">
        <Zap fill="currentColor" size={38} />
      </span>
      <span className="floating-chip chip-star">
        <Sparkles size={26} />
      </span>
      <span className="spark s1">✦</span>
      <span className="spark s2">✦</span>
      <span className="spark s3">+</span>
      <span className="globe-shadow" />
    </div>
  );
}
let audioContext: AudioContext | undefined;
export function playSound(good: boolean, settings: Settings) {
  if (!settings.sound) return;
  try {
    audioContext ||= new AudioContext();
    void audioContext.resume();
    const o = audioContext.createOscillator(),
      g = audioContext.createGain();
    o.connect(g);
    g.connect(audioContext.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(good ? 660 : 220, audioContext.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      good ? 880 : 180,
      audioContext.currentTime + 0.12,
    );
    g.gain.setValueAtTime(settings.volume * 0.13, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
    o.start();
    o.stop(audioContext.currentTime + 0.21);
    if (settings.haptics && navigator.vibrate)
      navigator.vibrate(good ? 20 : [15, 20, 15]);
  } catch {
    /* Audio unavailable; visual feedback remains. */
  }
}
export const powerIcons = {
  freeze: Snowflake,
  slow: Timer,
  shield: Shield,
  clear: Zap,
  xray: Eye,
  life: Heart,
};
