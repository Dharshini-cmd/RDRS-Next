import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CirclePause,
  FileWarning,
  LayoutDashboard,
  LogIn,
  Play,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  Wifi,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type NavItem =
  | "Overview"
  | "Live Activity"
  | "Incidents"
  | "Monitored Profiles"
  | "Reports";

type PresetTone = "neutral" | "cyan" | "amber" | "red";

type Preset = {
  id:
    | "benign"
    | "backup"
    | "rename_burst"
    | "ransomware_burst";
  label: string;
  note: string;
  tone: PresetTone;
};

type Incident = {
  id: number;
  title: string;
  severity: string;
  source: string;
  explanation: string;
  riskScore: number;
  status: string;
};

type EventItem = {
  id: number;
  filePath: string;
  eventType: string;
  source: string;
  isProtectedPath: boolean;
};

type Profile = {
  id: number;
  name: string;
  testFolder: string;
  riskThreshold: number;
  enabled: boolean;
};

/* -------------------------------------------------------------------------- */
/* Navigation / presets                                                       */
/* -------------------------------------------------------------------------- */

const navItems: NavItem[] = [
  "Overview",
  "Live Activity",
  "Incidents",
  "Monitored Profiles",
  "Reports",
];

const presets: Preset[] = [
  {
    id: "benign",
    label: "Benign editing",
    note: "4 ordinary modifications",
    tone: "neutral",
  },
  {
    id: "backup",
    label: "Backup-like activity",
    note: "10 sequential writes",
    tone: "cyan",
  },
  {
    id: "rename_burst",
    label: "Bulk rename burst",
    note: "9 extension transitions",
    tone: "amber",
  },
  {
    id: "ransomware_burst",
    label: "Ransomware-like burst",
    note: "18 high-risk signals",
    tone: "red",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function severityClass(severity: string) {
  switch (severity) {
    case "critical":
      return "border-red-500/25 bg-red-500/10 text-red-300";

    case "high":
      return "border-orange-400/25 bg-orange-400/10 text-orange-200";

    case "medium":
      return "border-amber-300/25 bg-amber-300/10 text-amber-200";

    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

function metricToneClass(tone: string) {
  switch (tone) {
    case "red":
      return "text-red-300";

    case "cyan":
      return "text-cyan-300";

    case "green":
      return "text-emerald-300";

    default:
      return "text-slate-300";
  }
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  const [activeNav, setActiveNav] = useState<NavItem>("Overview");

  const summary = trpc.dashboard.summary.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 12000,
  });

  const simulate = trpc.telemetry.simulate.useMutation({
    onSuccess: (result) => {
      summary.refetch();

      toast.success(
        `Simulation created · risk ${result.riskScore}/100`
      );
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const toggleProfile = trpc.response.toggleProfile.useMutation({
    onSuccess: () => {
      summary.refetch();

      toast.success("Monitoring profile updated");
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const data = summary.data;

  const incidents: Incident[] = data?.incidents ?? [];
  const events: EventItem[] = data?.events ?? [];

  const activeCount = data?.activeIncidents ?? 0;

  const profile: Profile | undefined = data?.profiles?.[0];

  const health = useMemo(
    () => (profile?.enabled ? "Protected" : "Paused"),
    [profile?.enabled]
  );

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#071019] text-slate-400">
        Loading secure workspace…
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Authentication                                                           */
  /* ------------------------------------------------------------------------ */

  if (!isAuthenticated) {
    return <Landing />;
  }

  /* ------------------------------------------------------------------------ */
  /* Dashboard                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#071019] text-slate-100">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                            */}
      {/* ------------------------------------------------------------------ */}

      <aside className="fixed inset-y-0 left-0 hidden w-[248px] border-r border-white/10 bg-[#09141f] px-5 py-6 lg:flex lg:flex-col">
        {/* Logo */}

        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-[#06202a] shadow-[0_0_24px_rgba(34,211,238,.28)]">
            <ShieldCheck size={20} />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-[.18em] text-cyan-200">
              RDRS
            </p>

            <p className="text-[10px] uppercase tracking-[.16em] text-slate-500">
              Risk observability
            </p>
          </div>
        </div>

        {/* Environment */}

        <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[.16em] text-slate-500">
              Environment
            </span>

            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" />
          </div>

          <p className="mt-2 text-sm font-medium">
            Authorized test lab
          </p>

          <p className="mt-1 truncate text-xs text-slate-500">
            {profile?.testFolder || "/authorized/test-folder"}
          </p>
        </div>

        {/* Navigation */}

        <nav className="mt-8 space-y-1">
          {navItems.map((item, index) => (
            <button
              key={item}
              onClick={() => setActiveNav(item)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                activeNav === item
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:bg-white/[.04] hover:text-slate-200"
              }`}
            >
              <span
                className={
                  activeNav === item
                    ? "text-cyan-300"
                    : "text-slate-600"
                }
              >
                {index === 0 ? (
                  <LayoutDashboard size={17} />
                ) : index === 1 ? (
                  <Radio size={17} />
                ) : index === 2 ? (
                  <AlertTriangle size={17} />
                ) : index === 3 ? (
                  <SlidersHorizontal size={17} />
                ) : (
                  <FileWarning size={17} />
                )}
              </span>

              {item}

              {item === "Incidents" && activeCount > 0 && (
                <span className="ml-auto rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] text-red-200">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Simulation Lab */}

        <div className="mt-auto rounded-2xl border border-white/10 bg-[#0c1a27] p-3">
          <div className="flex items-center gap-2">
            <Sparkles
              size={15}
              className="text-cyan-300"
            />

            <p className="text-xs font-medium">
              Simulation Lab
            </p>
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Generate safe, labeled telemetry for demos without
            touching real files.
          </p>

          <button
            onClick={() => setActiveNav("Overview")}
            className="mt-3 flex items-center gap-1 text-xs text-cyan-300"
          >
            Open lab
            <ChevronRight size={13} />
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main                                                                */}
      {/* ------------------------------------------------------------------ */}

      <main className="min-h-screen lg:ml-[248px]">
        {/* Header */}

        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#071019]/90 px-5 py-4 backdrop-blur-xl lg:px-9">
          <div>
            <p className="text-xs uppercase tracking-[.22em] text-slate-500">
              Security operations / {activeNav}
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Risk observability center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-3 py-2 text-xs text-emerald-200 sm:flex">
              <Wifi size={13} />
              Agent channel healthy
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 text-xs font-semibold">
                {(user?.name || "A")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <button
                onClick={() => logout()}
                className="text-xs text-slate-500 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Content */}

        <div className="space-y-7 px-5 py-7 lg:px-9">
          {/* ---------------------------------------------------------------- */}
          {/* Metrics                                                          */}
          {/* ---------------------------------------------------------------- */}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Active incidents"
              value={String(activeCount).padStart(2, "0")}
              detail={
                activeCount
                  ? "Needs analyst attention"
                  : "No open investigations"
              }
              icon={<AlertTriangle size={17} />}
              tone="red"
            />

            <Metric
              label="Telemetry · 24h"
              value={String(
                data?.telemetry24h ?? 0
              ).padStart(2, "0")}
              detail="Agent + simulation events"
              icon={<Activity size={17} />}
              tone="cyan"
            />

            <Metric
              label="Monitored profiles"
              value={String(
                data?.profiles?.length ?? 0
              ).padStart(2, "0")}
              detail="Explicit test folders only"
              icon={<SlidersHorizontal size={17} />}
              tone="slate"
            />

            <Metric
              label="Protection state"
              value={health}
              detail="Quarantine guardrails on"
              icon={<ShieldCheck size={17} />}
              tone="green"
            />
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Simulation + Monitoring                                          */}
          {/* ---------------------------------------------------------------- */}

          <section className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
            {/* Simulation Lab */}

            <Card className="overflow-hidden border-white/10 bg-[#0b1824] shadow-2xl shadow-black/20">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Simulation Lab
                    </CardTitle>

                    <p className="mt-1 text-xs text-slate-500">
                      Synthetic telemetry is always marked{" "}
                      <span className="text-cyan-300">
                        SIMULATION
                      </span>
                      .
                    </p>
                  </div>

                  <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <TerminalSquare
                      size={13}
                      className="mr-1"
                    />
                    Safe mode
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    disabled={simulate.isPending}
                    onClick={() =>
                      simulate.mutate({
                        preset: preset.id,
                      })
                    }
                    className={`group rounded-xl border border-white/10 bg-white/[.025] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[.05] ${
                      preset.tone === "red"
                        ? "hover:border-red-300/35"
                        : "hover:border-cyan-300/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[.06] text-slate-300">
                        <Play
                          size={15}
                          className="ml-0.5"
                        />
                      </div>

                      <ArrowUpRight
                        size={15}
                        className="text-slate-700 transition group-hover:text-cyan-300"
                      />
                    </div>

                    <p className="mt-4 text-sm font-medium">
                      {preset.label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {preset.note}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Monitoring Posture */}

            <Card className="border-white/10 bg-[#0b1824]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Monitoring posture
                  </CardTitle>

                  <Badge
                    className={
                      profile?.enabled !== false
                        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                        : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                    }
                  >
                    {profile?.enabled !== false
                      ? "Protected"
                      : "Paused"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                    <ShieldCheck size={24} />
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      {profile?.name ||
                        "Safe test folder"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {profile?.testFolder ||
                        "/authorized/test-folder"}
                    </p>
                  </div>
                </div>

                <Separator className="my-5 bg-white/10" />

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Risk threshold
                    </span>

                    <span className="text-slate-200">
                      {profile?.riskThreshold ?? 65}
                      /100
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Quarantine
                    </span>

                    <span className="text-emerald-200">
                      Designated path only
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 w-full border-white/10 bg-white/[.03] text-slate-200 hover:bg-white/[.07]"
                  disabled={!profile || toggleProfile.isPending}
                  onClick={() => {
                    if (!profile) return;

                    toggleProfile.mutate({
                      profileId: profile.id,
                      enabled: !profile.enabled,
                    });
                  }}
                >
                  {profile?.enabled ? (
                    <>
                      <CirclePause
                        size={15}
                        className="mr-2"
                      />
                      Disable profile
                    </>
                  ) : (
                    <>
                      <Play
                        size={15}
                        className="mr-2"
                      />
                      Enable profile
                    </>
                  )}
                </Button>

                <p className="mt-3 text-[10px] leading-4 text-slate-600">
                  This control changes the profile boundary.
                  Endpoint agent pause/resume and confirmed
                  quarantine remain local-only commands for the
                  authorized test machine.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Recent incidents + Live activity                                */}
          {/* ---------------------------------------------------------------- */}

          <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            {/* Recent incidents */}

            <Card className="border-white/10 bg-[#0b1824]">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">
                    Recent incidents
                  </CardTitle>

                  <p className="mt-1 text-xs text-slate-500">
                    Explainable detections grouped by activity
                    window.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setActiveNav("Incidents")
                  }
                  className="text-xs text-cyan-300 hover:text-cyan-100"
                >
                  View all
                </button>
              </CardHeader>

              <CardContent className="space-y-2">
                {incidents.length ? (
                  incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-3"
                    >
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${severityClass(
                          incident.severity
                        )}`}
                      >
                        <AlertTriangle size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {incident.title}
                          </p>

                          <span className="rounded-full bg-cyan-300/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-cyan-200">
                            {incident.source}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {incident.explanation}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-200">
                          {incident.riskScore}
                        </p>

                        <p className="text-[10px] uppercase text-slate-600">
                          risk
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<CheckCircle2 size={20} />}
                    text="No active incidents. Use the Simulation Lab to rehearse a safe response."
                  />
                )}
              </CardContent>
            </Card>

            {/* Live activity */}

            <Card className="border-white/10 bg-[#0b1824]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Live activity
                </CardTitle>

                <p className="mt-1 text-xs text-slate-500">
                  Latest normalized file events.
                </p>
              </CardHeader>

              <CardContent className="space-y-3">
                {events
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-3"
                    >
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <p className="truncate text-xs text-slate-300">
                            {event.filePath}
                          </p>

                          <span className="shrink-0 text-[10px] text-slate-600">
                            {event.eventType}
                          </span>
                        </div>

                        <p className="mt-1 text-[10px] uppercase tracking-wider text-cyan-300/70">
                          {event.source} ·{" "}
                          {event.isProtectedPath
                            ? "protected path"
                            : "test path"}
                        </p>
                      </div>
                    </div>
                  ))}

                {!events.length && (
                  <EmptyState
                    icon={<Radio size={20} />}
                    text="Waiting for telemetry from the agent or simulator."
                  />
                )}
              </CardContent>
            </Card>
          </section>

          {/* ---------------------------------------------------------------- */}
          {/* Workspace                                                         */}
          {/* ---------------------------------------------------------------- */}

          {activeNav !== "Overview" && (
            <WorkspaceView
              activeNav={activeNav}
              events={events}
              incidents={incidents}
              profiles={data?.profiles ?? []}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric                                                                     */
/* -------------------------------------------------------------------------- */

function Metric({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="border-white/10 bg-[#0b1824] shadow-xl shadow-black/10">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {label}
          </span>

          <span className={metricToneClass(tone)}>
            {icon}
          </span>
        </div>

        <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {detail}
        </p>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[.015] px-4 py-7 text-center text-xs text-slate-500">
      <div className="mx-auto mb-2 grid w-fit place-items-center text-slate-600">
        {icon}
      </div>

      {text}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Landing / Authentication                                                   */
/* -------------------------------------------------------------------------- */

function Landing() {
  const [mode, setMode] =
    useState<"login" | "register">("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();

      window.location.href = "/";
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();

      window.location.href = "/";
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const mutation =
    mode === "login" ? login : register;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    if (mode === "login") {
      login.mutate({
        email,
        password,
      });
    } else {
      register.mutate({
        name,
        email,
        password,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#071019] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        {/* Header */}

        <header className="flex items-center justify-between py-7">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400 text-[#06202a]">
              <ShieldCheck size={20} />
            </div>

            <span className="text-sm font-semibold tracking-[.22em] text-cyan-200">
              RDRS
            </span>
          </div>

          <span className="text-xs uppercase tracking-widest text-slate-500">
            Local authentication
          </span>
        </header>

        {/* Hero */}

        <section className="grid flex-1 items-center gap-16 py-12 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              Defensive observability for test environments
            </Badge>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-7xl">
              See the first signs of a file attack.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
              RDRS turns explicit test-folder activity into
              explainable risk signals, analyst-ready incidents,
              and controlled response guidance—without touching
              files outside the configured boundary.
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2
                size={14}
                className="text-emerald-300"
              />

              Your account is stored in your configured
              database.
            </div>
          </div>

          {/* Auth card */}

          <div className="rounded-2xl border border-cyan-300/15 bg-[#0b1824] p-6 shadow-2xl shadow-cyan-950/30">
            <div className="flex gap-2 border-b border-white/10 pb-4">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                  mode === "login"
                    ? "bg-cyan-300 text-[#06202a]"
                    : "text-slate-400"
                }`}
              >
                Sign in
              </button>

              <button
                onClick={() => setMode("register")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                  mode === "register"
                    ? "bg-cyan-300 text-[#06202a]"
                    : "text-slate-400"
                }`}
              >
                Create account
              </button>
            </div>

            <form
              onSubmit={submit}
              className="mt-6 space-y-4"
            >
              {mode === "register" && (
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  minLength={2}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
                />
              )}

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                placeholder="Email address"
                className="w-full rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
              />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                minLength={
                  mode === "register" ? 8 : 1
                }
                placeholder="Password"
                className="w-full rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
              />

              {mode === "register" && (
                <p className="text-[11px] text-slate-500">
                  Use at least 8 characters.
                </p>
              )}

              {mutation.error && (
                <p className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
                  {mutation.error.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-cyan-300 text-[#06202a] hover:bg-cyan-200"
              >
                {mutation.isPending
                  ? "Please wait…"
                  : mode === "login"
                    ? "Enter console"
                    : "Create account"}

                <LogIn
                  size={15}
                  className="ml-2"
                />
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace                                                                  */
/* -------------------------------------------------------------------------- */

function WorkspaceView({
  activeNav,
  events,
  incidents,
  profiles,
}: {
  activeNav: NavItem;
  events: EventItem[];
  incidents: Incident[];
  profiles: Profile[];
}) {
  const title =
    activeNav === "Live Activity"
      ? "Normalized activity stream"
      : activeNav === "Incidents"
        ? "Investigation queue"
        : activeNav === "Monitored Profiles"
          ? "Explicit monitoring boundaries"
          : "Incident reports";

  const subtitle =
    activeNav === "Live Activity"
      ? "Agent and simulation records share one contract, with source labels preserved."
      : activeNav === "Incidents"
        ? "Every alert includes evidence, scoring signals, and an auditable response trail."
        : activeNav === "Monitored Profiles"
          ? "Only these configured test folders are eligible for telemetry."
          : "Generate JSON, Markdown, or CSV summaries from resolved investigations.";

  return (
    <Card className="border-white/10 bg-[#0b1824]">
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>

        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Live Activity */}

        {activeNav === "Live Activity" &&
          (events.length ? (
            events.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-white/[.07] p-4"
              >
                <span className="font-mono text-[11px] text-cyan-300/80">
                  {item.source}
                </span>

                <span className="text-xs text-slate-300">
                  {item.eventType}
                </span>

                <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                  {item.filePath}
                </span>

                <span className="text-[10px] uppercase text-slate-600">
                  {item.isProtectedPath
                    ? "protected"
                    : "test"}
                </span>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<Radio size={20} />}
              text="No activity yet. Start the local agent or run a safe simulation preset."
            />
          ))}

        {/* Incidents */}

        {activeNav === "Incidents" && (
          <IncidentWorkspace
            incidents={incidents}
          />
        )}

        {/* Profiles */}

        {activeNav === "Monitored Profiles" &&
          (profiles.length ? (
            profiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-white/[.07] p-4"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    item.enabled
                      ? "bg-emerald-300"
                      : "bg-amber-300"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {item.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {item.testFolder}
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  threshold {item.riskThreshold}
                </span>

                <Badge
                  className={
                    item.enabled
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                  }
                >
                  {item.enabled
                    ? "enabled"
                    : "paused"}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<SlidersHorizontal size={20} />}
              text="No monitored profiles enrolled yet."
            />
          ))}

        {/* Reports */}

        {activeNav === "Reports" && (
          <div className="grid gap-4 md:grid-cols-3">
            <ReportCard
              format="json"
              detail="Machine-readable incident evidence"
              incidentId={incidents[0]?.id}
            />

            <ReportCard
              format="markdown"
              detail="Analyst-ready narrative summary"
              incidentId={incidents[0]?.id}
            />

            <ReportCard
              format="csv"
              detail="Timeline data for review"
              incidentId={incidents[0]?.id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Report card                                                                */
/* -------------------------------------------------------------------------- */

function ReportCard({
  format,
  detail,
  incidentId,
}: {
  format: "json" | "markdown" | "csv";
  detail: string;
  incidentId?: number;
}) {
  const report = trpc.reports.generate.useQuery(
    {
      incidentId: incidentId ?? 0,
      format,
    },
    {
      enabled: Boolean(incidentId),
      staleTime: Infinity,
    }
  );

  const download = () => {
    if (!report.data) return;

    const blob = new Blob([report.data], {
      type:
        format === "json"
          ? "application/json"
          : "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download = `rdrs-incident.${
      format === "markdown" ? "md" : format
    }`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-white/[.07] bg-white/[.02] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-cyan-200">
          .{format === "markdown" ? "md" : format}
        </span>

        <FileWarning
          size={15}
          className="text-slate-600"
        />
      </div>

      <p className="mt-5 text-sm font-medium">
        {format.toUpperCase()} export
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {detail}
      </p>

      <button
        disabled={!incidentId || !report.data}
        onClick={download}
        className="mt-4 text-xs text-cyan-300 disabled:text-slate-600"
      >
        Download report{" "}
        <ArrowUpRight
          size={13}
          className="inline"
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Incident workspace                                                         */
/* -------------------------------------------------------------------------- */

function IncidentWorkspace({
  incidents,
}: {
  incidents: Incident[];
}) {
  const activeIncidents = incidents.filter(
    (item) =>
      item.status !== "resolved" &&
      item.status !== "false_positive"
  );

  const [selectedId, setSelectedId] =
    useState<number | null>(
      activeIncidents[0]?.id ?? null
    );

  const [note, setNote] = useState("");
  const [artifactPath, setArtifactPath] =
    useState("");

  const detail =
    trpc.dashboard.incident.useQuery(
      {
        id: selectedId ?? 0,
      },
      {
        enabled: Boolean(selectedId),
      }
    );

  const utils = trpc.useUtils();

  /* ---------------------------------------------------------------------- */
  /* Update incident                                                        */
  /* ---------------------------------------------------------------------- */

  const update =
    trpc.response.updateIncident.useMutation({
      onSuccess: async () => {
        await detail.refetch();
        await utils.dashboard.summary.invalidate();

        toast.success(
          "Incident action recorded"
        );

        setNote("");
      },

      onError: (error) => {
        toast.error(error.message);
      },
    });

  /* ---------------------------------------------------------------------- */
  /* Quarantine                                                             */
  /* ---------------------------------------------------------------------- */

  const quarantine =
    trpc.response.quarantine.useMutation({
      onSuccess: async () => {
        await detail.refetch();
        await utils.dashboard.summary.invalidate();

        toast.success(
          "Local-only quarantine request audited"
        );

        setArtifactPath("");
      },

      onError: (error) => {
        toast.error(error.message);
      },
    });

  /* ---------------------------------------------------------------------- */
  /* Keep selection valid                                                   */
  /* ---------------------------------------------------------------------- */

  const selected = activeIncidents.find(
    (item) => item.id === selectedId
  );

  if (!activeIncidents.length) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={20} />}
        text="No active incidents. All incidents have been resolved."
      />
    );
  }

  /*
   * The original implementation called setState during render when the
   * selected incident disappeared. This effect-free fallback avoids
   * rendering stale details while still keeping the UI functional.
   */
  if (!selected) {
    const fallback = activeIncidents[0];

    if (fallback && selectedId !== fallback.id) {
      setSelectedId(fallback.id);
    }

    return null;
  }

  /* ---------------------------------------------------------------------- */
  /* Save note                                                              */
  /* ---------------------------------------------------------------------- */

  const saveNote = () => {
    if (!note.trim()) {
      toast.error("Enter a note before saving.");
      return;
    }

    update.mutate({
      incidentId: selected.id,
      status: selected.status as any,
      note: note.trim(),
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Status                                                                 */
  /* ---------------------------------------------------------------------- */

  const changeStatus = (status: string) => {
    update.mutate({
      incidentId: selected.id,
      status: status as any,
      note: note.trim() || undefined,
    });
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.03] p-4 lg:grid-cols-[.8fr_1.2fr]">
      {/* LEFT */}

      <div>
        <p className="text-[10px] uppercase tracking-[.18em] text-cyan-300">
          Incident detail
        </p>

        <div className="mt-3 space-y-2">
          {activeIncidents.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setSelectedId(item.id)
              }
              className={`w-full rounded-xl border p-3 text-left ${
                item.id === selectedId
                  ? "border-cyan-300/30 bg-cyan-300/[.06]"
                  : "border-white/[.07] bg-white/[.02]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-xs text-slate-200">
                  {item.title}
                </span>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] uppercase ${severityClass(
                    item.severity
                  )}`}
                >
                  {item.severity}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                {item.source} ·{" "}
                {item.status.replace("_", " ")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT */}

      <div className="rounded-xl border border-white/[.07] bg-[#071019] p-4">
        {/* Header */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-white">
              {selected.title}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {selected.explanation}
            </p>
          </div>

          <span className="font-mono text-lg text-cyan-200">
            {selected.riskScore}
          </span>
        </div>

        {/* Status buttons */}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            "acknowledged",
            "assigned",
            "escalated",
            "resolved",
            "false_positive",
          ].map((status) => (
            <button
              key={status}
              onClick={() =>
                changeStatus(status)
              }
              disabled={update.isPending}
              className="rounded-lg border border-white/10 bg-white/[.03] px-2 py-2 text-[10px] uppercase tracking-wide text-slate-400 hover:border-cyan-300/25 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Quarantine */}

        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3">
          <p className="text-[10px] uppercase tracking-[.16em] text-amber-200">
            Confirmed test-artifact quarantine
          </p>

          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            Enter the exact path of one disposable artifact
            inside the authorized test folder. The browser
            never moves files.
          </p>

          <input
            value={artifactPath}
            onChange={(event) =>
              setArtifactPath(event.target.value)
            }
            placeholder="/authorized/test-folder/disposable.fixture"
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-300/40 focus:outline-none"
          />

          <button
            disabled={
              !artifactPath.trim() ||
              quarantine.isPending
            }
            onClick={() => {
              if (
                window.confirm(
                  `Confirm a local-only quarantine request for ${artifactPath}?`
                )
              ) {
                quarantine.mutate({
                  incidentId: selected.id,
                  targetPath:
                    artifactPath.trim(),
                  confirm: true,
                });
              }
            }}
            className="mt-3 rounded-lg border border-amber-300/20 px-3 py-2 text-[10px] uppercase tracking-wide text-amber-200 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {quarantine.isPending
              ? "Recording..."
              : "Confirm quarantine request"}
          </button>
        </div>

        {/* Operator note */}

        <div className="mt-4">
          <textarea
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            placeholder="Add an operator note..."
            className="min-h-20 w-full rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-300/30 focus:outline-none"
          />

          <button
            disabled={
              !note.trim() ||
              update.isPending
            }
            onClick={saveNote}
            className="mt-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-200 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {update.isPending
              ? "Saving..."
              : "Save note"}
          </button>
        </div>

        {/* Evidence */}

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[10px] uppercase tracking-[.16em] text-slate-600">
            Evidence timeline
          </p>

          <div className="mt-3 space-y-2">
            {(detail.data?.evidence ?? []).map(
              (item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/[.03] px-3 py-2"
                >
                  <span className="text-xs text-slate-300">
                    {item.signal}
                  </span>

                  <span className="text-xs text-cyan-200">
                    +{item.contribution}
                  </span>
                </div>
              )
            )}

            {!detail.data?.evidence?.length && (
              <p className="text-xs text-slate-600">
                Evidence is available after the incident
                detail refreshes.
              </p>
            )}
          </div>

          {/* Action history */}

          <p className="mt-4 text-[10px] uppercase tracking-[.16em] text-slate-600">
            Action history
          </p>

          <div className="mt-2 space-y-2">
            {(detail.data?.actions ?? []).map(
              (item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-3 rounded-lg bg-white/[.03] px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">
                    {item.action}
                  </span>

                  <span className="text-slate-600">
                    {item.note || "No note"}
                  </span>
                </div>
              )
            )}

            {!detail.data?.actions?.length && (
              <p className="text-xs text-slate-600">
                No actions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}