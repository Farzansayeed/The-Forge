import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { EXCUSES, pickPraise, pickRoast } from '../../data/roast';
import { consecutiveBadDays } from '../../engines/dread';
import { loadData } from '../../lib/storage';
import { todayKey, type Verdict } from '../../lib/schema';
import { useDaily } from '../../stores/daily';
import { useProgress } from '../../stores/progress';
import { curriculumItem } from './item';
import { fmtClock, useFocusTimer } from './useFocusTimer';
import { dateLabel, fmtHM, fmtHours } from './labels';

const KIND_TAG: Record<'topic' | 'drill', string> = { topic: 'TOPIC', drill: 'DRILL' };

function btn(kind: 'primary' | 'ghost' | 'danger', disabled = false): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '9px 16px',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: 13,
    font: 'inherit',
    opacity: disabled ? 0.45 : 1,
  };
  if (kind === 'primary')
    return { ...base, border: '1px solid var(--good)', background: 'var(--good-dim)', color: 'var(--good)' };
  if (kind === 'danger')
    return { ...base, border: '1px solid var(--danger)', background: 'var(--danger-dim)', color: 'var(--danger)' };
  return { ...base, border: '1px solid var(--border-strong)', background: 'var(--panel2)', color: 'var(--text)' };
}

/* ── Task stack ─────────────────────────────────────────────── */

function TaskRow({
  itemId,
  accent,
  checked,
  onToggle,
}: {
  itemId: string;
  accent: string;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const item = curriculumItem(itemId);
  if (!item) return null;
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: 'var(--panel)',
        padding: '13px 15px',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(itemId)}
        aria-label={`Done: ${item.title}`}
        style={{ accentColor: 'var(--good)', width: 16, height: 16, marginTop: 2, flex: 'none' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span
            className="mono"
            style={{ fontSize: 9, letterSpacing: 1.2, color: accent, fontWeight: 700 }}
          >
            {KIND_TAG[item.kind]}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              textDecoration: checked ? 'line-through' : 'none',
              color: checked ? 'var(--faint)' : 'var(--text)',
            }}
          >
            {item.title}
          </span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 3, lineHeight: 1.55 }}>
          {item.detail}
        </div>
      </div>
      <Link
        to={item.url}
        className="mono"
        aria-label={`Open ${item.stageId.toUpperCase()} in the roadmap`}
        style={{ flex: 'none', fontSize: 11, color: 'var(--info)', textDecoration: 'none', alignSelf: 'center' }}
      >
        ↗
      </Link>
    </li>
  );
}

/* ── Hours meter (U3) ───────────────────────────────────────── */

function HoursMeter() {
  const hoursLogged = useDaily((s) => s.hoursLogged);
  const target = useDaily((s) => s.target);
  const addHours = useDaily((s) => s.addHours);
  const setHours = useDaily((s) => s.setHours);
  const [raw, setRaw] = useState(fmtHours(hoursLogged));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setRaw(fmtHours(hoursLogged));
  }, [hoursLogged, editing]);

  const pct = Math.min(100, Math.round((hoursLogged / target) * 100));
  const hit = hoursLogged >= target;

  const commit = (): void => {
    setEditing(false);
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) setHours(n);
    else setRaw(fmtHours(hoursLogged));
  };

  return (
    <section aria-label="Hours logged" style={{ display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: hit ? 'var(--good)' : 'var(--text)' }}>
          {fmtHours(hoursLogged)}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--faint)' }}>h</span>
        </span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>
          / {fmtHM(target)} target · {pct}%
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button type="button" style={btn('ghost')} onClick={() => addHours(0.5)}>
            +½
          </button>
          <button type="button" style={btn('ghost')} onClick={() => addHours(1)}>
            +1
          </button>
        </div>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Hours toward today's target"
        style={{ height: 8, borderRadius: 99, background: 'var(--panel2)', border: '1px solid var(--border)' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 99,
            background: hit ? 'var(--good)' : 'var(--p1)',
            transition: 'width 0.4s cubic-bezier(0.25,0.9,0.35,1)',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          min={0}
          max={24}
          step={0.25}
          value={raw}
          aria-label="Exact hours"
          onChange={(e) => {
            setEditing(true);
            setRaw(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          style={{
            width: 78,
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--panel2)',
            color: 'var(--text)',
            font: 'inherit',
            fontSize: 13,
          }}
        />
        <span style={{ color: 'var(--faint)', fontSize: 12 }}>direct entry — quarter hours</span>
      </div>
    </section>
  );
}

/* ── Focus timer (U7) ───────────────────────────────────────── */

function FocusTimer() {
  const today = useDaily((s) => s.today);
  const t = useFocusTimer(today);
  return (
    <section
      aria-label="Focus timer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: 'var(--panel)',
        padding: '12px 16px',
      }}
    >
      <span
        className="mono"
        aria-live="off"
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: t.state === 'running' ? 'var(--p1)' : 'var(--muted)',
          minWidth: 92,
        }}
      >
        {fmtClock(t.elapsed)}
      </span>
      <label className="mono" style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 11, color: 'var(--muted)', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={t.strict}
          onChange={(e) => t.setStrict(e.target.checked)}
          style={{ accentColor: 'var(--warn)' }}
        />
        STRICT (phone away)
      </label>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
        {t.state === 'idle' && (
          <button type="button" style={btn('primary')} onClick={t.start}>
            ▶ Start
          </button>
        )}
        {t.state === 'running' && (
          <button type="button" style={btn('ghost')} onClick={t.pause}>
            ‖ Pause
          </button>
        )}
        {t.state === 'paused' && (
          <button type="button" style={btn('primary')} onClick={t.resume}>
            ▶ Resume
          </button>
        )}
        {t.state !== 'idle' && (
          <button type="button" style={btn('ghost')} onClick={t.finish}>
            ✓ Log
          </button>
        )}
      </div>
    </section>
  );
}

/* ── Bedtime check (Phase 3 notice; full lockout in Phase 6) ── */

function useBedtime(bedtime: string): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const check = (): void => {
      const [h, m] = bedtime.split(':').map(Number);
      const now = new Date();
      setPast(now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m));
    };
    check();
    const iv = window.setInterval(check, 30_000);
    return () => window.clearInterval(iv);
  }, [bedtime]);
  return past;
}

/* ── Postpone tribunal (U6) ─────────────────────────────────── */

type Section = 'valid' | 'invalid' | 'custom' | null;

function PostponeModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (excuseId: string) => void;
}) {
  const [section, setSection] = useState<Section>(null);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (open) {
      setSection(null);
      setCustom('');
    }
  }, [open]);

  const list =
    section === 'valid' ? EXCUSES.valid : section === 'invalid' ? EXCUSES.invalid : [];

  const choose = (id: string): void => {
    onConfirm(id);
    onClose();
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    ...btn('ghost'),
    fontSize: 12,
    borderColor: active ? 'var(--info)' : 'var(--border-strong)',
    color: active ? 'var(--info)' : 'var(--text)',
  });

  return (
    <Modal open={open} onClose={onClose} label="Postpone today" width={480}>
      <h2 style={{ fontSize: 18, fontWeight: 800 }}>Postpone — state your reason</h2>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>
        The ledger records it either way. Postpones pause the schedule without adding dread.
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button type="button" style={pillStyle(section === 'valid')} onClick={() => setSection('valid')}>
          Valid reasons
        </button>
        <button type="button" style={pillStyle(section === 'invalid')} onClick={() => setSection('invalid')}>
          Invalid excuses
        </button>
        <button type="button" style={pillStyle(section === 'custom')} onClick={() => setSection('custom')}>
          Write your own
        </button>
      </div>

      {section === 'custom' && (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Craft it carefully — it goes on the record…"
            aria-label="Custom excuse"
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--panel2)',
              color: 'var(--text)',
              font: 'inherit',
              fontSize: 13,
            }}
          />
          <button type="button" style={btn('primary')} disabled={!custom.trim()} onClick={() => choose('custom:' + custom.trim())}>
            File it
          </button>
        </div>
      )}

      {list.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 7 }}>
          {list.map((x) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => choose(x.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: `1px solid ${section === 'invalid' ? 'var(--danger)' : 'var(--border-strong)'}`,
                  background: section === 'invalid' ? 'var(--danger-dim)' : 'var(--panel2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {x.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 10,
        }}
      >
        <button type="button" style={btn('primary')} onClick={onClose}>
          Keep studying
        </button>
        <button type="button" style={btn('ghost')} onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

/* ── Close-the-day ritual ───────────────────────────────────── */

function CloseModal({
  open,
  onClose,
  onConfirm,
  doneCount,
  totalCount,
  hours,
  target,
  roastIntensity,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (v: Verdict) => void;
  doneCount: number;
  totalCount: number;
  hours: number;
  target: number;
  roastIntensity: 'mild' | 'spicy' | 'nuclear';
}) {
  const [confirmingFail, setConfirmingFail] = useState(false);
  const [line, setLine] = useState('');
  const [staged, setStaged] = useState<Verdict>('pass');

  useEffect(() => {
    if (open) {
      setConfirmingFail(false);
      setLine('');
      setStaged('pass');
    }
  }, [open]);

  const hitTarget = hours >= target;

  const stage = (v: Verdict): void => {
    // The verdict is the user's call — hours are context, never an override.
    setStaged(v);
    setLine(v === 'pass' ? pickPraise() : pickRoast(roastIntensity, consecutiveBadDays(loadData(), todayKey())).line);
    setConfirmingFail(true);
  };

  return (
    <Modal open={open} onClose={onClose} label="Close the day" width={480}>
      {!confirmingFail ? (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Close the day</h2>
          <p className="mono" style={{ color: 'var(--muted)', fontSize: 12.5, marginTop: 8 }}>
            {doneCount}/{totalCount} items · {fmtHours(hours)}h / {fmtHM(target)}
            {hitTarget ? ' · target hit' : ' · target missed'}
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            <button
              type="button"
              style={btn('primary')}
              onClick={() => {
                setLine(pickPraise());
                setConfirmingFail(true);
              }}
            >
              ✦ Pass — I put in the work
            </button>
            <button type="button" style={btn('danger')} onClick={() => stage('fail')}>
              ✖ Fail — the day beat me
            </button>
            <button
              type="button"
              style={btn('ghost')}
              onClick={() => {
                onConfirm('rest');
                onClose();
              }}
            >
              Rest day — no guilt, no dread
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: staged === 'pass' ? 'var(--good)' : 'var(--danger)' }}>
            {staged === 'pass' ? 'Verdict: pass' : 'Verdict: fail'}
          </h2>
          <p style={{ color: 'var(--text)', fontSize: 14, marginTop: 12, lineHeight: 1.7 }}>{line}</p>
          {staged === 'pass' && !hitTarget && (
            <p className="mono" style={{ color: 'var(--warn)', fontSize: 11.5, marginTop: 10, letterSpacing: 0.5 }}>
              TARGET MISSED ({fmtHours(hours)}h / {fmtHM(target)}) — PASS, BUT THE LEDGER NOTICED.
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" style={btn('primary')} onClick={() => {
              onConfirm(staged);
              onClose();
            }}>
              Close the day
            </button>
            <button type="button" style={btn('ghost')} onClick={() => setConfirmingFail(false)}>
              Wait, not yet
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export function TodayPage() {
  const { today, entry, hoursLogged, target, verdict, closeDay, postponeDay, reopenDay } = useDaily();
  const checkedIds = useProgress((s) => s.checkedIds);
  const toggle = useProgress((s) => s.toggle);
  const settings = useMemo(() => loadData().settings, []);
  const bedtimePast = useBedtime(settings.bedtime);

  const [closeOpen, setCloseOpen] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);

  const items = useMemo(() => entry?.itemIds ?? [], [entry]);
  const doneCount = items.filter((id) => checkedIds.has(id)).length;
  const pct = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);
  const closed = verdict !== null;
  const kindLabel =
    entry?.kind === 'catchup' ? 'CATCH-UP' : entry?.kind === 'postponed' ? 'POSTPONED' : entry?.kind === 'sunday' ? 'SUNDAY REVIEW' : 'STUDY DAY';

  const doClose = (v: Verdict): void => {
    if (v === 'postponed') {
      // postponed verdicts go through the tribunal flow instead
      setPostponeOpen(true);
      return;
    }
    closeDay(v);
  };

  // One atomic store action — never mutate-then-close via two loads.
  const doPostpone = postponeDay;

  return (
    <div style={{ display: 'grid', gap: 22, maxWidth: 760 }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px' }}>Today</h1>
          <p className="mono" style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3, letterSpacing: 1 }}>
            {dateLabel(today)} · {kindLabel}
            {entry?.stageId ? ` · ${entry.stageId.toUpperCase()}` : ''}
          </p>
        </div>
        {closed && (
          <span
            className="mono"
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              letterSpacing: 1.5,
              padding: '6px 14px',
              borderRadius: 99,
              border: `1px solid ${verdict === 'pass' ? 'var(--good)' : verdict === 'fail' ? 'var(--danger)' : 'var(--border-strong)'}`,
              color: verdict === 'pass' ? 'var(--good)' : verdict === 'fail' ? 'var(--danger)' : 'var(--muted)',
              textTransform: 'uppercase',
            }}
          >
            DAY CLOSED · {verdict}
          </span>
        )}
      </header>

      {bedtimePast && !closed && (
        <div
          role="status"
          className="mono"
          style={{
            border: '1px solid var(--warn)',
            background: 'var(--warn-dim)',
            color: 'var(--warn)',
            borderRadius: 12,
            padding: '11px 16px',
            fontSize: 12,
            letterSpacing: 0.5,
          }}
        >
          ⏾ Past bedtime ({settings.bedtime}). Close the day and sleep — the full lockout arrives with Phase 6.
        </div>
      )}

      {items.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--border-strong)',
            borderRadius: 16,
            padding: '42px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 15 }}>Nothing scheduled — the queue is clear.</p>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            Log hours anyway, or wander the{' '}
            <Link to="/roadmap" style={{ color: 'var(--info)', fontWeight: 600 }}>
              roadmap
            </Link>
            .
          </p>
        </div>
      ) : (
        <section aria-label="Today's tasks" style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
              The stack — {doneCount}/{items.length}
            </h2>
            <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginLeft: 'auto' }}>
              {pct}%
            </span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {items.map((id) => (
              <TaskRow key={id} itemId={id} accent={curriculumItem(id)?.accent ?? 'var(--p0)'} checked={checkedIds.has(id)} onToggle={toggle} />
            ))}
          </ul>
        </section>
      )}

      <HoursMeter />
      <FocusTimer />

      <section aria-label="Daily ritual" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!closed ? (
          <>
            <button type="button" style={btn('primary')} onClick={() => setCloseOpen(true)}>
              ✦ Close the day
            </button>
            <button
              type="button"
              style={btn('ghost')}
              onClick={() => {
                setPostponeOpen(true);
              }}
            >
              ⟲ Postpone
            </button>
          </>
        ) : (
          <>
            <button type="button" style={btn('ghost')} onClick={reopenDay}>
              ↺ Reopen day
            </button>
            <span style={{ color: 'var(--faint)', fontSize: 12.5, alignSelf: 'center' }}>
              Verdicts are permanent in spirit. This one isn't.
            </span>
          </>
        )}
      </section>

      <CloseModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={doClose}
        doneCount={doneCount}
        totalCount={items.length}
        hours={hoursLogged}
        target={target}
        roastIntensity={settings.roastIntensity}
      />
      <PostponeModal open={postponeOpen} onClose={() => setPostponeOpen(false)} onConfirm={doPostpone} />
    </div>
  );
}
