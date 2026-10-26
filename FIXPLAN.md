# FIXPLAN.md — The Forge repair execution contract

**Purpose:** after any context compaction, point here and continue building without guesswork.
The findings/evidence behind every item live in **`AUDIT-2026-10-26.md`** (same commit). This file
carries the plan, the rules, the environment quirks, and the status ledger. Update the ledger and log
**at the end of every workstream** and include the update in that workstream's commit.

---

## 0 · Ground truth at plan creation (2026-10-26)

- Repo: `C:\Users\farza\github\roadmap` → GitHub **Farzansayeed/The-Forge**, branch `main`.
- `main` = `8c23daf` "Logo: crisp hammer-anvil SVG mark for TopBar + favicon" — pushed, CI green.
- Tests baseline: **94/94** (README + ARCHITECTURE state 94 — keep counts consistent when adding tests).
- Build: entry `index-*.js` **459.01 kB / 150.51 gz** (carries curriculum data), quiz chunk 201.31/65.73,
  ElectricLogo 71.97 (lazy), route chunks ≤ ~23 kB.
- Live: **https://the-forge-cdsa.vercel.app/** (project-level domain, follows production; design decision).
- Vercel: project `the-forge`, scope `farzan4`. `VERCEL_TOKEN` exists as env var in the shell — use
  in-memory only; **never print, log, or commit it**.
- Localstorage schema: key `cdr-v3`, `version: 4`.
- Audit files (`AUDIT-2026-10-26.md`, `FIXPLAN.md`) are created+committed before any code change.

## 1 · Operating rules (non-negotiable)

1. **Push only on the user's explicit word.** Commits stay local until then; the user authorizes per
   task ("commit"/"push" separately).
2. **One clean commit per workstream.** No AI trailers (no "Generated with…", no "Co-Authored-By:").
   Draft messages below; may be refined to fit reality.
3. **AGENTS.md mandate:** any change that renders in a browser needs real-browser verification before
   "done": run `npm run preview` (bg, port 4173), drive it with `agent-browser`, **actively look at
   screenshots**, check `errors` (console) + `network requests`, exercise the actual interaction, and
   report in the final message exactly what was verified and how. Fix anything found in the loop.
4. **Gates before every commit:** `npm run typecheck` → `npm test` → `npm run build`. If tests were
   added/removed, update the count claims in README/ARCHITECTURE in the same commit.
5. Never `git add -A` blindly with planning docs present — stage explicit paths only.
6. Never edit files that the parallel audits' claims rest on without re-verifying the line still says
   what the audit says (code may shift); re-grep before each surgical edit.
7. Scope honesty: if a workstream's investigation reveals the audit was wrong about a line, correct the
   audit file too (keep it truthful) in the same commit.

## 2 · Environment quirks (PowerShell + agent-browser v0.39.4)

- PowerShell **eats** `||`, `? :`, advanced regex inside double-quoted `eval` strings — keep JS in
  `agent-browser eval` dead simple: single quotes inside, no regex metachar tricks, `function(){}`,
  arrays, no control chars. If a complex eval fails twice, use `snapshot` output instead.
- `agent-browser screenshot` signature is `[selector] [path]` — NO `--path` flag. Save to
  `$env:TEMP\opencode\*.png`. Always `read`/view screenshots before judging.
- `snapshot -i` for clickable refs; **refs go stale** after DOM/motion updates — re-snapshot before
  each click batch. `find text` can match hidden rows (e.g. closed CommandPalette's "Stats") — when a
  click errors "covered/not visible", suspect palette clutter and use explicit `@ref` from a fresh
  `snapshot -i`.
- Useful: `set viewport W H`, `set offline on|off`, `set media reduced-motion`, `network requests`,
  `a11y` (axe), `vitals --json`, `console`, `errors`, `reload`, `back`, `press Escape|Tab|Control+k`.
- Offline SW test only works over HTTPS (`index.html:25` gate — WS8 changes this): local offline
  checks are delegated to the live site, or after WS8 to localhost.
- Teardown after each verification: `agent-browser --session <name> close`, then
  `Get-NetTCPConnection -LocalPort 4173 → Stop-Process` the owning PID.
- `npm run preview` must be started as **background** and killed by PID at the end (never leave it).
- Screenshots already captured for the audit live in `%TEMP%\opencode\audit-*.png` (temp; may vanish).

## 3 · The workstreams (execute top-down; gates + verification always apply)

### WS1 · Close-day verdict dialog: orphan scrim freeze `[🔴 live bug]`
- **Repro (keep as test script):** Today → "✦ Close the day" → chip modal → "Pass — I put in the work"
  → verdict dialog ("Verdict: pass …", buttons "Close the day"/"Wait, not yet") → click the dialog
  **body** → content unmounts, but full-screen scrim (`rgba(4,6,10,0.6)`, `z=90`, `pointer-events:auto`,
  `Modal.tsx:70` value) stays and the app is click-dead everywhere (`elementFromPoint` over nav hits
  the scrim). Clicking the dialog's own **"Close the day" button** clears scrim correctly.
- **Investigate first:** read `src/components/ui/Modal.tsx` (scrim/trap/Esc logic), the verdict modal
  mount in `src/features/today/TodayPage.tsx` (search "Verdict", "Wait, not yet", "TARGET MISSED"),
  `src/features/dread/RoastOverlay.tsx` (the roast line lives here or in the verdict dialog). Decide
  the real owner of the scrim's lifecycle. Likely one of: (a) dialog content conditionally unmounts
  while a parent keeps the scrim mounted, (b) a body-click dismiss handler closes inner state only,
  (c) two sibling overlays each keep a scrim.
- **Fix principle:** one component owns dialog+scrim lifecycle; body-click/Esc must unmount the whole
  overlay; the button path must keep working.
- **Acceptance:** scripted browser repro (fresh session): both dismissal paths leave zero
  full-screen fixed scrim elements; nav clickable (`elementFromPoint` hits page content); passes in
  dark theme (and light spot-check); typecheck/tests green.
- **Commit:** `Bugfix: close-day verdict dialog can strand an orphan scrim (app froze on inline dismiss)`

### WS2 · Persistence fail-safety `[🔴 + 🟠]`
- `src/lib/storage.ts:62-72` — before `persistDefault()` overwrites the key on corrupt parse/validate/
  migrate, stash the raw original text under `<key>.bak` (only if `.bak` not already holding a
  different corrupt payload; never overwrite a previous .bak with a fresh default).
- `src/lib/storage.ts:16-25` — `writeNow()` must NOT consume `pending` when `setItem` throws; expose a
  one-bit degraded flag on the settings/daily store so Diagnostics can show "storage degraded" (no
  console — src has a zero-console policy).
- Tests in `src/lib/storage.test.ts`: corrupt payload → `.bak` holds original text + defaults load;
  throwing setItem → pending retained and retried on next flush.
- **Commit:** `Storage: never clobber corrupt state, keep pending work on write failure`

### WS3 · One local day key everywhere `[🟠 correctness]`
- First move `todayKey()` (from `src/stores/daily.ts:4,14`) to `src/lib/dates.ts` (check import graph
  for cycles first) and swap these UTC-day sites to it:
  `RoastOverlay.tsx:29`, `DreadProvider.tsx:15`, `BedtimeLockout.tsx:24,49`, `TodayPage.tsx:445`,
  `StatsPage.tsx:237`, `TribunalCard.tsx:88`, `quiz.ts:49`, `ArenaPage.tsx:89`.
- Add midnight rollover to `useDaily` (`daily.ts:105`): on `visibilitychange` (visible) + a ≤60 s
  clock check comparing `todayKey()` against the store's current key → call existing `refresh()`.
- Tests: date helper unit tests (UTC-/local crossing via fixed-offset ISO path is not runtime-
  fakeable simply — cover `todayKey()` correctness + the rollover effect with vitest fake timers).
- **Commit:** `Dates: single local day key across dread/tribunal/quiz/arena + midnight rollover`

### WS4 · WCAG AA contrast retune `[🔴 a11y]`
- Retune `--faint` dark+light (`src/styles/tokens.css:24,:68`) and light `--p5` (`:84`) to ≥4.5:1 on
  their real surfaces. Compute with the audit's ratio helper (luminance formula), pick the closest
  acceptable tone; document chosen values in the commit message.
- Add SVG-check: run `agent-browser a11y` on Today + Roadmap + Stats under both themes → **zero**
  contrast violations; eyeball month labels/eyebrows at 100% zoom.
- Keep hue family (no surprise design change); only lift lightness/darkness.
- **Commit:** `Design: --faint and light --p5 retuned to 4.5:1 (both themes)`

### WS5 · Reduced motion for the animation engine `[🟠 U9]`
- `src/app/App.tsx`: wrap the routed tree in `<MotionConfig reducedMotion="user">` (motion/react).
- Emulation check: `set media reduced-motion` → stage expand/chevron/routes/CountUp no longer slide;
  CSS transitions already die via `tokens.css:185-193`. Document that opacity cross-fades may remain
  (allowed; continuous large-area motion is what U9 targets).
- **Commit:** `Motion: honor prefers-reduced-motion in the engine (MotionConfig)`

### WS6 · Scroll contract on navigation `[🟠 UX]`
- Add scroll reset **on push** navigations only (POP keeps browser behavior): an App-level effect on
  `location.pathname`; skip when `location.hash` exists (roadmap deep-link mode, DESIGN decision 17 —
  verify how hashes currently anchor and keep them working).
- Verify: scroll Today 600px → push Arena → 0; back → Today as left (or verify+record actual POP
  behavior and note it).
- **Commit:** `Nav: scroll-to-top on route push (deep-link hashes preserved)`

### WS7 · Boss-quiz chrome stays reachable `[🟠 UX]`
- `QuizRunner.tsx` header row (back ‹, format tag, Leave quiz is aria-only) must remain visible while
  the question scrolls: make the header row `position: sticky` below the topbar (topbar height
  context: brand 56 + nav row on mobile), or hoist it out of the scrolling region. Check interplay
  with the progress dots. Also give "Leave quiz" a visible text (currently aria-labeled icon-only).
- Verify: open boss gate → navigate to Q2 (Find-the-Bug, tall) → scroll to bottom → header still
  visible + clickable; screenshot before/after.
- **Commit:** `Arena: quiz title/back/leave stay sticky over long questions`

### WS8 · Service worker hardening `[🟠 PWA]`
- `public/sw.js`: (a) `activate()` prunes **all** caches whose name matches a known prefix and doesn't
  equal the current one (asset+font+shell), keyed by a **build-injected version token**; (b) wrap the
  SWR background revalidate chain in `event.waitUntil(...)` (:89-96); (c) drop stale shell fallback
  risk assumption — navigations are already network-first (:66-82), keep.
- Version injection: add a tiny Vite closeBundle hook (build-only) replacing a `__BUILD_ID__` token in
  `public/sw.js` with `Date.now()`-based id (or git short hash) — file lives in `dist/` post-copy.
  Wire into `vite.config.ts`. (Fallback if plugin is fussy: npm build script step editing dist/sw.js.)
- `index.html:25` — register when `(location.protocol === 'https:' || hostname in
  ['localhost','127.0.0.1'])` so local offline tests work; `.catch(console.warn)` (this script is not
  subject to the src zero-console rule).
- Verify: build twice → two distinct cache names; localhost offline reload works after first visit;
  old prune test via devtools registrations list.
- **Commit:** `PWA: build-injected SW version, full cache pruning, awaited revalidate, localhost registration`

### WS9 · Focus timer survives reload `[🟠 U7]`
- Persist the running session on the day record: `{timerStartedAt (ms), timerPaused: boolean, baseSeconds}`
  via the existing debounced save; on load, if running → derive elapsed = baseSeconds + (now -
  startedAt)/1000 and resume ticking; paused sessions restore paused.
- Reconcile with the STRICT checkbox state. Keep "✓ Log" behavior identical.
- Verify live with the WS checklist: start → reach 00:20 → reload → clock ≥00:20 continuing; stop;
  also paused-persistence check. Add/adjust store test if cheap.
- **Commit:** `Timer: running focus session resumes across reload`

### WS10 · Shared Button with real interaction states `[🟠 design debt]`
- Create `src/components/ui/Button.tsx` (variant/size/type props) + a small interaction CSS layer
  (tokens-native): `.forge-btn:hover`, `:active`, `:focus-visible` per theme — because inline styles
  can't express pseudo-classes. Keep clay-flat look; add feedback, not new decoration.
- Refactor the four `btn()` factories (`TodayPage.tsx:16`, `arena/shared.tsx:5`, `SettingsPage.tsx:15`,
  `Onboarding.tsx:20`) to delegate to Button (call sites unchanged); ports their special cases
  (sizing tweaks preserved).
- Verify visually: hover/press/focus on Today's Close-the-day, Arena's Check answer, Settings chips;
  screenshots pre/post; keyboard tab-through shows focus ring.
- Out of scope (deferred note): full inline-style→classes migration (~389 objects), spring Checkbox,
  Card — record as WS15 follow-ups.
- **Commit:** `Components: shared Button with hover/press/focus states (unify four btn() factories)`

### WS11 · Docs truth-up + dead code `[🟡 trust]`
- DESIGN.md: §-ledger line about U1–U15 ("accepted") → reflect reality (8 pass / 3 partial / 4 fail,
  pointing at AUDIT-2026-10-26.md); fix §3.3 `ReviewCard {step,lastAt}`; §4 theme enum (2 values);
  palette quick-actions + fix-code-editor contract lines → mark shipped subset + deep-link mode
  (decision 17); retitle "(v3)" → versionless or "(v4)" to match `SCHEMA_VERSION`.
- UXAUDIT.md: note Reset unshipped (D4/U11 row) instead of implying acceptance (coordinate with
  `SettingsPage.tsx:12` comment).
- `git grep` both dead components (`AnvilMark.tsx`, `DecryptedText.tsx`) → zero importers → delete;
  update ARCHITECTURE.md doc map if it names them; ensure react bits catalog reference removed if
  dangling.
- **Commit:** `Docs: contract truth-up from the 2026-10-26 audit; remove dead components`

### WS12 · Copy + consistency batch `[🟡 user-visible]`
- Verdict roast state-aware: "Target smashed…" must become miss-aware ("Target missed — …")
  (locate template in close-day flow / RoastOverlay).
- Length numbers: onboarding "23-week" → state truth of the built engine (86 days ≈ ~12 weeks) with
  the 19-stage framing; make ROADMAP "1/230 items" and STATS "1/6034" labels self-explanatory — first
  investigate what 6034 actually counts (likely sums per-day/checkbox scope wrong — see STAGES items).
  Fix the computation if it's a bug; otherwise label the denominator.
- Diagnostics noun-plurals (`"1 days · 1 checks"` → pluralize helper).
- Mobile: brand tagline ellipsis; nav overflow edge fade so hidden items are discoverable.
- Intro: wording to match auto-pass behavior ("CLICK TO SKIP" → "click to skip — continues on its
  own"), and consider once-per-day gating (decide: keep simple wording fix only, note the gating
  option for the user).
- Each item verified by its own screenshot; copy changes reviewed for voice consistency.
- **Commit:** `Copy: state-aware verdicts, honest length numbers, mobile truncation + intro wording`

### WS13 · Quality/perf consolidation batch `[🟡-🟠]`
Individually small, semantically grouped (one commit):
- `StatsPage.tsx:141` heatmap O(n²) indexOf → index map.
- Bars: width → `scaleX` transitions (`TodayPage.tsx:159`, `QuizRunner.tsx:153`).
- `SpotlightCard.tsx:25-29` rAF-throttle mousemove (+ verify 19 cards on Roadmap remain smooth).
- `renderers.tsx:434-435` button-inside-anchor → styled `<a>`.
- `ArenaPage.tsx:203` accent string-munging → real stage→phase lookup from PHASES data.
- `SettingsPage.tsx:67-74,130` commit persistence on blur/Enter (and empty→no-op, not default); keeps
  freshness of targets without keystroke storms.
- Pollers (`RoastOverlay.tsx:50`, `BedtimeLockout.tsx:61`, `DreadProvider.tsx:22`, `TodayPage.tsx:273`)
  → read from stores instead of `loadData()` parsing per tick.
- `BedtimeLockout.tsx:129-186` alertdialog gets a real focus trap + Esc.
- Import refresh: after v2 import, refresh checked-mirror store (`progress.ts` subscribe to
  forge:data-changed) so checkboxes reflect immediately (no reload).
- (Optional stretch, only if trivially safe): cross-tab `storage` event → refresh stores.
- **Commit:** `Quality batch: perf + HTML validity + timer/dread pollers + import freshness`

### WS14 · react-router-dom 6→7 `[🟠 security hygiene]`
- `npm audit --omit=dev` currently reports 2 moderates (incl. open-redirect) on router 6.
  Migrate: router APIs used are basic (BrowserRouter/Route/Link/useParams/useNavigate) — expect few
  code changes. Full gates + route smoke of all 9 routes + 404.
- **Commit:** `Router: react-router-dom 7 (clears two moderate advisories)`

### WS15 · Deferred follow-ups (require user's explicit approval; do not schedule silently)
- Entry-bundle slimming (curriculum `concept` strings → async chunk) — biggest perf win available.
- Zustand `persist` middleware consolidation + shared hydrate (removes per-store load/parse pattern)
  + cross-tab sync done properly.
- Inline-style → Tailwind/class migration at scale (~389 objects; unlocks responsive/focus states
  permanently). Big refactor; propose a phased plan first.
- Ship the actually-isolated **Reset** (U11) or remove it from the contract entirely.
- Palette quick actions beyond toggle-theme (start timer / close day) per original contract.
- Component Card + spring Checkbox completion (finish the promised library).
- Nullish `--faint`-adjacent: audit light-theme `--p5` usage everywhere (done in WS4 for token value).

## 4 · Per-workstream protocol (exactly)

1. Re-grep the target files and confirm line numbers still match the audit (files may have shifted).
2. Implement the fix. No scope creep beyond the WS's bullet list; anything discovered → next WS or
   note in ledger.
3. Gates: `npm run typecheck` + `npm test` + `npm run build` (watch for count changes → update
   README/ARCHITECTURE in the same commit).
4. Browser loop per §1 rule 3 when the change is user-visible (WS1-12 all are). Evidence: at least one
   new screenshot per affected surface (save `%TEMP%\opencode\fx-<ws>*.png`), zero console failures,
   real interaction exercised.
5. Update §5 ledger row + append a line to §6 log (include test count; note any deviations honestly
   in the commit + ledger).
6. Commit (no push). Report to user; **wait for the word** ("push"/"next" indicates what's allowed).
7. After every ~3 workstreams (or end of session), offer a push if backlog exists.

## 5 · Status ledger (update + re-commit with each workstream)

| WS | Scope | Status | Last touched | Commit | Tests |
|----|-------|--------|--------------|--------|-------|
| WS1 | verdict-dialog orphan scrim | DONE (blocker retracted → trap hardening + scrim token) | 2026-10-26 | this commit | 94 |
| WS2 | persistence fail-safety | DONE | 2026-10-26 | this commit | 99 |
| WS3 | local day key everywhere | TODO | — | — | 94 |
| WS4 | WCAG AA contrast | TODO | — | — | 94 |
| WS5 | MotionConfig reduced motion | TODO | — | — | 94 |
| WS6 | scroll contract | TODO | — | — | 94 |
| WS7 | quiz chrome sticky | TODO | — | — | 94 |
| WS8 | SW hardening + versioning | TODO | — | — | 94 |
| WS9 | timer survives reload | TODO | — | — | 94 |
| WS10 | shared Button states | TODO | — | — | 94 |
| WS11 | docs truth-up + dead code | TODO | — | — | 94 |
| WS12 | copy consistency batch | TODO | — | — | 94 |
| WS13 | quality/perf batch | TODO | — | — | 94 |
| WS14 | router 6→7 | TODO | — | — | 94 |
| WS15 | deferred follow-ups | NOT SCHEDULED | — | — | — |

## 6 · Append-only execution log

- 2026-10-26 — Fixplan created (this file) + `AUDIT-2026-10-26.md` committed; main at `8c23daf`;
  94/94 tests green; CI green on `8c23daf`.
- 2026-10-26 — Planning docs committed as `Docs: 2026-10-26 full audit + prioritized fix plan`
  (`408d952`).
- 2026-10-26 — **WS1 done.** Investigation FIRST disproved audit blocker #1: 3 controlled body clicks
  on the open verdict dialog left the state invariant (`dialogs:1, scrims:1`; content never unmounts
  without its scrim — Modal is one conditional subtree, `open ? <scrim+dialog> : null`). Original
  "stuck" state was a legitimately open modal (content visible op=1 in the capture). Audit §1
  truth-up'd. Real fixes shipped in the same component: Modal trap effect deps `[open,onClose]`→
  `[open]` with callback read via ref (inline `onClose` identities no longer churn the keydown trap +
  focus juggling on parent re-render), and hardcoded `rgba(4,6,10,0.6)` scrim → `var(--scrim)`
  (terminal: shipped value verbatim; blueprint: ink veil `rgba(26,34,51,0.35)`). Verified live
  (agent-browser, rebuilt dist): paths A scrim-ring tap / B Esc (focus restored to trigger) /
  C confirm button all leave 0 dialogs + 0 fixed scrims in BOTH themes; screenshots
  `fx-ws1-verdict-{dark,light}.png`; console clean; typecheck ✓; 94/94 ✓; build ✓
  (entry 459.06 kB / 150.52 gz). Commit: `Modal: harden trap lifecycle, theme-native scrim;
  audit blocker #1 corrected`.
- 2026-10-26 — **WS2 done.** `storage.ts`: corrupt payloads (bad JSON, invalid shape, failed
  migration) are stashed at `BACKUP_KEY` (`cdr-v3.bak`) exactly once — first corrupt snapshot wins,
  never overwritten — before fresh defaults serve; failed `setItem` no longer consumes `pending`
  (work retried on next flush/pagehide) and sets a one-bit `degraded` flag, cleared on first
  success; new exports `BACKUP_KEY / isSaveDegraded() / hasCorruptBackup()`. Diagnostics gained a
  `Save reliability` row between "Storage writable" and "Curriculum" (WARN for degraded writes or an
  existing corrupt backup, honest recovery guidance in the detail). +5 unit tests (stash on corrupt
  JSON, stash on invalid shape, first-stash-wins, healthy loads never stash, rejected write keeps
  pending + flush retry + flag self-heal) → **99/99**; README + ARCHITECTURE counts updated. Verified
  live (rebuilt dist, agent-browser): injected `CORRUPTED-BY-WS2-VERIFICATION` into `cdr-v3` → reload
  → payload recovered verbatim from `cdr-v3.bak`, app served defaults, Diagnostics showed
  `Save reliability — WARN` (screenshot `fx-ws2-diagnostics2.png`, headline "MINOR SCARS"); real
  ledger restored byte-identical (299 bytes), `.bak`/temp keys removed, app reloaded clean, console
  clean; gates typecheck ✓ 99/99 ✓ build ✓ (entry 459.32 kB / 150.62 gz). Commit:
  `Storage: never clobber corrupt state, keep pending work on write failure`.
