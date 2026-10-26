import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CountUp from '../../components/bits/CountUp';
import SpotlightCard from '../../components/bits/SpotlightCard';
import { StageDetail } from '../../components/tracker/StageDetail';
import { PHASES, stageById } from '../../data/curriculum';
import { globalProgress, phaseProgress, stageProgress } from '../../engines/progress';
import { useProgress } from '../../stores/progress';

const ACCENT: Record<string, string> = {
  p0: 'var(--p0)',
  p1: 'var(--p1)',
  p2: 'var(--p2)',
  p3: 'var(--p3)',
  p4: 'var(--p4)',
  p5: 'var(--p5)',
};

function ProgressRing({ pct, accent, size = 46 }: { pct: number; accent: string; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, position: 'relative', flex: 'none' }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.25,0.9,0.35,1)' }}
        />
      </svg>
      <span
        className="mono"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--muted)',
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function StageNode({
  stageId,
  accent,
  expanded,
  onToggleExpand,
}: {
  stageId: string;
  accent: string;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const stage = stageById(stageId)!;
  const checkedIds = useProgress((s) => s.checkedIds);
  const toggle = useProgress((s) => s.toggle);
  const { done, total } = useMemo(() => stageProgress(stage, checkedIds), [stage, checkedIds]);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div>
      <SpotlightCard
        spotlightColor="rgba(111, 191, 154, 0.08)"
        className="!p-0 !rounded-2xl"
      >
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-controls={`detail-${stage.id}`}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '15px 20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'inherit',
            font: 'inherit',
          }}
        >
          <span
            className="mono"
            style={{ color: accent, fontWeight: 600, fontSize: 13, width: 38, flex: 'none' }}
          >
            {stage.id.toUpperCase()}
          </span>
          <span style={{ fontWeight: 700, fontSize: 15.5, flex: 1 }}>{stage.title}</span>
          <span className="mono" style={{ color: 'var(--faint)', fontSize: 11, whiteSpace: 'nowrap' }}>
            {done}/{total}
          </span>
          <ProgressRing pct={pct} accent={accent} size={40} />
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            style={{ color: 'var(--muted)', fontSize: 11, flex: 'none' }}
          >
            ▼
          </motion.span>
        </button>
      </SpotlightCard>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`detail-${stage.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.9, 0.35, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '22px 6px 8px' }}>
              <StageDetail
                stage={stage}
                accent={accent}
                checkedIds={checkedIds}
                onToggle={toggle}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RoadmapPage() {
  const checkedIds = useProgress((s) => s.checkedIds);
  // Deep links (Today's task rows) may target a stage — expand it on arrival (U13).
  const [openStage, setOpenStage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const s = new URLSearchParams(window.location.search).get('stage');
    return s && stageById(s) ? s : null;
  });
  const g = globalProgress(checkedIds);

  return (
    <div style={{ display: 'grid', gap: 34 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px' }}>The Journey</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 2 }}>
            6 phases · 19 stages · boss gates at ≥80% — the path from first compile to interview-ready.
          </p>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '10px 18px',
            background: 'var(--panel)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p1)' }}>
            <CountUp to={g.pct} duration={1.2} />%
          </div>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: 1.5, color: 'var(--faint)' }}>
            {g.done}/{g.total} ITEMS
          </div>
        </div>
      </header>

      {PHASES.map((ph) => {
        const accent = ACCENT[ph.id];
        const pp = phaseProgress(ph, checkedIds);
        return (
          <section key={ph.id} aria-label={`Phase ${ph.num}: ${ph.title}`}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <h2
                className="mono"
                style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: accent }}
              >
                Phase {ph.num} · {ph.title}
              </h2>
              <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', marginLeft: 'auto' }}>
                {pp.done}/{pp.total}
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 14px' }}>{ph.tagline}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {ph.stageIds.map((sid) => (
                <StageNode
                  key={sid}
                  stageId={sid}
                  accent={accent}
                  expanded={openStage === sid}
                  onToggleExpand={() => setOpenStage(openStage === sid ? null : sid)}
                />
              ))}
            </div>
            {ph.bossGateId && (
              <div
                className="mono"
                style={{
                  marginTop: 12,
                  fontSize: 10.5,
                  letterSpacing: 2,
                  color: 'var(--warn)',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 10,
                  padding: '9px 16px',
                  width: 'fit-content',
                }}
              >
                ⚔ BOSS GATE · {ph.bossGateId.toUpperCase()} · ≥80% TO ADVANCE
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
