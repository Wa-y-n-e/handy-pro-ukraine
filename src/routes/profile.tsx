import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEBT_BAN_THRESHOLD } from "@/lib/handy";
import { useSession, type Profile } from "@/lib/use-session";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  ImagePlus,
  Images,
  Layers3,
  MapPin,
  PencilLine,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
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
  position: number | null;
}
interface ProfileView extends Profile {
  created_at?: string;
  role: "client" | "master" | "admin";
  completed_jobs: number;
  paid_jobs: number;
}

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Subcategory = Database["public"]["Tables"]["subcategories"]["Row"];

interface MasterProfileDraft {
  full_name: string;
  avatar_url: string;
  experience_years: string;
  has_vehicle: boolean;
  tools_inventory: string;
  locked_address: string;
}

function ProfilePage() {
  const { id: viewId } = Route.useSearch();
  const { profile: me, role, setProfile } = useSession();
  const navigate = useNavigate();
  const [target, setTarget] = useState<ProfileView | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [savedSubcategoryIds, setSavedSubcategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [serviceCategory, setServiceCategory] = useState("");
  const [draft, setDraft] = useState<MasterProfileDraft | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [portfolioBusy, setPortfolioBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const id = viewId ?? me?.id;
  const isSelf = !viewId || viewId === me?.id;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [
        { data: publicRows, error: profileError },
        { data: r },
        { data: ph },
        { data: categoryRows },
        { data: subcategoryRows },
        { data: masterSubcategoryRows },
      ] = await Promise.all([
        supabase.rpc("get_public_profile", { p_profile_id: id }),
        supabase
          .from("reviews")
          .select("id, rating, text, created_at, author:profiles!reviews_author_id_fkey(full_name)")
          .eq("target_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("portfolio_photos")
          .select("id, url, position")
          .eq("master_id", id)
          .order("position"),
        supabase.from("categories").select("*").order("position"),
        supabase.from("subcategories").select("*").order("position"),
        supabase.from("master_subcategories").select("subcategory_id").eq("master_id", id),
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
      setPhotos(ph ?? []);
      setCategories(categoryRows ?? []);
      setSubcategories(subcategoryRows ?? []);
      const selectedIds = (masterSubcategoryRows ?? []).map((row) => row.subcategory_id);
      setSavedSubcategoryIds(selectedIds);
      setSelectedSubcategoryIds(selectedIds);
      setServiceCategory(
        privateProfile?.primary_category_slug ?? publicProfile.primary_category_slug ?? "",
      );
      if (isSelf && role === "master" && privateProfile) {
        setDraft({
          full_name: privateProfile.full_name ?? "",
          avatar_url: privateProfile.avatar_url ?? "",
          experience_years: String(privateProfile.experience_years ?? 0),
          has_vehicle: privateProfile.has_vehicle,
          tools_inventory: privateProfile.tools_inventory ?? "",
          locked_address: privateProfile.locked_address ?? "",
        });
      } else {
        setDraft(null);
      }
      setLoading(false);
    })();
  }, [id, isSelf, me, role]);

  const primaryCategory = useMemo(
    () => categories.find((category) => category.slug === target?.primary_category_slug) ?? null,
    [categories, target?.primary_category_slug],
  );

  const editableSubcategories = useMemo(
    () => subcategories.filter((subcategory) => subcategory.category_slug === serviceCategory),
    [serviceCategory, subcategories],
  );

  const publicSubcategories = useMemo(() => {
    const selected = new Set(savedSubcategoryIds);
    return subcategories.filter((subcategory) => selected.has(subcategory.id));
  }, [savedSubcategoryIds, subcategories]);

  const masterReadiness = useMemo(() => {
    if (!target || !isSelf || role !== "master") return null;
    const hasLocation =
      target.locked_lat != null &&
      Number.isFinite(target.locked_lat) &&
      target.locked_lat >= -90 &&
      target.locked_lat <= 90 &&
      target.locked_lng != null &&
      Number.isFinite(target.locked_lng) &&
      target.locked_lng >= -180 &&
      target.locked_lng <= 180;
    const checks = [
      { label: "Ім'я заповнено", ready: Boolean(target.full_name?.trim()) },
      { label: "Категорію обрано", ready: Boolean(target.primary_category_slug) },
      { label: "Підкатегорію обрано", ready: savedSubcategoryIds.length > 0 },
      { label: "Локацію збережено", ready: hasLocation },
      { label: "Доступність увімкнено", ready: target.status === "free" },
      { label: "Профіль не призупинено", ready: target.wallet_balance > DEBT_BAN_THRESHOLD },
    ];
    return { checks, complete: checks.every((check) => check.ready) };
  }, [isSelf, role, savedSubcategoryIds.length, target]);

  const toggleStatus = async (free: boolean) => {
    if (!me) return;
    if (free && me.wallet_balance <= DEBT_BAN_THRESHOLD) {
      toast.error("Профіль призупинено через борг");
      return;
    }
    const status = free ? "free" : "offline";
    const { error } = await supabase.from("profiles").update({ status }).eq("id", me.id);
    if (error) toast.error("Не вдалося змінити статус");
    else {
      setTarget((current) => (current ? { ...current, status } : current));
      setProfile({ ...me, status });
    }
  };

  const saveMasterProfile = async () => {
    if (!me || !draft) return;
    const fullName = draft.full_name.trim();
    const avatarUrl = draft.avatar_url.trim();
    const experienceYears = Number.parseInt(draft.experience_years, 10);
    if (!fullName) {
      toast.error("Вкажіть ім'я майстра");
      return;
    }
    if (avatarUrl && !isHttpUrl(avatarUrl)) {
      toast.error("Вкажіть коректне посилання на фото");
      return;
    }
    if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 80) {
      toast.error("Вкажіть досвід від 0 до 80 років");
      return;
    }

    const changes: Database["public"]["Tables"]["profiles"]["Update"] = {
      full_name: fullName,
      avatar_url: avatarUrl || null,
      experience_years: experienceYears,
      has_vehicle: draft.has_vehicle,
      tools_inventory: draft.tools_inventory.trim() || null,
      locked_address: draft.locked_address.trim() || null,
    };
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update(changes).eq("id", me.id);
    setSavingProfile(false);
    if (error) {
      toast.error("Не вдалося зберегти зміни");
      return;
    }

    const nextProfile: Profile = {
      ...me,
      full_name: changes.full_name ?? null,
      avatar_url: changes.avatar_url ?? null,
      experience_years: changes.experience_years ?? 0,
      has_vehicle: changes.has_vehicle ?? false,
      tools_inventory: changes.tools_inventory ?? null,
      locked_address: changes.locked_address ?? null,
    };
    setProfile(nextProfile);
    setTarget((current) => (current ? { ...current, ...nextProfile } : current));
    setDraft({
      full_name: nextProfile.full_name ?? "",
      avatar_url: nextProfile.avatar_url ?? "",
      experience_years: String(nextProfile.experience_years),
      has_vehicle: nextProfile.has_vehicle,
      tools_inventory: nextProfile.tools_inventory ?? "",
      locked_address: nextProfile.locked_address ?? "",
    });
    toast.success("Профіль оновлено");
  };

  const changeServiceCategory = (categorySlug: string) => {
    const allowedIds = new Set(
      subcategories
        .filter((subcategory) => subcategory.category_slug === categorySlug)
        .map((subcategory) => subcategory.id),
    );
    setServiceCategory(categorySlug);
    setSelectedSubcategoryIds(savedSubcategoryIds.filter((id) => allowedIds.has(id)));
  };

  const toggleSubcategory = (subcategoryId: string, checked: boolean) => {
    setSelectedSubcategoryIds((current) =>
      checked
        ? [...new Set([...current, subcategoryId])]
        : current.filter((id) => id !== subcategoryId),
    );
  };

  const saveServices = async () => {
    if (!me || !serviceCategory) {
      toast.error("Оберіть категорію");
      return;
    }
    const allowedIds = new Set(editableSubcategories.map((subcategory) => subcategory.id));
    const desiredIds = selectedSubcategoryIds.filter((id) => allowedIds.has(id));
    const toInsert = desiredIds.filter((id) => !savedSubcategoryIds.includes(id));
    const toDelete = savedSubcategoryIds.filter((id) => !desiredIds.includes(id));
    setSavingServices(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ primary_category_slug: serviceCategory })
      .eq("id", me.id);
    if (profileError) {
      setSavingServices(false);
      toast.error("Не вдалося зберегти категорію");
      return;
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from("master_subcategories").insert(
        toInsert.map((subcategoryId) => ({
          master_id: me.id,
          subcategory_id: subcategoryId,
        })),
      );
      if (error) {
        setSavingServices(false);
        toast.error("Не вдалося зберегти підкатегорії");
        return;
      }
    }
    if (toDelete.length > 0) {
      const { error } = await supabase
        .from("master_subcategories")
        .delete()
        .eq("master_id", me.id)
        .in("subcategory_id", toDelete);
      if (error) {
        setSavingServices(false);
        toast.error("Не вдалося оновити підкатегорії");
        return;
      }
    }

    const nextProfile = { ...me, primary_category_slug: serviceCategory };
    setProfile(nextProfile);
    setTarget((current) =>
      current ? { ...current, primary_category_slug: serviceCategory } : current,
    );
    setSavedSubcategoryIds(desiredIds);
    setSelectedSubcategoryIds(desiredIds);
    setSavingServices(false);
    toast.success("Послуги оновлено");
  };

  const addPortfolioPhoto = async () => {
    if (!me) return;
    const url = portfolioUrl.trim();
    if (!isHttpUrl(url)) {
      toast.error("Вкажіть коректне посилання на фото");
      return;
    }
    const position = photos.reduce((max, photo) => Math.max(max, photo.position ?? 0), -1) + 1;
    setPortfolioBusy("add");
    const { data, error } = await supabase
      .from("portfolio_photos")
      .insert({ master_id: me.id, url, position })
      .select("id, url, position")
      .single();
    setPortfolioBusy(null);
    if (error) {
      toast.error("Не вдалося додати фото");
      return;
    }
    setPhotos((current) => [...current, data]);
    setPortfolioUrl("");
    toast.success("Фото додано до портфоліо");
  };

  const deletePortfolioPhoto = async (photoId: string) => {
    if (!me) return;
    setPortfolioBusy(photoId);
    const { error } = await supabase
      .from("portfolio_photos")
      .delete()
      .eq("id", photoId)
      .eq("master_id", me.id);
    setPortfolioBusy(null);
    if (error) {
      toast.error("Не вдалося видалити фото");
      return;
    }
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    toast.success("Фото видалено");
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
            <h1 className="text-xl font-bold">
              {isSelf ? "Мій профіль" : isMaster ? "Профіль майстра" : "Профіль клієнта"}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {isMaster
                ? target.verified
                  ? "Перевірений виконавець"
                  : "Публічний профіль майстра"
                : "Історія замовника"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {isMaster ? "Майстер" : target.role === "admin" ? "Адміністратор" : "Клієнт"}
          </span>
          {isSelf && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => navigate({ to: "/profile/settings" })}
              aria-label="Налаштування"
              title="Налаштування"
            >
              <Settings className="size-5" />
            </Button>
          )}
        </div>
      </header>

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
              {isMaster && (
                <>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                    <Layers3 className="size-4" />{" "}
                    {primaryCategory?.name_uk ?? "Категорію не вказано"}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
                    <span
                      className={`size-2 rounded-full ${target.status === "free" ? "bg-emerald-300" : "bg-white/45"}`}
                    />
                    {formatStatus(target.status)}
                  </p>
                </>
              )}
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

      {masterReadiness && (
        <section
          className="rounded-lg border bg-card p-4 shadow-sm"
          aria-labelledby="readiness-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="readiness-title" className="text-sm font-semibold">
                Готовність профілю майстра
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {masterReadiness.complete
                  ? "Профіль готовий і може відображатися клієнтам на карті."
                  : "Завершіть обов'язкові кроки, щоб клієнти могли знайти вас на карті."}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-xs font-semibold">
              {masterReadiness.checks.filter((check) => check.ready).length}/
              {masterReadiness.checks.length}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {masterReadiness.checks.map((check) => (
              <ReadinessItem key={check.label} {...check} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Портфоліо необов'язкове, але допомагає клієнтам обрати майстра.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("master-profile-editor")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <PencilLine className="size-4" /> Заповнити профіль
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/map" })}>
              <MapPin className="size-4" /> Оновити локацію на карті
            </Button>
            <Button
              type="button"
              onClick={() => toggleStatus(true)}
              disabled={target.status === "free" || target.wallet_balance <= DEBT_BAN_THRESHOLD}
            >
              <CheckCircle2 className="size-4" /> Увімкнути доступність
            </Button>
          </div>
        </section>
      )}

      {isSelf && role === "master" && (
        <section className="flex items-center justify-between gap-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="min-w-0">
            <p className="font-semibold">Доступний для замовлень</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {target.wallet_balance <= DEBT_BAN_THRESHOLD
                ? "Профіль призупинено через борг"
                : target.status === "free"
                  ? "Ваш маркер видно на карті"
                  : "Ваш маркер приховано"}
            </p>
          </div>
          <Switch
            checked={target.status === "free"}
            onCheckedChange={toggleStatus}
            disabled={target.wallet_balance <= DEBT_BAN_THRESHOLD}
            aria-label="Доступний для замовлень"
          />
        </section>
      )}

      {isSelf && role === "master" && draft && (
        <section
          id="master-profile-editor"
          className="rounded-lg border bg-card p-4 shadow-sm"
          aria-labelledby="edit-profile-title"
        >
          <div className="mb-4 flex items-center gap-2">
            <PencilLine className="size-4 text-primary" />
            <h2 id="edit-profile-title" className="text-sm font-semibold">
              Редагувати профіль
            </h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="master-name">Ім'я</Label>
              <Input
                id="master-name"
                value={draft.full_name}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, full_name: event.target.value } : current,
                  )
                }
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="master-avatar">Фото профілю</Label>
              <Input
                id="master-avatar"
                type="url"
                inputMode="url"
                value={draft.avatar_url}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, avatar_url: event.target.value } : current,
                  )
                }
                maxLength={1000}
                placeholder="https://"
              />
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="master-experience">Досвід, років</Label>
                <Input
                  id="master-experience"
                  type="number"
                  min={0}
                  max={80}
                  inputMode="numeric"
                  value={draft.experience_years}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, experience_years: event.target.value } : current,
                    )
                  }
                />
              </div>
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                <Checkbox
                  checked={draft.has_vehicle}
                  onCheckedChange={(checked) =>
                    setDraft((current) =>
                      current ? { ...current, has_vehicle: checked === true } : current,
                    )
                  }
                />
                Є авто
              </label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="master-tools">Інструменти</Label>
              <Textarea
                id="master-tools"
                value={draft.tools_inventory}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, tools_inventory: event.target.value } : current,
                  )
                }
                maxLength={500}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="master-address" className="flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Адреса для пошуку замовлень
              </Label>
              <Input
                id="master-address"
                value={draft.locked_address}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, locked_address: event.target.value } : current,
                  )
                }
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                Координати не змінюються тут. Оновіть точку у вкладці «Карта».
              </p>
            </div>
            <Button onClick={saveMasterProfile} disabled={savingProfile} className="w-full">
              {savingProfile ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Зберегти
            </Button>
          </div>
        </section>
      )}

      {isMaster && (
        <section
          className={isSelf && role === "master" ? "rounded-lg border bg-card p-4 shadow-sm" : ""}
          aria-labelledby="services-title"
        >
          <div className="mb-3 flex items-center gap-2">
            <Layers3 className="size-4 text-primary" />
            <h2 id="services-title" className="text-sm font-semibold">
              Послуги майстра
            </h2>
          </div>
          {isSelf && role === "master" ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="master-category">Категорія</Label>
                <Select value={serviceCategory} onValueChange={changeServiceCategory}>
                  <SelectTrigger id="master-category">
                    <SelectValue placeholder="Оберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name_uk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editableSubcategories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Підкатегорії</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {editableSubcategories.map((subcategory) => {
                      const checkboxId = `subcategory-${subcategory.id}`;
                      return (
                        <label
                          key={subcategory.id}
                          htmlFor={checkboxId}
                          className="flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={selectedSubcategoryIds.includes(subcategory.id)}
                            onCheckedChange={(checked) =>
                              toggleSubcategory(subcategory.id, checked === true)
                            }
                          />
                          <span className="leading-snug">{subcategory.name_uk}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <Button onClick={saveServices} disabled={savingServices} className="w-full">
                {savingServices ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Зберегти послуги
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-base font-semibold">
                {primaryCategory?.name_uk ?? "Категорію не вказано"}
              </p>
              {publicSubcategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {publicSubcategories.map((subcategory) => (
                    <span
                      key={subcategory.id}
                      className="rounded-md bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                    >
                      {subcategory.name_uk}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {isMaster && (
        <section aria-labelledby="portfolio-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="portfolio-title" className="flex items-center gap-2 text-sm font-semibold">
              <Images className="size-4 text-primary" /> Портфоліо робіт
            </h2>
            <span className="text-xs text-muted-foreground">{photos.length} фото</span>
          </div>
          {isSelf && role === "master" && (
            <div className="mb-3 rounded-lg border bg-card p-3 shadow-sm">
              <Label htmlFor="portfolio-url" className="mb-2 flex items-center gap-1.5">
                <ImagePlus className="size-4" /> Додати фото за посиланням
              </Label>
              <div className="flex gap-2">
                <Input
                  id="portfolio-url"
                  type="url"
                  inputMode="url"
                  value={portfolioUrl}
                  onChange={(event) => setPortfolioUrl(event.target.value)}
                  maxLength={1000}
                  placeholder="https://"
                />
                <Button
                  type="button"
                  onClick={addPortfolioPhoto}
                  disabled={portfolioBusy !== null}
                  aria-label="Додати фото"
                  title="Додати фото"
                  className="shrink-0"
                >
                  {portfolioBusy === "add" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                >
                  <img
                    src={photo.url}
                    alt="Приклад виконаної роботи"
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  {isSelf && role === "master" && (
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => deletePortfolioPhoto(photo.id)}
                      disabled={portfolioBusy !== null}
                      aria-label="Видалити фото"
                      title="Видалити фото"
                      className="absolute right-2 top-2 size-8 shadow-md"
                    >
                      {portfolioBusy === photo.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  )}
                </figure>
              ))}
            </div>
          ) : (
            <div className="flex min-h-24 items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 text-sm text-muted-foreground">
              <Images className="size-8 shrink-0 opacity-50" />
              <span>{isSelf ? "Портфоліо поки порожнє" : "Майстер ще не додав портфоліо"}</span>
            </div>
          )}
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
    </div>
  );
}

function ReadinessItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <CheckCircle2
        className={`size-4 shrink-0 ${ready ? "text-emerald-600" : "text-muted-foreground/45"}`}
        aria-hidden="true"
      />
      <span className={ready ? "text-foreground" : "text-muted-foreground"}>{label}</span>
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

function formatStatus(status: Profile["status"]): string {
  if (status === "free") return "Доступний для замовлень";
  if (status === "working") return "Зараз виконує замовлення";
  return "Наразі недоступний";
}

function isHttpUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
