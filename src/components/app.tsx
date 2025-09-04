import { h, Fragment } from 'preact';
import styles from '../styles/index.css';
import { EmbedPDF } from '@embedpdf/core/preact';
import { createPluginRegistration } from '@embedpdf/core';
import { usePdfiumEngine } from '@embedpdf/engines/preact';
import {
  AllLogger,
  ConsoleLogger,
  ignore,
  PdfAnnotationSubtype,
  PdfBlendMode,
  PerfLogger,
  Rotation,
  uuidV4,
} from '@embedpdf/models';
import {
  Viewport,
  VIEWPORT_PLUGIN_ID,
  ViewportPluginConfig,
  ViewportPluginPackage,
  ViewportState,
} from '@embedpdf/plugin-viewport/preact';
import {
  Scroller,
  SCROLL_PLUGIN_ID,
  ScrollPlugin,
  ScrollPluginConfig,
  ScrollPluginPackage,
  ScrollState,
  ScrollStrategy,
} from '@embedpdf/plugin-scroll/preact';
import {
  SPREAD_PLUGIN_ID,
  SpreadMode,
  SpreadPlugin,
  SpreadPluginConfig,
  SpreadPluginPackage,
  SpreadState,
} from '@embedpdf/plugin-spread/preact';
import {
  LOADER_PLUGIN_ID,
  LoaderPlugin,
  LoaderPluginPackage,
} from '@embedpdf/plugin-loader/preact';
import {
  PluginUIProvider,
  MenuItem,
  defineComponent,
  GlobalStoreState,
  UIComponentType,
  UIPlugin,
  UIPluginConfig,
  UIPluginPackage,
  isActive,
  UI_PLUGIN_ID,
  isDisabled,
  getIconProps,
} from '@embedpdf/plugin-ui/preact';
import {
  attachmentsRenderer,
  commandMenuRenderer,
  dividerRenderer,
  groupedItemsRenderer,
  headerRenderer,
  iconButtonRenderer,
  leftPanelMainRenderer,
  LeftPanelMainProps,
  outlineRenderer,
  pageControlsContainerRenderer,
  PageControlsProps,
  pageControlsRenderer,
  panelRenderer,
  searchRenderer,
  selectButtonRenderer,
  tabButtonRenderer,
  textSelectionMenuRenderer,
  thumbnailsRender,
  zoomRenderer,
  ZoomRendererProps,
  printModalRenderer,
} from './renderers';
import { leftPanelAnnotationStyleRenderer } from './annotation-sidebar';
import {
  PinchWrapper,
  MarqueeZoom,
  ZOOM_PLUGIN_ID,
  ZoomMode,
  ZoomPlugin,
  ZoomPluginConfig,
  ZoomPluginPackage,
  ZoomState,
} from '@embedpdf/plugin-zoom/preact';
import { RenderLayer, RenderPluginPackage } from '@embedpdf/plugin-render/preact';
import {
  Rotate,
  ROTATE_PLUGIN_ID,
  RotatePlugin,
  RotatePluginConfig,
  RotatePluginPackage,
} from '@embedpdf/plugin-rotate/preact';
import {
  SearchLayer,
  SEARCH_PLUGIN_ID,
  SearchPluginPackage,
  SearchState,
} from '@embedpdf/plugin-search/preact';
import {
  SelectionLayer,
  SELECTION_PLUGIN_ID,
  SelectionPlugin,
  SelectionPluginPackage,
  SelectionState,
} from '@embedpdf/plugin-selection/preact';
import {
  TilingLayer,
  TilingPluginConfig,
  TilingPluginPackage,
} from '@embedpdf/plugin-tiling/preact';
import { ThumbnailPluginConfig, ThumbnailPluginPackage } from '@embedpdf/plugin-thumbnail/preact';
import {
  AnnotationLayer,
  ANNOTATION_PLUGIN_ID,
  AnnotationPlugin,
  AnnotationPluginConfig,
  AnnotationPluginPackage,
  AnnotationState,
  getSelectedAnnotation,
  getSidebarAnnotationsWithRepliesGroupedByPage,
  getToolDefaultsBySubtypeAndIntent,
  makeVariantKey,
} from '@embedpdf/plugin-annotation/preact';
import { LoadingIndicator } from './ui/loading-indicator';
import { PrintPluginConfig, PrintPluginPackage } from '@embedpdf/plugin-print/preact';
import {
  FULLSCREEN_PLUGIN_ID,
  FullscreenPlugin,
  FullscreenPluginPackage,
  FullscreenState,
} from '@embedpdf/plugin-fullscreen/preact';
import { BookmarkPluginPackage } from '@embedpdf/plugin-bookmark/preact';
import {
  EXPORT_PLUGIN_ID,
  ExportPlugin,
  ExportPluginPackage,
} from '@embedpdf/plugin-export/preact';
import {
  GlobalPointerProvider,
  PagePointerProvider,
  INTERACTION_MANAGER_PLUGIN_ID,
  InteractionManagerPlugin,
  InteractionManagerPluginPackage,
  InteractionManagerState,
} from '@embedpdf/plugin-interaction-manager/preact';
import { PanPluginPackage } from '@embedpdf/plugin-pan/preact';
import {
  MarqueeCapture,
  CAPTURE_PLUGIN_ID,
  CapturePlugin,
  CapturePluginPackage,
} from '@embedpdf/plugin-capture/preact';
import {
  HISTORY_PLUGIN_ID,
  HistoryPlugin,
  HistoryPluginPackage,
  HistoryState,
} from '@embedpdf/plugin-history/preact';
import { AttachmentPluginPackage } from '@embedpdf/plugin-attachment/preact';
import { Capture } from './capture';
import { HintLayer } from './hint-layer';
import { AnnotationMenu } from './annotation-menu';

export { ScrollStrategy, ZoomMode, SpreadMode, Rotation };

// **Enhanced Configuration Interface**
export interface CustomButtonConfig {
  enabled?: boolean;
  label?: string;
  icon?: string;
  callback?: (file: ArrayBuffer) => void;
}

export interface PluginConfigs {
  viewport?: ViewportPluginConfig;
  scroll?: ScrollPluginConfig;
  zoom?: ZoomPluginConfig;
  spread?: SpreadPluginConfig;
  rotate?: RotatePluginConfig;
  tiling?: TilingPluginConfig;
  thumbnail?: ThumbnailPluginConfig;
  annotation?: AnnotationPluginConfig;
  customButton?: CustomButtonConfig;
}

export interface PDFViewerConfig {
  src: string;
  worker?: boolean;
  wasmUrl?: string;
  plugins?: PluginConfigs;
  log?: boolean;
}

// **Default Plugin Configurations**
const DEFAULT_PLUGIN_CONFIGS: Required<PluginConfigs> = {
  viewport: {
    viewportGap: 10,
  },
  scroll: {
    strategy: ScrollStrategy.Vertical,
  },
  zoom: {
    defaultZoomLevel: ZoomMode.FitPage,
  },
  spread: {
    defaultSpreadMode: SpreadMode.None,
  },
  rotate: {
    defaultRotation: Rotation.Degree0,
  },
  tiling: {
    tileSize: 768,
    overlapPx: 2.5,
    extraRings: 0,
  },
  thumbnail: {
    width: 150,
    gap: 10,
    buffer: 3,
    labelHeight: 30,
  },
  annotation: {
    enabled: true,
  },
  customButton: {
    enabled: false,
    label: 'Custom Action',
    icon: 'save',
    callback: (file: ArrayBuffer) => { },
  },
};

// **Utility function to merge configurations**
function mergePluginConfigs(userConfigs: PluginConfigs = {}): Required<PluginConfigs> {
  return {
    viewport: { ...DEFAULT_PLUGIN_CONFIGS.viewport, ...userConfigs.viewport },
    scroll: { ...DEFAULT_PLUGIN_CONFIGS.scroll, ...userConfigs.scroll },
    zoom: { ...DEFAULT_PLUGIN_CONFIGS.zoom, ...userConfigs.zoom },
    spread: { ...DEFAULT_PLUGIN_CONFIGS.spread, ...userConfigs.spread },
    rotate: { ...DEFAULT_PLUGIN_CONFIGS.rotate, ...userConfigs.rotate },
    tiling: { ...DEFAULT_PLUGIN_CONFIGS.tiling, ...userConfigs.tiling },
    thumbnail: { ...DEFAULT_PLUGIN_CONFIGS.thumbnail, ...userConfigs.thumbnail },
    annotation: { ...DEFAULT_PLUGIN_CONFIGS.annotation, ...userConfigs.annotation },
    customButton: { ...DEFAULT_PLUGIN_CONFIGS.customButton, ...userConfigs.customButton },
  };
}

// **Props for the PDFViewer Component**
interface PDFViewerProps {
  config: PDFViewerConfig;
}

type State = GlobalStoreState<{
  [ZOOM_PLUGIN_ID]: ZoomState;
  [VIEWPORT_PLUGIN_ID]: ViewportState;
  [SCROLL_PLUGIN_ID]: ScrollState;
  [SPREAD_PLUGIN_ID]: SpreadState;
  [SEARCH_PLUGIN_ID]: SearchState;
  [SELECTION_PLUGIN_ID]: SelectionState;
  [ANNOTATION_PLUGIN_ID]: AnnotationState;
  [FULLSCREEN_PLUGIN_ID]: FullscreenState;
  [INTERACTION_MANAGER_PLUGIN_ID]: InteractionManagerState;
  [HISTORY_PLUGIN_ID]: HistoryState;
}>;

// Store the current plugin configs for use in menu items
let currentPluginConfigs: Required<PluginConfigs> | null = null;

// Helper function to get custom button config safely
const getCustomButtonConfig = () => currentPluginConfigs?.customButton;

export const menuItems: Record<string, MenuItem<State>> = {
  menuCtr: {
    id: 'menuCtr',
    icon: 'menu',
    label: 'Menu',
    //shortcut: 'Shift+M',
    //shortcutLabel: 'M',
    type: 'menu',
    children: ['download', 'enterFS', 'screenshot'],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'menuCtr',
  },
  download: {
    id: 'download',
    icon: 'download',
    label: 'Download',
    //shortcut: 'Shift+D',
    //shortcutLabel: 'D',
    type: 'action',
    action: (registry) => {
      const exportPlugin = registry.getPlugin<ExportPlugin>(EXPORT_PLUGIN_ID)?.provides();
      if (exportPlugin) {
        exportPlugin.download();
      }
    },
  },
  enterFS: {
    id: 'enterFS',
    icon: (storeState) => {
      const fullscreen = storeState.plugins.fullscreen.isFullscreen
        ? 'fullscreenExit'
        : 'fullscreen';
      return fullscreen;
    },
    label: (storeState) => {
      const fullscreen = storeState.plugins.fullscreen.isFullscreen
        ? 'Exit full screen'
        : 'Enter full screen';
      return fullscreen;
    },
    //shortcut: 'Shift+F',
    //shortcutLabel: 'F',
    type: 'action',
    action: (registry) => {
      const fullscreen = registry.getPlugin<FullscreenPlugin>(FULLSCREEN_PLUGIN_ID)?.provides();
      if (fullscreen) {
        if (fullscreen.isFullscreen()) {
          fullscreen.exitFullscreen();
        } else {
          fullscreen.enableFullscreen();
        }
      }
    },
  },
  screenshot: {
    id: 'screenshot',
    icon: 'screenshot',
    label: 'Screenshot',
    type: 'action',
    action: (registry) => {
      const capture = registry.getPlugin<CapturePlugin>(CAPTURE_PLUGIN_ID)?.provides();
      if (!capture) return;

      if (capture.isMarqueeCaptureActive()) {
        capture.disableMarqueeCapture();
      } else {
        capture.enableMarqueeCapture();
      }
    },
    active: (storeState) =>
      storeState.plugins[INTERACTION_MANAGER_PLUGIN_ID].activeMode === 'marqueeCapture',
  },
  save: {
    id: 'save',
    icon: 'save',
    label: 'Save',
    //shortcut: 'Shift+S',
    //shortcutLabel: 'S',
    type: 'action',
    action: () => {
      console.log('save');
    },
  },
  print: {
    id: 'print',
    icon: 'print',
    label: 'Print',
    //shortcut: 'Shift+P',
    //shortcutLabel: 'P',
    type: 'action',
    action: (registry, state) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();
      if (ui) {
        ui.updateComponentState({
          componentType: 'floating',
          componentId: 'printModal',
          patch: {
            open: true,
          },
        });
      }
    },
  },
  settings: {
    id: 'settings',
    icon: 'settings',
    label: 'Settings',
    //shortcut: 'Shift+E',
    //shortcutLabel: 'E',
    dividerBefore: true,
    type: 'action',
    action: () => {
      console.log('settings');
    },
  },
  /* --- View controls menu --- */
  viewCtr: {
    id: 'viewCtr',
    icon: 'viewSettings',
    label: 'View controls',
    //shortcut: 'Shift+V',
    //shortcutLabel: 'V',
    type: 'menu',
    children: ['pageOrientation', 'scrollLayout', 'pageLayout', 'enterFS'],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'viewCtr',
  },
  pageOrientation: {
    id: 'pageOrientation',
    label: 'Page orientation',
    type: 'group',
    children: ['rotateClockwise', 'rotateCounterClockwise'],
  },
  rotateClockwise: {
    id: 'rotateClockwise',
    label: 'Rotate clockwise',
    icon: 'rotateClockwise',
    type: 'action',
    action: (registry) => {
      const rotate = registry.getPlugin<RotatePlugin>(ROTATE_PLUGIN_ID)?.provides();
      if (rotate) {
        rotate.rotateForward();
      }
    },
  },
  rotateCounterClockwise: {
    id: 'rotateCounterClockwise',
    label: 'Rotate counter clockwise',
    icon: 'rotateCounterClockwise',
    type: 'action',
    action: (registry) => {
      const rotate = registry.getPlugin<RotatePlugin>(ROTATE_PLUGIN_ID)?.provides();
      if (rotate) {
        rotate.rotateBackward();
      }
    },
  },
  scrollLayout: {
    id: 'scrollLayout',
    label: 'Scroll layout',
    type: 'group',
    children: ['vertical', 'horizontal'],
  },
  vertical: {
    id: 'vertical',
    label: 'Vertical',
    icon: 'vertical',
    type: 'action',
    active: (storeState) => storeState.plugins.scroll.strategy === ScrollStrategy.Vertical,
    action: (registry) => {
      const scroll = registry.getPlugin<ScrollPlugin>(SCROLL_PLUGIN_ID)?.provides();
      if (scroll) {
        scroll.setScrollStrategy(ScrollStrategy.Vertical);
      }
    },
  },
  horizontal: {
    id: 'horizontal',
    label: 'Horizontal',
    icon: 'horizontal',
    type: 'action',
    active: (storeState) => storeState.plugins.scroll.strategy === ScrollStrategy.Horizontal,
    action: (registry) => {
      const scroll = registry.getPlugin<ScrollPlugin>(SCROLL_PLUGIN_ID)?.provides();
      if (scroll) {
        scroll.setScrollStrategy(ScrollStrategy.Horizontal);
      }
    },
  },
  pageLayout: {
    id: 'pageLayout',
    label: 'Page layout',
    type: 'group',
    children: ['singlePage', 'doublePage', 'coverFacingPage'],
  },
  singlePage: {
    id: 'singlePage',
    label: 'Single page',
    icon: 'singlePage',
    type: 'action',
    disabled: (storeState) => storeState.plugins.scroll.strategy === ScrollStrategy.Horizontal,
    active: (storeState) => storeState.plugins.spread.spreadMode === SpreadMode.None,
    action: (registry) => {
      const spread = registry.getPlugin<SpreadPlugin>(SPREAD_PLUGIN_ID)?.provides();
      if (spread) {
        spread.setSpreadMode(SpreadMode.None);
      }
    },
  },
  doublePage: {
    id: 'doublePage',
    label: 'Double page',
    icon: 'book',
    type: 'action',
    disabled: (storeState) => storeState.plugins.scroll.strategy === ScrollStrategy.Horizontal,
    active: (storeState) => storeState.plugins.spread.spreadMode === SpreadMode.Odd,
    action: (registry) => {
      const spread = registry.getPlugin<SpreadPlugin>(SPREAD_PLUGIN_ID)?.provides();
      if (spread) {
        spread.setSpreadMode(SpreadMode.Odd);
      }
    },
  },
  coverFacingPage: {
    id: 'coverFacingPage',
    label: 'Cover facing page',
    icon: 'book2',
    type: 'action',
    disabled: (storeState) => storeState.plugins.scroll.strategy === ScrollStrategy.Horizontal,
    active: (storeState) => storeState.plugins.spread.spreadMode === SpreadMode.Even,
    action: (registry) => {
      const spread = registry.getPlugin<SpreadPlugin>(SPREAD_PLUGIN_ID)?.provides();
      if (spread) {
        spread.setSpreadMode(SpreadMode.Even);
      }
    },
  },
  leftAction: {
    id: 'leftAction',
    label: 'Left action',
    type: 'menu',
    icon: 'dots',
    children: ['viewCtr', 'zoom', 'panMode', 'pointerMode'],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'leftAction' ||
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'zoom' ||
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'changeZoomLevel' ||
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'viewCtr',
  },
  zoom: {
    id: 'zoom',
    icon: 'zoomIn',
    label: 'Zoom Controls',
    //shortcut: 'Shift+Z',
    //shortcutLabel: 'Z',
    type: 'menu',
    children: ['changeZoomLevel', 'zoomIn', 'zoomOut', 'fitToWidth', 'fitToPage', 'zoomInArea'],
    active: (storeState) => storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'zoom',
  },
  zoomInArea: {
    id: 'zoomInArea',
    label: 'Zoom in area',
    icon: 'zoomInArea',
    type: 'action',
    dividerBefore: true,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();
      if (!zoom) return;

      if (zoom.isMarqueeZoomActive()) {
        zoom.disableMarqueeZoom();
      } else {
        zoom.enableMarqueeZoom();
      }
    },
    active: (storeState) =>
      storeState.plugins[INTERACTION_MANAGER_PLUGIN_ID].activeMode === 'marqueeZoom',
  },
  changeZoomLevel: {
    id: 'changeZoomLevel',
    label: (storeState) =>
      `Zoom level (${(storeState.plugins.zoom.currentZoomLevel * 100).toFixed(0)}%)`,
    type: 'menu',
    children: [
      'zoom25',
      'zoom50',
      'zoom100',
      'zoom125',
      'zoom150',
      'zoom200',
      'zoom400',
      'zoom800',
      'zoom1600',
    ],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'changeZoomLevel',
  },
  zoom25: {
    id: 'zoom25',
    label: '25%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 0.25,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(0.25);
      }
    },
  },
  zoom50: {
    id: 'zoom50',
    label: '50%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 0.5,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(0.5);
      }
    },
  },
  zoom100: {
    id: 'zoom100',
    label: '100%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 1,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(1);
      }
    },
  },
  zoom125: {
    id: 'zoom125',
    label: '125%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 1.25,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(1.25);
      }
    },
  },
  zoom150: {
    id: 'zoom150',
    label: '150%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 1.5,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(1.5);
      }
    },
  },
  zoom200: {
    id: 'zoom200',
    label: '200%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 2,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(2);
      }
    },
  },
  zoom400: {
    id: 'zoom400',
    label: '400%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 4,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(4);
      }
    },
  },
  zoom800: {
    id: 'zoom800',
    label: '800%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 8,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(8);
      }
    },
  },
  zoom1600: {
    id: 'zoom1600',
    label: '1600%',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.currentZoomLevel === 16,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(16);
      }
    },
  },
  zoomIn: {
    id: 'zoomIn',
    label: 'Zoom in',
    icon: 'zoomIn',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.zoomIn();
      }
    },
  },
  zoomOut: {
    id: 'zoomOut',
    label: 'Zoom out',
    icon: 'zoomOut',
    type: 'action',
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.zoomOut();
      }
    },
  },
  search: {
    id: 'search',
    label: 'Search',
    icon: 'search',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.togglePanel({ id: 'rightPanel', visibleChild: 'search' });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.panel.rightPanel.open === true &&
      storeState.plugins.ui.panel.rightPanel.visibleChild === 'search',
  },
  customButton: {
    id: 'customButton',
    label: 'Custom Action',
    icon: getCustomButtonConfig()?.icon || 'save',
    type: 'action',
    action: (registry) => {
      const callback = getCustomButtonConfig()?.callback;
      if (callback) {
        const exportPlugin = registry.getPlugin<ExportPlugin>('export')?.provides();
        if (exportPlugin) {
          const task = exportPlugin.saveAsCopy();
          task.wait((buffer) => {
            callback(buffer);
          }, (error) => {
            console.error('Failed to get edited file:', error);
            callback(new ArrayBuffer(0));
          });
        } else {
          console.error('Export plugin not available');
          callback(new ArrayBuffer(0));
        }
      }
    },
    visible: () => getCustomButtonConfig()?.enabled || false,
  },
  fitToWidth: {
    id: 'fitToWidth',
    label: 'Fit to width',
    icon: 'fitToWidth',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.zoomLevel === ZoomMode.FitWidth,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(ZoomMode.FitWidth);
      }
    },
  },
  fitToPage: {
    id: 'fitToPage',
    label: 'Fit to page',
    icon: 'fitToPage',
    type: 'action',
    active: (storeState) => storeState.plugins.zoom.zoomLevel === ZoomMode.FitPage,
    action: (registry) => {
      const zoom = registry.getPlugin<ZoomPlugin>(ZOOM_PLUGIN_ID)?.provides();

      if (zoom) {
        zoom.requestZoom(ZoomMode.FitPage);
      }
    },
  },
  sidebar: {
    id: 'sidebar',
    label: 'Sidebar',
    icon: 'sidebar',
    type: 'action',
    action: (registry, state) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.togglePanel({
          id: 'leftPanel',
          visibleChild: 'leftPanelMain',
          open:
            state.plugins.ui.panel.leftPanel.open === true &&
              state.plugins.ui.panel.leftPanel.visibleChild === 'leftPanelMain'
              ? false
              : true,
        });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.panel.leftPanel.open === true &&
      storeState.plugins.ui.panel.leftPanel.visibleChild === 'leftPanelMain',
  },
  sidebarMenu: {
    id: 'sidebarMenu',
    label: 'Sidebar Menu',
    type: 'menu',
    children: ['annotate', 'thumbnails', 'outline' /*'attachments'*/],
  },
  thumbnails: {
    id: 'thumbnails',
    label: 'Thumbnails',
    icon: 'squares',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.togglePanel({ id: 'leftPanel', visibleChild: 'leftPanelMain', open: true });
        ui.updateComponentState({
          componentType: 'custom',
          componentId: 'leftPanelMain',
          patch: {
            visibleChild: 'thumbnails',
          },
        });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.custom.leftPanelMain.visibleChild === 'thumbnails',
  },
  outline: {
    id: 'outline',
    label: 'Outline',
    icon: 'listTree',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.togglePanel({ id: 'leftPanel', visibleChild: 'leftPanelMain', open: true });
        ui.updateComponentState({
          componentType: 'custom',
          componentId: 'leftPanelMain',
          patch: {
            visibleChild: 'outline',
          },
        });
      }
    },
    active: (storeState) => storeState.plugins.ui.custom.leftPanelMain.visibleChild === 'outline',
  },
  attachments: {
    id: 'attachments',
    label: 'Attachments',
    icon: 'paperclip',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.togglePanel({ id: 'leftPanel', visibleChild: 'leftPanelMain', open: true });
        ui.updateComponentState({
          componentType: 'custom',
          componentId: 'leftPanelMain',
          patch: {
            visibleChild: 'attachments',
          },
        });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.custom.leftPanelMain.visibleChild === 'attachments',
  },
  view: {
    id: 'view',
    label: 'View',
    type: 'action',
    //shortcut: 'Shift+V',
    //shortcutLabel: 'V',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (ui) {
        ui.setHeaderVisible({ id: 'toolsHeader', visible: false });
        annotation?.setActiveVariant(null);
      }
    },
    active: (storeState) => storeState.plugins.ui.header.toolsHeader.visible === false,
  },
  annotate: {
    id: 'annotate',
    label: 'Sign',
    type: 'action',
    //shortcut: 'Shift+A',
    //shortcutLabel: 'A',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.setHeaderVisible({ id: 'toolsHeader', visible: true, visibleChild: 'annotationTools' });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.header.toolsHeader.visible === true &&
      storeState.plugins.ui.header.toolsHeader.visibleChild === 'annotationTools',
  },
  shapes: {
    id: 'shapes',
    label: 'Shapes',
    type: 'action',
    //shortcut: 'Shift+S',
    //shortcutLabel: 'S',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.setHeaderVisible({ id: 'toolsHeader', visible: true, visibleChild: 'shapeTools' });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.header.toolsHeader.visible === true &&
      storeState.plugins.ui.header.toolsHeader.visibleChild === 'shapeTools',
  },
  redaction: {
    id: 'redaction',
    label: 'Redaction',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.setHeaderVisible({ id: 'toolsHeader', visible: true, visibleChild: 'redactionTools' });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.header.toolsHeader.visible === true &&
      storeState.plugins.ui.header.toolsHeader.visibleChild === 'redactionTools',
  },

  form: {
    id: 'form',
    label: 'Form',
    type: 'action',
    action: (registry) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.setHeaderVisible({ id: 'toolsHeader', visible: true, visibleChild: 'formTools' });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.header.toolsHeader.visible === true &&
      storeState.plugins.ui.header.toolsHeader.visibleChild === 'formTools',
  },
  tabOverflow: {
    id: 'tabOverflow',
    label: 'More',
    icon: 'dots',
    type: 'menu',
    children: ['view', 'annotate', 'shapes', 'redaction', 'fillAndSign', 'form'],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'tabOverflow',
  },
  annotationToolOverflow: {
    id: 'annotationToolOverflow',
    label: 'More',
    icon: 'dots',
    type: 'menu',
    children: [
      'highlight',
      'underline',
      'strikethrough',
      'squiggly',
      'freehand',
      'freeText',
      'photo',
    ],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'annotationToolOverflow',
  },
  shapeToolOverflow: {
    id: 'shapeToolOverflow',
    label: 'More',
    icon: 'dots',
    type: 'menu',
    children: ['circle', 'square', 'polygon', 'polyline', 'line', 'lineArrow'],
    active: (storeState) =>
      storeState.plugins.ui.commandMenu.commandMenu.activeCommand === 'shapeToolOverflow',
  },
  nextPage: {
    id: 'nextPage',
    label: 'Next page',
    icon: 'chevronRight',
    shortcut: 'ArrowRight',
    shortcutLabel: 'Arrow Right',
    type: 'action',
    action: (registry) => {
      const scroll = registry.getPlugin<ScrollPlugin>(SCROLL_PLUGIN_ID)?.provides();

      if (scroll) {
        scroll.scrollToNextPage();
      }
    },
  },
  previousPage: {
    id: 'previousPage',
    label: 'Previous page',
    icon: 'chevronLeft',
    type: 'action',
    shortcut: 'ArrowLeft',
    shortcutLabel: 'Arrow Left',
    action: (registry) => {
      const scroll = registry.getPlugin<ScrollPlugin>(SCROLL_PLUGIN_ID)?.provides();

      if (scroll) {
        scroll.scrollToPreviousPage();
      }
    },
  },
  copy: {
    id: 'copy',
    label: 'Copy',
    icon: 'copy',
    type: 'action',
    shortcut: 'Meta+C',
    shortcutLabel: 'Cmd+C',
    action: (registry) => {
      const selection = registry.getPlugin<SelectionPlugin>(SELECTION_PLUGIN_ID)?.provides();
      if (selection) {
        selection.copyToClipboard();
        selection.clear();
      }
    },
  },
  underline: {
    id: 'underline',
    label: 'Underline',
    type: 'action',
    icon: 'underline',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.UNDERLINE,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.UNDERLINE)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.UNDERLINE));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant ===
      makeVariantKey(PdfAnnotationSubtype.UNDERLINE),
  },
  squiggly: {
    id: 'squiggly',
    label: 'Squiggly',
    type: 'action',
    icon: 'squiggly',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.SQUIGGLY,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.SQUIGGLY)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.SQUIGGLY));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.SQUIGGLY),
  },
  strikethrough: {
    id: 'strikethrough',
    label: 'Strikethrough',
    type: 'action',
    icon: 'strikethrough',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.STRIKEOUT,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.STRIKEOUT)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.STRIKEOUT));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant ===
      makeVariantKey(PdfAnnotationSubtype.STRIKEOUT),
  },
  highlight: {
    id: 'highlight',
    label: 'Highlight',
    type: 'action',
    icon: 'highlight',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.HIGHLIGHT,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.HIGHLIGHT)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.HIGHLIGHT));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant ===
      makeVariantKey(PdfAnnotationSubtype.HIGHLIGHT),
  },
  freehand: {
    id: 'freehand',
    label: 'Freehand',
    type: 'action',
    icon: 'pencilMarker',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.INK,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.INK)) {
          annotation.setActiveVariant(null);
        } else {
          annotation.deselectAnnotation();
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.INK));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.INK),
  },
  circle: {
    id: 'circle',
    label: 'Circle',
    type: 'action',
    icon: 'circle',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.CIRCLE,
      ).strokeColor,
      secondaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.CIRCLE,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.CIRCLE)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.CIRCLE));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.CIRCLE),
  },
  square: {
    id: 'square',
    label: 'Square',
    type: 'action',
    icon: 'square',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.SQUARE,
      ).strokeColor,
      secondaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.SQUARE,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.SQUARE)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.SQUARE));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.SQUARE),
  },
  line: {
    id: 'line',
    label: 'Line',
    type: 'action',
    icon: 'line',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.LINE,
      ).strokeColor,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.LINE)) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.LINE));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.LINE),
  },
  lineArrow: {
    id: 'lineArrow',
    label: 'Line Arrow',
    type: 'action',
    icon: 'lineArrow',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.LINE,
      ).strokeColor,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant ===
          makeVariantKey(PdfAnnotationSubtype.LINE, 'LineArrow')
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.LINE, 'LineArrow'));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant ===
      makeVariantKey(PdfAnnotationSubtype.LINE, 'LineArrow'),
  },
  polyline: {
    id: 'polyline',
    label: 'Polyline',
    type: 'action',
    icon: 'zigzag',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.POLYLINE,
      ).strokeColor,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.POLYLINE)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.POLYLINE));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.POLYLINE),
  },
  polygon: {
    id: 'polygon',
    label: 'Polygon',
    type: 'action',
    icon: 'polygon',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.POLYGON,
      ).strokeColor,
      secondaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.POLYGON,
      ).color,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.POLYGON)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.POLYGON));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.POLYGON),
  },
  freeText: {
    id: 'freeText',
    label: 'Free Text',
    type: 'action',
    icon: 'text',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.FREETEXT,
      ).fontColor,
    }),
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (
          state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.FREETEXT)
        ) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.FREETEXT));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.FREETEXT),
  },

  photo: {
    id: 'photo',
    label: 'Stamp',
    type: 'action',
    icon: 'photo',
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.STAMP)) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.STAMP));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.STAMP),
  },
  signature: {
    id: 'signature',
    label: 'Signature',
    type: 'action',
    icon: 'signature',
    action: (registry, state) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        if (state.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.STAMP, 'signature')) {
          annotation.setActiveVariant(null);
        } else {
          annotation.setActiveVariant(makeVariantKey(PdfAnnotationSubtype.STAMP, 'signature'));
        }
      }
    },
    active: (storeState) =>
      storeState.plugins.annotation.activeVariant === makeVariantKey(PdfAnnotationSubtype.STAMP, 'signature'),
  },
  squigglySelection: {
    id: 'squigglySelection',
    label: 'Squiggly Selection',
    type: 'action',
    icon: 'squiggly',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.SQUIGGLY,
      ).color,
    }),
    action: (registry) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      const selection = registry.getPlugin<SelectionPlugin>(SELECTION_PLUGIN_ID)?.provides();
      if (!selection || !annotation) return;

      const defaultSettings = annotation.getToolDefaultsBySubtype(PdfAnnotationSubtype.SQUIGGLY);
      const formattedSelection = selection.getFormattedSelection();
      const selectionText = selection.getSelectedText();

      for (const selection of formattedSelection) {
        selectionText.wait((text) => {
          const annotationId = uuidV4();
          annotation.createAnnotation(selection.pageIndex, {
            id: annotationId,
            created: new Date(),
            type: PdfAnnotationSubtype.SQUIGGLY,
            blendMode: PdfBlendMode.Normal,
            color: defaultSettings.color,
            opacity: defaultSettings.opacity,
            pageIndex: selection.pageIndex,
            rect: selection.rect,
            segmentRects: selection.segmentRects,
            custom: {
              text: text.join('\n'),
            },
          });
          annotation.selectAnnotation(selection.pageIndex, annotationId);
        }, ignore);
      }

      selection.clear();
    },
  },
  underlineSelection: {
    id: 'underlineSelection',
    label: 'Underline Selection',
    type: 'action',
    icon: 'underline',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.UNDERLINE,
      ).color,
    }),
    action: (registry) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      const selection = registry.getPlugin<SelectionPlugin>(SELECTION_PLUGIN_ID)?.provides();
      if (!selection || !annotation) return;

      const defaultSettings = annotation.getToolDefaultsBySubtype(PdfAnnotationSubtype.UNDERLINE);

      const formattedSelection = selection.getFormattedSelection();
      const selectionText = selection.getSelectedText();

      for (const selection of formattedSelection) {
        selectionText.wait((text) => {
          const annotationId = uuidV4();
          annotation.createAnnotation(selection.pageIndex, {
            id: annotationId,
            created: new Date(),
            type: PdfAnnotationSubtype.UNDERLINE,
            blendMode: PdfBlendMode.Normal,
            color: defaultSettings.color,
            opacity: defaultSettings.opacity,
            pageIndex: selection.pageIndex,
            rect: selection.rect,
            segmentRects: selection.segmentRects,
            custom: {
              text: text.join('\n'),
            },
          });
          annotation.selectAnnotation(selection.pageIndex, annotationId);
        }, ignore);
      }

      selection.clear();
    },
  },
  strikethroughSelection: {
    id: 'strikethroughSelection',
    label: 'Strikethrough Selection',
    type: 'action',
    icon: 'strikethrough',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.STRIKEOUT,
      ).color,
    }),
    action: (registry) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      const selection = registry.getPlugin<SelectionPlugin>(SELECTION_PLUGIN_ID)?.provides();
      if (!selection || !annotation) return;

      const defaultSettings = annotation.getToolDefaultsBySubtype(PdfAnnotationSubtype.STRIKEOUT);
      const formattedSelection = selection.getFormattedSelection();
      const selectionText = selection.getSelectedText();

      for (const selection of formattedSelection) {
        selectionText.wait((text) => {
          const annotationId = uuidV4();
          annotation.createAnnotation(selection.pageIndex, {
            id: annotationId,
            created: new Date(),
            type: PdfAnnotationSubtype.STRIKEOUT,
            blendMode: PdfBlendMode.Normal,
            color: defaultSettings.color,
            opacity: defaultSettings.opacity,
            pageIndex: selection.pageIndex,
            rect: selection.rect,
            segmentRects: selection.segmentRects,
            custom: {
              text: text.join('\n'),
            },
          });
          annotation.selectAnnotation(selection.pageIndex, annotationId);
        }, ignore);
      }

      selection.clear();
    },
  },
  highlightSelection: {
    id: 'highlightSelection',
    label: 'Highlight Selection',
    type: 'action',
    icon: 'highlight',
    iconProps: (storeState) => ({
      primaryColor: getToolDefaultsBySubtypeAndIntent(
        storeState.plugins.annotation,
        PdfAnnotationSubtype.HIGHLIGHT,
      ).color,
    }),
    action: (registry) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      const selection = registry.getPlugin<SelectionPlugin>(SELECTION_PLUGIN_ID)?.provides();
      if (!selection || !annotation) return;

      const defaultSettings = annotation.getToolDefaultsBySubtype(PdfAnnotationSubtype.HIGHLIGHT);
      const formattedSelection = selection.getFormattedSelection();
      const selectionText = selection.getSelectedText();

      for (const selection of formattedSelection) {
        selectionText.wait((text) => {
          const annotationId = uuidV4();
          annotation.createAnnotation(selection.pageIndex, {
            id: annotationId,
            created: new Date(),
            type: PdfAnnotationSubtype.HIGHLIGHT,
            blendMode: PdfBlendMode.Multiply,
            color: defaultSettings.color,
            opacity: defaultSettings.opacity,
            pageIndex: selection.pageIndex,
            rect: selection.rect,
            segmentRects: selection.segmentRects,
            custom: {
              text: text.join('\n'),
            },
          });
          annotation.selectAnnotation(selection.pageIndex, annotationId);
        }, ignore);
      }

      selection.clear();
    },
  },
  styleAnnotation: {
    id: 'styleAnnotation',
    label: 'Style',
    type: 'action',
    icon: 'palette',
    action: (registry, state) => {
      const ui = registry.getPlugin<UIPlugin>(UI_PLUGIN_ID)?.provides();

      if (ui) {
        ui.togglePanel({
          id: 'leftPanel',
          visibleChild: 'leftPanelAnnotationStyle',
          open:
            state.plugins.ui.panel.leftPanel.open === true &&
              state.plugins.ui.panel.leftPanel.visibleChild === 'leftPanelAnnotationStyle'
              ? false
              : true,
        });
      }
    },
    active: (storeState) =>
      storeState.plugins.ui.panel.leftPanel.open === true &&
      storeState.plugins.ui.panel.leftPanel.visibleChild === 'leftPanelAnnotationStyle',
  },
  deleteAnnotation: {
    id: 'deleteAnnotation',
    label: 'Delete',
    type: 'action',
    icon: 'trash',
    action: (registry) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (!annotation) return;

      const selectedAnnotation = annotation.getSelectedAnnotation();
      if (!selectedAnnotation) return;

      annotation.deleteAnnotation(
        selectedAnnotation.object.pageIndex,
        selectedAnnotation.object.id,
      );
    },
  },
  panMode: {
    id: 'panMode',
    label: 'Pan',
    type: 'action',
    dividerBefore: true,
    icon: 'hand',
    action: (registry) => {
      const interactionManager = registry
        .getPlugin<InteractionManagerPlugin>(INTERACTION_MANAGER_PLUGIN_ID)
        ?.provides();
      if (!interactionManager) return;

      if (interactionManager.getActiveMode() === 'panMode') {
        interactionManager.activateDefaultMode();
      } else {
        interactionManager.activate('panMode');
      }
    },
    active: (storeState) =>
      storeState.plugins[INTERACTION_MANAGER_PLUGIN_ID].activeMode === 'panMode',
  },
  pointerMode: {
    id: 'pointerMode',
    label: 'Pointer',
    type: 'action',
    icon: 'pointer',
    action: (registry) => {
      const interactionManager = registry
        .getPlugin<InteractionManagerPlugin>(INTERACTION_MANAGER_PLUGIN_ID)
        ?.provides();
      if (!interactionManager) return;

      if (interactionManager.getActiveMode() === 'pointerMode') {
        interactionManager.activateDefaultMode();
      } else {
        interactionManager.activate('pointerMode');
      }
    },
    active: (storeState) =>
      storeState.plugins[INTERACTION_MANAGER_PLUGIN_ID].activeMode === 'pointerMode',
  },
  undo: {
    id: 'undo',
    label: 'Undo',
    type: 'action',
    icon: 'arrowBackUp',
    action: (registry) => {
      const history = registry.getPlugin<HistoryPlugin>(HISTORY_PLUGIN_ID)?.provides();
      if (history) {
        history.undo();
      }
    },
    disabled: (storeState) => {
      const history = storeState.plugins[HISTORY_PLUGIN_ID];
      return !history.global.canUndo;
    },
  },
  redo: {
    id: 'redo',
    label: 'Redo',
    type: 'action',
    icon: 'arrowForwardUp',
    action: (registry) => {
      const history = registry.getPlugin<HistoryPlugin>(HISTORY_PLUGIN_ID)?.provides();
      if (history) {
        history.redo();
      }
    },
    disabled: (storeState) => {
      const history = storeState.plugins[HISTORY_PLUGIN_ID];
      return !history.global.canRedo;
    },
  },
  commitAnnotations: {
    id: 'commitAnnotations',
    label: 'Commit',
    type: 'action',
    icon: 'deviceFloppy',
    action: (registry) => {
      const annotation = registry.getPlugin<AnnotationPlugin>(ANNOTATION_PLUGIN_ID)?.provides();
      if (annotation) {
        annotation.commit();
      }
    },
  },
};

// Define components
export const components: Record<string, UIComponentType<State>> = {
  menuButton: {
    type: 'iconButton',
    id: 'menuButton',
    props: {
      commandId: 'menuCtr',
      active: false,
      label: 'Menu',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.menuCtr, storeState),
    }),
  },
  deleteAnnotationButton: {
    type: 'iconButton',
    id: 'deleteAnnotationButton',
    props: {
      commandId: 'deleteAnnotation',
      active: false,
      label: 'Delete',
    },
  },
  styleButton: {
    type: 'iconButton',
    id: 'styleButton',
    props: {
      commandId: 'styleAnnotation',
      active: false,
      label: 'Style',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.styleAnnotation, storeState),
    }),
  },
  undoButton: {
    type: 'iconButton',
    id: 'undoButton',
    props: {
      commandId: 'undo',
      disabled: false,
      label: 'Undo',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      disabled: isDisabled(menuItems.undo, storeState),
    }),
  },
  redoButton: {
    type: 'iconButton',
    id: 'redoButton',
    props: {
      commandId: 'redo',
      disabled: false,
      label: 'Redo',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      disabled: isDisabled(menuItems.redo, storeState),
    }),
  },
  commitAnnotationsButton: {
    type: 'iconButton',
    id: 'commitAnnotationsButton',
    props: {
      commandId: 'commitAnnotations',
      active: false,
      label: 'Commit',
    },
  },
  copyButton: {
    type: 'iconButton',
    id: 'copyButton',
    props: {
      commandId: 'copy',
      active: false,
      label: 'Copy',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.copy, storeState),
    }),
  },
  panModeButton: {
    type: 'iconButton',
    id: 'panModeButton',
    props: {
      commandId: 'panMode',
      active: false,
      label: 'Pan',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.panMode, storeState),
    }),
  },
  pointerModeButton: {
    type: 'iconButton',
    id: 'pointerModeButton',
    props: {
      commandId: 'pointerMode',
      active: false,
      label: 'Pointer',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.pointerMode, storeState),
    }),
  },
  circleButton: {
    type: 'iconButton',
    id: 'circleButton',
    props: {
      commandId: 'circle',
      active: false,
      label: 'Circle',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.circle, storeState),
      iconProps: getIconProps(menuItems.circle, storeState),
    }),
  },
  freeTextButton: {
    type: 'iconButton',
    id: 'freeTextButton',
    props: {
      commandId: 'freeText',
      active: false,
      label: 'Free Text',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.freeText, storeState),
      iconProps: getIconProps(menuItems.freeText, storeState),
    }),
  },
  squareButton: {
    type: 'iconButton',
    id: 'squareButton',
    props: {
      commandId: 'square',
      active: false,
      label: 'Square',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.square, storeState),
      iconProps: getIconProps(menuItems.square, storeState),
    }),
  },
  polygonButton: {
    type: 'iconButton',
    id: 'polygonButton',
    props: {
      commandId: 'polygon',
      active: false,
      label: 'Polygon',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.polygon, storeState),
      iconProps: getIconProps(menuItems.polygon, storeState),
    }),
  },
  lineButton: {
    type: 'iconButton',
    id: 'lineButton',
    props: {
      commandId: 'line',
      active: false,
      label: 'Line',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.line, storeState),
      iconProps: getIconProps(menuItems.line, storeState),
    }),
  },
  lineArrowButton: {
    type: 'iconButton',
    id: 'lineArrowButton',
    props: {
      commandId: 'lineArrow',
      active: false,
      label: 'Line Arrow',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.lineArrow, storeState),
      iconProps: getIconProps(menuItems.lineArrow, storeState),
    }),
  },
  polylineButton: {
    type: 'iconButton',
    id: 'polylineButton',
    props: {
      commandId: 'polyline',
      active: false,
      label: 'Polyline',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.polyline, storeState),
      iconProps: getIconProps(menuItems.polyline, storeState),
    }),
  },
  underlineButton: {
    type: 'iconButton',
    id: 'underlineButton',
    props: {
      commandId: 'underline',
      active: false,
      label: 'Underline',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.underline, storeState),
      iconProps: getIconProps(menuItems.underline, storeState),
    }),
  },
  squigglyButton: {
    type: 'iconButton',
    id: 'squigglyButton',
    props: {
      commandId: 'squiggly',
      active: false,
      label: 'Squiggly',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.squiggly, storeState),
      iconProps: getIconProps(menuItems.squiggly, storeState),
    }),
  },
  strikethroughButton: {
    type: 'iconButton',
    id: 'strikethroughButton',
    props: {
      commandId: 'strikethrough',
      active: false,
      label: 'Strikethrough',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.strikethrough, storeState),
      iconProps: getIconProps(menuItems.strikethrough, storeState),
    }),
  },
  highlightButton: {
    type: 'iconButton',
    id: 'highlightButton',
    props: {
      commandId: 'highlight',
      active: false,
      label: 'Highlight',
      color: '#ffcd45',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.highlight, storeState),
      iconProps: getIconProps(menuItems.highlight, storeState),
    }),
  },
  freehandButton: {
    type: 'iconButton',
    id: 'freehandButton',
    props: {
      commandId: 'freehand',
      active: false,
      label: 'Freehand',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.freehand, storeState),
      iconProps: getIconProps(menuItems.freehand, storeState),
    }),
  },
  signatureButton: {
    type: 'iconButton',
    id: 'signatureButton',
    props: {
      commandId: 'signature',
      active: false,
      label: 'Signature',
      color: '#000000',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.signature, storeState),
      iconProps: getIconProps(menuItems.signature, storeState),
    }),
  },
  photoButton: {
    type: 'iconButton',
    id: 'photoButton',
    props: {
      commandId: 'photo',
      active: false,
      label: 'Stamp',
      color: '#000000',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.photo, storeState),
      iconProps: getIconProps(menuItems.photo, storeState),
    }),
  },
  highlightSelectionButton: {
    type: 'iconButton',
    id: 'highlightSelectionButton',
    props: {
      commandId: 'highlightSelection',
      color: '#ffcd45',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      iconProps: getIconProps(menuItems.highlightSelection, storeState),
    }),
  },
  underlineSelectionButton: {
    type: 'iconButton',
    id: 'underlineSelectionButton',
    props: {
      commandId: 'underlineSelection',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      iconProps: getIconProps(menuItems.underlineSelection, storeState),
    }),
  },
  strikethroughSelectionButton: {
    type: 'iconButton',
    id: 'strikethroughSelectionButton',
    props: {
      commandId: 'strikethroughSelection',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      iconProps: getIconProps(menuItems.strikethroughSelection, storeState),
    }),
  },
  squigglySelectionButton: {
    type: 'iconButton',
    id: 'squigglySelectionButton',
    props: {
      commandId: 'squigglySelection',
      color: '#e44234',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      iconProps: getIconProps(menuItems.squigglySelection, storeState),
    }),
  },
  searchButton: {
    type: 'iconButton',
    id: 'searchButton',
    props: {
      active: false,
      commandId: 'search',
      label: 'Search',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.search, storeState),
    }),
  },
  customButton: {
    type: 'iconButton',
    id: 'customButton',
    props: {
      active: false,
      commandId: 'customButton',
      label: 'Custom Action',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      visible: getCustomButtonConfig()?.enabled || false,
      label: getCustomButtonConfig()?.label || 'Custom Action',
      iconProps: getIconProps(menuItems.customButton, storeState),
    }),
  },
  filePickerButton: {
    type: 'iconButton',
    id: 'filePickerButton',
    props: {
      label: 'Open File',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbi10YWJsZXItb3V0bGluZSBpY29uLXRhYmxlci1maWxlLWltcG9ydCI+PHBhdGggc3Ryb2tlPSJub25lIiBkPSJNIDAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xNCAzdjRhMSAxIDAgMCAwIDEgMWg0IiAvPjxwYXRoIGQ9Ik01IDEzdi04YTIgMiAwIDAgMSAyIC0yaDdsNSA1djExYTIgMiAwIDAgMSAtMiAyaC01LjVtLTkuNSAtMmg3bS0zIC0zbDMgM2wtMyAzIiAvPjwvc3ZnPg==',
    },
  },
  downloadButton: {
    type: 'iconButton',
    id: 'downloadButton',
    props: {
      label: 'Download',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItZG93bmxvYWQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00IDE3djJhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMiAtMnYtMiIgLz48cGF0aCBkPSJNNyAxMWw1IDVsNSAtNSIgLz48cGF0aCBkPSJNMTIgNGwwIDEyIiAvPjwvc3ZnPg==',
    },
  },
  zoomButton: {
    type: 'iconButton',
    id: 'zoomButton',
    props: {
      commandId: 'zoom',
      label: 'Zoom',
      img: 'data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiAgd2lkdGg9IjI0IiAgaGVpZ2h0PSIyNCIgIHZpZXdCb3g9IjAgMCAyNCAyNCIgIGZpbGw9Im5vbmUiICBzdHJva2U9IiMzNDNhNDAiICBzdHJva2Utd2lkdGg9IjIiICBzdHJva2UtbGluZWNhcD0icm91bmQiICBzdHJva2UtbGluZWpvaW49InJvdW5kIiAgY2xhc3M9Imljb24gaWNvbi10YWJsZXIgaWNvbnMtdGFibGVyLW91dGxpbmUgaWNvbi10YWJsZXItY2lyY2xlLXBsdXMiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zIDEyYTkgOSAwIDEgMCAxOCAwYTkgOSAwIDAgMCAtMTggMCIgLz48cGF0aCBkPSJNOSAxMmg2IiAvPjxwYXRoIGQ9Ik0xMiA5djYiIC8+PC9zdmc+',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active:
        isActive(menuItems.zoom, storeState) || isActive(menuItems.changeZoomLevel, storeState),
    }),
  },
  sidebarButton: {
    type: 'iconButton',
    id: 'sidebarButton',
    props: {
      commandId: 'sidebar',
      label: 'Sidebar',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.sidebar, storeState),
    }),
  },
  divider1: {
    type: 'divider',
    id: 'divider1',
  },
  expandLeftActionsButton: {
    type: 'iconButton',
    id: 'expandLeftActionsButton',
    props: {
      commandId: 'leftAction',
      label: 'Left Panel Actions',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.leftAction, storeState),
    }),
  },
  headerStart: {
    id: 'headerStart',
    type: 'groupedItems',
    slots: [
      { componentId: 'menuButton', priority: 0 },
      { componentId: 'divider1', priority: 1, className: 'flex' },
      { componentId: 'sidebarButton', priority: 2 },
      { componentId: 'expandLeftActionsButton', priority: 3, className: '@min-[400px]:hidden' },
      { componentId: 'viewCtrButton', priority: 4, className: 'hidden @min-[400px]:block' },
      { componentId: 'divider1', priority: 6, className: 'hidden @min-[400px]:flex' },
      {
        componentId: 'zoomButton',
        priority: 7,
        className: 'hidden @min-[400px]:block @min-[600px]:hidden',
      },
      { componentId: 'zoom', priority: 8, className: 'hidden @min-[600px]:block' },
      { componentId: 'divider1', priority: 9, className: 'hidden @min-[600px]:flex' },
      { componentId: 'panModeButton', priority: 10, className: 'hidden @min-[600px]:block' },
      { componentId: 'pointerModeButton', priority: 11, className: 'hidden @min-[600px]:block' },
    ],
    props: {
      gap: 10,
    },
  },
  viewTab: {
    type: 'tabButton',
    id: 'viewTab',
    props: {
      label: 'View',
      commandId: 'view',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.view, storeState),
    }),
  },
  annotateTab: {
    type: 'tabButton',
    id: 'annotateTab',
    props: {
      label: 'Annotate',
      commandId: 'annotate',
      active: true,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.annotate, storeState),
    }),
  },
  shapesTab: {
    type: 'tabButton',
    id: 'shapesTab',
    props: {
      label: 'Shapes',
      commandId: 'shapes',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.shapes, storeState),
    }),
  },

  formTab: {
    type: 'tabButton',
    id: 'formTab',
    props: {
      label: 'Form',
      commandId: 'form',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.form, storeState),
    }),
  },
  tabOverflowButton: {
    type: 'iconButton',
    id: 'tabOverflowButton',
    props: {
      label: 'More',
      commandId: 'tabOverflow',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.tabOverflow, storeState),
    }),
  },
  annotationToolOverflowButton: {
    type: 'iconButton',
    id: 'annotationToolOverflowButton',
    props: {
      label: 'More',
      commandId: 'annotationToolOverflow',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.annotationToolOverflow, storeState),
    }),
  },
  shapeToolOverflowButton: {
    type: 'iconButton',
    id: 'shapeToolOverflowButton',
    props: {
      label: 'More',
      commandId: 'shapeToolOverflow',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      active: isActive(menuItems.shapeToolOverflow, storeState),
    }),
  },
  selectButton: {
    type: 'selectButton',
    id: 'selectButton',
    props: {
      menuCommandId: 'tabOverflow',
      commandIds: ['annotate'],
      activeCommandId: 'annotate',
      active: false,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      activeCommandId:
        ownProps.commandIds.find((commandId) => isActive(menuItems[commandId], storeState)) ??
        ownProps.commandIds[0],
      active: isActive(menuItems.tabOverflow, storeState),
    }),
  },
  headerCenter: {
    id: 'headerCenter',
    type: 'groupedItems',
    slots: [],
    props: {
      gap: 10,
    },
  },
  headerEnd: {
    id: 'headerEnd',
    type: 'groupedItems',
    slots: [
      { componentId: 'customButton', priority: 0 },
      { componentId: 'searchButton', priority: 1 },
    ],
    props: {
      gap: 10,
    },
  },
  pageControls: defineComponent<
    { currentPage: number; pageCount: number },
    PageControlsProps,
    State
  >()({
    id: 'pageControls',
    type: 'custom',
    render: 'pageControls',
    initialState: {
      currentPage: 1,
      pageCount: 1,
    },
    props: (initialState) => ({
      currentPage: initialState.currentPage,
      pageCount: initialState.pageCount,
      nextPageCommandId: 'nextPage',
      previousPageCommandId: 'previousPage',
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      currentPage: storeState.plugins.scroll.currentPage,
      pageCount: storeState.core.document?.pageCount ?? 1,
    }),
  }),
  pageControlsContainer: {
    id: 'pageControlsContainer',
    type: 'floating',
    props: {
      scrollerPosition: 'outside',
    },
    render: 'pageControlsContainer',
    slots: [{ componentId: 'pageControls', priority: 0 }],
  },
  textSelectionMenuButtons: {
    id: 'textSelectionMenuButtons',
    type: 'groupedItems',
    slots: [
      { componentId: 'copyButton', priority: 0 },
      { componentId: 'highlightSelectionButton', priority: 1 },
      { componentId: 'underlineSelectionButton', priority: 2 },
      { componentId: 'strikethroughSelectionButton', priority: 3 },
      { componentId: 'squigglySelectionButton', priority: 4 },
    ],
    props: {
      gap: 10,
    },
  },
  printModal: {
    id: 'printModal',
    type: 'floating',
    render: 'printModal',
    initialState: {
      open: false,
    },
    props: (initialState) => ({
      open: initialState.open,
      scrollerPosition: 'outside',
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.floating.printModal.open,
    }),
  },
  textSelectionMenu: {
    id: 'textSelectionMenu',
    type: 'floating',
    render: 'textSelectionMenu',
    props: {
      open: false,
      scrollerPosition: 'inside',
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      isScolling: storeState.plugins.viewport.isScrolling,
      scale: storeState.core.scale,
      rotation: storeState.core.rotation,
      spread: storeState.plugins[SPREAD_PLUGIN_ID].spreadMode,
      open:
        storeState.plugins[SELECTION_PLUGIN_ID].active &&
        !storeState.plugins[SELECTION_PLUGIN_ID].selecting,
    }),
    slots: [{ componentId: 'textSelectionMenuButtons', priority: 0 }],
    getChildContext: {
      direction: 'horizontal',
    },
  },
  topHeader: {
    type: 'header',
    id: 'topHeader',
    slots: [
      { componentId: 'headerStart', priority: 0 },
      { componentId: 'headerCenter', priority: 1 },
      { componentId: 'headerEnd', priority: 2 },
    ],
    getChildContext: (props) => ({
      direction:
        props.placement === 'top' || props.placement === 'bottom' ? 'horizontal' : 'vertical',
    }),
    props: {
      placement: 'top',
      style: {
        backgroundColor: '#ffffff',
        gap: '10px',
      },
    },
  },
  shapeTools: {
    id: 'shapeTools',
    type: 'groupedItems',
    slots: [
      { componentId: 'circleButton', priority: 6 },
      { componentId: 'squareButton', priority: 7 },
      { componentId: 'polygonButton', priority: 8 },
      { componentId: 'polylineButton', priority: 9 },
      { componentId: 'lineButton', priority: 10, className: 'hidden @min-[500px]:block' },
      { componentId: 'lineArrowButton', priority: 11, className: 'hidden @min-[500px]:block' },
      {
        componentId: 'shapeToolOverflowButton',
        priority: 12,
        className: 'block @min-[500px]:hidden',
      },
      { componentId: 'divider1', priority: 12 },
      { componentId: 'styleButton', priority: 13 },
      { componentId: 'divider1', priority: 14 },
      { componentId: 'undoButton', priority: 15 },
      { componentId: 'redoButton', priority: 16 },
    ],
    props: {
      gap: 10,
    },
  },

  redactionTools: {
    id: 'redactionTools',
    type: 'groupedItems',
    slots: [
      { componentId: 'redactButton', priority: 1 },
      { componentId: 'divider1', priority: 2 },
      { componentId: 'styleButton', priority: 3 },
      { componentId: 'divider1', priority: 4 },
      { componentId: 'undoButton', priority: 5 },
      { componentId: 'redoButton', priority: 6 },
    ],
    props: {
      gap: 10,
    },
  },
  formTools: {
    id: 'formTools',
    type: 'groupedItems',
    slots: [
      { componentId: 'textButton', priority: 1 },
      { componentId: 'checkButton', priority: 2 },
      { componentId: 'radioButton', priority: 3 },
      { componentId: 'dropdownButton', priority: 4 },
      { componentId: 'divider1', priority: 5 },
      { componentId: 'styleButton', priority: 6 },
      { componentId: 'divider1', priority: 7 },
      { componentId: 'undoButton', priority: 8 },
      { componentId: 'redoButton', priority: 9 },
    ],
    props: {
      gap: 10,
    },
  },
  annotationTools: {
    id: 'annotationTools',
    type: 'groupedItems',
    slots: [
      { componentId: 'highlightButton', priority: 1 },
      { componentId: 'underlineButton', priority: 2 },
      { componentId: 'strikethroughButton', priority: 3 },
      { componentId: 'squigglyButton', priority: 4 },
      { componentId: 'freehandButton', priority: 5, className: 'hidden @min-[500px]:block' },
      { componentId: 'freeTextButton', priority: 6, className: 'hidden @min-[500px]:block' },
      { componentId: 'photoButton', priority: 7, className: 'hidden @min-[500px]:block' },
      { componentId: 'signatureButton', priority: 8, className: 'hidden @min-[500px]:block' },
      {
        componentId: 'annotationToolOverflowButton',
        priority: 9,
        className: 'block @min-[500px]:hidden',
      },
      { componentId: 'divider1', priority: 10 },
      { componentId: 'styleButton', priority: 11 },
      { componentId: 'divider1', priority: 12 },
      { componentId: 'undoButton', priority: 13 },
      { componentId: 'redoButton', priority: 14 },
    ],
    props: {
      gap: 10,
    },
  },
  toolsHeader: {
    type: 'header',
    id: 'toolsHeader',
    initialState: {
      visible: true,
      visibleChild: 'annotationTools',
    },
    props: (initialState) => ({
      placement: 'top',
      visible: initialState.visible,
      visibleChild: initialState.visibleChild,
      style: {
        backgroundColor: '#f1f3f5',
        justifyContent: 'center',
      },
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      visible: storeState.plugins.ui.header.toolsHeader.visible,
      visibleChild: storeState.plugins.ui.header.toolsHeader.visibleChild,
    }),
    slots: [
      { componentId: 'annotationTools', priority: 0 },
    ],
    getChildContext: (props) => ({
      direction:
        props.placement === 'top' || props.placement === 'bottom' ? 'horizontal' : 'vertical',
    }),
  },
  leftPanelAnnotationStyle: {
    id: 'leftPanelAnnotationStyle',
    type: 'custom',
    render: 'leftPanelAnnotationStyle',
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      selectedAnnotation: getSelectedAnnotation(storeState.plugins[ANNOTATION_PLUGIN_ID]),
      activeVariant: storeState.plugins[ANNOTATION_PLUGIN_ID].activeVariant,
      colorPresets: storeState.plugins[ANNOTATION_PLUGIN_ID].colorPresets,
      toolDefaults: storeState.plugins[ANNOTATION_PLUGIN_ID].toolDefaults,
    }),
  },
  leftPanelMain: defineComponent<{ visibleChild: string }, LeftPanelMainProps, State>()({
    id: 'leftPanelMain',
    type: 'custom',
    render: 'leftPanelMain',
    initialState: {
      visibleChild: 'annotate',
    },
    props: (initialState) => ({
      visibleChild: initialState.visibleChild,
      tabsCommandId: 'sidebarMenu',
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      visibleChild: storeState.plugins.ui.custom.leftPanelMain.visibleChild,
    }),
    slots: [
      { componentId: 'thumbnails', priority: 0 },
      { componentId: 'outline', priority: 1 },
      { componentId: 'attachments', priority: 2 },
    ],
  }),
  leftPanel: {
    id: 'leftPanel',
    type: 'panel',
    initialState: {
      open: false,
      visibleChild: 'leftPanelMain',
    },
    props: (initialState) => ({
      open: initialState.open,
      visibleChild: initialState.visibleChild,
      location: 'left',
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.panel.leftPanel.open,
      visibleChild: storeState.plugins.ui.panel.leftPanel.visibleChild,
    }),
    slots: [
      { componentId: 'leftPanelMain', priority: 0 },
      { componentId: 'leftPanelAnnotationStyle', priority: 1 },
    ],
  },
  thumbnails: {
    id: 'thumbnails',
    type: 'custom',
    render: 'thumbnails',
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      currentPage: storeState.plugins.scroll.currentPage,
    }),
  },
  outline: {
    id: 'outline',
    type: 'custom',
    render: 'outline',
    props: {
      document: null,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      document: storeState.core.document,
    }),
  },
  attachments: {
    id: 'attachments',
    type: 'custom',
    render: 'attachments',
    props: {
      document: null,
    },
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      document: storeState.core.document,
    }),
  },
  search: {
    id: 'search',
    type: 'custom',
    render: 'search',
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      flags: storeState.plugins.search.flags,
      results: storeState.plugins.search.results,
      total: storeState.plugins.search.total,
      activeResultIndex: storeState.plugins.search.activeResultIndex,
      active: storeState.plugins.search.active,
      query: storeState.plugins.search.query,
      loading: storeState.plugins.search.loading,
    }),
  },
  commandMenu: {
    id: 'commandMenu',
    type: 'commandMenu',
    initialState: {
      open: false,
      activeCommand: null,
      triggerElement: undefined,
      position: undefined,
      flatten: false,
    },
    props: (initialState) => ({
      open: initialState.open,
      activeCommand: initialState.activeCommand,
      triggerElement: initialState.triggerElement,
      position: initialState.position,
      flatten: initialState.flatten,
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.commandMenu.commandMenu.open,
      activeCommand: storeState.plugins.ui.commandMenu.commandMenu.activeCommand,
      triggerElement: storeState.plugins.ui.commandMenu.commandMenu.triggerElement,
      position: storeState.plugins.ui.commandMenu.commandMenu.position,
      flatten: storeState.plugins.ui.commandMenu.commandMenu.flatten,
    }),
  },
  zoom: defineComponent<{ zoomLevel: number }, ZoomRendererProps, State>()({
    id: 'zoom',
    type: 'custom',
    render: 'zoom',
    initialState: {
      zoomLevel: 1,
    },
    props: (initialState) => ({
      zoomLevel: initialState.zoomLevel,
      commandZoomIn: menuItems.zoomIn.id,
      commandZoomOut: menuItems.zoomOut.id,
      commandZoomMenu: menuItems.zoom.id,
      zoomMenuActive: false,
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      zoomLevel: storeState.plugins.zoom.currentZoomLevel,
      zoomMenuActive:
        isActive(menuItems.zoom, storeState) || isActive(menuItems.changeZoomLevel, storeState),
    }),
  }),
  rightPanel: {
    id: 'rightPanel',
    type: 'panel',
    initialState: {
      open: false,
      visibleChild: null,
    },
    props: (initialState) => ({
      open: initialState.open,
      visibleChild: initialState.visibleChild,
      location: 'right',
    }),
    mapStateToProps: (storeState, ownProps) => ({
      ...ownProps,
      open: storeState.plugins.ui.panel.rightPanel.open,
      visibleChild: storeState.plugins.ui.panel.rightPanel.visibleChild,
    }),
    slots: [
      { componentId: 'search', priority: 0 },
    ],
  },
};

// UIPlugin configuration
export const uiConfig: UIPluginConfig = {
  enabled: true,
  components,
  menuItems,
};

const logger = new AllLogger([new ConsoleLogger(), new PerfLogger()]);

export function PDFViewer({ config }: PDFViewerProps) {
  const { engine, isLoading } = usePdfiumEngine({
    ...(config.wasmUrl && { wasmUrl: config.wasmUrl }),
    worker: config.worker,
    logger: config.log ? logger : undefined,
  });

  // **Merge user configurations with defaults**
  const pluginConfigs = mergePluginConfigs(config.plugins);

  // Set the global configs for menu items to access
  currentPluginConfigs = pluginConfigs;

  if (!engine || isLoading)
    return (
      <>
        <style>{styles}</style>
        <div className="flex h-full w-full items-center justify-center">
          <LoadingIndicator size="lg" text="Initializing PDF engine..." />
        </div>
      </>
    );

  return (
    <>
      <style>{styles}</style>
      <EmbedPDF
        logger={config.log ? logger : undefined}
        engine={engine}
        onInitialized={async (registry) => {
          const uiCapability = registry.getPlugin<UIPlugin>('ui')?.provides();

          if (uiCapability) {
            uiCapability.registerComponentRenderer('groupedItems', groupedItemsRenderer);
            uiCapability.registerComponentRenderer('iconButton', iconButtonRenderer);
            uiCapability.registerComponentRenderer('tabButton', tabButtonRenderer);
            uiCapability.registerComponentRenderer('header', headerRenderer);
            uiCapability.registerComponentRenderer('divider', dividerRenderer);
            uiCapability.registerComponentRenderer('panel', panelRenderer);
            uiCapability.registerComponentRenderer('search', searchRenderer);
            uiCapability.registerComponentRenderer('zoom', zoomRenderer);
            uiCapability.registerComponentRenderer(
              'pageControlsContainer',
              pageControlsContainerRenderer,
            );
            uiCapability.registerComponentRenderer('pageControls', pageControlsRenderer);
            uiCapability.registerComponentRenderer('commandMenu', commandMenuRenderer);
            uiCapability.registerComponentRenderer('thumbnails', thumbnailsRender);
            uiCapability.registerComponentRenderer('outline', outlineRenderer);
            uiCapability.registerComponentRenderer('attachments', attachmentsRenderer);
            uiCapability.registerComponentRenderer('selectButton', selectButtonRenderer);
            uiCapability.registerComponentRenderer('textSelectionMenu', textSelectionMenuRenderer);
            uiCapability.registerComponentRenderer('leftPanelMain', leftPanelMainRenderer);
            uiCapability.registerComponentRenderer('printModal', printModalRenderer);
            uiCapability.registerComponentRenderer(
              'leftPanelAnnotationStyle',
              leftPanelAnnotationStyleRenderer,
            );
          }
        }}
        plugins={[
          createPluginRegistration(UIPluginPackage, uiConfig),
          createPluginRegistration(LoaderPluginPackage, {
            loadingOptions: {
              type: 'url',
              pdfFile: {
                id: 'pdf',
                name: 'embedpdf-ebook.pdf',
                url: config.src,
              },
            },
          }),
          createPluginRegistration(ViewportPluginPackage, pluginConfigs.viewport),
          createPluginRegistration(ScrollPluginPackage, pluginConfigs.scroll),
          createPluginRegistration(ZoomPluginPackage, pluginConfigs.zoom),
          createPluginRegistration(SpreadPluginPackage, pluginConfigs.spread),
          createPluginRegistration(RenderPluginPackage),
          createPluginRegistration(RotatePluginPackage, pluginConfigs.rotate),
          createPluginRegistration(SearchPluginPackage),
          createPluginRegistration(SelectionPluginPackage),
          createPluginRegistration(TilingPluginPackage, pluginConfigs.tiling),
          createPluginRegistration(ThumbnailPluginPackage, pluginConfigs.thumbnail),
          createPluginRegistration(AnnotationPluginPackage, pluginConfigs.annotation),
          createPluginRegistration(PrintPluginPackage),
          createPluginRegistration(FullscreenPluginPackage),
          createPluginRegistration(BookmarkPluginPackage),
          createPluginRegistration(ExportPluginPackage),
          createPluginRegistration(InteractionManagerPluginPackage),
          createPluginRegistration(PanPluginPackage),
          createPluginRegistration(CapturePluginPackage, {
            scale: 2,
            imageType: 'image/png',
          }),
          createPluginRegistration(HistoryPluginPackage),
          createPluginRegistration(AttachmentPluginPackage),
        ]}
      >
        {({ pluginsReady }) => (
          <PluginUIProvider>
            {({ headers, panels, floating, commandMenu }) => (
              <>
                <div className="@container relative flex h-full w-full select-none flex-col">
                  {headers.top.length > 0 && <div>{headers.top}</div>}
                  <div className="flex flex-1 flex-row overflow-hidden">
                    <div className="flex flex-col">{headers.left}</div>
                    <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
                      {panels.left.length > 0 && <Fragment>{panels.left}</Fragment>}
                      <div className="relative flex w-full flex-1 overflow-hidden">
                        <GlobalPointerProvider>
                          <Viewport
                            style={{
                              width: '100%',
                              height: '100%',
                              flexGrow: 1,
                              backgroundColor: '#f1f3f5',
                              overflow: 'auto',
                            }}
                          >
                            {!pluginsReady && (
                              <div className="flex h-full w-full items-center justify-center">
                                <LoadingIndicator size="lg" text="Loading PDF document..." />
                              </div>
                            )}
                            {pluginsReady && (
                              <PinchWrapper>
                                <Scroller
                                  renderPage={({
                                    pageIndex,
                                    scale,
                                    rotation,
                                    width,
                                    height,
                                    document,
                                  }) => (
                                    <Rotate
                                      key={document?.id}
                                      pageSize={{ width, height }}
                                      style={{ backgroundColor: '#fff' }}
                                    >
                                      <PagePointerProvider
                                        rotation={rotation}
                                        scale={scale}
                                        pageWidth={width}
                                        pageHeight={height}
                                        pageIndex={pageIndex}
                                        style={{
                                          width,
                                          height,
                                        }}
                                      >
                                        <RenderLayer
                                          pageIndex={pageIndex}
                                          className="pointer-events-none"
                                        />
                                        <TilingLayer
                                          pageIndex={pageIndex}
                                          scale={scale}
                                          className="pointer-events-none"
                                        />
                                        <SearchLayer
                                          pageIndex={pageIndex}
                                          scale={scale}
                                          className="pointer-events-none"
                                        />
                                        <HintLayer />
                                        <AnnotationLayer
                                          pageIndex={pageIndex}
                                          scale={scale}
                                          pageWidth={width}
                                          pageHeight={height}
                                          rotation={rotation}
                                          selectionMenu={({
                                            selected,
                                            rect,
                                            annotation,
                                            menuWrapperProps,
                                          }) => (
                                            <div
                                              {...menuWrapperProps}
                                              style={{
                                                ...menuWrapperProps.style,
                                                display: 'flex',
                                                justifyContent: 'center',
                                              }}
                                            >
                                              {selected ? (
                                                <AnnotationMenu
                                                  trackedAnnotation={annotation}
                                                  style={{
                                                    pointerEvents: 'auto',
                                                    position: 'absolute',
                                                    top: rect.size.height + 10,
                                                  }}
                                                />
                                              ) : null}
                                            </div>
                                          )}
                                        />
                                        <MarqueeZoom pageIndex={pageIndex} scale={scale} />
                                        <MarqueeCapture pageIndex={pageIndex} scale={scale} />
                                        <SelectionLayer pageIndex={pageIndex} scale={scale} />
                                      </PagePointerProvider>
                                    </Rotate>
                                  )}
                                  overlayElements={floating.insideScroller}
                                />
                              </PinchWrapper>
                            )}
                            {floating.outsideScroller}
                          </Viewport>
                        </GlobalPointerProvider>
                      </div>
                      {panels.right.length > 0 && <Fragment>{panels.right}</Fragment>}
                    </div>
                    <div className="flex flex-col">{headers.right}</div>
                  </div>
                  {headers.bottom.length > 0 && <div>{headers.bottom}</div>}
                  {commandMenu}
                </div>
                <Capture />
              </>
            )}
          </PluginUIProvider>
        )}
      </EmbedPDF>
    </>
  );
}
