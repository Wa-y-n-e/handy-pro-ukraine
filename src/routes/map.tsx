import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { CATEGORY_ICONS, KHARKIV, geocodeAddress, haversineKm } from "@/lib/handy";
import { useSession } from "@/lib/use-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Navigation,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

const searchSchema = z.object({
  cat: z.string().optional(),
  sub: z.string().optional(),
});

export const Route = createFileRoute("/map")({
  component: MapPage,
  validateSearch: (search) => searchSchema.parse(search),
});

interface Cat {
  slug: string;
  name_uk: string;
  icon: string;
}

interface Sub {
  id: string;
  name_uk: string;
  category_slug: string;
}

type MasterRow = Database["public"]["Functions"]["get_available_masters"]["Returns"][number];

interface PendingMasterLocation {
  lat: number;
  lng: number;
  address: string | null;
}

function MapPage() {
  const { cat, sub } = Route.useSearch();
  const { profile, role, setProfile } = useSession();
  const navigate = useNavigate();
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const profileCenterAppliedRef = useRef(false);
  const initialCenterRef = useRef<[number, number]>(
    profile?.locked_lat != null && profile.locked_lng != null
      ? [profile.locked_lat, profile.locked_lng]
      : KHARKIV,
  );

  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [activeCat, setActiveCat] = useState<string | undefined>(cat);
  const [activeSub, setActiveSub] = useState<string | undefined>(sub);
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [center, setCenter] = useState<[number, number]>(initialCenterRef.current);
  const [address, setAddress] = useState(profile?.locked_address ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [pendingMasterLocation, setPendingMasterLocation] = useState<PendingMasterLocation | null>(
    null,
  );
  const [savingLocation, setSavingLocation] = useState(false);
  const [selected, setSelected] = useState<MasterRow | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<number | null>(null);
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    if (
      profileCenterAppliedRef.current ||
      profile?.locked_lat == null ||
      profile.locked_lng == null
    ) {
      return;
    }
    profileCenterAppliedRef.current = true;
    setCenter([profile.locked_lat, profile.locked_lng]);
    setAddress(profile.locked_address ?? "");
  }, [profile]);

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("slug, name_uk, icon").order("position"),
      supabase.from("subcategories").select("id, name_uk, category_slug").order("position"),
    ]).then(([{ data: categoryRows }, { data: subcategoryRows }]) => {
      setCats(categoryRows ?? []);
      setSubs(subcategoryRows ?? []);
    });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setMastersLoading(true);
      const { data, error } = await supabase.rpc("get_available_masters", {
        p_category_slug: activeCat,
        p_subcategory_id: activeSub,
      });
      if (!active) return;
      setMastersLoading(false);
      if (error) {
        toast.error("Не вдалося оновити майстрів на карті");
        return;
      }
      setMasters(data ?? []);
    };
    void load();
    const channel = supabase
      .channel(`masters-map-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [activeCat, activeSub]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapDiv.current || mapRef.current) return;
      const map = L.map(mapDiv.current, { zoomControl: false, attributionControl: false }).setView(
        initialCenterRef.current,
        13,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const userIcon = L.divIcon({
        className: "",
        html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg ring-4 ring-blue-500/30"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      markersRef.current.push(L.marker(center, { icon: userIcon }).addTo(map));

      for (const master of masters) {
        if (master.locked_lat == null || master.locked_lng == null) continue;
        const iconKey = master.primary_category_slug ?? "handyman";
        const icon = L.divIcon({
          className: "",
          html: `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-2 ring-white"><span style="font-size:18px">${categoryEmoji(iconKey)}</span></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        const marker = L.marker([master.locked_lat, master.locked_lng], { icon }).addTo(map);
        marker.on("click", () => setSelected(master));
        markersRef.current.push(marker);
      }
    })();
  }, [center, masters]);

  useEffect(() => {
    mapRef.current?.setView(center, 14);
  }, [center]);

  useEffect(() => {
    if (!selected) {
      setSelectedExperience(null);
      return;
    }
    let active = true;
    void supabase.rpc("get_public_profile", { p_profile_id: selected.id }).then(({ data }) => {
      if (active) setSelectedExperience(data?.[0]?.experience_years ?? null);
    });
    return () => {
      active = false;
    };
  }, [selected]);

  const useMyGeolocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationMessage("Цей браузер не підтримує геолокацію. Введіть адресу вручну.");
      return;
    }
    setLocating(true);
    setLocationMessage(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next: [number, number] = [coords.latitude, coords.longitude];
        profileCenterAppliedRef.current = true;
        setCenter(next);
        setLocating(false);
        if (role === "master") {
          setPendingMasterLocation({ lat: next[0], lng: next[1], address: null });
          setLocationMessage("Перевірте точку на карті та підтвердьте збереження локації майстра.");
        } else {
          setPendingMasterLocation(null);
          setLocationMessage(
            "Геолокацію використано лише для цього пошуку. У профіль її не збережено.",
          );
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === 1) {
          setLocationMessage(
            "Доступ до геолокації заборонено. Дозвольте його в браузері або введіть адресу вручну.",
          );
        } else if (error.code === 3) {
          setLocationMessage(
            "Не вдалося швидко визначити точку. Спробуйте ще раз або введіть адресу вручну.",
          );
        } else {
          setLocationMessage("Геолокація зараз недоступна. Введіть адресу вручну.");
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  const findAddress = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    const result = await geocodeAddress(address);
    setGeocoding(false);
    if (!result) {
      toast.error("Адресу не знайдено");
      setLocationMessage("Перевірте написання адреси або використайте геолокацію.");
      return;
    }
    profileCenterAppliedRef.current = true;
    setCenter([result.lat, result.lng]);
    setAddress(result.display);
    if (role === "master") {
      setPendingMasterLocation({ lat: result.lat, lng: result.lng, address: result.display });
      setLocationMessage("Перевірте точку на карті та підтвердьте збереження локації майстра.");
    } else {
      setPendingMasterLocation(null);
      setLocationMessage("Адресу використано лише для цього пошуку. У профіль її не збережено.");
    }
  };

  const saveMasterLocation = async () => {
    if (!profile || role !== "master" || !pendingMasterLocation) return;
    setSavingLocation(true);
    const changes: Database["public"]["Tables"]["profiles"]["Update"] = {
      locked_lat: pendingMasterLocation.lat,
      locked_lng: pendingMasterLocation.lng,
    };
    if (pendingMasterLocation.address) changes.locked_address = pendingMasterLocation.address;
    const { error } = await supabase.from("profiles").update(changes).eq("id", profile.id);
    setSavingLocation(false);
    if (error) {
      toast.error("Не вдалося зберегти локацію майстра");
      return;
    }
    setProfile({
      ...profile,
      locked_lat: pendingMasterLocation.lat,
      locked_lng: pendingMasterLocation.lng,
      locked_address: pendingMasterLocation.address ?? profile.locked_address,
    });
    setPendingMasterLocation(null);
    setLocationMessage(
      "Локацію майстра збережено. Увімкніть доступність у профілі, щоб з'явитися на карті.",
    );
    toast.success("Локацію майстра збережено");
  };

  const selectedDistance = useMemo(() => {
    if (selected?.locked_lat == null || selected.locked_lng == null) return null;
    return haversineKm(center, [selected.locked_lat, selected.locked_lng]);
  }, [center, selected]);

  const openChat = async () => {
    if (!selected || !profile || role !== "client") return;
    setChatBusy(true);
    const { data: existing, error: lookupError } = await supabase
      .from("chats")
      .select("id")
      .eq("client_id", profile.id)
      .eq("master_id", selected.id)
      .limit(1)
      .maybeSingle();
    if (lookupError) {
      setChatBusy(false);
      toast.error("Не вдалося відкрити чат");
      return;
    }
    let chatId = existing?.id;
    if (!chatId) {
      const { data: newChat, error } = await supabase
        .from("chats")
        .insert({ client_id: profile.id, master_id: selected.id })
        .select("id")
        .single();
      if (error) {
        setChatBusy(false);
        toast.error("Не вдалося створити чат");
        return;
      }
      chatId = newChat.id;
    }
    setChatBusy(false);
    navigate({ to: "/chats/$id", params: { id: chatId } });
  };

  const clearFilters = () => {
    setActiveCat(undefined);
    setActiveSub(undefined);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-2 border-b bg-background p-3">
        <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
          <Lock className="size-3 shrink-0" />
          GPS визначив локацію невірно? Введіть адресу вручну
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={useMyGeolocation}
          disabled={locating}
          className="w-full"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Navigation className="size-4" />
          )}
          Використати мою геолокацію
        </Button>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void findAddress();
              }}
              placeholder="Валентинівська, 21"
              className="pl-9"
            />
          </div>
          <Button type="button" onClick={findAddress} disabled={geocoding} className="shrink-0">
            {geocoding ? <Loader2 className="size-4 animate-spin" /> : "Знайти"}
          </Button>
        </div>

        {role === "master" && (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Локація майстра</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Через GPS/РЕБ координати можуть бути неточними. Якщо точка неправильна — введіть
                  адресу вручну.
                </p>
              </div>
            </div>
            {pendingMasterLocation && (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={saveMasterLocation}
                  disabled={savingLocation}
                  className="min-w-0 flex-1"
                >
                  {savingLocation ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MapPin className="size-4" />
                  )}
                  Зберегти локацію майстра
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setPendingMasterLocation(null)}
                  aria-label="Скасувати зміну локації"
                  title="Скасувати"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {locationMessage && (
          <p className="text-[11px] leading-relaxed text-muted-foreground" aria-live="polite">
            {locationMessage}
          </p>
        )}

        <div className="overflow-x-auto no-scrollbar">
          <div className="flex w-max gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className={`h-9 shrink-0 rounded-full border px-3 text-xs font-semibold ${!activeCat ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
            >
              Усі
            </button>
            {cats.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug];
              const active = activeCat === category.slug;
              return (
                <button
                  type="button"
                  key={category.slug}
                  onClick={() => {
                    setActiveCat(category.slug);
                    setActiveSub(undefined);
                  }}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}
                >
                  {Icon && <Icon className="size-4" />}
                  <span className="max-w-[120px] truncate">{category.name_uk}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeSub && (
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
            <p className="min-w-0 truncate text-xs font-medium">
              {subs.find((item) => item.id === activeSub)?.name_uk ?? "Обрана послуга"}
            </p>
            <button
              type="button"
              onClick={() => setActiveSub(undefined)}
              className="shrink-0 text-xs font-semibold text-primary"
            >
              Скинути
            </button>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={mapDiv} className="absolute inset-0 z-0" />
        <div className="absolute left-3 top-3 z-[400] rounded-full border bg-background/95 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
          {mastersLoading ? "Шукаємо майстрів..." : `Знайдено майстрів: ${masters.length}`}
        </div>
        {!mastersLoading && masters.length === 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-[400] rounded-lg border bg-background/95 p-3 shadow-md backdrop-blur">
            <p className="text-sm font-semibold">Майстрів за цим фільтром поки немає</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Спробуйте іншу категорію або очистіть фільтр
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button type="button" size="sm" variant="outline" onClick={clearFilters}>
                Очистити фільтр
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate({ to: "/profile/settings" })}
              >
                <MessageSquareWarning className="size-4" /> Повідомити про проблему
              </Button>
            </div>
          </div>
        )}
      </div>

      <Sheet open={selected != null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl pb-6">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="sr-only">Профіль майстра</SheetTitle>
                <div className="flex items-start gap-3">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-primary">
                    {selected.avatar_url ? (
                      <img src={selected.avatar_url} alt="" className="size-full object-cover" />
                    ) : (
                      <UserRound className="size-8" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <h3 className="break-words text-lg font-bold">
                        {selected.full_name ?? "Майстер"}
                      </h3>
                      {selected.verified && <BadgeCheck className="size-5 text-blue-500" />}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 font-semibold">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        {Number(selected.rating).toFixed(2)}
                      </span>
                      {selectedDistance != null && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="size-3" /> {selectedDistance.toFixed(1)} км
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {categoryName(cats, selected.primary_category_slug)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        Доступний
                      </span>
                      {selectedExperience != null && selectedExperience > 0 && (
                        <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1">
                          <BriefcaseBusiness className="size-3" /> Досвід: {selectedExperience} р.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>
              <div
                className={`mt-5 grid gap-2 ${role === "client" ? "grid-cols-2" : "grid-cols-1"}`}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/profile", search: { id: selected.id } as never })}
                  className="h-12"
                >
                  <FileText className="size-4" /> Профіль
                </Button>
                {role === "client" && (
                  <Button type="button" onClick={openChat} disabled={chatBusy} className="h-12">
                    {chatBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MessageCircle className="size-4" />
                    )}
                    Написати
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function categoryEmoji(slug: string): string {
  return (
    (
      {
        plumbing: "🔧",
        electric: "⚡",
        handyman: "🔨",
        doors_windows: "🚪",
        furniture: "🛋️",
        appliances: "📺",
        micro_repair: "🧱",
        garden: "🌱",
        labor: "💪",
        heavy: "🚜",
        internet: "🌐",
      } as Record<string, string>
    )[slug] ?? "🔧"
  );
}

function categoryName(cats: Cat[], slug: string | null): string {
  return cats.find((category) => category.slug === slug)?.name_uk ?? "Категорію не вказано";
}
