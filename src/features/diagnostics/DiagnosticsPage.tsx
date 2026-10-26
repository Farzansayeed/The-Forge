import { useMemo } from 'react';
import { STAGES } from '../../data/curriculum';
import { QUIZ_SETS, quizSetsForStage } from '../../data/quizzes';
import { BLUEPRINT, BOSS_BLUEPRINT, COVERED_STAGES, COVERED_BOSSES } from '../../data/quizzes/blueprint';
import { loadData, BACKUP_KEY, hasCorruptBackup, isSaveDegraded } from '../../lib/storage';
import { buildSchedule } from '../../engines/schedule';
import { todayKey } from '../../lib/schema';

/**
 * Diagnostics — Phase 8. In-app self-checks: run them in the browser when a
 * surface looks wrong instead of cracking open the devtools. Mirrors the
 * validator test suite (blueprint counts, registry wiring, storage health,
 * schedule build) read-only — nothing here mutates state.
 */

type CheckStatus = 'ok' | 'warn' | 'fail';

interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
}

const BADGE: Record<CheckStatus, { label: string; color: string; bg: string }> = {
  ok: { label: 'OK', color: 'var(--good)', bg: 'var(--good-dim)' },
  warn: { label: 'WARN', color: 'var(--warn, #d9a441)', bg: 'rgba(217, 164, 65, 0.12)' },
  fail: { label: 'FAIL', color: 'var(--danger)', bg: 'var(--danger-dim)' },
};

function checkJsonStorage(): Check {
  try {
    const raw = window.localStorage.getItem('cdr-v3');
    if (!raw) return { name: 'Persistence', status: 'ok', detail: 'no saved state yet (fresh forge)' };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && (parsed as { version?: unknown }).version === 4) {
      const days = Object.keys((parsed as { days?: Record<string, unknown> }).days ?? {}).length;
      const checked = Object.keys((parsed as { checked?: Record<string, unknown> }).checked ?? {}).length;
      return { name: 'Persistence', status: 'ok', detail: `schema v4 · ${days} days · ${checked} checks` };
    }
    return { name: 'Persistence', status: 'warn', detail: 'saved state is not schema v4 (will migrate or reset on load)' };
  } catch {
    return { name: 'Persistence', status: 'fail', detail: 'saved state is corrupt JSON — app will fall back to defaults' };
  }
}

function checkStorageWritable(): Check {
  try {
    const probe = 'forge-diag-probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return { name: 'Storage writable', status: 'ok', detail: 'localStorage accepts writes' };
  } catch {
    return { name: 'Storage writable', status: 'fail', detail: 'localStorage blocked (private mode? quota?) — progress will not save' };
  }
}

function checkSaveReliability(): Check {
  if (isSaveDegraded())
    return {
      name: 'Save reliability',
      status: 'warn',
      detail: 'a save was rejected this session (quota / private mode) — newer work kept in memory, retried on exit',
    };
  if (hasCorruptBackup())
    return {
      name: 'Save reliability',
      status: 'warn',
      detail: `a corrupt save was preserved at ${BACKUP_KEY} earlier — export it before clearing browser data`,
    };
  return { name: 'Save reliability', status: 'ok', detail: 'writes land without rejections · no corrupt payloads preserved' };
}

function checkCurriculum(): Check {
  const stageIds = STAGES.map((s) => s.id);
  const expected = Array.from({ length: 19 }, (_, i) => `s${String(i).padStart(2, '0')}`);
  const missing = expected.filter((id) => !stageIds.includes(id));
  const items = STAGES.reduce((n, s) => n + s.topics.length + s.drills.length, 0);
  if (missing.length)
    return { name: 'Curriculum', status: 'fail', detail: `missing stages: ${missing.join(', ')}` };
  return { name: 'Curriculum', status: 'ok', detail: `${STAGES.length} stages (s00–s18) · ${items} items` };
}

function checkQuizRegistry(): Check {
  const torture = Object.values(QUIZ_SETS).filter((s) => s.kind === 'torture');
  const boss = Object.values(QUIZ_SETS).filter((s) => s.kind === 'boss');
  const uncovered = COVERED_STAGES.filter((sid) => quizSetsForStage(sid).length === 0);
  const emptySet = Object.values(QUIZ_SETS).find((s) => s.items.length === 0);
  if (uncovered.length || emptySet)
    return {
      name: 'Quiz registry',
      status: 'fail',
      detail: `covered stages without a set: ${uncovered.join(', ') || '—'}${emptySet ? ` · empty set ${emptySet.id}` : ''}`,
    };
  return {
    name: 'Quiz registry',
    status: 'ok',
    detail: `${torture.length} torture sets (s00–s17) · ${boss.length} boss exams · ${Object.values(QUIZ_SETS)
      .reduce((n, s) => n + s.items.length, 0)} items total`,
  };
}

function checkBlueprintCounts(): Check {
  const mismatches: string[] = [];
  for (const [sid, count] of Object.entries(BLUEPRINT)) {
    const set = Object.values(QUIZ_SETS).find((s) => s.stageIds.includes(sid) && s.kind === 'torture');
    const actual = set?.items.length ?? -1;
    if (actual !== count) mismatches.push(`${sid}: ${actual} ≠ ${count}`);
  }
  for (const [bid, count] of Object.entries(BOSS_BLUEPRINT)) {
    const set = Object.values(QUIZ_SETS).find((s) => s.id === bid);
    const actual = set?.items.length ?? -1;
    if (actual !== count) mismatches.push(`${bid}: ${actual} ≠ ${count}`);
  }
  if (COVERED_STAGES.length !== Object.keys(BLUEPRINT).length)
    mismatches.push(`coverage: ${COVERED_STAGES.length} of ${Object.keys(BLUEPRINT).length} stages`);
  if (COVERED_BOSSES.length !== Object.keys(BOSS_BLUEPRINT).length)
    mismatches.push(`boss coverage: ${COVERED_BOSSES.length} of ${Object.keys(BOSS_BLUEPRINT).length}`);
  if (mismatches.length) return { name: 'Blueprint counts', status: 'fail', detail: mismatches.join(' · ') };
  const total = Object.values(QUIZ_SETS).reduce((n, s) => n + s.items.length, 0);
  return {
    name: 'Blueprint counts',
    status: 'ok',
    detail: `17 stages + 4 boss exams match CURRICULUM Appendix A · ${total} authored items`,
  };
}

function checkSchedule(): Check {
  try {
    const entries = buildSchedule(loadData(), todayKey());
    const first = entries[0];
    const kinds = entries.reduce<Record<string, number>>((acc, e) => ((acc[e.kind] = (acc[e.kind] ?? 0) + 1), acc), {});
    if (entries.length === 0) return { name: 'Schedule engine', status: 'fail', detail: 'buildSchedule returned zero days' };
    return {
      name: 'Schedule engine',
      status: 'ok',
      detail: `${entries.length} days built · first ${first?.key} (${first?.kind}) · ${Object.entries(kinds)
        .map(([k, n]) => `${k}:${n}`)
        .join(' ')}`,
    };
  } catch (err) {
    return { name: 'Schedule engine', status: 'fail', detail: `buildSchedule threw: ${String(err)}` };
  }
}

function checkReviewQueue(): Check {
  const data = loadData();
  const due = Object.values(data.review).filter((c) => c.due <= todayKey()).length;
  const cards = Object.keys(data.review).length;
  return { name: 'Review queue', status: cards > 0 && due > 0 ? 'ok' : 'warn', detail: `${cards} cards · ${due} due today (s18 is fed by this queue)` };
}

function checkPwa(): Check {
  const sw = 'serviceWorker' in navigator;
  const manifest = document.querySelector('link[rel="manifest"]') !== null;
  if (!sw && !manifest) return { name: 'PWA', status: 'warn', detail: 'no service worker support and no manifest link' };
  if (!manifest) return { name: 'PWA', status: 'warn', detail: 'manifest link missing from index.html' };
  return { name: 'PWA', status: 'ok', detail: sw ? 'manifest linked · service worker supported (https only)' : 'manifest linked · SW unsupported here' };
}

export function DiagnosticsPage() {
  const checks = useMemo<Check[]>(
    () => [
      checkJsonStorage(),
      checkStorageWritable(),
      checkSaveReliability(),
      checkCurriculum(),
      checkQuizRegistry(),
      checkBlueprintCounts(),
      checkSchedule(),
      checkReviewQueue(),
      checkPwa(),
    ],
    [],
  );

  const failed = checks.filter((c) => c.status === 'fail').length;
  const warned = checks.filter((c) => c.status === 'warn').length;
  const headline = failed > 0 ? 'SOMETHING IS BLEEDING' : warned > 0 ? 'MINOR SCARS' : 'ALL FORGES HOLD';

  return (
    <div style={{ display: 'grid', gap: 22, maxWidth: 760 }}>
      <header>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px' }}>Diagnostics</h1>
        <p className="mono" style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3, letterSpacing: 1 }}>
          {headline.toUpperCase()}
        </p>
      </header>

      <section
        aria-label="Self-checks"
        style={{ display: 'grid', gap: 0, border: '1px solid var(--border)', borderRadius: 14, background: 'var(--panel)', overflow: 'hidden' }}
      >
        {checks.map((c, i) => {
          const badge = BADGE[c.status];
          return (
            <div
              key={c.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'start',
                padding: '14px 20px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'grid', gap: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</span>
                <span style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.5 }}>{c.detail}</span>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  fontWeight: 700,
                  color: badge.color,
                  background: badge.bg,
                  border: `1px solid ${badge.color}`,
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </section>

      <p className="mono" style={{ fontSize: 10.5, color: 'var(--faint)', letterSpacing: 1 }}>
        read-only · mirrors the CI validator (validate.test.ts) · {new Date().toLocaleString()}
      </p>
    </div>
  );
}
