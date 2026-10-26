import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis inertial scrolling (decision 16).
 * Hard-disabled under prefers-reduced-motion (U9) — native scroll takes over.
 * The instance is exported through scrollToTop() so programmatic resets
 * (nav: scroll-to-top on route push) go through Lenis's own target — a bare
 * window.scrollTo would fight the inertial loop and snap back.
 */
let active: Lenis | null = null;

/** Reset scroll through the live Lenis instance when present (U9: instant). */
export function scrollToTop(): void {
  if (active) {
    active.scrollTo(0, { immediate: true });
    return;
  }
  window.scrollTo(0, 0);
}

export function useLenis(): void {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
    });
    active = lenis;

    const onChange = (e: MediaQueryListEvent): void => {
      if (e.matches) lenis.destroy();
    };
    mq.addEventListener('change', onChange);

    return () => {
      mq.removeEventListener('change', onChange);
      lenis.destroy();
      active = null;
    };
  }, []);
}
