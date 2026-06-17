# FindComedy

**Find live comedy nights in London — kept fresh by the people who actually go.**

🔗 **Live:** https://www.findcomedy.xyz

---

## What it is

FindComedy is a directory of London's live comedy circuit: open mics, showcases, and pro slots, all in one place. It exists so you can find the right night in seconds instead of trawling Facebook groups and WhatsApp threads.

Every night is a living entity — clickable, browsable, and shown with the details that actually matter when you're deciding where to go.

## Who it's for

- **Comedians and performers** working the London circuit — hunting for somewhere to gig this week. They're usually on a phone, on the go, and they care about the specifics: night type, level (new / experienced / pro), bringer rules, the area, and the nearest station.
- **Fans and audiences** looking for a good night out, using the same listings to find a room near them.

The product is built performer-first, because that's what the data describes — but it works just as well if you're just trying to laugh on a Tuesday.

## What makes it different

- **The listing is the product.** No ad-cluttered ticketing walls, no generic SaaS gloss. Just the information you need to decide, presented plainly.
- **Honest over slick.** The unglamorous details — bringer rules, the actual level of the room — are shown up front, not buried.
- **Made by locals, for locals.** London-specific cues (areas, nearest stations) over generic geography. It reads like circuit knowledge, not a database.
- **Fast on a phone, in the wild.** Mobile-first and quick to load — for when you're standing on a platform planning your week.

## Features

- Browse and search comedy nights across London
- A detail page for each night with the practical specifics performers care about
- Map view of where nights are happening
- Submit a night, report issues, and vibe-tag reviews from people who've been
- Shareable, link-friendly pages for every night

---

## For developers

Vite · React 18 · TypeScript · Tailwind CSS · Supabase · deployed to Vercel.

```bash
npm install
cp .env.example .env   # add your Supabase URL + anon key (optional — falls back to seed data)
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run typecheck`.

**Database:** SQL lives in [`supabase/`](supabase/). In the Supabase SQL editor, run the files in [`migrations/`](supabase/migrations/) in numeric order, then [`seed_from_csv.sql`](supabase/seed_from_csv.sql) to load the nights. That seed file is generated from the source CSV by [`scripts/importNights.ts`](scripts/importNights.ts) (`npx tsx scripts/importNights.ts`) — don't edit the SQL by hand. [`src/data/nights.ts`](src/data/nights.ts) is the in-app fallback used when Supabase isn't configured.

See [CLAUDE.md](CLAUDE.md) for project conventions, [PRODUCT.md](PRODUCT.md) for the product brief, and [DESIGN.md](DESIGN.md) for the design language.

## License

[MIT](LICENSE)
</content>
</invoke>
