# Beta tester GPS master discovery

## 1. What changed

This PR prepares the existing MVP flow for a small beta test without changing the database contract or adding synthetic marketplace data.

- Clarified client/master role selection and the first steps after authentication.
- Added a beta notice with a link to the existing problem-report flow.
- Added a private master readiness checklist based on existing profile fields.
- Added opt-in browser geolocation and retained manual address search as a fallback.
- Made client location temporary and required explicit confirmation before saving a master's location.
- Added loading, result-count and empty states to the real master discovery map.
- Improved the public master preview with profile and chat actions.

## 2. Files changed

- `src/routes/auth.tsx`
- `src/routes/index.tsx`
- `src/routes/map.tsx`
- `src/routes/profile.tsx`
- `docs/BETA_TESTER_GPS_DISCOVERY.md`

## 3. Migrations

No migrations were added. The change uses the existing Supabase schema, RPC functions and RLS contract.

## 4. Existing Supabase contract used

Tables read or written by the changed flows:

- `categories`
- `subcategories`
- `profiles`
- `user_roles`
- `chats`
- `master_subcategories` (read by the existing Profile flow)

RPC functions used:

- `get_available_masters`
- `get_public_profile`
- `get_my_profile` (through the existing session hook)

No Supabase `as never` workaround was added.

## 5. Client beta path

1. Register as **Я клієнт** or sign in to an existing client account.
2. Open Home and optionally choose a category or service.
3. Open Map.
4. Press **Використати мою геолокацію** and allow browser access, or enter an address manually.
5. Review the real available-master count and markers.
6. Open a marker, inspect the public profile, then press **Написати** to reuse or create a chat.
7. Use **Повідомити про проблему** on Home or in the map empty state to open the existing Settings report flow.

The client's GPS or manually resolved point is used only in the current Map session and is not written to `profiles`.

## 6. Master beta path

1. Register as **Я майстер** or sign in to an existing master account.
2. Open Profile and complete the readiness checklist:
   - name;
   - category;
   - at least one subcategory;
   - saved location;
   - available status;
   - account not paused by the existing debt threshold.
3. Open Map and press **Використати мою геолокацію**, or enter an address manually if GPS/REB conditions make the point inaccurate.
4. Inspect the point and press **Зберегти локацію майстра**. GPS is never persisted before this confirmation.
5. Return to Profile and enable availability.
6. Use a separate client account to verify that the marker appears and that profile/chat actions work.

Portfolio remains optional and is not part of the map visibility requirement.

## 7. Master visibility conditions

The frontend readiness checklist reflects the existing MVP discovery contract. A master should have:

- a non-empty public name;
- a primary category;
- at least one selected subcategory for service filtering;
- valid saved latitude and longitude;
- `status = free`;
- no existing debt-based availability block.

Actual discovery results remain controlled by the existing `get_available_masters` RPC and its RLS/security contract. The frontend does not create or inject fake masters.

## 8. GPS behavior

- Browser geolocation starts only after the user presses the GPS button.
- Permission denial, timeout and unavailable-position errors show Ukrainian recovery guidance.
- The map keeps the Kharkiv/profile fallback when a live position is unavailable.
- A client position is temporary and is not saved to the profile.
- A master position is staged locally and saved only after explicit confirmation.
- GPS coordinates do not overwrite the master's saved text address; a manually resolved address updates both coordinates and address after confirmation.

## 9. Manual address fallback

Manual search uses the existing OpenStreetMap/Nominatim helper. It remains available when GPS is blocked or inaccurate. A successful result recenters the Leaflet map. For masters, it still requires the same explicit save confirmation.

## 10. Public and private data

The Map master card uses the existing public RPC result and public-profile RPC. It can display name, avatar, category, rating, availability, verified state, approximate distance and experience.

It does not display phone, wallet balance, locked address, raw coordinates or other private profile fields. The readiness checklist is shown only to the signed-in master viewing their own profile.

## 11. Problem reporting

Home and the Map empty state link to the existing `/profile/settings` route. That route already writes beta reports through the typed `support_requests` contract. This PR does not duplicate support logic or create another reporting table.

## 12. Known limitations

- Remote Supabase data and browser permissions depend on the deployed beta environment and must be verified there with two real test accounts.
- `get_available_masters` filters by availability/category/subcategory, but currently does not accept the client's coordinates or a search radius. Distance is calculated in the browser for the selected master; results are not radius-limited or distance-sorted by the RPC.
- Nominatim requires network access and may rate-limit or fail independently of the app.
- Browser/device location can be inaccurate because of permission settings, network positioning, GPS quality or electronic interference.
- The map does not create a chat until a client explicitly presses **Написати**.

## 13. Intentionally postponed

- Server-side radius filtering and distance ordering.
- Address reverse geocoding for a GPS-only master point.
- A dedicated beta admin dashboard or report triage UI.
- Automated end-to-end tests that provision client/master Supabase accounts.
- Real payments, identity verification, 2FA and other out-of-scope production features.

## 14. Automated validation

- `npm run build`: passed.
- `npm run lint`: passed with 6 existing Fast Refresh warnings in shared UI component files and 0 errors.
- `npx tsc --noEmit`: passed.

## 15. Local browser smoke check

Checked at a 390 × 844 mobile viewport against the local development server:

- the authentication screen rendered without console errors or overlapping controls;
- the client and master choices had clear labels and the selected state changed correctly;
- direct unauthenticated access to `/map` returned to `/auth` as expected.

No test credentials were present, so authenticated Home, Profile, Map GPS, Supabase writes and two-account discovery/chat behavior were not exercised locally. Remote Supabase was not modified or verified by this smoke check; those items remain in the manual beta checklist.

## 16. Manual beta checklist

- [ ] Client signup records the client role and lands in the client flow.
- [ ] Master signup records the master role and lands in the profile setup flow.
- [ ] GPS is requested only after pressing the location button.
- [ ] Denied GPS permission leaves manual address search usable.
- [ ] Client location is not persisted to `profiles`.
- [ ] Master GPS point is not persisted before confirmation.
- [ ] Confirmed master location persists and reloads correctly.
- [ ] Incomplete/offline masters do not appear as available markers.
- [ ] Available configured master appears for a separate client account.
- [ ] Category and subcategory filters return only real RPC results.
- [ ] Empty results display guidance and a problem-report action.
- [ ] Public master card exposes no phone, wallet, address or private coordinates.
- [ ] **Профіль** opens the public profile.
- [ ] **Написати** reuses or creates a client/master chat only after the button press.
- [ ] Home problem report opens the existing Profile Settings flow.
