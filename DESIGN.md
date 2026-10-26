# DESIGN.md — Technical Specification (v3)

**Status:** The build contract. CURRICULUM.md = content · **this file = how the app is actually built.**

---

## 1 · Stack

React 18 + TypeScript (strict) · Vite · Zustand (+persist) · Tailwind v4 + CSS custom-property tokens · **Motion** — single animation runtime, imported as `motion/react` (the renamed Framer Motion; the legacy `framer-motion` package is gone) · **React Bits (TS-TW variants)** for animated UI · **Lenis** for inertial smooth scrolling (auto-disabled under `prefers-reduced-motion`; verify sticky topbar + heatmap scroll in WS1) · React Router · Vitest + Testing Library · PWA via hand-written zero-dependency `sw.js` (not `vite-plugin-pwa`) · Vercel. **Route transitions:** Motion `AnimatePresence` (Barba.js was considered and rejected — it targets MPA/DOM-swap sites and fights React Router's ownership of the DOM).

**Product name: "The Forge"** (UI, PWA, README). Repo: `The-Forge` — renamed from `c-learning-roadmap` on the user's word, 2026 (GitHub redirects old links; the v1 data key `c-learning-roadmap-v1` inside `legacy/` intentionally keeps its name). **App mark:** hammer/anvil SVG (`public/hammer-anvil.svg`, mint-gradient) — topbar `<img>` and SVG favicon; the 64px PNG fallback covers engines without SVG-favicon support.

**TypeScript rule:** `strict: true`, no `any` in `src/data` or `src/engines`. The curriculum is typed data — a typo in a stage ID is a compile error, not a runtime bug.

## 2 · Directory structure

```
src/
  app/            router, providers, layout shell (TopBar, Nav, CommandPalette)
  features/
    today/        daily contract page
    roadmap/      journey map + stage detail
    arena/        quiz hub, quiz runner, boss gates
    viz/          visualization lab
    stats/        heatmap, streaks, tribunal archive, projections
    library/      resource canon
    settings/     profile, targets, bedtime, roast dial, data, diagnostics
  components/
    ui/           Button, Card, Chip, Ring, Bar, Checkbox, Modal, Toast, Tabs…
    tracker/      StageCard, PhaseGate, TaskRow, HoursMeter, FocusTimer
    quiz/         QuizCard + one renderer per format
    roast/        RoastOverlay, TribunalModal, DreadChip
  engines/        pure logic, zero React:
    schedule.ts   daily task generation (ported v2 logic, tested)
    quiz.ts       delivery, scoring, gating
    spacedReview.ts  SM-2-lite
    xp.ts         XP + ranks
    dread.ts      consecutive-bad-days, roast selection
    projection.ts finish-line dates
  stores/         progress.ts, daily.ts, settings.ts, quiz.ts (zustand slices)
  data/
    curriculum/   phases.ts, stages/s00…s18.ts, resources.ts
    quizzes/      stages/s00.ts … s18.ts (the 286 items)
    roast.ts      excuse/roast/dread corpora (ported + rewritten)
  lib/            dates.ts, format.ts, storage.ts, id.ts
  legacy-import/  v2 state parser + mapper
legacy/index.html  (untouched v2 app)
```

**Engine rule:** everything in `engines/` is pure functions over plain data — unit-testable without DOM, reused by stores. React never computes, it renders.

## 3 · Data model (the actual types)

### 3.1 Curriculum

```ts
type PhaseId = 'p0'|'p1'|'p2'|'p3'|'p4'|'p5';
type ResourceKind = 'book'|'video'|'site'|'tool'|'viz'|'practice';

interface Resource { id: string; label: string; url: string; kind: ResourceKind; cost?: 'free'|'paid'; }
interface Topic {
  id: string;                 // 's03.t4'
  order: number;
  title: string;
  concept: string;            // beginner-level explanation (the app renders this)
  resources: Resource[];      // primary first
  viz?: Resource;             // the "watch it move" companion
  quizRefs: string[];         // TT ids that check this topic
}
interface Drill { id: string; title: string; detail: string; difficulty: 1|2|3;
                  platform?: 'hackerrank'|'exercism'|'codechef'|'leetcode'|'local'; }
interface FlagshipBuild { id: string; name: string; brief: string; acceptance: string[]; }
interface Trap { id: string; mistake: string; why: string; quizRefs: string[]; }
interface Stage {
  id: string;                 // 's03'
  phase: PhaseId;
  title: string; goal: string; days: number;
  canStatements: string[];    // "You can…" outcomes
  topics: Topic[]; drills: Drill[]; build: FlagshipBuild; traps: Trap[];
  quizSetIds: string[];
}
interface Phase { id: PhaseId; title: string; stageIds: string[]; bossGateId?: string; }
```

### 3.2 Quizzes — discriminated union, one renderer per format

```ts
type QuizFormat = 'mcq'|'find-bug'|'predict-output'|'why-crash'|'fill-blank'|'match'|'ordering'|'fix-code';
interface CodeBlock { lang: 'c'; code: string; highlightLines?: number[]; }

interface BaseItem { id: string; stageId: string; topicId?: string; format: QuizFormat;
                     difficulty: 1|2|3; explanation: string; trapId?: string; }  // explanation = the "why", always shown
interface McqItem      extends BaseItem { format:'mcq'; prompt: string; options: string[]; answer: number; }
interface FindBugItem  extends BaseItem { format:'find-bug'; code: CodeBlock; faultyLine: number; }
interface PredictItem  extends BaseItem { format:'predict-output'; code: CodeBlock; answer: string; accept: string[]; }
interface WhyCrashItem extends BaseItem { format:'why-crash'; code: CodeBlock; symptom: string; options: string[]; answer: number; }
interface FillBlankItem extends BaseItem { format:'fill-blank'; code: CodeBlock;
                     blanks: { line: number; accept: string[]; hint?: string }[]; }
interface MatchItem    extends BaseItem { format:'match'; pairs: { left: string; right: string }[]; }
interface OrderingItem extends BaseItem { format:'ordering'; steps: string[]; correctOrder: number[]; }
interface FixCodeItem  extends BaseItem { format:'fix-code'; starter: string; brief: string;
                     tests: { name: string; stdin: string; expectedStdout: string }[]; }
type QuizItem = McqItem|FindBugItem|PredictItem|WhyCrashItem|FillBlankItem|MatchItem|OrderingItem|FixCodeItem;

interface QuizSet { id: string; stageId: string; kind: 'torture'|'boss'; title: string;
                    itemIds: string[]; passMark: number; }  // torture 0.7, boss 0.8
```

`fix-code` items are executor-agnostic: if the WASM spike lands they run in-browser; otherwise the runner renders a one-tap deep link into an online compiler pre-filled with `starter`. Scoring for fix-code = all tests pass.

### 3.3 User state (persisted; schema versioned)

```ts
interface ReviewCard { itemId: string; interval: number; ease: number; due: string; reps: number; lapses: number; }
interface DayRecord {
  key: string;                                    // 'YYYY-MM-DD'
  kind: 'study'|'sunday'|'catchup'|'rest'|'postponed';
  itemIds: string[];
  hoursLogged: number;
  verdict?: 'pass'|'fail'|'postponed'|'ghost'|'rest';
  closedAt?: string;
}
interface AppData {
  version: 3;
  startDate: string;
  settings: { weekdayTarget: number; sundayTarget: number; bedtime: string;
              roastIntensity: 'mild'|'spicy'|'nuclear'; theme: 'terminal'|'blueprint'|'system'; };
  checked: Record<string, boolean>;               // itemId → done
  notes: Record<string, string>;
  days: Record<string, DayRecord>;
  postponed: Record<string, string>;              // dateKey → excuse id
  customExcuses: string[];
  xp: number; pardons: number; insurance: number;
  quizResults: Record<string, { best: number; attempts: number; lastAt: string }>;
  review: Record<string, ReviewCard>;             // spaced-review queue
  focusSessions: { date: string; minutes: number; strict: boolean }[];
}
```

Storage: single key `cdr-v3` in localStorage (JSON), debounced writes, `storage.ts` owns read/write/migrate. Migration chain: `c-learning-roadmap-v1` (v2) → best-effort import, **user-invoked from Settings, never automatic**. Export/import = same JSON.

## 4 · Engines (pure, tested)

| Engine | Contract |
|---|---|
| `schedule.ts` | `buildSchedule(data, state, today) → DayEntry[]`. Ports v2 logic: stage pacing derived from `stage.days`, Sundays = milestone/review sessions, 2 consecutive ghosts arm a catch-up day. Identical behavior, now with 40+ unit tests. |
| `spacedReview.ts` | SM-2-lite: fail → interval 1d, ease −0.2 (floor 1.3), lapse++; pass → interval ladder × ease: 1→3→7→16→35→(n×ease). Due cards surface in Today as a review block (max 10/day). |
| `quiz.ts` | `selectItems(set, reviewQueue)` — interleaves formats, never two same-format items adjacent; `score(set, answers)`; gate check vs `passMark`; **boss fail → immediate same-day retry with re-rolled variants (confirmed), missed items into spaced review.** |
| `xp.ts` | Ranks rebalanced to v3 volume: checkbox 5xp, quiz pass 25xp, first-try 15 bonus, drill platform link-out verified by honor checkbox 10xp, build acceptance met 200xp, boss gate 500xp. |
| `dread.ts` | Consecutive bad days → level 0–5; roast corpus indexed by [intensity][tier][pickNR]; `Mild` caps tier at 2 and never uses glitch visuals; `Nuclear` = v2 behavior exactly. |
| `projection.ts` | Ported: actual-pace vs planned-pace finish dates from remaining items + rolling 14-day velocity. |

## 5 · Pages & UX mechanics

| Route | Mechanics |
|---|---|
| `/` Today | Review queue block (if due) → today's task stack → focus timer → Close Day ritual. One-glance contract; nothing else competes. |
| `/roadmap` | Vertical journey: 6 phase segments, boss-gate locks between them, stage nodes with progress rings; click → stage detail (topics ordered, each with resources + viz + quiz chips, drills, build brief, traps). |
| `/arena` | Torture tests by stage, boss gates, spaced-review session runner. Fix-code = embedded editor (spike) or deep-link (fallback). |
| `/viz` | Cards per topic: embed/link Python Tutor, VisuAlgo, Galles, godbolt; "trace → predict → run" exercise pattern; visual-notes canvas (freeform SVG). |
| `/stats` | Year heatmap, streak economy (insurance, pardons), dread ledger, tribunal archive, projections. |
| `/settings` | Everything incl. roast dial, v2 import, export, diagnostics (runs the ported Guardian checks + engine self-tests in-app). |

**Onboarding wizard** (first run only): name → start date → hour targets → bedtime → roast intensity → theme. 5 steps, skippable, re-editable in Settings.

**Command palette** (Ctrl+K): fuzzy nav to any stage/quiz/page + quick actions (toggle theme, start timer, close day).

## 6 · Design system — "Terminal Apprentice"

**Tokens (CSS custom properties, both themes):**

| Token | Terminal (dark, default) | Blueprint (light) |
|---|---|---|
| `--bg` | `#0B0E14` | `#EEF1F6` |
| `--panel` | `#11151D` | `#FFFFFF` |
| `--panel2` | `#161B26` | `#F7F9FC` |
| `--border` | `#232936` | `#D5DBE6` |
| `--text` | `#E6E1D5` (warm ink) | `#1A2233` |
| `--muted` | `#8B93A3` | `#5A6478` |
| `--good` | `#6FBF9A` | `#2E7D5B` |
| `--danger` | `#E0685E` | `#B34038` |

**Phase accents** (drive journey map, stage nodes, quiz difficulty, viz cards):

| Phase | Accent (dark) | Hue |
|---|---|---|
| P0 Launchpad | `#7C9CC4` | steel blue |
| P1 C Fluency | `#6FBF9A` | phosphor green |
| P2 Systems C | `#C4A96B` | amber |
| P3 Data Structures | `#A48FD8` | violet |
| P4 Algorithms | `#E08A6B` | coral |
| P5 Endgame | `#D8B45A` | gold |

**Type:** Space Grotesk (display/UI) · JetBrains Mono (code, numbers, timers, labels). Scale: 12/13/15/18/24/34. **Motion:** 150ms (micro) / 250ms (panels) / 400ms (stage expand), ease `[0.25,0.9,0.35,1]`; every animation gated behind `prefers-reduced-motion`. **Dread corruption** (levels 3–5) tints accents toward `--danger`, adds scanline/grain overlay, glitches the brand mark — implemented as `data-dread="0..5"` attribute selectors over the same tokens, so it composes with both themes.

**Component inventory (build order matters):** Button, Card, Chip, ProgressBar, ProgressRing, Checkbox (spring), Tabs, Modal, Toast, StageNode, PhaseGate, TaskRow, HoursMeter, FocusTimer, Heatmap, QuizCard ×8 formats, RoastOverlay, TribunalModal, DreadChip, CommandPalette, OnboardingWizard, Terminal (fake CLI block for concept explanations — the personality touch).

### Component sourcing — React Bits (per Farza)

Install the **TS-TW variant** of components via shadcn CLI (`npx shadcn@latest add @react-bits/<Name>-TS-TW`); during setup, add the **React Bits MCP server** — `npx shadcn@latest mcp init --client <client>` (Farza's Cursor variant: `--client cursor`; use the matching client flag for this workspace at build time) — so components can be browsed/fetched at build time. License (MIT + Commons Clause) is fine for this app.

**Mapped slots** (exact component search happens at build; names below are the library's): 

| App slot | React Bits piece | Why |
|---|---|---|
| Hero brand title | `DecryptedText` / `ScrambledText` | Terminal-decode entrance — the identity moment |
| Stat counters (XP, streak, %) | `CountUp` | Numbers tick up on load and on change |
| Boss-gate unlock ceremony | `ShinyText` + `AnimatedContent` | The gate opening should feel earned |
| Checkbox close / confetti moments | `ClickSpark` | Click ripples on every tick |
| Cards (journey nodes, viz cards) | `SpotlightCard` / `GlowCard` | Hover spotlight fits phosphor accents |
| Page/section entrances | `AnimatedContent` / `FadeContent` | replaces most hand-written Framer variants |
| Journey/hero background | `Particles` / `Aurora` / `DotGrid` | restrained, GPU-cheap |
| Dread corruption (levels 3–5) | text scramble on accents + background darkening | the corruption composes with `data-dread` tokens |

**Taste rule:** React Bits owns *ceremony* — hero, counters, unlocks, overlays. Data-dense UI (task rows, quiz cards, heatmap, tables) stays hand-built with plain tokens. Restraint is the aesthetic; animation is punctuation, not wallpaper. Every React Bits piece inherits our theme tokens (its variants are copy-owned source, so we re-point colors/fonts to the token system on install).

## 7 · WASM C spike (day one, timeboxed)

Goal: `fix-code` items run in a browser editor. Try: wasm-clang/wasi toolchain from CDN, lazy-loaded on first fix-code open (~20–30MB, cached by PWA). Accept if: hello-world + malloc/free + stdio work, cold load < 15s on broadband, no CORS issues from Vercel. Fail → `fix-code` renders pre-filled deep links (Programiz/OnlineGDB) with an "I made the tests pass" honor confirm. **Data model already supports both** (§3.2) — zero rework either way.

**Outcome (reconciled post-ship, decision 17):** the spike was never built — the timebox wasn't worth it, and fix-code ships permanently in the deep-link mode above. Reopen this only if the WASM toolchains become trivially embeddable; no data-model rework is needed either way.

## 8 · Testing & CI

- **Engines:** exhaustive unit tests (schedule edge cases: leap years, postponed chains, catchup+ghost interplay; SM-2 boundary values; gate math).
- **Quiz data:** schema validator test — every `itemIds` resolves, every `trapId`/`topicId`/`quizRefs` bidirectionally consistent, every stage has ≥ its blueprint count of items. This is the Guardian suite reborn as CI.
- **Components:** Today page, quiz runner, roast overlay (Testing Library).
- **CI:** GitHub Actions — typecheck → vitest → build, on every push; Vercel preview deploys per PR.
- **In-app diagnostics:** Settings page runs engine self-tests + data validators, shows pass/fail like v2's Guardian panel.

## 9 · Build order (workstream view — each is one sitting)

| WS | Delivers | Depends on |
|---|---|---|
| 1 | Scaffold: Vite/TS/Tailwind, tokens + 2 themes, router shell, storage.ts + tests | — |
| 2 | Curriculum data modules (stages s00–s18 as typed data) + schema validator | 1 |
| 3 | Roadmap UI: journey map, stage detail, progress | 1–2 |
| 4 | Schedule engine + tests, Today page, close-day, focus timer | 1–3 |
| 5 | Quiz engine + runner + 8 format renderers; author quizzes P0–P2 | 2 |
| 6 | Dread/roast/tribunal/insurance/bedtime port + roast dial | 4 |
| 7 | Stats, library, viz lab, onboarding, command palette, a11y pass | 1–6 |
| 8 | WASM spike (or fallback), quizzes P3–P5, v2 importer, PWA, deploy, README | 5–7 |

Parallel tracks are possible (2 & 3 in one sitting; 5 & 6 in one sitting).

## 10 · Decisions — RESOLVED (Farza, confirmed)

1. **Default theme:** Terminal (dark) — Blueprint remains the alternate theme
2. **Default roast intensity:** Spicy — full roast tiers minus the harshest ELDRITCH material and glitch visuals; dial stays in Settings
3. **Deploy:** replace the existing Vercel project in place — same URL, v2 app preserved at `/legacy/index.html`
4. **Fix-code execution:** spike WASM C toolchain on build day one (timeboxed); automatic deep-link fallback if it misses the bar
5. **Daily targets:** 3 h weekdays · 6–7 h Sunday (matches CURRICULUM.md budgets; editable in Settings)
6. **v2 progress:** fresh start at S00 — v2 import remains available in Settings but is never offered automatically
7. **Boss retries:** fail → immediate same-day retry, re-rolled variants; failures feed spaced review
8. **Git workflow:** main branch, one clean commit per workstream (no AI trailers), push only on Farza's word
9. **Brand:** **"The Forge"** — new UI/PWA/README name; repo and URL unchanged
10. **UI components:** React Bits (TS-TW) adopted for animated/ceremonial components, mapped in §6; MCP server added at scaffold time (`npx shadcn@latest mcp init --client <client>`)
11. **App mark:** hammer/anvil SVG — topbar, PWA icon, favicon; accent-tintable
12. **Default bedtime:** 23:30 (editable in Settings)
13. **Notifications:** enabled — PWA browser notification when bedtime passes with the day unclosed + streak-at-risk nudges; one permission grant, everything local
14. **Streak visibility:** topbar, always visible (v2-style ambient pressure)
15. **UX audit (UXAUDIT.md):** all 15 requirements **U1–U15 accepted** — routed Today-first IA, collapsed stages, mobile repairs (single-row hours, 56px topbar, scrollable heatmap), dark-first contrast retune, regrouped postpone flow, focus traps/Esc, journaled timer, debounced saves, designed empty states, Reset isolation, a11y fixes
16. **Smooth scroll:** Lenis adopted (reduced-motion aware); Barba rejected in favor of AnimatePresence route transitions
17. **Fix-code execution (post-ship):** WASM spike not pursued — deep-link mode (pre-filled OnlineGDB/Programiz + honor confirm) is permanent; see §7 outcome
