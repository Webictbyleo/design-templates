export interface Design {
  id: string
  name: string
  title: string // Display title for the design (usually same as name)
  description?: string
  data: DesignData
  layers?: Layer[] // Optional direct layers array from backend
  thumbnail?: string
  width: number
  height: number
  userId: string
  projectId?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface DesignData {
  animationSettings?: Record<string, any> // Animation settings for the design
  backgroundColor?: string // Background color for the design (legacy)
  background?: DesignBackground // New background configuration supporting gradients
  customProperties?: Record<string, any> // Custom properties for the design
  globalStyles?: Record<string, any> // Global styles for the design
  gridSettings?: {
    gridSize: number // Size of the grid cells
    showGrid: boolean
    snapToGrid: boolean
    snapToObjects: boolean
    snapTolerance: number // Tolerance for snapping to grid or objects
  }
  viewportSettings?: {
    zoom: number // Current zoom level
    panX: number // Horizontal pan offset
    panY: number // Vertical pan offset
  }

}

export interface DesignBackground {
  type: 'solid' | 'linear' | 'radial'
  color?: string // For solid backgrounds
  gradient?: {
    colors: Array<{ color: string; stop: number }> // Color stops for gradients
    angle?: number // For linear gradients (in degrees)
    centerX?: number // For radial gradients (0-1)
    centerY?: number // For radial gradients (0-1)
    radius?: number // For radial gradients (0-1)
  }
}

export interface CanvasSettings {
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
}

export interface Layer {
  id: number
  type: LayerType
  name: string
  visible: boolean
  locked: boolean
  transform: Transform
  zIndex: number
  properties: LayerProperties
  plugins?: Record<string, any>
}

export interface Transform {
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  opacity?: number
}

export interface BaseLayerProperties {
  [key: string]: any
}

// Text layer properties matching backend TextLayerProperties
export interface TextLayerProperties extends BaseLayerProperties {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic' | 'oblique'
  textAlign: 'left' | 'center' | 'right' | 'justify'
  color: string
  lineHeight: number
  letterSpacing: number
  textDecoration: 'none' | 'underline' | 'overline' | 'line-through'
  // Auto-resize properties for dynamic text sizing
  autoResize: AutoResizeConfig
}

// Auto-resize configuration for text layers
export interface AutoResizeConfig {
  enabled: boolean
  mode: 'width' | 'height' | 'both' | 'none'
  maxWidth?: number
  maxHeight?: number
  minWidth?: number
  minHeight?: number
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// Image shadow configuration matching backend structure
export interface ImageShadowConfig {
  enabled: boolean
  offsetX?: number
  offsetY?: number
  blur?: number
  color?: string
  opacity?: number
}

// Image layer properties matching backend ImageLayerProperties
export interface ImageLayerProperties extends BaseLayerProperties {
  src: string
  alt: string
  objectPosition: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right'
  preserveAspectRatio: boolean
  quality: number
  // Scaling and dimension properties
  scaleMode?: 'fill' | 'fit' | 'stretch' // New: Controls how image scales within container
  originalWidth?: number // New: Store original image dimensions
  originalHeight?: number // New: Store original image dimensions
  explicitDimensions?: boolean // New: Whether dimensions were explicitly set by user
  // Filter properties (following backend order and ranges)
  blur: number // 0-50px
  brightness: number // 0-3
  contrast: number // 0-3
  saturation: number // 0-3
  hue: number // -360 to 360 degrees
  sepia: number // 0-1
  grayscale: number // 0-1
  invert: number // 0-1
  // SVG filter properties
  shadow: ImageShadowConfig
  // Additional frontend properties for UI convenience
  flipX: boolean
  flipY: boolean
}

// Shape fill configuration matching backend structure
export interface ShapeFillConfig {
  type: 'solid' | 'linear' | 'radial' | 'pattern'
  color?: string
  opacity?: number
  colors?: Array<{ color: string; stop: number; opacity?: number }>
  angle?: number
  centerX?: number
  centerY?: number
  radius?: number
  patternType?: 'dots' | 'stripes' | 'grid'
  size?: number
  backgroundColor?: string
  spacing?: number
}

// Shape effect configuration
export interface ShapeEffectConfig {
  enabled: boolean
  offsetX?: number
  offsetY?: number
  blur?: number
  color?: string
  opacity?: number
}

// Shape layer properties matching backend ShapeLayerProperties
export interface ShapeLayerProperties extends BaseLayerProperties {
  shapeType: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'line' 
  fill: ShapeFillConfig
  stroke: string
  strokeWidth: number
  strokeOpacity: number
  strokeDashArray?: string
  strokeLineCap: 'butt' | 'round' | 'square'
  strokeLineJoin: 'miter' | 'round' | 'bevel'
  cornerRadius: number
  sides: number
  points: number
  innerRadius: number
  x1: number
  y1: number
  x2: number
  y2: number
  shadow?: ShapeEffectConfig
  glow?: ShapeEffectConfig
}

// Group layer properties matching backend GroupLayerRenderer
export interface GroupLayerProperties extends BaseLayerProperties {
  children?: Array<any>
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'
  isolation?: boolean
  clipPath?: {
    enabled: boolean
    type: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'path'
    x?: number
    y?: number
    width?: number
    height?: number
    cx?: number
    cy?: number
    r?: number
    rx?: number
    ry?: number
    cornerRadius?: number
    points?: Array<{ x: number; y: number }>
    d?: string
  }
  mask?: {
    enabled: boolean
    type: 'gradient' | 'image' | 'shape'
    shapeType?: 'rectangle' | 'circle' | 'ellipse'
    src?: string
    gradient?: {
      type: 'linear' | 'radial'
      stops: Array<{ offset: string; color: string; opacity: number }>
    }
  }
}

// Video layer properties
export interface VideoLayerProperties extends BaseLayerProperties {
  src: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
}

// Audio layer properties
export interface AudioLayerProperties extends BaseLayerProperties {
  src: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
}

// SVG vector layer properties
export interface SVGLayerProperties extends BaseLayerProperties {
  src: string // URL or inline SVG content
  viewBox?: string // SVG viewBox attribute
  preserveAspectRatio?: string // SVG preserveAspectRatio attribute
  fillColors?: Record<string, string> // Map of element IDs/classes to fill colors for customization
  strokeColors?: Record<string, string> // Map of element IDs/classes to stroke colors
  strokeWidths?: Record<string, number> // Map of element IDs/classes to stroke widths
  originalWidth?: number // Original SVG width
  originalHeight?: number // Original SVG height
  // Parsed SVG elements for toolbar integration (populated by renderer)
  svgElements?: Array<{
    type: string
    id?: string
    className?: string
    originalFill?: string
    originalStroke?: string
    originalStrokeWidth?: number
  }>
}

// Union type for all layer properties
export type LayerProperties = 
  | TextLayerProperties
  | ImageLayerProperties 
  | ShapeLayerProperties
  | GroupLayerProperties
  | VideoLayerProperties
  | AudioLayerProperties
  | SVGLayerProperties
  | BaseLayerProperties

export type LayerType = 'text' | 'image' | 'shape' | 'group' | 'video' | 'audio' | 'svg'