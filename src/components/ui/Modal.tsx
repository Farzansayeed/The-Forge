import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  width?: number;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Base modal — U8 from day one: focus trap, Esc to close,
 * focus restored to the trigger on close.
 *
 * All four call sites pass inline `onClose` arrows whose identity changes on
 * every parent render, so the trap effect must not list `onClose` as a
 * dependency — that used to tear down + reinstall the keydown listener and
 * re-run focus juggling each time. The callback is read through a ref at
 * event time; scrim and dialog are one conditional subtree and unmount
 * together, always.
 */
export function Modal({ open, onClose, label, children, width = 440 }: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const box = boxRef.current;
    const focusables = box?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables?.[0] ?? box)?.focus();

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--scrim)',
        padding: 20,
      }}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={{
          width: `min(${width}px, 100%)`,
          maxHeight: '86vh',
          overflow: 'auto',
          background: 'var(--panel)',
          border: '1px solid var(--border-strong)',
          borderRadius: 16,
          padding: 24,
          boxShadow: 'var(--shadow-3)',
          outline: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
