# FindComedy — Product & Build Plan

> Find live comedy in London. Every comedy night is a living entity — clickable, social, kept fresh by the people who go.
>
> This is a **vibe-coding plan**: phases are ordered by value, not contract. Anything in here can be reshuffled, cut, or replaced when a better idea shows up mid-build. The non-negotiables are the stack rules in `CLAUDE.md`; everything else is a strong default.

---

## 1. What we learned from the inspiration

### [Spotties](https://spotties.nl/) — the product shape
- **Entity-centric**: spots are first-class pages, not rows in a list. Each has reviews, skill votes, live conditions, and events attached.
- **Community layered on top of directory**: profiles, "see who's going", event chat. The directory gets you in; the people keep you there.
- **Clean modern landing**: bold hook ("Find your spot. Find your people."), feature grid, how-it-works in 3 steps.
- **Steal**: nights as rich entities, profiles, "I'm going", the warm community tone. *"Find your night. Find your funny people."*

### [London Standup Comedy Map](https://apuchitnis.github.io/open-mic-nights/) — the data model & the gap
- Proves the concept works on GitHub Pages, and proves the demand (active Facebook group).
- **Rich per-night data**: name, description, level (New / Experienced / Pro), bringer policy, frequency (weekly/monthly), weekday, start time, venue + address, how to book, website / Facebook page / Facebook group / Instagram.
- **"Back On" column** is the hidden gem: comedy nights die and resurrect constantly. *Freshness of data is the #1 problem in this space.*
- **The gap we exploit**: it's a Google Map bolted onto a dense spreadsheet-style table. No detail pages, no accounts, no mobile-friendly browsing, edits go through a Google Form. We do the same data, modern UX.

### [GigGag](https://giggagcomedy.com/) — the performer angle
- Performer-first: browse open spots across the UK circuit, one-click apply with a verified performer profile, notifications when promoters confirm.
- **Steal**: the **two-audience insight**. Comedy nights serve *audiences* (who want a fun night out) and *comedians* (who want stage time). Same data, two lenses. We design for both from day one — fields like "bringer" and "how to book a spot" matter to comics; "free entry" and "headliner" matter to punters.

---

## 2. Who it's for

| Persona | Wants | Killer feature |
|---|---|---|
| **The punter** | A good cheap night out, tonight or this weekend | "What's on tonight near me" |
| **The new comic** | Stage time, low-pressure open mics, knowing the bringer policy | Filter: open mics, no-bringer, sign-up link in one tap |
| **The promoter** *(later)* | Their night listed accurately, audience + acts showing up | Claim & edit their night's page |

---

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│  GitHub Pages (static)                       │
│  Vite + React + TS + Tailwind SPA            │
│  HashRouter                                  │
└──────────────┬──────────────────────────────┘
               │ supabase-js (anon key — safe to ship, guarded by RLS)
┌──────────────▼──────────────────────────────┐
│  Supabase (free tier)                        │
│  Postgres · Auth · Row Level Security        │
└─────────────────────────────────────────────┘
```

**Key decisions** (each is a default, revisit if it fights us):

- **Supabase for accounts + data.** GitHub Pages has no server, so user accounts require a BaaS. Supabase's anon key is designed to be public (security lives in Row Level Security policies), which fits our "no secrets in the repo" rule. Free tier is plenty. Auth: email magic link + Google OAuth — no passwords to manage.
- **Static-first data, dynamic later.** Phase 1 ships with the night data as a typed local JSON/TS file — instant loads, works offline, zero infra. Supabase becomes the source of truth only when accounts/favourites arrive. The data-access layer in `services/` hides which backend is live, so swapping is a one-file change.
- **Leaflet + OpenStreetMap for the map** (via `react-leaflet`). Keyless and free, unlike Google Maps. Map is a *view* of the data, never the only way in — list view is primary on mobile.
- **No state library, no TanStack Query yet.** Component state + a small context for auth/session. Add tooling when pain is demonstrated, per CLAUDE.md.

---

## 4. Data model

The **ComedyNight** is the star entity. Most London nights are *recurring* ("every Tuesday at the Camden Head"), so we model the recurring night, not individual dates — with room to attach one-off occurrences later.

```ts
// src/types/comedyNight.ts
interface ComedyNight {
  id: string;                    // slug: 'knock2bag-camden'
  name: string;
  description: string;
  type: 'open-mic' | 'showcase' | 'pro' | 'mixed';
  levels: Level[];               // ['new', 'experienced', 'pro']
  bringer: BringerPolicy;        // { required: boolean; note?: string } — comics care a LOT
  schedule: Schedule;            // { frequency: 'weekly'|'biweekly'|'monthly'|'irregular';
                                 //   weekday: Weekday; startTime: string; note?: string }
  venue: Venue;                  // embedded for now; own table when Supabase lands
  pricing: { entry: string; performerPay?: string };   // '£5', 'free', 'bucket'
  howToBook: { audience?: string; performers?: string }; // URLs or instructions — two lenses!
  socials: SocialLinks;          // { website?, instagram?, facebook?, facebookGroup?, tiktok?, youtube? }
  status: NightStatus;           // 'active' | 'paused' | 'gone' — the "Back On" lesson
  lastVerified: string;          // ISO date — freshness is the product
  images?: string[];
}

interface Venue {
  id: string;
  name: string;
  address: string;
  area: string;                  // 'Camden', 'Shoreditch' — Londoners think in areas
  nearestStation?: string;       // 'Angel 🚇' — and in tube stops
  location: { lat: number; lng: number };
}
```

**Account-era entities** (Supabase tables, Phase 3+):

- `profiles` — display name, avatar, role tags (`punter` / `comic` / `promoter`), optional socials.
- `favourites` — user ↔ night. Powers "My nights".
- `attendance` — "I'm going" on a night+date. Powers social proof ("4 going tonight").
- `reports` — "this night is dead / moved / wrong time" with one tap. Crowdsourced freshness.
- `reviews` *(later)* — short text + vibe tags ("rowdy crowd", "good for first-timers"), not star ratings; stars get gamed and feel mean for small nights.

---

## 5. Pages & routes

| Route | Page | Notes |
|---|---|---|
| `#/` | **Browse** | The app. Filter bar + card list, map toggle. Defaults to "on soon". |
| `#/night/:id` | **Night detail** | The entity page — hero, schedule, venue + minimap, socials, how to book (punter & comic tabs), "I'm going", favourite, report. |
| `#/map` | **Map view** | Full-screen Leaflet, pins coloured by night type, tap → bottom-sheet card → detail. |
| `#/tonight` | **Tonight** | Zero-thought view: what's on *today*, sorted by start time. Shareable. |
| `#/my` | **My nights** | Favourites + going. Auth-gated. |
| `#/auth` | **Sign in** | Magic link / Google. |
| `#/submit` | **Add a night** | Form → Supabase `submissions` table for review (Phase 4). |

---

## 6. Build phases

Each phase ships something usable. Stop-and-reassess points between phases — that's the vibe-coding part.

### Phase 0 — Scaffold *(small)*
Vite + React + TS strict + Tailwind + HashRouter + GitHub Actions deploy to Pages. A "hello FindComedy" page live at the real URL before any feature code. Proves the whole pipeline.

### Phase 1 — Browse London nights *(the MVP)*
- `ComedyNight` types, seed dataset of ~30–50 real London nights (hand-curated from public listings; the open-mic-nights data is our field guide for what fields matter).
- Browse page: search + filters (day, area, type, level, bringer, free entry), responsive card grid. **Cards, never tables.**
- Tonight view (it's just a filter preset — cheap and high-value).
- Mobile-first, dark-by-default theme. Comedy happens at night; the app should look like it knows that.

### Phase 2 — The night as an entity
- Night detail page with everything: schedule, pricing, socials row, venue card with minimap, "how to get a spot" vs "how to get a ticket", freshness badge ("verified 3 weeks ago" / "status unknown ⚠️").
- Map view with Leaflet.
- Share links (hash routes make every night linkable).

### Phase 3 — Accounts
- Supabase project + Auth (magic link + Google), RLS policies written *before* any table goes live.
- Profiles, favourites, "I'm going" with going-count on cards and detail pages.
- Night data migrates from local file to Supabase (the `services/` layer makes this invisible to components).

### Phase 4 — The community keeps it alive
- "Report a problem" one-tap freshness reports; stale nights auto-flag after N weeks unverified.
- Submit-a-night form with moderation queue.
- Vibe-tag reviews.
- Promoter claim flow *(stretch)*.

---

## 7. Design direction

- **Dark, warm, a bit cheeky.** Deep charcoal base, a hot accent (amber/red — stage-light vibes), generous rounded cards. Microcopy can be funny; navigation cannot.
- **Mobile-first ruthlessly** — this gets used on a phone, on a bus, at 6pm.
- Typography does the design work: one display face for night names, clean sans for everything else.
- Skeleton states for everything async (CLAUDE.md: no flash of empty UI).

## 8. Idea backlog (unsorted, grab when in the mood)

- **"Surprise me"** button → random night on tonight.
- **ICS export** — "add to calendar" per night, pure client-side.
- **Tube-stop filter** — "what's near Angel?"
- **Comic mode toggle** — flips the whole UI lens: bringer/booking info promoted, ticket info demoted.
- **Lineup announcements** — promoters post tonight's lineup (Phase 4+).
- **Streak/badges** for verified reports — make data freshness a game.
- **Open mic difficulty meter** — crowd size + bringer + sign-up competitiveness.
- **WhatsApp/Telegram share cards** — pre-baked "who's coming to this?" message.
- **Other cities** — the model is city-agnostic; London is just `area`/`city` scoping done right from the start.

## 9. Open questions (decide when we get there)

1. **Seed data sourcing** — hand-curate from venues' own public pages vs. asking the open-mic-nights maintainer for a data blessing. Hand-curation is the safe default.
2. **Supabase vs Firebase** — Supabase is the plan (Postgres + RLS + nicer DX); flip only if something breaks.
3. **Image hosting** — night/venue photos need a home (Supabase Storage when accounts land; until then, no images or hotlink socials' og-images).
4. **Custom domain** — `findcomedy.london`? Affects the Vite `base` config, so decide before Phase 3 deep links spread.

---

*Sources: [Spotties](https://spotties.nl/) · [London Standup Comedy Map](https://apuchitnis.github.io/open-mic-nights/) · [GigGag](https://giggagcomedy.com/) ([Play Store](https://play.google.com/store/apps/details?id=com.giggag.app))*
