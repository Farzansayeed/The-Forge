import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './IntroGate.css';

/* ═══ Code-split the ignition ═══
 * The electric-logo module pulls in ogl + the shader pipeline (~the biggest
 * single non-page module). It is only rendered by this gate, so it loads
 * on demand and never taxes the entry chunk — the site paints underneath
 * while the intro still plays its timeline (pure setTimeout, unaffected). */
const ElectricLogo = lazy(() => import('../components/ElectricLogo/ElectricLogo'));

/**
 * IntroGate — the Forge ignition. Every open/reload: the electric logo
 * crackles to life (~1.1s), fires its blast ripple, the veil tears open
 * and the site burns through. Skippable by click/key; skipped entirely
 * for prefers-reduced-motion.
 *
 * Robustness notes (learned the hard way in preview):
 * - The unmount is pure setTimeout, never animation-end: rAF can be frozen
 *   indefinitely in an occluded/backgrounded tab, which wedges any
 *   animation-driven gate.
 * - The veil burst + overlay fade are CSS keyframe/compositor animations,
 *   not rAF-driven JS springs, for the same reason.
 * - The site renders underneath from t=0; the intro merely covers it.
 * - The gate outlives its overlay (App wraps every page), so the global
 *   skip listener and timers are explicitly retired at 'done' — a stray
 *   keypress must never resurrect the cover (a shipped bug, now tested).
 */

const CRACKLE_MS = 1100; // logo forms and charges
const SPREAD_MS = 850; // blast → veil tears open
const TOTAL_MS = CRACKLE_MS + SPREAD_MS + 600; // + overlay fade

/** Isolate WebGL crashes (some drivers throw on `new Renderer`): the intro
 * degrades to a plain cover + tag instead of nuking the whole site through
 * the app-wide ErrorBoundary. */
class LogoBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

export function IntroGate({ children }: { children: ReactNode }) {
  const reduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

  const [phase, setPhase] = useState<'hold' | 'open' | 'done'>(reduced ? 'done' : 'hold');
  // Mirror for the mount-only effect below. The gate outlives its overlay
  // (App keeps it wrapped around every page for the app's whole life), and the
  // effect never re-runs — so the global keydown listener it registers must be
  // guaranteed dead after the intro. Without this mirror, any keystroke after
  // 'done' re-invoked skip and RESURRECTED the overlay: a fixed, z-index
  // 200 cover with the logo canvas on top, already faded to opacity 0 —
  // invisible but hit-testable, so the whole site felt dead to pointer input.
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const blastRetriesRef = useRef(0);

  const fireBlast = useCallback(() => {
    const wrap = logoWrapRef.current;
    if (!wrap || firedRef.current) return;
    // Dispatch on the logo's canvas (inside the .electric-logo container):
    // events bubble UP, so targeting the wrapper would never reach the
    // component's own pointerdown listener. With bubbles:true the canvas
    // events surface on the container and trigger its shockwave + arc burst.
    // NOTE: the logo is lazy-loaded, so its canvas can still be arriving —
    // retry briefly instead of silently losing the blast.
    const canvas = wrap.querySelector('canvas');
    if (!canvas) {
      if (blastRetriesRef.current < 8) {
        blastRetriesRef.current += 1;
        window.setTimeout(fireBlast, 120);
      }
      return;
    }
    firedRef.current = true;
    const rect = wrap.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (const type of ['pointermove', 'pointerdown'] as const) {
      canvas.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          bubbles: true,
          pointerId: 1,
          isPrimary: true,
        }),
      );
    }
  }, []);

  // Mount-only timeline: every timer lives for the component's whole life.
  useEffect(() => {
    if (reduced) return undefined;
    document.documentElement.setAttribute('data-intro', 'hold');
    const skip = (): void => {
      if (phaseRef.current !== 'hold') return; // dead once the intro is underway or over
      phaseRef.current = 'open';
      fireBlast();
      setPhase('open');
    };
    window.addEventListener('keydown', skip);
    const blast = window.setTimeout(fireBlast, CRACKLE_MS);
    const open = window.setTimeout(() => setPhase('open'), CRACKLE_MS + 100);
    const done = window.setTimeout(() => {
      document.documentElement.removeAttribute('data-intro');
      setPhase('done');
      // Retirement point: the gate outlives the intro but these timers never
      // come back, so the listener must go down HERE, not just at unmount.
      phaseRef.current = 'done';
      window.removeEventListener('keydown', skip);
    }, TOTAL_MS);
    return () => {
      document.documentElement.removeAttribute('data-intro');
      window.clearTimeout(blast);
      window.clearTimeout(open);
      window.clearTimeout(done);
      window.removeEventListener('keydown', skip);
    };
  }, [reduced, fireBlast]);

  const skipNow = (): void => {
    if (phaseRef.current !== 'hold') return;
    phaseRef.current = 'open';
    fireBlast();
    setPhase('open');
  };

  return (
    <>
      {phase !== 'done' && (
        <div
          className="forge-intro"
          data-phase={phase}
          role="button"
          aria-label="The Forge ignites — click to skip"
          onClick={skipNow}
        >
          <div className="forge-intro-cover" />
          <div ref={logoWrapRef} className="forge-intro-logo" aria-hidden>
            <LogoBoundary>
              <Suspense fallback={null}>
                <ElectricLogo
                src="/logo.png"
                color="#7ee2a8"
                glowColor="#39d98a"
                scale={0.34}
                intensity={1.35}
                glow={1.25}
                thickness={1.6}
                strands={5}
                bend={0.75}
                crackle={1.8}
                arcs={2}
                speed={3}
                fill={0.35}
                interactive
              />
              </Suspense>
            </LogoBoundary>
          </div>
          <div className="forge-intro-veil" aria-hidden />
          <div className="forge-intro-tag mono">the forge ignites — click to skip</div>
        </div>
      )}
      {children}
    </>
  );
}
