import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { COMMISSION } from "@/lib/handy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  AudioLines,
  Check,
  CheckCheck,
  ChevronLeft,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Reply,
  Send,
  ShieldAlert,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/chats/$id")({ component: ChatRoom });

interface Msg {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string | null;
  media_url: string | null;
  reply_to: string | null;
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
  const [other, setOther] = useState<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    rating: number;
    role: string;
  } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<number | null>(null);
  const voiceStartedAtRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: c } = await supabase.from("chats").select("*").eq("id", id).single();
      setChat(c as Chat);
      if (c) {
        const otherId = profile.id === c.client_id ? c.master_id : c.client_id;
        const { data: publicRows } = await supabase.rpc(
          "get_public_profile",
          { p_profile_id: otherId },
        );
        const publicProfile = publicRows?.[0] ?? null;
        if (publicProfile) {
          setOther({
            id: publicProfile.id,
            full_name: publicProfile.full_name,
            avatar_url: publicProfile.avatar_url,
            rating: Number(publicProfile.rating ?? 5),
            role: String(publicProfile.role ?? "client"),
          });
        }
      }
      const { data: m } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", id)
        .order("created_at");
      setMessages((m as Msg[]) ?? []);
      setLoading(false);
      await supabase.rpc("mark_chat_read", { p_chat_id: id });
    })();
    const ch = supabase
      .channel(`chat-${id}-${Math.random().toString(36).slice(2)}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user_id !== profile.id) setOtherTyping(Boolean(payload.typing));
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${id}` },
        (payload) => setMessages((m) => [...m, payload.new as Msg]),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `chat_id=eq.${id}` },
        (payload) =>
          setMessages((m) =>
            m.map((x) => (x.id === (payload.new as Msg).id ? (payload.new as Msg) : x)),
          ),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats", filter: `id=eq.${id}` },
        (payload) => setChat(payload.new as Chat),
      )
      .subscribe();
    channelRef.current = ch;
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
      channelRef.current = null;
      supabase.removeChannel(ch);
    };
  }, [id, profile]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const paths = [
      ...new Set(
        messages
          .filter((message) => message.media_url)
          .map((message) => message.media_url as string),
      ),
    ];
    const missing = paths.filter((path) => !mediaUrls[path]);
    if (missing.length === 0) return;
    Promise.all(
      missing.map(async (path) => {
        const { data } = await supabase.storage.from("chat-media").createSignedUrl(path, 3600);
        return [path, data?.signedUrl] as const;
      }),
    ).then((entries) => {
      setMediaUrls((current) => ({
        ...current,
        ...Object.fromEntries(
          entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
        ),
      }));
    });
  }, [messages, mediaUrls]);

  const messageById = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages],
  );

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
    const body = maskBody(text.trim());
    setText("");
    setReplyingTo(null);
    await channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: profile.id, typing: false },
    });
    await supabase.from("messages").insert({
      chat_id: id,
      sender_id: profile.id,
      body,
      kind: "text",
      reply_to: replyingTo?.id ?? null,
    });
  };

  const updateText = (value: string) => {
    setText(value);
    if (!profile) return;
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: profile.id, typing: value.length > 0 },
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: profile.id, typing: false },
      });
    }, 1400);
  };

  const sendPriceCard = async () => {
    const amt = parseFloat(priceInput);
    if (!amt || amt <= 0 || !profile) {
      toast.error("Введіть суму");
      return;
    }
    await supabase.from("messages").insert({
      chat_id: id,
      sender_id: profile.id,
      kind: "price_card",
      price: amt,
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

  const acceptCashCard = async (message: Msg) => {
    if (!message.price) return;
    const { error } = await supabase.rpc(
      "accept_cash_offer",
      {
        p_chat_id: id,
        p_amount: message.price,
      },
    );
    if (error) toast.error(error.message);
    else toast.success("Готівкове замовлення підтверджено");
  };

  const startVoice = async () => {
    if (!profile || voiceRecording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Запис голосу не підтримується цим браузером");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      voiceChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };
      recorder.start();
      voiceStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      voiceStartedAtRef.current = Date.now();
      setVoiceRecording(true);
    } catch {
      toast.error("Дозвольте доступ до мікрофона для запису");
    }
  };

  const finishVoice = () => {
    const recorder = mediaRecorderRef.current;
    if (!voiceStartedAtRef.current || !profile || !recorder) return;
    const seconds = Math.max(1, Math.round((Date.now() - voiceStartedAtRef.current) / 1000));
    const senderId = profile.id;
    voiceStartedAtRef.current = null;
    setVoiceRecording(false);
    recorder.onstop = async () => {
      voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
      const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      voiceChunksRef.current = [];
      mediaRecorderRef.current = null;
      voiceStreamRef.current = null;
      const path = `${id}/${senderId}/${crypto.randomUUID()}.webm`;
      const { error: uploadError } = await supabase.storage.from("chat-media").upload(path, blob, {
        contentType: blob.type,
      });
      if (uploadError) {
        toast.error("Не вдалося зберегти голосове повідомлення");
        return;
      }
      await supabase.from("messages").insert({
        chat_id: id,
        sender_id: senderId,
        kind: "voice",
        body: `Голосове повідомлення · ${seconds} с`,
        media_url: path,
        reply_to: replyingTo?.id ?? null,
      });
      setReplyingTo(null);
    };
    recorder.stop();
  };

  const uploadAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Підтримуються зображення JPG, PNG або WebP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Файл завеликий. Максимум 10 МБ");
      return;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${id}/${profile.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-media")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      toast.error("Не вдалося завантажити фото");
      return;
    }
    const { error } = await supabase.from("messages").insert({
      chat_id: id,
      sender_id: profile.id,
      kind: "media",
      body: file.name,
      media_url: path,
      reply_to: replyingTo?.id ?? null,
    });
    if (error) toast.error("Не вдалося надіслати фото");
    else setReplyingTo(null);
  };

  const openDispute = async () => {
    if (!chat || !profile) return;
    await supabase.from("chats").update({ dispute_active: true }).eq("id", chat.id);
    if (chat.order_id) {
      await supabase
        .from("orders")
        .update({ status: "disputed", escrow_status: "disputed" })
        .eq("id", chat.order_id);
      await supabase.from("disputes").insert({ order_id: chat.order_id, opened_by: profile.id });
    }
    await supabase.from("messages").insert({
      chat_id: id,
      sender_id: profile.id,
      kind: "system",
      body: "⚠️ Арбітраж активовано. Адміністратор Сергій підключився до чату.",
    });
    toast.error("Спір відкрито");
  };

  const resolveDispute = async (resolution: "refund_client" | "release_master") => {
    const { error } = await supabase.rpc(
      "resolve_dispute",
      {
        p_chat_id: id,
        p_resolution: resolution,
      },
    );
    if (error) toast.error(error.message);
    else toast.success("Рішення арбітражу збережено");
  };

  const selectReplyBySwipe = (message: Msg, clientX: number) => {
    if (touchStartRef.current != null && clientX - touchStartRef.current > 55)
      setReplyingTo(message);
    touchStartRef.current = null;
  };

  if (loading || !chat)
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-3 py-2 flex items-center gap-2">
        <Link to="/chats">
          <ChevronLeft className="size-5" />
        </Link>
        {other ? (
          <Link
            to="/profile"
            search={{ id: other.id } as never}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-base">
              {other.avatar_url ? (
                <img src={other.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                "👤"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{other.full_name ?? "Користувач"}</p>
              <p
                className={`text-[10px] ${otherTyping ? "font-medium text-primary" : "text-muted-foreground"}`}
              >
                {otherTyping
                  ? "друкує…"
                  : `⭐ ${other.rating.toFixed(2)} · ${other.role === "master" ? "майстер" : "клієнт"}`}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {role !== "admin" && (
          <Button
            size="sm"
            variant={chat.dispute_active ? "destructive" : "outline"}
            onClick={openDispute}
            disabled={chat.dispute_active || !chat.order_id}
          >
            <ShieldAlert className="size-4" /> Спір
          </Button>
        )}
      </header>

      {chat.dispute_active && (
        <div className="space-y-2 bg-red-600 px-3 py-2 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="size-4" /> Арбітраж активовано · Адміністратор Сергій
          </div>
          {role === "admin" && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => resolveDispute("refund_client")}>
                Повернути клієнту
              </Button>
              <Button
                size="sm"
                className="bg-white text-red-700 hover:bg-white/90"
                onClick={() => resolveDispute("release_master")}
              >
                Переказати майстру
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-muted/30">
        {messages.map((m) => {
          if (m.kind === "system")
            return (
              <div key={m.id} className="text-center">
                <span className="inline-block bg-background border rounded-full px-3 py-1 text-[11px] text-muted-foreground">
                  {m.body}
                </span>
              </div>
            );
          const mine = m.sender_id === profile?.id;
          const repliedMessage = m.reply_to ? messageById.get(m.reply_to) : undefined;
          if (m.kind === "price_card") {
            const canPay = !mine && role === "client";
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                onTouchStart={(event) => {
                  touchStartRef.current = event.changedTouches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => selectReplyBySwipe(m, event.changedTouches[0]?.clientX ?? 0)}
              >
                <div className="max-w-[85%] rounded-2xl bg-card border-2 border-primary/30 p-3 shadow-sm">
                  {repliedMessage && <ReplyQuote message={repliedMessage} />}
                  <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-1">
                    <Tag className="size-4" /> Пропозиція
                  </div>
                  <div className="text-2xl font-bold">{m.price} ₴</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Натисніть «Оплатити» — кошти заморозяться на ескроу до завершення робіт.
                  </p>
                  {canPay && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button onClick={() => payPriceCard(m)} className="h-10">
                        Карткою
                      </Button>
                      <Button onClick={() => acceptCashCard(m)} variant="outline" className="h-10">
                        Готівка
                      </Button>
                    </div>
                  )}
                  <MsgMeta m={m} mine={mine} />
                </div>
              </div>
            );
          }
          if (m.kind === "voice") {
            const voiceUrl = m.media_url ? mediaUrls[m.media_url] : undefined;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                onTouchStart={(event) => {
                  touchStartRef.current = event.changedTouches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => selectReplyBySwipe(m, event.changedTouches[0]?.clientX ?? 0)}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-card"}`}
                >
                  {repliedMessage && <ReplyQuote message={repliedMessage} />}
                  <div className="flex min-w-44 items-center gap-2">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full ${mine ? "bg-white/15" : "bg-primary/10 text-primary"}`}
                    >
                      <AudioLines className="size-5" />
                    </span>
                    <div className="flex-1">
                      {voiceUrl ? (
                        <audio
                          controls
                          preload="metadata"
                          src={voiceUrl}
                          className="h-8 w-48 max-w-full"
                        />
                      ) : (
                        <div
                          className={`h-1 rounded-full ${mine ? "bg-white/40" : "bg-primary/25"}`}
                        />
                      )}
                      <p className="mt-1 text-xs">{m.body}</p>
                    </div>
                  </div>
                  <MsgMeta m={m} mine={mine} />
                </div>
              </div>
            );
          }
          if (m.kind === "media") {
            const signedUrl = m.media_url ? mediaUrls[m.media_url] : undefined;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                onTouchStart={(event) => {
                  touchStartRef.current = event.changedTouches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => selectReplyBySwipe(m, event.changedTouches[0]?.clientX ?? 0)}
              >
                <div
                  className={`max-w-[82%] rounded-2xl p-1.5 shadow-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-card"}`}
                >
                  {repliedMessage && <ReplyQuote message={repliedMessage} />}
                  {signedUrl ? (
                    <img
                      src={signedUrl}
                      alt={m.body ?? "Вкладення"}
                      className="max-h-72 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-32 min-w-52 items-center justify-center rounded-xl bg-muted/40">
                      <ImageIcon className="size-7 text-muted-foreground" />
                    </div>
                  )}
                  <MsgMeta m={m} mine={mine} />
                </div>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
              onTouchStart={(event) => {
                touchStartRef.current = event.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => selectReplyBySwipe(m, event.changedTouches[0]?.clientX ?? 0)}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}
              >
                {repliedMessage && <ReplyQuote message={repliedMessage} />}
                <p className="whitespace-pre-wrap break-words">{maskBody(m.body)}</p>
                <MsgMeta m={m} mine={mine} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t bg-background p-2 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={uploadAttachment}
          className="hidden"
        />
        {replyingTo && (
          <div className="flex items-center gap-2 rounded-lg border-l-4 border-l-primary bg-muted/50 px-3 py-2">
            <Reply className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-primary">Відповідь</p>
              <p className="truncate text-xs text-muted-foreground">
                {replyingTo.body || "Вкладення"}
              </p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 shrink-0"
              onClick={() => setReplyingTo(null)}
              aria-label="Скасувати відповідь"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {voiceRecording && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <span className="size-2 animate-pulse rounded-full bg-red-600" /> Запис голосового
            повідомлення… відпустіть, щоб надіслати
          </div>
        )}
        {role === "master" && showPriceInput && (
          <div className="flex gap-2 px-1">
            <Input
              type="number"
              placeholder="Сума, ₴"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="h-10"
            />
            <Button onClick={sendPriceCard} className="h-10">
              Надіслати
            </Button>
          </div>
        )}
        <div className="flex items-end gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Додати фото"
          >
            <Paperclip className="size-5" />
          </Button>
          {role === "master" && (
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 text-primary"
              onClick={() => setShowPriceInput((v) => !v)}
            >
              <Tag className="size-5" />
            </Button>
          )}
          <Input
            value={text}
            onChange={(e) => updateText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Повідомлення…"
            className="rounded-full h-10"
          />
          {text.trim() ? (
            <Button size="icon" onClick={send} className="shrink-0 rounded-full">
              <Send className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant={voiceRecording ? "destructive" : "ghost"}
              className="shrink-0"
              onPointerDown={startVoice}
              onPointerUp={finishVoice}
              onPointerCancel={finishVoice}
              aria-label="Утримуйте для запису"
            >
              <Mic className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReplyQuote({ message }: { message: Msg }) {
  return (
    <div className="mb-1.5 rounded-md border-l-2 border-l-current bg-black/5 px-2 py-1 text-[11px] opacity-80 dark:bg-white/10">
      <p className="truncate">
        {message.body || (message.kind === "media" ? "Фото" : "Повідомлення")}
      </p>
    </div>
  );
}

function MsgMeta({ m, mine }: { m: Msg; mine: boolean }) {
  const time = new Date(m.created_at).toLocaleTimeString("uk", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      className={`flex items-center gap-1 text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}
    >
      {time}
      {mine && (m.read_at ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
    </div>
  );
}
