import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_ICONS, KHARKIV, geocodeAddress, haversineKm } from "@/lib/handy";
import { useSession } from "@/lib/use-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { MapPin, Star, BadgeCheck, MessageCircle, FileText, Lock, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import type { LatLngExpression, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

const searchSchema = z.object({
  cat: z.string().optional(),
  sub: z.string().optional(),
});

export const Route = createFileRoute("/map")({
  component: MapPage,
  validateSearch: (s) => searchSchema.parse(s),
});

interface Cat { slug: string; name_uk: string; icon: string }
interface MasterRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  rating: number;
  status: string;
  verified: boolean;
  primary_category_slug: string | null;
  locked_lat: number | null;
  locked_lng: number | null;
}

function MapPage() {
  const { cat, sub } = Route.useSearch();
  const { profile } = useSession();
  const navigate = useNavigate();
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [activeCat, setActiveCat] = useState<string | undefined>(cat);
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [center, setCenter] = useState<LatLngExpression>(
    profile?.locked_lat && profile?.locked_lng
      ? [profile.locked_lat, profile.locked_lng]
      : KHARKIV
  );
  const [address, setAddress] = useState(profile?.locked_address ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const [selected, setSelected] = useState<MasterRow | null>(null);

  // Load categories
  useEffect(() => {
    supabase.from("categories").select("slug, name_uk, icon").order("position")
      .then(({ data }) => setCats((data as Cat[]) ?? []));
  }, []);

  // Load + subscribe to masters
  useEffect(() => {
    const load = async () => {
      let query = supabase.from("profiles_public" as never)
        .select("id, full_name, avatar_url, rating, status, verified, primary_category_slug, locked_lat, locked_lng")
        .eq("status", "free")
        .not("locked_lat", "is", null);
      if (activeCat) query = query.eq("primary_category_slug", activeCat);
      const { data } = await query;
      setMasters(((data as unknown) as MasterRow[]) ?? []);
    };
    load();
    const ch = supabase.channel("masters-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeCat]);

  // Init Leaflet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapDiv.current || mapRef.current) return;
      const map = L.map(mapDiv.current, { zoomControl: false, attributionControl: false })
        .setView(center as [number, number], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // Update markers
  useEffect(() => {
    (async () => {
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // User pin
      const userIcon = L.divIcon({
        className: "",
        html: `<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-4 ring-blue-500/30"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      const userMarker = L.marker(center as [number, number], { icon: userIcon }).addTo(map);
      markersRef.current.push(userMarker);

      for (const m of masters) {
        if (m.locked_lat == null || m.locked_lng == null) continue;
        const iconKey = m.primary_category_slug ?? "handyman";
        const icon = L.divIcon({
          className: "",
          html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white shadow-lg ring-2 ring-white" data-cat="${iconKey}">
            <span style="font-size:18px">${categoryEmoji(iconKey)}</span>
          </div>`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        });
        const marker = L.marker([m.locked_lat, m.locked_lng], { icon }).addTo(map);
        marker.on("click", () => setSelected(m));
        markersRef.current.push(marker);
      }
    })();
  }, [masters, center]);

  // Recenter when manual address resolved
  useEffect(() => {
    mapRef.current?.setView(center as [number, number], 14);
  }, [center]);

  const overrideAddress = async () => {
    if (!address.trim()) return;
    setGeocoding(true);
    const r = await geocodeAddress(address);
    setGeocoding(false);
    if (!r) { toast.error("Адресу не знайдено"); return; }
    setCenter([r.lat, r.lng]);
    if (profile) {
      await supabase.from("profiles").update({
        locked_address: r.display, locked_lat: r.lat, locked_lng: r.lng,
      }).eq("id", profile.id);
    }
    toast.success("Адресу зафіксовано", { description: r.display });
  };

  const selectedDistance = useMemo(() => {
    if (!selected?.locked_lat || !selected?.locked_lng) return null;
    return haversineKm(center as [number, number], [selected.locked_lat, selected.locked_lng]);
  }, [selected, center]);

  const openChat = async () => {
    if (!selected || !profile) return;
    const { data: existing } = await supabase
      .from("chats").select("id")
      .eq("client_id", profile.id).eq("master_id", selected.id)
      .limit(1).maybeSingle();
    let chatId = existing?.id;
    if (!chatId) {
      const { data: newChat, error } = await supabase
        .from("chats").insert({ client_id: profile.id, master_id: selected.id })
        .select("id").single();
      if (error) { toast.error(error.message); return; }
      chatId = newChat.id;
    }
    navigate({ to: "/chats/$id", params: { id: chatId } });
  };

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden">
      {/* Anti-EW search overlay */}
      <div className="absolute top-0 inset-x-0 z-20 bg-background/95 backdrop-blur border-b p-3 space-y-2">
        <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
          <Lock className="size-3" />
          GPS визначив локацію невірно? Введіть адресу вручну
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Валентинівська, 21" className="pl-9 h-10 rounded-xl" />
          </div>
          <Button onClick={overrideAddress} disabled={geocoding} className="h-10 rounded-xl">
            {geocoding ? <Loader2 className="size-4 animate-spin" /> : "Знайти"}
          </Button>
        </div>
      </div>

      {/* Category filter carousel */}
      <div className="absolute top-[88px] inset-x-0 z-20 px-2 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max">
          <button onClick={() => setActiveCat(undefined)}
            className={`shrink-0 rounded-full px-3 h-9 text-xs font-semibold border ${!activeCat ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
            Усі
          </button>
          {cats.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug];
            const active = activeCat === c.slug;
            return (
              <button key={c.slug} onClick={() => setActiveCat(c.slug)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 h-9 text-xs font-semibold border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                {Icon && <Icon className="size-4" />}
                <span className="max-w-[120px] truncate">{c.name_uk}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div ref={mapDiv} className="absolute inset-0 z-0" />

      {/* Bottom sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-6 max-h-[70vh]">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="sr-only">Профіль майстра</SheetTitle>
                <div className="flex items-start gap-3">
                  <div className="size-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl">
                    {selected.avatar_url ? <img src={selected.avatar_url} alt="" className="size-full rounded-2xl object-cover" /> : "👷"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h3 className="font-bold text-lg">{selected.full_name ?? "Майстер"}</h3>
                      {selected.verified && <BadgeCheck className="size-5 text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-amber-400 text-amber-400" />{selected.rating.toFixed(2)}</span>
                      {selectedDistance != null && (
                        <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" />{selectedDistance.toFixed(1)} км</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{categoryName(cats, selected.primary_category_slug)}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <Button onClick={openChat} className="h-12 rounded-xl"><MessageCircle className="size-4" /> Чат</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/profile", search: { id: selected.id } as never })} className="h-12 rounded-xl">
                  <FileText className="size-4" /> Детальніше
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function categoryEmoji(slug: string): string {
  return ({
    plumbing: "🔧", electric: "⚡", handyman: "🔨", doors_windows: "🚪",
    furniture: "🛋️", appliances: "📺", micro_repair: "🧱", garden: "🌱",
    labor: "💪", heavy: "🚜", internet: "🌐",
  } as Record<string, string>)[slug] ?? "🔧";
}
function categoryName(cats: Cat[], slug: string | null): string {
  return cats.find((c) => c.slug === slug)?.name_uk ?? "";
}
