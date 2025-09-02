import { Rect } from '@embedpdf/models';
import { ScrollCapability } from '@embedpdf/plugin-scroll';
import { ViewportCapability } from '@embedpdf/plugin-viewport';
export type MenuCoords = {
    left: number;
    top: number;
} | null;
/**
 * Decide where to place the menu for a *multi-page* selection.
 *
 * boundingRects ··· one rect per page
 * scrollCap     ··· converts page-space → viewport-space
 * vpCap         ··· live viewport metrics
 * margin        ··· gap between rect and menu
 */
export declare function menuPositionForSelection(boundingRects: {
    page: number;
    rect: Rect;
}[], scrollCap: ScrollCapability, vpCap: ViewportCapability, margin?: number, menuHeight?: number): MenuCoords;
export declare const formatDate: (dateValue?: string | Date) => string;
//# sourceMappingURL=utils.d.ts.map