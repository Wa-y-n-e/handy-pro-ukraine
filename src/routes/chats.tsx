import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { Loader2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/chats")({ component: ChatsPage });

interface ChatRow {
  id: string;
  client_id: string;
  master_id: string;
  dispute_active: boolean;
  created_at: string;
  client: { full_name: string | null; avatar_url: string | null } | null;
  master: { full_name: string | null; avatar_url: string | null } | null;
  last?: { body: string | null; created_at: string } | null;
}

function ChatsPage() {
  const { profile } = useSession();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("chats")
        .select("id, client_id, master_id, dispute_active, created_at, client:profiles!chats_client_id_fkey(full_name, avatar_url), master:profiles!chats_master_id_fkey(full_name, avatar_url)")
        .or(`client_id.eq.${profile.id},master_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });
      setChats((data as unknown as ChatRow[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center pt-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="px-4 pt-5">
      <h1 className="text-2xl font-bold mb-4">Чати</h1>
      {chats.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle className="size-12 mx-auto opacity-30 mb-2" />
          <p>Поки що немає чатів</p>
          <p className="text-xs mt-1">Знайдіть майстра на карті, щоб почати</p>
        </div>
      ) : (
        <div className="space-y-1">
          {chats.map((c) => {
            const other = profile?.id === c.client_id ? c.master : c.client;
            return (
              <Link key={c.id} to="/chats/$id" params={{ id: c.id }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent">
                <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center text-xl shrink-0">
                  {other?.avatar_url ? <img src={other.avatar_url} alt="" className="size-full rounded-full object-cover" /> : "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{other?.full_name ?? "Користувач"}</p>
                    {c.dispute_active && <span className="text-[10px] font-bold text-red-600">⚠️ СПІР</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Натисніть, щоб відкрити чат</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
