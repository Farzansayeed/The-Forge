import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/ui/Modal';
import { STAGES, PHASES } from '../data/curriculum';
import { QUIZ_SETS } from '../data/quizzes';
import { useSettings } from '../stores/settings';

/**
 * CommandPalette (Phase 7) — fuzzy-filter across pages, stages, quiz sets, and
 * quick actions. Keyboard-first: ↑↓ move, Enter run, Esc close (the Modal owns
 * focus trapping, U8). The Ctrl+K / ⌘K hotkey lives in App, which mounts this
 * component only while open — code-split so the quiz registry behind it never
 * lands in the entry chunk.
 */

interface Command {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  run: () => void;
}

function score(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t.includes(q)) return 3 - Math.min(2, t.indexOf(q) / t.length);
  // subsequence match (fuzzy-lite)
  let i = 0;
  for (const ch of t) if (ch === q[i]) i += 1;
  return i === q.length ? 1 : 0;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement>(null);

  /* The Ctrl+K hotkey lives in App (eager); this component is code-split and
   * mounted only while open, so importing the full quiz registry here never
   * touches the entry chunk. */
  const commands = useMemo<Command[]>(() => {
    const nav = (path: string) => () => {
      navigate(path);
      onClose();
    };
    const cmds: Command[] = [
      { id: 'nav.today', label: 'Go to Today', hint: 'page', keywords: 'home daily stack', run: nav('/') },
      { id: 'nav.roadmap', label: 'Go to Roadmap', hint: 'page', keywords: 'journey map stages', run: nav('/roadmap') },
      { id: 'nav.arena', label: 'Go to Arena', hint: 'page', keywords: 'quiz boss gate torture', run: nav('/arena') },
      { id: 'nav.stats', label: 'Go to Stats', hint: 'page', keywords: 'heatmap ledger streaks', run: nav('/stats') },
      { id: 'nav.library', label: 'Go to Library', hint: 'page', keywords: 'resources books canon', run: nav('/library') },
      { id: 'nav.viz', label: 'Go to Viz Lab', hint: 'page', keywords: 'visualization python tutor', run: nav('/viz') },
      { id: 'nav.settings', label: 'Go to Settings', hint: 'page', keywords: 'dial bedtime export', run: nav('/settings') },
      {
        id: 'act.toggle-theme',
        label: 'Toggle theme',
        hint: 'action',
        keywords: 'dark light terminal blueprint',
        // Through the store, never a hand-rolled attribute flip — the store
        // persists the choice to cdr-v3, which a raw setAttribute would lose
        // on the next reload.
        run: () => {
          useSettings.getState().toggleTheme();
          onClose();
        },
      },
    ];
    for (const s of STAGES) {
      cmds.push({
        id: `stage.${s.id}`,
        label: `${s.id.toUpperCase()} — ${s.title}`,
        hint: `stage · P${PHASES.find((p) => p.id === s.phase)?.num ?? 0}`,
        keywords: `${s.title} ${s.goal}`,
        run: nav(`/roadmap?stage=${s.id}`),
      });
    }
    for (const set of Object.values(QUIZ_SETS)) {
      if (set.id === 'q.probe') continue;
      cmds.push({
        id: `quiz.${set.id}`,
        label: set.title,
        hint: set.kind === 'boss' ? 'boss exam' : 'torture test',
        keywords: `quiz ${set.id}`,
        run: nav('/arena'),
      });
    }
    return cmds;
  }, [navigate]);

  const results = useMemo(() => {
    const scored = commands
      .map((c) => ({ c, s: Math.max(score(query, c.label), score(query, c.keywords) * 0.8) }))
      .filter((x) => x.s > 0);
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, 9).map((x) => x.c);
  }, [commands, query]);

  useEffect(() => setIdx(0), [query]);

  const runIdx = (i: number): void => {
    const c = results[i];
    if (c) c.run();
  };

  return (
    <Modal open onClose={onClose} label="Command palette" width={520}>
      <div
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIdx((i) => Math.min(results.length - 1, i + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIdx((i) => Math.max(0, i - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            runIdx(idx);
          }
        }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command — pages, stages, quizzes, actions…"
          aria-label="Command input"
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            border: '1px solid var(--border-strong)',
            background: 'var(--panel2)',
            color: 'var(--text)',
            font: 'inherit',
            fontSize: 14,
          }}
        />
        <ul ref={listRef} role="listbox" aria-label="Commands" style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 4 }}>
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === idx}
                onMouseEnter={() => setIdx(i)}
                onClick={() => runIdx(i)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 13px',
                  borderRadius: 9,
                  border: '1px solid transparent',
                  background: i === idx ? 'var(--panel2)' : 'transparent',
                  borderColor: i === idx ? 'var(--border-strong)' : 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 13.5,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                }}
              >
                <span style={{ flex: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.label}
                </span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', flex: 'none' }}>
                  {c.hint}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li style={{ color: 'var(--faint)', fontSize: 13, padding: '10px 13px' }}>No matches — the palette only knows what exists.</li>
          )}
        </ul>
        <p className="mono" style={{ marginTop: 12, fontSize: 10.5, color: 'var(--faint)', letterSpacing: 1 }}>
          ↑↓ SELECT · ENTER RUN · ESC CLOSE
        </p>
      </div>
    </Modal>
  );
}
