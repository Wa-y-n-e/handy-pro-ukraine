# Master Profile Vitrine and Portfolio

## What Was Added

- A master-only profile editor on the existing `/profile` route.
- Primary category and subcategory management backed by the existing service dictionary.
- URL-based portfolio add/delete controls using the existing portfolio table.
- A clearer public master vitrine with category, availability, experience, vehicle/tools,
  portfolio, reviews, rating, verification state, and completed-job information.
- Client profiles remain simple and do not expose master-only editing controls.

The existing five-tab navigation, wallet/order logic, availability switch, client profile, and
public profile route were preserved.

## Editable Fields

Authenticated masters can edit the existing profile columns:

- `full_name`
- `avatar_url`
- `experience_years`
- `has_vehicle`
- `tools_inventory`
- `locked_address`
- `primary_category_slug`
- `status` through the existing availability switch

All writes target the authenticated user's profile id with typed Supabase calls. Rating,
verification, phone, wallet balance, and coordinates are not editable in this UI.

There is no bio/about column in the current schema, so no biography field was invented.

## Tables Used

- `profiles`: self profile edits and availability.
- `categories`: primary service category options.
- `subcategories`: service options for the selected primary category.
- `master_subcategories`: owner-managed selected services.
- `portfolio_photos`: public portfolio reads and owner insert/delete.
- `reviews`: public review list.

The page continues to use `get_public_profile` for the safe public profile projection and
`get_my_profile` through the existing session hook for private self data.

## Database Changes

No migration was added. No table, column, RPC, RLS policy, or storage bucket was added or changed.

The implementation relies on the existing policies:

- profile self-update with column-level grants;
- public `master_subcategories` reads and owner management;
- public portfolio reads and master-owner insert/delete.

## Portfolio Mode

Portfolio management is **URL-only**. A master can add an HTTP/HTTPS image URL and delete their own
entry. New entries append after the greatest existing `position`; existing ordering is preserved.

No file upload was added because the repository has no dedicated portfolio-media bucket. The
private `chat-media` bucket is not used for portfolio photos.

## Public and Private Data

Public master profiles show only data already returned by the safe public RPC or public tables.
They do not show phone, wallet balance, locked address, or private coordinates. The locked address
field appears only in the authenticated master's own editor.

## Intentionally Postponed

- Bio/about editing until a real schema column and safe public projection exist.
- Direct portfolio file upload until a dedicated private-write/public-read bucket and policies are
  designed.
- Drag-and-drop portfolio reordering; current stored ordering is retained and new items append.
- Multi-category service editing; the current MVP edits services under one primary category to
  remain compatible with Map filtering.
- Admin, payment, payout, 2FA, selfie, SMTP, and full-i18n work.

## Validation

- `npm run build`: **PASS** using `npm.cmd` on Windows. Client, SSR, and Nitro/Cloudflare builds
  completed.
- `npm run lint`: **PASS with 6 existing warnings** and zero errors. The warnings are the existing
  `react-refresh/only-export-components` warnings in shared UI primitives.
- No new broad `any` or Supabase-related `as never` cast was introduced.

## Remaining Risks

- The local browser correctly redirected unauthenticated `/profile` access to `/auth`; an
  authenticated client/master visual smoke test still requires a linked Supabase test session.
- Remote migration/RLS deployment state was not reverified in this task.
- Category and subcategory writes use existing separate table operations rather than a transaction
  RPC, so a network interruption can require the master to save the service section again.
- External image URLs can become unavailable or block embedding; a managed portfolio bucket is the
  longer-term solution.
