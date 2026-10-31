"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  LockKeyhole,
  Unlock,
  ShieldCheck,
  LayoutDashboard,
  Volume2,
  VolumeX,
  Compass,
  GraduationCap,
  Target,
  ChartNoAxesCombined,
  Users,
  Factory,
  Lightbulb,
  KeyRound,
  RotateCcw,
  Download,
  LogIn,
  X,
  Menu,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "./ui/button";
import {
  Progress,
  Action,
  Content,
  Option,
  Calculation,
  Theory,
} from "@/lib/types";
import { unlocked } from "@/lib/game-engine";
import { pageThemes, themeStyle, designCredit } from "@/lib/page-themes";
import { StrategyBoard } from "./StrategyBoard";
import { StrategyMapBuilder } from "./StrategyMapBuilder";
import { Review } from "./Review";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
export const rooms = [
  {
    name: "Vision Vault",
    label: "STRATEGIC DIRECTION",
    description: "Find the purpose. Set the direction.",
    icon: Compass,
    color: "#a9ceff",
  },
  {
    name: "Financial Boardroom",
    label: "FINANCIAL",
    description: "Turn ambition into sustainable value.",
    icon: ChartNoAxesCombined,
    color: "#ffe0a1",
  },
  {
    name: "Customer Intelligence Lab",
    label: "CUSTOMER",
    description: "Decode what your customers value.",
    icon: Users,
    color: "#91eaff",
  },
  {
    name: "Operations Control Centre",
    label: "INTERNAL PROCESS",
    description: "Build the engine behind the promise.",
    icon: Factory,
    color: "#9df0c5",
  },
  {
    name: "Innovation Academy",
    label: "LEARNING & GROWTH",
    description: "Connect capabilities to performance.",
    icon: Lightbulb,
    color: "#dcc2ff",
  },
  {
    name: "Knowledge Vault",
    label: "KAPLAN & NORTON",
    description: "Prove your understanding. Find the exit.",
    icon: KeyRound,
    color: "#ffc4ad",
  },
];
export type PublicContent = {
  label: string;
  approved: boolean;
  settings?: Content["settings"];
  vision: { id: string; text: string }[];
  options: Pick<
    Option,
    "id" | "text" | "perspective" | "component" | "calculationId"
  >[];
  calculations: Omit<Calculation, "expected" | "tolerance">[];
  objectives: { id: string; text: string }[];
  assessment: Pick<Theory, "id" | "type" | "prompt" | "choices">[];
  review: Content["review"];
};
type State = {
  progress: Progress;
  content: PublicContent;
  mode: string;
  authAvailable: boolean;
  message?: string;
  feedback?: { id: string; correct: boolean; explanation: string }[];
};
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Persepolis Foods home">
      <span className="brand-symbol">
        P<span>◆</span>
      </span>
      <span>
        PERSEPOLIS<span className="brand-sub">F O O D S G R O U P</span>
      </span>
    </Link>
  );
}
export function GameApp({
  view,
  room = 1,
}: {
  view: "home" | "mission" | "room" | "review";
  room?: number;
}) {
  const [state, setState] = useState<State>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [sound, setSound] = useState(false);
  const [help, setHelp] = useState(false);
  const [login, setLogin] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const reduced = useReducedMotion();
  const restore = useRef(false);
  useEffect(() => {
    setSound(localStorage.getItem("pf-sound") === "true");
    fetch("/api/game")
      .then((r) => r.json())
      .then(async (data) => {
        if (data.error) throw new Error(data.error);
        const saved = localStorage.getItem("pf-progress");
        if (
          data.mode === "demo" &&
          saved &&
          !data.progress.completed.length &&
          !data.progress.events.length &&
          !restore.current
        ) {
          restore.current = true;
          const r = await fetch("/api/game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "resume",
              progress: JSON.parse(saved),
            }),
          });
          const restored = await r.json();
          if (r.ok) data = restored;
        }
        setState(data);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (state?.mode === "demo")
      localStorage.setItem("pf-progress", JSON.stringify(state.progress));
  }, [state]);
  useEffect(() => {
    if (!help && !login) return;
    const previous = document.activeElement as HTMLElement;
    const modal = document.querySelector<HTMLElement>(".modal");
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHelp(false);
        setLogin(false);
      }
      if (e.key === "Tab") {
        const els = focusable();
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [help, login]);
  useEffect(() => {
    if (!state?.progress.assessment) return;
    try {
      const key =
        "pf-draft-assessment:" +
        state.progress.id +
        ":" +
        state.progress.assessment.ids.join(",");
      setAnswers(JSON.parse(localStorage.getItem(key) || "{}"));
    } catch {
      setAnswers({});
    }
  }, [state?.progress.assessment?.ids.join(",")]);
  const updateAnswer = (id: string, value: string) => {
    setAnswers((a) => {
      const next = { ...a, [id]: value };
      if (state?.progress.assessment)
        try {
          localStorage.setItem(
            "pf-draft-assessment:" +
              state.progress.id +
              ":" +
              state.progress.assessment.ids.join(","),
            JSON.stringify(next),
          );
        } catch {}
      return next;
    });
  };
  const play = () => {
    if (!sound) return;
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.frequency.setValueAtTime(560, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.2);
      o.start();
      o.stop(ctx.currentTime + 0.3);
      o.onended = () => ctx.close();
    } catch {}
  };
  const act = async (a: Action) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(a),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      if (a.type === "new")
        for (const key of Object.keys(localStorage))
          if (key.startsWith("pf-draft")) localStorage.removeItem(key);
      setState(data);
      if (data.progress.rooms[a.room ?? 1].mistakes === 0) setSelected([]);
      play();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const current = state
    ? ([1, 2, 3, 4, 5, 6].find((r) => !state.progress.completed.includes(r)) ??
      6)
    : 1;
  const p = state?.progress;
  const done = p?.completed.includes(room);
  const roomState = p?.rooms[room];
  const allowed = p ? unlocked(p, room) : false;
  const themeId = view === "room" ? `room-${room}` : view;
  const theme = pageThemes[themeId] ?? pageThemes.home;
  return (
    <div className="app-shell" data-page={themeId} style={themeStyle(theme)}>
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <Brand />
        <div className="workspace-label">THE STRATEGY MAP ESCAPE ROOM</div>
        <nav aria-label="Main navigation">
          <Link className={view === "home" ? "nav active" : "nav"} href="/">
            <Compass size={18} /> Mission briefing
          </Link>
          <Link
            className={view === "mission" ? "nav active" : "nav"}
            href="/mission"
          >
            <LayoutDashboard size={18} /> Mission dashboard
          </Link>
          <Link
            className={view === "review" ? "nav active" : "nav"}
            href="/review"
          >
            <BookOpen size={18} /> Annual review <ArrowUpRight size={13} />
          </Link>
        </nav>
        <div className="side-divider" />
        <div className="eyebrow side-title">
          YOUR MISSION <span>06 ROOMS</span>
        </div>
        <nav className="room-nav" aria-label="Rooms">
          {rooms.map((r, i) => {
            const complete = p?.completed.includes(i + 1);
            const open = p && unlocked(p, i + 1);
            return (
              <Link
                aria-disabled={!open}
                key={r.name}
                href={open ? `/room/${i + 1}` : "#"}
                onClick={(e) => {
                  if (!open) e.preventDefault();
                  else setMobile(false);
                }}
                className={`room-nav-item ${view === "room" && room === i + 1 ? "selected" : ""} ${!open ? "locked" : ""}`}
              >
                <span className={`room-number ${complete ? "complete" : ""}`}>
                  {complete ? (
                    <Check size={13} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>{r.name}</span>
                {!open && <LockKeyhole size={12} />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="case-status">
            <span className="pulse" /> FICTIONAL TEACHING CASE
          </div>
          <p>
            Strategy is the key.
            <br />
            You make the connections.
          </p>
          <Link href="/instructor" className="instructor-link">
            <GraduationCap size={16} /> Instructor workspace{" "}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle menu"
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            MISSION CONTROL <ChevronRight size={13} />
            <span>
              {view === "room"
                ? (rooms[room - 1]?.name ?? "Unknown room")
                : view === "review"
                  ? "Annual review"
                  : view === "mission"
                    ? "Dashboard"
                    : "Mission briefing"}
            </span>
          </div>
          <div className="top-actions">
            <span className="demo-badge">
              {state?.mode === "authenticated"
                ? "AUTHENTICATED"
                : "LOCAL DEMONSTRATION"}
            </span>
            <button
              className="icon-button"
              aria-label={sound ? "Mute sound" : "Enable sound"}
              onClick={() => {
                setSound(!sound);
                localStorage.setItem("pf-sound", String(!sound));
              }}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              className="avatar"
              onClick={() => setLogin(true)}
              aria-label="Student sign in"
            >
              <Users size={17} />
            </button>
          </div>
        </header>
        <main id="main-content">
          {error && (
            <div role="alert" className="alert error">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {error.includes("Course content changed") && (
            <section className="panel">
              <p>
                The revised option bank needs a new mission. Anonymous players
                can restart below. Authenticated progress requires an instructor
                reset.
              </p>
              <Button
                disabled={busy}
                onClick={() => act({ type: "new", name })}
              >
                Start updated demo mission
              </Button>
            </section>
          )}
          {!state && !error && (
            <div className="loading">Establishing secure vault connection…</div>
          )}
          {view === "home" && (
            <>
              <div className="page-kicker">
                <span className="tiny-line" /> YOUR STRATEGY. YOUR WAY OUT.
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <p className="designer-credit opening-credit">
                    {designCredit}
                  </p>
                  <div className="eyebrow gold">
                    PERSEPOLIS FOODS GROUP{" "}
                    <span lang="fa" dir="rtl">
                      گروه صنایع غذایی پرسپولیس
                    </span>
                  </div>
                  <h1>
                    Six rooms.
                    <br />
                    One strategy.
                    <br />
                    <span>Your way out.</span>
                  </h1>
                  <p className="hero-subtitle">
                    Decode the Strategy. Build the Scorecard.
                    <br />
                    Escape the Vault.
                  </p>
                  <p className="hero-description">
                    Step inside the boardroom. Connect the decisions that
                    matter. Turn Kaplan & Norton’s Balanced Scorecard into your
                    escape plan.
                  </p>
                  <div className="hero-buttons">
                    <Button
                      disabled={!state || busy}
                      onClick={async () => {
                        if (p && (p.completed.length || p.events.length)) {
                          router.push(`/room/${current}`);
                        } else if (await act({ type: "new", name }))
                          router.push("/room/1");
                      }}
                    >
                      {p && (p.completed.length || p.events.length)
                        ? "Continue Mission"
                        : "Start Mission"}{" "}
                      <ArrowRight size={17} />
                    </Button>
                    <Button variant="outline" onClick={() => setHelp(true)}>
                      How to play <ArrowUpRight size={15} />
                    </Button>
                  </div>
                  <label className="name-input">
                    YOUR CALLSIGN <span>OPTIONAL</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Anonymous strategist"
                      maxLength={80}
                    />
                  </label>
                  <div className="hero-meta">
                    <span>
                      <ShieldCheck size={15} /> No account required
                    </span>
                    <span>
                      <Target size={15} /> Learn at your own pace
                    </span>
                  </div>
                </div>
                <div
                  className="vault-scene"
                  aria-label="Illustration of a strategic vault with six digital locks"
                  role="img"
                >
                  <div className="scene-grid" />
                  <div className="scene-orbit orbit-one" />
                  <div className="scene-orbit orbit-two" />
                  <span className="scene-coordinate">
                    PFG / STRATEGIC SYSTEMS
                    <br />
                    ACCESS LEVEL: CANDIDATE
                  </span>
                  <div className="vault-outer">
                    <div className="vault-inner">
                      <div className="vault-rim">
                        <div className="vault-core">
                          <LockKeyhole size={54} strokeWidth={1} />
                          <span>STRATEGY VAULT</span>
                          <small>AWAITING YOUR CONNECTION</small>
                        </div>
                      </div>
                      <i className="bolt b1" />
                      <i className="bolt b2" />
                      <i className="bolt b3" />
                      <i className="bolt b4" />
                    </div>
                  </div>
                  <div className="floating-tag tag-one">
                    <span className="pulse" /> SYSTEM ONLINE
                  </div>
                  <div className="floating-tag tag-two">
                    <ChartNoAxesCombined size={19} />
                    <span>
                      4 perspectives
                      <br />
                      <strong>One connected strategy</strong>
                    </span>
                  </div>
                  <div className="scene-footer">
                    <span>06 LOCKS TO DECODE</span>
                    <span className="mini-locks">
                      {rooms.map((_, i) => (
                        <LockKeyhole key={i} size={13} />
                      ))}
                    </span>
                  </div>
                </div>
              </section>
              <div className="stat-strip">
                <div>
                  <strong>06</strong>
                  <span>INTERACTIVE ROOMS</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>STRATEGIC CHAINS</span>
                </div>
                <div>
                  <strong>04</strong>
                  <span>CONNECTED PERSPECTIVES</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>MISSION TO COMPLETE</span>
                </div>
              </div>
              <section className="mission-section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow gold">THE PATH TO YOUR ESCAPE</div>
                    <h2>Every room unlocks a new perspective.</h2>
                  </div>
                  <Link href="/mission">
                    View mission map <ArrowUpRight size={16} />
                  </Link>
                </div>
                <div className="room-grid">
                  {rooms.map((r, i) => {
                    const Icon = r.icon;
                    const open = p && unlocked(p, i + 1);
                    return (
                      <Link
                        href={open ? `/room/${i + 1}` : "/mission"}
                        key={r.name}
                        className={`room-card ${open ? "available" : ""}`}
                        style={
                          { "--room-color": r.color } as React.CSSProperties
                        }
                      >
                        <div className="card-top">
                          <span className="eyebrow">
                            ROOM {String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={`status ${p?.completed.includes(i + 1) ? "complete" : open ? "open" : ""}`}
                          >
                            {p?.completed.includes(i + 1)
                              ? "COMPLETED"
                              : open
                                ? "AVAILABLE"
                                : "LOCKED"}{" "}
                            {!open && <LockKeyhole size={10} />}
                          </span>
                        </div>
                        <div className="room-card-icon">
                          <Icon size={25} strokeWidth={1.4} />
                        </div>
                        <h3>{r.name}</h3>
                        <p>{r.description}</p>
                        <div className="card-bottom">
                          <span>{r.label}</span>
                          {open ? (
                            <ArrowRight size={15} />
                          ) : (
                            <LockKeyhole size={14} />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
              <section className="briefing-panel">
                <div>
                  <div className="eyebrow gold">YOUR BRIEFING</div>
                  <h2>The board is counting on you.</h2>
                </div>
                <p>
                  Persepolis Foods Group is facing a critical strategic
                  transformation. The Board of Directors has recruited you to
                  reconstruct the company&apos;s strategic performance system.
                  Six locked rooms stand between you and freedom. Analyse the
                  evidence, construct the Balanced Scorecard, connect the
                  strategy and demonstrate your knowledge of Kaplan and
                  Norton&apos;s framework to escape.
                </p>
                <Link href="/review">
                  Open the annual review <BookOpen size={17} />
                </Link>
              </section>
            </>
          )}
          {view === "mission" && p && (
            <>
              <div className="page-kicker">MISSION CONTROL / {p.name}</div>
              <h1 className="page-title">Your strategy, taking shape.</h1>
              <p className="muted">
                Six rooms. Twelve strategic chains. One connected performance
                system.
              </p>
              <div className="dashboard-stats">
                <div className="panel">
                  <span>ROOMS SECURED</span>
                  <strong>
                    {p.completed.length}
                    <small> / 6</small>
                  </strong>
                </div>
                <div className="panel">
                  <span>MISSION SCORE</span>
                  <strong>{p.score}</strong>
                </div>
                <div className="panel">
                  <span>INCORRECT SUBMISSIONS</span>
                  <strong>
                    {Object.values(p.rooms).reduce(
                      (s, r) => s + r.incorrect,
                      0,
                    )}
                  </strong>
                </div>
                <div className="panel">
                  <span>ASSESSMENT ATTEMPTS</span>
                  <strong>{p.attempts.length}</strong>
                </div>
              </div>
              <div className="room-grid">
                {rooms.map((r, i) => (
                  <Link
                    className="room-card"
                    key={r.name}
                    href={unlocked(p, i + 1) ? `/room/${i + 1}` : "#"}
                  >
                    <div className="card-top">
                      <span>0{i + 1}</span>
                      <span className="status">
                        {p.completed.includes(i + 1)
                          ? "COMPLETED"
                          : unlocked(p, i + 1)
                            ? "CURRENT"
                            : "LOCKED"}
                      </span>
                    </div>
                    <h3>{r.name}</h3>
                    <p>
                      {i > 0 && i < 5
                        ? `${p.rooms[i + 1].rows.length}/3 chains · ${p.rooms[i + 1].restarts} restarts`
                        : r.description}
                    </p>
                    <p>
                      {Object.keys(p.rooms[i + 1].calculations).length}{" "}
                      calculations confirmed
                    </p>
                    <ArrowRight size={17} />
                  </Link>
                ))}
              </div>
              <div className="two-column">
                <div className="panel">
                  <h3>Perspective progress</h3>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rooms.slice(1, 5).map((r, i) => ({
                          name: r.label,
                          value: p.rooms[i + 2].rows.length,
                        }))}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#9baeb8", fontSize: 9 }}
                        />
                        <YAxis domain={[0, 3]} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: "#132936",
                            borderColor: "#31515e",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#68c6aa"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="panel">
                  <h3>Assessment record</h3>
                  {p.attempts.length ? (
                    p.attempts.map((a, i) => (
                      <p key={i}>
                        Attempt {i + 1}:{" "}
                        <strong>
                          {a.score}/10 ({a.score * 10}%)
                        </strong>{" "}
                        — {a.score >= 8 ? "PASS" : "RETRY"}
                      </p>
                    ))
                  ) : (
                    <p className="muted">
                      The Knowledge Vault opens after Room 5.
                    </p>
                  )}
                  <p>
                    Status:{" "}
                    {p.finishedAt
                      ? "Mission complete"
                      : `Room ${current} in progress`}
                  </p>
                  {p.finishedAt && (
                    <Button asChild>
                      <a href="/api/certificate">
                        <Download size={16} /> Download certificate
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <p className="data-note">
                {state?.mode === "demo"
                  ? "Anonymous demonstration: local storage can be modified and is unsuitable for secure summative assessment."
                  : "Authenticated progress and answer validation are authoritative on the server."}
              </p>
              {state?.mode === "demo" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      confirm(
                        "Start a new anonymous mission? This clears your current demo progress.",
                      )
                    )
                      act({ type: "new", name });
                  }}
                >
                  <RotateCcw size={15} /> Start a new mission
                </Button>
              )}
            </>
          )}
          {view === "review" && state && (
            <Review pages={state.content.review} />
          )}
          {view === "room" &&
            state &&
            (!allowed ? (
              <div className="locked-panel panel">
                <LockKeyhole size={52} />
                <h1>Vault access restricted.</h1>
                <p>Complete the previous room before entering this one.</p>
                <Button asChild>
                  <Link href={`/room/${current}`}>
                    Return to current room <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div
                  className="room-heading"
                  style={
                    {
                      "--room-color": rooms[room - 1].color,
                    } as React.CSSProperties
                  }
                >
                  <div>
                    <div className="eyebrow gold">
                      ROOM {String(room).padStart(2, "0")} / 06 ·{" "}
                      {rooms[room - 1].label}
                    </div>
                    <h1 className="page-title">
                      {room === 6
                        ? "Kaplan & Norton Knowledge Vault"
                        : rooms[room - 1].name}
                    </h1>
                    <p className="muted">{rooms[room - 1].description}</p>
                  </div>
                  <Link
                    className="button outline"
                    href="/review"
                    target="_blank"
                  >
                    <BookOpen size={16} /> Case evidence
                  </Link>
                </div>
                <div className="room-toolbar">
                  <span>
                    <span className="pulse" />{" "}
                    {done ? "COMPLETED · READ ONLY" : "MISSION ACTIVE"}
                  </span>
                  <span>
                    MISTAKES {roomState!.mistakes}/
                    {state.content.settings?.mistakeLimit ?? 3}
                  </span>
                  <span>SCORE {p!.score}</span>
                </div>
                {state.message && (
                  <div role="status" className="alert success">
                    {state.message}
                  </div>
                )}
                {room === 1 && (
                  <section className="panel">
                    <div className="eyebrow gold">
                      01 / DECODE THE STRATEGIC IDENTITY
                    </div>
                    <h2>Which three statements belong in the vault?</h2>
                    <p className="muted">
                      Use the supplied case’s purpose, vision and mission.
                      Select exactly three statements.{" "}
                      {state.content.settings?.mistakeLimit ?? 3} incorrect
                      submissions restart this room. These statements are
                      editorial interpretations of the case.
                    </p>
                    <div className="vision-grid">
                      {state.content.vision.map((v) => (
                        <button
                          key={v.id}
                          disabled={done || busy}
                          className={`vision-card ${(done ? roomState?.vision : selected)?.includes(v.id) ? "chosen" : ""}`}
                          onClick={() =>
                            setSelected((s) =>
                              s.includes(v.id)
                                ? s.filter((x) => x !== v.id)
                                : s.length < 3
                                  ? [...s, v.id]
                                  : s,
                            )
                          }
                        >
                          <span className="checkbox">
                            {(done ? roomState?.vision : selected)?.includes(
                              v.id,
                            ) && <Check size={14} />}
                          </span>
                          {v.text}
                        </button>
                      ))}
                    </div>
                    {!done && (
                      <Button
                        disabled={selected.length !== 3 || busy}
                        onClick={() =>
                          act({ type: "vision", room: 1, ids: selected })
                        }
                      >
                        Confirm strategic direction <Unlock size={16} />
                      </Button>
                    )}
                  </section>
                )}
                {room >= 2 && room <= 5 && (
                  <StrategyBoard
                    key={`${room}-${roomState!.restarts}-${roomState!.rows.length}`}
                    storageKey={`pf-draft-board:${p!.id}:${p!.contentVersion}:${room}:${roomState!.restarts}:${roomState!.rows.length}`}
                    room={room}
                    state={roomState!}
                    content={state.content}
                    done={!!done}
                    busy={busy}
                    act={act}
                  />
                )}
                {room === 5 && roomState!.rows.length === 3 && (
                  <StrategyMapBuilder
                    key={`${p!.id}-${roomState!.restarts}`}
                    storageKey={`pf-draft-map:${p!.id}:${p!.contentVersion}:${roomState!.restarts}`}
                    content={state.content}
                    saved={roomState!.map}
                    done={!!done}
                    busy={busy}
                    act={act}
                  />
                )}
                {room === 6 && !done && (
                  <section className="panel">
                    <div className="eyebrow gold">
                      THE FINAL LOCK / TEN QUESTIONS
                    </div>
                    <h2>Knowledge is your exit key.</h2>
                    <p className="muted">
                      Ten equally weighted questions. At least{" "}
                      {Math.ceil(
                        10 * (state.content.settings?.passThreshold ?? 0.75),
                      )}
                      /10 to pass the{" "}
                      {(state.content.settings?.passThreshold ?? 0.75) * 100}%
                      threshold. Unlimited retries; earlier rooms stay secured.
                    </p>
                    {state.feedback && (
                      <div className="review-feedback">
                        {state.feedback.map((f, i) => (
                          <p key={f.id}>
                            {f.correct ? "✓" : "×"} Question {i + 1}:{" "}
                            {f.explanation}
                          </p>
                        ))}
                      </div>
                    )}
                    {!p!.assessment ? (
                      <Button
                        disabled={busy}
                        onClick={() => {
                          setAnswers({});
                          act({ type: "assessment-start", room: 6 });
                        }}
                      >
                        {p!.attempts.length
                          ? "Retry Assessment"
                          : "Begin Assessment"}{" "}
                        <ArrowRight size={16} />
                      </Button>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          act({ type: "assessment-submit", room: 6, answers });
                        }}
                      >
                        {p!.assessment.ids.map((id, i) => {
                          const q = state.content.assessment.find(
                            (q) => q.id === id,
                          )!;
                          return (
                            <fieldset className="question" key={id}>
                              <legend>
                                <span className="eyebrow gold">
                                  QUESTION {i + 1} / 10 · {q.type.toUpperCase()}
                                </span>
                                <br />
                                {q.prompt}
                              </legend>
                              {q.type === "blank" ? (
                                <input
                                  aria-label={`Answer question ${i + 1}`}
                                  required
                                  value={answers[id] ?? ""}
                                  onChange={(e) =>
                                    updateAnswer(id, e.target.value)
                                  }
                                />
                              ) : (
                                q.choices.map((choice) => (
                                  <label className="choice" key={choice}>
                                    <input
                                      type="radio"
                                      name={id}
                                      required
                                      checked={answers[id] === choice}
                                      onChange={() => updateAnswer(id, choice)}
                                    />
                                    {choice}
                                  </label>
                                ))
                              )}
                            </fieldset>
                          );
                        })}
                        <Button disabled={busy}>
                          Submit & unlock the exit <KeyRound size={16} />
                        </Button>
                      </form>
                    )}
                  </section>
                )}
                {done && (
                  <motion.section
                    initial={reduced ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="completion panel"
                  >
                    <div className="completion-icon">
                      <Unlock size={32} />
                    </div>
                    <div className="eyebrow gold">
                      {room === 6
                        ? "ALL SIX ROOMS SECURED"
                        : "STRATEGIC LOCK RELEASED"}
                    </div>
                    <h2>
                      {room === 6
                        ? "YOU ARE FREE!"
                        : "ROOM COMPLETED! THE NEXT ROOM IS NOW UNLOCKED."}
                    </h2>
                    {room === 6 ? (
                      <>
                        <p className="designer-credit completion-credit">
                          {designCredit}
                        </p>
                        <p>
                          Congratulations! You have successfully completed the
                          Persepolis Foods Strategy Map Escape Room. You have
                          demonstrated your understanding of strategic
                          objectives, performance measurement, strategic
                          alignment and Kaplan and Norton&apos;s Balanced
                          Scorecard framework.
                        </p>
                        <p>
                          {p!.attempts.at(-1)?.score}/10 ·{" "}
                          {(p!.attempts.at(-1)?.score ?? 0) * 10}% ·{" "}
                          {p!.attempts.length} attempt(s) ·{" "}
                          {new Date(p!.finishedAt!).toLocaleDateString(
                            "en-GB",
                            { timeZone: "Europe/London" },
                          )}
                        </p>
                        <Button asChild>
                          <a href="/api/certificate">
                            <Download size={16} /> Download completion
                            certificate
                          </a>
                        </Button>
                      </>
                    ) : (
                      <Button asChild>
                        <Link href={`/room/${room + 1}`}>
                          ENTER NEXT ROOM <ArrowRight size={16} />
                        </Link>
                      </Button>
                    )}
                  </motion.section>
                )}
              </>
            ))}
          <div className="designer-credit footer-credit">{designCredit}</div>
          <footer>
            <span>
              PERSEPOLIS FOODS{" "}
              <span className="muted">/ STRATEGY MAP ESCAPE ROOM</span>
            </span>
            <span>
              Built for curious minds. Designed for strategic thinking.
            </span>
            <span>
              EDUCATIONAL EXPERIENCE <span className="pulse" />
            </span>
          </footer>
        </main>
      </div>
      {help && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="How to play"
            className="modal"
          >
            <button
              className="modal-close icon-button"
              aria-label="Close instructions"
              onClick={() => setHelp(false)}
            >
              <X />
            </button>
            <div className="eyebrow gold">MISSION PROTOCOL</div>
            <h2>Make the connections.</h2>
            <ol>
              <li>
                Read the annual review and identify three strategic statements.
              </li>
              <li>
                Build three Objective → Measure → Target → Initiative chains per
                perspective. Drag cards or click to select.
              </li>
              <li>Check linked KPI calculations before validating a target.</li>
              <li>
                Three incorrect submitted chains restart only the current room.
              </li>
              <li>Reconstruct the twelve-objective Strategy Map.</li>
              <li>Score at least 8/10 in the Knowledge Vault to escape.</li>
            </ol>
            <p className="data-note">
              No timer. No required personal data. Anonymous progress stays in
              your browser; it is not suitable for summative assessment.
            </p>
            <Button onClick={() => setHelp(false)}>
              Understood <Check size={16} />
            </Button>
          </section>
        </div>
      )}
      {login && (
        <div className="modal-backdrop">
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Student sign in"
            className="modal"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const r = await fetch("/api/auth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, password }),
                });
                const data = await r.json();
                if (!r.ok) throw new Error(data.error);
                location.reload();
              } catch (e) {
                setError((e as Error).message);
                setLogin(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            <button
              type="button"
              className="modal-close icon-button"
              aria-label="Close sign in"
              onClick={() => setLogin(false)}
            >
              <X />
            </button>
            <h2>Student access</h2>
            {state?.mode === "authenticated" ? (
              <Button
                type="button"
                onClick={async () => {
                  await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "logout" }),
                  });
                  location.reload();
                }}
              >
                Sign out
              </Button>
            ) : state?.authAvailable ? (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <Button disabled={busy}>
                  <LogIn size={16} /> Sign in
                </Button>
              </>
            ) : (
              <p>
                Authenticated assessment is not configured. You can play the
                full anonymous demonstration without an account. Instructors can
                enable Supabase using the deployment instructions.
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
