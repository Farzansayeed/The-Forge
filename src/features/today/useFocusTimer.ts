import { useEffect, useRef, useState } from 'react';
import { flushSave, loadData, saveData } from '../../lib/storage';
import type { AppData } from '../../lib/schema';

export type FocusState = 'idle' | 'running' | 'paused';

/** Sessions under 30s are noise, not study. */
const MIN_JOURNAL_SECONDS = 30;

export function fmtClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * U7 / WS9: a plain stopwatch that survives the page it lives on.
 * The live session is snapshotted onto the day record
 * `{timerStartedAt, timerPaused, baseSeconds, timerStrict}` through the
 * normal debounced save: start/pause/resume/strict-toggle rewrite it,
 * and pagehide + unmount rewrite it (then flush) instead of journaling.
 * On mount the snapshot is read back from days[today]: running →
 * elapsed = baseSeconds + (now - startedAt)/1000 and ticking continues
 * on the same wall-clock anchor; paused → restores paused. Journaling
 * into `focusSessions` happens ONLY on an explicit "✓ Log" — a reload
 * can no longer double-count or silently drop a session. Known edge:
 * a session spanning midnight keeps its snapshot on the old day's
 * record and the new day mounts idle (bedtime lockout mitigates; see
 * FIXPLAN §6 WS9).
 */
export function useFocusTimer(today: string) {
  const [state, setState] = useState<FocusState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [strict, setStrictState] = useState(false);

  const stateRef = useRef<FocusState>('idle');
  const strictRef = useRef(false);
  const startedAtRef = useRef(0);
  const accRef = useRef(0);
  const todayRef = useRef(today);
  todayRef.current = today;

  const apply = (s: FocusState): void => {
    stateRef.current = s;
    setState(s);
  };

  useEffect(() => {
    if (state !== 'running') return;
    const iv = window.setInterval(() => {
      setElapsed(accRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(iv);
  }, [state]);

  /* ── WS9: live-session snapshot on the day record ────────────── */

  function writeSnapshot(): void {
    const d: AppData = loadData();
    if (stateRef.current === 'idle') {
      // Counting nothing: clear a dormant snapshot; never create a record.
      const rec = d.days[todayRef.current];
      if (rec) {
        delete rec.timerStartedAt;
        delete rec.timerPaused;
        delete rec.baseSeconds;
        delete rec.timerStrict;
      }
    } else {
      if (!d.days[todayRef.current])
        d.days[todayRef.current] = { key: todayRef.current, kind: 'study', itemIds: [], hoursLogged: 0 };
      const rec = d.days[todayRef.current];
      rec.timerStartedAt = startedAtRef.current;
      rec.timerPaused = stateRef.current === 'paused';
      rec.baseSeconds = accRef.current;
      rec.timerStrict = strictRef.current;
    }
    saveData(d);
  }

  /* ── journaling: explicit Log only ───────────────────────────── */

  function journalNow(): void {
    const secs =
      accRef.current +
      (stateRef.current === 'running' ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0);
    if (secs < MIN_JOURNAL_SECONDS) return;
    const d: AppData = loadData();
    d.focusSessions.push({
      date: todayRef.current,
      minutes: Math.round(secs / 60),
      strict: strictRef.current,
    });
    saveData(d);
  }

  /* ── restore on mount (WS9) ──────────────────────────────────── */

  useEffect(() => {
    const rec = loadData().days[today];
    if (!rec || rec.timerStartedAt === undefined) return;
    const startedAt = rec.timerStartedAt;
    strictRef.current = rec.timerStrict ?? false;
    setStrictState(strictRef.current);
    accRef.current = rec.baseSeconds ?? 0;
    if (rec.timerPaused) {
      startedAtRef.current = 0;
      setElapsed(accRef.current);
      apply('paused');
    } else {
      startedAtRef.current = startedAt;
      setElapsed(accRef.current + Math.floor((Date.now() - startedAt) / 1000));
      apply('running');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── lifecycle: pagehide/unmount persist, never journal ──────── */

  useEffect(() => {
    const onHide = (): void => {
      writeSnapshot();
      // Storage's own pagehide flush listener registered earlier and has
      // already run — without this flush the pending write dies with the
      // document on a real unload.
      flushSave();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      // SPA unmount (route change): keep the session alive via the
      // snapshot so the next mount restores it.
      if (stateRef.current !== 'idle') {
        writeSnapshot();
        flushSave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = (): void => {
    accRef.current = 0;
    setElapsed(0);
    startedAtRef.current = Date.now();
    apply('running');
    writeSnapshot();
  };
  const pause = (): void => {
    if (stateRef.current !== 'running') return;
    accRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000);
    setElapsed(accRef.current);
    apply('paused');
    writeSnapshot();
  };
  const resume = (): void => {
    if (stateRef.current !== 'paused') return;
    startedAtRef.current = Date.now();
    apply('running');
    writeSnapshot();
  };
  const finish = (): void => {
    journalNow();
    accRef.current = 0;
    startedAtRef.current = 0;
    setElapsed(0);
    apply('idle');
    writeSnapshot(); // clears the snapshot fields: the session is closed
    flushSave(); // journal + clear land even if an unload is mid-flight
  };

  return {
    state,
    elapsed,
    strict,
    setStrict: (v: boolean): void => {
      strictRef.current = v;
      setStrictState(v);
      if (stateRef.current !== 'idle') writeSnapshot();
    },
    start,
    pause,
    resume,
    finish,
  };
}
