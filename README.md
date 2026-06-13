# FindComedy

Find live comedy nights in London. Every night is a living entity — clickable, social, and kept fresh by the people who go.

**Live:** https://degreatahsan.github.io/FindComedy/

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · Supabase · deployed to GitHub Pages.

## Local development

```bash
npm install
cp .env.example .env   # add your Supabase URL + anon key (optional — falls back to seed data)
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run typecheck`.

## Database

SQL lives in [`supabase/`](supabase/). In the Supabase SQL editor, run the files in [`migrations/`](supabase/migrations/) in numeric order (`001_schema.sql` → `006_csv_import_schema.sql`), then [`seed_from_csv.sql`](supabase/seed_from_csv.sql) to load the nights.

`seed_from_csv.sql` is generated from the source CSV by [`scripts/importNights.ts`](scripts/importNights.ts) (`npx tsx scripts/importNights.ts`) — don't edit the SQL by hand. [`src/data/nights.ts`](src/data/nights.ts) is the in-app fallback dataset used when Supabase isn't configured.

## License

[MIT](LICENSE)
