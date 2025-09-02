import { h } from 'preact';
import { PdfAnnotationObject } from '@embedpdf/models';
interface CommentProps {
    annotation: PdfAnnotationObject;
    onSave: (text: string) => void;
    onDelete: () => void;
    isReply?: boolean;
}
export declare const Comment: ({ annotation, onSave, onDelete, isReply }: CommentProps) => h.JSX.Element;
export {};
//# sourceMappingURL=comment.d.ts.map