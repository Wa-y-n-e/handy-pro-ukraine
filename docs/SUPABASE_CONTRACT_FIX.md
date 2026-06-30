# Supabase Contract and RLS Stability Fix

This document records the repository-side contract stabilization performed after
`docs/MVP_AUDIT.md`. It does not claim that the committed migrations are already applied to the
linked remote Supabase project.

## 1. What Was Fixed

- Synchronized the TypeScript Supabase contract with the schema committed in repository
  migrations.
- Added the seven previously missing frontend RPC signatures to generated-style types.
- Added `support_requests`, `reviews.order_id`, and their relationships to generated-style types.
- Removed Supabase-related `as never` workarounds now covered by the contract.
- Tightened RPC state and authorization checks for master discovery, price-card acceptance,
  simulated escrow completion, and dispute resolution.
- Tightened RLS and grants for profiles, roles, chats, messages, orders, reviews, portfolios,
  transactions, disputes, support requests, and private chat media.
- Kept `pay_escrow_hold` as an internal MVP ledger simulation. No card acquiring, real payout, or
  external money movement was added.

## 2. Migration Verification

All committed migration files were inspected:

1. `20260630061120_14a1b985-e21a-4269-934f-d23ce60b8380.sql`
2. `20260630061132_02268776-ac74-4de9-a125-b6ad0473121b.sql`
3. `20260630064608_c376a4db-df78-4154-a248-f35ca10c0c3e.sql`
4. `20260630064656_23cd8fbf-29b3-4695-b43e-981fc252ccbc.sql`
5. `20260630065321_589c474c-ed0e-4306-9a15-c75cd0c679db.sql`
6. `20260630065340_7bf29388-b21e-4170-ba9d-f5a973ac6f17.sql`
7. `20260630100039_16a17b27-77c4-423b-b16c-ba5f49589480.sql`
8. `20260630101143_7c3409a5-29c9-4609-9c59-d88555b57080.sql`
9. `20260630123000_complete_handy_pro_flows.sql`

The last migration already defines all seven audited RPCs, `support_requests`,
`reviews.order_id`, its per-order/author unique index, and the private `chat-media` bucket with
participant policies. None of those objects was duplicated.

One new idempotent migration was added:

- `20260630213000_supabase_contract_rpc_rls_stability.sql`

It replaces only RPCs that required contract hardening and recreates grants/policies that needed
security changes.

## 3. Type Synchronization

The Supabase CLI is not installed globally, no `SUPABASE_ACCESS_TOKEN` is available, and the
checkout has no local link metadata. Remote type regeneration and migration-state verification
were therefore unavailable. `src/integrations/supabase/types.ts` was updated from the committed
SQL schema and must be regenerated from the linked project after the migration is deployed.

The following frontend RPCs are now typed:

1. `accept_cash_offer`
2. `complete_order`
3. `get_available_masters`
4. `leave_order_review`
5. `mark_chat_read`
6. `resolve_dispute`
7. `start_order`

`wallet_run_friday_payouts`, which is also defined by the committed schema, was added to the type
contract. No existing table, view, enum, relationship, or function type was removed.

## 4. Removed Type Bypasses

Supabase-related `as never` casts were removed from:

- `support_requests` insert on Home;
- `reviews.order_id` query on Orders;
- the seven newly typed RPC calls;
- the two existing `get_public_profile` calls, whose signature was already typed.

No `as never` remains around `supabase.rpc(...)` or `supabase.from(...)`. Three unrelated TanStack
Router search casts remain; they are outside the Supabase contract and were intentionally not
changed in this PR.

## 5. RPC Contract Status

- `get_available_masters` now requires a master role, `free` status, balance above `-400`, valid
  coordinates, and matching optional category/subcategory filters. Its result omits private profile
  fields and wallet balance.
- `accept_cash_offer` and `pay_escrow_hold` require a matching price card authored by the chat's
  assigned master and reject chats that already have an order.
- `pay_escrow_hold` is explicitly documented in SQL as simulated MVP escrow.
- Existing `start_order` authorization was verified: only the assigned master can start an
  accepted/en-route order.
- `complete_order` validates actor and state, applies the 10%/90% simulated card split, records
  10% cash debt, and forces the master offline at a balance of `-400` or lower.
- Existing `leave_order_review` behavior was verified: only completed-order participants can
  review, and the unique `(order_id, author_id)` index prevents duplicates.
- Existing `mark_chat_read` behavior was verified: only chat participants can mark messages read.
- `resolve_dispute` requires an admin, an active/open dispute, and a disputed order. It handles
  simulated card release/refund and cash completion/cancellation without treating cash as card
  escrow.

## 6. RLS and Grant Status

- **Profiles:** direct reads expose only public columns; phone, wallet balance, address, and raw
  coordinates are excluded. Full self data remains available through `get_my_profile`; free-master
  coordinates come from the filtered RPC/view. Self update/insert checks are explicit.
- **User roles:** authenticated users can read their role but cannot directly insert, update, or
  delete role rows. Signup metadata can no longer assign `admin`.
- **Chats/messages:** participant access is preserved; admin reads/inserts are limited to active
  disputes. Direct message updates are revoked, and direct chat updates are limited to opening a
  dispute. Price cards must be authored by the assigned master.
- **Orders:** participants/admin can read eligible orders. Direct inserts are revoked; lifecycle
  creation uses validated RPCs. Participant direct updates are limited to entering dispute state.
- **Reviews:** public reads remain; direct writes are revoked in favor of the review RPC.
- **Portfolio photos:** public reads remain; insert/delete require both ownership and master role.
- **Transactions:** participant/admin reads remain; direct user writes are revoked.
- **Disputes:** participants/admin can read; inserts require the authenticated participant as
  `opened_by` and a disputed order. Resolution writes are RPC-only.
- **Support requests:** users can insert/read their own requests; admins can read and update all.

## 7. Storage Policy Status

`chat-media` remains private with the committed size and MIME restrictions. Read/upload policies
validate the chat UUID path and require chat participation. Uploads require the authenticated user
as owner. Deletes are allowed for the uploader or an admin. Unrelated users cannot read or upload
chat media.

## 8. Validation

- `npm run build`: **PASS** using `npm.cmd` on Windows. Client, SSR, and Nitro/Cloudflare builds
  completed.
- `npm run lint`: **PASS with 6 existing warnings**. All are
  `react-refresh/only-export-components` warnings in shared UI primitives; there are zero lint
  errors.

## 9. Remaining Risks

- The linked remote Supabase migration state is not verified. Apply migrations through
  `20260630213000_supabase_contract_rpc_rls_stability.sql`, then regenerate types from that project.
- The new SQL was reviewed repository-side but was not executed against a local or remote Postgres
  instance in this environment.
- Authenticated client/master/admin smoke tests are still required for success, denial, state
  transition, duplicate-review, dispute, and storage-isolation cases.
- Simulated escrow and wallet entries remain MVP accounting records, not real payments or payouts.
