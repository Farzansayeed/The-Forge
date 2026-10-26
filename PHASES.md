# PHASES.md — The Forge build plan, phase by phase

**Companion to:** CURRICULUM.md (content) · DESIGN.md (tech spec, 17 decisions) · UXAUDIT.md (U1–U15 requirements).
**Source workstreams:** DESIGN.md §9, expanded into 9 phases. Each phase ends with the **Phase Gate** below.

---

## The Phase Gate Protocol (same every phase, no exceptions)

| Step | What happens |
|---|---|
| 1 · **Audit** | Self-review of everything built this phase against the phase's acceptance criteria + every U1–U15 requirement it touches. Data/URL validity re-checked. Drift from DESIGN.md flagged, not silently fixed. |
| 2 · **Check** | `tsc --noEmit` clean · `vitest run` green (full suite, not just new tests) · `vite build` succeeds · CI green on GitHub Actions. |
| 3 · **Debug** | App runs in the live preview at **1440 / 650 / 390 px**, both themes. Every flow of this phase exercised manually + **regression checklist** (grows each phase — all prior phases' flows re-tested). Console must be **clean**. Everything found gets fixed before the gate closes. |
| 4 · **Confirm** | Phase report to Farza: what shipped, test counts, screenshots, known issues, what's next. **Nothing proceeds without explicit approval.** |
| 5 · **Commit + Push** | One clean commit per phase (message below; **no AI trailers** — standing rule), pushed to `main` only after approval. Vercel auto-deploys; deploy health verified. |

---

## Phase 0 — Scaffold & Design System · *1 session*

**Goal:** an empty-but-alive app: routing, themes, tokens, storage — the foundation everything else sits on.

**Building**
1. Vite + React 18 + TS `strict` project in repo root; `legacy/index.html` preserved untouched
2. Tailwind v4 + the full token system from DESIGN.md §6 (Terminal dark **default**, Blueprint light) — including the U10 dark-first contrast retune
3. Fonts: Space Grotesk + JetBrains Mono; hammer/anvil SVG mark (accent-tintable) in topbar + favicon
4. Router: 7 routes with stub pages; **AnimatePresence route transitions**; Lenis smooth scroll (auto-off under reduced motion; sticky-topbar verified)
5. App shell: topbar (56px mobile rule U4, brand truncate, streak placeholder slot, theme toggle), bottom-safe layout
6. React Bits installed via shadcn CLI (TS-TW); MCP server configured; brand tokens re-pointed into installed components
7. Base UI kit: Button, Card, Chip, Modal (focus trap + Esc — U8 from day one), Toast, spring Checkbox, ProgressRing/Bar, Tabs
8. `lib/storage.ts`: versioned `cdr-v3` schema (DESIGN §3.3), debounced writes (U15), migrate/export/import functions — **with full unit tests**
9. Error boundary; global `prefers-reduced-motion` gate (U9); CI workflow (typecheck→test→build)

**Gate:** tokens flip cleanly both themes at 3 viewports · storage tests green · route transitions + Lenis feel right · console clean.
**Commit:** `Phase 0: scaffold The Forge — Vite/React/TS, token system, router shell, storage layer`

## Phase 1 — Curriculum Data Layer · *1–2 sessions*

**Goal:** CURRICULUM.md becomes typed, validated data — the single source of truth every screen reads.

**Building**
1. Types from DESIGN §3.1 exactly (Phase/Stage/Topic/Resource/Drill/FlagshipBuild/Trap)
2. `data/curriculum/`: phases.ts + stages/s00.ts…s18.ts — **every** stage fully encoded: canStatements, ordered topics with concept text + primary resource + viz companion + quizRefs, drills with platform tags, flagship builds with acceptance, traps
3. `resources.ts`: the full canon (books, video spine, viz tools, platforms) as data; URL spot-verified
4. **Validator suite** (the Guardian reborn): all IDs resolve · topic↔quiz refs bidirectional · per-stage blueprint counts from Appendix A · URL shape checks · completeness test fails while any stage is missing

**Gate:** validator 100% green with all 19 stages present · spot-audit of 3 stages against CURRICULUM.md · report shows per-stage counts.
**Commit:** `Phase 1: curriculum data layer — 19 stages encoded, validator suite`

## Phase 2 — Roadmap UI · *1 session*

**Goal:** the journey map + stage detail views — the curriculum becomes visible.

**Building**
1. `/roadmap`: 6 phase segments with phase accents; boss-gate lock visuals (inert until Phase 4); stage nodes with progress rings (React Bits CountUp/SpotlightCard per the §6 mapping)
2. **Stages collapsed by default (U2)**; stage detail view: ordered topics with concept explanations, resources + "watch it move" viz links, drills, build brief + acceptance, traps, quiz chips
3. Progress computed from the store (real %, per stage/phase/global)
4. Designed empty states (U12); `aria-controls` wiring (U14); keyboard-navigable nodes

**Gate:** journey map at 3 viewports · stage detail matches CURRICULUM.md content exactly (spot-check 3 stages) · keyboard-only walkthrough of the page.
**Commit:** `Phase 2: journey map and stage detail views`

## Phase 3 — Daily Engine & Today Page · *1–2 sessions*

**Goal:** the heart: the daily contract works end-to-end.

**Building**
1. `engines/schedule.ts` — v2 logic ported exactly (stage pacing from day budgets, Sundays = milestone sessions, postpone shifting, 2-ghost catch-up arming) + **40+ unit tests** incl. leap years, postpone chains, catch-up interplay
2. `engines/xp.ts` (rebalanced XP) + tests; `engines/dread.ts` level calculation (roast selection lands in Phase 6)
3. Stores: progress, daily, settings (zustand + persist)
4. `/today`: review-queue block (placeholder slot), task stack with **one checkbox instance per item** (U13 — links into stage detail), hours meter **single-row on mobile with direct numeric entry** (U3), Close-the-Day verdict ritual, reopen-today, postpone flow **regrouped** (Valid/Invalid/Custom, "Keep studying" pinned — U6) with taunt interrogation
5. Focus timer: free-running, journaled per second (U7), survives refresh; bedtime check hook (full lockout in Phase 6)
6. Streak counter live in the topbar (decision 14)

**Gate:** schedule property tests green · full daily loop (tick → log hours → close → verdict → reopen → postpone → catch-up appears) exercised in preview · 390px hours control single-row (screenshot) · regression list: Phases 0–2 flows.
**Commit:** `Phase 3: daily engine, Today page, close-day ritual, focus timer`

## Phase 4 — Quiz Engine & Renderers · *1 session*

**Goal:** the Arena machinery — all 8 formats runnable, gated, scored — proven on a sample set before mass authoring.

**Building**
1. `engines/quiz.ts`: item selection (format-interleaved, no adjacent repeats), scoring, passMark checks, **boss-fail → immediate same-day re-rolled retry** (decision 7), failures routed to spaced review
2. `engines/spacedReview.ts` (SM-2-lite: 1→3→7→16→35→×ease; lapses; due ≤10/day into Today) + boundary tests
3. `/arena` hub; QuizCard + **8 renderers**: mcq · find-bug (line-select) · predict-output (normalized matching) · why-crash · fill-blank · match · ordering · fix-code (**deep-link mode: pre-filled Programiz/OnlineGDB + honor confirm** — WASM upgrades it in Phase 8)
4. Boss-gate UI + phase unlocking wired to real passMarks
5. Sample content: the **24 S03 items** (the quality probe Farza judges) + one set per other format

**Gate:** engine tests green · every format exercised by hand in preview · XP/gate/review integration verified · S03 items reviewed by Farza for voice + difficulty.
**Commit:** `Phase 4: quiz engine, eight renderers, boss gates, spaced review`

## Phase 5 — Quiz Content: Phases 0–2 · *2–3 sessions*

**Goal:** author the real Torture Tests for S00–S06 — every format, every trap.

**Building**
1. All P0–P2 items per Appendix A blueprints: S00 ×8 · S01 ×16 · S02 ×16 · S03 ×24 (already drafted) · S04 ×14 · S05 ×14 · S06 ×14 = **106 items**
2. Boss exams 1–2 (S01–S03, S04–S06 · 20 items each, ≥80%, mixed formats incl. 1 fix-code each)
3. Every item: `explanation` (the "why" in one sentence), trap linkage, difficulty, micro-resource link on failure
4. Validator extended: blueprint-count enforcement per stage — content incomplete = CI red

**Gate:** validator green at exact blueprint counts · a11y of quiz runner at 3 viewports · **play every set myself end-to-end** (debug step) · regression: Phases 0–4.
**Commit:** `Phase 5: torture tests for Phases 0–2 (106 items) + boss exams 1–2`

## Phase 6 — Accountability Systems · *1 session*

**Goal:** the personality, ported whole: Dread, roasts, tribunal, insurance, bedtime.

**Building**
1. Roast corpus ported + rewritten sharper; `Mild/Spicy/Nuclear` dial (Spicy default) driving tier caps and visual corruption
2. RoastOverlay (glitch-in, React Bits ScrambledText) · Dread Engine: `data-dread="0..5"` attribute theming (accents→danger tint, scanline/grain, logo corruption) · auto-roast checks
3. Sunday Tribunal (stamps FLAWLESS→ABYSMAL, week grid, sealed message) + Day Inspector · Pardon tokens (10 clean days) · Streak Insurance 💤 (burn flow)
4. Bedtime Lockout: nag banner → overlay → **PWA notification when bedtime passes with day unclosed** (decision 13, permission-gated)

**Gate:** dread state-machine tests · tribunal math tests · notification flow with/without permission · **all glitch/pulse effects verified off under reduced-motion (U9)** · regression: Phases 0–5.
**Commit:** `Phase 6: dread engine, tribunal, insurance, bedtime lockout`

## Phase 7 — Stats, Library, Viz Lab, Onboarding, Command Palette · *1–2 sessions*

**Goal:** the remaining surfaces + the polish that makes it feel finished.

**Building**
1. `/stats`: year heatmap (horizontally scrollable, week labels, ≥30px touch cells — U5), streak economy, dread ledger, tribunal archive, finish-line projection engine
2. `/library`: searchable, filterable canon (books/videos/viz/platforms with phase tags)
3. `/viz`: Visualization Lab — per-topic viz cards, deep-linked Python Tutor/VisuAlgo sessions, visual-notes canvas
4. Onboarding wizard (5 steps: name → start date → targets → bedtime → roast dial + theme)
5. Command palette (Ctrl+K): fuzzy nav to stages/quizzes/pages + quick actions
6. **Full a11y + perf pass:** focus traps everywhere (U8), aria labels (U14), Reset isolated (U11), lazy routes + code splitting, render audit, debounced saves verified (U15)

**Gate:** Lighthouse a11y ≥90 both themes · keyboard-only full-app walkthrough · mobile sweep · regression: Phases 0–6.
**Commit:** `Phase 7: stats, library, viz lab, onboarding, command palette, a11y/perf pass`

## Phase 8 — WASM Spike, Remaining Content, PWA, Deploy · *2–3 sessions*

**Goal:** the endgame — in-browser C (or its fallback), all remaining quizzes, ship it.

**Building**
1. **WASM spike, timeboxed:** clang/wasi toolchain lazy-loaded from CDN on first fix-code open; accept per DESIGN §7 bar (hello-world + malloc + stdio, cold load < 15s, no CORS pain) → upgrade fix-code to embedded editor; else deep-link mode confirmed permanent
2. Author P3–P5 content: S07 ×12 · S08 ×22 · S09 ×16 · S10 ×18 · S11 ×24 · S12 ×20 · S13 ×16 · S14 ×14 · S15 ×12 · S16 ×18 · S17 ×8 = **180 items** + Boss 3–4 (50 items)
   *(split reconciled with the shipped `src/data/quizzes/blueprint.ts` — S10/S11 and S13/S14 were rebalanced during authoring; the 180 total never changed)*
3. v2 importer: parser + best-effort mapper + tests (Settings-invoked only, decision 6)
4. Full PWA: manifest, hammer/anvil icons, service worker (offline), installable
5. Diagnostics page: engine self-tests + data validators runnable in-app (Guardian's spirit, final form)
6. Deploy: **replace Vercel project in place** (decision 3), `/legacy` preserved; README rewritten for The Forge; **final audit: U1–U15 checklist verified item by item in the live app**

**Gate:** everything above + full-app regression across all 3 viewports and both themes + live-production smoke test on the Vercel URL.
**Commit:** `Phase 8: wasm decision, remaining quizzes (230), PWA, v2 importer, deploy`

**Outcome (reconciled post-ship, 2026):** the WASM spike was **not** built — timeboxing won, and the already-designed deep-link fallback shipped as the permanent fix-code mode (pre-filled OnlineGDB/Programiz + honor-system confirm; recorded as DESIGN.md decision 17). Everything else in this phase shipped as planned; the quiz counts above now match `blueprint.ts` exactly.

---

## Timeline (honest revision)

| Phase | Sessions | Running total |
|---|---|---|
| 0 Scaffold | 1 | 1 |
| 1 Curriculum data | 1–2 | 2–3 |
| 2 Roadmap UI | 1 | 3–4 |
| 3 Daily engine | 1–2 | 4–6 |
| 4 Quiz engine | 1 | 5–7 |
| 5 Content P0–P2 | 2–3 | 7–10 |
| 6 Accountability | 1 | 8–11 |
| 7 Stats/polish | 1–2 | 9–13 |
| 8 Endgame | 2–3 | **11–16** |

*(This supersedes the earlier 6–8 estimate — content authoring is the long pole and it's now sized honestly.)*

## Post-roadmap (explicitly out of scope for these phases)

S19 concurrency/sockets extension · additional quiz packs · spaced-content growth · any redesign iteration born from real usage.
