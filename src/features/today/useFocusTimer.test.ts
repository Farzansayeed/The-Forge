import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadData } from '../../lib/storage';
import { todayKey } from '../../lib/schema';
import { useFocusTimer } from './useFocusTimer';

/**
 * useFocusTimer.test.ts — the WS9/U7 reload contract.
 * A live focus session is snapshotted onto the day record through the
 * debounced save (pagehide/unmount persist it, then flush); mounting
 * reads it back and resumes on the same wall-clock anchor. A reload —
 * simulated here with unmount + a fresh mount — must NEVER journal on
 * its own: focusSessions grows only on an explicit Log, so reload can
 * neither double-count nor silently drop a sub-30s session.
 */
describe('useFocusTimer survives reload (WS9)', () => {
  const DAY = todayKey(new Date('2026-10-26T12:00:00'));

  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('restores a running session at ≥ the pre-reload clock and keeps ticking', () => {
    const first = renderHook(() => useFocusTimer(DAY));
    act(() => first.result.current.start());
    act(() => vi.advanceTimersByTime(21_000));
    first.unmount(); // the "reload": pagehide-class persist + flush

    const d = loadData();
    const rec = d.days[DAY];
    expect(rec?.timerStartedAt).toBeTypeOf('number');
    expect(rec?.timerPaused).toBe(false);
    expect(rec?.baseSeconds).toBe(0);

    const again = renderHook(() => useFocusTimer(DAY));
    expect(again.result.current.state).toBe('running');
    expect(again.result.current.elapsed).toBe(21);
    act(() => vi.advanceTimersByTime(3_000));
    expect(again.result.current.elapsed).toBe(24);
  });

  it('restores a paused session exactly as it was paused', () => {
    const first = renderHook(() => useFocusTimer(DAY));
    act(() => first.result.current.start());
    act(() => vi.advanceTimersByTime(9_000));
    act(() => first.result.current.pause());
    expect(first.result.current.elapsed).toBe(9);
    first.unmount();

    const again = renderHook(() => useFocusTimer(DAY));
    expect(again.result.current.state).toBe('paused');
    expect(again.result.current.elapsed).toBe(9);
    act(() => vi.advanceTimersByTime(10_000)); // paused time counts for nothing
    expect(again.result.current.elapsed).toBe(9);
    act(() => again.result.current.resume());
    act(() => vi.advanceTimersByTime(2_000));
    expect(again.result.current.elapsed).toBe(11);
  });

  it('never journals on reload; an explicit Log journals once and clears the snapshot', () => {
    const first = renderHook(() => useFocusTimer(DAY));
    act(() => first.result.current.setStrict(true));
    act(() => first.result.current.start());
    act(() => vi.advanceTimersByTime(45_000));
    first.unmount(); // old behavior journaled ~1 minute right here
    expect(loadData().focusSessions).toHaveLength(0);

    const again = renderHook(() => useFocusTimer(DAY));
    expect(again.result.current.state).toBe('running');
    expect(again.result.current.strict).toBe(true); // STRICT reconciled from the record
    act(() => vi.advanceTimersByTime(15_000)); // 60s total
    act(() => again.result.current.finish());

    const d = loadData();
    expect(d.focusSessions).toHaveLength(1);
    expect(d.focusSessions[0]).toMatchObject({ date: DAY, minutes: 1, strict: true });
    expect(d.days[DAY].timerStartedAt).toBeUndefined(); // session closed on the record
    expect(again.result.current.state).toBe('idle');
  });

  it('a 12-second session survives a reload instead of evaporating', () => {
    const first = renderHook(() => useFocusTimer(DAY));
    act(() => first.result.current.start());
    act(() => vi.advanceTimersByTime(12_000));
    first.unmount(); // old behavior: journalNow skipped (<30s), the clock died

    const again = renderHook(() => useFocusTimer(DAY));
    expect(again.result.current.state).toBe('running');
    expect(again.result.current.elapsed).toBe(12);

    act(() => again.result.current.finish()); // still noise to the journal
    expect(loadData().focusSessions).toHaveLength(0);
  });
});
