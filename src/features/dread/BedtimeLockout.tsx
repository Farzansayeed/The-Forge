import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { loadData } from '../../lib/storage';
import { bedtimeStatus, type BedtimeMode } from '../../engines/accountability';
import { todayKey } from '../../lib/schema';

/**
 * BedtimeLockout (Phase 6, decision 13):
 *   past bedtime, day unclosed  → nag banner
 *   30+ minutes late            → full-screen overlay (day stays open;
 *                                 the close button remains reachable)
 *   Notification permission     → one PWA notification when bedtime passes
 *                                 with the day unclosed.
 * U9: reduced-motion = no pulse, instant opacity.
 */

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function notifyIfPermitted(bedtime: string): Promise<void> {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const d = loadData();
    const today = todayKey();
    if (d.days[today]?.verdict) return; // closed — nothing to nag about
    const key = `forge-bedtime-notified-${today}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    new Notification('The Forge — the day is still open', {
      body: `Bedtime was ${bedtime}. Close the day before it ghosts you.`,
      tag: 'forge-bedtime',
    });
  } catch {
    /* notifications are a courtesy — never a crash */
  }
}

export function BedtimeLockout() {
  const [mode, setMode] = useState<BedtimeMode>('none');
  const [bedtime, setBedtime] = useState('23:30');
  const [minutesLate, setMinutesLate] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let notifiedToday = '';
    const check = (): void => {
      const d = loadData();
      const now = new Date();
      const today = todayKey(now); // local calendar — paired with the local bedtime compare below
      const closed = d.days[today]?.verdict !== undefined;
      const s = bedtimeStatus(d.settings.bedtime, now, closed);
      setBedtime(d.settings.bedtime);
      setMinutesLate(s.minutesLate);
      setMode(s.mode);
      if (s.past && s.mode !== 'closed' && notifiedToday !== today) {
        notifiedToday = today;
        void notifyIfPermitted(d.settings.bedtime);
      }
    };
    check();
    const iv = window.setInterval(check, 30_000);
    return () => window.clearInterval(iv);
  }, []);

  // reset dismissal when the lockout lifts (new day / day closed)
  useEffect(() => {
    if (mode === 'none' || mode === 'closed') setDismissed(false);
  }, [mode]);

  const showNag = mode === 'nag' || (mode === 'overlay' && dismissed);

  return (
    <>
      <AnimatePresence>
        {showNag && (
          <motion.div
            key="nag"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="alert"
            className={reducedMotion() ? undefined : 'forge-pulse'}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 80,
              background: 'var(--warn-dim)',
              borderTop: '1px solid var(--warn)',
              color: 'var(--warn)',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span>
              ⏾ {minutesLate} min past bedtime ({bedtime}) — the day is still open.
            </span>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              style={{
                marginLeft: 'auto',
                border: '1px solid var(--warn)',
                background: 'transparent',
                color: 'var(--warn)',
                borderRadius: 8,
                padding: '5px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                font: 'inherit',
                fontSize: 12,
              }}
            >
              I know. Later.
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === 'overlay' && !dismissed && (
          <motion.div
            key="lockout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="alertdialog"
            aria-label="Bedtime lockout"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 95,
              background: 'color-mix(in srgb, var(--bg) 82%, transparent)',
              backdropFilter: 'blur(3px)',
              display: 'grid',
              placeItems: 'center',
              padding: 24,
            }}
          >
            <div
              className={reducedMotion() ? undefined : 'forge-pulse'}
              style={{
                border: '1px solid var(--danger)',
                background: 'var(--panel)',
                boxShadow: 'var(--shadow-3)',
                borderRadius: 18,
                padding: '34px 38px',
                maxWidth: 440,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>🌙</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>
                The Forge does not do 2AM maths.
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 12, lineHeight: 1.65 }}>
                It is {minutesLate} minutes past your bedtime ({bedtime}) and the day is still
                open. Tomorrow's discipline is bought with tonight's sleep.
              </p>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                style={{
                  marginTop: 20,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--panel2)',
                  color: 'var(--text)',
                  borderRadius: 10,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  font: 'inherit',
                  fontSize: 13,
                }}
              >
                Dismiss — my word is my bond
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
