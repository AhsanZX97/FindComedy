# FindComedy Admin — Plan

Status: planned, not started
Date: 2026-06-12
Owner: degreatahsan@gmail.com (sole admin, via Google sign-in)

## Goal

Give one trusted account (your Google login) the ability to **curate the data**
without touching the Supabase dashboard for routine work:

- Edit any night (fix wrong time/venue/info, set status `active`/`paused`/`gone`,
  bump `lastVerified`).
- Create and delete nights.
- Work the **submission queue** — review submitted nights and approve (publish as
  a real night) or reject them.
- Read **feedback** — see which nights are getting reports, what type, and the
  free-text notes; see the vibe-tag reviews and their notes.
- **Moderate comments** — delete any review/report (e.g. spam or abuse), not just
  your own.

## The one hard constraint that shapes everything

There is **no backend**. Per `CLAUDE.md`, this app is a static SPA on GitHub
Pages. The only privileged credential — the Supabase `service_role` key — can
**never** ship to the browser. Therefore:

> **Admin authorization is enforced by Postgres Row-Level Security, not by the
> React app.** The `/admin` UI is just convenience. Even if someone forged the
> client or called Supabase directly with the public anon key, RLS must reject
> their writes because they are not the admin.

Every admin power below is a **new RLS policy** gated on an `is_admin()` check.
The client code is the easy half; the SQL is the security boundary. Get the SQL
right first.

## Who is "admin"? — identity model

`profiles.role` already exists as `punter | comic | promoter`. That column is a
**user-facing identity** (what kind of comedy person you are), not a permission
level — overloading it with `admin` mixes two concerns. Instead add a dedicated,
tiny table:

```sql
CREATE TABLE public.admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
-- An admin may read the admins table (to confirm their own status); nobody can
-- write to it via the anon key — membership is granted only by SQL in the
-- Supabase dashboard. No INSERT/UPDATE/DELETE policy = no anon writes.
CREATE POLICY "Admins can read admin list"
  ON public.admins FOR SELECT USING (auth.uid() = user_id);
```

A `SECURITY DEFINER` helper keeps every other policy readable and avoids RLS
recursion:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()); $$;
```

### Bootstrap (do this once, by hand)

`admins` is keyed by `auth.users.id`, which doesn't exist until you've signed in.
So:

1. Sign in to the live app with **degreatahsan@gmail.com** via Google once (this
   also fires the existing `handle_new_user` trigger and creates your profile).
2. In the Supabase SQL editor, run:

   ```sql
   INSERT INTO public.admins (user_id)
   SELECT id FROM auth.users WHERE email = '<your-google-email>'
   ON CONFLICT DO NOTHING;
   ```

That's the entire grant. Revoking = `DELETE FROM public.admins WHERE …`.

## Schema & RLS changes — `supabase/migrations/003_admin.sql`

Bottom layer, written before any TS. New table + helper above, then **add**
policies (existing ones stay; we only widen what admins can do).

```sql
-- nights: anon stays read-only; admin gets full write.
CREATE POLICY "Admins can insert nights" ON public.nights
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update nights" ON public.nights
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete nights" ON public.nights
  FOR DELETE USING (public.is_admin());

-- submissions: today anon can only INSERT and nobody can read.
-- Admin needs to read the queue and update status.
CREATE POLICY "Admins can read submissions" ON public.submissions
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update submissions" ON public.submissions
  FOR UPDATE USING (public.is_admin());

-- reviews: today only the author can delete. Add admin moderation delete.
CREATE POLICY "Admins can delete any review" ON public.reviews
  FOR DELETE USING (public.is_admin());

-- reports: add admin delete (resolve/dismiss) — see resolved_at note below.
CREATE POLICY "Admins can delete any report" ON public.reports
  FOR DELETE USING (public.is_admin());
```

**Reports — resolve vs delete.** Deleting a report loses the signal. Optional but
recommended: add a `resolved_at TIMESTAMPTZ` column so "I've handled this" is
distinct from "this never happened", and let admins update it:

```sql
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (public.is_admin());
```

**Trigger touch-up.** `nights.updated_at` won't move on admin edits unless we set
it. Either set `updated_at = now()` in the update payload (simplest, mirrors how
`profilesService.updateProfile` already does it) or add a `BEFORE UPDATE` trigger.
Go with setting it in the payload to keep parity with existing code.

## Types — `src/types/`

1. `types/auth.ts` — admin status is **not** a role; expose it separately. No
   change to `UserRole`. Admin-ness flows through `AuthContext` as a boolean.
2. `types/comedyNight.ts` — add the stored submission row shape (the queue needs
   id/status/createdAt that `NightSubmission` lacks):

   ```ts
   export interface StoredSubmission {
     id: string
     data: NightSubmission
     status: 'pending' | 'approved' | 'rejected'
     submitterNote?: string
     createdAt: string
   }
   ```
   If we add `resolved_at`, extend `Report` with `resolvedAt?: string`.

## Services — `src/services/`

Keep the existing per-feature service files; **add admin functions there** rather
than one god-object, except for the submission queue which earns its own file.
Every function must no-op/throw cleanly when `supabase` is null (match existing
style). RLS does the enforcement, so these are thin wrappers — but they will
silently fail for non-admins (that's correct).

- `profilesService.ts` → `getIsAdmin(userId): Promise<boolean>` — `select` from
  `admins` where `user_id = userId`, `maybeSingle`, return `Boolean(data)`.
- `nightsService.ts` →
  - `upsertNight(night: ComedyNight): Promise<void>` — map camelCase → snake_case
    (inverse of the existing `rowToNight`), set `updated_at`.
  - `deleteNight(id: string): Promise<void>`.
  - `getNightById(id)` if not already available for the edit form (NightDetailPage
    currently refetches all — reuse or add a single-row fetch).
- `reviewsService.ts` → `deleteReviewById(id: string): Promise<void>` (admin path,
  by review id — distinct from the existing owner `deleteReview(userId, nightId)`).
- `reportsService.ts` → `getAllReports()` (admin feedback view, joined/grouped by
  night), `resolveReport(id)` / `deleteReportById(id)`.
- **`submissionsService.ts`** (extend) →
  - `getSubmissions(status?)` — list the queue (admin-only read).
  - `setSubmissionStatus(id, status)`.
  - `approveSubmission(sub: StoredSubmission)` — the meaty one: map
    `NightSubmission` → a `nights` row (generate an `id` slug from the name, set
    `status: 'active'`, `lastVerified = today`, default empty JSONB for missing
    nested fields), `upsertNight`, then mark the submission `approved`. Do this as
    two awaited calls; note there is no cross-table transaction over the REST API,
    so order it insert-night-first, then flip status, and surface a clear error if
    the second call fails.

## Auth wiring — `src/features/auth/AuthContext.tsx`

- Add `isAdmin: boolean` to `AuthState` and `AuthContextValue`.
- After the existing `getProfile(...)` call in both the `getSession` branch and
  `onAuthStateChange`, also call `getIsAdmin(user.id)` and store the result. Reset
  to `false` on sign-out (alongside the existing `profile: null`).
- No new fetch waterfall worth worrying about — it's one tiny indexed lookup.

## Routing — `src/App.tsx`

Add admin routes, all behind a guard. Mirror the `MyNightsPage` redirect pattern
(`<Navigate to="/auth" replace />` when not allowed) but check `isAdmin`, not just
`user`:

```
/admin            → AdminDashboard  (overview: queue size, open reports, recent reviews)
/admin/nights/:id → AdminNightEdit  (edit form; reuse SubmitPage field components)
/admin/queue      → AdminSubmissions (approve / reject)
/admin/feedback   → AdminFeedback    (reports + reviews, with delete)
```

A small `<RequireAdmin>` wrapper component (reads `useAuth`, shows the existing
spinner while `isLoading`, redirects to `/` when `!isAdmin`) avoids repeating the
guard in four pages. **This is belt-and-braces only** — RLS already blocks the
writes; the guard just hides UI the user can't use.

## Components — `src/features/admin/`

New feature folder. Bottom-up, smallest first:

1. `RequireAdmin.tsx` — route guard described above.
2. `AdminNightForm.tsx` — the edit form. **Do not copy-paste `SubmitPage`** — that
   form already builds every night field. Extract its field groups into shared
   inputs both pages use, or have `AdminNightForm` reuse SubmitPage's controlled
   inputs. (Per house rules: extract the shared piece, don't duplicate.)
3. `SubmissionCard.tsx` — renders one queued submission with Approve / Reject.
4. `AdminFeedback.tsx` — table/list of reports grouped by night (count + type +
   note + resolve/delete) and a reviews moderation list (reuse the review card
   markup from `ReviewsSection`, add a delete button visible only to admin).
5. `AdminSubmissions.tsx`, `AdminNightEdit.tsx`, `AdminDashboard.tsx` — screen
   wiring that composes the above.
6. `components/Header.tsx` — show an **Admin** nav link only when `isAdmin`
   (alongside the existing auth-aware "My nights"). One conditional, no new
   layout.

## Admin-on-detail-page moderation (optional, nice)

Rather than only a separate `/admin/feedback` screen, surface a subtle "Delete"
control on each review in `ReviewsSection` **when `isAdmin`** (the component
already takes `userId`; pass an `isAdmin` prop and call `deleteReviewById`). Same
for the report list. This makes moderation a one-click action in context. Keep it
out of v1 if it complicates the first cut.

## Atomic task plan (layer order)

| #  | Task | Verify |
|----|------|--------|
| 1  | `003_admin.sql`: `admins` table, `is_admin()`, all new policies; run in Supabase | policies listed in dashboard; anon still can't write nights |
| 2  | Bootstrap: sign in once as the Google account, INSERT into `admins` | `select is_admin()` returns true when signed in as you |
| 3  | Types: `StoredSubmission`, optional `Report.resolvedAt`, no `UserRole` change | `npm run build` |
| 4  | `getIsAdmin` in profilesService + test | `npm test` |
| 5  | `nightsService`: `upsertNight`, `deleteNight`, single-night fetch + tests (camel↔snake mapping) | `npm test` |
| 6  | `submissionsService`: `getSubmissions`, `setSubmissionStatus`, `approveSubmission` + tests | `npm test` |
| 7  | `reviewsService.deleteReviewById`, `reportsService` admin fns + tests | `npm test` |
| 8  | AuthContext: thread `isAdmin` through state + sign-out reset | log in as you → `isAdmin` true; as another acct → false |
| 9  | `RequireAdmin` + `/admin*` routes; Header shows Admin link when admin | non-admin hitting `/admin` redirects |
| 10 | Extract shared night-form inputs; `AdminNightForm`; `/admin/nights/:id` edits a night | edit a real night, see it change on Browse |
| 11 | `AdminSubmissions` + approve flow (submission → live night) | approve a test submission, night appears |
| 12 | `AdminFeedback`: reports grouped + reviews, with delete/resolve | delete a test review/report, it's gone |
| 13 | (optional) inline admin delete on `ReviewsSection` | delete from detail page |
| 14 | `npm run build` + `npm test` + click-through of all admin routes | green |

## Bug risks / gotchas

1. **`is_admin()` recursion.** If the `admins` SELECT policy itself called
   `is_admin()` you'd get infinite RLS recursion. The policy uses a plain
   `auth.uid() = user_id` check and the helper is `SECURITY DEFINER` (bypasses
   RLS) — keep it that way.
2. **Silent failures look like bugs.** A non-admin's write returns success-shaped
   responses with zero rows affected under RLS, not an error. Admin write helpers
   should check the returned row/`count` and surface "not permitted" rather than
   pretending it worked. Don't ship a catch block that swallows this (house rule).
3. **No multi-table transaction.** `approveSubmission` does two writes (insert
   night, flip submission status) with no transaction over PostgREST. Insert the
   night first; if the status flip fails the night still exists (recoverable) and
   the queue still shows it as pending (visible) — far better than the reverse.
   A Postgres `RPC`/function is the clean fix if this proves flaky.
4. **Night `id` generation on approve.** Slug from name + dedupe against existing
   ids (the PK is `TEXT`, not a uuid). Collisions must not overwrite a live night.
5. **camelCase ↔ snake_case both ways.** `rowToNight` only maps read direction;
   `upsertNight` needs the inverse (`howToBook → how_to_book`, etc.). One missed
   field silently drops data on save. Unit-test the round-trip.
6. **Seed/dev mode has no admin.** When `isSupabaseConfigured` is false the app
   uses static seed data and there's no auth — admin UI must hide gracefully
   (guard already redirects; services already no-op on null `supabase`).
7. **`updated_at` / `lastVerified` confusion.** `lastVerified` is the user-facing
   freshness date (a deliberate admin action — "I checked this is still true");
   `updated_at` is bookkeeping. Edits should bump `updated_at` always, but only
   bump `lastVerified` when the admin clicks a "Mark verified" action, not on
   every typo fix.
8. **Reports without a resolve column pile up.** If we skip `resolved_at`, the
   feedback view grows unbounded and "handled" looks identical to "new". Prefer
   adding the column now.

## Definition of done

- `is_admin()` + policies live; a second, non-admin account is provably blocked
  from editing nights, reading the submission queue, and deleting others' reviews
  (test it).
- Signed in as degreatahsan@gmail.com: an **Admin** link appears; you can edit a
  night and see the change on Browse, approve a submission into a live night, and
  delete a review and a report.
- `/admin*` redirects non-admins to `/`.
- `npm run build` and `npm test` pass; no duplicated night-form markup (SubmitPage
  and AdminNightForm share inputs); no swallowed RLS failures; no secrets in the
  client.
```