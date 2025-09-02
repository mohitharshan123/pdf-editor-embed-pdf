import { VNode, JSX } from 'preact';
type IconProps = JSX.HTMLAttributes<HTMLElement> & {
    icon: string;
    size?: number;
    strokeWidth?: number;
    primaryColor?: string;
    secondaryColor?: string;
    className?: string;
    title?: string;
};
/**
 * Icon component for Preact
 * Renders an icon using the new component-based icon system
 */
export declare function Icon({ icon, title, size, strokeWidth, primaryColor, secondaryColor, className, ...props }: IconProps): VNode | null;
export {};
//# sourceMappingURL=icon.d.ts.map