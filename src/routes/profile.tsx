import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession, type Profile } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Star, BadgeCheck, Car, Wrench, Calendar, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  validateSearch: (s) => z.object({ id: z.string().optional() }).parse(s),
});

interface Review { id: string; rating: number; text: string | null; created_at: string; author: { full_name: string | null } | null }
interface Photo { id: string; url: string }

function ProfilePage() {
  const { id: viewId } = Route.useSearch();
  const { profile: me, role, user } = useSession();
  const [target, setTarget] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const id = viewId ?? me?.id;
  const isSelf = !viewId || viewId === me?.id;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const profileQuery = isSelf
        ? supabase.rpc("get_my_profile").then((res) => ({ data: Array.isArray(res.data) ? res.data[0] : null }))
        : supabase.from("profiles_public" as never).select("id, full_name, avatar_url, rating, status, verified, has_vehicle, tools_inventory, experience_years, primary_category_slug, locked_lat, locked_lng, created_at").eq("id", id).single();
      const [{ data: p }, { data: r }, { data: ph }, { data: rl }] = await Promise.all([
        profileQuery,
        supabase.from("reviews").select("id, rating, text, created_at, author:profiles!reviews_author_id_fkey(full_name)")
          .eq("target_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("portfolio_photos").select("id, url").eq("master_id", id).order("position"),
        supabase.from("user_roles").select("role").eq("user_id", id).limit(1).maybeSingle(),
      ]);
      setTarget(p as unknown as Profile);
      setReviews((r as unknown as Review[]) ?? []);
      setPhotos((ph as Photo[]) ?? []);
      setTargetRole(rl?.role ?? null);
      setLoading(false);
    })();
  }, [id]);

  const toggleStatus = async (free: boolean) => {
    if (!me) return;
    await supabase.from("profiles").update({ status: free ? "free" : "offline" }).eq("id", me.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading || !target) return <div className="flex justify-center pt-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  const isMaster = targetRole === "master";

  return (
    <div className="pb-6">
      {/* Portfolio slider for masters */}
      {isMaster && photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto p-3 snap-x">
          {photos.map((p) => (
            <img key={p.id} src={p.url} alt="" className="h-44 w-64 rounded-xl object-cover snap-start shrink-0" />
          ))}
        </div>
      )}
      {isMaster && photos.length === 0 && (
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 h-40 flex items-center justify-center text-muted-foreground">
          Портфоліо порожнє
        </div>
      )}

      <div className="px-4 -mt-6 relative">
        <div className="rounded-2xl bg-card border shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl shrink-0">
              {target.avatar_url ? <img src={target.avatar_url} alt="" className="size-full rounded-2xl object-cover" /> : isMaster ? "👷" : "👤"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <h2 className="text-xl font-bold">{target.full_name ?? "Користувач"}</h2>
                {target.verified && <BadgeCheck className="size-5 text-blue-500" />}
              </div>
              <p className="text-sm flex items-center gap-1 mt-0.5">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{target.rating.toFixed(2)}</span>
                <span className="text-muted-foreground">· {reviews.length} відгуків</span>
              </p>
              {isSelf && <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>}
            </div>
          </div>

          {/* Master "Паспорт" */}
          {isMaster && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Metric icon={Calendar} label="Досвід" value={`${target.experience_years} р.`} />
              <Metric icon={Car} label="Авто" value={target.has_vehicle ? "Так" : "Ні"} />
              <Metric icon={Wrench} label="Інструмент" value={target.tools_inventory ?? "Базовий"} />
            </div>
          )}

          {/* Client trust panel (Uber style) */}
          {!isMaster && !isSelf && (
            <div className="mt-4 rounded-xl bg-muted/40 p-3 text-xs">
              <p className="font-semibold">Клієнт перевірений</p>
              <p className="text-muted-foreground mt-1">Завершено замовлень: <b>{Math.floor(target.rating * 20)}</b></p>
            </div>
          )}

          {isSelf && role === "master" && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3">
              <div>
                <p className="text-sm font-semibold">Шукаю роботу</p>
                <p className="text-[11px] text-muted-foreground">Статус: {target.status === "free" ? "Видимий на мапі" : "Прихований"}</p>
              </div>
              <Switch checked={target.status === "free"} onCheckedChange={toggleStatus} disabled={target.wallet_balance < -400} />
            </div>
          )}
        </div>

        {/* Reviews */}
        <h3 className="mt-5 mb-2 px-1 text-sm font-semibold text-muted-foreground">Відгуки</h3>
        {reviews.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">Поки що немає відгуків</p>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{r.author?.full_name ?? "Користувач"}</p>
                  <div className="flex">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={`size-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />)}
                  </div>
                </div>
                {r.text && <p className="text-sm mt-1 text-muted-foreground">{r.text}</p>}
              </div>
            ))}
          </div>
        )}

        {isSelf && (
          <Button variant="outline" onClick={signOut} className="w-full mt-6">
            <LogOut className="size-4" /> Вийти
          </Button>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2 text-center">
      <Icon className="size-4 mx-auto text-primary" />
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      <p className="text-xs font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}
