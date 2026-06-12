# FindComedy Redesign — Map-First Browse + 3-Tab Nav

Status: planned, not started
Date: 2026-06-12

## Goal

Collapse the current 5-link nav (Browse / Tonight / Map / Submit / Sign in–My nights)
into **3 tabs**, and merge the Map and Tonight features into Browse as a single
split-view page.

```
┌──────────────────────────────────────────────────────────────┐
│  FindComedy          [ Browse ]  [ Submit ]  [ Sign in ]     │  ← 3 tabs
├──────────────────────────────┬───────────────────────────────┤
│                              │  FilterBar (search, days…)    │
│                              ├───────────────────────────────┤
│          MAP                 │  12 nights tonight            │
│       (Leaflet)              │  ┌─────────────────────────┐  │
│                              │  │ NightCard               │  │
│   ● ● markers follow         │  ├─────────────────────────┤  │
│     the filtered list        │  │ NightCard               │  │
│                              │  ├─────────────────────────┤  │
│  [legend]                    │  │ NightCard            ⌄  │  │  ← list scrolls,
│                              │  └─────────────────────────┘  │    map stays put
└──────────────────────────────┴───────────────────────────────┘
        ~60% (3fr)                       ~40% (2fr)
```

Third tab is auth-aware (already implemented behaviour, just promoted to a tab):
**Sign in** when logged out → **My nights** when logged in.

## Routing changes

| Route | Today | After |
|---|---|---|
| `/` | BrowsePage (grid) | BrowsePage (map + list split, **defaults to tonight**) |
| `/tonight` | BrowsePage with preset | `<Navigate to="/" replace />` |
| `/map` | MapPage | `<Navigate to="/" replace />` |
| `/night/:id` | detail | unchanged (not a tab) |
| `/auth`, `/my`, `/submit` | pages | unchanged (auth/my behind 3rd tab) |

Keep the redirects rather than deleting the routes — old links and browser
bookmarks (hash URLs) keep working.

## Browse page behaviour spec

**Default state = current Tonight page.** On load: `weekday` filter set to
`todayWeekday()`, results sorted by `sortByTime`. Title reads "What's on
tonight" with the date subtitle. The day pill for today is active, so the user
sees *why* they're getting tonight's nights and can tap it off (or pick another
day) to widen out. When the weekday filter is cleared, the title flips to
"London comedy nights" and sorting falls back to default. This removes the
`preset` prop entirely — "tonight" is just a filter state, not a separate mode.

**Map ↔ list sync (the core of the redesign):**

- Markers show exactly the **filtered** list — not all active nights as the
  current MapPage does. Filtering to "Free entry" should thin out the map too.
- Clicking a marker selects the night: marker grows/highlights, the matching
  card scrolls into view in the right panel and gets a ring highlight.
  Replace the current `BottomCard` overlay — the card list *is* the detail
  surface on desktop.
- Hovering a card (desktop) highlights its marker.
- Map does **not** auto-fit bounds on every filter change (jarring); fit once
  on load, then provide a small "recenter" button.

**Mobile (< `md`):** no room for a split. Stack with a toggle:
list view by default, a floating "Map" pill (bottom-center) switches to a
full-height map with the same filters; selected marker shows a compact bottom
card linking to the night (reuse of the existing BottomCard pattern). The
toggle is component state, not a route.

**Layout skeleton:**

```tsx
<div className="h-dvh flex flex-col">
  <Header />                          {/* shrink-0 */}
  <div className="flex-1 min-h-0 md:grid md:grid-cols-[3fr_2fr]">
    <div className="relative h-full">  {/* map; needs real height, see bugs */}
    <div className="h-full overflow-y-auto"> {/* filters + cards */}
  </div>
</div>
```

Cards in the right panel render as a single column (the panel is ~40% wide;
the current 3-col grid only applies if we ever go full-width again).

## New/changed components

Bottom-up order per house rules:

1. **`src/types/comedyNight.ts`** — no new types needed except possibly
   `selectedNightId: string | null` lives in BrowsePage state, not types.
2. **`src/utils/`** — extract `formatTime` / `formatSchedule` out of
   MapPage into `utils/formatSchedule.ts` (NightCard likely duplicates this —
   check and unify). Tests first.
3. **`src/components/Header.tsx`** — the header/nav is currently copy-pasted
   into **7 files** (BrowsePage, MapPage, NightDetailPage, SubmitPage,
   MyNightsPage, AuthPage, HomePage). Extract once, with the 3-tab nav and
   active-tab styling driven by `useLocation`. This is the single highest-value
   refactor in the redesign — without it the tab change must be made 7 times.
4. **`src/features/browse/NightsMap.tsx`** — the Leaflet map as a controlled
   component: props `nights`, `selectedId`, `onSelect`. Move `TYPE_COLORS`,
   `Legend`, `useLeafletCss` here. MapPage.tsx is then deleted.
5. **`src/features/browse/BrowsePage.tsx`** — owns filters + selection,
   composes FilterBar, NightsMap, card list, mobile toggle.
6. **Delete** `src/features/home/HomePage.tsx` (unrouted orphan) and
   `src/features/map/MapPage.tsx` after the merge.

## Other visual improvements (recommended, in priority order)

1. **Shared Header with real tab styling** — current nav links are bare text;
   make the 3 tabs a proper segmented control (pill background on the active
   tab, consistent amber accent). One component = consistent everywhere.
2. **Dark map tiles.** Default OSM tiles are bright white — they'll glow
   against the zinc-950 UI. Switch to a dark tile set (e.g. CARTO
   `dark_all`, free for light use, keyless) so the map reads as part of the
   app rather than a hole punched in it.
3. **Marker → type colour legend as filter.** The legend chips (Open Mic /
   Showcase / Pro / Mixed) can double as type filter buttons — tap "Open Mic"
   in the legend to filter both map and list. Removes a duplicated control.
4. **Card hover/selected states.** Cards need an obvious
   `ring-amber-400` selected state and a subtle hover lift now that they're
   sync'd with the map.
5. **Count + context line** ("12 nights tonight · Thursday 12 June") above the
   list instead of the plain "12 nights" — merges the title/date/count rows
   into one and saves vertical space in the narrower panel.
6. **Empty state with a map nudge** — when filters match nothing, the map
   still shows all-of-London dimmed markers (e.g. 30% opacity, not clickable)
   so the page never looks broken.
7. **Skeletons for the split view** — keep CardSkeleton for the list; give the
   map pane a pulsing zinc block instead of a full-screen spinner.
8. **Freshness cue on cards** — `lastVerified` exists in the data and a
   `freshness.ts` util exists; surface "verified 2w ago" subtly on cards if
   not already shown.
9. **Reduce header height on scroll (mobile)** — with map+list+filters,
   vertical space is precious on phones.

## Bug risks (things that *will* bite if not handled)

**Leaflet-specific — the big ones:**

1. **Map height = 0.** Leaflet requires its container to have a resolved
   height. Inside a CSS grid/flex column, `h-full` chains break silently and
   you get a grey 0-px map. Every ancestor between `h-dvh` and the
   MapContainer needs `h-full`/`flex-1 min-h-0`.
2. **Grey/blank tiles after layout change.** When the map container resizes
   (mobile toggle showing the map, panel collapsing, window resize), Leaflet
   doesn't notice — tiles stay unloaded. Must call `map.invalidateSize()`
   after the container becomes visible/resizes (a `ResizeObserver` on the
   wrapper, or invalidate on toggle).
3. **z-index wars.** Leaflet panes use z-index 400–700 inside their own
   stacking context, but its controls/popups can float above a `z-10` sticky
   header. Current code already papers over this with `z-[1000]` on the
   header and BottomCard. Fix properly: give the map wrapper `isolation:
   isolate` (Tailwind `isolate`) so Leaflet's z-indexes can't escape, then the
   header only needs a sane `z-10`.
4. **Leaflet CSS race.** `useLeafletCss` injects a stylesheet from unpkg at
   runtime — on a slow connection the map renders unstyled (stacked tiles)
   first, and if unpkg is down it never recovers. Import
   `leaflet/dist/leaflet.css` from the installed package in `main.tsx`
   instead; it bundles with Vite and respects the `/FindComedy/` base path.
5. **Marker click vs `<Popup>`.** Markers currently have both a click handler
   (selection) and a Popup. With list-sync selection, the popup fights the
   card highlight. Drop the Popup, or the first click opens a popup that
   covers neighbouring markers.

**State/logic:**

6. **Stale "today" after midnight.** `todayWeekday()` is captured in the
   `useState` initializer. A tab left open past midnight keeps yesterday's
   default. Acceptable for v1, but the title says "tonight" — compute the
   *label* date at render so at minimum the text isn't wrong.
7. **Route-key remount is load-bearing today.** `key="browse"` /
   `key="tonight"` in App.tsx forces a state reset when switching tabs.
   Removing the `/tonight` route removes the mechanism — fine, but don't
   reintroduce a `preset` prop that only works on mount.
8. **Selection invalidated by filters.** If a night is selected and the user
   changes filters so it's filtered out, the selected marker disappears but
   stale selection state can keep a highlight/scroll target pointing at a card
   that no longer renders. Derive: `selected = filtered.find(n => n.id === selectedId) ?? null`.
9. **Duplicate fetches.** BrowsePage and (currently) MapPage each call
   `useNights()` = one fetch per mount, refetched on every tab switch. After
   the merge it's one call on Browse, but NightDetailPage still refetches.
   Not a redesign blocker; note it as a future lift to context.
10. **Nights with missing/zero coordinates.** A submitted night without
    lat/lng (or `0,0`) renders a marker off the coast of Africa. Filter
    map markers to nights with plausible London coords; they still appear in
    the list.
11. **`scrollIntoView` scrolling the page, not the panel.** Card-scroll on
    marker click must target the scrollable panel
    (`block: 'nearest'` + the panel being the only scroll container) or the
    whole viewport jumps and the sticky header overlaps the card.

**Mobile/layout:**

12. **`100vh` vs mobile browser chrome.** `h-screen` under-scrolls on iOS
    Safari (URL bar). Use `h-dvh` (Tailwind ≥3.4) for the page shell.
13. **Two scroll containers + body scroll.** The page must stop scrolling the
    body (`overflow-hidden` on the shell) or the list panel and body fight,
    especially with the on-screen keyboard open while typing in search.
14. **Map gestures vs page scroll on touch.** A full-width map pane swallows
    vertical swipes. On the mobile map view that's fine (it's full-screen by
    intent); just don't put the map inline above the list on mobile.

## Atomic task plan (layer order)

| # | Task | Verify |
|---|---|---|
| 1 | Add `leaflet` CSS via package import in `main.tsx`; remove `useLeafletCss` | map still styled in dev |
| 2 | `utils/formatSchedule.ts` + tests (move from MapPage, unify with NightCard) | `npm test` |
| 3 | `components/Header.tsx` with 3 tabs (auth-aware 3rd tab) + swap into all 7 pages | visual check each route |
| 4 | `features/browse/NightsMap.tsx` (controlled: `nights`, `selectedId`, `onSelect`) | renders in isolation on `/` behind a temp flag or directly |
| 5 | BrowsePage split layout, desktop only — map left 3fr, existing list right 2fr | dev server, resize window |
| 6 | Tonight-default filters in BrowsePage; delete `preset`; title derives from `filters.weekday` | `/` shows tonight's nights sorted by time |
| 7 | Marker↔card selection sync (select, highlight, scrollIntoView) | click marker → card highlights |
| 8 | Mobile list/map toggle + BottomCard on map view | devtools mobile viewport |
| 9 | Routing: `/tonight` + `/map` → redirects; delete MapPage, HomePage | old URLs land on `/` |
| 10 | invalidateSize on toggle/resize; `isolate` on map wrapper; coord sanity filter | toggle map on mobile width, no grey tiles |
| 11 | Visual pass: dark tiles, legend-as-filter, selected card ring, count line | dev server |
| 12 | `npm run build` + `npm test` + click-through of all routes | green |

## Definition of done

- 3 tabs only; `/tonight` and `/map` redirect to `/`.
- `/` defaults to tonight's nights, time-sorted, map left / list right on desktop.
- Marker and card selection stay in sync both directions.
- Mobile has a working list/map toggle with no grey-tile or scroll-trap bugs.
- `npm run build` and `npm test` pass; no duplicated header markup remains.
