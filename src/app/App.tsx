import { lazy, Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { TopBar } from './TopBar';
import { ErrorBoundary } from './ErrorBoundary';
import { useLenis } from './useLenis';
import { Modal } from '../components/ui/Modal';
import { DreadProvider } from '../features/dread/DreadProvider';
import { RoastOverlay } from '../features/dread/RoastOverlay';
import { BedtimeLockout } from '../features/dread/BedtimeLockout';
import { Onboarding, needsOnboarding } from '../features/onboarding/Onboarding';
import { TodayPage } from '../features/today/TodayPage';
import { IntroGate } from './IntroGate';

/* ═══ Route code-splitting ═══
 * Today (the home route, the daily contract) stays eager — it must paint first.
 * Every other page loads on demand, so heavy pages keep their weight out of the
 * initial bundle: Arena pulls all 376 quiz items, Roadmap the full curriculum,
 * Diagnostics the validators. Route transitions still animate via pageMotion. */
const RoadmapPage = lazy(() =>
  import('../features/roadmap/RoadmapPage').then((m) => ({ default: m.RoadmapPage })),
);
const ArenaPage = lazy(() =>
  import('../features/arena/ArenaPage').then((m) => ({ default: m.ArenaPage })),
);
const VizPage = lazy(() =>
  import('../features/viz/VizPage').then((m) => ({ default: m.VizPage })),
);
const StatsPage = lazy(() =>
  import('../features/stats/StatsPage').then((m) => ({ default: m.StatsPage })),
);
const LibraryPage = lazy(() =>
  import('../features/library/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const DiagnosticsPage = lazy(() =>
  import('../features/diagnostics/DiagnosticsPage').then((m) => ({ default: m.DiagnosticsPage })),
);
/* The palette carries the full quiz registry (title list) — split it too, and
 * mount it only while open. The hotkey stays eager so Ctrl+K works from load. */
const CommandPalette = lazy(() =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
);

const pageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.18, ease: [0.25, 0.9, 0.35, 1] as const },
};

/** Suspense fallback while a lazy route chunk loads — on-token, motion-free. */
function PageFallback() {
  return (
    <div style={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
      <span
        className="mono"
        style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--faint)' }}
      >
        the forge opens
      </span>
    </div>
  );
}

function Stub({ title, note }: { title: string; note: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...pageMotion}>
      <div
        style={{
          border: '1px dashed var(--border-strong)',
          borderRadius: 16,
          padding: '48px 28px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 8 }}>{note}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid var(--border-strong)',
              background: 'var(--panel2)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Test modal (U8)
          </button>
          <NavLink
            to="/"
            style={{ color: 'var(--info)', fontSize: 13, fontWeight: 600, alignSelf: 'center' }}
          >
            ← Today
          </NavLink>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} label={`${title} demo modal`}>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Focus trap live.</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 8, lineHeight: 1.6 }}>
          Tab cycles inside this dialog, Esc closes it, and focus returns to the button
          that opened it. Every overlay in The Forge inherits this behavior.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <input
            aria-label="Demo input"
            placeholder="Tab reaches me…"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--panel2)',
              color: 'var(--text)',
              font: 'inherit',
              fontSize: 13,
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid var(--border-strong)',
              background: 'var(--good-dim)',
              color: 'var(--good)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}

export default function App() {
  useLenis();
  const location = useLocation();
  const [onboard] = useState(() => needsOnboarding());
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl+K / ⌘K — global and eager; the palette component itself mounts on demand.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user"> {/* U9: engine-level reduced-motion for every motion.* below */}
      <IntroGate>
        <DreadProvider />
        <RoastOverlay />
        <BedtimeLockout />
        {paletteOpen && (
          <Suspense fallback={null}>
            <CommandPalette onClose={() => setPaletteOpen(false)} />
          </Suspense>
        )}
        {onboard && <Onboarding />}
        <div>
          <TopBar />
        <main style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 20px 90px' }}>
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <motion.div {...pageMotion}>
                    <TodayPage />
                  </motion.div>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <motion.div {...pageMotion}>
                    <RoadmapPage />
                  </motion.div>
                }
              />
              <Route
                path="/arena"
                element={
                  <motion.div {...pageMotion}>
                    <ArenaPage />
                  </motion.div>
                }
              />
              <Route path="/viz" element={<VizPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route
                path="*"
                element={<Stub title="Lost?" note="That route doesn't exist — yet." />}
              />
            </Routes>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
      </IntroGate>
      </MotionConfig>
    </ErrorBoundary>
  );
}
