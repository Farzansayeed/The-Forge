import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { loadData } from '../../lib/storage';
import { consecutiveBadDays } from '../../engines/dread';
import { pickRoast, pickPraise } from '../../data/roast';
import { ScrambledText } from './ScrambledText';

/**
 * RoastOverlay — the dread engine's voice (Phase 6).
 * A glitch-in card that speaks after close-day verdicts and periodically
 * while dread is high. Tier respects the roast-intensity dial (decision 2).
 * U9: reduced-motion skips the glitch animation (ScrambledText handles it).
 */

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function RoastOverlay() {
  const [toast, setToast] = useState<{ text: string; danger: boolean } | null>(null);

  // Subscribe to close-day verdicts via storage events + local hook.
  useEffect(() => {
    let lastClosedAt: string | null = null;
    let lastVerdict: string | null = null;

    const speak = (): void => {
      const d = loadData();
      const today = new Date().toISOString().slice(0, 10);
      const rec = d.days[today];
      if (!rec?.closedAt || rec.closedAt === lastClosedAt) return;
      const first = lastClosedAt === null && lastVerdict === null;
      lastClosedAt = rec.closedAt;
      if (rec.verdict === lastVerdict && !first) return;
      lastVerdict = rec.verdict ?? null;

      if (rec.verdict === 'pass') {
        setToast({ text: pickPraise(), danger: false });
      } else if (rec.verdict === 'fail' || rec.verdict === 'ghost') {
        const bad = consecutiveBadDays(d, today);
        setToast({ text: pickRoast(d.settings.roastIntensity, bad).line, danger: true });
      } else {
        return; // rest/postponed stay silent
      }
      window.setTimeout(() => setToast(null), 7000);
    };

    speak(); // catch a verdict closed moments ago (e.g. right after the ritual)
    window.addEventListener('forge:day-closed', speak);
    const iv = window.setInterval(speak, 30_000);
    return () => {
      window.removeEventListener('forge:day-closed', speak);
      window.clearInterval(iv);
    };
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.text}
          initial={reducedMotion() ? { opacity: 0 } : { opacity: 0, x: 60, skewX: 8 }}
          animate={{ opacity: 1, x: 0, skewX: 0 }}
          exit={reducedMotion() ? { opacity: 0 } : { opacity: 0, x: 40 }}
          transition={{ duration: 0.22, ease: [0.25, 0.9, 0.35, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            right: 18,
            bottom: 18,
            zIndex: 90,
            maxWidth: 340,
            border: `1px solid ${toast.danger ? 'var(--danger)' : 'var(--good)'}`,
            background: 'var(--panel)',
            boxShadow: 'var(--shadow-3)',
            borderRadius: 14,
            padding: '14px 18px',
            color: toast.danger ? 'var(--danger)' : 'var(--good)',
            fontSize: 13.5,
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          <ScrambledText text={toast.text} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
