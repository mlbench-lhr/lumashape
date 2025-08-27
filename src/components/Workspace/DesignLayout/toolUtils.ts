import { DroppedTool } from './types';

export const rotateTool = (
  toolId: string,
  droppedTools: DroppedTool[],
  activeTool: string,
  selectedTool: string | null,
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  degrees: number
): void => {
  if (activeTool === 'cursor' && selectedTool === toolId) {
    updateDroppedTools(prev =>
      prev.map(tool =>
        tool.id === toolId
          ? { ...tool, rotation: (tool.rotation + degrees) % 360 }
          : tool
      )
    );
  }
};

export const flipToolRelativeToRotation = (
  toolId: string,
  droppedTools: DroppedTool[],
  activeTool: string,
  selectedTool: string | null,
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  direction: 'horizontal' | 'vertical'
): void => {
  if (activeTool === 'cursor' && selectedTool === toolId) {
    updateDroppedTools(prev =>
      prev.map(tool => {
        if (tool.id === toolId) {
          const normalizedRotation = ((tool.rotation % 360) + 360) % 360;
          
          let flipHorizontal = tool.flipHorizontal;
          let flipVertical = tool.flipVertical;
          
          if (direction === 'horizontal') {
            if (normalizedRotation >= 45 && normalizedRotation < 135) {
              flipVertical = !flipVertical;
            } else if (normalizedRotation >= 135 && normalizedRotation < 225) {
              flipHorizontal = !flipHorizontal;
            } else if (normalizedRotation >= 225 && normalizedRotation < 315) {
              flipVertical = !flipVertical;
            } else {
              flipHorizontal = !flipHorizontal;
            }
          } else {
            if (normalizedRotation >= 45 && normalizedRotation < 135) {
              flipHorizontal = !flipHorizontal;
            } else if (normalizedRotation >= 135 && normalizedRotation < 225) {
              flipVertical = !flipVertical;
            } else if (normalizedRotation >= 225 && normalizedRotation < 315) {
              flipHorizontal = !flipHorizontal;
            } else {
              flipVertical = !flipVertical;
            }
          }
          
          return {
            ...tool,
            flipHorizontal,
            flipVertical
          };
        }
        return tool;
      })
    );
  }
};