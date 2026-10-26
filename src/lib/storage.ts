/**
 * storage.ts — owns all persistence for The Forge (DESIGN.md §3.3).
 * - debounced writes (U15, 150ms) with flush on pagehide
 * - structural validation on read (corrupt state -> stash the raw payload at
 *   the backup key exactly once, then serve fresh defaults — never a crash,
 *   never a silent destruction of history)
 * - export/import round-trip
 * - migration hook point (v2 importer arrives in Phase 8; unknown versions rejected)
 */
import { AppData, STORAGE_KEY, defaultData, isValidAppData } from './schema';
import { migrate } from './migrate';

const DEBOUNCE_MS = 150;
/** A corrupt payload is preserved here exactly once (first snapshot wins). */
export const BACKUP_KEY = `${STORAGE_KEY}.bak`;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: AppData | null = null;
/** Set when localStorage rejects a write; cleared on the first success. */
let degraded = false;

/** One-bit health for Diagnostics: true if the last attempted save failed. */
export function isSaveDegraded(): boolean {
  return degraded;
}

/** True when a corrupt payload has been preserved at BACKUP_KEY by loadData(). */
export function hasCorruptBackup(): boolean {
  try {
    return window.localStorage.getItem(BACKUP_KEY) !== null;
  } catch {
    return false;
  }
}

function writeNow(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    degraded = false;
    // Only consume the pending buffer if THIS write was it — a fallback
    // default-write must never cancel an in-flight debounced save. On a
    // rejected write, `pending` is deliberately KEPT: the state is newer
    // than disk and the next flush (pagehide / tests) retries it.
    if (pending === data) pending = null;
  } catch {
    // storage full/blocked — state stays in memory, app keeps working
    degraded = true;
  }
}

/** Debounced save (U15). Multiple calls within the window coalesce. */
export function saveData(data: AppData): void {
  pending = data;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => writeNow(pending as AppData), DEBOUNCE_MS);
}

/** Force any pending write to disk immediately (pagehide, tests, beforeunload). */
export function flushSave(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending) writeNow(pending);
}

/**
 * Validated load. Anything wrong -> stash the raw payload at the backup key
 * (once — the first corrupt snapshot is never overwritten), then persist and
 * serve fresh defaults. Serves the in-flight debounced state when present —
 * it is newer than disk, and reading disk mid-debounce silently reverts the
 * last mutation (the close-day-right-after-postpone class of races).
 */
export function loadData(): AppData {
  if (pending) return pending;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return persistDefault(null);
    const parsed: unknown = JSON.parse(raw);
    if (isValidAppData(parsed)) return parsed;
    // older-but-compatible schema: migrate in place, persist, serve
    const up = migrate(parsed);
    if (up && isValidAppData(up)) {
      writeNow(up);
      return up;
    }
    return persistDefault(raw);
  } catch {
    // getItem or JSON.parse threw — stash whatever was read, if anything
    return persistDefault(raw);
  }
}

/**
 * Fresh defaults, but never at the cost of user history: a corrupt payload
 * that forced the reset is preserved at BACKUP_KEY first, so it can be
 * recovered (or reported by Diagnostics) instead of silently destroyed.
 */
function persistDefault(corruptRaw: string | null): AppData {
  try {
    if (corruptRaw && window.localStorage.getItem(BACKUP_KEY) === null) {
      window.localStorage.setItem(BACKUP_KEY, corruptRaw);
    }
  } catch {
    // can't read/write the backup slot (blocked storage) — defaults still load
  }
  const fresh = defaultData();
  writeNow(fresh);
  return fresh;
}

/** Replace all state (import). Validates before accepting. */
export function importData(json: string): AppData | null {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isValidAppData(parsed)) return null;
    flushSave();
    writeNow(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushSave);
}
