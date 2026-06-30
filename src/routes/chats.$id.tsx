import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { COMMISSION } from "@/lib/handy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Paperclip, Mic, AlertTriangle, ChevronLeft, Check, CheckCheck, Tag, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chats/$id")({ component: ChatRoom });

interface Msg {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  kind: string;
  price: number | null;
  read_at: string | null;
  created_at: string;
}
interface Chat {
  id: string;
  client_id: string;
  master_id: string;
  order_id: string | null;
  dispute_active: boolean;
}

function ChatRoom() {
  const { id } = Route.useParams();
  const { profile, role } = useSession();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [other, setOther] = useState<{ full_name: string | null; avatar_url: string | null; rating: number } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: c } = await supabase.from("chats").select("*").eq("id", id).single();
      setChat(c as Chat);
      if (c) {
        const otherId = profile.id === c.client_id ? c.master_id : c.client_id;
        const { data: o } = await supabase.from("profiles_public" as never).select("full_name, avatar_url, rating").eq("id", otherId).single();
        setOther(o as any);
      }
      const { data: m } = await supabase.from("messages").select("*").eq("chat_id", id).order("created_at");
      setMessages((m as Msg[]) ?? []);
      setLoading(false);
      // mark received as read
      await supabase.from("messages").update({ read_at: new Date().toISOString() })
        .eq("chat_id", id).neq("sender_id", profile.id).is("read_at", null);
    })();
    const ch = supabase.channel("chat-" + id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${id}` },
        (payload) => setMessages((m) => [...m, payload.new as Msg]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${id}` },
        (payload) => setMessages((m) => m.map((x) => x.id === (payload.new as Msg).id ? (payload.new as Msg) : x)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chats", filter: `id=eq.${id}` },
        (payload) => setChat(payload.new as Chat))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Mask phone numbers and links in text
  const maskBody = (body: string | null): string => {
    if (!body) return "";
    return body
      .replace(/(\+?\d[\d\s\-()]{7,})/g, "📵 [контакт приховано]")
      .replace(/https?:\/\/\S+/gi, "🔗 [посилання приховано]")
      .replace(/(t\.me|telegram|viber|whatsapp)\/?\S*/gi, "🔗 [контакт приховано]");
  };

  const send = async () => {
    if (!text.trim() || !profile) return;
    const body = text.trim();
    setText("");
    await supabase.from("messages").insert({ chat_id: id, sender_id: profile.id, body, kind: "text" });
  };

  const sendPriceCard = async () => {
    const amt = parseFloat(priceInput);
    if (!amt || amt <= 0 || !profile) { toast.error("Введіть суму"); return; }
    await supabase.from("messages").insert({
      chat_id: id, sender_id: profile.id, kind: "price_card", price: amt,
      body: `Запропоновано ціну: ${amt} ₴`,
    });
    setPriceInput("");
    setShowPriceInput(false);
  };

  const payPriceCard = async (m: Msg) => {
    if (!chat || !profile || !m.price) return;
    const { error } = await supabase.rpc("pay_escrow_hold", { p_chat_id: id, p_amount: m.price });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Оплачено. Кошти у безпеці.");
  };

  const openDispute = async () => {
    if (!chat || !profile) return;
    await supabase.from("chats").update({ dispute_active: true }).eq("id", chat.id);
    if (chat.order_id) {
      await supabase.from("orders").update({ status: "disputed", escrow_status: "disputed" }).eq("id", chat.order_id);
      await supabase.from("disputes").insert({ order_id: chat.order_id, opened_by: profile.id });
    }
    await supabase.from("messages").insert({ chat_id: id, sender_id: profile.id, kind: "system",
      body: "⚠️ Арбітраж активовано. Адміністратор Сергій підключився до чату." });
    toast.error("Спір відкрито");
  };

  if (loading || !chat) return <div className="flex justify-center pt-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-3 py-2 flex items-center gap-2">
        <Link to="/chats"><ChevronLeft className="size-5" /></Link>
        <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center text-base shrink-0">
          {other?.avatar_url ? <img src={other.avatar_url} alt="" className="size-full rounded-full object-cover" /> : "👤"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{other?.full_name ?? "Користувач"}</p>
          <p className="text-[10px] text-muted-foreground">⭐ {(other?.rating ?? 5).toFixed(2)}</p>
        </div>
        <Button size="sm" variant={chat.dispute_active ? "destructive" : "outline"} onClick={openDispute} disabled={chat.dispute_active}>
          <ShieldAlert className="size-4" /> Спір
        </Button>
      </header>

      {chat.dispute_active && (
        <div className="bg-red-600 text-white px-3 py-2 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="size-4" /> Арбітраж активовано · Адміністратор Сергій
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/30">
        {messages.map((m) => {
          if (m.kind === "system") return (
            <div key={m.id} className="text-center">
              <span className="inline-block bg-background border rounded-full px-3 py-1 text-[11px] text-muted-foreground">{m.body}</span>
            </div>
          );
          const mine = m.sender_id === profile?.id;
          if (m.kind === "price_card") {
            const canPay = !mine && role === "client";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] rounded-2xl bg-card border-2 border-primary/30 p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-1">
                    <Tag className="size-4" /> Пропозиція
                  </div>
                  <div className="text-2xl font-bold">{m.price} ₴</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Натисніть «Оплатити» — кошти заморозяться на ескроу до завершення робіт.</p>
                  {canPay && (
                    <Button onClick={() => payPriceCard(m)} className="mt-2 w-full h-10">💳 Оплатити</Button>
                  )}
                  <MsgMeta m={m} mine={mine} />
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                <p className="whitespace-pre-wrap break-words">{maskBody(m.body)}</p>
                <MsgMeta m={m} mine={mine} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t bg-background p-2 space-y-2">
        {role === "master" && showPriceInput && (
          <div className="flex gap-2 px-1">
            <Input type="number" placeholder="Сума, ₴" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="h-10" />
            <Button onClick={sendPriceCard} className="h-10">Надіслати</Button>
          </div>
        )}
        <div className="flex items-end gap-1">
          <Button size="icon" variant="ghost" className="shrink-0"><Paperclip className="size-5" /></Button>
          {role === "master" && (
            <Button size="icon" variant="ghost" className="shrink-0 text-primary" onClick={() => setShowPriceInput((v) => !v)}>
              <Tag className="size-5" />
            </Button>
          )}
          <Input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Повідомлення…" className="rounded-full h-10" />
          {text.trim() ? (
            <Button size="icon" onClick={send} className="shrink-0 rounded-full"><Send className="size-4" /></Button>
          ) : (
            <Button size="icon" variant="ghost" className="shrink-0"><Mic className="size-5" /></Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MsgMeta({ m, mine }: { m: Msg; mine: boolean }) {
  const time = new Date(m.created_at).toLocaleTimeString("uk", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}>
      {time}
      {mine && (m.read_at ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
    </div>
  );
}
