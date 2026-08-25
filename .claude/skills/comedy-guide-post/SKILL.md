---
name: comedy-guide-post
user-invocable: true
description: Write a new FindComedy "Guides" blog post (e.g. "Best Cheap Comedy Clubs in X") — picks real venues from live Supabase data, researches price/photos, and publishes it.
---

# FindComedy Guide Post

Produces one entry in `src/data/guides.ts` — a city/borough "best of" post under `/guides/:slug`. The architecture (types, resolver, components, prerender) already exists; this skill is only about producing correct, non-stale content inside it. Do not recreate `src/types/guide.ts`, `src/utils/guideVenues.ts`, `src/features/guides/*`, or the `vite.config.ts` prerender functions — reuse them.

## Inputs needed from the user

- City/borough (e.g. "Hackney")
- Angle (e.g. "cheap", "best", "open mic") — determines the title/hook
- Selection rule if not obvious: top N by what? (Instagram followers is the default proxy for "popular" unless told otherwise)

## Step 1 — Pull real candidates from the LIVE database, not the seed file

`src/data/nights.ts` is a **local dev fallback only**. The live site's data comes from Supabase and will not match it. Never pick a `nightId` from the seed file — verify it exists in production first.

Write a throwaway Node script at the repo root (delete it when done — never commit it):

```js
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }))
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
const { data } = await client.from('nights').select('*')
const matches = data.filter(r => r.status === 'active' && JSON.stringify(r).toLowerCase().includes('<city>'))
for (const r of matches) console.log(r.id, '|', r.name, '|', r.venue?.name, '|', JSON.stringify(r.socials))
```

Run with `node <script>.mjs`. This gives real `id`s, venue names/addresses, schedules, bringer policy, and Instagram handles — the only valid source of `nightId` values for the guide.

## Step 2 — Rank and filter candidates

For every candidate with an Instagram handle, check follower count and bio (`browser_navigate` + `browser_evaluate` on `document.querySelector('header')?.innerText`). This surfaces the ranking signal (followers) and, just as important, red flags that override ranking:

- Bio in past tense ("this **was** a weekly show... until it wasn't") → defunct, exclude regardless of follower count.
- Bio says on hiatus / "back in [month]" → exclude for now.
- Bio's address doesn't match the DB record's venue → do not attach that account's price/photo to the listing; either drop it or caveat the mismatch explicitly. Do not silently guess which one is right.
- DB `last_verified` more than ~1 year old → keep if the socials still look alive, but caveat it in the post.

Pick the top N that survive filtering. Fewer, verified entries beat padding to a round number with a bad fit.

## Step 3 — Verify price per venue

`ComedyNight` has no price field — this is always researched separately, never guessed. Check, in order: the night's Eventbrite/TicketTailor/DesignMyNight listing (most authoritative, often has an exact figure), then the Instagram bio/recent posts. Watch for stale numbers — a listing's own site can disagree with what search snippets say (e.g. a night that was "£1" is now "£4"). If genuinely unconfirmable, don't publish a guess — write a caveat instead ("we couldn't verify a price for this address — check before you go").

Bringer-required / new-material nights are free by convention (acts bring an audience instead of paying a fee) — that's a legitimate basis for "Free", not a guess.

## Step 4 — Get one photo per venue, self-hosted

Never hotlink Instagram — its CDN URLs are signed and expire within hours/days, so a hotlinked `<img>` breaks itself.

1. `browser_navigate` to the Instagram profile (logged out is fine).
2. `browser_evaluate`: `() => Array.from(document.querySelectorAll('img')).map(i => ({src: i.src, alt: i.alt, w: i.naturalWidth})).filter(i => i.src.includes('fbcdn') && !i.src.includes('s150x150'))` — this excludes the tiny 150×150 profile-picture avatar and returns real feed images (usually 640–1440px). **Do not use the profile picture** — at that resolution it comes out blurry once stretched to fill a card.
3. Prefer an image that is: current (matches today's/this week's date if it's a flyer), a real show photo or poster (not a meme, not an unrelated repost), and has its branding/title near the top of the frame rather than the center or bottom.
4. Download it: `curl -sL -A "Mozilla/5.0" -o "public/guides/<venue-slug>.jpg" "<url>"`, then `Read` the file to sight-check it before committing to it — Instagram feeds contain flyers, memes, and event-agnostic posts, and only reading it tells you which one you actually grabbed.
5. Reference it in the guide entry as `image: { url: '/guides/<venue-slug>.jpg', credit: '<Account Name>', creditUrl: '<instagram profile url>' }`. The card renders this with `object-cover object-top` at `aspect-square` and a "Photo: {credit}" overlay linking back — this is already wired up, just supply the three fields.

If a flyer shows named individual performers, that's fine to use (the venue posted it for exactly this kind of reuse) — just don't manufacture a caption implying it's this week's lineup if the post is older.

## Step 5 — Write the entry

Add one object to the `guides` array in `src/data/guides.ts`:

```ts
{
  slug: '...',
  city: '...',
  areaSlug: '...',       // matches the /comedy/:areaSlug slug for this borough
  title: '...',
  hook: '...',            // one line, shown on the /guides index card
  metaTitle: '...',
  metaDescription: '...',
  publishedDate: 'YYYY-MM-DD',
  intro: '...',
  venues: [
    {
      nightId: '...',              // from Step 1, verified against live data
      editorialNote: '...',        // see voice rules below
      priceNote: '...',            // from Step 3
      caveat: '...',               // optional, from Step 2/3 red flags
      image: { url, credit, creditUrl },  // from Step 4
    },
  ],
  closingNote: '...',
}
```

`resolveGuideVenues` joins each `nightId` against live nights at both build time and runtime, so schedule/address/venue name are never hand-typed — only the editorial layer (note, price, caveat, image) is.

### Voice rules

- Write for the person searching "cheap comedy [city]" or "open mic [city]" — not for whoever built the post. Never narrate the research process ("we checked...", "we picked the top 3...", "FindComedy's own record shows...") anywhere in `intro`, `editorialNote`, or `caveat`. State facts about the venue directly.
- Address both audiences in the same sentence where it's natural: what it costs / how to watch, and the bringer policy for anyone who wants a spot. Don't write purely from a performer's-eye view ("put your name down") or purely for punters — both read this page.
- A `caveat`, if present, should read as a normal travel-blog caution ("small pub shows can move at short notice — check their Instagram on the day") — never as a reference to FindComedy's internal data state (no "hasn't been reverified since 2023", no "our own record").

### No AI slop

Every string in the guide — `hook`, `intro`, `editorialNote`, `caveat`, `closingNote` — gets checked against this list before it ships. These are concrete failures found in earlier drafts of this feature, not a vibe:

- **No unverified superlatives.** "London's biggest", "the best", "world-class" — don't write it unless you have a source that actually ranks it against competitors. State the specific fact you did verify instead (e.g. "runs four nights a week across the city" beats "London's biggest new-material circuit").
- **No rhetorical-question openers or CTAs.** "Looking for more?", "Ever wondered where to catch cheap comedy?" — say the thing directly instead of asking a question you're about to answer yourself.
- **No hype-speculation.** "You might catch tomorrow's headliner", "hidden gem", "secret spot the locals don't want you to know about" — describe what's true tonight, not a cinematic maybe.
- **No padding triads.** If a sentence lists three things only to sound complete ("free entry, pay-what-you-want buckets, and new-material nights where..."), cut it to what's actually load-bearing.
- **No em dashes.** They're the single most recognizable AI tell, full stop. Rewrite as two sentences, or use a comma with a conjunction ("so", "and", "while") when the clauses need to stay joined. If you catch yourself reaching for one, that's the signal the sentence needs restructuring, not punctuating.
- **No "not just X, it's Y" / "isn't just about X" contrast constructions.** Say what it is.
- **No scene-setting adjective stacking** — "vibrant", "bustling", "charming", "nestled", "iconic". If the fact needs an adjective to be interesting, the fact isn't interesting enough yet; find a sharper concrete detail instead (address, price, what happens at the door).
- Read every string out loud once before publishing. If it sounds like the voiceover on a listicle video, rewrite it.

## Step 6 — Verify before calling it done

1. `npm test -- --run` — full suite must stay green (the resolver/util layer has its own tests already; you're not expected to add new ones for a content-only change).
2. `npm run build` — this typechecks and prerenders `dist/guides/<slug>.html`; confirm the console log shows the guide page count and that `og:image` in the generated HTML resolves to your `/guides/<file>.jpg` path, not `undefined`.
3. Start `npm run dev`, navigate to `/guides` and `/guides/<slug>` with the browser tool, and actually look at it — check the photo isn't blurry/cropped wrong, the price badge is right, and the caveat (if any) renders. Screenshots, not just "it built".
4. Delete any scratch Supabase-query script from the repo root before finishing — never commit it.

## What NOT to do (all previously tried and wrong for this codebase)

- Don't pick venues by web-searching "best comedy [city]" and writing about whatever comes up — that produces venues absent from FindComedy's own listings, which defeats the point of the feature (dead-end for readers, no internal link value).
- Don't use `src/data/nights.ts` as if it were live data.
- Don't hotlink any Instagram image URL directly in `image.url`.
- Don't use the Instagram profile picture as the photo — it's 150×150 and looks blurry at card size.
- Don't skip the price research and just omit it silently, and don't invent a number — verified or explicitly caveated, no third option.
- Don't write copy that describes the selection methodology to the reader.
