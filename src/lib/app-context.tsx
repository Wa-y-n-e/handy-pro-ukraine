import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Lang, ViewMode } from "./i18n";

export type Role = "client" | "master";
export type OrderStatus = "pending" | "frozen" | "enroute" | "in_progress" | "completed" | "dispute";

export interface ChatMsg {
  id: string;
  from: "client" | "master" | "system";
  text?: string;
  offerPrice?: number;
  media?: string; // emoji/image url placeholder
  at: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  price?: number;
  address: string;
  category: string;
  createdAt: number;
}

export interface MasterApplication {
  id: string;
  name: string;
  trade: string;
  idPhoto: string;
  selfie: string;
}

export interface DisputeCase {
  id: string;
  client: string;
  master: string;
  amount: number;
  reason: string;
  transcript: { from: string; text: string }[];
  photos: string[];
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;

  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;

  // auth
  authed: boolean;
  phone: string;
  setPhone: (p: string) => void;
  legalAccepted: boolean;
  setLegalAccepted: (b: boolean) => void;
  otpSent: boolean;
  sendOtp: () => void;
  verifyOtp: (code: string) => boolean;
  signOut: () => void;

  // master availability (uncle tolya)
  masterActive: boolean;
  setMasterActive: (b: boolean) => void;
  masterTrades: string[];
  toggleTrade: (t: string) => void;
  masterPortfolio: string[];
  addPortfolioPhoto: (src: string) => void;

  // order / chat
  order: Order;
  messages: ChatMsg[];
  sendMessage: (text: string, media?: string) => void;
  sendOffer: (price: number) => void;
  acceptOffer: () => void;
  advanceOrder: () => void;
  openDispute: () => void;
  setOrderStatus: (s: OrderStatus) => void;

  // anti-EW map
  antiEW: boolean;
  setAntiEW: (b: boolean) => void;
  pinAddress: string;
  setPinAddress: (a: string) => void;
  pinXY: { x: number; y: number };
  setPinXY: (p: { x: number; y: number }) => void;

  // offline gsm fallback
  offline: boolean;
  setOffline: (b: boolean) => void;

  // support hub
  supportOpen: boolean;
  setSupportOpen: (b: boolean) => void;
  legalOpen: boolean;
  setLegalOpen: (b: boolean) => void;

  // rating modal
  ratingOpen: boolean;
  setRatingOpen: (b: boolean) => void;

  // pay sheet
  paySheetOpen: boolean;
  setPaySheetOpen: (b: boolean) => void;

  // admin data
  liveJobsCount: number;
  operatorsOnline: number;
  cashVolume: number;
  registrationQueue: MasterApplication[];
  approveMaster: (id: string) => void;
  rejectMaster: (id: string) => void;
  disputes: DisputeCase[];
  resolveDispute: (id: string, to: "master" | "client") => void;
}

const Ctx = createContext<AppState | null>(null);

const SEED_QUEUE: MasterApplication[] = [
  { id: "a1", name: "Анатолій П.", trade: "Електрика", idPhoto: "🪪", selfie: "👨‍🔧" },
  { id: "a2", name: "Володимир С.", trade: "Сантехніка", idPhoto: "🪪", selfie: "🧔" },
  { id: "a3", name: "Микола Д.", trade: "Дрібний ремонт", idPhoto: "🪪", selfie: "👴" },
];

const SEED_DISPUTES: DisputeCase[] = [
  {
    id: "d1",
    client: "Ірина К. (+380 ******27)",
    master: "Олег Т. (+380 ******11)",
    amount: 1800,
    reason: "Робота виконана неякісно",
    transcript: [
      { from: "client", text: "Здравствуйте, протекает кран" },
      { from: "master", text: "Виїжджаю, буду за 20 хв" },
      { from: "master", text: "Готово, перевіряйте" },
      { from: "client", text: "Снова течет через час!" },
    ],
    photos: ["🚿", "💧", "🔧"],
  },
  {
    id: "d2",
    client: "Сергій Б. (+380 ******94)",
    master: "Андрій Л. (+380 ******02)",
    amount: 950,
    reason: "Клієнт не приймає роботу",
    transcript: [
      { from: "client", text: "Замок не вертится" },
      { from: "master", text: "Замінив особисто, працює" },
      { from: "client", text: "Не нравится цвет ручки" },
    ],
    photos: ["🔑", "🚪"],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const [viewMode, setViewMode] = useState<ViewMode>("client");

  const [authed, setAuthed] = useState(false);
  const [phone, setPhone] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [masterActive, setMasterActive] = useState(true);
  const [masterTrades, setMasterTrades] = useState<string[]>(["tradeElectric", "tradeHome"]);
  const [masterPortfolio, setMasterPortfolio] = useState<string[]>([]);

  const [order, setOrder] = useState<Order>({
    id: "o1",
    status: "pending",
    address: "вул. Сумська, 25, Харків",
    category: "electric",
    createdAt: Date.now(),
  });
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "s1", from: "system", text: "Чат створено · Chat started", at: Date.now() - 90000 },
    { id: "c1", from: "client", text: "Здравствуйте! Не работает розетка на кухне.", at: Date.now() - 60000 },
    { id: "m1", from: "master", text: "Доброго дня! Виїжджаю, буду за 25 хв.", at: Date.now() - 40000 },
  ]);

  const [antiEW, setAntiEW] = useState(false);
  const [pinAddress, setPinAddress] = useState("вул. Сумська, 25, Харків");
  const [pinXY, setPinXY] = useState({ x: 50, y: 50 });

  const [offline, setOffline] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [paySheetOpen, setPaySheetOpen] = useState(false);

  const [registrationQueue, setRegistrationQueue] = useState<MasterApplication[]>(SEED_QUEUE);
  const [disputes, setDisputes] = useState<DisputeCase[]>(SEED_DISPUTES);

  const sendOtp = useCallback(() => setOtpSent(true), []);
  const verifyOtp = useCallback((code: string) => {
    if (code.length === 6) {
      setAuthed(true);
      return true;
    }
    return false;
  }, []);
  const signOut = useCallback(() => {
    setAuthed(false);
    setOtpSent(false);
    setPhone("");
    setLegalAccepted(false);
  }, []);

  const toggleTrade = useCallback((t: string) => {
    setMasterTrades((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));
  }, []);

  const addPortfolioPhoto = useCallback((src: string) => {
    setMasterPortfolio((p) => [src, ...p].slice(0, 12));
  }, []);

  const sendMessage = useCallback((text: string, media?: string) => {
    if (!text.trim() && !media) return;
    const from: ChatMsg["from"] = viewMode === "master" ? "master" : "client";
    setMessages((m) => [...m, { id: "msg" + Date.now(), from, text: text || undefined, media, at: Date.now() }]);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: "msg" + Date.now() + "r",
          from: from === "client" ? "master" : "client",
          text: from === "client" ? "Прийняв, скоро буду" : "Дякую, чекаю",
          at: Date.now(),
        },
      ]);
    }, 800);
  }, [viewMode]);

  const sendOffer = useCallback((price: number) => {
    setMessages((m) => [...m, { id: "off" + Date.now(), from: "master", offerPrice: price, at: Date.now() }]);
    setOrder((o) => ({ ...o, price }));
  }, []);

  const acceptOffer = useCallback(() => {
    setPaySheetOpen(true);
  }, []);

  const advanceOrder = useCallback(() => {
    setOrder((o) => {
      const flow: OrderStatus[] = ["pending", "frozen", "enroute", "in_progress", "completed"];
      const i = flow.indexOf(o.status);
      if (i < 0 || i >= flow.length - 1) return o;
      const next = flow[i + 1];
      if (next === "completed") setTimeout(() => setRatingOpen(true), 400);
      return { ...o, status: next };
    });
  }, []);

  const openDispute = useCallback(() => {
    setOrder((o) => ({ ...o, status: "dispute" }));
    setMessages((m) => [
      ...m,
      { id: "sys" + Date.now(), from: "system", text: "⚠️ Відкрито спір — модератор підключиться", at: Date.now() },
    ]);
  }, []);

  const setOrderStatus = useCallback((s: OrderStatus) => setOrder((o) => ({ ...o, status: s })), []);

  const approveMaster = useCallback((id: string) => setRegistrationQueue((q) => q.filter((x) => x.id !== id)), []);
  const rejectMaster = useCallback((id: string) => setRegistrationQueue((q) => q.filter((x) => x.id !== id)), []);
  const resolveDispute = useCallback((id: string, _to: "master" | "client") => {
    setDisputes((d) => d.filter((x) => x.id !== id));
  }, []);

  // simulate offline ping
  useEffect(() => {
    if (!authed) return;
    const t = window.setTimeout(() => setOffline(false), 100);
    return () => window.clearTimeout(t);
  }, [authed]);

  const value: AppState = useMemo(
    () => ({
      lang, setLang, viewMode, setViewMode,
      authed, phone, setPhone, legalAccepted, setLegalAccepted, otpSent, sendOtp, verifyOtp, signOut,
      masterActive, setMasterActive, masterTrades, toggleTrade, masterPortfolio, addPortfolioPhoto,
      order, messages, sendMessage, sendOffer, acceptOffer, advanceOrder, openDispute, setOrderStatus,
      antiEW, setAntiEW, pinAddress, setPinAddress, pinXY, setPinXY,
      offline, setOffline,
      supportOpen, setSupportOpen, legalOpen, setLegalOpen, ratingOpen, setRatingOpen, paySheetOpen, setPaySheetOpen,
      liveJobsCount: 42, operatorsOnline: 138, cashVolume: 184500,
      registrationQueue, approveMaster, rejectMaster,
      disputes, resolveDispute,
    }),
    [
      lang, viewMode, authed, phone, legalAccepted, otpSent,
      masterActive, masterTrades, masterPortfolio,
      order, messages, antiEW, pinAddress, pinXY,
      offline, supportOpen, legalOpen, ratingOpen, paySheetOpen,
      registrationQueue, disputes,
      sendOtp, verifyOtp, signOut, toggleTrade, addPortfolioPhoto,
      sendMessage, sendOffer, acceptOffer, advanceOrder, openDispute, setOrderStatus,
      approveMaster, rejectMaster, resolveDispute,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
