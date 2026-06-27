import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useApp } from "@/lib/app-context";
import { tr } from "@/lib/i18n";
import { MapPin, ShieldAlert, Crosshair, Edit3 } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Handy Pro — Map" },
      { name: "description", content: "Manual geo-pin map with anti-jamming fallback." },
    ],
  }),
  component: MapScreen,
});

function MapScreen() {
  const { authed, lang, pinAddress, setPinAddress, pinCoord, setPinCoord, masters } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  if (!authed) return <Navigate to="/" />;

  function handle(e: React.PointerEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setPinCoord({
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    });
  }

  return (
    <div className="space-y-4">
      {/* Anti-EW banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/15 p-3.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning text-warning-foreground">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wider text-warning-foreground/90">
            ⚠️ {tr("antiEW", lang)}
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-foreground">
            {tr("manualPin", lang)}
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        ref={ref}
        onPointerDown={(e) => { setDragging(true); handle(e); }}
        onPointerMove={(e) => dragging && handle(e)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
        className="relative aspect-[4/5] w-full touch-none overflow-hidden rounded-3xl border border-border shadow-soft select-none"
        style={{
          backgroundImage:
            "linear-gradient(135deg, oklch(0.95 0.03 175) 0%, oklch(0.88 0.06 170) 100%)",
        }}
      >
        {/* grid */}
        <svg className="absolute inset-0 h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="oklch(0.7 0.05 180)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>

        {/* roads */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,30 Q40,40 60,55 T100,70" stroke="oklch(0.75 0.04 180)" strokeWidth="1.5" fill="none" />
          <path d="M20,0 L25,100" stroke="oklch(0.75 0.04 180)" strokeWidth="1.2" fill="none" />
          <path d="M70,0 Q65,50 78,100" stroke="oklch(0.75 0.04 180)" strokeWidth="1.2" fill="none" />
        </svg>

        {/* nearby masters */}
        {masters.slice(0, 4).map((m, i) => {
          const positions = [
            { x: 25, y: 30 }, { x: 70, y: 25 }, { x: 35, y: 70 }, { x: 80, y: 65 },
          ];
          const p = positions[i];
          return (
            <div
              key={m.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-card bg-primary text-[10px] font-black text-primary-foreground shadow-soft">
                {m.name[0]}
              </div>
            </div>
          );
        })}

        {/* pin */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${pinCoord.x}%`, top: `${pinCoord.y}%` }}
        >
          <div className="relative">
            <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm bg-emergency" />
            <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-emergency text-emergency-foreground shadow-soft animate-sos">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-[10px] font-semibold text-muted-foreground backdrop-blur">
          <Crosshair className="mr-1 inline h-3 w-3" /> Натисніть або перетягніть пін
        </div>
      </div>

      {/* Manual address */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <Edit3 className="h-3 w-3" /> {tr("address", lang)}
        </label>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-3 focus-within:ring-2 focus-within:ring-ring">
          <MapPin className="h-4 w-4 text-primary" />
          <input
            value={pinAddress}
            onChange={(e) => setPinAddress(e.target.value)}
            placeholder="вул. Сумська, 25"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <button className="w-full rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-soft">
        {tr("confirmLocation", lang)}
      </button>
    </div>
  );
}
