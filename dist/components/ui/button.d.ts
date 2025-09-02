import { h, ComponentChildren, Ref, JSX } from 'preact';
type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    id?: string;
    children: ComponentChildren;
    onClick?: h.JSX.MouseEventHandler<HTMLButtonElement> | undefined;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    tooltip?: string;
    ref?: Ref<HTMLButtonElement>;
};
export declare function Button({ id, children, onClick, active, disabled, className, tooltip, ref, ...props }: ButtonProps): h.JSX.Element;
export {};
//# sourceMappingURL=button.d.ts.map