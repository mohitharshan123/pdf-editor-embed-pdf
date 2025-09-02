/** @jsxImportSource preact */
import { h, ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from './icon';
import { Button } from './button';

export interface DialogProps {
  /** Controlled visibility — `true` shows, `false` hides */
  open: boolean;
  /** Dialog title */
  title?: string;
  /** Dialog content */
  children: ComponentChildren;
  /** Callback when dialog should close */
  onClose?: () => void;
  /** Optional className for the dialog content */
  className?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Maximum width of the dialog */
  maxWidth?: string;
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  className,
  showCloseButton = true,
  maxWidth = '32rem',
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose?.();
    }
  };

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 md:flex md:items-center md:justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className={`relative flex h-full w-full flex-col bg-white md:h-auto md:w-[28rem] md:max-w-[90vw] md:rounded-lg md:border md:border-gray-200 md:shadow-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {showCloseButton && (
              <Button onClick={onClose} className="p-1 hover:bg-gray-100">
                <Icon icon="x" className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 md:max-h-[80vh] md:flex-none">
          {children}
        </div>
      </div>
    </div>
  );
}
