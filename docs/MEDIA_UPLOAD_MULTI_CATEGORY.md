# Profile Media Upload and Multi-Category Services

## 1. What Was Added

- Direct profile-avatar upload from a master's device or gallery.
- Direct portfolio/work-photo upload from a master's device or gallery.
- Public vitrine storage buckets with owner-scoped write policies.
- Safe cleanup of newly uploaded files when the matching database write fails.
- Storage cleanup when an owned uploaded portfolio photo is deleted.
- Service selection across multiple categories while retaining one primary category.
- A compact URL fallback for existing external avatar and portfolio workflows.

The existing Profile vitrine, Settings route, GPS flow, Leaflet map and five-tab navigation remain in place.

## 2. Files Changed

- `src/routes/profile.tsx`
- `src/lib/profile-media.ts`
- `supabase/migrations/20260701223000_profile_media_storage.sql`
- `docs/MEDIA_UPLOAD_MULTI_CATEGORY.md`

## 3. Migration

One idempotent migration was added: `20260701223000_profile_media_storage.sql`.

It creates or updates only two public-vitrine buckets and their object policies. It does not change application tables, RPC functions, profile grants, RLS on application tables, or any `chat-media` bucket/policy.

## 4. Supabase Tables Used

- `profiles`: updates the authenticated master's `avatar_url` and primary category.
- `portfolio_photos`: inserts and deletes the authenticated master's public work-photo rows.
- `master_subcategories`: stores all selected services across categories.
- `categories` and `subcategories`: provide the existing service dictionary.
- `reviews`: continues to provide the existing public review list.

The page continues to use `get_public_profile` for the safe public profile projection and `get_my_profile` through the session hook for private self data.

## 5. Storage Buckets

- `profile-avatars`: public read, 5 MB object limit.
- `portfolio-photos`: public read, 10 MB object limit.

Both accept the common web image MIME types JPEG, PNG, WEBP, GIF and AVIF. The browser input uses `accept="image/*"`, while client validation and bucket configuration reject non-image and unsupported formats. No image is stored as base64 in the database.

`chat-media` is not used or modified.

## 6. Storage Policies

Public SELECT is allowed because these objects are explicitly used in the public master vitrine.

Avatar writes require:

- an authenticated user;
- `owner_id = auth.uid()`;
- path prefix `avatars/{auth.uid()}/`.

Portfolio writes require the same ownership checks, path prefix `portfolio/{auth.uid()}/`, and the existing master role through `has_role(auth.uid(), 'master')`.

INSERT, UPDATE and DELETE each enforce the owner folder. The client does not use a service-role key and security does not rely on the UI alone.

## 7. Avatar Upload Behavior

The own-master Profile editor shows **Завантажити фото профілю** as the primary control and explains that clients can see the photo.

The selected file is validated for an allowed image MIME type and a maximum size of 5 MB, then uploaded to:

`avatars/{user_id}/{timestamp}-{random-id}.{extension}`

After upload, the public URL is written to `profiles.avatar_url`. Own Profile state updates immediately, and public Profile/Map/Chats continue to use the same existing `avatar_url` field. If the profile update fails, the new object is removed. After a successful replacement, a previous avatar is removed only when its URL can be proven to belong to the same user's `profile-avatars` folder.

## 8. Portfolio Upload Behavior

The own-master Portfolio section shows **Додати фото роботи** as the primary control and explains why work photos help clients.

The selected file is validated for an allowed image MIME type and a maximum size of 10 MB, then uploaded to:

`portfolio/{user_id}/{timestamp}-{random-id}.{extension}`

The resulting public URL is inserted into `portfolio_photos` with the authenticated master id and the next simple position. The UI appends the returned row immediately. If the table insert fails, the newly uploaded object is removed.

## 9. Portfolio Delete Behavior

Deletion still targets both the photo id and the current master's id, while table RLS independently requires owner/master access.

After a successful row deletion, storage cleanup runs only when the URL parses as this exact user's `portfolio-photos/portfolio/{user_id}/...` object. External URL fallback entries are removed from the table but no external or unrelated file is touched. A failed storage cleanup leaves only an orphan object and reports a warning; it cannot delete another user's object because both path validation and storage RLS enforce ownership.

## 10. Multi-Category Service Selection

The existing subcategories are grouped under every existing category. A master can select any number of services across those groups. Saving compares the complete selected set against `master_subcategories`, inserts new rows and deletes removed rows.

Existing single-category masters load unchanged and can keep their current selections.

## 11. Primary Category Compatibility

`profiles.primary_category_slug` remains required for current Map/RPC compatibility. The editor lets the master explicitly choose one primary category from the categories that currently contain at least one selected service.

If the master does not choose one, the first category with a selected service becomes primary on save and the success message explains the automatic choice.

Current `get_available_masters` behavior is intentionally unchanged:

- category filtering compares only `profiles.primary_category_slug`;
- subcategory filtering checks all rows in `master_subcategories`.

Therefore, a service selected under a secondary category is stored and shown publicly, but a Map request that sends both that secondary category and its subcategory may still exclude the master because the category is not primary. Fixing that behavior requires a separate reviewed RPC contract change.

## 12. Public and Private Data Safety

Public media URLs contain only public vitrine images. Public Profile still reads its profile projection through `get_public_profile` and the existing public portfolio/service tables.

Phone, wallet balance, locked address and private coordinates are not added to public output. Upload and service controls remain visible only to the authenticated master viewing their own Profile. Settings and GPS hints are unchanged.

## 13. Intentionally Postponed

- Image resizing, cropping, compression and EXIF removal.
- Drag-and-drop portfolio ordering and bulk upload.
- A transactional RPC for saving primary category and all selected services atomically.
- Changing `get_available_masters` to match category filters against secondary services.
- Migrating old external image URLs into managed storage.
- Admin, payments, payouts, 2FA, selfie verification, full i18n and legal processing.

## 14. Build Result

`npm run build` passed for client, SSR and Nitro production output.

## 15. Lint Result

`npm run lint` passed with 0 errors and 6 existing `react-refresh/only-export-components` warnings in shared UI component files.

## 16. Typecheck Result

`npx tsc --noEmit` passed.

## 17. Manual Test Checklist

- [ ] Apply the new migration to a test Supabase project.
- [ ] Sign in as a master and open own Profile.
- [ ] Upload a valid avatar below 5 MB and confirm immediate own-profile preview.
- [ ] Open the same master from a client account and confirm the avatar is public.
- [ ] Reject a non-image avatar and an image above 5 MB with Ukrainian validation.
- [ ] Replace an uploaded avatar and confirm only the same user's old managed object is eligible for cleanup.
- [ ] Upload a valid work photo below 10 MB and confirm it appears in own and public portfolio.
- [ ] Reject a non-image portfolio file and an image above 10 MB.
- [ ] Delete an uploaded work photo and confirm both the row and owned storage object are removed.
- [ ] Delete an external URL fallback photo and confirm no storage object is targeted.
- [ ] Confirm another user's storage path cannot be uploaded, updated or deleted.
- [ ] Select services from at least two categories and save.
- [ ] Reload Profile and confirm every selected service remains checked and public.
- [ ] Choose one selected category as primary and confirm it persists.
- [ ] Leave primary selection empty and confirm the first selected category becomes primary.
- [ ] Confirm the primary category remains compatible with current Map category filtering.
- [ ] Confirm secondary-category Map limitations match the documented RPC behavior.
- [ ] Confirm public Profile exposes no phone, wallet, locked address or private coordinates.
- [ ] Confirm `/profile/settings`, GPS location saving and all five bottom tabs still work.
