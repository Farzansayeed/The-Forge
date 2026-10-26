# The Forge 🔨

**A C × DSA roadmap tracker that fights back.**

You set the schedule. The Forge holds you to it — every topic, every quiz, every missed day is tracked, scheduled, and eventually avenged through spaced review.

**Live:** https://the-forge-cdsa.vercel.app/

Every push to `main` auto-deploys via Vercel (CI runs typecheck + tests + build first).

---

## What it is

A 19-stage curriculum (S00–S18) spanning **23 weeks of C programming and Data Structures & Algorithms** — from toolchain setup through pointers, structs, bit manipulation, hand-built data structures, algorithms, and a final interview-endgame capstone.

The app is a full multi-page SPA:

| Page | What it does |
|---|---|
| **Today** | Your daily task stack (topics pulled live from the curriculum), hours meter, focus timer, and the close-day ritual |
| **Roadmap** | The full journey map — 6 phases, per-stage topics/traps/drills/resources, deep-linkable (`/roadmap?stage=s03`) |
| **Arena** | Torture tests for **every stage**, boss-gate exams per phase, and a spaced-review queue that resurfaces every item you've ever missed |
| **Stats** | Contribution heatmap, streak economy, the dread ledger, and a pace projection that tells you when you actually finish |
| **Library** | 36 curated resources with live search, kind filters (book / video / doc / course), and phase tags derived from stage refs |
| **Viz** | The pointer & memory visualizer lab — 39 interactive sessions on addresses, arrays, pointers, and structs |
| **Settings** | Schedule targets, bedtime, the roast-intensity dial, the Sunday tribunal, pardons & insurance, data export/import, and legacy v2 migration |
| **Diagnostics** | In-app self-checks: blueprint counts, registry wiring, storage health, schedule build — the CI validator, runnable in your browser |

Plus a **command palette** (`Ctrl+K`) with fuzzy navigation, a 5-step **onboarding wizard** on first run, and an installable **PWA** that works offline.

Every load opens with **The Ignition** — a WebGL electric Forge logo that crackles to life, fires a blast ripple, and tears open to reveal the site (skippable by click or key; disabled under `prefers-reduced-motion`).

## The curriculum

- **6 phases**: Launchpad → C Fluency → Systems C → Data Structures → Algorithms & Interview Core → Interview Endgame
- **230 checkable items** — every topic, drill, and flagship build is typed data validated at load
- **Per-stage trap catalog** — each stage documents the classic mistakes (the `int* p, q;` disaster, realloc failure leaks, mask off-by-ones…) and every quiz item targets one
- **Flagship builds** per stage — First Blood, Number Forge, Text Lab, Arena & Vector, Library System, Contacts CLI, BitBoard — each with acceptance criteria
- Full curriculum source: [CURRICULUM.md](CURRICULUM.md)

## Quizzes & the Arena

- **8 question formats**, all hand-rendered: multiple choice, find-the-bug (click the line), predict-output, why-crash, fill-blank, match pairs, ordering, and fix-code (deep-link into an online compiler with an honor-system confirm)
- **376 authored items** — a torture test for **all 17 static stages** (286 items, s00–s17) plus **4 boss exams** (90 items). Every item carries an explanation shown win or lose, a trap linkage, a difficulty rating, and a remedy link on failure
- **Boss gates** — phase exit exams at ≥80% to unlock the next phase (20 items for Phases 1–2, 25 for Phases 3–4); fail and retry re-rolls the item order on a new seed
- **Spaced review (SM-2-lite)** — every miss enters a review queue with rungs at 1 → 3 → 7 → 16 → 35 days, ease-factor adjustment, lapse handling, and a 10-cards-per-day cap. S18 composes itself entirely from this queue — fail a card and it drops back down; it never silently disappears
- **XP & ranks** — pass a quiz first try for bonus XP; the top bar shows your live study streak 🔥 (or its 💀 aftermath)
- A **blueprint validator test** holds the content to exact per-stage counts in CI — content gaps are build failures, not vibes

## The daily loop

1. **Today** opens with your task stack — curriculum topics for the current stage, deep-linked to the roadmap
2. **Log hours** (½-hour taps or direct entry) toward the day's target; the schedule engine adapts pace, carries debt forward, and auto-inserts catch-up days after two consecutive misses
3. **Focus timer** with strict mode — sessions ≥30s are journaled on Log, and a running session itself survives a reload; strict sessions are the only ones that earn full credit
4. **Close the day** — a staged verdict ritual (honest pass, or fail with a "TARGET MISSED" notice) that locks the day in
5. **Postpone tribunal** — postponing demands an excuse; the app judges it (valid / invalid / custom) and schedules accordingly
6. **The streak** — miss days and the 🔥 dies; the dread engine escalates (CLEAN → ELDRITCH) and the roasts get meaner

## The accountability layer

- **Dread theming** — the UI corrupts as your fail streak grows (five escalating levels drive a `data-dread` attribute; fonts glitch, the logo corrodes)
- **The roast overlay** — failures summon a tiered roast (Mild / Spicy / Nuclear dial in Settings), scrambled-text glitch reveal included
- **Bedtime lockout** — past your set bedtime with the day still open: a nag banner first, then a full overlay, and a desktop notification when permitted. Cross midnight and it still catches you
- **The Sunday tribunal** — a weekly review card that grades your last seven days and issues a stamp: from FLAWLESS to ABYSMAL
- **The economy** — a pardon every 10 clean days (erases a fail's roast) and an insurance token that shields a streak from one bad day. Mercy is earned, not given

## The Schedule Engine

- Hour targets per weekday with a distinct Sunday rhythm
- Debt carry-over: unfinished work stacks onto tomorrow, truthfully
- Two consecutive skipped days → automatic **Catch-Up day** insertion
- Working-day detection shows today as it truly is — study day, catch-up, or rest
- All schedule state persists in localStorage (schema v4) with a migration path from older versions, plus JSON export/import — **including one-way import of the legacy v2 tracker's ledger** (hours, verdicts, XP, pardons)

## Installable & offline (PWA)

- Web app manifest with the Forge icons — install it to your desktop/home screen
- Service worker: cached app shell for offline study, stale-while-revalidate assets, cached fonts
- Everything is local — no account, no server, no telemetry

## Tech stack

| | |
|---|---|
| Framework | React 18 + TypeScript (strict) + Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), custom theming with dread-driven corruption |
| State | zustand stores (daily, quiz, progress, settings) |
| Animation | framer-motion + lenis smooth scroll |
| Routing | react-router-dom v6 (SPA with Vercel rewrite) |
| Testing | Vitest + jsdom + Testing Library — **108 tests** including the blueprint validator and the v2 importer |
| Persistence | localStorage (schema v4) + JSON export/import + v2 migration |
| PWA | `manifest.webmanifest` + zero-dependency service worker |
| CI | GitHub Actions — typecheck, tests, and build on every push |

## Development

```bash
git clone https://github.com/Farzansayeed/The-Forge.git
cd The-Forge
npm install

npm run dev          # vite dev server
npm test             # vitest run (108 tests)
npm run typecheck    # tsc --noEmit
npm run build        # typecheck + production build
npm run preview      # serve the production build locally
npm run build:single # single-file sandbox build
```

New to the codebase? **[ARCHITECTURE.md](ARCHITECTURE.md)** maps every directory, the data flow (`data → engines → stores → storage`), and where each kind of change belongs.

## Project status

The v3 rebuild shipped in tracked phases — **all eight are done**:

- ✅ **Phase 0–1** — scaffold, typed curriculum data (19 stages, validator, tests)
- ✅ **Phase 2** — Roadmap UI (journey map + stage detail)
- ✅ **Phase 3** — schedule engine, Today page, close-day ritual, focus timer, streak
- ✅ **Phase 4** — quiz engine, 8 renderers, Arena, boss gates, spaced review
- ✅ **Phase 5** — quiz content for Phases 0–2 (106 items) + boss exam 2 + blueprint validator
- ✅ **Phase 6** — dread engine, roast overlay, tribunal, bedtime lockout, full Settings
- ✅ **Phase 7** — stats heatmap, library, viz lab, onboarding wizard, command palette
- ✅ **Phase 8** — remaining quiz content (S07–S17, boss exams 3–4), PWA, v2 importer, diagnostics page

## Legacy

The original v2 (single-file, zero-dependency) app is preserved and runnable at `legacy/index.html` — and its saved ledger can be imported into The Forge via **Settings → Data → Import JSON**.

---

> The Forge keeps score. Miss a day and it remembers; miss a quiz and it schedules the rematch.
