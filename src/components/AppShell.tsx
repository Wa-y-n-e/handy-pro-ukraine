import { useState, type ReactNode } from "react";
import { LANGS, VIEW_MODES, tr } from "@/lib/i18n";
import { useApp } from "@/lib/app-context";
import { ChevronDown, HelpCircle, Phone, WifiOff, X, Send, MessageCircle, Globe, ShieldAlert } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, setLang, viewMode, setViewMode, supportOpen, setSupportOpen, legalOpen, setLegalOpen, authed, offline, setOffline } = useApp();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Sticky Testing Mode Switcher */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-screen-sm items-center gap-2 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">HP</div>
          <span className="hidden truncate text-[11px] font-semibold text-muted-foreground sm:inline">{tr("testingMode", lang)}:</span>
          <div className="relative min-w-0 flex-1">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
              className="w-full appearance-none truncate rounded-lg border border-border bg-background py-1.5 pl-2 pr-7 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {VIEW_MODES.map((m) => (
                <option key={m.id} value={m.id}>{m.icon} {m[lang]}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <div className="relative shrink-0">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="appearance-none rounded-lg border border-border bg-background py-1.5 pl-6 pr-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <Globe className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
          {authed && (
            <button
              onClick={() => setSupportOpen(true)}
              aria-label="Support"
              className="shrink-0 rounded-lg border border-border bg-background p-1.5 text-foreground hover:bg-accent"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          )}
        </div>
        {authed && (
          <button
            onClick={() => setOffline(!offline)}
            className={`flex w-full items-center justify-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold transition ${
              offline ? "bg-warning text-warning-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"
            }`}
          >
            <WifiOff className="h-3 w-3" /> {offline ? "Інтернет недоступний — увімкнено План «Б» (GSM)" : "Мережа OK · натисніть для симуляції втрати інтернету"}
          </button>
        )}
      </div>

      <main className="mx-auto w-full max-w-screen-sm px-4 pb-24 pt-4">{children}</main>

      {authed && offline && <GsmFallbackBar />}
      {authed && supportOpen && <SupportPanel onClose={() => setSupportOpen(false)} onLegal={() => { setSupportOpen(false); setLegalOpen(true); }} />}
      {legalOpen && <LegalModal onClose={() => setLegalOpen(false)} />}
    </div>
  );
}

function GsmFallbackBar() {
  return (
    <a
      href="tel:+380443333333"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 bg-emergency py-3 text-sm font-bold text-emergency-foreground shadow-soft"
    >
      <Phone className="h-4 w-4 animate-pulse" />
      Обычный звонок (без интернета) · +380 44 333-33-33
    </a>
  );
}

function SupportPanel({ onClose, onLegal }: { onClose: () => void; onLegal: () => void }) {
  const { lang } = useApp();
  const [chat, setChat] = useState<{ from: "user" | "bot"; text: string }[]>([
    { from: "bot", text: "Здравствуйте! Я бот поддержки Handy Pro. Опишите проблему." },
  ]);
  const [input, setInput] = useState("");
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl bg-card p-5 shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">{tr("support", lang)}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {!showChat ? (
          <div className="mt-4 space-y-2">
            <button onClick={() => setShowChat(true)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 text-left hover:border-primary">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div><div className="text-sm font-bold">{tr("supportChat", lang)}</div><div className="text-xs text-muted-foreground">Bot online · ~30s</div></div>
            </button>
            <a target="_blank" rel="noreferrer" href="https://t.me/HandyProBot" className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-primary">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#229ED9] text-white text-lg">✈</span>
              <div className="text-sm font-bold">{tr("telegram", lang)}</div>
            </a>
            <a target="_blank" rel="noreferrer" href="viber://chat?number=%2B380443333333" className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-primary">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#7360F2] text-white text-lg">📞</span>
              <div className="text-sm font-bold">{tr("viber", lang)}</div>
            </a>
            <a href="tel:+380443333333" className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-3 hover:border-primary">
              <Phone className="h-5 w-5 text-success" />
              <div><div className="text-sm font-bold">{tr("hotline", lang)}</div><div className="text-xs text-muted-foreground">+380 44 333-33-33</div></div>
            </a>
            <button onClick={onLegal} className="mt-2 flex w-full items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-left hover:border-warning">
              <ShieldAlert className="h-5 w-5 text-warning-foreground" />
              <div className="text-sm font-bold">{tr("legalDocs", lang)}</div>
            </button>
          </div>
        ) : (
          <div className="mt-4 flex h-80 flex-col">
            <div className="flex-1 space-y-2 overflow-y-auto rounded-xl bg-muted/40 p-3">
              {chat.map((m, i) => (
                <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-card"}`}>{m.text}</div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button
                onClick={() => {
                  if (!input.trim()) return;
                  const t = input;
                  setChat((c) => [...c, { from: "user", text: t }]);
                  setInput("");
                  setTimeout(() => setChat((c) => [...c, { from: "bot", text: "Дякуємо! Оператор підключиться за 1-2 хв." }]), 700);
                }}
                className="rounded-lg bg-primary px-3 text-primary-foreground"
              ><Send className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LegalModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-2" onClick={onClose}>
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-black">Користувацька угода · Пользовательское соглашение · User Agreement</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-5 overflow-y-auto p-5 text-sm leading-relaxed">
          <Section title="A. Інформаційний посередник / Informational intermediary">
            <p><b>UA.</b> Платформа Handy Pro діє виключно як цифровий інформаційний посередник (ст. 3, 17 Закону України «Про електронну комерцію»). Платформа не є роботодавцем, агентом, підрядником, страховиком чи партнером користувачів.</p>
            <p><b>RU.</b> Платформа Handy Pro действует исключительно как цифровой информационный посредник (ст. 3, 17 ЗУ «Об электронной коммерции»). Платформа не является работодателем, агентом, подрядчиком, страховщиком или партнёром пользователей.</p>
            <p><b>EN.</b> Handy Pro is solely a digital informational intermediary (Law of Ukraine "On Electronic Commerce", Art. 3, 17). It is NOT an employer, hiring agent, contractor, insurer or partner.</p>
          </Section>
          <Section title="B. Медичне та фізичне відмова / Medical & physical injury waiver">
            <p><b>UA.</b> Платформа НЕ несе жодної цивільної, матеріальної, фінансової чи кримінальної відповідальності за травми, ураження струмом, падіння, опіки, погіршення здоровʼя чи смерть будь-якого користувача до/під час/після виконання робіт. Майстри самостійно відповідають за ЗІЗ та правила техніки безпеки; клієнти — за безпечне середовище.</p>
            <p><b>RU.</b> Платформа НЕ несёт никакой гражданской, материальной, финансовой или уголовной ответственности за травмы, удары током, падения, ожоги, ухудшение здоровья или смерть пользователей. Мастера сами отвечают за СИЗ и охрану труда; клиенты — за безопасность в помещении.</p>
            <p><b>EN.</b> Platform bears ZERO civil, material, financial or criminal liability for injuries, electric shocks, falls, burns, health deterioration or death of any user. Masters are responsible for PPE and occupational safety; clients — for safe environment.</p>
          </Section>
          <Section title="C. Майно, готівка, крадіжки / Property, cash & theft disclaimer">
            <p><b>UA.</b> Платформа звільнена від відповідальності за злочини проти власності. У разі таємного викрадення (ст. 185 ККУ), крадіжки/розбою (ст. 186, 187), шахрайства (ст. 190) чи навмисного знищення майна (ст. 194) потерпіла сторона звертається безпосередньо до Національної поліції України. Платформа не проводить розшук та не компенсує вартість.</p>
            <p><b>RU.</b> Платформа освобождена от ответственности за преступления против собственности. В случае тайного хищения (ст. 185 УКУ), грабежа/разбоя (ст. 186, 187), мошенничества (ст. 190) или умышленного уничтожения имущества (ст. 194) пострадавшая сторона обращается напрямую в Национальную полицию Украины. Платформа не проводит розыск и не компенсирует стоимость.</p>
            <p><b>EN.</b> Platform is held harmless from property crimes. In case of theft (Art. 185 CCU), robbery (Art. 186, 187), fraud (Art. 190) or intentional destruction of property (Art. 194), the aggrieved party contacts the National Police of Ukraine directly. Platform does not investigate or reimburse.</p>
          </Section>
          <Section title="D. Виключення вбивства / Homicide exclusion">
            <p><b>UA.</b> Платформа НЕ несе жодної відповідальності за крайнє кримінальне насильство або умисне вбивство (ст. 115 ККУ), скоєне користувачами.</p>
            <p><b>RU.</b> Платформа НЕ несёт никакой ответственности за крайнее криминальное насилие или умышленное убийство (ст. 115 УКУ), совершённое пользователями.</p>
            <p><b>EN.</b> Platform bears zero liability for extreme criminal violence or intentional homicide (Art. 115 CCU) by users.</p>
          </Section>
          <Section title="E. Військовий форс-мажор / Military force majeure">
            <p><b>UA.</b> Платформа має абсолютний правовий імунітет щодо травм, втрати майна або смерті, спричинених активними бойовими діями, прямими/непрямими ракетними ударами, ударними БпЛА («Shahed»), артилерійським/мінометним обстрілом або уламками засобів ППО. Користувачі приймають усі ризики активної воєнної зони.</p>
            <p><b>RU.</b> Платформа имеет абсолютный правовой иммунитет в отношении травм, утраты имущества или смерти, вызванных активными боевыми действиями, прямыми/непрямыми ракетными ударами, ударными БпЛА («Shahed»), артиллерийским/миномётным обстрелом или обломками средств ПВО. Пользователи принимают все риски активной военной зоны.</p>
            <p><b>EN.</b> Platform holds absolute legal immunity for any injury, asset loss or death caused by active hostilities, missile strikes (direct/indirect), kamikaze UAV ("Shahed"), artillery/mortar fire or air-defence debris. Users assume all active war-zone risks.</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-sm font-black uppercase tracking-wide text-primary">{title}</h3>
      <div className="space-y-2 text-xs text-foreground/90">{children}</div>
    </section>
  );
}
