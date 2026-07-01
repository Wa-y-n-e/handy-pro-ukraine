# Profile Settings Beta Hub Preflight Audit

Audit date: 2026-07-01

Audit branch base: `ca767abce0b9fa0d02fabe7c790c293bce6dc580` (`origin/main` at audit time).
The SHA supplied in the task, `248029abfaf241823f1960932d41cf77d75ebc31`, is an ancestor of
that commit. No application code or SQL was changed by this audit.

## 1. Current Profile structure

`src/routes/profile.tsx` serves both the signed-in user's profile and public profile views. The
optional `id` search parameter selects another profile; `isSelf` is true only when no `id` is
provided or the requested id matches the signed-in profile.

The page currently contains:

- a header with back navigation for public views, the profile title, and a role badge;
- a public identity/trust summary;
- a self-only master availability control;
- a self-only master profile editor;
- public master services with self-only service editing;
- master/client trust details;
- public master portfolio with self-only URL management;
- public reviews;
- a self-only account footer with the authenticated email and sign-out button.

The page loads the public projection through `get_public_profile`, then merges the private
`useSession()` profile only when `isSelf` is true. Master editing blocks require both `isSelf` and
`role === "master"`. Client self-profiles do not receive those master-only editors.

## 2. Recommended gear/settings button location

Add a self-only icon button to the right side of the existing Profile header, next to the role
badge. The button should use the Lucide `Settings` icon, an accessible Ukrainian label, and render
only when `isSelf` is true. It must not appear on `/profile?id=<other-user>`.

For the Beta Hub, a small authenticated child route such as `/profile/settings` is preferable to
adding another bottom tab. This keeps the existing five-tab navigation unchanged, permits normal
back navigation, and keeps account actions out of the public profile layout.

## 3. Settings that are safe without migrations

### Sign out

The existing profile action calls `supabase.auth.signOut()`. The auth-state listener in
`useSession()` clears the user, and `AuthGate` redirects unauthenticated routes to `/auth`. The
settings page can reuse this flow with a busy state and visible error handling. The existing button
should be moved or intentionally retained, not duplicated with different behavior.

### Language preference

A validated `ua | ru | en` preference can be stored in `localStorage`, for example under
`handy-pro.language`, with `ua` as the default. Access must be browser-only because the app renders
through TanStack Start SSR.

`src/lib/i18n.ts` already defines language types and a dictionary, but it is not imported by the
current UI and most screen copy is hard-coded Ukrainian. The next PR may persist and display the
preference in Settings, but must not claim app-wide translation until screens actually consume it.

### Simplified mode

Home currently keeps simplified/grandma mode in component state (`useState(false)`), so it resets
when Home unmounts or the page reloads. A boolean `localStorage` value such as
`handy-pro.simplified-mode` can safely persist it. Home and Settings should share one small
browser-safe helper/hook so both controls stay consistent. No profile column is needed.

### Beta and legal text

Static beta status, app version, privacy summary, terms links, and the existing informational
intermediary wording need no database state. Legal text must remain accurate and must not introduce
unsupported security, payment, insurance, or verification claims.

### Problem report

An authenticated problem-report form can enqueue a support request after the generated types are
resynchronized. It should accept a short user-written note, avoid automatically attaching private
profile data, and show that a request was submitted rather than claiming the issue was resolved.

## 4. Can `support_requests` support the proposed requests?

The migration schema can queue both requests without a new migration, but only by using the
existing `kind` values:

| Use case | Safe MVP mapping | Limits |
| --- | --- | --- |
| Delete-account request | `kind = "callback"`, `duration_seconds = null`, note prefixed with a stable marker such as `[delete_account]` | This creates a support task only. It must not claim that deletion happened. |
| Beta issue report | `kind = "callback"`, `duration_seconds = null`, note prefixed with `[beta_issue]` | There is no dedicated issue category, severity, app version, or attachment field. |

Arbitrary values such as `delete_account` or `beta_issue` cannot be written to `kind`: the database
check constraint only accepts `voice` and `callback`. User inserts must set `created_by` to
`auth.uid()`. Owners can read their requests, administrators can read and update them, and ordinary
users cannot update or delete them under the final RLS policies.

This mapping is adequate for a small human-operated beta queue. It is not a durable typed workflow
for automated account deletion or issue triage.

## 5. Exact `support_requests` generated-type fields

**Current finding: `support_requests` is absent from
`src/integrations/supabase/types.ts`. Therefore no `Row`, `Insert`, `Update`, or relationship fields
are currently available from generated types.**

The committed migration defines the database columns as:

| Column | Database definition |
| --- | --- |
| `id` | `uuid`, primary key, default `gen_random_uuid()` |
| `created_by` | `uuid`, required, references `profiles(id)` with `ON DELETE CASCADE` |
| `kind` | `text`, required, constrained to `voice` or `callback` |
| `duration_seconds` | nullable `integer` |
| `note` | nullable `text` |
| `status` | `text`, required, default `new`, constrained to `new`, `in_progress`, or `closed` |
| `created_at` | `timestamptz`, required, default `now()` |

The existing Home insertion references this table, but the current generated contract does not
type it. Before the implementation PR, verify the linked remote Supabase schema and regenerate
`types.ts`. Do not work around the mismatch with `as never`, a broad `any`, or an invented local
table type. No migration is indicated if the remote table matches the committed migration.

## 6. Safe delete-account MVP recommendation

The next PR should implement **Request account deletion**, not client-side account deletion:

1. Explain that the request will be reviewed and that access/data are not deleted immediately.
2. Require an explicit confirmation before inserting the support request.
3. Insert an owner-scoped `support_requests` callback with a stable note marker.
4. Show a submission result or error; do not present the account as deleted.
5. Leave actual identity verification, auth disablement/deletion, PII anonymization, and retention
   handling to a later trusted server/admin workflow.

The `created_by` foreign key uses `ON DELETE CASCADE`, so deleting the profile first could also erase
the deletion request. That is another reason the Beta Hub must only queue the request.

## 7. Actions that must not run in the client

- Do not call Supabase admin APIs or directly delete the Auth user from browser code.
- Do not import `client.server.ts` or expose `SUPABASE_SERVICE_ROLE_KEY` to a route component.
- Do not delete the profile as a substitute for deleting the identity.
- Do not delete or cascade-delete orders, chats, messages, transactions, disputes, reviews, support
  requests, or other operational/audit records.
- Do not bypass RLS or generated types with `service_role`, `as never`, or broad casts.

Any future deletion processor must be a trusted server-side/admin workflow with identity
verification, an explicit retention policy, and anonymization rules that preserve operational
records where required.

## 8. Public/private data risks

- `useSession()` holds the owner's full profile, including phone, address, coordinates, and wallet
  balance. None of those values should be written to `localStorage` by Settings.
- Public profile data should continue to come from `get_public_profile`; its generated return type
  excludes phone, wallet balance, address, and coordinates.
- The private profile is merged into Profile state only for `isSelf`. New settings controls must use
  `isSelf` and authenticated identity, not merely `target.role`.
- The self-only email and account actions must never render when viewing another user's `id`.
- Problem-report notes may contain personal information. Keep them short, do not auto-attach auth
  tokens, coordinates, wallet data, chat content, or device secrets, and rely on owner/admin RLS.
- Language and simplified-mode keys are non-sensitive preferences. Keep them separate from Supabase
  auth storage and validate values read from the browser.
- The generated `profiles` table type contains private columns. Future UI code should not replace
  `get_public_profile` with a broad direct profile select.

## 9. Recommended scope for the next implementation PR

1. First verify remote Supabase and regenerate types so `support_requests` is typed; do not add SQL
   if the committed schema is already deployed.
2. Add a self-only gear icon in the Profile header and a mobile-first `/profile/settings` route.
3. Add local-only language and simplified-mode preferences with Ukrainian defaults and SSR-safe
   storage access.
4. Make Home consume the shared simplified-mode preference without redesigning Home.
5. Move or reuse sign out with loading and error feedback.
6. Add static beta/legal information.
7. Add a small problem-report form and deletion-request confirmation that only insert typed
   `support_requests` callback rows.
8. Preserve the existing five tabs and all current public/master/client profile behavior.

Out of scope: actual account deletion, admin processing UI, service-role calls, record deletion,
new support taxonomy, attachments, full-app translation, migrations, payments, 2FA, and profile
redesign.

## 10. Validation status

- `npm run build`: passed.
- `npm run lint`: passed with 0 errors and 6 existing Fast Refresh warnings.

## 11. Remaining risks

- The repository's generated Supabase types are stale relative to committed migrations:
  `support_requests` is missing, and this audit did not verify the linked remote project.
- The proposed callback/note markers are human-operated conventions, not database-enforced request
  categories.
- Current support-request RLS has no per-user rate limit; the UI can debounce and disable duplicate
  submits, but server-side abuse controls remain future work.
- Current language infrastructure is unused by screens, so persisting a language preference alone
  does not translate the application.
- Sign-out currently relies on the auth listener/AuthGate redirect and does not show an error when
  `signOut()` fails.
- No authenticated browser smoke test was performed as part of this documentation-only audit.
