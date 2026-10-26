import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { QUIZ_SETS, bossSet } from '../../data/quizzes';
import { PHASES, stageById } from '../../data/curriculum';
import { gateStatus } from '../../engines/quiz';
import { dueCards } from '../../engines/spacedReview';
import { loadData } from '../../lib/storage';
import { useProgress } from '../../stores/progress';
import { QuizRunner } from './QuizRunner';
import { btn } from './shared';
import type { QuizSet } from '../../data/quizzes/types';

/**
 * /arena — quiz hub (DESIGN.md §5). Boss gates with real passMark locking,
 * torture tests per authored stage, spaced-review session from the queue.
 */

const ACCENT: Record<string, string> = {
  p0: 'var(--p0)', p1: 'var(--p1)', p2: 'var(--p2)', p3: 'var(--p3)', p4: 'var(--p4)', p5: 'var(--p5)',
};

type View = { kind: 'hub' } | { kind: 'run'; set: QuizSet } | { kind: 'review' };

function SetCard({
  set,
  accent,
  locked,
  lockReason,
  best,
  attempts,
  onRun,
}: {
  set: QuizSet;
  accent: string;
  locked: boolean;
  lockReason: string;
  best: number;
  attempts: number;
  onRun: () => void;
}) {
  const cleared = set.kind === 'boss' ? best >= set.passMark * 100 : best >= 80;
  return (
    <div
      style={{
        border: `1px solid ${locked ? 'var(--border)' : cleared ? 'var(--good)' : 'var(--border-strong)'}`,
        borderRadius: 14,
        background: 'var(--panel)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        opacity: locked ? 0.55 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: locked ? 'var(--faint)' : accent }}>
            {set.kind === 'boss' ? '⚔ BOSS GATE' : 'TORTURE TEST'} · {set.items.length} ITEMS · ≥{Math.round(set.passMark * 100)}%
          </span>
          {cleared && (
            <span className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--good)' }}>
              ✓ CLEARED
            </span>
          )}
          {attempts > 0 && !cleared && (
            <span className="mono" style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--warn)' }}>
              BEST {best}%
            </span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginTop: 5 }}>{set.title}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>
          {locked ? `🔒 ${lockReason}` : set.stageIds.map((s) => stageById(s)?.title ?? s).join(' · ')}
        </div>
      </div>
      <button type="button" style={btn(locked ? 'ghost' : 'primary')} disabled={locked} onClick={onRun}>
        {locked ? 'Locked' : attempts > 0 ? (cleared ? 'Re-run' : 'Retry') : 'Enter'}
      </button>
    </div>
  );
}

export function ArenaPage() {
  const [view, setView] = useState<View>({ kind: 'hub' });
  const [, forceTick] = useState(0);
  const checkedIds = useProgress((s) => s.checkedIds);
  const data = useMemo(() => loadData(), [checkedIds, view]);
  const today = new Date().toISOString().slice(0, 10);
  const due = useMemo(() => dueCards(data.review, today), [data, today]);

  if (view.kind === 'run') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <QuizRunner set={view.set} onExit={() => { setView({ kind: 'hub' }); forceTick((t) => t + 1); }} />
      </motion.div>
    );
  }

  const torture = Object.values(QUIZ_SETS).filter((s) => s.kind === 'torture');

  return (
    <div style={{ display: 'grid', gap: 30, maxWidth: 860 }}>
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px' }}>The Arena</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
          Torture tests per stage · boss gates at ≥80% unlock the next phase · every miss returns via spaced review.
        </p>
      </header>

      {/* Spaced review — the weakest-first queue */}
      <section aria-label="Spaced review">
        <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
          Spaced review — {due.length} due today
        </h2>
        {due.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>
            Queue empty. Missed items resurface here on their schedule (1 → 3 → 7 → 16 → 35 days).
          </p>
        ) : (
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {due.slice(0, 5).map((c) => (
              <div
                key={c.itemId}
                className="mono"
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--warn)',
                  borderRadius: 10,
                  background: 'var(--panel)',
                  padding: '10px 14px',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'var(--warn)' }}>↻</span>
                <span style={{ flex: 1 }}>{c.itemId}</span>
                <span style={{ color: 'var(--faint)' }}>
                  lapse ×{c.lapses} · step {c.step + 1}
                </span>
              </div>
            ))}
            <p className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>
              review sessions compose themselves from this queue — Phase 8 ships the dedicated runner
            </p>
          </div>
        )}
      </section>

      {/* Boss gates by phase */}
      {PHASES.filter((p) => p.bossGateId).map((ph) => {
        const set = bossSet(ph.id);
        const st = set ? gateStatus(set.id, data.quizResults) : null;
        const accent = ACCENT[ph.id];
        // Boss = placement test (PLAN.md §1): attemptable cold, instantly
        // unlocks the phase. Only sequencing applies — clear the previous
        // phase's gate first (p1's gate has no predecessor and is always open).
        const phaseIdx = PHASES.findIndex((x) => x.id === ph.id);
        const prevBoss = PHASES[phaseIdx - 1]?.bossGateId;
        const prevCleared = !prevBoss || gateStatus(prevBoss, data.quizResults).passed;
        const locked = !prevCleared;
        const lockReason = `clear ${PHASES[phaseIdx - 1].title} first`;
        return (
          <section key={ph.id} aria-label={`Boss gate ${ph.num}`}>
            <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: accent, textTransform: 'uppercase' }}>
              Phase {ph.num} · {ph.title}
            </h2>
            <div style={{ marginTop: 10 }}>
              {!set ? (
                <div className="mono" style={{ border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '12px 16px', fontSize: 11.5, color: 'var(--faint)' }}>
                  boss exam for {ph.title} — not authored yet
                </div>
              ) : (
                <SetCard
                  set={set}
                  accent={accent}
                  locked={locked}
                  lockReason={lockReason}
                  best={st?.best ?? 0}
                  attempts={st?.attempts ?? 0}
                  onRun={() => setView({ kind: 'run', set })}
                />
              )}
            </div>
          </section>
        );
      })}

      {/* Torture tests */}
      <section aria-label="Torture tests">
        <h2 className="mono" style={{ fontSize: 10.5, letterSpacing: 2.5, color: 'var(--faint)', textTransform: 'uppercase' }}>
          Torture tests
        </h2>
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {torture.map((set) => {
            const st = gateStatus(set.id, data.quizResults);
            return (
              <SetCard
                key={set.id}
                set={set}
                accent={ACCENT[set.stageIds[0]?.replace('s0', 'p').replace('s1', 'p') ?? 'p0'] ?? 'var(--p0)'}
                locked={false}
                lockReason=""
                best={st.best}
                attempts={st.attempts}
                onRun={() => setView({ kind: 'run', set })}
              />
            );
          })}
          <div className="mono" style={{ border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '12px 16px', fontSize: 11.5, color: 'var(--faint)' }}>
            all 17 stages authored (s00–s17) · s18 composes itself from your review queue · the validator holds CI to the blueprint counts
          </div>
        </div>
      </section>
    </div>
  );
}
