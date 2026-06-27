import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useApp, type OrderStatus } from "@/lib/app-context";
import { tr } from "@/lib/i18n";
import { Send, DollarSign, Shield, Banknote, AlertTriangle, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Handy Pro — Chat" },
      { name: "description", content: "Chat, price offers, escrow, dispute." },
    ],
  }),
  component: ChatScreen,
});

function ChatScreen() {
  const {
    authed, lang, role, messages, sendMessage, sendOffer, acceptOffer,
    order, advanceOrder, openDispute, releaseEscrow,
  } = useApp();
  const [text, setText] = useState("");
  const [offer, setOffer] = useState("");
  const [showCashConfirm, setShowCashConfirm] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [messages]);

  if (!authed) return <Navigate to="/" />;

  return (
    <div className="space-y-3">
      {/* header */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary text-base font-black text-primary-foreground">
          {role === "client" ? "О" : "І"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{role === "client" ? "Олег К. · Електрик" : "Іван Б. · Клієнт"}</div>
          <div className="flex items-center gap-1 text-[11px] text-success">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" /> Онлайн
          </div>
        </div>
      </div>

      {order && <OrderStepper status={order.status} />}

      {order && order.escrowHeld && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-success-foreground">{tr("escrowHold", lang)} · ₴{order.price}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{tr("escrowHint", lang)}</div>
          </div>
        </div>
      )}

      {/* messages */}
      <div ref={scroller} className="max-h-[45vh] space-y-2 overflow-y-auto rounded-2xl border border-border bg-muted/30 p-3">
        {messages.map((m) => {
          if (m.from === "system") {
            return (
              <div key={m.id} className="mx-auto w-fit max-w-[85%] rounded-full bg-card px-3 py-1 text-center text-[10px] font-semibold text-muted-foreground">
                {m.text}
              </div>
            );
          }
          if (m.offerPrice) {
            return (
              <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl border-2 border-primary bg-card p-3 shadow-soft">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <DollarSign className="h-3 w-3" /> {tr("priceOffer", lang)}
                </div>
                <div className="mt-1 text-2xl font-black">₴{m.offerPrice}</div>
                {role === "client" && !order?.escrowHeld && order?.status !== "completed" && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => acceptOffer("escrow")}
                      className="flex items-center justify-center gap-1 rounded-xl gradient-primary py-2 text-[11px] font-bold text-primary-foreground"
                    >
                      <Shield className="h-3 w-3" /> {tr("acceptPay", lang)}
                    </button>
                    <button
                      onClick={() => setShowCashConfirm(1)}
                      className="flex items-center justify-center gap-1 rounded-xl border border-border bg-card py-2 text-[11px] font-bold"
                    >
                      <Banknote className="h-3 w-3" /> {tr("cashPay", lang)}
                    </button>
                  </div>
                )}
              </div>
            );
          }
          const mine = m.from === role;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-soft ${
                mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card text-foreground"
              }`}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* master: send offer */}
      {role === "master" && (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
          <input
            type="number"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="₴ ціна"
            className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => { if (offer) { sendOffer(Number(offer)); setOffer(""); } }}
            className="rounded-xl gradient-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            {tr("sendOffer", lang)}
          </button>
        </div>
      )}

      {/* compose */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { sendMessage(text); setText(""); } }}
          placeholder={tr("typeMessage", lang)}
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={() => { if (text.trim()) { sendMessage(text); setText(""); } }}
          className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* order actions */}
      {order && order.status !== "completed" && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Керування замовленням</div>
          <div className="grid grid-cols-2 gap-2">
            {role === "master" && order.status !== "dispute" && (
              <button
                onClick={advanceOrder}
                className="rounded-xl gradient-primary py-2 text-xs font-bold text-primary-foreground"
              >
                Далі: {nextStatusLabel(order.status, lang)}
              </button>
            )}
            {role === "client" && order.escrowHeld && (
              <button
                onClick={releaseEscrow}
                className="rounded-xl bg-success py-2 text-xs font-bold text-success-foreground"
              >
                <Check className="mr-1 inline h-3 w-3" /> {tr("releaseFunds", lang)}
              </button>
            )}
            {role === "client" && order.status !== "dispute" && (
              <button
                onClick={openDispute}
                className="rounded-xl border border-destructive/40 bg-destructive/10 py-2 text-xs font-bold text-destructive"
              >
                <AlertTriangle className="mr-1 inline h-3 w-3" /> {tr("openDispute", lang)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* cash double-confirm */}
      {showCashConfirm > 0 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-2xl md:rounded-3xl">
            <Banknote className="mb-2 h-7 w-7 text-warning" />
            <h3 className="text-lg font-black">{tr("cashPay", lang)} #{showCashConfirm}/2</h3>
            <p className="mt-1 text-xs text-muted-foreground">{tr("cashConfirm", lang)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowCashConfirm(0)}
                className="rounded-xl border border-border bg-card py-2.5 text-xs font-bold"
              >
                {tr("cancel", lang)}
              </button>
              <button
                onClick={() => {
                  if (showCashConfirm === 1) setShowCashConfirm(2);
                  else { acceptOffer("cash"); setShowCashConfirm(0); }
                }}
                className="rounded-xl gradient-primary py-2.5 text-xs font-bold text-primary-foreground"
              >
                {showCashConfirm === 1 ? "Підтвердити" : "Так, готівкою"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function nextStatusLabel(s: OrderStatus, lang: "ua" | "ru" | "en") {
  if (s === "pending") return tr("enroute", lang);
  if (s === "enroute") return tr("inProgress", lang);
  if (s === "in_progress") return tr("completed", lang);
  return "";
}

function OrderStepper({ status }: { status: OrderStatus }) {
  const { lang } = useApp();
  const steps: { k: OrderStatus; label: string }[] = [
    { k: "pending", label: tr("pending", lang) },
    { k: "enroute", label: tr("enroute", lang) },
    { k: "in_progress", label: tr("inProgress", lang) },
    { k: "completed", label: tr("completed", lang) },
  ];
  if (status === "dispute") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <div className="text-xs font-black">{tr("dispute", lang)} — модератор підключиться</div>
      </div>
    );
  }
  const idx = steps.findIndex((s) => s.k === status);
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = i <= idx;
          return (
            <div key={s.k} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black transition ${
                  done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <div className={`text-[9px] font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 -translate-y-2 rounded ${done && i < idx ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
