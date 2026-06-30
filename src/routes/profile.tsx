import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession, type Profile } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  HardHat,
  Images,
  LogOut,
  Mail,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  validateSearch: (s) => z.object({ id: z.string().optional() }).parse(s),
});

interface Review {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  author: { full_name: string | null } | null;
}
interface Photo {
  id: string;
  url: string;
}
interface ProfileView extends Profile {
  created_at?: string;
  role: "client" | "master" | "admin";
  completed_jobs: number;
  paid_jobs: number;
}

function ProfilePage() {
  const { id: viewId } = Route.useSearch();
  const { profile: me, role, user } = useSession();
  const navigate = useNavigate();
  const [target, setTarget] = useState<ProfileView | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const id = viewId ?? me?.id;
  const isSelf = !viewId || viewId === me?.id;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: publicRows, error: profileError }, { data: r }, { data: ph }] =
        await Promise.all([
          supabase.rpc("get_public_profile", { p_profile_id: id }),
          supabase
            .from("reviews")
            .select(
              "id, rating, text, created_at, author:profiles!reviews_author_id_fkey(full_name)",
            )
            .eq("target_id", id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase.from("portfolio_photos").select("id, url").eq("master_id", id).order("position"),
        ]);
      const publicProfile = publicRows?.[0] ?? null;
      if (profileError || !publicProfile) {
        toast.error("Не вдалося завантажити профіль");
        setLoading(false);
        return;
      }
      const privateProfile = isSelf ? me : null;
      setTarget({
        ...(privateProfile ?? {}),
        ...publicProfile,
        phone: privateProfile?.phone ?? null,
        locked_address: privateProfile?.locked_address ?? null,
        locked_lat: privateProfile?.locked_lat ?? null,
        locked_lng: privateProfile?.locked_lng ?? null,
        wallet_balance: privateProfile?.wallet_balance ?? 0,
        role: publicProfile.role ?? role ?? "client",
        completed_jobs: Number(publicProfile.completed_jobs ?? 0),
        paid_jobs: Number(publicProfile.paid_jobs ?? 0),
      } as ProfileView);
      setReviews((r as unknown as Review[]) ?? []);
      setPhotos((ph as Photo[]) ?? []);
      setLoading(false);
    })();
  }, [id, isSelf, me, role]);

  const toggleStatus = async (free: boolean) => {
    if (!me) return;
    const status = free ? "free" : "offline";
    const { error } = await supabase.from("profiles").update({ status }).eq("id", me.id);
    if (error) toast.error("Не вдалося змінити статус");
    else setTarget((current) => (current ? { ...current, status } : current));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading || !target)
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );

  const isMaster = target.role === "master";

  return (
    <div className="space-y-6 px-4 pb-8 pt-6">
      <header className="flex min-h-10 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {!isSelf && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => navigate({ to: "/chats" })}
              aria-label="Назад"
            >
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold">{isSelf ? "Мій профіль" : "Профіль довіри"}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {isMaster ? "Перевірений виконавець" : "Історія замовника"}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
          {isMaster ? "Майстер" : target.role === "admin" ? "Адміністратор" : "Клієнт"}
        </span>
      </header>

      {isMaster && (
        <section aria-labelledby="portfolio-title">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="portfolio-title" className="flex items-center gap-2 text-sm font-semibold">
              <Images className="size-4 text-primary" /> Виконані роботи
            </h2>
            <span className="text-xs text-muted-foreground">{photos.length} фото</span>
          </div>
          {photos.length > 0 ? (
            <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-1">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="Приклад виконаної роботи"
                  className="h-44 w-[82%] shrink-0 snap-start rounded-lg border object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-24 items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 text-sm text-muted-foreground">
              <Images className="size-8 shrink-0 opacity-50" />
              <span>
                {isSelf ? "Додайте фотографії виконаних робіт" : "Майстер ще не додав портфоліо"}
              </span>
            </div>
          )}
        </section>
      )}

      <section
        className="overflow-hidden rounded-lg border bg-card shadow-sm"
        aria-label="Основна інформація профілю"
      >
        <div className="bg-teal-deep px-4 py-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-white/70 bg-white/15">
              {target.avatar_url ? (
                <img
                  src={target.avatar_url}
                  alt={target.full_name ?? "Користувач"}
                  className="size-full object-cover"
                />
              ) : isMaster ? (
                <HardHat className="size-9" />
              ) : (
                <UserRound className="size-9" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="break-words text-xl font-bold">
                  {target.full_name || (isMaster ? "Майстер" : "Клієнт")}
                </h2>
                {target.verified && (
                  <BadgeCheck className="size-5 text-sky-200" aria-label="Профіль перевірено" />
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                <CalendarDays className="size-4" /> У Handy Pro з {formatJoined(target.created_at)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
                <ShieldCheck className="size-4" /> Дані підтверджені історією сервісу
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x py-4">
          <TrustStat icon={Star} value={Number(target.rating).toFixed(2)} label="Рейтинг" accent />
          <TrustStat icon={CheckCircle2} value={String(target.completed_jobs)} label="Завершено" />
          <TrustStat
            icon={isMaster ? BriefcaseBusiness : CreditCard}
            value={String(isMaster ? reviews.length : target.paid_jobs)}
            label={isMaster ? "Відгуків" : "Оплачено"}
          />
        </div>
      </section>

      {isSelf && role === "master" && (
        <section className="flex items-center justify-between gap-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="min-w-0">
            <p className="font-semibold">Доступний для замовлень</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {target.wallet_balance < -400
                ? "Профіль призупинено через борг"
                : target.status === "free"
                  ? "Ваш маркер видно на карті"
                  : "Ваш маркер приховано"}
            </p>
          </div>
          <Switch
            checked={target.status === "free"}
            onCheckedChange={toggleStatus}
            disabled={target.wallet_balance < -400}
            aria-label="Доступний для замовлень"
          />
        </section>
      )}

      {isMaster ? (
        <section aria-labelledby="passport-title">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <h2 id="passport-title" className="text-sm font-semibold">
              Паспорт майстра
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Metric icon={Clock3} label="Досвід" value={`${target.experience_years || 0} р.`} />
            <Metric icon={Car} label="Авто" value={target.has_vehicle ? "Є" : "Немає"} />
            <Metric icon={Wrench} label="Інструмент" value={target.tools_inventory || "Базовий"} />
          </div>
        </section>
      ) : (
        <section className="rounded-lg border-l-4 border-l-primary bg-card px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Надійність замовника</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Рейтинг сформований майстрами лише після завершених замовлень. Оплачено через
                сервіс: {target.paid_jobs}.
              </p>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="reviews-title">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="reviews-title" className="text-sm font-semibold">
            Відгуки
          </h2>
          <span className="text-xs text-muted-foreground">{reviews.length}</span>
        </div>
        {reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <Star className="mx-auto size-7 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Поки що немає відгуків</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-lg border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {review.author?.full_name ?? "Користувач Handy Pro"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("uk-UA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0" aria-label={`${review.rating} з 5`}>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Star
                        key={score}
                        className={`size-3.5 ${score <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                      />
                    ))}
                  </div>
                </div>
                {review.text && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {review.text}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {isSelf && (
        <section className="border-t pt-5">
          {user?.email && (
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-4" /> <span className="min-w-0 truncate">{user.email}</span>
            </div>
          )}
          <Button variant="outline" onClick={signOut} className="w-full">
            <LogOut className="size-4" /> Вийти
          </Button>
        </section>
      )}
    </div>
  );
}

function TrustStat({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 px-2 text-center">
      <div className="flex items-center justify-center gap-1">
        <Icon className={`size-4 ${accent ? "fill-amber-400 text-amber-400" : "text-primary"}`} />
        <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-3 text-center shadow-sm">
      <Icon className="mx-auto size-5 text-primary" />
      <p className="mt-1.5 text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold" title={value}>
        {value}
      </p>
    </div>
  );
}

function formatJoined(value?: string): string {
  if (!value) return "сьогодні";
  return new Date(value).toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
}
