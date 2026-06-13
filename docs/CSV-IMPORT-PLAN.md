# Import Plan: Stand Up Data CSV → Supabase

Source file: `docs/stand up data.csv` (~617 entries)

---

## Overview

Five work streams, in order:

1. **Delete** the existing seeded data (it is fabricated)
2. **Migrate** the schema to match what the CSV actually provides
3. **Update** TypeScript types and any components that reference removed fields
4. **Build** a Node import script that parses the CSV and emits INSERT SQL
5. **Run** the SQL in the Supabase dashboard

---

## Step 1 — Delete existing data

Run this in the Supabase SQL editor **before** the migration.  
`ON DELETE CASCADE` on `favourites` and `attendance` means this is safe.

```sql
-- 005_delete_seeded_nights.sql
DELETE FROM public.nights;
```

Do **not** use `TRUNCATE … CASCADE` — it also resets sequences and is harder to scope.
The seed data in `supabase/seed.sql` is kept for reference but should not be re-run.

---

## Step 2 — Schema migration (006_csv_import_schema.sql)

### 2a. Add `wheelchair_accessible` column

The CSV "Wheelchair Access" values are: `Yes`, `No`, `Stairs`, `TBC`, free-text sentences.  
Normalise to a nullable boolean: `Yes → true`, `No / Stairs / other negatives → false`, `TBC → NULL`.

```sql
ALTER TABLE public.nights
  ADD COLUMN IF NOT EXISTS wheelchair_accessible BOOLEAN;
```

Store the raw CSV string as a note inside `venue` JSONB if exact wording matters:
```jsonb
"venue": { ..., "wheelchairNote": "No wheelchair access unless in summer marquee" }
```

### 2b. Drop `pricing` column

The CSV has no entry price data. `pricing.entry` is currently used in:

- `src/utils/filterNights.ts:14` — `isFreeEntry()` check
- `src/components/NightCard.tsx:38,87` — displays entry price and "Free entry" badge

Once `pricing` is removed those code paths need updating (see Step 3).

```sql
ALTER TABLE public.nights DROP COLUMN IF EXISTS pricing;
```

### 2c. Simplify `how_to_book`

The CSV has a single "Contact / Book a Spot" field.  
Replace the two-sub-field JSONB structure `{ audience, performers }` with a flat string stored under the key `contact`.

No DDL change needed (column stays JSONB); only the shape of data written to it changes.  
Existing rows are deleted in Step 1 so no backfill required.

New shape:
```jsonb
{ "contact": "https://confirmed.show/surveys/ditchycomedy" }
```

### 2d. `last_verified` — use CSV "Last Update"

The column already exists and is type `DATE`.  
CSV dates are formatted `DD/MM/YYYY`. Parse accordingly in the import script.

---

## Step 3 — TypeScript type + component updates

### 3a. `src/types/comedyNight.ts`

```diff
 export interface ComedyNight {
   …
-  pricing: { entry: string; performerPay?: string }
-  howToBook: { audience?: string; performers?: string }
+  howToBook: { contact: string }
+  wheelchairAccessible: boolean | null
   …
 }
```

Remove `pricing` entirely from the interface.

Update `NightSubmission` similarly:
- Remove `entry`, `performerPay`
- Replace `audienceBooking` + `performerBooking` with `contact`

### 3b. `src/utils/filterNights.ts`

The `freeEntry` filter relied on `pricing.entry`.  
Since entry pricing is no longer stored, **remove the `freeEntry` filter entirely** from `NightFilters`, `DEFAULT_FILTERS`, and `filterNights()`.  
Remove the filter UI control from whatever component renders it.

### 3c. `src/components/NightCard.tsx`

Remove the entry-price display block (lines 38, 85-89).

### 3d. `src/services/nightsService.ts`

Remove `pricing` from the row-to-object mapping and the object-to-row mapping.

### 3e. `src/services/submissionsService.ts`

Update `howToBook` construction to use `{ contact: form.contact }`.

### 3f. Tests

Update fixtures in:
- `src/utils/__tests__/filterNights.test.ts`
- `src/utils/__tests__/formatSchedule.test.ts`
- `src/services/__tests__/nightsService.test.ts`

Remove `pricing: { entry: 'Free' }` from mock objects and add `wheelchairAccessible: null`.

---

## Step 4 — Import script

Create `scripts/importNights.ts` (or `.js`).  
It reads the CSV, maps each row to a `ComedyNight`, and writes `supabase/seed_from_csv.sql`.

### Field mapping

| CSV column | DB column / JSONB path | Transformation |
|---|---|---|
| Name | `name` | Direct |
| Event Category | `type` | See mapping table below |
| Comedian Level | `levels` | Split on `,`, lowercase, map to `Level[]` |
| Event Description | `description` | Direct |
| Frequency | `schedule.frequency` | See mapping table below |
| Weekday / Month | `schedule.weekday` | See mapping table below |
| Event Time | `schedule.startTime` | Direct (already `HH:MM`) |
| Bringer | `bringer.required`, `bringer.note` | See mapping table below |
| Wheelchair Access | `wheelchair_accessible` | `Yes → true`, `No/Stairs → false`, `TBC → null` |
| Contact / Book a Spot | `how_to_book.contact` | Direct |
| Venue | `venue.name` | Direct |
| Address | `venue.address` | Direct |
| Latitude | `venue.location.lat` | `parseFloat` |
| Longitude | `venue.location.lng` | `parseFloat` |
| Website | `socials.website` | Direct |
| Facebook Page | `socials.facebook` | Direct |
| Facebook Group | `socials.facebookGroup` | Direct |
| Instagram | `socials.instagram` | Prefix `@` → `https://instagram.com/` |
| Twitter | — | **Omit** (platform deprecated) |
| Last Update | `last_verified` | Parse `DD/MM/YYYY` → `YYYY-MM-DD` |

**Not imported:** entry pricing (column removed), performer pay (no data in CSV).

---

### Event Category → `type`

| CSV value(s) | `type` |
|---|---|
| `Open mic` | `open-mic` |
| `Show` | `showcase` |
| `Open mic, Show` (any combo of both) | `mixed` |
| `Show, Course` / `Show, Workshop` / `Show, Competition` | `showcase` |
| `Open mic, Workshop` / `Open mic, Competition` | `open-mic` |
| `Festival` | **Skip row** (not a comedy night) |
| `Course` or `Workshop` alone | **Skip row** |
| `Unspecified` or blank | `mixed` |

Rule of thumb: if both Open mic and Show appear → `mixed`; otherwise follow the primary category.

---

### Comedian Level → `levels`

| CSV value | `levels` |
|---|---|
| `New` | `['new']` |
| `Experienced` | `['experienced']` |
| `Pro` | `['pro']` |
| `New, Experienced` | `['new', 'experienced']` |
| `New, Experienced, Pro` | `['new', 'experienced', 'pro']` |
| `Experienced, Pro` | `['experienced', 'pro']` |
| `Unspecified` / blank | `[]` |

---

### Frequency → `schedule.frequency`

| CSV value | `frequency` |
|---|---|
| `Weekly` / `Daily` | `weekly` |
| `Fortnightly` | `biweekly` |
| `Monthly` | `monthly` |
| `Annually` / `Quarterly` / `Other` | `irregular` |

---

### Weekday → `schedule.weekday`

When the CSV lists multiple days (e.g. `Tuesday, Wednesday`), use the **first** day and store the others in `schedule.note`.

| Day | Value |
|---|---|
| Sunday | 0 |
| Monday | 1 |
| Tuesday | 2 |
| Wednesday | 3 |
| Thursday | 4 |
| Friday | 5 |
| Saturday | 6 |
| `Unspecified` / blank | `null` (stored as `null` in JSONB) |

---

### Bringer → `bringer`

| CSV value | `required` | `note` |
|---|---|---|
| `Yes` | `true` | — |
| `No` | `false` | — |
| `Yes, except for longer spots` | `true` | `"Not required for longer spots"` |
| `TBC` | `false` | — |
| Any other free text | `true` | raw value |

---

### ID generation

Slugify `name` + `venue.name`:
```
"2nd Row Comedy" + "Piehole Shoreditch" → "2nd-row-comedy-piehole-shoreditch"
```
Use a basic slugify (lowercase, replace non-alphanumeric with `-`, trim `-`).

---

### Venue `area` and `nearestStation`

The CSV does not include these fields. Leave both as empty string `""`.  
They can be backfilled later if needed.

---

### Default values for missing data

| Field | Default |
|---|---|
| `status` | `active` |
| `images` | `null` |
| `schedule.note` | omit unless multiple weekdays |
| `socials` fields | omit if blank / `TBC` |
| `bringer.count` | omit |

---

## Step 5 — Run in Supabase

Order of execution in the SQL editor:

1. `supabase/migrations/005_delete_seeded_nights.sql` — clears existing rows
2. `supabase/migrations/006_csv_import_schema.sql` — schema changes
3. `supabase/seed_from_csv.sql` — generated by the import script

---

## Checklist

- [ ] Step 1: delete SQL written and reviewed
- [ ] Step 2: migration SQL written and reviewed
- [ ] Step 3a: `ComedyNight` type updated, `NightSubmission` updated
- [ ] Step 3b: `freeEntry` filter removed from `NightFilters`, utils, UI
- [ ] Step 3c: `NightCard` entry price block removed
- [ ] Step 3d–3e: service mappings updated
- [ ] Step 3f: test fixtures updated, `npm test` passes
- [ ] Step 4: import script written and produces valid SQL
- [ ] Manual review: spot-check 10 generated rows against CSV source
- [ ] Step 5: SQL executed in Supabase, row count confirmed (~600)
- [ ] `npm run build` passes with no type errors
