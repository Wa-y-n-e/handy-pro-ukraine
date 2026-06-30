## Handy Pro — Full Rebuild Plan

This is a major rebuild: the current app is a single-route mock with mode-switching. You're asking for a real 5-tab app with Supabase backend, Google Maps, real-time master pins, escrow wallet logic, Telegram-style chat, and arbitration. Below is the scope and a few decisions I need before building.

### Architecture

- **Routes (TanStack file-based)** with fixed bottom tab bar:
  - `/` Home (categories grid + search + Grandma Mode + curfew banner)
  - `/map` Google Maps (priority #1)
  - `/orders` Orders + Wallet/Escrow
  - `/chats` Chat list → `/chats/$id` Telegram-style room
  - `/profile` Profile (Master "Foxtrot" / Client "Uber" views)
- **Backend**: Lovable Cloud (Supabase) — auth, profiles, orders, chats, messages, transactions, reviews, disputes; RLS on every table; `user_roles` table with `has_role()` security-definer.
- **Realtime**: Supabase channels for master `status`, chat messages, dispute state, wallet balance.
- **Maps**: Google Maps via the Lovable Google Maps connector (browser key for JS API, gateway for geocoding). User connects it on first map view.

### Data model (Supabase)

```
profiles(id, role, full_name, avatar_url, phone, rating, status enum[free|working|offline],
         locked_address, locked_lat, locked_lng, primary_category, verified, has_vehicle,
         tools_inventory, experience_years, wallet_balance numeric default 0)
user_roles(user_id, role enum[admin|master|client])
categories(id, slug, name_uk, icon)
subcategories(id, category_id, name_uk)
master_categories(master_id, subcategory_id)
portfolio_photos(id, master_id, url, position)
reviews(id, target_id, author_id, rating, text, created_at)  -- bidirectional
orders(id, client_id, master_id, subcategory_id, address, lat, lng, status, price,
       payment_method enum[card|cash], escrow_status enum[none|held|released|disputed|refunded],
       created_at, completed_at)
chats(id, order_id, client_id, master_id)
messages(id, chat_id, sender_id, body, media_url, voice_url, reply_to, read_at, kind enum[text|voice|media|price_card|system])
transactions(id, order_id, kind enum[hold|release_master|release_platform|cash_debt|payout|topup|instant_fee], amount, master_id)
disputes(id, order_id, opened_by, status, resolution, admin_id)
```
Commission 10%, instant-payout fee 2%, debt threshold −400 UAH (auto-offline trigger via DB function on transaction insert).

### Priority order

1. Supabase schema + auth + seed all 11 categories & subcategories
2. Bottom-tab shell + Home (grid, search→map routing, Grandma Mode, curfew)
3. Map tab (manual address override, category-filtered pins, custom icons, bottom sheet)
4. Chat tab (Telegram UX, price card injection, dispute button, admin auto-join)
5. Orders + Wallet (escrow flow, cash anti-fraud trigger, payout, instant withdraw)
6. Profile views (Foxtrot master, Uber client modal)

### Decisions needed

I need your call on these before I start — they materially change the build.
