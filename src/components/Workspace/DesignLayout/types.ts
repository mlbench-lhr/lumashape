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
}