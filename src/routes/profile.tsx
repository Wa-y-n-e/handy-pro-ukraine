import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { catName, tr } from "@/lib/i18n";
import { Star, Wallet, LogOut, Shield, ChevronRight, Award } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Handy Pro — Profile" },
      { name: "description", content: "Your Handy Pro profile, wallet & history." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { authed, lang, user, role, signOut } = useApp();
  const nav = useNavigate();
  if (!authed) return <Navigate to="/" />;

  const history = [
    { id: "h1", title: "Заміна автомата", master: "Олег К.", price: 850, date: "12.03", rating: 5 },
    { id: "h2", title: "Прочистка раковини", master: "Андрій М.", price: 600, date: "08.03", rating: 5 },
    { id: "h3", title: "Заміна замка", master: "Віктор П.", price: 1200, date: "01.03", rating: 4 },
    { id: "h4", title: "Ремонт пральної", master: "Сергій Д.", price: 1800, date: "24.02", rating: 5 },
  ];

  return (
    <div className="space-y-4">
      {/* hero */}
      <div className="overflow-hidden rounded-3xl gradient-primary p-5 text-primary-foreground shadow-soft">
        <div className="flex items-center gap-3">
          {user.photo ? (
            <img src={user.photo} alt="" className="h-16 w-16 rounded-2xl border-2 border-white/30 object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-white/30 bg-white/15 text-2xl font-black">
              {user.name[0] || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-lg font-black">{user.name}</div>
            <div className="text-xs opacity-90">{tr(role, lang)} · {user.email || "—"}</div>
            <div className="mt-1 flex items-center gap-1 text-xs font-bold">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {user.rating.toFixed(1)}
              <span className="opacity-80">· {user.completed} {tr("jobs", lang)}</span>
            </div>
          </div>
        </div>
        {user.categories && user.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.categories.map((c) => (
              <span key={c} className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold">
                {catName(c, lang)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* wallet */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-3 w-3" /> {tr("wallet", lang)}
          </div>
          <div className="mt-1 text-xl font-black">₴{user.wallet.toLocaleString()}</div>
          <div className="text-[10px] text-success">+₴320 цього тижня</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Award className="h-3 w-3" /> Рівень
          </div>
          <div className="mt-1 text-xl font-black">PRO</div>
          <div className="text-[10px] text-muted-foreground">Підтверджений</div>
        </div>
      </div>

      {/* security row */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-success/15 text-success">
          <Shield className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold">Документи перевірено</div>
          <div className="text-[11px] text-muted-foreground">Паспорт · Договір · Escrow увімкнено</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* history */}
      <div>
        <h2 className="mb-2 text-sm font-bold">{tr("history", lang)}</h2>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                ✓
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{h.title}</div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{h.master}</span>
                  <span>· {h.date}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-warning text-warning" />{h.rating}
                  </span>
                </div>
              </div>
              <div className="text-sm font-black text-primary">₴{h.price}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => { signOut(); nav({ to: "/" }); }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-bold text-destructive"
      >
        <LogOut className="h-4 w-4" /> {tr("logout", lang)}
      </button>
    </div>
  );
}
