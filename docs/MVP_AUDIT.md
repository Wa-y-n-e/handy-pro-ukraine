# Handy Pro MVP Supabase Contract Audit

Audit scope: frontend Supabase usage under `src/`, generated contracts in
`src/integrations/supabase/types.ts`, route declarations in `src/routeTree.gen.ts`, and
repository migrations under `supabase/migrations/`.

Audit base: `main` at `9d8b78d`. This document is repository-only evidence; it does not prove
that every committed migration has been applied to the linked remote Supabase project.

## 1. Validation Results

### Build

- Command: `npm run build`
- Result: **PASS**
- Vite completed the client, SSR, and Nitro/Cloudflare production builds.
- Non-blocking warning: Vite reports that `vite-tsconfig-paths` is redundant because Vite now
  supports native TypeScript path resolution.

### Lint

- Command: `npm run lint`
- Result on the audited `main`: **FAIL (pre-existing configuration/formatting issue)**
- Summary: `6267 problems (6261 errors, 6 warnings)`.
- The errors are overwhelmingly `prettier/prettier` line-ending complaints (`Delete CR`) caused
  by CRLF checkout behavior and legacy formatting differences, not by this documentation change.
- The six warnings are existing `react-refresh/only-export-components` warnings in shared UI
  primitives.
- Draft PR #1 (`codex/stabilize-lint-windows`) addresses the lint configuration but was not merged
  into `main` when this audit branch was created.

## 2. Current Routes

`src/routeTree.gen.ts` declares seven routes:

| Route        | Purpose               | Navigation status         |
| ------------ | --------------------- | ------------------------- |
| `/`          | Home                  | Bottom tab 1              |
| `/map`       | Leaflet map           | Bottom tab 2              |
| `/orders`    | Orders and wallet     | Bottom tab 3              |
| `/chats`     | Chat list             | Bottom tab 4              |
| `/profile`   | Client/master profile | Bottom tab 5              |
| `/auth`      | Authentication        | Outside bottom navigation |
| `/chats/$id` | Individual chat room  | Detail route              |

The required five-tab mobile route structure is present and unchanged.

## 3. RPC Functions Used by the Frontend

The complete unique list from every `supabase.rpc(...)` call under `src/` is:

| RPC                       | Frontend call site(s)                                | In generated types? | Repository migration evidence                                                                                                   |
| ------------------------- | ---------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `accept_cash_offer`       | `src/routes/chats.$id.tsx`                           | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `complete_order`          | `src/routes/orders.tsx`                              | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `get_available_masters`   | `src/routes/map.tsx`                                 | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `get_my_profile`          | `src/lib/use-session.ts`                             | Yes                 | Defined in `20260630064656_23cd8fbf-29b3-4695-b43e-981fc252ccbc.sql`                                                            |
| `get_public_profile`      | `src/routes/chats.$id.tsx`, `src/routes/profile.tsx` | Yes                 | Defined/replaced in `20260630100039_16a17b27-77c4-423b-b16c-ba5f49589480.sql` and `20260630123000_complete_handy_pro_flows.sql` |
| `leave_order_review`      | `src/routes/orders.tsx`                              | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `mark_chat_read`          | `src/routes/chats.$id.tsx`                           | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `pay_escrow_hold`         | `src/routes/chats.$id.tsx`                           | Yes                 | Defined/replaced in `20260630064608_c376a4db-df78-4154-a248-f35ca10c0c3e.sql` and `20260630123000_complete_handy_pro_flows.sql` |
| `resolve_dispute`         | `src/routes/chats.$id.tsx`                           | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `start_order`             | `src/routes/orders.tsx`                              | **No**              | Defined in `20260630123000_complete_handy_pro_flows.sql`                                                                        |
| `wallet_instant_withdraw` | `src/routes/orders.tsx`                              | Yes                 | Defined in `20260630064608_c376a4db-df78-4154-a248-f35ca10c0c3e.sql`                                                            |
| `wallet_topup`            | `src/routes/orders.tsx`                              | Yes                 | Defined in `20260630064608_c376a4db-df78-4154-a248-f35ca10c0c3e.sql`                                                            |

Totals:

- Unique RPCs used by the frontend: **12**.
- Used RPCs present in generated types: **5**.
- Used RPCs missing from generated types: **7**.

## 4. RPC Functions Present in Supabase Types

`Database["public"]["Functions"]` currently contains:

1. `get_my_profile` (used by frontend)
2. `get_public_profile` (used by frontend)
3. `has_role` (not called directly by frontend; used by database security logic)
4. `pay_escrow_hold` (used by frontend)
5. `wallet_instant_withdraw` (used by frontend)
6. `wallet_topup` (used by frontend)

`get_public_profile` is present in the generated types, but frontend callers still cast the RPC
name and arguments with `as never`. That cast is no longer justified by the current generated
contract and hides future signature drift.

## 5. RPC Functions Missing from Supabase Types

The following frontend RPCs are missing from `types.ts`:

1. `accept_cash_offer`
2. `complete_order`
3. `get_available_masters`
4. `leave_order_review`
5. `mark_chat_read`
6. `resolve_dispute`
7. `start_order`

All seven are defined in the committed migration
`20260630123000_complete_handy_pro_flows.sql`. Therefore the immediate finding is **stale generated
types and/or an unverified remote migration state**, not missing SQL source. Frontend calls use
`as never` to bypass the missing contracts, so TypeScript cannot validate their argument or return
shapes.

## 6. Tables Used by the Frontend

The complete unique list from every `supabase.from(...)` call under `src/` is:

1. `categories`
2. `chats`
3. `disputes`
4. `messages`
5. `orders`
6. `portfolio_photos`
7. `profiles`
8. `reviews`
9. `subcategories`
10. `support_requests`
11. `user_roles`

No dynamic table-name expression was found in a frontend `supabase.from(...)` call.

## 7. Tables Present in Supabase Types

`Database["public"]["Tables"]` currently contains:

1. `categories`
2. `chats`
3. `disputes`
4. `master_subcategories`
5. `messages`
6. `orders`
7. `portfolio_photos`
8. `profiles`
9. `reviews`
10. `subcategories`
11. `transactions`
12. `user_roles`

`Database["public"]["Views"]` also contains `profiles_public`. The frontend currently obtains
public profile data through `get_public_profile` rather than a `.from("profiles_public")` call.

Of the 11 tables referenced directly by the frontend, 10 are present by name in generated types.

## 8. Missing or Suspicious Table References

### `support_requests` is missing from generated types

- Frontend use: `src/routes/index.tsx` inserts simplified-mode voice requests.
- Frontend workaround: `.from("support_requests" as never)`.
- Migration evidence: the table and its RLS policies are created in
  `20260630123000_complete_handy_pro_flows.sql`.
- Risk: insert payloads are not type checked, and the remote table/migration state is not proven by
  repository-generated types.

### `reviews.order_id` is missing from generated types

- Frontend use: `src/routes/orders.tsx` selects `order_id` to determine whether the current user
  already reviewed an order.
- Frontend workaround: `.from("reviews" as never)`.
- Current generated `reviews` Row/Insert/Update contracts do not include `order_id` or its
  relationship to `orders`.
- Migration evidence: `order_id` and its unique index are added in
  `20260630123000_complete_handy_pro_flows.sql`.
- Risk: review queries and relationship assumptions bypass static validation.

### Other references

- All other table names used by frontend are present in generated types.
- `master_subcategories` and `transactions` are typed but are not accessed directly by frontend.
- `profiles_public` is a typed view, not a table, and is not currently queried directly.

## 9. Storage Buckets Used by the Frontend

The complete unique list from every `.storage.from(...)` call under `src/` is:

| Bucket       | Operations                  | Call site                  |
| ------------ | --------------------------- | -------------------------- |
| `chat-media` | `upload`, `createSignedUrl` | `src/routes/chats.$id.tsx` |

The bucket stores private chat images and WebM voice recordings. Frontend object paths begin with
the chat ID, matching the participant policies committed in the migration.

## 10. Missing or Suspicious Storage Buckets

- No bucket referenced by frontend is missing from repository migrations.
- `chat-media` is inserted as a private bucket in
  `20260630123000_complete_handy_pro_flows.sql` with a 10 MB limit and image/audio MIME allowlist.
- The same migration defines participant read/insert policies and an owner delete policy.
- Supabase's generated `public` schema types do not enumerate Storage bucket IDs, so bucket
  existence cannot be confirmed from `types.ts`.
- Repository evidence cannot confirm that `chat-media` exists in the linked remote project or that
  its policies were applied. A linked-project storage/migration check is required before release.
- The bucket name is an untyped string in frontend code; a typo would compile successfully.

## 11. Consolidated Findings

| Area           | Status           | Finding                                                                     |
| -------------- | ---------------- | --------------------------------------------------------------------------- |
| Routes         | Good             | Seven expected routes and five bottom tabs are present.                     |
| Build          | Pass             | Production client, SSR, and Nitro builds complete.                          |
| Lint           | Existing failure | Main still has CRLF/Prettier failures; draft PR #1 addresses configuration. |
| RPC names      | Needs sync       | 7 of 12 frontend RPCs are absent from generated types.                      |
| RPC SQL source | Present          | All 7 untyped RPCs exist in committed migration SQL.                        |
| Table names    | Needs sync       | `support_requests` is absent from generated types.                          |
| Table columns  | Needs sync       | `reviews.order_id` is absent from generated types.                          |
| Storage source | Present          | `chat-media` bucket and policies exist in migration SQL.                    |
| Remote state   | Unverified       | Generated types and repository files do not prove applied remote state.     |

## 12. Recommended Next Steps for Prompt 2

1. Confirm the linked Supabase project has applied every committed migration through
   `20260630123000_complete_handy_pro_flows.sql` before changing frontend behavior.
2. Regenerate `src/integrations/supabase/types.ts` from that linked project. The regenerated output
   should include the seven missing RPCs, `support_requests`, `reviews.order_id`, and the new review
   relationship/index-visible schema.
3. Compare regenerated types with the expected SQL signatures before committing them; treat any
   remaining difference as a migration deployment problem.
4. Remove `as never` only after the contracts are generated, then let TypeScript expose incorrect
   RPC arguments, return handling, table columns, and relationships.
5. Run authenticated smoke tests for client, master, and admin roles covering all 12 frontend RPCs.
   Test success, authorization failure, invalid state, and idempotency where applicable.
6. Verify the remote `chat-media` bucket configuration, MIME/size limits, and participant/owner
   Storage policies with two different chat participants plus an unrelated user.
7. Audit RLS and grants for `support_requests`, `reviews`, `orders`, `messages`, and `disputes`
   against the actual remote schema. Do not infer deployed security solely from migration files.
8. Merge or reproduce the narrow lint stabilization from draft PR #1, then rerun `npm run lint` so
   future contract work has a reliable quality gate.
9. Add a CI contract check that extracts literal `.rpc(...)`, `.from(...)`, and `.storage.from(...)`
   names and compares them with generated types plus an explicit storage bucket manifest.

No RPCs, tables, buckets, migrations, RLS policies, routes, UI, or product behavior were changed by
this audit.
