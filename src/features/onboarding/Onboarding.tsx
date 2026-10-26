import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { saveData, loadData } from '../../lib/storage';
import { todayKey, type AppData, type RoastIntensity } from '../../lib/schema';
import { useSettings } from '../../stores/settings';
import { useDaily } from '../../stores/daily';

/**
 * Onboarding wizard (Phase 7): name/start date → targets → bedtime →
 * roast dial + theme. Shows once (flag in localStorage), skippable —
 * every field has the default waiting behind it.
 */

const FLAG = 'forge-onboarded';

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const btn = (kind: 'primary' | 'ghost'): React.CSSProperties => ({
  padding: '10px 18px',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  font: 'inherit',
  ...(kind === 'primary'
    ? { border: '1px solid var(--good)', background: 'var(--good-dim)', color: 'var(--good)' }
    : { border: '1px solid var(--border-strong)', background: 'var(--panel2)', color: 'var(--text)' }),
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--panel2)',
  color: 'var(--text)',
  font: 'inherit',
  fontSize: 14,
};

export function needsOnboarding(): boolean {
  try {
    return localStorage.getItem(FLAG) !== '1';
  } catch {
    return false;
  }
}

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayKey());
  const [weekday, setWeekday] = useState(3);
  const [sunday, setSunday] = useState(6.5);
  const [bedtime, setBedtime] = useState('23:30');
  const [intensity, setIntensity] = useState<RoastIntensity>('spicy');
  const theme = useSettings((s) => s.theme);
  const setTheme = useSettings((s) => s.setTheme);
  const refreshDaily = useDaily((s) => s.refresh);

  if (done || (typeof window !== 'undefined' && localStorage.getItem(FLAG) === '1')) return null;

  const commit = (): void => {
    const d = loadData();
    const patch = (fn: (x: AppData) => void): void => {
      fn(d);
    };
    patch((x) => {
      x.startDate = startDate;
      x.settings.weekdayTarget = weekday;
      x.settings.sundayTarget = sunday;
      x.settings.bedtime = bedtime;
      x.settings.roastIntensity = intensity;
      x.settings.theme = theme;
    });
    saveData(d);
    localStorage.setItem(FLAG, '1');
    refreshDaily(todayKey());
    window.dispatchEvent(new CustomEvent('forge:data-changed'));
  };

  const finish = (): void => {
    commit();
    setDone(true);
  };

  const steps = [
    {
      title: 'Welcome to The Forge.',
      body: (
        <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.7 }}>
          A 23-week C × DSA curriculum that schedules your days, quizzes you like it means it,
          and keeps score when you slip. Set the contract now — every field can change later in
          Settings.
        </p>
      ),
    },
    {
      title: 'When does the forge light?',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--faint)' }}>START DATE</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value || todayKey())} style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--faint)' }}>YOUR NAME (THE LEDGER LIKES NAMES)</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="optional" style={inputStyle} />
          </label>
        </div>
      ),
    },
    {
      title: 'The daily contract.',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--faint)' }}>WEEKDAY TARGET (HOURS)</span>
            <input type="number" min={0.5} max={16} step={0.5} value={weekday} onChange={(e) => setWeekday(Math.max(0.5, Number(e.target.value) || 3))} style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--faint)' }}>SUNDAY TARGET (HOURS)</span>
            <input type="number" min={0} max={16} step={0.5} value={sunday} onChange={(e) => setSunday(Math.max(0, Number(e.target.value) || 0))} style={inputStyle} />
          </label>
        </div>
      ),
    },
    {
      title: 'When does the forge sleep?',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--faint)' }}>BEDTIME</span>
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value || '23:30')} style={inputStyle} />
          </label>
          <p style={{ color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.6 }}>
            Past this with the day still open, the nag arrives — thirty minutes later, the lockout.
            The tracker fights back, but it respects sleep.
          </p>
        </div>
      ),
    },
    {
      title: 'How mean should it be?',
      body: (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['mild', 'spicy', 'nuclear'] as const).map((i) => (
              <button key={i} type="button" onClick={() => setIntensity(i)} style={btn(intensity === i ? 'primary' : 'ghost')}>
                {i}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setTheme('terminal')} style={btn(theme === 'terminal' ? 'primary' : 'ghost')}>
              Terminal (dark)
            </button>
            <button type="button" onClick={() => setTheme('blueprint')} style={btn(theme === 'blueprint' ? 'primary' : 'ghost')}>
              Blueprint (light)
            </button>
          </div>
        </div>
      ),
    },
  ];

  const stepEl = steps[step];
  const last = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="onboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reducedMotion() ? { duration: 0 } : { duration: 0.25 }}
        role="dialog"
        aria-label="Welcome to The Forge"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          padding: 20,
        }}
      >
        <motion.div
          key={step}
          initial={reducedMotion() ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion() ? { duration: 0 } : { duration: 0.2 }}
          style={{
            border: '1px solid var(--border-strong)',
            background: 'var(--panel)',
            boxShadow: 'var(--shadow-3)',
            borderRadius: 18,
            padding: '30px 32px',
            maxWidth: 460,
            width: '100%',
            display: 'grid',
            gap: 16,
          }}
        >
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: 2, color: 'var(--faint)' }}>
            STEP {step + 1} / {steps.length}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>{stepEl.title}</h2>
          {stepEl.body}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {step > 0 && (
              <button type="button" style={btn('ghost')} onClick={() => setStep(step - 1)}>
                ← Back
              </button>
            )}
            {last ? (
              <button type="button" style={btn('primary')} onClick={finish}>
                Light the forge ✦
              </button>
            ) : (
              <button type="button" style={btn('primary')} onClick={() => setStep(step + 1)}>
                Continue →
              </button>
            )}
            <button
              type="button"
              style={{ ...btn('ghost'), marginLeft: 'auto', opacity: 0.7 }}
              onClick={() => {
                localStorage.setItem(FLAG, '1');
                setDone(true);
              }}
            >
              Skip
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
