'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Overlay({
  title,
  children,
  close,
  drawer = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`overlay ${drawer ? 'drawer' : 'modal'}`}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose.current();
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') return;
        const items = e.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href],textarea:not([disabled])',
        );
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="overlay-content">
        <header className="overlay-heading">
          <h2 id="dialog-title">{title}</h2>
          <button
            className="icon-btn"
            autoFocus
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={22} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
