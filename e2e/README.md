# E2E tests (Playwright + playwright-bdd)

Browser-level acceptance tests for the critical user journeys. Pure logic stays
in Vitest (`src/**/__tests__`); this suite covers cross-page behaviour only.

Every spec is **hermetic** — all Supabase REST/Auth and Nominatim traffic is
intercepted in the browser, so no test touches a real backend. Combined with the
dead host in `.env.e2e`, a missed request can never reach production.

## Running

```bash
npm run test:e2e          # everything
npm run test:e2e:smoke    # @smoke only — fast PR gate
npm run test:e2e:ci       # everything except @wip
npm run test:e2e:ui       # Playwright UI mode
```

`bddgen` (run automatically by the scripts) generates Playwright specs from the
`.feature` files into `.features-gen/`. The Vite dev server is started for you in
`--mode e2e`.

## Layout

```
features/   .feature files, grouped by domain (browse, night, submit, auth, …)
steps/      step definitions — thin orchestration, zero raw locators
pages/      Page Object Models — the ONLY place selectors live
support/    fixtures, the seedable Supabase mock, and test-data factories
```

## The three-layer rule

```
.feature  →  step definition  →  Page Object  →  Playwright locators
(business)   (orchestration)     (interactions)   (selectors live here only)
```

A step never contains a CSS selector, placeholder, or role query — it calls a
method on a Page Object. If a selector changes, exactly one file changes.

Page Objects are exposed as **fixtures** (`support/fixtures.ts`) and destructured
straight into steps:

```ts
When('I search for {string}', async ({ browsePage }, term) => {
  await browsePage.filters.search(term)
})
```

## The `seed` API

Scenarios declare the world they need via the `seed` fixture (the Supabase mock).
It must be seeded **before** navigation.

```ts
seed.addNight(nightFactory({ name: 'Camden Open Mic', area: 'Camden' }))
seed.reviews([reviewFactory({ nightId, tags: ['friendly-host'] })])
await seed.signedInAs(userFactory({ isAdmin: true }))   // seeds a real session
seed.favourite(userId, nightId)
seed.geocodeOutsideLondon()                             // London-only guard
seed.failNights()                                       // listings error state
```

Writes are captured on `captured` (`submissions`, `reports`, `reviews`,
`favourites`, `feedback`) so steps can assert exactly what was sent.

Use the factories in `support/factories.ts` (`nightFactory`, `reviewFactory`,
`userFactory`) — override only the field under test so each scenario's intent
stays obvious.

## Adding a scenario

1. Write the `.feature` in domain language (no selectors/URLs/payloads).
2. Reuse existing steps where possible; new steps go in the matching
   `steps/*.steps.ts` and orchestrate a Page Object.
3. New page/route → add a POM in `pages/` and a fixture in `support/fixtures.ts`.
4. Seed preconditions with the `seed` API; keep scenarios independent and
   parallel-safe.

## Tags

| Tag | Meaning |
|-----|---------|
| `@smoke` | minimal critical path — fast PR gate |
| `@critical` | core journeys that must never break |
| `@regression` | full breadth incl. edge cases |
| `@admin` | needs an admin session |
| `@wip` | unfinished — excluded from `test:e2e:ci` |
