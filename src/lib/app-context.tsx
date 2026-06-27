import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang } from "./i18n";

export type Role = "client" | "master";
export type Availability = "online" | "busy" | "offline";
export type OrderStatus = "pending" | "enroute" | "in_progress" | "completed" | "dispute";
export type PaymentMethod = "escrow" | "cash";

export interface MasterProfile {
  id: string;
  name: string;
  photo?: string;
  rating: number;
  jobs: number;
  categories: string[];
  distanceKm: number;
  availability: Availability;
}

export interface ChatMessage {
  id: string;
  from: "client" | "master" | "system";
  text?: string;
  offerPrice?: number;
  at: number;
}

export interface Order {
  id: string;
  masterId: string;
  status: OrderStatus;
  price?: number;
  payment?: PaymentMethod;
  escrowHeld?: boolean;
  category?: string;
  createdAt: number;
}

export interface User {
  role: Role;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  categories?: string[];
  wallet: number;
  rating: number;
  completed: number;
}

interface SosState {
  active: boolean;
  acceptedBy?: string;
  startedAt?: number;
}

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  role: Role;
  setRole: (r: Role) => void;
  user: User;
  setUser: (u: Partial<User>) => void;
  authed: boolean;
  signIn: (u: Partial<User> & { role: Role; name: string; email: string }) => void;
  signOut: () => void;

  availability: Availability;
  setAvailability: (a: Availability) => void;

  masters: MasterProfile[];
  filteredMasters: (q?: string) => MasterProfile[];

  sos: SosState;
  triggerSos: () => void;
  cancelSos: () => void;
  acceptSos: (masterId: string) => void;

  // chat / order
  order: Order | null;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  sendOffer: (price: number) => void;
  acceptOffer: (payment: PaymentMethod) => void;
  advanceOrder: () => void;
  openDispute: () => void;
  releaseEscrow: () => void;

  // location
  pinAddress: string;
  setPinAddress: (a: string) => void;
  pinCoord: { x: number; y: number };
  setPinCoord: (p: { x: number; y: number }) => void;

  // incoming emergency banner for master
  incomingEmergency: { id: string; address: string; category: string } | null;
  dismissEmergency: () => void;
}

const Ctx = createContext<AppState | null>(null);

const MOCK_MASTERS: MasterProfile[] = [
  { id: "m1", name: "Олег К.", rating: 4.9, jobs: 312, categories: ["electric", "appliance"], distanceKm: 1.2, availability: "online" },
  { id: "m2", name: "Андрій М.", rating: 4.8, jobs: 198, categories: ["plumb"], distanceKm: 2.4, availability: "online" },
  { id: "m3", name: "Ірина С.", rating: 5.0, jobs: 87, categories: ["clean"], distanceKm: 0.8, availability: "busy" },
  { id: "m4", name: "Віктор П.", rating: 4.7, jobs: 421, categories: ["lock", "carpenter"], distanceKm: 3.1, availability: "online" },
  { id: "m5", name: "Сергій Д.", rating: 4.6, jobs: 156, categories: ["ac", "appliance"], distanceKm: 4.5, availability: "offline" },
  { id: "m6", name: "Микола Г.", rating: 4.9, jobs: 263, categories: ["electric", "lock"], distanceKm: 1.9, availability: "online" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  const [role, setRole] = useState<Role>("client");
  const [authed, setAuthed] = useState(false);
  const [user, setUserState] = useState<User>({
    role: "client",
    name: "Гість",
    email: "",
    wallet: 1450,
    rating: 4.8,
    completed: 12,
  });
  const [availability, setAvailability] = useState<Availability>("online");
  const [masters, setMasters] = useState<MasterProfile[]>(MOCK_MASTERS);
  const [sos, setSos] = useState<SosState>({ active: false });
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "s1", from: "system", text: "Чат створено · Чат создан · Chat started", at: Date.now() - 60000 },
    { id: "m1", from: "master", text: "Добрий день! Готовий виїхати. У чому проблема?", at: Date.now() - 50000 },
  ]);
  const [pinAddress, setPinAddress] = useState("вул. Сумська, 25, Харків");
  const [pinCoord, setPinCoord] = useState({ x: 50, y: 50 });
  const [incomingEmergency, setIncomingEmergency] = useState<AppState["incomingEmergency"]>(null);

  const setUser = useCallback((u: Partial<User>) => {
    setUserState((prev) => ({ ...prev, ...u }));
  }, []);

  const signIn = useCallback((u: Partial<User> & { role: Role; name: string; email: string }) => {
    setUserState((prev) => ({ ...prev, ...u }));
    setRole(u.role);
    setAuthed(true);
  }, []);

  const signOut = useCallback(() => {
    setAuthed(false);
  }, []);

  // Keep user.role in sync with active role toggle (testing convenience)
  useEffect(() => {
    setUserState((prev) => ({ ...prev, role }));
  }, [role]);

  const filteredMasters = useCallback(
    (q?: string) => {
      const visible = masters.filter((m) => m.availability === "online");
      if (!q) return visible;
      const s = q.toLowerCase();
      return visible.filter(
        (m) => m.name.toLowerCase().includes(s) || m.categories.some((c) => c.includes(s)),
      );
    },
    [masters],
  );

  const triggerSos = useCallback(() => {
    setSos({ active: true, startedAt: Date.now() });
    // simulate broadcast to master side
    setIncomingEmergency({
      id: "sos-" + Date.now(),
      address: pinAddress,
      category: "electric",
    });
  }, [pinAddress]);

  const cancelSos = useCallback(() => {
    setSos({ active: false });
    setIncomingEmergency(null);
  }, []);

  const acceptSos = useCallback((masterId: string) => {
    setSos((s) => ({ ...s, acceptedBy: masterId }));
    setIncomingEmergency(null);
    setOrder({
      id: "o-" + Date.now(),
      masterId,
      status: "enroute",
      category: "electric",
      createdAt: Date.now(),
    });
  }, []);

  const dismissEmergency = useCallback(() => setIncomingEmergency(null), []);

  const sendMessage = useCallback((text: string) => {
    setMessages((m) => [
      ...m,
      { id: "msg-" + Date.now(), from: role, text, at: Date.now() },
    ]);
    // auto-reply from the other side
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: "msg-" + Date.now(),
          from: role === "client" ? "master" : "client",
          text: role === "client" ? "Прийняв, виїжджаю." : "Дякую, чекаю!",
          at: Date.now(),
        },
      ]);
    }, 900);
  }, [role]);

  const sendOffer = useCallback((price: number) => {
    setMessages((m) => [
      ...m,
      { id: "off-" + Date.now(), from: "master", offerPrice: price, at: Date.now() },
    ]);
    setOrder((o) =>
      o ?? {
        id: "o-" + Date.now(),
        masterId: "m1",
        status: "pending",
        price,
        createdAt: Date.now(),
      },
    );
  }, []);

  const acceptOffer = useCallback((payment: PaymentMethod) => {
    setOrder((o) => {
      const base: Order = o ?? {
        id: "o-" + Date.now(),
        masterId: "m1",
        status: "pending",
        createdAt: Date.now(),
      };
      return { ...base, payment, escrowHeld: payment === "escrow", status: "enroute" };
    });
    setMessages((m) => [
      ...m,
      {
        id: "sys-" + Date.now(),
        from: "system",
        text:
          payment === "escrow"
            ? "💳 Кошти заморожені у безпечному Escrow"
            : "💵 Готівковий розрахунок підтверджено",
        at: Date.now(),
      },
    ]);
  }, []);

  const advanceOrder = useCallback(() => {
    setOrder((o) => {
      if (!o) return o;
      const flow: OrderStatus[] = ["pending", "enroute", "in_progress", "completed"];
      const idx = flow.indexOf(o.status);
      if (idx < 0 || idx >= flow.length - 1) return o;
      return { ...o, status: flow[idx + 1] };
    });
  }, []);

  const openDispute = useCallback(() => {
    setOrder((o) => (o ? { ...o, status: "dispute", escrowHeld: true } : o));
    setMessages((m) => [
      ...m,
      { id: "sys-" + Date.now(), from: "system", text: "⚠️ Відкрито спір — модератор підключиться", at: Date.now() },
    ]);
  }, []);

  const releaseEscrow = useCallback(() => {
    setOrder((o) => (o ? { ...o, escrowHeld: false, status: "completed" } : o));
    setMessages((m) => [
      ...m,
      { id: "sys-" + Date.now(), from: "system", text: "✅ Кошти передані майстру. Дякуємо!", at: Date.now() },
    ]);
    setUserState((u) => ({ ...u, completed: u.completed + 1 }));
  }, []);

  // master availability affects search visibility
  useEffect(() => {
    if (role === "master") {
      setMasters((ms) =>
        ms.map((m, i) => (i === 0 ? { ...m, availability } : m)),
      );
    }
  }, [availability, role]);

  const value: AppState = useMemo(
    () => ({
      lang,
      setLang,
      role,
      setRole,
      user,
      setUser,
      authed,
      signIn,
      signOut,
      availability,
      setAvailability,
      masters,
      filteredMasters,
      sos,
      triggerSos,
      cancelSos,
      acceptSos,
      order,
      messages,
      sendMessage,
      sendOffer,
      acceptOffer,
      advanceOrder,
      openDispute,
      releaseEscrow,
      pinAddress,
      setPinAddress,
      pinCoord,
      setPinCoord,
      incomingEmergency,
      dismissEmergency,
    }),
    [
      lang, role, user, authed, availability, masters, filteredMasters,
      sos, order, messages, pinAddress, pinCoord, incomingEmergency,
      setUser, signIn, signOut, triggerSos, cancelSos, acceptSos,
      sendMessage, sendOffer, acceptOffer, advanceOrder, openDispute, releaseEscrow, dismissEmergency,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
