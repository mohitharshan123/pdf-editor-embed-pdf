import { PdfAnnotationSubtype, PdfAnnotationObject } from '@embedpdf/models';
import { SidebarPropsBase } from './common';
type SidebarComponent<S extends PdfAnnotationSubtype> = (p: SidebarPropsBase<Extract<PdfAnnotationObject, {
    type: S;
}>>) => JSX.Element | null;
interface SidebarEntry<S extends PdfAnnotationSubtype> {
    component: SidebarComponent<S>;
    /** Shown above the sidebar; may depend on the current props */
    title?: string | ((p: SidebarPropsBase<Extract<PdfAnnotationObject, {
        type: S;
    }>>) => string);
}
type SidebarRegistry = Partial<{
    [K in PdfAnnotationSubtype]: SidebarEntry<K>;
}>;
export declare const SIDEbars: SidebarRegistry;
export {};
//# sourceMappingURL=registry.d.ts.map