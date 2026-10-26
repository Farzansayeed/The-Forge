# AGENTS.md

## UI/UX Verification Rule (MANDATORY)

Whenever a task involves anything that renders in a browser — UI changes, UX flows, CSS/styling, components, pages, layouts, landing pages, dashboards, forms, animations, or any frontend behavior — verifying it in an actual browser is **mandatory, not optional**.

Before claiming any UI work is done, complete this loop:

1. **Run the app** (dev server or built output) and open it via browser automation:
   - `agent-browser` CLI (installed globally), or
   - Python Playwright (`webapp-testing` skill, headless Chromium is installed)
2. **Take screenshots** of the affected screens/states and actually look at them.
3. **Check the browser console** for errors, warnings, and failed network requests.
4. **Exercise the interaction** — click buttons, submit forms, navigate flows — and verify what happens *after* the interaction, not just the initial render.

Only when screenshots + console logs + interaction checks pass may the work be reported as done — and the report must state what was verified and how.

If something can be checked through the browser, it must be checked through the browser. No "should work" claims. Fixes found during verification (layout breaks, console errors, dead buttons) are part of the task, not follow-ups.
