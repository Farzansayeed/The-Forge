import { useMemo } from 'react';
import { loadData } from '../../lib/storage';
import { buildSchedule, type DayEntry } from '../../engines/schedule';
import { studyStreak, consecutiveBadDays, dreadLevel } from '../../engines/dread';
import { todayKey } from '../../lib/schema';
import { useWeekReview } from '../dread/TribunalCard';

/**
 * Stats (Phase 7): the ledger made visible.
 * — Year heatmap: one cell per day since start, horizontally scrollable,
 *   ≥30px touch cells with week labels (U5).
 * — Streak economy: current streak, best streak, clean days, verdict mix.
 * — Dread ledger: current level + the bad-day history behind it.
 * — Finish-line projection: actual pace vs planned pace.
 */

const CELL = 30; // U5: ≥30px touch target
const GAP = 3;

function p(n: number): string {
  return (n < 10 ? '0' : '') + n;
}

interface DayCell {
  key: string;
  state: 'empty' | 'pass' | 'fail' | 'postponed' | 'rest' | 'partial' | 'ghost' | 'future';
  ratio: number;
  hours: number;
  label: string;
}

function monthLabel(key: string): string {
  const m = Number(key.slice(5, 7));
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
}

function useHeatmap(today: string): DayCell[] {
  return useMemo(() => {
    const data = loadData();
    const entries = buildSchedule(data, today, { horizon: 400 });
    const byKey = new Map<string, DayEntry>(entries.map((e) => [e.key, e]));

    const cells: DayCell[] = [];
    const cursor = new Date(data.startDate + 'T00:00:00');
    const end = new Date(today + 'T00:00:00');
    end.setDate(end.getDate() + 7); // a peek of the schedule ahead
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${p(cursor.getMonth() + 1)}-${p(cursor.getDate())}`;
      const entry = byKey.get(key);
      const rec = data.days[key];
      const total = entry?.itemIds.length ?? 0;
      const checked = rec && entry ? entry.itemIds.filter((id) => data.checked[id]).length : 0;
      const ratio = total === 0 ? 0 : checked / total;

      let state: DayCell['state'] = 'empty';
      if (key > today) state = 'future';
      else if (rec?.verdict === 'pass') state = 'pass';
      else if (rec?.verdict === 'fail') state = 'fail';
      else if (rec?.verdict === 'postponed') state = 'postponed';
      else if (rec?.verdict === 'rest') state = 'rest';
      else if (rec?.verdict === 'ghost') state = 'ghost';
      else if (checked > 0) state = 'partial';
      else if (key < today && entry && entry.kind !== 'rest' && total > 0) state = 'ghost';

      cells.push({
        key,
        state,
        ratio,
        hours: rec?.hoursLogged ?? 0,
        label: `${key} — ${state}${total ? `, ${checked}/${total} items, ${rec?.hoursLogged ?? 0}h` : ''}`,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [today]);
}

function Heatmap({ today }: { today: string }) {
  const cells = useHeatmap(today);

  const color = (c: DayCell): string => {
    switch (c.state) {
      case 'pass':
        return 'var(--good)';
      case 'partial':
        return 'var(--info)';
      case 'fail':
      case 'ghost':
        return 'var(--danger)';
      case 'postponed':
        return 'var(--warn)';
      case 'rest':
        return 'var(--border-strong)';
      default:
        return 'var(--panel2)';
    }
  };

  // month boundaries for labels
  const labels: { index: number; text: string }[] = [];
  let lastMonth = '';
  cells.forEach((c, i) => {
    const m = c.key.slice(5, 7);
    if (m !== lastMonth) {
      labels.push({ index: i, text: monthLabel(c.key) });
      lastMonth = m;
    }
  });

  return (
    <section
      aria-label="Year heatmap"
      style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        background: 'var(--panel)',
        padding: '20px 22px',
        display: 'grid',
        gap: 12,
      }}
    >
      <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
        The heatmap — every day, on the record
      </h2>
      <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
        <div style={{ position: 'relative', width: cells.length * (CELL + GAP), height: CELL + 18 }}>
          {labels.map((l) => (
            <span
              key={l.index}
              className="mono"
              style={{ position: 'absolute', left: l.index * (CELL + GAP), top: 0, fontSize: 10, color: 'var(--faint)' }}
            >
              {l.text}
            </span>
          ))}
          {cells.map((c) => (
            <div
              key={c.key}
              title={c.label}
              style={{
                position: 'absolute',
                left: cells.indexOf(c) * (CELL + GAP),
                top: 18,
                width: CELL,
                height: CELL,
                borderRadius: 7,
                background: color(c),
                opacity: c.state === 'future' ? 0.25 : c.ratio > 0 && c.state !== 'pass' ? 0.4 + c.ratio * 0.6 : 1,
                border: c.key === today ? '2px solid var(--text)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--muted)' }}>
        <LegendSwatch color="var(--good)" label="pass" />
        <LegendSwatch color="var(--info)" label="progress" />
        <LegendSwatch color="var(--danger)" label="fail / ghost" />
        <LegendSwatch color="var(--warn)" label="postponed" />
        <LegendSwatch color="var(--border-strong)" label="rest" />
        <LegendSwatch color="var(--panel2)" label="empty" />
      </div>
    </section>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 12, height: 12, borderRadius: 4, background: color, border: '1px solid var(--border)' }} />
      {label}
    </span>
  );
}

function useEconomy(today: string) {
  return useMemo(() => {
    const data = loadData();
    const verdicts = { pass: 0, fail: 0, postponed: 0, rest: 0, ghost: 0 } as Record<string, number>;
    let best = 0;
    let run = 0;
    let hours = 0;
    let minutes = 0;
    const keys = Object.keys(data.days).sort();
    for (const k of keys) {
      const r = data.days[k];
      verdicts[r.verdict ?? 'ghost'] = (verdicts[r.verdict ?? 'ghost'] ?? 0) + 1;
      hours += r.hoursLogged ?? 0;
      if (r.verdict === 'pass') {
        run += 1;
        best = Math.max(best, run);
      } else if (r.verdict === 'fail' || r.verdict === 'ghost') {
        run = 0;
      }
    }
    for (const s of data.focusSessions) minutes += s.minutes;
    const streak = studyStreak(data, today);
    return {
      streak,
      best: Math.max(best, streak),
      clean: verdicts.pass,
      fails: verdicts.fail + verdicts.ghost,
      postponed: verdicts.postponed,
      rest: verdicts.rest,
      hours,
      focusMinutes: minutes,
      pardons: data.pardons,
      insurance: data.insurance,
      xp: data.xp,
      startDate: data.startDate,
    };
  }, [today]);
}

function useProjection(today: string) {
  return useMemo(() => {
    const data = loadData();
    const entries = buildSchedule(data, today);
    const last = entries[entries.length - 1];
    const plannedEnd = last?.key ?? today;

    // actual pace: elapsed days vs days' worth of completed items
    const start = new Date(data.startDate + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const elapsed = Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000));
    const doneItems = Object.entries(data.checked).filter(([id, v]) => v && id.includes(':t:')).length;
    const totalTopics = entries.flatMap((e) => e.itemIds).filter((id) => id.includes(':t:')).length;
    const actualRate = doneItems / elapsed; // topics per day
    const remaining = totalTopics - doneItems;
    const actualDays = actualRate > 0 ? Math.ceil(remaining / actualRate) + elapsed : null;
    // projected end date must use the local calendar (UTC slicing of a
    // local-midnight date is off by one for every non-UTC user)
    const actualEnd = actualDays
      ? todayKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + actualDays))
      : null;

    return { plannedEnd, actualEnd, doneItems, totalTopics, elapsed };
  }, [today]);
}

export function StatsPage() {
  const today = todayKey();
  const econ = useEconomy(today);
  const proj = useProjection(today);
  const data = loadData();
  const bad = consecutiveBadDays(data, today);
  const { stamp } = useWeekReview(today);

  const fmtDate = (k: string | null): string =>
    k
      ? new Date(k + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '—';

  return (
    <div style={{ display: 'grid', gap: 22, maxWidth: 1160 }}>
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px' }}>Stats</h1>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3, letterSpacing: 1 }}>
          THE LEDGER, READ ALOUD
        </p>
      </header>

      <Heatmap today={today} />

      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <section aria-label="Streak economy" style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--panel)', padding: '20px 22px', display: 'grid', gap: 10 }}>
          <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>Streak economy</h2>
          <Row k="Current streak" v={`🔥 ${econ.streak} day${econ.streak === 1 ? '' : 's'}`} />
          <Row k="Best streak" v={`${econ.best} days`} />
          <Row k="Clean closes" v={`${econ.clean}`} good />
          <Row k="Fails & ghosts" v={`${econ.fails}`} danger={econ.fails > 0} />
          <Row k="Postpones / rests" v={`${econ.postponed} / ${econ.rest}`} />
          <Row k="Hours logged" v={`${econ.hours}h`} />
          <Row k="Focus sessions" v={`${Math.round(econ.focusMinutes)} min`} />
          <Row k="XP" v={`${econ.xp}`} />
          <Row k="Pardons / insurance" v={`🛡 ${econ.pardons} · 💤 ${econ.insurance}`} />
        </section>

        <section aria-label="Dread ledger" style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--panel)', padding: '20px 22px', display: 'grid', gap: 10 }}>
          <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>Dread ledger</h2>
          <Row k="Level" v={`${dreadLevel(data, today)} / 5`} danger={bad > 0} />
          <Row k="Consecutive bad days" v={`${bad}`} danger={bad > 0} />
          <Row k="This week's stamp" v={stamp.name} />
          <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
            {bad === 0
              ? 'The engine is quiet. Close days honestly and it stays that way.'
              : `${bad} bad day${bad === 1 ? '' : 's'} chained together. A single honest close resets the count — the corruption lifts as the level falls.`}
          </p>
        </section>

        <section aria-label="Finish line" style={{ border: '1px solid var(--border)', borderRadius: 14, background: 'var(--panel)', padding: '20px 22px', display: 'grid', gap: 10 }}>
          <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>Finish-line projection</h2>
          <Row k="Topics completed" v={`${proj.doneItems} / ${proj.totalTopics}`} />
          <Row k="Days elapsed" v={`${proj.elapsed}`} />
          <Row k="Planned finish" v={fmtDate(proj.plannedEnd)} />
          <Row
            k="Projected finish (actual pace)"
            v={fmtDate(proj.actualEnd)}
            danger={!!proj.actualEnd && proj.actualEnd > proj.plannedEnd}
            good={!!proj.actualEnd && proj.actualEnd <= proj.plannedEnd}
          />
          <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
            {proj.actualEnd && proj.actualEnd > proj.plannedEnd
              ? 'Behind the plan. The pace math is public — catch-up days only answer debt they can see.'
              : 'On or ahead of pace. The plan holds.'}
          </p>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v, good, danger }: { k: string; v: string; good?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
      <span style={{ color: 'var(--muted)' }}>{k}</span>
      <span style={{ fontWeight: 700, color: good ? 'var(--good)' : danger ? 'var(--danger)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}
