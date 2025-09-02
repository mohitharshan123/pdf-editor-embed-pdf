import { EmbedPdfContainer } from './web-components/container';
import { PDFViewerConfig, PluginConfigs, ScrollStrategy, ZoomMode, SpreadMode, Rotation } from './components/app';
type ContainerConfig = PDFViewerConfig & {
    type: 'container';
    target: Element;
};
declare function initContainer(config: ContainerConfig): EmbedPdfContainer;
export type ReturnContainerType = ReturnType<typeof initContainer>;
export type { PluginConfigs, ScrollStrategy, ZoomMode, SpreadMode, Rotation };
export type { AnnotationPluginConfig } from '@embedpdf/plugin-annotation';
declare const _default: {
    init: (config: ContainerConfig) => ReturnType<typeof initContainer> | ReturnContainerType | undefined;
};
export default _default;
//# sourceMappingURL=embedpdf.d.ts.map