import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, MessageCircle, User, Wrench, Bell, Globe } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { LANGS, tr } from "@/lib/i18n";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, setLang, role, setRole, authed, incomingEmergency } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!authed) return <>{children}</>;

  const nav = [
    { to: "/home", icon: Home, label: tr("home", lang) },
    { to: "/map", icon: Map, label: tr("map", lang) },
    { to: "/chat", icon: MessageCircle, label: tr("chat", lang) },
    { to: "/profile", icon: User, label: tr("profile", lang) },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-primary-foreground">
            <Wrench className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold tracking-tight">Handy Pro</div>
            <div className="truncate text-[10px] text-muted-foreground">{tr("tagline", lang)}</div>
          </div>

          {/* role toggle */}
          <div className="flex items-center rounded-full bg-muted p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setRole("client")}
              className={`rounded-full px-2.5 py-1 transition ${
                role === "client" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {tr("client", lang)}
            </button>
            <button
              onClick={() => setRole("master")}
              className={`rounded-full px-2.5 py-1 transition ${
                role === "master" ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {tr("master", lang)}
            </button>
          </div>

          {/* lang */}
          <div className="relative">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="appearance-none rounded-full border border-border bg-card py-1 pl-6 pr-2 text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <Globe className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* incoming emergency banner for master */}
      {role === "master" && incomingEmergency && <EmergencyBanner />}

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {nav.map((n) => {
            const active = pathname === n.to || (n.to === "/home" && pathname === "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function EmergencyBanner() {
  const { incomingEmergency, acceptSos, dismissEmergency, lang } = useApp();
  if (!incomingEmergency) return null;
  return (
    <div className="sticky top-[57px] z-30 border-b border-emergency/40 bg-emergency text-emergency-foreground shadow-soft">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 animate-sos">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-black uppercase tracking-wider">{tr("emergencyIncoming", lang)}</div>
          <div className="truncate text-xs opacity-90">{incomingEmergency.address}</div>
        </div>
        <button
          onClick={() => acceptSos("m1")}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emergency"
        >
          {tr("accept", lang)}
        </button>
        <button
          onClick={dismissEmergency}
          className="rounded-lg border border-white/40 px-2 py-1.5 text-xs font-semibold"
        >
          {tr("decline", lang)}
        </button>
      </div>
    </div>
  );
}
