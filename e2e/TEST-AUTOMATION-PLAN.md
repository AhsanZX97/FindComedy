# FindComedy — E2E Test Automation Plan

**Status:** Draft for review
**Stack:** Playwright + `playwright-bdd` (Cucumber/Gherkin) + Vite preview server
**Scope:** Browser-level acceptance tests for critical user journeys. Unit/logic coverage stays in Vitest (`src/**/__tests__`).

This plan **extends what already exists** (`e2e/features/submit-night.feature`, `e2e/steps/`, the `supabaseMock` fixture) into a maintainable, professional framework. It does not rewrite the working setup.

---

## 1. Goals & guiding principles

1. **Test behaviour, not implementation.** Scenarios describe what a comedian/audience member can do, in domain language — never CSS selectors or request payloads in the `.feature` files. (Those live in step definitions.)
2. **Hermetic by default.** Every spec runs with all Supabase + Nominatim traffic intercepted in the browser. No test ever touches production data — this is already enforced by `.env.e2e` (dead host) + the route mocks. We keep that invariant.
3. **One scenario, one behaviour.** Independent scenarios that set up their own preconditions. No scenario depends on another having run first.
4. **Right layer for the job.** Cucumber covers ~critical journeys only. The bulk of logic (`filterNights`, `formatSchedule`, `freshness`, `slug`, services) is already unit-tested and stays there. We do **not** re-test pure functions through the browser.

### Testing pyramid for this repo

| Layer | Tool | Covers | Where |
|-------|------|--------|-------|
| Unit (majority) | Vitest | pure utils, services, mappers | `src/**/__tests__` (exists) |
| Component | Vitest + Testing Library | isolated component render/interaction | `src/**/__tests__` (grow as needed) |
| **E2E acceptance (this plan)** | Playwright-BDD | critical cross-page journeys | `e2e/` |

---

## 2. Target folder structure

```
e2e/
  features/
    browse/
      filtering.feature
      browse-states.feature           # loading / error / empty
    night/
      night-detail.feature
      report-night.feature
    submit/
      submit-night.feature            # exists — moved under submit/
    auth/
      sign-in.feature
    favourites/
      favourites.feature
    reviews/
      vibe-checks.feature
    areas/
      areas.feature
    admin/
      submission-queue.feature        # @admin
  pages/                              # Page Object Models (§6)
    BasePage.ts                       # shared nav + waits, extended by all
    HeaderComponent.ts                # site header (shared component object)
    BrowsePage.ts
    FilterBar.ts                      # component object, owned by BrowsePage
    NightDetailPage.ts
    SubmitPage.ts                     # exists logic — locators move here
    SignInPage.ts
    MyNightsPage.ts
    ReviewsSection.ts                 # component object on NightDetailPage
    AreaPage.ts
    admin/
      SubmissionQueuePage.ts
  steps/
    browse.steps.ts
    night.steps.ts
    submit.steps.ts                   # exists — refactored to call POMs
    auth.steps.ts
    favourites.steps.ts
    reviews.steps.ts
    common.steps.ts                   # navigation + shared assertions
  support/
    fixtures.ts                       # exists — extended: mock + seed + POM fixtures (§4, §6)
    supabase-mock.ts                  # extracted route-handler builder
    factories.ts                      # test-data builders (§5)
  TEST-AUTOMATION-PLAN.md             # this file
```

**Rationale:** group `.feature` files by domain (the skill's "group related scenarios"); keep step files thin — they orchestrate **Page Objects**, never touch raw locators; isolate the mock + factory plumbing in `support/` so feature authors never touch it. Locators and page interactions live exclusively in `pages/` (§6).

---

## 3. What we test (and what we deliberately don't)

**In scope (critical journeys):**
- Browsing & filtering nights (search, day, type, level, area, no-bringer, clear).
- Viewing a night's detail page (key info, bringer policy, freshness, directions link, status badges, not-found redirect).
- Submitting a night for review (happy path + validation + London-only guard).
- Signing in (email-OTP flow, redirect behaviour, unconfigured fallback).
- Favouriting a night and seeing it in "My nights" (auth gate).
- Leaving / editing a vibe-check review (auth gate, aggregate tags).
- Reporting a night (auth gate).
- Area landing pages.
- Admin submission queue (tagged `@admin`, run separately).

**Out of scope for Cucumber (covered elsewhere or not worth browser cost):**
- Pure formatting/filter logic → Vitest (already covered).
- SEO/JSON-LD prerender output → a focused Playwright/Vitest assertion, not a Gherkin scenario.
- Leaflet map rendering internals → smoke-level only (marker click selects a card).
- Visual styling / dark mode → not asserted in Gherkin (anti-pattern: "red error in top right").

---

## 4. Mocking & fixtures strategy

We generalise the current `supabaseMock` into a **seedable** mock so scenarios can declare the world they need (e.g. "a night 'X' exists", "I am signed in", "this night has 3 reviews").

`support/supabase-mock.ts` exposes a builder used by the fixture:

- **Listings** — `GET /rest/v1/nights` returns the seeded nights (default: a small deterministic set from `factories.ts`; scenarios can override).
- **Auth/session** — `GET /auth/v1/user` + token endpoints return either "signed out" (default) or a seeded user when a scenario signs in. OTP verify (`POST /auth/v1/verify`) returns a session so the email flow completes without a real inbox.
- **Reviews** — `GET/POST/DELETE /rest/v1/reviews` backed by an in-memory array per test; POST captures payload.
- **Reports / submissions / feedback** — capture payloads (as today) and return created rows.
- **Geocoding** — Nominatim returns a fixed London coord by default; a scenario can request a non-London coord to exercise the "London only" guard.

Fixture shape (extends existing `captured`, and adds the POM fixtures from §6):

```ts
test.extend<{
  // data / mock plumbing
  seed: SeedApi          // seed.nights([...]), seed.signedInAs(user), seed.reviews(nightId, [...])
  captured: Captured     // submissions, reports, reviews, feedback payloads
  supabaseMock: void     // auto: true — installs all routes
  // page objects (§6) — lazily constructed per test, injected into steps
  browsePage: BrowsePage
  nightDetailPage: NightDetailPage
  submitPage: SubmitPage
  signInPage: SignInPage
  myNightsPage: MyNightsPage
}>
```

**Key invariant kept:** broad `/rest/v1/**` catch-all registered first, specific handlers last (Playwright runs handlers in reverse-registration order). Documented in `supabase-mock.ts`.

---

## 5. Test data factories

`support/factories.ts` — builders with sensible defaults + overrides (skill: "use factories, avoid hardcoded IDs"):

```ts
nightFactory({ name, type, weekday, bringer, area, status, lastVerified })
reviewFactory({ tags, note, displayName })
userFactory({ email, isAdmin })
```

Defaults produce a valid London night, verified recently, active, no bringer. Scenarios override only the field under test — keeping each scenario's intent obvious.

---

## 6. Page Object Models & step design

This is the backbone of the framework. **Three layers, strictly separated** — the discipline that keeps an automation suite maintainable at scale:

```
.feature  →  step definition  →  Page Object  →  Playwright locators
(business)   (orchestration)     (interactions)   (the only place selectors live)
```

A step **never** contains a CSS selector, placeholder, or role query. It calls a method on a Page Object. If a selector changes, exactly one file changes.

### 6.1 Page Object design rules

- **One class per page/route**, plus **component objects** for reusable widgets that appear across pages (`HeaderComponent`, `FilterBar`, `ReviewsSection`). Component objects are owned by the page that hosts them (e.g. `browsePage.filters`).
- Each POM takes the Playwright `page` in its constructor and exposes:
  - **named locators** as `readonly` getters (private to the class where possible),
  - **action methods** in domain language (`search(term)`, `filterToDay('Friday')`, `submit()`),
  - **query methods** that return data/state for assertions (`isBringerRequired()`, `visibleNightNames()`) — POMs expose state; **assertions stay in steps** so failures read in business terms.
- `BasePage` holds shared concerns: `goto(path)`, common waits, and the `HeaderComponent`. Every page extends it.
- POMs are **pure interaction** — no test data, no mocking. Seeding is the fixture's job (§4/§5).

Example POM (illustrative):

```ts
// pages/BrowsePage.ts
export class BrowsePage extends BasePage {
  readonly filters = new FilterBar(this.page)
  private readonly searchBox = this.page.getByPlaceholder('Search nights, venues, areas...')

  async open() { await this.goto('/') }
  async search(term: string) { await this.searchBox.fill(term) }
  async openNight(name: string) { await this.page.getByRole('link', { name }).click() }
  visibleNightNames() { return this.page.getByRole('heading', { level: 3 }).allInnerTexts() }
}
```

### 6.2 Binding POMs into steps (the `playwright-bdd` way)

Page Objects are exposed as **fixtures** (§4) and destructured straight into steps — the same dependency-injection model the existing `submit.steps.ts` already uses for `page`/`captured`. No manual `new BrowsePage(page)` in each step.

```ts
// support/fixtures.ts (excerpt)
browsePage: async ({ page }, use) => { await use(new BrowsePage(page)) },

// steps/browse.steps.ts — thin orchestration, zero selectors
When('I search for {string}', async ({ browsePage }, term) => {
  await browsePage.search(term)
})

Then('I should see {string}', async ({ browsePage }, name) => {
  expect(await browsePage.visibleNightNames()).toContain(name)
})
```

> Optional upgrade path: `playwright-bdd` also supports **decorator-based POMs** (`@Fixture`, with `@Given/@When/@Then` as class methods bound via `createBdd(test, { worldFixture })`). That co-locates steps with the page they drive. We start with the fixture-injection model above (simpler, fewer moving parts) and can adopt decorators later if a page accumulates many bespoke steps — noted as a deliberate evolution, not day-one complexity.

### 6.3 Step conventions

- **Declarative, reusable** steps keyed off domain nouns. Balance generic vs specific: `When I filter to {string} nights` (reusable across day/type) but `When I sign in with email {string}` (readable, specific).
- Background per feature for the common precondition only (e.g. "Given the listings include …"); never an over-loaded Background.
- Shared navigation/assertion steps live in `steps/common.steps.ts`.

---

## 7. Tagging & execution

| Tag | Meaning | Run when |
|-----|---------|----------|
| `@smoke` | minimal critical path (browse → detail, submit happy path) | every PR, fast gate |
| `@critical` | core journeys that must never break | every PR |
| `@regression` | full breadth incl. edge cases | nightly / pre-release |
| `@admin` | needs admin session; slower | nightly |
| `@wip` | unfinished — excluded from CI | never in CI |

Scripts to add to `package.json`:

```jsonc
"test:e2e:smoke": "bddgen && playwright test --grep @smoke",
"test:e2e:ci":    "bddgen && playwright test --grep-invert @wip"
```

`fullyParallel: true` is already set; the seedable mock is per-test, so scenarios stay parallel-safe.

---

## 8. Scenario catalogue (Gherkin drafts)

These are the scenarios to implement, written declaratively per the best-practices skill. Tags shown inline.

### 8.1 Browsing & filtering — `features/browse/filtering.feature`

```gherkin
Feature: Filtering comedy nights
  As someone looking for a comedy night
  I want to narrow the listings
  So that I only see nights that suit me

  Background:
    Given the listings include:
      | name            | type      | day  | level       | bringer | area      |
      | Camden Open Mic | open-mic  | Mon  | new         | no      | Camden    |
      | Soho Showcase   | showcase  | Fri  | experienced | yes     | Westminster |
      | Hackney Pro     | pro       | Fri  | pro         | no      | Hackney   |
    And I am browsing nights

  @smoke @critical
  Scenario: Search narrows the list by name
    When I search for "Camden"
    Then I should see "Camden Open Mic"
    And I should not see "Soho Showcase"

  @critical
  Scenario: Filtering by day shows only that day's nights
    When I filter to "Friday" nights
    Then I should see "Soho Showcase"
    And I should see "Hackney Pro"
    And I should not see "Camden Open Mic"

  Scenario: Filtering by type
    When I filter to "Open Mic" nights
    Then I should see "Camden Open Mic"
    And I should not see "Hackney Pro"

  Scenario: Hiding nights that require a bringer
    When I hide nights that require a bringer
    Then I should see "Camden Open Mic"
    And I should not see "Soho Showcase"

  Scenario: Filtering by area
    When I filter to the "Hackney" area
    Then I should see "Hackney Pro"
    And I should not see "Camden Open Mic"

  Scenario: Clearing all filters restores the full list
    Given I have filtered to "Open Mic" nights
    When I clear all filters
    Then I should see 3 nights

  @regression
  Scenario: No nights match the chosen filters
    When I search for "Brighton"
    Then I should see a message that no nights match my filters
```

### 8.2 Browse states — `features/browse/browse-states.feature`

```gherkin
Feature: Browse page loading and error states

  Scenario: Listings fail to load
    Given the listings service is unavailable
    When I open the browse page
    Then I should see an error message instead of listings

  @regression
  Scenario: No listings exist yet
    Given there are no listings
    When I open the browse page
    Then I should see a message that no nights match my filters
```

### 8.3 Night detail — `features/night/night-detail.feature`

```gherkin
Feature: Viewing a comedy night

  Background:
    Given a night exists:
      | name       | The Featured Mic            |
      | venue      | The Camden Head             |
      | address    | 100 Camden High St, London  |
      | type       | open-mic                    |
      | bringer    | no                          |

  @smoke @critical
  Scenario: Opening a night from the listings
    Given I am browsing nights
    When I open the night "The Featured Mic"
    Then I should see its venue "The Camden Head"
    And I should see how to attend

  @critical
  Scenario: A bringer night is clearly flagged
    Given the night "The Featured Mic" requires a bringer
    When I view "The Featured Mic"
    Then I should see that a bringer is required

  Scenario: A non-bringer night is flagged as such
    When I view "The Featured Mic"
    Then I should see that no bringer is required

  Scenario: Stale listings are flagged to the visitor
    Given the night "The Featured Mic" was last verified over a year ago
    When I view "The Featured Mic"
    Then I should see a freshness warning

  @regression
  Scenario: A night that is no longer running is marked
    Given the night "The Featured Mic" is no longer running
    When I view "The Featured Mic"
    Then I should see that it is no longer running

  Scenario: Getting directions to the venue
    When I view "The Featured Mic"
    Then I should be offered directions to the venue

  @regression
  Scenario: Visiting a night that does not exist
    When I open a night that does not exist
    Then I should be returned to the browse page
```

### 8.4 Submitting a night — `features/submit/submit-night.feature` (existing, extended)

```gherkin
Feature: Submitting a comedy night
  As a comedian or audience member
  I want to submit a comedy night for review
  So that it can be added to the listings

  @smoke @critical
  Scenario: A visitor submits a night for review
    Given I am on the submit page
    When I fill in the night details:
      | field   | value                              |
      | name    | The E2E Open Mic                   |
      | about   | A test night submitted by Playwright |
      | venue   | The Test Tavern                    |
      | address | 100 Camden High St, London NW1 0LU |
    And I submit the night
    Then I see the submission confirmation
    And the submission received by the team is named "The E2E Open Mic"

  @regression
  Scenario: The form rejects an empty submission
    Given I am on the submit page
    When I submit the night without filling required details
    Then I should be told which details are required
    And no submission is sent to the team

  @regression
  Scenario: A venue outside London is rejected
    Given I am on the submit page
    And the venue address resolves outside London
    When I fill in the night details:
      | field   | value                  |
      | name    | The Manchester Mic     |
      | venue   | The Northern Tavern    |
      | address | 1 Deansgate, Manchester |
    And I submit the night
    Then I should be told the night must be in London
```

> Note: validation/London-guard scenarios must match the real `SubmitPage` behaviour — confirm exact copy when implementing; adjust step assertions to the actual messages rather than inventing them.

### 8.5 Signing in — `features/auth/sign-in.feature`

```gherkin
Feature: Signing in
  As a returning visitor
  I want to sign in
  So that I can save and review nights

  @critical
  Scenario: Requesting a sign-in code by email
    Given I am on the sign-in page
    When I request a code for "comic@example.com"
    Then I should be asked to enter the 6-digit code

  @critical
  Scenario: Completing sign-in with a valid code
    Given I requested a code for "comic@example.com"
    When I enter the valid code
    Then I should land on my nights

  @regression
  Scenario: Choosing a different email resets the flow
    Given I requested a code for "comic@example.com"
    When I choose to use a different email
    Then I should be asked for my email again
```

### 8.6 Favourites — `features/favourites/favourites.feature`

```gherkin
Feature: Saving favourite nights

  Background:
    Given a night "The Featured Mic" exists

  @critical
  Scenario: Favouriting requires signing in
    Given I am a signed-out visitor
    When I view "The Featured Mic"
    And I try to favourite it
    Then I should be taken to the sign-in page

  @smoke @critical
  Scenario: A favourited night appears in My nights
    Given I am signed in
    And I have favourited "The Featured Mic"
    When I open my nights
    Then I should see "The Featured Mic" in my favourites

  Scenario: My nights is empty before favouriting anything
    Given I am signed in
    When I open my nights
    Then I should see a prompt to favourite a night

  @regression
  Scenario: My nights requires signing in
    Given I am a signed-out visitor
    When I open my nights
    Then I should be taken to the sign-in page
```

### 8.7 Vibe-check reviews — `features/reviews/vibe-checks.feature`

```gherkin
Feature: Leaving a vibe check on a night

  Background:
    Given a night "The Featured Mic" exists

  @critical
  Scenario: Leaving a review requires signing in
    Given I am a signed-out visitor
    When I view "The Featured Mic"
    And I try to leave a vibe check
    Then I should be taken to the sign-in page

  @critical
  Scenario: Signed-in visitor leaves a vibe check
    Given I am signed in
    And I am viewing "The Featured Mic"
    When I leave a vibe check tagged "Friendly host" and "Chill vibe"
    Then my vibe check should appear on the night

  Scenario: A review must have at least one tag
    Given I am signed in
    And I am viewing "The Featured Mic"
    When I open the vibe-check form without choosing a tag
    Then I should not be able to save it

  @regression
  Scenario: Aggregate tags summarise the crowd's view
    Given "The Featured Mic" has reviews tagging it "Friendly host" three times
    When I view "The Featured Mic"
    Then "Friendly host" should be shown as a top vibe
```

### 8.8 Reporting a night — `features/night/report-night.feature`

```gherkin
Feature: Reporting an out-of-date night

  Background:
    Given a night "The Featured Mic" exists

  @critical
  Scenario: Reporting requires signing in
    Given I am a signed-out visitor
    When I view "The Featured Mic"
    And I try to report it
    Then I should be taken to the sign-in page

  Scenario: Signed-in visitor reports a wrong time
    Given I am signed in
    And I am viewing "The Featured Mic"
    When I report it as having the wrong time
    Then the report received by the team is for "The Featured Mic"
```

### 8.9 Area pages — `features/areas/areas.feature`

```gherkin
Feature: Browsing by area

  Background:
    Given the listings include a night "Camden Open Mic" in "Camden"

  @regression
  Scenario: The areas index lists areas with nights
    When I open the areas index
    Then I should see "Camden" listed

  @regression
  Scenario: An area page shows only that area's nights
    When I open the "Camden" area page
    Then I should see "Camden Open Mic"
```

### 8.10 Admin submission queue — `features/admin/submission-queue.feature` (@admin)

```gherkin
@admin
Feature: Reviewing submitted nights

  Background:
    Given I am signed in as an admin
    And a night "The Pending Mic" is awaiting review

  Scenario: Admin sees the pending submission queue
    When I open the submission queue
    Then I should see "The Pending Mic" awaiting review

  Scenario: Approving a submission publishes it
    Given I am reviewing "The Pending Mic"
    When I approve it
    Then it should be marked approved

  Scenario: Rejecting a submission removes it from the queue
    Given I am reviewing "The Pending Mic"
    When I reject it
    Then it should be marked rejected
```

---

## 9. Rollout — atomic tasks (bottom-up)

Following the repo's atomic-planning rule, build the plumbing before the features.

**Phase 0 — framework foundation**
1. Extract `support/supabase-mock.ts` from `fixtures.ts` (behaviour-preserving; existing submit test still green).
2. Add `support/factories.ts` (`nightFactory`, `reviewFactory`, `userFactory`).
3. Extend the fixture with a `seed` API (nights, signed-in user, reviews) — default state = today's behaviour.
4. Add `pages/BasePage.ts` + `pages/HeaderComponent.ts` (shared nav scaffold every POM extends).
5. Register POM fixtures in `support/fixtures.ts` and add `steps/common.steps.ts` (navigation + shared assertions).
6. **Refactor the existing `submit.steps.ts` onto `pages/SubmitPage.ts`** — proves the POM pattern end-to-end against a green test before adding new features.
7. Add tag scripts to `package.json`; confirm `@wip`-exclusion in CI.

> Each Phase 1–3 feature adds its own POM(s) alongside the feature file (e.g. task 6 ships `BrowsePage.ts` + `FilterBar.ts`).

**Phase 1 — smoke (`@smoke`)**
6. Browse → filter by search/day (8.1 smoke).
7. Browse → open night detail (8.3 smoke).
8. Submit happy path (8.4 — already passing; move under `submit/`).
9. Favourite → My nights (8.6 smoke).

**Phase 2 — critical (`@critical`)**
10. Remaining filtering scenarios (8.1).
11. Night detail: bringer, freshness, status, directions, not-found (8.3).
12. Sign-in email-OTP flow (8.5).
13. Vibe-check auth gate + leave review (8.7).
14. Report auth gate + submit report (8.8).

**Phase 3 — regression & admin**
15. Browse loading/error/empty (8.2).
16. Submit validation + London guard (8.4) — verify real copy first.
17. Area pages (8.9).
18. Admin submission queue (8.10, `@admin`).

Each numbered task = one feature file (or one fixture/support module), independently runnable via `playwright test <file>`.

---

## 10. CI integration

- The repo already runs Playwright-BDD E2E in CI (see commit `5f03572`). Extend that job to:
  - PR gate: `npm run test:e2e:ci` (everything except `@wip`), or `test:e2e:smoke` if wall-time matters.
  - Nightly: full run including `@admin` + `@regression`.
- `webServer` already serves `vite --mode e2e` (loads `.env.e2e`); no change needed.
- Keep `trace: 'on-first-retry'` and `retries: 1` on CI for flake diagnosis.

---

## 11. Definition of done (per the repo rules)

- [ ] `npm run build` succeeds (types + Vite config).
- [ ] `npm test` (Vitest) green — no unit regressions.
- [ ] `npm run test:e2e` green locally and in CI.
- [ ] No real network calls escape the mock (assert via `captured` + dead host in `.env.e2e`).
- [ ] Feature files contain **zero** selectors/URLs/payloads.
- [ ] Step definitions contain **zero** raw locators — every interaction goes through a Page Object.
- [ ] Each new page/route has a corresponding POM; reusable widgets are component objects.
- [ ] New scenarios are independent and parallel-safe.

---

## 12. Additional industry-standard capabilities

POMs + BDD + hermetic mocks get us most of the way. The following close the gap to a mature suite. Tiered so we add value, not speculative complexity.

### Recommended — add as part of the build

1. **Failure artifacts & living-docs reporting.** Set `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'` (keep `trace: 'on-first-retry'`). Publish the **Playwright HTML report** *and* the **Cucumber HTML report** as CI artifacts — `@cucumber/html-formatter` is already a dependency, so the Gherkin doubles as living documentation for stakeholders. Wire via `reporter: [['html'], ['github']]` + the BDD Cucumber reporter.

2. **Cross-browser & mobile projects.** Today only `chromium` runs. This app has a *real* mobile/desktop divergence (`BrowsePage` map toggle, mobile bottom-card, `md:` split view) — so mobile coverage is genuinely load-bearing, not box-ticking. Add `firefox`, `webkit`, and `Mobile Chrome`/`Mobile Safari` projects; tag the handful of viewport-specific scenarios `@mobile` and run the rest browser-agnostic.

3. **Accessibility smoke checks.** Add `@axe-core/playwright`; assert no serious/critical violations on the key public pages (browse, night detail, submit, sign-in). Cheap, automated, and appropriate for a public-facing site. Tag `@a11y`.

4. **Authenticated session reuse.** A Playwright **setup project** that seeds a signed-in `storageState` against the mocked `auth/v1`, so favourites / reviews / report / admin specs skip the OTP flow each run. Faster and less flaky; the OTP journey itself stays explicitly tested once in `sign-in.feature`.

5. **Enforced test-code discipline (ESLint).** An `e2e/`-scoped ESLint config that **forbids raw `page.`/locator calls inside `steps/`** (`no-restricted-syntax`) so the POM boundary can't erode, and **bans hard waits** (`page.waitForTimeout`). Add `husky` + `lint-staged` pre-commit to typecheck + lint the `e2e/` dir. This is what keeps the framework "standard" six months in.

6. **Onboarding docs — `e2e/README.md`.** How to run (`smoke` vs full), how to add a scenario, the three-layer rule (§6), and the `seed` API. Lowers the cost of the next contributor doing it right.

### Optional — scale & coverage levers (adopt when earned)

7. **CI sharding** (`--shard=i/n`) across runners once wall-time grows past the PR budget.
8. **Visual regression** via `toHaveScreenshot()` on a few *stable* pages, with `mask` for dynamic content (dates, Leaflet tiles). Opt-in and quarantined — powerful but flaky; not day one.
9. **`@flaky` quarantine lane** — a separate non-blocking CI job for known-unstable specs so flake never blocks a merge while staying visible.
10. **Post-deploy production smoke.** A read-only `@smoke @prod` subset run against `https://www.findcomedy.xyz` *after* the Vercel deploy — no writes, no mocks. Catches prerender/routing/env regressions (the `/night/:slug.html` rewrite, `base: '/'`, missing env vars) that the mocked suite structurally cannot. Fits the existing Supabase→Vercel deploy-hook flow.

### Deliberately deferred (not adding)

- **Allure / 3rd-party reporters** — the built-in HTML + Cucumber reports are sufficient at this scale.
- **Lighthouse / performance budgets** — a separate discipline; revisit only if SEO/Core-Web-Vitals regressions appear.
- **Cloud device grids (BrowserStack/Sauce)** — unnecessary; local Playwright browsers cover the matrix we need.

---

## 13. Open questions for review

1. **Validation/London-guard copy** (8.4) — should I assert against the live `SubmitPage` messages, or do you want specific copy defined first?
2. **Admin auth** (8.10) — confirm we can seed an admin session purely via the mocked `auth/v1` + profile role, with no real Supabase. (I believe yes — `RequireAdmin` reads from `AuthContext`.)
3. **Scope cut** — are area pages (8.9) and admin queue (8.10) wanted in the first pass, or should the first delivery stop at Phase 2 (smoke + critical)?
4. **Smoke vs full on PRs** — gate PRs on `@smoke` only (faster) or the full non-`@wip` set?
5. **Browser matrix** (§12.2) — which projects do you want in CI: Chromium-only, +mobile viewports, or the full `firefox`/`webkit`/mobile matrix?
6. **Recommended add-ons** (§12.1) — all six in the first build, or land POM+scenarios first and layer a11y / cross-browser / session-reuse / lint-gates in a follow-up?
7. **Post-deploy production smoke** (§12.10) — in scope? It's the one suite that needs the *real* site + no mocks, so it's a distinct CI job from everything else here.
```
