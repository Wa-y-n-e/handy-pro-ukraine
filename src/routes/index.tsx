import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, type OrderStatus } from "@/lib/app-context";
import { tr, type Lang } from "@/lib/i18n";
import {
  Phone, MapPin, MessageCircle, Mic, AlertTriangle, Shield, Check, X,
  Star, ThumbsUp, ThumbsDown, Send, Camera, Image as ImageIcon, Wallet,
  ShieldCheck, ShieldAlert, Users, DollarSign, ClipboardList, Activity,
  Hammer, Droplets, Zap, Wrench, ArrowRight, Truck, CheckCircle2, Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Handy Pro — Trusted handyman, on demand" },
      { name: "description", content: "Resilient handyman marketplace for Kharkiv: SOS, escrow, anti-EW map, multi-mode UI." },
    ],
  }),
  component: AppRoot,
});

function AppRoot() {
  const { authed, viewMode } = useApp();
  if (!authed) return <PhoneAuth />;
  if (viewMode === "senior") return <SeniorView />;
  if (viewMode === "master") return <UncleTolyaView />;
  if (viewMode === "admin") return <AdminView />;
  return <ClientView />;
}

/* ============ AUTH ============ */
function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 12);
  const r = d.startsWith("380") ? d.slice(3) : d;
  const p = r.padEnd(9, "_").slice(0, 9);
  return `+380 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7, 9)}`;
}

function PhoneAuth() {
  const { lang, phone, setPhone, legalAccepted, setLegalAccepted, otpSent, sendOtp, verifyOtp, setLegalOpen } = useApp();
  const [raw, setRaw] = useState("");
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!otpSent) return;
    setSeconds(45);
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [otpSent]);

  const digits = raw.replace(/\D/g, "").replace(/^380/, "");
  const validPhone = digits.length === 9;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-md flex-col items-center justify-center px-2 py-4">
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
            <Wrench className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight">Handy Pro</h1>
          <p className="text-sm text-muted-foreground">{tr("tagline", lang)}</p>
        </div>

        {!otpSent ? (
          <>
            <label className="mb-1 block text-sm font-bold">{tr("signInTitle", lang)}</label>
            <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-background px-4 py-4 focus-within:border-primary">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <input
                inputMode="tel"
                value={raw ? formatPhone(raw) : ""}
                onChange={(e) => { setRaw(e.target.value); setPhone(e.target.value); }}
                placeholder={tr("phonePlaceholder", lang)}
                className="w-full bg-transparent text-lg font-bold tracking-wide outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{tr("smsHint", lang)}</p>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-primary"
              />
              <div className="min-w-0 flex-1 text-xs leading-snug">
                <div className="font-bold">{tr("legalAgree", lang)}</div>
                <div className="mt-1 text-muted-foreground">{tr("legalSummary", lang)}</div>
                <button type="button" onClick={() => setLegalOpen(true)} className="mt-1 font-bold text-primary underline-offset-2 hover:underline">
                  Читати повний текст →
                </button>
              </div>
            </label>

            <button
              disabled={!validPhone || !legalAccepted}
              onClick={() => { setErr(""); sendOtp(); }}
              className="mt-5 w-full rounded-2xl gradient-primary py-5 text-base font-black uppercase tracking-wide text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-40 disabled:saturate-50"
            >
              {tr("sendCode", lang)}
            </button>
          </>
        ) : (
          <>
            <label className="mb-2 block text-center text-sm font-bold">{tr("enterCode", lang)}</label>
            <div className="mb-2 text-center text-sm text-muted-foreground">{phone ? formatPhone(phone) : ""}</div>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="● ● ● ● ● ●"
              className="w-full rounded-2xl border-2 border-border bg-background px-4 py-5 text-center text-3xl font-black tracking-[0.5em] outline-none focus:border-primary"
            />
            {err && <p className="mt-2 text-center text-xs text-destructive">{err}</p>}
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {seconds > 0 ? `${tr("codeResend", lang)} 0:${String(seconds).padStart(2, "0")}` : (
                <button onClick={sendOtp} className="font-bold text-primary">↻ {tr("sendCode", lang)}</button>
              )}
            </div>
            <button
              disabled={code.length !== 6}
              onClick={() => { if (!verifyOtp(code)) setErr("Неверный код"); }}
              className="mt-4 w-full rounded-2xl gradient-primary py-4 text-base font-black uppercase tracking-wide text-primary-foreground shadow-soft transition active:scale-[0.98] disabled:opacity-40"
            >
              {tr("verify", lang)} →
            </button>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">Тест: введіть будь-які 6 цифр</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ============ STANDARD CLIENT VIEW ============ */
function ClientView() {
  const { lang, order, setOrderStatus } = useApp();
  const [tab, setTab] = useState<"home" | "map" | "chat" | "profile">("home");

  return (
    <div className="space-y-4 pb-16">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kharkiv · 21°C</div>
            <h1 className="text-xl font-black">Привіт, Олено 👋</h1>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-teal-deep font-black">О</div>
        </div>

        <button
          onClick={() => setOrderStatus("enroute")}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-emergency px-4 py-4 text-emergency-foreground shadow-soft animate-sos"
        >
          <AlertTriangle className="h-7 w-7" />
          <div className="text-left">
            <div className="text-base font-black uppercase">SOS</div>
            <div className="text-xs opacity-90">Терміновий виклик майстра 24/7</div>
          </div>
          <ArrowRight className="ml-auto h-5 w-5" />
        </button>
      </div>

      {tab === "home" && <CategoriesGrid />}
      {tab === "map" && <MapView />}
      {tab === "chat" && <ChatView />}
      {tab === "profile" && <ClientProfile />}

      <ActiveOrderCard />

      <BottomTabs tab={tab} setTab={setTab} lang={lang} status={order.status} />
    </div>
  );
}

function CategoriesGrid() {
  const cats = [
    { id: "electric", label: "Електрика", icon: Zap, color: "bg-warning text-warning-foreground" },
    { id: "plumb", label: "Сантехніка", icon: Droplets, color: "bg-primary text-primary-foreground" },
    { id: "carpenter", label: "Меблі", icon: Hammer, color: "bg-accent text-accent-foreground" },
    { id: "lock", label: "Замки", icon: Lock, color: "bg-success text-success-foreground" },
  ];
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-black">Категорії</h2>
      <div className="grid grid-cols-2 gap-3">
        {cats.map((c) => (
          <button key={c.id} className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary hover:shadow-soft">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.color}`}><c.icon className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold">{c.label}</div>
              <div className="text-xs text-muted-foreground">від 350 ₴</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ActiveOrderCard() {
  const { order, openDispute, advanceOrder, viewMode } = useApp();
  if (order.status === "pending") return null;
  const steps: { id: OrderStatus; label: string; icon: typeof Truck }[] = [
    { id: "frozen", label: "Кошти заморожені", icon: ShieldCheck },
    { id: "enroute", label: "Майстер їде", icon: Truck },
    { id: "in_progress", label: "Робота йде", icon: Wrench },
    { id: "completed", label: "Виконано", icon: CheckCircle2 },
  ];
  const idx = steps.findIndex((s) => s.id === order.status);
  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-black">Активне замовлення #{order.id}</div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${order.status === "dispute" ? "bg-emergency text-emergency-foreground" : "bg-mint text-teal-deep"}`}>
          {order.status === "dispute" ? "Арбітраж" : "Активно"}
        </span>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const Active = s.icon;
          const done = i <= idx;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div className={`grid h-8 w-8 place-items-center rounded-full ${done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                <Active className="h-4 w-4" />
              </div>
              <div className={`text-sm ${done ? "font-bold" : "text-muted-foreground"}`}>{s.label}</div>
              {i === idx && i < steps.length - 1 && (
                <button onClick={advanceOrder} className="ml-auto rounded-lg bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">Далі →</button>
              )}
            </div>
          );
        })}
      </div>
      {order.status !== "dispute" && order.status !== "completed" && viewMode !== "master" && (
        <button onClick={openDispute} className="mt-3 w-full rounded-xl border-2 border-emergency/40 bg-emergency/10 py-2 text-xs font-bold text-emergency">
          <ShieldAlert className="mr-1 inline h-3 w-3" /> Поскаржитися (заморозити кошти)
        </button>
      )}
    </section>
  );
}

function BottomTabs({ tab, setTab, lang, status }: { tab: string; setTab: (t: any) => void; lang: Lang; status: OrderStatus }) {
  const items = [
    { id: "home", icon: Activity, label: "Дім" },
    { id: "map", icon: MapPin, label: "Карта" },
    { id: "chat", icon: MessageCircle, label: "Чат" },
    { id: "profile", icon: Users, label: tr("profile" as any, lang) || "Профіль" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-screen-sm border-t border-border bg-card/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {items.map((it) => (
          <button key={it.id} onClick={() => setTab(it.id)} className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold ${tab === it.id ? "text-primary" : "text-muted-foreground"}`}>
            <it.icon className="h-5 w-5" />{it.label}
            {it.id === "chat" && status === "dispute" && <span className="absolute mt-1 h-1.5 w-1.5 rounded-full bg-emergency" />}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ============ MAP / ANTI-EW ============ */
function MapView() {
  const { lang, antiEW, setAntiEW, pinAddress, setPinAddress, pinXY, setPinXY } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <input
          value={pinAddress}
          onChange={(e) => setPinAddress(e.target.value)}
          placeholder={tr("searchAddress", lang)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <button
        onClick={() => setAntiEW(!antiEW)}
        className={`flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black ${
          antiEW ? "border-emergency bg-emergency text-emergency-foreground" : "border-emergency text-emergency bg-emergency/10"
        }`}
      >
        <ShieldAlert className="h-4 w-4" />
        {tr("antiEW", lang)}
        {antiEW && <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-[10px]">ON</span>}
      </button>

      <div
        ref={ref}
        onMouseDown={() => (drag.current = true)}
        onMouseUp={() => (drag.current = false)}
        onMouseLeave={() => (drag.current = false)}
        onMouseMove={(e) => {
          if (!antiEW || !drag.current || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          setPinXY({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onClick={(e) => {
          if (!antiEW || !ref.current) return;
          const r = ref.current.getBoundingClientRect();
          setPinXY({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        className="relative h-72 cursor-crosshair overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-mint/50 to-accent/40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,128,128,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,128,128,.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="absolute left-2 top-2 rounded-full bg-card/90 px-2 py-1 text-[10px] font-bold">Kharkiv · Сумська</div>
        {!antiEW ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft animate-pulse"><MapPin className="h-5 w-5" /></div>
          </div>
        ) : (
          <div className="absolute" style={{ left: `${pinXY.x}%`, top: `${pinXY.y}%`, transform: "translate(-50%, -100%)" }}>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emergency text-emergency-foreground shadow-soft ring-4 ring-white">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
        )}
        {antiEW && (
          <div className="absolute inset-x-0 bottom-0 bg-emergency/90 px-3 py-1.5 text-center text-[10px] font-bold text-emergency-foreground">
            {tr("antiEWOn", lang)}
          </div>
        )}
      </div>

      <button className="w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground">{tr("confirmLocation", lang)}</button>
    </section>
  );
}

/* ============ CHAT + ESCROW ============ */
function ChatView() {
  const { lang, messages, sendMessage, sendOffer, acceptOffer, openDispute, viewMode, order } = useApp();
  const [text, setText] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [price, setPrice] = useState("");
  const isMaster = viewMode === "master";

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-mint text-teal-deep font-black">{isMaster ? "О" : "А"}</div>
          <div>
            <div className="text-sm font-black">{isMaster ? "Олена К." : "Анатолій (майстер)"}</div>
            <div className="text-[10px] text-muted-foreground">{isMaster ? "+380 ******27" : "+380 ******11"} · {tr(order.status as any, lang) || order.status}</div>
          </div>
        </div>
        <button onClick={openDispute} className="rounded-md border border-emergency/40 px-2 py-1 text-[10px] font-bold text-emergency">{tr("openDispute", lang)}</button>
      </div>

      <div className="max-h-80 space-y-2 overflow-y-auto bg-muted/30 p-3">
        {messages.map((m) => {
          if (m.from === "system") return <div key={m.id} className="text-center text-[10px] text-muted-foreground">{m.text}</div>;
          const mine = m.from === (isMaster ? "master" : "client");
          if (m.offerPrice) {
            return (
              <div key={m.id} className={`max-w-[85%] rounded-2xl border-2 border-primary bg-card p-3 ${mine ? "ml-auto" : ""}`}>
                <div className="text-[10px] font-bold uppercase text-muted-foreground">{tr("priceOffer", lang)}</div>
                <div className="text-2xl font-black text-primary">{m.offerPrice} ₴</div>
                {!isMaster && order.status === "pending" && (
                  <button onClick={acceptOffer} className="mt-2 w-full rounded-lg bg-primary py-2 text-xs font-black text-primary-foreground">{tr("acceptOffer", lang)} →</button>
                )}
              </div>
            );
          }
          return (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto bg-primary text-primary-foreground" : "bg-card"}`}>
              {m.media && <div className="mb-1 text-3xl">{m.media}</div>}
              {m.text}
            </div>
          );
        })}
      </div>

      {showOffer && isMaster && (
        <div className="border-t border-border p-3">
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="Ціна, ₴" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none" />
          <button onClick={() => { if (price) { sendOffer(Number(price)); setPrice(""); setShowOffer(false); } }} className="mt-2 w-full rounded-lg bg-primary py-2 text-xs font-black text-primary-foreground">{tr("send", lang)}</button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-border p-2">
        <button onClick={() => sendMessage("", "📷")} className="rounded-lg border border-border p-2"><Camera className="h-4 w-4" /></button>
        {isMaster && <button onClick={() => setShowOffer((s) => !s)} className="rounded-lg bg-mint px-2 py-2 text-[10px] font-bold text-teal-deep">{tr("proposePrice", lang)}</button>}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (sendMessage(text), setText(""))} placeholder={tr("typeMessage", lang)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none" />
        <button onClick={() => { sendMessage(text); setText(""); }} className="rounded-lg bg-primary p-2 text-primary-foreground"><Send className="h-4 w-4" /></button>
      </div>

      {/* job media */}
      <div className="border-t border-border p-3">
        <div className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">{tr("jobMedia", lang)}</div>
        <div className="flex gap-2 text-3xl">{messages.filter((m) => m.media).map((m) => <span key={m.id}>{m.media}</span>)}<span className="grid h-12 w-12 place-items-center rounded-lg border border-dashed border-border text-muted-foreground"><ImageIcon className="h-5 w-5" /></span></div>
      </div>

      <PaymentSheet />
      <RatingModal />
    </section>
  );
}

function PaymentSheet() {
  const { paySheetOpen, setPaySheetOpen, advanceOrder, lang } = useApp();
  const [step, setStep] = useState<"sheet" | "processing" | "done">("sheet");
  useEffect(() => { if (paySheetOpen) setStep("sheet"); }, [paySheetOpen]);
  if (!paySheetOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setPaySheetOpen(false)}>
      <div className="w-full animate-in slide-in-from-bottom rounded-t-3xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        {step === "sheet" && (
          <>
            <h3 className="text-lg font-black">{tr("paySheetTitle", lang)}</h3>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-card font-black">G</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">Google Pay</div>
                <div className="text-xs text-muted-foreground">{tr("paySheetHint", lang)}</div>
              </div>
              <div className="text-lg font-black">1 500 ₴</div>
            </div>
            <button onClick={() => { setStep("processing"); setTimeout(() => setStep("done"), 1200); }} className="mt-4 w-full rounded-xl bg-success py-4 text-base font-black text-success-foreground">{tr("payConfirm", lang)} · 1 500 ₴</button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">{tr("pciNotice", lang)}</p>
          </>
        )}
        {step === "processing" && (
          <div className="py-10 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /><div className="mt-3 text-sm font-bold">Verifying...</div></div>
        )}
        {step === "done" && (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <div className="mt-2 text-lg font-black">{tr("fundsFrozen", lang)}</div>
            <button onClick={() => { advanceOrder(); setPaySheetOpen(false); }} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground">OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

function RatingModal() {
  const { ratingOpen, setRatingOpen, viewMode, lang } = useApp();
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const senior = viewMode === "senior";
  const isMaster = viewMode === "master";
  const badgeKeys = isMaster ? ["badgeGoodClient", "badgePaidFast", "badgeAdequate"] as const : ["badgeFast", "badgePolite", "badgeClean", "badgeFair"] as const;

  if (!ratingOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center">
        <h3 className="text-xl font-black">{isMaster ? tr("ratingMasterTitle", lang) : tr("ratingTitle", lang)}</h3>

        {senior ? (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => setRatingOpen(false)} className="rounded-2xl bg-success py-8 text-success-foreground">
              <ThumbsUp className="mx-auto h-12 w-12" />
              <div className="mt-2 text-base font-black">{tr("allGood", lang)}</div>
            </button>
            <button onClick={() => setRatingOpen(false)} className="rounded-2xl bg-emergency py-8 text-emergency-foreground">
              <ThumbsDown className="mx-auto h-12 w-12" />
              <div className="mt-2 text-base font-black">{tr("hadProblems", lang)}</div>
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)}>
                  <Star className={`h-9 w-9 ${n <= stars ? "fill-warning text-warning" : "text-muted"}`} />
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {badgeKeys.map((b) => {
                const on = badges.includes(b);
                return (
                  <button key={b} onClick={() => setBadges((s) => on ? s.filter((x) => x !== b) : [...s, b])} className={`rounded-full border px-3 py-1 text-xs font-bold ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {tr(b as any, lang)}
                  </button>
                );
              })}
            </div>
            <textarea placeholder="Коментар..." className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none" rows={2} />
            <button onClick={() => setRatingOpen(false)} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground">{tr("leaveReview", lang)}</button>
          </>
        )}
      </div>
    </div>
  );
}

function ClientProfile() {
  const { phone } = useApp();
  const masked = phone ? `+380 ******${phone.replace(/\D/g, "").slice(-2)}` : "+380 ******27";
  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-mint text-2xl font-black text-teal-deep">О</div>
          <div>
            <div className="text-base font-black">Олена К.</div>
            <div className="text-xs text-muted-foreground">{masked}</div>
            <div className="mt-1 flex items-center gap-1 text-xs font-bold"><Star className="h-3 w-3 fill-warning text-warning" /> 4.8 · 12 робіт</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Wallet className="h-5 w-5 text-primary" />
          <div className="mt-2 text-xs text-muted-foreground">Гаманець</div>
          <div className="text-xl font-black">1 450 ₴</div>
          <div className="text-[10px] text-muted-foreground">Картка **** 8841</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <ShieldCheck className="h-5 w-5 text-success" />
          <div className="mt-2 text-xs text-muted-foreground">Захист</div>
          <div className="text-xl font-black">Escrow ON</div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-sm font-black">Історія</div>
        <div className="mt-2 space-y-2 text-xs">
          {["Електрик · 850 ₴ · ✓", "Сантехнік · 1 200 ₴ · ✓", "Прибирання · 600 ₴ · ✓"].map((s) => (
            <div key={s} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"><span>{s}</span><CheckCircle2 className="h-4 w-4 text-success" /></div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ SENIOR MODE ============ */
function SeniorView() {
  const { lang } = useApp();
  const [recording, setRecording] = useState<"idle" | "rec" | "done">("idle");

  return (
    <div className="space-y-4 text-[140%]">
      <div className="rounded-3xl border-2 border-border bg-card p-5 text-center">
        <div className="text-2xl font-black">👋 Доброго дня!</div>
        <div className="mt-1 text-base text-muted-foreground">Оберіть кнопку:</div>
      </div>

      <button className="flex w-full items-center gap-4 rounded-3xl bg-emergency px-5 py-7 text-emergency-foreground shadow-soft animate-sos">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20"><AlertTriangle className="h-9 w-9" /></div>
        <div className="text-left">
          <div className="text-2xl font-black leading-tight">{tr("emergencyHelp", lang)}</div>
          <div className="text-sm opacity-90">{tr("emergencyHelpSub", lang)}</div>
        </div>
      </button>

      <button className="flex w-full items-center gap-4 rounded-3xl bg-primary px-5 py-7 text-primary-foreground shadow-soft">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20"><Wrench className="h-9 w-9" /></div>
        <div className="text-left">
          <div className="text-2xl font-black leading-tight">{tr("regularRepair", lang)}</div>
          <div className="text-sm opacity-90">{tr("regularRepairSub", lang)}</div>
        </div>
      </button>

      <a href="tel:+380443333333" className="flex w-full items-center gap-4 rounded-3xl bg-success px-5 py-7 text-success-foreground shadow-soft">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/20"><Phone className="h-9 w-9" /></div>
        <div className="text-left">
          <div className="text-2xl font-black leading-tight">{tr("callOperator", lang)}</div>
          <div className="text-sm opacity-90">{tr("callOperatorSub", lang)}</div>
        </div>
      </a>

      <div className="rounded-3xl border-2 border-border bg-card p-5 text-center">
        <div className="mb-3 text-base font-bold">{recording === "rec" ? tr("voiceRecording", lang) : recording === "done" ? tr("voiceSaved", lang) : tr("voiceMessage", lang)}</div>
        <button
          onClick={() => { if (recording === "rec") setRecording("done"); else setRecording("rec"); }}
          className={`mx-auto grid h-28 w-28 place-items-center rounded-full text-primary-foreground shadow-soft ${recording === "rec" ? "bg-emergency animate-sos" : "bg-primary"}`}
        >
          <Mic className="h-12 w-12" />
        </button>
      </div>

      <div className="rounded-3xl border-2 border-success/50 bg-success/10 p-4 text-center">
        <ShieldCheck className="mx-auto h-9 w-9 text-success" />
        <div className="mt-2 text-base font-black text-success">{tr("moneySafe", lang)}</div>
      </div>
    </div>
  );
}

/* ============ MASTER (UNCLE TOLYA) ============ */
function UncleTolyaView() {
  const { lang, masterActive, setMasterActive, masterTrades, toggleTrade, masterPortfolio, addPortfolioPhoto } = useApp();
  const trades = useMemo(() => ([
    { id: "tradeWater", icon: Droplets, color: "bg-primary text-primary-foreground" },
    { id: "tradeElectric", icon: Zap, color: "bg-warning text-warning-foreground" },
    { id: "tradeHome", icon: Hammer, color: "bg-accent text-accent-foreground" },
    { id: "tradeHeavy", icon: Truck, color: "bg-teal-deep text-primary-foreground" },
  ] as const), []);
  const photoEmojis = ["🔧", "🪛", "💡", "🚿", "🪚", "🔩"];

  return (
    <div className="space-y-4">
      <button
        onClick={() => setMasterActive(!masterActive)}
        className={`relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl py-10 text-2xl font-black uppercase text-white shadow-soft transition ${
          masterActive ? "bg-success animate-pulse" : "bg-emergency"
        }`}
        style={masterActive ? { boxShadow: "0 0 0 0 rgba(34,197,94,.6)" } : {}}
      >
        <Activity className="h-8 w-8" />
        {masterActive ? tr("lookingForWork", lang) : tr("resting", lang)}
      </button>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="text-xs font-bold uppercase text-muted-foreground">{tr("paymentGuaranteed", lang)}</div>
        <div className="mt-2 text-5xl font-black text-success">1 500 ₴</div>
        <div className="mt-1 text-xs text-muted-foreground">Замовлення #o-1042 · вул. Сумська, 25</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="rounded-xl bg-primary py-3 text-sm font-black text-primary-foreground">Прийняти</button>
          <button className="rounded-xl border border-border py-3 text-sm font-black">Відмова</button>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-3 text-sm font-black">{tr("pickTrade", lang)}</div>
        <div className="grid grid-cols-2 gap-3">
          {trades.map((t) => {
            const on = masterTrades.includes(t.id);
            return (
              <button key={t.id} onClick={() => toggleTrade(t.id)} className={`rounded-2xl border-4 p-4 text-left transition ${on ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                <div className={`grid h-12 w-12 place-items-center rounded-xl ${t.color}`}><t.icon className="h-6 w-6" /></div>
                <div className="mt-2 text-base font-black">{tr(t.id, lang)}</div>
                {on && <div className="mt-1 text-xs font-bold text-primary">✓ Обрано</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-2 text-sm font-black">{tr("myWorks", lang)}</div>
        <div className="grid grid-cols-3 gap-2">
          {masterPortfolio.map((p, i) => (
            <div key={i} className="grid h-24 place-items-center rounded-xl bg-muted text-4xl">{p}</div>
          ))}
          <button
            onClick={() => addPortfolioPhoto(photoEmojis[Math.floor(Math.random() * photoEmojis.length)])}
            className="grid h-24 place-items-center rounded-xl border-2 border-dashed border-primary bg-primary/5 text-primary"
          >
            <div className="text-center"><Camera className="mx-auto h-7 w-7" /><div className="mt-1 text-[10px] font-bold leading-tight">{tr("addWorkPhoto", lang)}</div></div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ ADMIN ============ */
function AdminView() {
  const { liveJobsCount, operatorsOnline, cashVolume, registrationQueue, approveMaster, rejectMaster, disputes, resolveDispute, lang } = useApp();
  const [activeDispute, setActiveDispute] = useState<string | null>(null);
  const cur = disputes.find((d) => d.id === activeDispute);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><h2 className="text-base font-black">{tr("adminTitle", lang)}</h2></div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat icon={Activity} color="text-primary" label={tr("liveJobs", lang)} value={liveJobsCount} />
          <Stat icon={Users} color="text-success" label={tr("operatorsOnline", lang)} value={operatorsOnline} />
          <Stat icon={DollarSign} color="text-warning-foreground" label={tr("cashVolume", lang)} value={`${(cashVolume / 1000).toFixed(0)}k ₴`} />
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black">{tr("registrationQueue", lang)}</h3>
          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-black text-teal-deep">{registrationQueue.length}</span>
        </div>
        <div className="space-y-2">
          {registrationQueue.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">Черга порожня ✓</div>}
          {registrationQueue.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="text-3xl">{a.selfie}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{a.name}</div>
                <div className="text-[10px] text-muted-foreground">{a.trade} · ID {a.idPhoto}</div>
              </div>
              <button onClick={() => approveMaster(a.id)} className="rounded-lg bg-success p-2 text-success-foreground"><Check className="h-4 w-4" /></button>
              <button onClick={() => rejectMaster(a.id)} className="rounded-lg bg-emergency p-2 text-emergency-foreground"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black">{tr("disputeDesk", lang)}</h3>
          <span className="rounded-full bg-emergency/15 px-2 py-0.5 text-[10px] font-black text-emergency">{disputes.length} live</span>
        </div>
        <div className="space-y-2">
          {disputes.map((d) => (
            <div key={d.id}>
              <button onClick={() => setActiveDispute(activeDispute === d.id ? null : d.id)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left">
                <ClipboardList className="h-5 w-5 text-emergency" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{d.client} ↔ {d.master}</div>
                  <div className="text-[10px] text-muted-foreground">{d.reason} · {d.amount} ₴</div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </button>
              {activeDispute === d.id && cur && (
                <div className="mt-2 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Transcript</div>
                  {cur.transcript.map((m, i) => (
                    <div key={i} className={`rounded-lg px-2 py-1 text-xs ${m.from === "master" ? "bg-card" : "bg-primary/10"}`}><b>{m.from}:</b> {m.text}</div>
                  ))}
                  <div className="flex gap-2 text-3xl">{cur.photos.map((p, i) => <span key={i}>{p}</span>)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => resolveDispute(d.id, "master")} className="rounded-lg bg-success py-2 text-xs font-black text-success-foreground">{tr("releaseToMaster", lang)}</button>
                    <button onClick={() => resolveDispute(d.id, "client")} className="rounded-lg bg-emergency py-2 text-xs font-black text-emergency-foreground">{tr("refundClient", lang)}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-2 text-xs font-black text-success"><ShieldCheck className="h-4 w-4" /> {tr("pciNotice", lang)}</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-lg bg-card p-2 font-mono">**** **** **** 8841</div>
          <div className="rounded-lg bg-card p-2 font-mono">+380 ******11</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: any }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="mt-1 text-[10px] font-bold uppercase text-muted-foreground leading-tight">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}
