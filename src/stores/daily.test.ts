import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { todayKey } from '../lib/schema';

/**
 * daily.test.ts — the day-rollover contract (WS3).
 * The rollover poller lives at module scope, so each test installs fake
 * timers FIRST and then imports the store fresh — the 30s interval must be
 * created under the fake clock for advanceTimersByTime to drive it. All
 * dates are anchored at 12:00 so no tick can cross a midnight inside a test.
 */
describe('daily store day rollover', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const middayToday = (): Date => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  };

  it('keeps serving the open day until a tick, then rolls onto the new local day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(middayToday());
    const { useDaily } = await import('./daily');
    const today0 = todayKey();
    expect(useDaily.getState().today).toBe(today0);

    // +2 days, still 12:00 — no timer has fired, so the store must still
    // serve the old day (this is the bug: tab left open overnight)
    const firstPoll = middayToday();
    firstPoll.setDate(firstPoll.getDate() + 2);
    vi.setSystemTime(firstPoll);
    expect(useDaily.getState().today).toBe(today0);

    // one 30s poll later, the store rolls onto the new local day
    vi.advanceTimersByTime(30_000);
    expect(useDaily.getState().today).toBe(todayKey());
  });

  it('rolls immediately when the tab regains visibility', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(middayToday());
    const { useDaily } = await import('./daily');
    const today0 = todayKey();
    expect(useDaily.getState().today).toBe(today0);

    const nextMorning = middayToday();
    nextMorning.setDate(nextMorning.getDate() + 1);
    vi.setSystemTime(nextMorning);

    // no interval tick happened (0s advanced) — restoring visibility must
    // roll the store at once, not 30s later
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(useDaily.getState().today).toBe(todayKey());
    expect(todayKey()).not.toBe(today0);
  });
});
