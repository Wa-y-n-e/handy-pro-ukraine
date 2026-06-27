import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp, type Role } from "@/lib/app-context";
import { LANGS, CATEGORIES, tr } from "@/lib/i18n";
import { Wrench, Camera, Globe, Mail, Phone, User as UserIcon, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Handy Pro — Sign in" },
      { name: "description", content: "Sign in to Handy Pro as a client or master." },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const { lang, setLang, signIn, authed } = useApp();
  const nav = useNavigate();
  const [tab, setTab] = useState<Role>("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [cats, setCats] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (authed) nav({ to: "/home" });
  }, [authed, nav]);

  function toggleCat(id: string) {
    setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result as string);
    r.readAsDataURL(f);
  }

  function submit() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Min 2 chars";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email";
    if (tab === "master") {
      if (!phone || phone.length < 6) e.phone = "Phone required";
      if (!photo) e.photo = "Photo required";
      if (cats.length === 0) e.cats = "Select at least one";
    }
    setErrors(e);
    if (Object.keys(e).length) return;
    signIn({
      role: tab,
      name,
      email,
      phone,
      photo,
      categories: cats,
      wallet: tab === "client" ? 1450 : 8200,
      rating: tab === "master" ? 4.9 : 4.8,
      completed: tab === "master" ? 87 : 12,
    });
    nav({ to: "/home" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-soft">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight">Handy Pro</div>
              <div className="text-[10px] text-muted-foreground">{tr("tagline", lang)}</div>
            </div>
          </div>
          <div className="relative">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="appearance-none rounded-full border border-border bg-card py-1.5 pl-7 pr-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <Globe className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Hero */}
        <div className="mt-8">
          <h1 className="text-3xl font-black leading-tight tracking-tight">
            {tr("tagline", lang)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escrow · SOS · Anti-РЭБ карта · Kharkiv
          </p>
        </div>

        {/* Role tabs */}
        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["client", "master"] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => setTab(r)}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${
                tab === r ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {tr(r, lang)}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="mt-5 space-y-3">
          <Field icon={<UserIcon className="h-4 w-4" />} value={name} onChange={setName} placeholder={tr("name", lang)} error={errors.name} />
          <Field icon={<Mail className="h-4 w-4" />} value={email} onChange={setEmail} placeholder={tr("email", lang)} error={errors.email} type="email" />

          {tab === "master" && (
            <>
              <Field icon={<Phone className="h-4 w-4" />} value={phone} onChange={setPhone} placeholder={tr("phone", lang)} error={errors.phone} type="tel" />

              <div>
                <label className="text-xs font-semibold text-muted-foreground">{tr("photo", lang)}</label>
                <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-3 transition hover:border-primary">
                  {photo ? (
                    <img src={photo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-xl bg-muted">
                      <Camera className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{photo ? "✓ " + tr("photo", lang) : tr("uploadPhoto", lang)}</div>
                    <div className="text-[11px] text-muted-foreground">JPG / PNG · max 5MB</div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                </label>
                {errors.photo && <p className="mt-1 text-xs text-destructive">{errors.photo}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">{tr("pickCategories", lang)}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => {
                    const on = cats.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCat(c.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          on
                            ? "border-primary bg-primary text-primary-foreground shadow-soft"
                            : "border-border bg-card text-foreground hover:border-primary"
                        }`}
                      >
                        <span>{c.icon}</span>
                        {c[lang]}
                        {on && <Check className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
                {errors.cats && <p className="mt-1 text-xs text-destructive">{errors.cats}</p>}
              </div>
            </>
          )}
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={submit}
            className="w-full rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-soft transition active:scale-[0.98]"
          >
            {tr("continue", lang)} →
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            By continuing you agree to the Handy Pro terms.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon, value, onChange, placeholder, error, type = "text",
}: {
  icon: React.ReactNode; value: string; onChange: (v: string) => void;
  placeholder: string; error?: string; type?: string;
}) {
  return (
    <div>
      <div className={`flex items-center gap-2 rounded-2xl border bg-card px-3.5 py-3 transition focus-within:ring-2 focus-within:ring-ring ${
        error ? "border-destructive" : "border-border"
      }`}>
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error && <p className="mt-1 px-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
