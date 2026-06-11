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

SQL lives in [`supabase/`](supabase/). Run `migrations/001_schema.sql` then `seed.sql` in the Supabase SQL editor. `seed.sql` is generated from [`src/data/nights.ts`](src/data/nights.ts) — edit the data there and run `npm run seed:gen`, don't edit the SQL by hand.

## License

[MIT](LICENSE)
