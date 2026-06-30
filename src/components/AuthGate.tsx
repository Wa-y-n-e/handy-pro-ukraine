import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSession } from "@/lib/use-session";
import { Loader2 } from "lucide-react";

const PUBLIC = new Set(["/auth"]);

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user && !PUBLIC.has(pathname)) navigate({ to: "/auth", replace: true });
    if (user && pathname === "/auth") navigate({ to: "/", replace: true });
  }, [user, loading, pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
