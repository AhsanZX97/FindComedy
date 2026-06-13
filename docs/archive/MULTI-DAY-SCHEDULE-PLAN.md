# Multi-Day Schedule Plan

## Problem

A comedy night can only be recorded as running on **one** weekday at **one**
cadence/time. In reality a single night often runs on several days — sometimes at
different times or cadences — e.g. an open mic that runs **Monday & Wednesday
weekly at 8pm and the first Friday of the month at 7pm**. The submit form, the data
model, and every page that reads `schedule.weekday` assume exactly one of each.

We also want the browse day filter to be **multi-select**: clicking Sat then Mon
shows nights on either day; re-clicking a day removes it.

## Decision: model — Option B (schedule array)

`ComedyNight.schedule: Schedule` becomes **`schedules: Schedule[]`**. Each entry
keeps its own `frequency`, `weekday`, `startTime`, and optional `note`, so one night
can carry genuinely different cadences/times per day. This is the full multi-event
model — chosen deliberately over the simpler "one cadence, many days" array.

Implication: **every consumer of `schedule` now iterates over a list.** Display,
sort, and filter all change shape. That is the cost of Option B and it is spread
across the tasks below.

### Filter model

`NightFilters.weekday: Weekday | null` becomes **`weekdays: Weekday[]`** (selected
days). Empty array = no day filter (show everything). A night matches if **any** of
its `schedules` falls on **any** selected day.

## Backward compatibility (must-have)

Stored data has the **old** shape — a single `schedule` object with `weekday`:
- Seed data in `src/data/nights.ts`: `schedule: { frequency, weekday, startTime }`.
- Supabase `nights.schedule` JSONB column, written by `nightsService.nightToRow`
  and `scripts/importNights.ts`.
- Live DB rows already hold the singular `schedule`.

Reads must tolerate both. A normaliser converts legacy `schedule: {…, weekday}` into
`schedules: [{…}]`. We migrate the seed file + import script to write the array shape
going forward. The Supabase column should gain a `schedules` JSONB column (the old
`schedule` column can stay until rows are migrated — task 12); until then the
normaliser reads whichever is present, so the feature does **not** block on a DB
migration.

---

## Atomic tasks (bottom-up: types → normaliser → utils → form fields → screens → data)

### 1. Types — `src/types/comedyNight.ts`
- [ ] `ComedyNight`: replace `schedule: Schedule` with `schedules: Schedule[]`.
- [ ] `Schedule` stays as-is (`frequency`, `weekday`, `startTime`, `note?`) — it is
      now the per-entry shape.
- [ ] `NightSubmission`: replace the flat `frequency` / `weekday` / `startTime` /
      `scheduleNote` fields with `schedules: Schedule[]`.
- [ ] `NightFilters`: replace `weekday: Weekday | null` with `weekdays: Weekday[]`.
- [ ] `DEFAULT_FILTERS`: `weekday: null` → `weekdays: []`.
- Verify: `npm run build` now flags every consumer — that list is the rest of
  this plan.

### 2. Normaliser — `src/utils/normalizeSchedules.ts` (new) + test first
- [ ] `__tests__/normalizeSchedules.test.ts`:
  - legacy single object `{ frequency, weekday: 3, startTime }` → `[{ … }]`
  - new array `[{…},{…}]` → unchanged
  - missing/`null` → `[]`
  - drops entries with no `weekday` when `frequency !== 'irregular'`
- [ ] Implement `normalizeSchedules(raw: unknown): Schedule[]` — accepts the legacy
      object or the new array and always returns an array.
- [ ] Call it in `nightsService.rowToNight`: `schedules: normalizeSchedules(row.schedules ?? row.schedule)`.

### 3. Display — `src/utils/formatSchedule.ts` + test
- [ ] Keep `formatTime` unchanged.
- [ ] Change `formatSchedule(night)` to format **each** schedule and join. Decide a
      single line vs multi-line:
  - Recommended: one short line per schedule, joined with `" · "` for the card,
    e.g. `"Every Mon 8pm · Every Wed 8pm · Monthly 1st Fri 7pm"`. Extract a
    `formatScheduleEntry(s: Schedule): string` helper so the detail page can reuse it.
- [ ] Update `__tests__/formatSchedule.test.ts`: multi-entry nights, single-entry
      (unchanged output), and an `irregular` entry (time only).

### 4. Filter + sort — `src/utils/filterNights.ts` + test
- [ ] `filterNights`: replace the weekday equality with
      `filters.weekdays.length > 0 && !night.schedules.some(s => filters.weekdays.includes(s.weekday))` → exclude.
- [ ] `sortByTime`: a night has multiple times now — sort by its **earliest**
      `startTime` (`Math.min`-style over `schedules`). Add a small
      `earliestStartTime(night)` helper.
- [ ] Update `__tests__/filterNights.test.ts`: night with schedules on [1] and [3]
      matches when filter `weekdays` includes 3; empty `weekdays` returns all active;
      sort uses earliest time.

### 5. Schedule form field — `src/components/NightFormFields.tsx`
- [ ] `ScheduleSection` becomes a **repeater**. Props change to
      `schedules: Schedule[]` / `onSchedulesChange: (v: Schedule[]) => void`.
- [ ] Render one editable row per schedule: Frequency `<select>`, Day `<select>`,
      Start time input, and a Schedule-note input (reuse existing `inputCls` /
      `selectCls`). Each row has a **Remove** button; a **+ Add another day/time**
      button appends a new entry (default `{ frequency: 'weekly', weekday: 1,
      startTime: '20:00' }`).
- [ ] Enforce at least one entry. For non-`irregular` entries a day is required.
- [ ] Keep the component under ~150 lines — if the repeater pushes it over, extract a
      `ScheduleRow` subcomponent in the same file.

### 6. Submit screen — `src/features/submit/SubmitPage.tsx`
- [ ] `EMPTY`: drop `frequency`/`weekday`/`startTime`/`scheduleNote`; add
      `schedules: [{ frequency: 'weekly', weekday: 1, startTime: '20:00' }]`.
- [ ] Pass `schedules={form.schedules}` / `onSchedulesChange={(v) => set('schedules', v)}`.

### 7. Admin edit screen — `src/features/admin/AdminNightForm.tsx`
- [ ] Pass `schedules={night.schedules}` /
      `onSchedulesChange={(v) => set('schedules', v)}`.

### 8. Approve path — `src/services/submissionsService.ts`
- [ ] In `approveSubmission`, build the night with `schedules: form.schedules`
      instead of the single `schedule` object.

### 9. Detail page — `src/features/night/NightDetailPage.tsx`
- [ ] Replace the single `scheduleFreq`/`scheduleDay`/`scheduleTime` block with a map
      over `night.schedules`, rendering one line each (reuse `formatScheduleEntry`
      from task 3). Show each entry's `note` under its line.

### 10. Card — `src/components/NightCard.tsx`
- [ ] No logic change if it calls `formatSchedule(night)` — verify the joined string
      still fits the card layout; if too long, cap at the first 2 entries + "+N more".

### 11. Browse filter UI — `src/features/browse/FilterBar.tsx` + `BrowsePage.tsx`
**FilterBar:**
- [ ] Day pills become multi-select: `active={filters.weekdays.includes(value)}`,
      and `onClick` toggles membership (add if absent, remove if present) instead of
      `toggle('weekday', value, null)`.
- [ ] `hasActiveFilters`: `filters.weekdays.length > 0` replaces `weekday !== null`.

**BrowsePage:** (explicitly requested behaviour)
- [ ] Initial state: `weekdays: [todayWeekday()]` instead of `weekday: todayWeekday()`.
- [ ] `filtered` memo: apply `sortByTime` when `filters.weekdays.length > 0`.
- [ ] `isTonight`: true only when `weekdays.length === 1 && weekdays[0] === todayWeekday()`.
- [ ] `pageTitle` / `countLine`:
  - 0 days → "London comedy nights"
  - 1 day, today → "What's on tonight" (+ date line)
  - 1 day, not today → `"${WEEKDAY_LONG[day]} nights"`
  - 2+ days → join names, e.g. `"Saturday & Monday nights"` (or
    `"Selected nights"` if you prefer not to enumerate).

### 12. Seed + scripts + DB
- [ ] `src/data/nights.ts`: change every `schedule: { … }` to
      `schedules: [{ … }]`.
- [ ] `scripts/importNights.ts`: `mapWeekday` parses a multi-day string
      (comma/`&`/`and`) into multiple entries; build a `schedules` array and write the
      `schedules` column instead of `schedule`.
- [ ] `scripts/generate-seed.ts`: update the column list (`schedule` → `schedules`)
      and the `jsonb(night.schedule)` call to `jsonb(night.schedules)`.
- [ ] Supabase: add a `schedules` JSONB column. One-off update to backfill existing
      rows from `schedule`. Not required to ship (normaliser reads either), so this
      can land after the UI.

---

## Definition of done
- [ ] `npm run build` passes (catches every missed `schedule` consumer).
- [ ] `npm test` passes — new/updated tests for normaliser, formatSchedule, filter+sort.
- [ ] Submit form lets you add/remove multiple schedule rows, each with its own
      frequency/day/time; submission stores `schedules`.
- [ ] Detail page and cards render every schedule line; legacy single-schedule nights
      (old DB/seed shape) load without crashing via the normaliser.
- [ ] Browse day filter is multi-select: clicking Sat then Mon shows both; re-click
      removes; clearing all shows everything.
- [ ] No `console.log`, no `any`, no commented-out code.

## Out of scope
- Week-of-month precision for `monthly` (e.g. "first Monday") — `Schedule` still
  doesn't encode which week. Unchanged by this work.
- Per-schedule pricing/bringer differences — bringer stays night-level.
