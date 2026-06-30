import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { COMMISSION, INSTANT_PAYOUT_FEE } from "@/lib/handy";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Wallet, TrendingDown, ArrowDownToLine, AlertCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({ component: OrdersPage });

interface Order {
  id: string;
  status: string;
  price: number | null;
  address: string | null;
  payment_method: string;
  escrow_status: string;
  created_at: string;
  client_id: string;
  master_id: string | null;
  category_slug: string | null;
}

function OrdersPage() {
  const { profile, role } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from("orders")
        .select("*")
        .or(`client_id.eq.${profile.id},master_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const balance = profile?.wallet_balance ?? 0;
  const inDebt = balance < 0;
  const banned = balance < -400;

  const instantWithdraw = async () => {
    if (!profile || balance <= 0) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("wallet_instant_withdraw");
    if (error) {
      toast.error(error.message);
    } else {
      const row = Array.isArray(data) ? data[0] : data;
      toast.success(`Виведено ${Number(row?.payout ?? 0).toFixed(2)} ₴ (комісія ${Number(row?.fee ?? 0).toFixed(2)} ₴)`);
    }
    setBusy(false);
  };

  const topUp = async (amount: number) => {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.rpc("wallet_topup", { p_amount: amount });
    if (error) toast.error(error.message);
    else toast.success(`Поповнено на ${amount} ₴`);
    setBusy(false);
  };

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      <h1 className="text-2xl font-bold">Замовлення та гаманець</h1>

      {role === "master" && (
        <div className={`rounded-2xl border p-4 shadow-sm ${banned ? "border-red-400 bg-red-50 dark:bg-red-950/30" : inDebt ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30" : "bg-card"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="size-4" /> Гаманець майстра
          </div>
          <div className={`text-3xl font-bold mt-1 ${inDebt ? "text-red-600 dark:text-red-400" : "text-primary"}`}>
            {balance.toFixed(2)} ₴
          </div>
          {banned && (
            <div className="mt-2 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>Борг більше 400 ₴. Ваш профіль автоматично прихований з мапи. Поповніть рахунок, щоб продовжити отримувати замовлення.</span>
            </div>
          )}
          {inDebt && !banned && (
            <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">Борг по комісії за готівкові замовлення.</p>
          )}
          {!inDebt && (
            <p className="text-xs text-muted-foreground mt-1">
              Виплата щоп'ятниці безкоштовно або миттєво з комісією {(INSTANT_PAYOUT_FEE * 100)}%
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button size="sm" variant="outline" disabled={busy || balance <= 0} onClick={instantWithdraw}>
              <ArrowDownToLine className="size-4" /> Вивести миттєво
            </Button>
            <Button size="sm" disabled={busy} onClick={() => topUp(Math.max(500, -balance))}>
              Поповнити {Math.max(500, Math.ceil(-balance))} ₴
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="active">Активні</TabsTrigger>
          <TabsTrigger value="history">Історія</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-2 mt-3">
          {loading ? <Loader2 className="size-5 animate-spin mx-auto mt-6 text-primary" /> :
            orders.filter((o) => !["completed", "cancelled"].includes(o.status)).length === 0 ? (
              <EmptyState text="Поки що немає активних замовлень" />
            ) : (
              orders.filter((o) => !["completed", "cancelled"].includes(o.status)).map((o) => (
                <OrderCard key={o.id} o={o} />
              ))
            )}
        </TabsContent>
        <TabsContent value="history" className="space-y-2 mt-3">
          {orders.filter((o) => ["completed", "cancelled"].includes(o.status)).length === 0 ? (
            <EmptyState text="Історія порожня" />
          ) : (
            orders.filter((o) => ["completed", "cancelled"].includes(o.status)).map((o) => <OrderCard key={o.id} o={o} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-sm text-muted-foreground">
      <TrendingDown className="size-10 mx-auto opacity-30 mb-2" />
      {text}
    </div>
  );
}

function OrderCard({ o }: { o: Order }) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-blue-100 text-blue-800",
    enroute: "bg-indigo-100 text-indigo-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-emerald-100 text-emerald-800",
    disputed: "bg-red-100 text-red-800",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <Link to="/chats" className="block rounded-xl border bg-card p-3 hover:border-primary/40">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[o.status] ?? "bg-muted"}`}>{o.status}</span>
            <span className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("uk")}</span>
          </div>
          <p className="text-sm font-medium mt-1 truncate">{o.address ?? "Адреса не вказана"}</p>
          {o.price && <p className="text-xs text-muted-foreground mt-0.5">{o.price} ₴ · {o.payment_method === "cash" ? "Готівка" : "Картка"} · ескроу {o.escrow_status}</p>}
        </div>
        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}
