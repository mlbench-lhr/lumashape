export interface Tool {
  id: string;
  name: string;
  icon: string;
  brand: string;
  image?: string;
  // Store all extracted data for potential future use
  metadata?: {
    userEmail?: string;
    paperType?: string;
    description?: string;
    purchaseLink?: string;
    backgroundImg?: string;
    annotatedImg?: string;
    outlinesImg?: string;
    diagonalInches?: number;
    dxfLink?: string;   // ✅ new
    scaleFactor?: number;      // ✅ new (mm/px)
    createdAt?: string;
    updatedAt?: string;
    version?: number;
    naturalWidth?: number;
    naturalHeight?: number;
  };
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
  thickness: number;
  unit: 'mm' | 'inches';
  // Add opacity and smooth properties
  opacity: number; // 0-100
  smooth: number;  // 0-100
  // Add grouping support
  groupId?: string;
  isSelected?: boolean;
  // NEW: Real calculated dimensions based on scale info
  realWidth?: number;   // Calculated from scaleFactor + diagonalInches
  realHeight?: number;  // Calculated from scaleFactor + diagonalInches
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
  diagonalInches: number; // reference size in inches
  paperType?: string;
}
