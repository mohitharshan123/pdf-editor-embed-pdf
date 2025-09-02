import { PDFViewerConfig } from '@/components/app';
export declare class EmbedPdfContainer extends HTMLElement {
    private root;
    private _config?;
    constructor();
    connectedCallback(): void;
    set config(newConfig: PDFViewerConfig);
    get config(): PDFViewerConfig | undefined;
    renderViewer(): void;
}
//# sourceMappingURL=container.d.ts.map