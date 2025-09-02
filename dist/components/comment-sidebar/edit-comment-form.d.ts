import { h } from 'preact';
interface EditCommentFormProps {
    initialText: string;
    onSave: (newText: string) => void;
    onCancel: () => void;
    autoFocus?: boolean;
}
export declare const EditCommentForm: ({ initialText, onSave, onCancel, autoFocus, }: EditCommentFormProps) => h.JSX.Element;
export {};
//# sourceMappingURL=edit-comment-form.d.ts.map