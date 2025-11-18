export interface Tool {
  id: string;
  name: string;
  icon: string;
  toolBrand: string;
  toolType: string;
  image?: string;
  unit?: 'mm' | 'inches';
  width?: number;
  length?: number;
  depth?: number;
  // Store all extracted data for potential future use
  metadata?: {
    userEmail?: string;
    toolBrand?: string;
    toolType?: string;
    depth?: number;
    SKUorPartNumber?: string;
    imageUrl?: string;
    outlinesImg?: string;
    contour_image_url?: string;
    length?: number;
    gapInches?: number;
    dxfLink?: string;
    scaleFactor?: number;
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    naturalWidth?: number;
    naturalHeight?: number;
    thicknessInches?: number;
    originalId?: string;
    isFingerCut?: boolean;
    fingerCutWidth?: number;
    fingerCutLength?: number;
  };
  // NEW: text tool properties (optional)
  textContent?: string;
  textFontFamily?: string;
  textFontWeight?: number | string;
  textFontSizePx?: number;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
}

export interface DroppedTool extends Tool {
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  // Legacy dimensions (kept for compatibility)
  width: number;
  length: number;
  depth: number;
  SKUorPartNumber: string;
  unit: 'mm' | 'inches';
  // Add opacity and smooth properties
  opacity: number; // 0-100
  smooth: number;  // 0-100
  // Add grouping support
  groupId?: string;
  isSelected?: boolean;
  gapInches?: number;
  // NEW: Real calculated dimensions based on scale info
  realWidth?: number;   // Calculated from scaleFactor + length
  realHeight?: number;  // Calculated from scaleFactor + length
  // NEW: text tool properties (optional)
  textContent?: string;
  textFontFamily?: string;
  textFontWeight?: number | string;
  textFontSizePx?: number;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
}

export interface ToolGroup {
  id: string;
  toolIds: string[];
  x: number;
  y: number;
  rotation: number;
}

export interface ClipboardData {
  tools: DroppedTool[];
  groups: ToolGroup[];
}

// ✅ Updated scale information (matches DB fields)
export interface ScaleInfo {
  scaleFactor: number;    // mm/px
  length: number; // reference size in inches
}
