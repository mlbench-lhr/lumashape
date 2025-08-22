export interface Tool {
    id: string;
    name: string;
    icon: string;
    brand: string;
    image?: string; // PNG image path
}

export interface DroppedTool extends Tool {
    x: number;
    y: number;
    rotation: number;
}
