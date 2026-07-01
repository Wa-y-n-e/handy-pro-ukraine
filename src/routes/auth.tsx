import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, UserRound, Wrench } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"client" | "master">("client");
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      toast.error("Не вдалось увійти через Google");
      setLoading(false);
      return;
    }
    if (!r.redirected) navigate({ to: "/" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (tab === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .limit(1)
          .maybeSingle();
        if (roleRow?.role === "master") {
          toast.info("Заповніть профіль і локацію, щоб з’явитися на карті");
          navigate({ to: "/profile" });
        } else {
          toast.info("Оберіть послугу на Головній або знайдіть майстра на Карті");
          navigate({ to: "/" });
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name, role },
        },
      });
      if (error) toast.error(error.message);
      else {
        toast.success(
          role === "master"
            ? "Після входу заповніть Профіль і локацію на Карті"
            : "Після входу відкрийте Головну або Карту",
        );
        setTab("signin");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-gradient-to-b from-primary/10 to-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Handy Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">Майстер поруч.</p>
        </div>

        <div className="rounded-2xl border bg-card shadow-lg p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Увійти</TabsTrigger>
              <TabsTrigger value="signup">Реєстрація</TabsTrigger>
            </TabsList>

            <form onSubmit={onSubmit} className="space-y-3 mt-4">
              {tab === "signup" && (
                <>
                  <Input
                    placeholder="Ім'я"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <div className="grid gap-2" role="group" aria-label="Оберіть роль">
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      aria-pressed={role === "client"}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition ${role === "client" ? "border-primary bg-primary/10" : "border-muted"}`}
                    >
                      <UserRound className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span>
                        <span className="block text-sm font-semibold">Я клієнт</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Хочу знайти майстра
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("master")}
                      aria-pressed={role === "master"}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition ${role === "master" ? "border-primary bg-primary/10" : "border-muted"}`}
                    >
                      <Wrench className="mt-0.5 size-5 shrink-0 text-primary" />
                      <span>
                        <span className="block text-sm font-semibold">Я майстер</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Хочу отримувати замовлення й бути на карті
                        </span>
                      </span>
                    </button>
                  </div>
                </>
              )}
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Пароль (мін. 6 символів)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : tab === "signin" ? (
                  "Увійти"
                ) : (
                  "Створити акаунт"
                )}
              </Button>
            </form>
          </Tabs>

          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> або <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={onGoogle}
            disabled={loading}
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
              />
            </svg>
            Увійти через Google
          </Button>
        </div>

        <div className="mt-4 rounded-lg border bg-muted/35 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Клієнт:</strong> Головна → Карта → профіль або чат.
          </p>
          <p className="mt-1">
            <strong className="text-foreground">Майстер:</strong> Профіль → категорії → локація на
            Карті → доступність.
          </p>
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-6">
          Реєструючись, ви приймаєте умови сервісу. Handy Pro — інформаційний посередник між
          замовниками та виконавцями.
        </p>
      </div>
    </div>
  );
}
