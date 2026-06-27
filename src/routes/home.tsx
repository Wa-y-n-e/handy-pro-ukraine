import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApp, type Availability } from "@/lib/app-context";
import { CATEGORIES, catName, tr } from "@/lib/i18n";
import { Search, Siren, X, Radio, MapPin, Star, TrendingUp, Briefcase, Zap } from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Handy Pro — Home" },
      { name: "description", content: "Find masters or manage incoming jobs." },
    ],
  }),
  component: HomeScreen,
});

function HomeScreen() {
  const { authed, role } = useApp();
  if (!authed) return <Navigate to="/" />;
  return role === "client" ? <ClientHome /> : <MasterHome />;
}

function ClientHome() {
  const { lang, filteredMasters, triggerSos, sos, cancelSos, user } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const masters = useMemo(() => filteredMasters(q), [filteredMasters, q]);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(lang === "en" ? "en-US" : "uk-UA", { weekday: "long" })}</p>
        <h1 className="text-2xl font-black tracking-tight">Привіт, {user.name.split(" ")[0]} 👋</h1>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("search", lang)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* SOS */}
      <button
        onClick={triggerSos}
        className="relative w-full overflow-hidden rounded-3xl bg-emergency p-5 text-left text-emergency-foreground shadow-soft animate-sos"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20">
            <Siren className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-widest opacity-90">SOS</div>
            <div className="truncate text-base font-black">{tr("sos", lang)}</div>
            <div className="mt-0.5 truncate text-[11px] opacity-90">{tr("sosHint", lang)}</div>
          </div>
        </div>
      </button>

      {/* Categories */}
      <div>
        <h2 className="mb-2 text-sm font-bold">{tr("categories", lang)}</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setQ(c.id)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center transition hover:border-primary hover:shadow-soft"
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-[10px] font-semibold leading-tight">{c[lang]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Masters list */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">
            {masters.length} {tr("available", lang)}
          </h2>
          <span className="text-[11px] text-muted-foreground">5 {tr("km", lang)} радіус</span>
        </div>
        <div className="space-y-2">
          {masters.map((m) => (
            <button
              key={m.id}
              onClick={() => nav({ to: "/chat" })}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition hover:border-primary hover:shadow-soft"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-lg font-black text-primary-foreground">
                {m.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-sm font-bold">{m.name}</div>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-success"></span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-warning text-warning" />
                    {m.rating}
                  </span>
                  <span>· {m.jobs} {tr("jobs", lang)}</span>
                  <span>· {m.distanceKm} {tr("km", lang)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.categories.map((c) => (
                    <span key={c} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      {catName(c, lang)}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SOS overlay */}
      {sos.active && <SosOverlay onClose={cancelSos} />}
    </div>
  );
}

function SosOverlay({ onClose }: { onClose: () => void }) {
  const { lang, masters, sos } = useApp();
  const nav = useNavigate();
  const matched = masters.filter((m) => m.availability === "online").slice(0, 3);
  const accepted = !!sos.acceptedBy;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl md:rounded-3xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emergency text-emergency-foreground animate-sos">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black">{accepted ? "✅ Майстер прийняв" : tr("sosBroadcasting", lang)}</div>
              <div className="text-xs text-muted-foreground">{tr("detectingMasters", lang)} · 5 км</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {matched.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                accepted && i === 0 ? "border-success bg-success/10" : "border-border bg-background"
              }`}
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary font-black text-primary-foreground">
                {m.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{m.name}</div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" /> {m.rating} · {m.distanceKm} км
                </div>
              </div>
              <div className={`flex h-2 w-2 rounded-full ${accepted && i === 0 ? "bg-success" : "bg-warning animate-pulse"}`} />
            </div>
          ))}
        </div>

        {accepted ? (
          <button
            onClick={() => { onClose(); nav({ to: "/chat" }); }}
            className="mt-4 w-full rounded-2xl gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-soft"
          >
            {tr("startChat", lang)} →
          </button>
        ) : (
          <button onClick={onClose} className="mt-4 w-full rounded-2xl border border-border bg-card py-3 text-sm font-bold">
            {tr("cancel", lang)}
          </button>
        )}
      </div>
    </div>
  );
}

function MasterHome() {
  const { lang, availability, setAvailability, user } = useApp();
  const opts: { v: Availability; color: string; key: "online" | "busy" | "offline" }[] = [
    { v: "online", color: "bg-success text-success-foreground", key: "online" },
    { v: "busy", color: "bg-warning text-warning-foreground", key: "busy" },
    { v: "offline", color: "bg-muted text-muted-foreground", key: "offline" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">{tr("master", lang)}</p>
        <h1 className="text-2xl font-black tracking-tight">{user.name} 🔧</h1>
      </div>

      {/* Availability */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr("availability", lang)}</div>
          <div className={`flex h-2.5 w-2.5 rounded-full ${
            availability === "online" ? "bg-success" : availability === "busy" ? "bg-warning" : "bg-muted-foreground"
          }`} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {opts.map((o) => (
            <button
              key={o.v}
              onClick={() => setAvailability(o.v)}
              className={`rounded-2xl px-2 py-2.5 text-[11px] font-bold transition ${
                availability === o.v ? o.color + " shadow-soft" : "bg-muted text-muted-foreground"
              }`}
            >
              {tr(o.key, lang)}
            </button>
          ))}
        </div>
        {availability !== "online" && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            ⚠️ Ви прихований у пошуку клієнтів.
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard icon={<Briefcase className="h-4 w-4" />} label={tr("todaysJobs", lang)} value="3" hint="+1 сьогодні" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label={tr("earnings", lang)} value="₴2 450" hint="+18%" tint />
        <StatCard icon={<Star className="h-4 w-4" />} label={tr("rating", lang)} value={user.rating.toFixed(1)} hint={`${user.completed} робіт`} />
        <StatCard icon={<Zap className="h-4 w-4" />} label="SOS прийнято" value="14" hint="за тиждень" />
      </div>

      {/* Active jobs list */}
      <div>
        <h2 className="mb-2 text-sm font-bold">{tr("todaysJobs", lang)}</h2>
        <div className="space-y-2">
          {[
            { name: "Іван Б.", task: "Заміна розетки", addr: "вул. Сумська, 12", time: "14:30" },
            { name: "Олена П.", task: "Тече кран", addr: "пр. Науки, 45", time: "16:00" },
            { name: "Дмитро К.", task: "Замок дверний", addr: "вул. Чкалова, 7", time: "18:15" },
          ].map((j, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary font-black text-primary-foreground">
                {j.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{j.task}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> <span className="truncate">{j.addr}</span>
                </div>
              </div>
              <div className="text-xs font-bold text-primary">{j.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hint, tint }: { icon: React.ReactNode; label: string; value: string; hint?: string; tint?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border p-3 ${tint ? "gradient-primary text-primary-foreground" : "bg-card"}`}>
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${tint ? "opacity-90" : "text-muted-foreground"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-black">{value}</div>
      {hint && <div className={`text-[10px] ${tint ? "opacity-90" : "text-muted-foreground"}`}>{hint}</div>}
    </div>
  );
}
