export interface Tool {
    id: string;
    name: string;
    icon: string;
    brand: string;
    image?: string;
}

export interface DroppedTool extends Tool {
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  // Add individual dimensions for each tool
  width: number;
  length: number;
  thickness: number;
  unit: 'mm' | 'inches';
  // Add opacity and smooth properties
  opacity: number; // 0-100
  smooth: number; // 0-100
  // Add grouping support
  groupId?: string;
  isSelected?: boolean;
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