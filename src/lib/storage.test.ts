import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultData, isValidAppData, SCHEMA_VERSION } from './schema';
import {
  exportData,
  flushSave,
  importData,
  loadData,
  saveData,
  BACKUP_KEY,
  hasCorruptBackup,
  isSaveDegraded,
} from './storage';

describe('storage layer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flushSave();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a fresh default and persists it when storage is empty', () => {
    const d = loadData();
    expect(d.version).toBe(SCHEMA_VERSION);
    expect(d.review).toEqual({});
    expect(d.settings.theme).toBe('terminal');
    expect(d.settings.roastIntensity).toBe('spicy');
    // second load reads the persisted default back
    expect(loadData()).toEqual(d);
  });

  it('coalesces rapid saves into one write (U15 debounce)', () => {
    const d = defaultData();
    d.xp = 1;
    saveData(d);
    d.xp = 2;
    saveData(d);
    d.xp = 3;
    saveData(d);

    const spy = vi.spyOn(Storage.prototype, 'setItem');
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(loadData().xp).toBe(3);
    spy.mockRestore();
  });

  it('flushSave writes pending state immediately; loadData never reverts mid-debounce', () => {
    const d = defaultData();
    d.xp = 42;
    saveData(d);
    // disk still holds the old value, but loadData serves the newer pending state —
    // a read-save-read sequence must not silently roll back the last mutation
    const diskXp = () => JSON.parse(window.localStorage.getItem('cdr-v3') ?? '{"xp":null}').xp;
    expect(diskXp()).toBeNull(); // debounce has not fired yet
    expect(loadData().xp).toBe(42); // in-flight state wins
    flushSave();
    expect(diskXp()).toBe(42);
    expect(loadData().xp).toBe(42);
  });

  it('falls back to a fresh default on corrupt JSON', () => {
    window.localStorage.setItem('cdr-v3', '{not json');
    const d = loadData();
    expect(isValidAppData(d)).toBe(true);
    expect(d.xp).toBe(0);
  });

  it('stashes a corrupt payload at the backup key before serving defaults', () => {
    window.localStorage.setItem('cdr-v3', '{not json');
    const d = loadData();
    expect(d.version).toBe(SCHEMA_VERSION);
    expect(window.localStorage.getItem(BACKUP_KEY)).toBe('{not json');
    expect(hasCorruptBackup()).toBe(true);
  });

  it('stashes structurally invalid payloads the same way (valid JSON, wrong shape)', () => {
    const raw = JSON.stringify({ version: 99, hello: 1 });
    window.localStorage.setItem('cdr-v3', raw);
    const d = loadData();
    expect(d.version).toBe(SCHEMA_VERSION);
    expect(window.localStorage.getItem(BACKUP_KEY)).toBe(raw);
  });

  it('keeps the FIRST corrupt stash — later corruptions never overwrite it', () => {
    window.localStorage.setItem('cdr-v3', 'first corrupt');
    loadData();
    window.localStorage.setItem('cdr-v3', 'second corrupt');
    const d = loadData();
    expect(d.version).toBe(SCHEMA_VERSION);
    expect(window.localStorage.getItem(BACKUP_KEY)).toBe('first corrupt');
  });

  it('never creates a backup for healthy state or empty storage', () => {
    expect(hasCorruptBackup()).toBe(false);
    loadData(); // empty storage
    expect(hasCorruptBackup()).toBe(false);
    window.localStorage.setItem('cdr-v3', JSON.stringify(defaultData()));
    loadData(); // valid schema
    expect(hasCorruptBackup()).toBe(false);
  });

  it('keeps pending on a rejected write and retries it on the next flush', () => {
    const d = defaultData();
    d.xp = 5;
    saveData(d);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    vi.advanceTimersByTime(200); // debounced write fails
    expect(isSaveDegraded()).toBe(true);
    expect(loadData().xp).toBe(5); // in-memory pending still serves the newest state
    expect(JSON.parse(window.localStorage.getItem('cdr-v3') ?? '{"xp":null}').xp).toBeNull();
    // storage recovers → the buffered work must land on the next flush
    spy.mockRestore();
    flushSave();
    expect(isSaveDegraded()).toBe(false);
    expect(loadData().xp).toBe(5);
    expect(JSON.parse(window.localStorage.getItem('cdr-v3') ?? '{"xp":null}').xp).toBe(5);
  });

  it('falls back to a fresh default on structurally invalid data', () => {
    window.localStorage.setItem('cdr-v3', JSON.stringify({ version: 99, hello: 1 }));
    const d = loadData();
    expect(d.version).toBe(SCHEMA_VERSION);
  });

  it('migrates v3 state in place: review queue added, data preserved', () => {
    const v3 = { ...defaultData(), version: 3, xp: 123 };
    delete (v3 as { review?: unknown }).review;
    window.localStorage.setItem('cdr-v3', JSON.stringify(v3));
    const d = loadData();
    expect(d.version).toBe(SCHEMA_VERSION);
    expect(d.xp).toBe(123);
    expect(d.review).toEqual({});
    // the migration is persisted immediately — a second load reads v4 from disk
    const again = JSON.parse(window.localStorage.getItem('cdr-v3') ?? '{}');
    expect(again.version).toBe(SCHEMA_VERSION);
  });

  it('rejects unknown schema versions on import', () => {
    const foreign = JSON.stringify({ ...defaultData(), version: 99 });
    expect(importData(foreign)).toBeNull();
  });

  it('round-trips export -> import', () => {
    const d = defaultData();
    d.xp = 777;
    d.checked = { 's00.t1': true };
    const restored = importData(exportData(d));
    expect(restored).not.toBeNull();
    expect(restored?.xp).toBe(777);
    expect(restored?.checked['s00.t1']).toBe(true);
  });
});
