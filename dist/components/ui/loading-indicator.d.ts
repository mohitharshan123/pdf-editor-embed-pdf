import { h } from 'preact';
interface LoadingIndicatorProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}
export declare function LoadingIndicator({ size, className, text, }: LoadingIndicatorProps): h.JSX.Element;
export declare function SimpleSpinner({ size, className, }: Omit<LoadingIndicatorProps, 'text'>): h.JSX.Element;
export declare function LoadingOverlay({ text, className, }: Pick<LoadingIndicatorProps, 'text' | 'className'>): h.JSX.Element;
export {};
//# sourceMappingURL=loading-indicator.d.ts.map