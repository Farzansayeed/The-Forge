import { useEffect } from 'react';
import { loadData } from '../../lib/storage';
import { dreadLevel } from '../../engines/dread';
import { todayKey } from '../../lib/schema';

/**
 * DreadProvider — mounts once, computes the dread level, and publishes it
 * as `data-dread="0..5"` on <html> (tokens.css does the corruption theming).
 * Also mirrors it on the logo via [data-dread] CSS filters.
 * Re-checks on day-close events and every minute (cheap: one schedule walk).
 */
export function DreadProvider() {
  useEffect(() => {
    const apply = (): void => {
      const d = loadData();
      const today = todayKey();
      const level = dreadLevel(d, today);
      document.documentElement.setAttribute('data-dread', String(level));
    };
    apply();
    window.addEventListener('forge:day-closed', apply);
    window.addEventListener('forge:data-changed', apply);
    const iv = window.setInterval(apply, 60_000);
    return () => {
      window.removeEventListener('forge:day-closed', apply);
      window.removeEventListener('forge:data-changed', apply);
      window.clearInterval(iv);
    };
  }, []);

  return null;
}
