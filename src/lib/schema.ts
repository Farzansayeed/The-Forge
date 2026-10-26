/**
 * The Forge — persisted state schema (DESIGN.md §3.3, schema v4).
 * Pure types + validation. No I/O here (see lib/storage.ts).
 */

export const STORAGE_KEY = 'cdr-v3';
export const SCHEMA_VERSION = 4;

export type ThemeName = 'terminal' | 'blueprint';
export type RoastIntensity = 'mild' | 'spicy' | 'nuclear';

export interface Settings {
  weekdayTarget: number; // hours
  sundayTarget: number; // hours
  bedtime: string; // 'HH:MM'
  roastIntensity: RoastIntensity;
  theme: ThemeName;
}

export type DayKind = 'study' | 'sunday' | 'catchup' | 'rest' | 'postponed';
export type Verdict = 'pass' | 'fail' | 'postponed' | 'ghost' | 'rest';

export interface DayRecord {
  key: string; // 'YYYY-MM-DD'
  kind: DayKind;
  itemIds: string[];
  hoursLogged: number;
  verdict?: Verdict;
  closedAt?: string;
  /** WS9 live focus-timer snapshot — reload/route-hop restores it unchanged; cleared on Log. */
  timerStartedAt?: number; // epoch ms the current run segment began
  timerPaused?: boolean; // true → restore paused at baseSeconds
  baseSeconds?: number; // seconds banked before the current run segment
  timerStrict?: boolean; // STRICT checkbox state of the live session
}

export interface FocusSession {
  date: string;
  minutes: number;
  strict: boolean;
}

/** SM-2-lite card: interval ladder 1→3→7→16→35→n×ease (DESIGN.md §4). */
export interface ReviewCard {
  /** quiz item id the card resurfaces */
  itemId: string;
  /** ladder step (index into REVIEW_INTERVALS) */
  step: number;
  ease: number; // 1.3..2.5
  due: string; // 'YYYY-MM-DD'
  lapses: number;
  lastAt: string; // ISO
}

export interface AppData {
  version: typeof SCHEMA_VERSION;
  startDate: string; // 'YYYY-MM-DD'
  settings: Settings;
  checked: Record<string, boolean>;
  notes: Record<string, string>;
  days: Record<string, DayRecord>;
  postponed: Record<string, string>; // dateKey -> excuse id
  customExcuses: string[];
  xp: number;
  pardons: number;
  insurance: number;
  quizResults: Record<string, { best: number; attempts: number; lastAt: string }>;
  focusSessions: FocusSession[];
  /** spaced-review queue (v4) */
  review: Record<string, ReviewCard>;
}

export function defaultData(): AppData {
  return {
    version: SCHEMA_VERSION,
    startDate: todayKey(),
    settings: {
      weekdayTarget: 3,
      sundayTarget: 6.5,
      bedtime: '23:30',
      roastIntensity: 'spicy',
      theme: 'terminal',
    },
    checked: {},
    notes: {},
    days: {},
    postponed: {},
    customExcuses: [],
    xp: 0,
    pardons: 0,
    insurance: 1,
    quizResults: {},
    focusSessions: [],
    review: {},
  };
}

export function todayKey(d = new Date()): string {
  const p = (n: number) => (n < 10 ? '0' : '') + n;
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Structural validation — corrupt/foreign state degrades to `false`
 * and storage falls back to a fresh default. Never throws.
 */
export function isValidAppData(v: unknown): v is AppData {
  if (!isRecord(v)) return false;
  if (v.version !== SCHEMA_VERSION) return false;
  if (typeof v.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v.startDate))
    return false;
  if (!isRecord(v.settings)) return false;
  const s = v.settings;
  if (
    typeof s.weekdayTarget !== 'number' ||
    typeof s.sundayTarget !== 'number' ||
    typeof s.bedtime !== 'string' ||
    !/^\d{2}:\d{2}$/.test(s.bedtime)
  )
    return false;
  if (!['mild', 'spicy', 'nuclear'].includes(s.roastIntensity as string)) return false;
  if (!['terminal', 'blueprint'].includes(s.theme as string)) return false;
  for (const k of ['checked', 'notes', 'days', 'postponed', 'quizResults', 'review'] as const) {
    if (!isRecord(v[k])) return false;
  }
  if (!Array.isArray(v.customExcuses)) return false;
  if (!Array.isArray(v.focusSessions)) return false;
  if (typeof v.xp !== 'number' || typeof v.pardons !== 'number' || typeof v.insurance !== 'number')
    return false;
  return true;
}
