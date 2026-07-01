import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { useSimplifiedModePreference } from "@/lib/preferences";
import { CATEGORY_ICONS, isCurfewNow } from "@/lib/handy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mic, Phone, Search, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: HomePage });

interface Cat {
  slug: string;
  name_uk: string;
  icon: string;
  position: number;
}
interface Sub {
  id: string;
  category_slug: string;
  name_uk: string;
}

function HomePage() {
  const { user, profile } = useSession();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [q, setQ] = useState("");
  const [grandma, setGrandma] = useSimplifiedModePreference();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const recordingStartedAt = useRef<number | null>(null);
  const curfew = isCurfewNow();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from("categories").select("*").order("position"),
        supabase.from("subcategories").select("id, category_slug, name_uk").order("position"),
      ]);
      setCats((c as Cat[]) ?? []);
      setSubs((s as Sub[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    const ql = q.toLowerCase();
    return subs.filter((s) => s.name_uk.toLowerCase().includes(ql)).slice(0, 6);
  }, [q, subs]);

  const goMap = (categorySlug?: string, subId?: string) => {
    navigate({
      to: "/map",
      search: { cat: categorySlug ?? undefined, sub: subId ?? undefined } as never,
    });
  };

  const startVoiceRequest = () => {
    recordingStartedAt.current = Date.now();
    setRecording(true);
  };

  const finishVoiceRequest = async () => {
    if (!recordingStartedAt.current || !user) return;
    const duration = Math.max(1, Math.round((Date.now() - recordingStartedAt.current) / 1000));
    recordingStartedAt.current = null;
    setRecording(false);
    const { error } = await supabase.from("support_requests").insert({
      created_by: user.id,
      kind: "voice",
      duration_seconds: duration,
      note: "Заявка зі спрощеного режиму",
    });
    if (error) toast.error("Не вдалося надіслати заявку");
    else toast.success("Заявку надіслано оператору");
  };

  if (grandma) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center gap-6 overflow-y-auto bg-background px-6 py-20">
        <div className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] flex items-center gap-2 text-sm">
          <span>Спрощений режим</span>
          <Switch checked={grandma} onCheckedChange={setGrandma} />
        </div>
        <h1 className="text-3xl font-bold text-center">Чим Вам допомогти?</h1>
        <button
          onPointerDown={startVoiceRequest}
          onPointerUp={finishVoiceRequest}
          onPointerCancel={() => {
            recordingStartedAt.current = null;
            setRecording(false);
          }}
          className={`w-full max-w-sm rounded-3xl bg-primary text-primary-foreground py-12 text-2xl font-bold shadow-lg active:scale-95 transition flex flex-col items-center gap-3 ${recording ? "animate-pulse bg-red-600" : ""}`}
        >
          <Mic className="size-16" />
          🔨 ЗВИЧАЙНИЙ РЕМОНТ
          <span className="text-base font-normal opacity-90">
            {recording ? "Запис..." : "Натисніть та утримуйте"}
          </span>
        </button>
        <a
          href="tel:0800300900"
          className="w-full max-w-sm rounded-3xl bg-emerald-600 text-white py-12 text-2xl font-bold shadow-lg active:scale-95 transition flex flex-col items-center gap-3"
        >
          <Phone className="size-16" />
          📞 ДЗВІНОК ОПЕРАТОРУ
          <span className="text-base font-normal opacity-90">0 800 300 900 — безкоштовно</span>
        </a>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Handy Pro</h1>
          <p className="text-xs text-muted-foreground">{profile?.locked_address ?? "Харків"}</p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <span>Спрощений</span>
          <Switch checked={grandma} onCheckedChange={setGrandma} />
        </label>
      </header>

      {curfew && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>Враховуйте комендантську годину. Майстри зможуть приїхати у дозволений час.</span>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Знайти послугу: бойлер, кран, плитка…"
          className="pl-9 h-11 rounded-xl"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border bg-popover shadow-lg overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setQ("");
                  goMap(s.category_slug, s.id);
                }}
                className="block w-full text-left px-3 py-2.5 text-sm hover:bg-accent border-b last:border-0"
              >
                {s.name_uk}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cats.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug];
            return (
              <button
                key={c.slug}
                onClick={() => goMap(c.slug)}
                className="group relative aspect-square rounded-2xl border bg-card p-3 flex flex-col items-start justify-between shadow-sm hover:shadow-md hover:border-primary/40 transition text-left"
              >
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  {Icon && <Icon className="size-6" />}
                </div>
                <span className="text-sm font-semibold leading-tight">{c.name_uk}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
