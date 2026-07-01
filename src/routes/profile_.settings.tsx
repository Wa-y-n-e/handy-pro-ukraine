import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useSession, type Role } from "@/lib/use-session";
import {
  isLanguagePreference,
  useLanguagePreference,
  useSimplifiedModePreference,
} from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Languages,
  Loader2,
  LogOut,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile_/settings")({
  component: ProfileSettingsPage,
});

const DELETE_ACCOUNT_NOTE =
  "[delete_account] Користувач просить видалити акаунт.";
const ISSUE_MIN_LENGTH = 10;
const ISSUE_MAX_LENGTH = 1000;

function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user, profile, role, loading } = useSession();
  const [language, setLanguage] = useLanguagePreference();
  const [simplifiedMode, setSimplifiedMode] = useSimplifiedModePreference();
  const [issue, setIssue] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (loading || !user || !role) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const submitSupportRequest = async (note: string) => {
    const request: Database["public"]["Tables"]["support_requests"]["Insert"] = {
      created_by: user.id,
      kind: "callback",
      duration_seconds: null,
      note,
    };
    const { error } = await supabase.from("support_requests").insert(request);
    return error;
  };

  const submitDeleteRequest = async () => {
    setSubmittingDelete(true);
    const error = await submitSupportRequest(DELETE_ACCOUNT_NOTE);
    setSubmittingDelete(false);
    if (error) {
      toast.error("Не вдалося надіслати запит на видалення");
      return;
    }
    setDeleteDialogOpen(false);
    toast.success("Запит на видалення акаунта надіслано");
  };

  const submitProblem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanIssue = issue.trim();
    if (cleanIssue.length < ISSUE_MIN_LENGTH) {
      toast.error(`Опишіть проблему щонайменше ${ISSUE_MIN_LENGTH} символами`);
      return;
    }

    setSubmittingIssue(true);
    const error = await submitSupportRequest(`[beta_issue] ${cleanIssue}`);
    setSubmittingIssue(false);
    if (error) {
      toast.error("Не вдалося надіслати повідомлення");
      return;
    }
    setIssue("");
    toast.success("Повідомлення надіслано команді beta-тесту");
  };

  const signOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      toast.error("Не вдалося вийти з акаунта");
    }
  };

  return (
    <div className="px-4 pb-8 pt-4">
      <header className="flex min-h-11 items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => navigate({ to: "/profile" })}
          aria-label="Назад до профілю"
          title="Назад до профілю"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">Налаштування</h1>
          <p className="text-xs text-muted-foreground">Особисті параметри beta-версії</p>
        </div>
        <Settings className="size-5 text-primary" aria-hidden="true" />
      </header>

      <section className="mt-4 border-y py-4" aria-labelledby="account-title">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id="account-title" className="text-sm font-semibold">
              Акаунт
            </h2>
            <p className="mt-1 break-all text-sm">{user.email ?? "Email не вказано"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Роль: {roleLabel(role)}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold">Handy Pro Beta</h2>
            <p className="mt-1 text-xs leading-relaxed">
              Це тестова версія для ранніх користувачів. Можливі помилки та зміни у
              роботі окремих функцій.
            </p>
          </div>
        </div>
      </section>

      {role === "master" && (
        <section className="mt-4 rounded-lg border-l-4 border-l-primary bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Підказки для майстра</h2>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li>
              Щоб вас бачили на карті, заповніть профіль, категорії, локацію та
              увімкніть доступність.
            </li>
            <li>Координати оновлюються у вкладці «Карта».</li>
          </ul>
          {profile && profile.wallet_balance <= -400 && (
            <div className="mt-3 flex items-start gap-2 text-xs font-medium text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Профіль може бути недоступним для нових замовлень через обмеження акаунта.
            </div>
          )}
        </section>
      )}

      <div className="mt-2 divide-y">
        <SettingsSection icon={Languages} title="Мова">
          <Select
            value={language}
            onValueChange={(value) => {
              if (isLanguagePreference(value)) setLanguage(value);
            }}
          >
            <SelectTrigger aria-label="Оберіть мову" className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ua">Українська</SelectItem>
              <SelectItem value="ru">Російська — незабаром</SelectItem>
              <SelectItem value="en">English — незабаром</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Ми зберігаємо вибір на цьому пристрої. Повний переклад ще не готовий,
            тому інтерфейс залишається українською.
          </p>
        </SettingsSection>

        <SettingsSection icon={Sparkles} title="Спрощений режим">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Великі основні дії на Головній</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Налаштування діє на цьому пристрої.
              </p>
            </div>
            <Switch
              checked={simplifiedMode}
              onCheckedChange={setSimplifiedMode}
              aria-label="Спрощений режим"
            />
          </div>
        </SettingsSection>

        <SettingsSection icon={FileText} title="Угоди та правила">
          <Accordion type="single" collapsible>
            <AccordionItem value="terms">
              <AccordionTrigger>Умови користування</AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                Handy Pro з’єднує клієнтів і майстрів. Beta-версія може ще не
                містити всіх процесів майбутнього сервісу. Остаточні юридичні тексти
                мають пройти окрему перевірку до запуску у production.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger>Політика конфіденційності</AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                Не передавайте зайві чутливі дані у профілі, чатах або зверненнях.
                У beta-версії слід надсилати лише інформацію, потрібну для перевірки
                функції чи вирішення конкретної проблеми.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="beta" className="border-b-0">
              <AccordionTrigger>Правила beta-тесту</AccordionTrigger>
              <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                У тестовій версії можливі помилки. Реальний еквайринг і платежі ще
                не запущені. Beta не заявляє про страхування, повну перевірку особи
                чи гарантоване вирішення спорів.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SettingsSection>

        <SettingsSection icon={MessageSquareWarning} title="Повідомити про проблему">
          <form onSubmit={submitProblem} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="beta-issue">Коротко опишіть, що сталося</Label>
              <Textarea
                id="beta-issue"
                value={issue}
                onChange={(event) => setIssue(event.target.value)}
                minLength={ISSUE_MIN_LENGTH}
                maxLength={ISSUE_MAX_LENGTH}
                rows={4}
                placeholder="Наприклад: кнопка не реагує після…"
              />
              <div className="flex justify-between gap-3 text-[11px] text-muted-foreground">
                <span>Не додавайте паролі, адресу чи дані з чатів.</span>
                <span className="shrink-0">{issue.length}/{ISSUE_MAX_LENGTH}</span>
              </div>
            </div>
            <Button type="submit" disabled={submittingIssue} className="w-full">
              {submittingIssue && <Loader2 className="size-4 animate-spin" />}
              Надіслати
            </Button>
          </form>
        </SettingsSection>

        <SettingsSection icon={Trash2} title="Видалити акаунт">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Ми надішлемо запит команді підтримки. Акаунт і дані не видаляються
            миттєво: запит буде опрацьовано пізніше адміністратором.
          </p>
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              if (!submittingDelete) setDeleteDialogOpen(open);
            }}
          >
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="mt-3 w-full text-destructive">
                <Trash2 className="size-4" /> Надіслати запит на видалення
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100%-2rem)] rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Підтвердити запит?</AlertDialogTitle>
                <AlertDialogDescription>
                  Це лише заявка до підтримки. Вона не видалить акаунт, профіль,
                  замовлення, чати чи відгуки автоматично.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submittingDelete}>Скасувати</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={submitDeleteRequest}
                  disabled={submittingDelete}
                >
                  {submittingDelete && <Loader2 className="size-4 animate-spin" />}
                  Надіслати запит
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsSection>

        <SettingsSection icon={LogOut} title="Вихід">
          <Button
            type="button"
            variant="outline"
            onClick={signOut}
            disabled={signingOut}
            className="w-full"
          >
            {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Вийти з акаунта
          </Button>
        </SettingsSection>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Налаштування доступні лише власнику акаунта після входу.
      </p>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function roleLabel(role: Role): string {
  if (role === "master") return "Майстер";
  if (role === "admin") return "Адміністратор";
  return "Клієнт";
}
