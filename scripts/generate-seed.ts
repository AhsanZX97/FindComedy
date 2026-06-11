// Generates supabase/seed.sql from the canonical night data in src/data/nights.ts.
// Run with: npm run seed:gen
// Keeping a single source of truth avoids the app data and the SQL seed drifting apart.
import { writeFileSync } from 'node:fs'
import nights from '../src/data/nights'
import type { ComedyNight } from '../src/types/comedyNight'

const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`
const jsonb = (value: unknown): string => `${quote(JSON.stringify(value))}::jsonb`
const textArray = (values: string[]): string =>
  values.length === 0 ? `ARRAY[]::text[]` : `ARRAY[${values.map(quote).join(',')}]::text[]`

const columns = [
  'id', 'name', 'description', 'type', 'levels', 'bringer', 'schedule',
  'venue', 'pricing', 'how_to_book', 'socials', 'status', 'last_verified',
]

const rowValues = (night: ComedyNight): string =>
  [
    quote(night.id),
    quote(night.name),
    quote(night.description),
    quote(night.type),
    textArray(night.levels),
    jsonb(night.bringer),
    jsonb(night.schedule),
    jsonb(night.venue),
    jsonb(night.pricing),
    jsonb(night.howToBook),
    jsonb(night.socials),
    quote(night.status),
    quote(night.lastVerified),
  ].join(', ')

const sql = `-- ============================================================
-- FindComedy — seed data (${nights.length} London comedy nights)
-- AUTO-GENERATED from src/data/nights.ts — do not edit by hand.
-- Regenerate with: npm run seed:gen
-- Run AFTER 001_schema.sql in the Supabase SQL editor.
-- ============================================================

INSERT INTO public.nights (${columns.join(', ')}) VALUES
${nights.map((night) => `  (${rowValues(night)})`).join(',\n')}
ON CONFLICT (id) DO NOTHING;
`

const outPath = new URL('../supabase/seed.sql', import.meta.url)
writeFileSync(outPath, sql)
console.log(`Wrote ${nights.length} nights to supabase/seed.sql`)
