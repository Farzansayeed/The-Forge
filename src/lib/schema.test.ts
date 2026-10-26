import { describe, expect, it } from 'vitest';
import { todayKey } from './schema';

describe('todayKey (the one local day key)', () => {
  it('formats padded Y-M-D in the local calendar', () => {
    expect(todayKey(new Date(2026, 0, 9))).toBe('2026-01-09');
    expect(todayKey(new Date(2026, 10, 26))).toBe('2026-11-26');
    expect(todayKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('round-trips a full local day — never drifts near midnight', () => {
    const cases: Array<[number, number, number, number, number]> = [
      [2026, 0, 1, 0, 0],
      [2026, 0, 15, 23, 59],
      [2026, 5, 3, 12, 30],
      [2027, 6, 4, 21, 45],
      [2027, 11, 31, 14, 10],
    ];
    for (const [y, m, d, hh, mm] of cases) {
      const dt = new Date(y, m, d, hh, mm);
      const [ry, rm, rd] = todayKey(dt).split('-').map(Number);
      expect(ry, todayKey(dt)).toBe(y);
      expect(rm, todayKey(dt)).toBe(m + 1);
      expect(rd, todayKey(dt)).toBe(d);
    }
  });

  it('defaults to the current date', () => {
    const now = new Date();
    const [yy, mm, dd] = todayKey().split('-').map(Number);
    expect(yy).toBe(now.getFullYear());
    expect(mm).toBe(now.getMonth() + 1);
    expect(dd).toBe(now.getDate());
  });
});
