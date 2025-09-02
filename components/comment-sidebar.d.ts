import { h } from 'preact';
import { SidebarAnnotationEntry, TrackedAnnotation } from '@embedpdf/plugin-annotation';
export interface CommentSidebarProps {
    sidebarAnnotations: Record<number, SidebarAnnotationEntry[]>;
    selectedAnnotation: TrackedAnnotation | null;
}
export declare const commentRender: ({ sidebarAnnotations, selectedAnnotation }: CommentSidebarProps) => h.JSX.Element;
//# sourceMappingURL=comment-sidebar.d.ts.map