export const CPAG_FIGMA_SIGNATURE = '__cpag_figma__';

export type CPAGNodeClass = 'FrameNode' | 'TextNode' | 'ImageNode' | 'SvgNode';

/**
 * Absolute positioning for children that live inside a non-auto-layout parent.
 * Offsets are in px relative to the parent's top-left.
 */
export interface CPAGNodePosition {
  type: 'absolute';
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/**
 * Semantic hints emitted by the plugin. The converter decides the final HTML
 * tag (`settings.tag`) using these hints plus heuristics.
 */
export interface CPAGSemanticHints {
  isLink?: boolean;
  linkUrl?: string;
  looksLikeButton?: boolean;
  headingLevel?: number; // 1-6 when inferable from a text style name / hierarchy
}

/**
 * Maps a node design property to a token id in `payload.tokens`. The converter
 * replaces the literal value with `var(--<colorVariableId>)` after the token is
 * materialized.
 */
export interface CPAGBoundVariables {
  fillColor?: string; // token id
  borderColor?: string; // token id
  textColor?: string; // token id
}

export type CPAGOverrideValue =
  | { type: 'text'; value: string }
  | { type: 'richText'; html: string }
  | { type: 'image'; imageData: string }
  | { type: 'variant'; variantId: string }
  | { type: 'boolean'; value: boolean };

/** Reference to a component instance (Phase 2). */
export interface CPAGComponentInstanceRef {
  componentId: string; // -> payload.components[id]
  variantId?: string;
  overrides?: Record<string, CPAGOverrideValue>; // propertyKey -> value
}

export interface CPAGNode {
  __class: CPAGNodeClass;
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  width: number;
  height: number;
  widthType: 'fixed' | 'fill' | 'hug';
  heightType: 'fixed' | 'fill' | 'hug';
  minWidth?: number | null;
  maxWidth?: number | null;
  minHeight?: number | null;
  maxHeight?: number | null;
  aspectRatio?: number | null;
  rotation?: number;
  opacity: number;
  fillEnabled: boolean;
  fillType: 'color' | 'gradient' | 'image' | 'none';
  fillColor?: string;
  fillGradient?: string;
  borderEnabled: boolean;
  borderWidth: number;
  borderColor?: string;
  borderStyle: string;
  borderPerSide: boolean;
  borderTop?: number;
  borderRight?: number;
  borderBottom?: number;
  borderLeft?: number;
  borderAlign?: string; // INSIDE | OUTSIDE | CENTER (Figma strokeAlign)
  radius: number;
  radiusPerCorner: boolean;
  radiusValue?: string;
  radiusTopLeft?: number;
  radiusTopRight?: number;
  radiusBottomRight?: number;
  radiusBottomLeft?: number;
  boxShadow?: string;
  blur?: number;
  backdropBlur?: number;
  blendMode?: string;
  overflow: 'visible' | 'hidden' | 'auto' | 'scroll';
  overflowX?: 'auto' | 'scroll';
  overflowY?: 'auto' | 'scroll';
  display?: 'flex' | 'grid' | 'block';
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap';
  justifyContent?: string;
  alignItems?: string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  textVerticalAlignment?: 'top' | 'center' | 'bottom';
  lineClamp?: number;
  html?: string;
  imageData?: string;
  svgData?: string;
  children?: CPAGNode[];

  // ─── v3 additions ─────────────────────────────────────────────────────────
  // Phase 1: structure & semantics
  position?: CPAGNodePosition;
  semantic?: CPAGSemanticHints;
  // Phase 2: components
  isInstance?: boolean; // node was a Figma component instance
  instanceOf?: CPAGComponentInstanceRef;
  // Phase 3: styles & tokens
  textStyleId?: string; // -> payload.styles
  fillStyleId?: string; // -> payload.styles
  effectStyleId?: string; // -> payload.styles
  strokeStyleId?: string; // -> payload.styles
  boundVariables?: CPAGBoundVariables;
}

// ─── Payload-level design-system tables (v3) ──────────────────────────────────

export type FigmaStyleType = 'text' | 'fill' | 'effect' | 'stroke';

export interface FigmaStyleEntry {
  id: string;
  name: string;
  type: FigmaStyleType;
  /** Text styles: CSS-ish typography map (font-family, font-size, ...). */
  typography?: Record<string, string>;
  /** Fill / stroke styles: resolved CSS color. */
  color?: string;
  /** Effect styles: resolved CSS box-shadow. */
  boxShadow?: string;
}

export interface FigmaTokenEntry {
  id: string;
  name: string; // Figma variable name (e.g. "Brand/Primary")
  /** Value in CPAG color-variable stored format: `#hex` or `#hex/opacity`. */
  value: string;
}

export type FigmaComponentPropertyType = 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP' | 'VARIANT';

export interface FigmaComponentPropertyEntry {
  key: string;
  name: string;
  type: FigmaComponentPropertyType;
}

export interface FigmaComponentVariantEntry {
  id: string;
  name: string;
  nodes: CPAGNode[];
}

export interface FigmaComponentEntry {
  id: string;
  name: string;
  variants: FigmaComponentVariantEntry[];
  properties: FigmaComponentPropertyEntry[];
}

export interface CPAGImportOptions {
  createComponents?: boolean;
  extractStyles?: boolean;
  syncTokens?: boolean;
  responsive?: boolean;
  aggressiveResponsive?: boolean;
}

export const CPAG_FIGMA_VERSION = 3;

export interface CPAGFigmaPayload {
  signature: typeof CPAG_FIGMA_SIGNATURE;
  version: typeof CPAG_FIGMA_VERSION;
  source: 'figma-plugin';
  nodes: CPAGNode[];
  styles?: Record<string, FigmaStyleEntry>;
  tokens?: Record<string, FigmaTokenEntry>;
  components?: Record<string, FigmaComponentEntry>;
  options?: CPAGImportOptions;
}

export function isCPAGFigmaPayload(data: unknown): data is CPAGFigmaPayload {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.signature === CPAG_FIGMA_SIGNATURE &&
    obj.version === CPAG_FIGMA_VERSION &&
    obj.source === 'figma-plugin' &&
    Array.isArray(obj.nodes)
  );
}
