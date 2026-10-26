# ARCHITECTURE.md — The Forge · what is where

**Purpose:** orientation. Anyone opening this repo should be able to answer "what does this file do, and where does my change belong?" within two minutes. This describes **what is built** — CURRICULUM.md is the frozen content spec, DESIGN.md is the build contract, PHASES.md is the build history, UXAUDIT.md is the requirements list (U1–U15).

---

## Mental model — read this first

The Forge turns static curriculum content into a tracked, quiz-gated, accountability-enforced study system. The layering rule that keeps it working:

```
data/        typed content (curriculum, quizzes, roasts)  — no logic
   │
   ▼
engines/     pure functions, zero React, unit-tested      — all the math
   │
   ▼
stores/      zustand slices over ONE persisted AppData    — state + persistence
   │
   ▼
lib/         schema + debounced localStorage ('cdr-v3')   — the storage contract
   │
   ▼
features/    the 8 pages — render only, never compute
```

**Rules of thumb**

- New **logic** → `src/engines/` as a pure function + a co-located `.test.ts`. Pages never compute.
- New **content** → `src/data/`. A stage missing its quiz blueprint count is a red CI, not a vibe.
- New **app state** → patch `AppData` through a store slice; never add a second source of truth.

## Directory map

| Path | What lives here |
|---|---|
| `src/app/` | The shell. `App.tsx` (routes + code-splitting + Suspense fallback), `TopBar` (56px, streak chip, theme toggle), `CommandPalette` (Ctrl+K), `IntroGate` + `IntroGate.css` (the ignition overlay — lazy-mounts the WebGL logo), `ErrorBoundary`, `useLenis` (smooth scroll), `AnvilMark`. |
| `src/features/` | One folder per page: `today/` (task stack, hours meter, close-day verdict, focus timer), `roadmap/` (journey map), `arena/` (quiz hub + `QuizRunner` + `renderers.tsx` — all 8 quiz formats), `stats/`, `library/`, `viz/`, `settings/`, `onboarding/`, `diagnostics/`, `dread/` (`DreadProvider`, `RoastOverlay`, `BedtimeLockout`, `TribunalCard`). |
| `src/components/` | Shared visuals: `ui/Modal` (focus trap, Esc, restore — U8), `bits/` (React Bits TS-TW installs: `CountUp`, `SpotlightCard`; `DecryptedText` is installed but **not currently imported anywhere**), `ElectricLogo/` (the 1,000-line WebGL ignition — only used by `IntroGate`, so it ships in its own chunk), `tracker/StageDetail`. Buttons/cards/etc. are inline-styled on the tokens — there is no UI kit beyond Modal, by current choice. |
| `src/engines/` | Pure logic, each with a sibling `.test.ts`: `schedule.ts` (stage pacing, Sundays, postpones, ghost → catch-up, debt carry), `quiz.ts` (seeded selection, format interleaving, grading, passMarks, boss gates), `spacedReview.ts` (SM-2-lite ladder), `progress.ts` (stage/phase/global counts), `dread.ts` (bad-day streaks → levels 0–5), `accountability.ts` (tribunal stamps, pardons, bedtime), `xp.ts`. **Never import React or DOM here.** |
| `src/stores/` | `daily.ts` (schedule compute, hours, close/postpone/reopen), `progress.ts` (checkedIds set), `settings.ts` (theme only — the other settings are patched straight into `AppData`), `quiz.ts` (answers → grade → XP + review scheduling on commit). Pattern everywhere: `loadData() → patch → saveData()`. |
| `src/lib/` | `schema.ts` (the `AppData` **v4** type + never-throw validator; corrupt state → fresh default), `storage.ts` (single key `cdr-v3`, 150 ms debounced writes, pagehide flush, validated load, export/import), `migrate.ts` (v3 → v4 in place), `v2import.ts` (one-way legacy import — user-invoked from Settings only). |
| `src/data/curriculum/` | The 23-week roadmap as typed data: `types.ts` (Stage/Topic/Drill/Trap/FlagshipBuild/Phase), `stages/s00.ts…s18.ts`, `index.ts` (`STAGES` + `PHASES` with boss-gate ids), `resources.ts` (the resource canon, typed ids), `validate.ts` (structural validator — one topic-owner per quiz ref, concept depth, phase consistency). |
| `src/data/quizzes/` | 376 items: `types.ts` (discriminated union — `mcq`, `find-bug`, `predict-output`, `why-crash`, `fill-blank`, `match`, `ordering`, `fix-code`), `s00…s17.ts`, `bossP1–P4.ts`, `probe.ts`, `blueprint.ts` (**exact per-stage counts, CI-enforced**; s18 is review-driven, no authored set), `validate.test.ts` (every id resolves, counts match the blueprint). |
| `src/data/roast.ts` | The personality corpus: praise, 5 roast tiers (1=Mild … 5=Nuclear), ghost lines, the valid/invalid excuse lists. |
| `src/styles/tokens.css` | The whole theme: Terminal (dark, default) + Blueprint (light), phase accents `--p0…--p5`, and the `data-dread` corruption (accents bleed toward danger, grain rises). |
| `src/test/` | Vitest setup (jsdom, Testing Library). |
| `public/` | PWA: `manifest.webmanifest`, zero-dependency `sw.js`, `logo.png`-derived icons, `favicon.svg`. |
| `legacy/` | The untouched v2 single-file app (still runnable via `file://`; its ledger imports through Settings). |
| `practice/` | Local C compiler sanity checks (e.g. `hello.c`). |
| Root | `index.html` (fonts + SW registration) · `vite.config.ts` (jsdom test config, `--mode single` sandbox build) · `vercel.json` (SPA rewrites) · `.github/workflows/ci.yml` (typecheck → test → build) · `components.json` (shadcn/React Bits config). |

## The persistence contract (read before touching stores)

- **One key** in localStorage: `cdr-v3`. Its JSON is the entire user state (`AppData`, currently **schema v4** — v4 added the spaced-review map).
- `storage.saveData` is **debounced 150 ms** (U15) with a `pagehide` flush; `loadData` serves the pending buffer first so mid-debounce reads never see stale disk.
- `isValidAppData` is the gatekeeper: anything malformed degrades to a fresh default **without throwing**.
- Migration lives in `migrate.ts` (chain: v3 → v4; older/unknown → fresh default). The v2 import is a **separate, user-invoked** flow (`v2import.ts`), never automatic.

## Where common changes land

| You want to… | Do this |
|---|---|
| Add/rework a stage | `data/curriculum/stages/sXX.ts` (+ register in `index.ts` `STAGES` and a phase's `stageIds`) — the validator enforces topic order, concept depth, structure. |
| Add quiz items | `data/quizzes/sXX.ts`, then update `blueprint.ts` if the count changes — otherwise CI turns red on purpose. |
| Add a boss exam | `data/quizzes/bossPX.ts` + `BOSS_BLUEPRINT` + the phase's `bossGateId`. |
| Add engine behavior | `engines/*.ts` + `.test.ts` in the same folder; keep it pure — pass state in, return state out. |
| Add/rename a page | `features/…`, then: `App.tsx` lazy route, `TopBar` NAV, `CommandPalette` entries. |
| Change theming/colors | `styles/tokens.css` only — never hardcode hex in pages. |
| Add roasts/excuses | `data/roast.ts` (tier 1–5; the intensity dial caps tiers: mild ≤ 2, spicy ≤ 4, nuclear = 5). |
| Install a React Bits piece | `npx shadcn@latest add @react-bits/<Name>-TS-TW` → lands in `components/bits/` → re-point its colors/fonts to the tokens. |

## Tests map (94 total, `npm test`)

| Suite | Covers |
|---|---|
| `engines/*.test.ts` | schedule (leap years, postpones, catch-up interplay), quiz selection/scoring, SM-2 boundaries, dread/streak math, tribunal/bedtime, XP/ranks, progress counts |
| `lib/storage.test.ts` | debts to the debouncer, validation fallback, export/import round-trip |
| `lib/v2import.test.ts` | legacy ledger mapping |
| `data/curriculum/validate.test.ts` | curriculum structure + resource canon hygiene |
| `data/quizzes/validate.test.ts` | blueprint counts + quiz-ref integrity — the "content gap = red build" guarantee |
| `app/IntroGate.test.tsx` | the intro lifecycle (timer-based, reduced-motion off-switch) + the "keys after done never resurrect the overlay" regression |

CI (`.github/workflows/ci.yml`) requires typecheck + tests + build green on every push/PR; `main` auto-deploys to Vercel.

## Ship conventions (standing rules, from DESIGN.md §10)

- Engines stay pure; **no `any`** in `src/data` or `src/engines`; TypeScript `strict`.
- U1–U15 (UXAUDIT.md) are acceptance criteria, not suggestions — especially: Today first (U1), single-row hours control (U3), focus traps (U8), reduced-motion (U9), debounced saves (U15).
- One clean commit per workstream, **no AI trailers** in commit messages; push only on Farza's word.
- `fix-code` is permanently deep-link mode (decision 17) — do not plan around an embedded WASM compiler.
