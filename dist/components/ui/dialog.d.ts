/** @jsxImportSource preact */
import { h, ComponentChildren } from 'preact';
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
export declare function Dialog({ open, title, children, onClose, className, showCloseButton, maxWidth, }: DialogProps): h.JSX.Element | null;
//# sourceMappingURL=dialog.d.ts.map