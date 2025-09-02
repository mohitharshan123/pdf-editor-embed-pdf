import { CommandMenuProps, ComponentRenderFunction, DividerComponent, FloatingComponentProps, GroupedItemsProps, HeaderProps, IconButtonProps, PanelProps, SelectButtonProps, TabButtonProps } from '@embedpdf/plugin-ui';
import { PdfDocumentObject, Rotation, SearchResult } from '@embedpdf/models';
import { MatchFlag } from '@embedpdf/models';
export declare const iconButtonRenderer: ComponentRenderFunction<IconButtonProps>;
export declare const tabButtonRenderer: ComponentRenderFunction<TabButtonProps>;
export declare const dividerRenderer: ComponentRenderFunction<DividerComponent>;
export declare const groupedItemsRenderer: ComponentRenderFunction<GroupedItemsProps>;
export declare const headerRenderer: ComponentRenderFunction<HeaderProps>;
export interface LeftPanelMainProps {
    visibleChild: string;
    tabsCommandId: string;
}
export declare const leftPanelMainRenderer: ComponentRenderFunction<LeftPanelMainProps>;
export declare const panelRenderer: ComponentRenderFunction<PanelProps & {
    tabsCommandId?: string;
}>;
interface SearchRendererProps {
    flags: MatchFlag[];
    results: SearchResult[];
    total: number;
    activeResultIndex: number;
    active: boolean;
    query: string;
    loading: boolean;
}
export declare const searchRenderer: ComponentRenderFunction<SearchRendererProps>;
export interface ZoomRendererProps {
    zoomLevel: number;
    commandZoomIn: string;
    commandZoomOut: string;
    commandZoomMenu: string;
    zoomMenuActive: boolean;
}
export declare const zoomRenderer: ComponentRenderFunction<ZoomRendererProps>;
interface TextSelectionMenuProps extends FloatingComponentProps {
    open: boolean;
    scale?: number;
    rotation?: Rotation;
}
export declare const textSelectionMenuRenderer: ComponentRenderFunction<TextSelectionMenuProps>;
export declare const pageControlsContainerRenderer: ComponentRenderFunction<FloatingComponentProps>;
export interface PageControlsProps {
    currentPage: number;
    pageCount: number;
    nextPageCommandId: string;
    previousPageCommandId: string;
}
export declare const pageControlsRenderer: ComponentRenderFunction<PageControlsProps>;
export declare const commandMenuRenderer: ComponentRenderFunction<CommandMenuProps>;
export interface ThumbnailsRenderProps {
    currentPage: number;
}
export declare const thumbnailsRender: ComponentRenderFunction<ThumbnailsRenderProps>;
interface OutlineRenderProps {
    document: PdfDocumentObject;
}
export declare const outlineRenderer: ComponentRenderFunction<OutlineRenderProps>;
interface AttachmentsRenderProps {
    document: PdfDocumentObject;
}
export declare const attachmentsRenderer: ComponentRenderFunction<AttachmentsRenderProps>;
export declare const selectButtonRenderer: ComponentRenderFunction<SelectButtonProps>;
export interface PrintModalProps {
    open: boolean;
}
export declare const printModalRenderer: ComponentRenderFunction<PrintModalProps>;
export {};
//# sourceMappingURL=renderers.d.ts.map