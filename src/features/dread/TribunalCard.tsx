import { useMemo } from 'react';
import { loadData } from '../../lib/storage';
import { buildSchedule } from '../../engines/schedule';
import { tribunalStamp } from '../../engines/accountability';
import { todayKey } from '../../lib/schema';

/**
 * TribunalCard — the Sunday Tribunal (Phase 6).
 * On Sundays (and any time via Settings) it stamps the week FLAWLESS→ABYSMAL
 * from the completion ratio of the last 7 scheduled days, shows the week
 * grid, and seals a message accordingly. Pure read — no persistence.
 */

interface WeekDay {
  key: string;
  label: string;
  state: 'pass' | 'fail' | 'postponed' | 'rest' | 'partial' | 'future';
  ratio: number;
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function p(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function useWeekReview(today: string): { days: WeekDay[]; stamp: ReturnType<typeof tribunalStamp>; scheduledDays: number } {
  return useMemo(() => {
    const data = loadData();
    const entries = buildSchedule(data, today);
    const entryByKey = new Map(entries.map((e) => [e.key, e]));
    const days: WeekDay[] = [];
    let done = 0;
    let scheduled = 0;

    const cursor = new Date(today + 'T00:00:00');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(cursor);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const entry = entryByKey.get(key);
      const rec = data.days[key];

      let state: WeekDay['state'] = 'future';
      let ratio = 0;
      const isFuture = key > today;
      const kind = entry?.kind ?? 'study';
      if (entry && !isFuture && kind !== 'rest') {
        const total = entry.itemIds.length;
        const checked = rec ? entry.itemIds.filter((id) => data.checked[id]).length : 0;
        ratio = total === 0 ? 0 : checked / total;
        if (kind === 'sunday' && total === 0) {
          state = 'rest'; // empty sunday = rest/milestone day
        } else if (kind === 'postponed') {
          state = 'postponed';
        } else if (kind === 'catchup') {
          scheduled += 1;
          state = ratio >= 0.999 ? 'pass' : checked > 0 ? 'partial' : 'fail';
          if (ratio >= 0.999) done += 1;
          else done += ratio;
        } else {
          scheduled += 1;
          if (rec?.verdict === 'pass' || (!rec?.verdict && ratio >= 0.999)) {
            state = 'pass';
            done += 1;
          } else if (rec?.verdict === 'fail' || rec?.verdict === 'ghost' || (!rec?.verdict && checked === 0)) {
            state = 'fail';
          } else if (checked > 0) {
            state = 'partial';
            done += ratio;
          }
        }
      } else if (entry && kind === 'rest') {
        state = 'rest';
      }
      days.push({ key, label: DOW[d.getDay()], state, ratio });
    }

    const stamp = tribunalStamp(scheduled === 0 ? 0 : done / scheduled);
    return { days, stamp, scheduledDays: scheduled };
  }, [today]);
}

export function TribunalCard({ compact = false }: { compact?: boolean }) {
  const { days, stamp, scheduledDays } = useWeekReview(todayKey());

  const sealed =
    stamp.id === 'flawless'
      ? 'Seven days, kept. The ledger has nothing to add — enjoy that.'
      : stamp.id === 'solid'
        ? 'More days kept than lost. The week holds. Keep the stack falling forward.'
        : stamp.id === 'shaky'
          ? 'The week wobbled. Not lost — but the next Sunday reads this page too.'
          : stamp.id === 'poor'
            ? 'Mostly empty boxes. The roadmap noticed. So will next week.'
            : 'Nothing to show. The tribunal seals this week with neither anger nor pity — only a date.';

  return (
    <section
      aria-label="Sunday tribunal"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--panel)',
        borderRadius: 14,
        padding: compact ? '14px 16px' : '20px 22px',
        display: 'grid',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h3 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
          Sunday Tribunal
        </h3>
        <span
          className="mono"
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            color: stamp.color,
            border: `1px solid ${stamp.color}`,
            borderRadius: 8,
            padding: '3px 10px',
          }}
        >
          {stamp.name}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {days.map((d, i) => (
          <div key={d.key} style={{ display: 'grid', gap: 5, justifyItems: 'center', flex: 1 }}>
            <div
              title={`${d.key} — ${d.state}${d.ratio ? ` (${Math.round(d.ratio * 100)}%)` : ''}`}
              style={{
                width: compact ? 30 : 38,
                height: compact ? 30 : 38,
                borderRadius: 9,
                border: '1px solid var(--border-strong)',
                background:
                  d.state === 'pass'
                    ? 'var(--good-dim)'
                    : d.state === 'fail'
                      ? 'var(--danger-dim)'
                      : d.state === 'postponed'
                        ? 'var(--warn-dim)'
                        : d.state === 'partial'
                          ? 'var(--info-dim)'
                          : 'transparent',
                display: 'grid',
                placeItems: 'center',
                fontSize: 11,
                fontWeight: 700,
                color:
                  d.state === 'pass'
                    ? 'var(--good)'
                    : d.state === 'fail'
                      ? 'var(--danger)'
                      : d.state === 'postponed'
                        ? 'var(--warn)'
                        : d.state === 'partial'
                          ? 'var(--info)'
                          : 'var(--faint)',
              }}
            >
              {d.label}
            </div>
            <span className="mono" style={{ fontSize: 8.5, color: 'var(--faint)' }}>
              {i === 6 ? 'today' : d.key.slice(8)}
            </span>
          </div>
        ))}
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
        {sealed}{' '}
        <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>
          ({scheduledDays} scheduled day{scheduledDays === 1 ? '' : 's'} this week)
        </span>
      </p>
    </section>
  );
}
