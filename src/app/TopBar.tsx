import { NavLink } from 'react-router-dom';
import { useSettings } from '../stores/settings';
import { useStreak } from '../features/today/useStreak';

const NAV = [
  { to: '/', label: 'Today' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/arena', label: 'Arena' },
  { to: '/viz', label: 'Viz' },
  { to: '/stats', label: 'Stats' },
  { to: '/library', label: 'Library' },
  { to: '/settings', label: 'Settings' },
  { to: '/diagnostics', label: 'Diagnostics' },
] as const;

/**
 * App shell topbar. U4: 56px on mobile, brand truncates, one row.
 * Streak chip is live as of Phase 3 (reads dread + progress stores).
 */
export function TopBar() {
  const theme = useSettings((s) => s.theme);
  const toggleTheme = useSettings((s) => s.toggleTheme);
  const streak = useStreak();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <img
          src="/hammer-anvil.svg"
          alt="The Forge logo"
          width={34}
          height={34}
          className="forge-logo"
          style={{
            flex: 'none',
            borderRadius: 8,
          }}
        />

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            The Forge
          </div>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            C × DSA · the tracker fights back
          </div>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flex: 'none',
          }}
        >
          <div
            className="mono"
            title={
              streak.bad > 0
                ? `${streak.bad} bad day${streak.bad > 1 ? 's' : ''} in a row — close a day well to break it`
                : `${streak.value} day${streak.value === 1 ? '' : 's'} of consecutive progress`
            }
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: streak.dead
                ? 'var(--danger)'
                : streak.hot
                  ? 'var(--good)'
                  : streak.bad > 0
                    ? 'var(--warn)'
                    : 'var(--muted)',
              border: `1px solid ${streak.dead ? 'var(--danger)' : streak.hot ? 'var(--good)' : 'var(--border)'}`,
              borderRadius: 99,
              padding: '4px 12px',
              whiteSpace: 'nowrap',
            }}
          >
            {streak.bad > 0 && !streak.hot ? `☠ ${streak.bad}` : `🔥 ${streak.value}`}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'terminal' ? 'Blueprint' : 'Terminal'} theme`}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--panel)',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            {theme === 'terminal' ? '☀' : '☾'}
          </button>
        </div>
      </div>

      <nav
        aria-label="Primary"
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            style={({ isActive }) => ({
              padding: '7px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: isActive ? 'var(--text)' : 'var(--muted)',
              borderBottom: isActive ? '2px solid var(--p1)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            })}
          >
            {n.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
