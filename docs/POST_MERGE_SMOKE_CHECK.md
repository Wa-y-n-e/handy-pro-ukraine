# Post-Merge MVP Smoke Check

Base branch: `main`

Base commit: `50e0879cb2adf97f96ce818e5c34f15f4c036724`

Scope: repository-side verification after PR #3. No UI, product behavior, migrations, or application
code were changed by this smoke check.

## Validation Results

### Build

- Command: `npm run build` (executed through `npm.cmd` on Windows)
- Result: **PASS**
- Client, SSR, and Nitro/Cloudflare production builds completed.
- Existing non-blocking warning: Vite reports that `vite-tsconfig-paths` is redundant with native
  TypeScript path resolution.

### Lint

- Command: `npm run lint` (executed through `npm.cmd` on Windows)
- Result: **PASS with 6 existing warnings**
- Errors: **0**
- Warnings: six existing `react-refresh/only-export-components` warnings in shared UI primitives.

## Supabase Contract Check

`src/integrations/supabase/types.ts` contains all required post-merge contracts:

- `accept_cash_offer`
- `complete_order`
- `get_available_masters`
- `leave_order_review`
- `mark_chat_read`
- `resolve_dispute`
- `start_order`
- `support_requests`
- `reviews.order_id` in Row, Insert, and Update types

No `as never` cast remains around `supabase.rpc(...)` or `supabase.from(...)`. Three unrelated
TanStack Router search-parameter casts remain and do not bypass Supabase typing.

## Checked MVP Flows

These results confirm that the repository's frontend calls and committed database contract remain
compatible. They are not a substitute for authenticated tests against the deployed Supabase
project.

| Flow | Result | Repository evidence |
| --- | --- | --- |
| Signup as client/master | **Contract OK** | Auth submits `client` or `master`; `handle_new_user` accepts `master` explicitly and otherwise assigns `client`, preventing metadata-based admin assignment. |
| Home categories/search | **Contract OK** | Home reads typed `categories` and `subcategories`; both retain public SELECT policies. Search/filtering is local after load. |
| Home support request | **Contract OK** | Typed `support_requests` insert supplies `created_by`; RLS permits an authenticated user to insert their own request. |
| Map available masters | **Contract OK** | Typed `get_available_masters` supports category/subcategory filters and returns only free, solvent masters with valid coordinates. |
| Chat creation | **Contract OK** | Client inserts a participant chat with a selected master; policy validates participation and the master's role, and participant SELECT permits the returned chat id. |
| Messages and price cards | **Contract OK** | Participant message inserts remain allowed; price cards are restricted to the assigned master. Read access remains participant-only outside active disputes. |
| Cash offer acceptance | **Contract OK** | `accept_cash_offer` requires the client, a matching master-authored price card, and a chat without an existing order. |
| Simulated card escrow | **Contract OK** | `pay_escrow_hold` has the same chat/price-card checks and remains an internal simulated ledger operation with no real acquiring. |
| Order start/complete/review | **Contract OK** | Start is assigned-master only; completion validates actor/payment state and commission handling; review RPC requires a completed participant order and the unique index prevents duplicate author/order reviews. |
| Dispute open/resolve | **Contract OK** | Participants can set the limited chat/order dispute fields and insert their own dispute; only an admin can execute resolution, which closes the dispute consistently. |
| Public profile load | **Contract OK** | Typed `get_public_profile` returns the safe profile projection; public reviews and portfolio reads remain available without private profile fields. |
| Master availability toggle | **Contract OK** | Self-update policy and column-level status grant permit the toggle; the debt trigger forces `offline` at a balance of `-400` or lower. |
| Chat media upload/read | **Contract OK** | Private `chat-media` paths start with the chat UUID; participant policies cover upload and signed read, owner identity is checked on upload, and unrelated users are denied. |

## Issues Found

No new critical repository-level issue was found after the PR #3 merge.

## Fixes Made

None. Application code, UI, migrations, RPC functions, and RLS policies were not changed.

## Remote Supabase Verification

**Not verified.** This environment has no Supabase CLI installation, access token, or local linked
project metadata. The check could not confirm that all committed migrations are applied remotely,
regenerate types from the deployed schema, or execute authenticated client/master/admin sessions.

## Remaining Risks

- The deployed Supabase project may differ from the committed migration state until migration
  application is confirmed.
- Client, master, and admin success/denial paths still need authenticated remote smoke tests.
- Storage upload, signed URL access, unrelated-user denial, and admin deletion need remote tests
  against the actual `chat-media` bucket.
- Payment and payout records remain MVP simulations and must not be represented as real acquiring
  or settlement.
- The six existing Fast Refresh warnings remain outside this smoke-check scope.

## Recommendation

**Proceed to the scoped master profile/vitrine work.** The merged repository contract is coherent,
build and lint gates pass, and no critical flow blocker was found. Before treating the MVP as
production-ready, separately verify remote migration state and run authenticated role/storage
smoke tests against the linked Supabase project.
