import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleId?: string;
  descId?: string;
  children: React.ReactNode;
  maxWidth?: string;
  role?: 'dialog' | 'alertdialog';
}

export function Modal({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  descId,
  children,
  maxWidth = 'max-w-[500px]',
  role = 'dialog',
}: ModalProps) {
  const overlayRef  = useRef<HTMLDivElement>(null);
  const closeRef    = useRef<HTMLButtonElement>(null);
  const previousRef = useRef<HTMLElement | null>(null);

  /* Focus trap + Escape key */
  useEffect(() => {
    if (!isOpen) return;

    previousRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const modal = overlayRef.current;
      if (!modal) return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={overlayRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`relative w-full ${maxWidth} rounded-[16px] p-8 focus:outline-none`}
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-xl)' }}
        tabIndex={-1}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-4 right-4 text-[rgba(248,250,252,0.5)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-2 rounded focus-visible:outline-[#22C55E]"
          aria-label="Close modal"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2
          id={titleId}
          className="font-code text-xl font-semibold text-[#F8FAFC] mb-2 pr-8"
        >
          {title}
        </h2>

        {children}
      </div>
    </div>
  );
}
