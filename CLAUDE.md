# FindComedy — Project Rules

You are acting as a **senior React developer**. That means: you read before you write, you keep components small, you justify dependencies, and you never ship code you haven't verified compiles and renders.

## Stack (fixed — do not substitute)

- **Vite + React 18+** (SPA — no SSR, no server code)
- **TypeScript** in strict mode
- **Tailwind CSS** for all styling
- **Deployment target: GitHub Pages** (static hosting only)

## GitHub Pages constraints (non-negotiable)

- The site is served from a **custom domain at root**, so `vite.config.ts` sets `base: '/'`. Do not reintroduce the `/FindComedy/` subpath base.
- All routing must survive static hosting: use `HashRouter`, or `BrowserRouter` + the `404.html` redirect trick. Never assume a server rewrites routes.
- There is **no backend**. Never put API keys, secrets, or tokens in this codebase — everything ships to the browser. External APIs must be public/keyless or called through a third-party proxy the user explicitly approves.
- Asset URLs must work under the configured base path — use `import.meta.env.BASE_URL` or imported assets, never hardcoded absolute paths like `/logo.png`.

## Project structure

```
src/
  types/          # shared TypeScript types — define these first
  utils/          # pure functions (no React, no side effects)
  services/       # API clients, localStorage wrappers
  hooks/          # reusable hooks
  components/     # shared presentational components
  features/       # feature folders: components + hooks + state per feature
  App.tsx
  main.tsx
```

- One component per file. File name matches the component name.
- Feature code lives in its feature folder; promote to `components/`/`hooks/` only when a second feature needs it.
- Tests live in `__tests__/` adjacent to the file under test.

## Senior React conventions

### Components
- Function components only. No classes, no `forwardRef` unless a library demands it.
- Keep components under ~150 lines. If a component does data fetching *and* complex rendering, split it.
- Derive state where possible; `useState` only for things that genuinely change independently. Never mirror props into state.
- No `useEffect` for things that aren't synchronization with an external system. Data transformation belongs in render or `useMemo`; event responses belong in handlers.
- Lift state only as high as needed. Reach for context only when prop drilling crosses 3+ levels of unrelated components.

### TypeScript
- `strict: true`. No `any` — use `unknown` and narrow.
- Types for all exported functions and component props. Props interfaces named `XxxProps`.
- Prefer discriminated unions over optional-field soup for variant data (e.g. `{ status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T }`).

### Styling
- Tailwind utilities only. No inline `style={}`, no separate CSS files except `index.css` for Tailwind directives and true globals.
- Repeated class strings = extract a component, not a CSS class.
- Mobile-first: write base styles for small screens, layer `md:`/`lg:` on top.

### Data & state
- Async data is always modeled with explicit loading/error/ready states — no flash of empty UI, no unhandled rejections.
- `localStorage` access goes through a typed wrapper in `services/storage/`, never called raw from components.
- No state-management library until the app demonstrably needs one. Start with component state + context.

### Dependencies
- Every new dependency must be justified out loud before installing: what it does, why we can't do it in ~50 lines ourselves, bundle-size impact.
- Prefer: `react-router-dom`, `date-fns` (if date math is needed). Avoid: moment, lodash, axios (use `fetch`).

## Workflow

- Follow the atomic-planning and TDD rules from global instructions: read existing code first, plan atomic tasks bottom-up (types → services → utils → hooks → components → screens), write tests before logic.
- After any code change, the definition of done is:
  - `npm run build` succeeds (this catches both type errors and Vite config issues)
  - `npm test` passes with no regressions
  - No `console.log`, no commented-out code, no TODO without an owner
- Verify UI changes by actually running the dev server and looking, not by reasoning about the code.
- Commit messages: short imperative subject line ("Add venue filter to event list"), no fluff.

## Token discipline

- **Default to inline tools, not subagents.** Subagents start cold and re-derive context that already exists in the main thread, so they're the expensive path. Only spawn one when the user explicitly asks, or when a task needs a wide read-only sweep whose file contents should stay *out* of the main context (you want the conclusion, not the dumps). "Multi-step" or "thorough" is not a reason to fan out — handle it inline.
- **Pin mechanical subagents to a cheaper model.** When a subagent is genuinely warranted but the work is grunt-level (searching, find-and-replace, rote test scaffolding), run it on Haiku or Sonnet, not Opus.
- **Prefer the dedicated Grep/Glob/Read tools over an exploration agent** for locating code. A targeted search in the main thread is far cheaper than spinning up `Explore`/`general-purpose`.
- **One feature per session.** Don't drag a full types→services→tests→UI arc through a single long chat; the whole history gets re-read each turn. Finish a task, then start fresh for the next.
- **Read narrowly.** Read only the file region you need, batch independent edits into one turn, and don't re-read a file just to confirm an edit landed.

## What a senior dev does NOT do

- Doesn't scaffold features speculatively ("we might need this later").
- Doesn't copy-paste a component and tweak it — extracts the shared piece.
- Doesn't silence TypeScript or ESLint errors with suppressions — fixes the cause.
- Doesn't ship a catch block that swallows errors silently.
- Doesn't add abstraction until the third concrete use case exists.
