import { DroppedTool, ToolGroup, ClipboardData } from './types';

// State management for history
interface HistoryState {
  tools: DroppedTool[];
  groups: ToolGroup[];
}

let historyStack: HistoryState[] = [];
let currentHistoryIndex = -1;
let clipboardData: ClipboardData | null = null;

// History management
export const saveToHistory = (
  droppedTools: DroppedTool[],
  groups: ToolGroup[] = []
): void => {
  const newState: HistoryState = {
    tools: JSON.parse(JSON.stringify(droppedTools)),
    groups: JSON.parse(JSON.stringify(groups))
  };
  
  // Remove any future history if we're not at the end
  historyStack = historyStack.slice(0, currentHistoryIndex + 1);
  
  // Add new state
  historyStack.push(newState);
  currentHistoryIndex = historyStack.length - 1;
  
  // Keep history limited to 50 states
  if (historyStack.length > 50) {
    historyStack = historyStack.slice(-50);
    currentHistoryIndex = historyStack.length - 1;
  }
};

export const undo = (): HistoryState | null => {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    return JSON.parse(JSON.stringify(historyStack[currentHistoryIndex]));
  }
  return null;
};

export const redo = (): HistoryState | null => {
  if (currentHistoryIndex < historyStack.length - 1) {
    currentHistoryIndex++;
    return JSON.parse(JSON.stringify(historyStack[currentHistoryIndex]));
  }
  return null;
};

export const canUndo = (): boolean => currentHistoryIndex > 0;
export const canRedo = (): boolean => currentHistoryIndex < historyStack.length - 1;

// Rotation functionality
export const rotateTool = (
  toolId: string,
  droppedTools: DroppedTool[],
  activeTool: string,
  selectedTool: string | null,
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  degrees: number
): void => {
  if (activeTool === 'cursor' && selectedTool === toolId) {
    updateDroppedTools(prev => {
      const newTools = prev.map(tool =>
        tool.id === toolId
          ? { ...tool, rotation: (tool.rotation + degrees) % 360 }
          : tool
      );
      saveToHistory(newTools);
      return newTools;
    });
  }
};

// Flip functionality
export const flipToolRelativeToRotation = (
  toolId: string,
  droppedTools: DroppedTool[],
  activeTool: string,
  selectedTool: string | null,
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  direction: 'horizontal' | 'vertical'
): void => {
  if (activeTool === 'cursor' && selectedTool === toolId) {
    updateDroppedTools(prev => {
      const newTools = prev.map(tool => {
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
      });
      saveToHistory(newTools);
      return newTools;
    });
  }
};

// Group functionality
export const groupSelectedTools = (
  droppedTools: DroppedTool[],
  selectedTools: string[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  setGroups?: (updater: React.SetStateAction<ToolGroup[]>) => void
): void => {
  if (selectedTools.length < 2) return;

  const selectedToolObjects = droppedTools.filter(tool => selectedTools.includes(tool.id));
  if (selectedToolObjects.length < 2) return;

  // Calculate group center
  const centerX = selectedToolObjects.reduce((sum, tool) => sum + tool.x, 0) / selectedToolObjects.length;
  const centerY = selectedToolObjects.reduce((sum, tool) => sum + tool.y, 0) / selectedToolObjects.length;

  const groupId = `group_${Date.now()}`;
  const newGroup: ToolGroup = {
    id: groupId,
    toolIds: selectedTools,
    x: centerX,
    y: centerY,
    rotation: 0
  };

  updateDroppedTools(prev => {
    const newTools = prev.map(tool =>
      selectedTools.includes(tool.id)
        ? { ...tool, groupId }
        : tool
    );
    saveToHistory(newTools);
    return newTools;
  });

  if (setGroups) {
    setGroups(prev => [...prev, newGroup]);
  }
};

export const ungroupSelectedTools = (
  droppedTools: DroppedTool[],
  selectedTools: string[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  setGroups?: (updater: React.SetStateAction<ToolGroup[]>) => void
): void => {
  const groupIds = new Set(
    droppedTools
      .filter(tool => selectedTools.includes(tool.id) && tool.groupId)
      .map(tool => tool.groupId!)
  );

  if (groupIds.size === 0) return;

  updateDroppedTools(prev => {
    const newTools = prev.map(tool =>
      groupIds.has(tool.groupId || '')
        ? { ...tool, groupId: undefined }
        : tool
    );
    saveToHistory(newTools);
    return newTools;
  });

  if (setGroups) {
    setGroups(prev => prev.filter(group => !groupIds.has(group.id)));
  }
};

// Copy functionality
export const copySelectedTools = (
  droppedTools: DroppedTool[],
  selectedTools: string[],
  groups: ToolGroup[] = []
): void => {
  const selectedToolObjects = droppedTools.filter(tool => selectedTools.includes(tool.id));
  const selectedGroupObjects = groups.filter(group => 
    group.toolIds.some(toolId => selectedTools.includes(toolId))
  );

  clipboardData = {
    tools: JSON.parse(JSON.stringify(selectedToolObjects)),
    groups: JSON.parse(JSON.stringify(selectedGroupObjects))
  };
};

// Paste functionality
export const pasteTools = (
  droppedTools: DroppedTool[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  setGroups?: (updater: React.SetStateAction<ToolGroup[]>) => void,
  offsetX: number = 20,
  offsetY: number = 20
): string[] => {
  if (!clipboardData || clipboardData.tools.length === 0) return [];

  const idMapping: { [oldId: string]: string } = {};
  const newToolIds: string[] = [];

  updateDroppedTools(prev => {
    const newTools = [...prev];
    
    // Create new tools with new IDs and offset positions
    clipboardData!.tools.forEach(tool => {
      const newId = `${tool.id}_copy_${Date.now()}_${Math.random()}`;
      idMapping[tool.id] = newId;
      newToolIds.push(newId);
      
      const newTool: DroppedTool = {
        ...tool,
        id: newId,
        x: tool.x + offsetX,
        y: tool.y + offsetY,
        groupId: undefined // Will be set later if part of a group
      };
      
      newTools.push(newTool);
    });

    saveToHistory(newTools);
    return newTools;
  });

  // Handle groups
  if (setGroups && clipboardData.groups.length > 0) {
    setGroups(prev => {
      const newGroups = [...prev];
      
      clipboardData!.groups.forEach(group => {
        const newGroupId = `${group.id}_copy_${Date.now()}`;
        const newToolIds = group.toolIds.map(toolId => idMapping[toolId]).filter(Boolean);
        
        if (newToolIds.length > 0) {
          newGroups.push({
            ...group,
            id: newGroupId,
            toolIds: newToolIds,
            x: group.x + offsetX,
            y: group.y + offsetY
          });
          
          // Update tools to have the new group ID
          updateDroppedTools(prev => 
            prev.map(tool => 
              newToolIds.includes(tool.id) 
                ? { ...tool, groupId: newGroupId }
                : tool
            )
          );
        }
      });
      
      return newGroups;
    });
  }

  return newToolIds;
};

// Delete functionality
export const deleteSelectedTools = (
  droppedTools: DroppedTool[],
  selectedTools: string[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  setGroups?: (updater: React.SetStateAction<ToolGroup[]>) => void
): void => {
  if (selectedTools.length === 0) return;

  const groupIds = new Set(
    droppedTools
      .filter(tool => selectedTools.includes(tool.id) && tool.groupId)
      .map(tool => tool.groupId!)
  );

  updateDroppedTools(prev => {
    const newTools = prev.filter(tool => !selectedTools.includes(tool.id));
    saveToHistory(newTools);
    return newTools;
  });

  if (setGroups && groupIds.size > 0) {
    setGroups(prev => prev.filter(group => !groupIds.has(group.id)));
  }
};

// Alignment functionality
export const alignTools = (
  droppedTools: DroppedTool[],
  selectedTools: string[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  alignment: 'top' | 'bottom' | 'left' | 'right' | 'center-horizontal' | 'center-vertical'
): void => {
  if (selectedTools.length < 2) return;

  const selectedToolObjects = droppedTools.filter(tool => selectedTools.includes(tool.id));
  if (selectedToolObjects.length < 2) return;

  let alignValue: number;

  switch (alignment) {
    case 'top':
      alignValue = Math.min(...selectedToolObjects.map(tool => tool.y));
      break;
    case 'bottom':
      alignValue = Math.max(...selectedToolObjects.map(tool => tool.y));
      break;
    case 'left':
      alignValue = Math.min(...selectedToolObjects.map(tool => tool.x));
      break;
    case 'right':
      alignValue = Math.max(...selectedToolObjects.map(tool => tool.x));
      break;
    case 'center-horizontal':
      alignValue = selectedToolObjects.reduce((sum, tool) => sum + tool.x, 0) / selectedToolObjects.length;
      break;
    case 'center-vertical':
      alignValue = selectedToolObjects.reduce((sum, tool) => sum + tool.y, 0) / selectedToolObjects.length;
      break;
    default:
      return;
  }

  updateDroppedTools(prev => {
    const newTools = prev.map(tool => {
      if (selectedTools.includes(tool.id)) {
        switch (alignment) {
          case 'top':
          case 'bottom':
          case 'center-vertical':
            return { ...tool, y: alignValue };
          case 'left':
          case 'right':
          case 'center-horizontal':
            return { ...tool, x: alignValue };
          default:
            return tool;
        }
      }
      return tool;
    });
    saveToHistory(newTools);
    return newTools;
  });
};

// Auto layout functionality
export const autoLayout = (
  droppedTools: DroppedTool[],
  selectedTools: string[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  spacing: number = 50,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): void => {
  if (selectedTools.length < 2) return;

  const selectedToolObjects = droppedTools.filter(tool => selectedTools.includes(tool.id));
  if (selectedToolObjects.length < 2) return;

  // Sort tools by current position
  const sortedTools = [...selectedToolObjects].sort((a, b) => {
    return direction === 'horizontal' ? a.x - b.x : a.y - b.y;
  });

  updateDroppedTools(prev => {
    const newTools = [...prev];
    
    sortedTools.forEach((tool, index) => {
      const toolIndex = newTools.findIndex(t => t.id === tool.id);
      if (toolIndex !== -1) {
        if (direction === 'horizontal') {
          newTools[toolIndex] = {
            ...newTools[toolIndex],
            x: sortedTools[0].x + (index * spacing)
          };
        } else {
          newTools[toolIndex] = {
            ...newTools[toolIndex],
            y: sortedTools[0].y + (index * spacing)
          };
        }
      }
    });

    saveToHistory(newTools);
    return newTools;
  });
};

// Shape creation functionality
export const createShape = (
  droppedTools: DroppedTool[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  shapeType: 'circle' | 'square',
  position: { x: number; y: number }
): void => {
  const newShape: DroppedTool = {
    id: `${shapeType}_${Date.now()}`,
    name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
    icon: shapeType === 'circle' ? '⭕' : '⬜',
    brand: 'SHAPE',
    image: `/images/workspace/${shapeType}.svg`,
    x: position.x,
    y: position.y,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    width: 50,
    length: 50,
    thickness: 5,
    unit: 'mm',
    opacity: 100,
    smooth: 100
  };

  updateDroppedTools(prev => {
    const newTools = [...prev, newShape];
    saveToHistory(newTools);
    return newTools;
  });
};

// Update tool appearance
export const updateToolAppearance = (
  toolId: string,
  droppedTools: DroppedTool[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  property: 'opacity' | 'smooth',
  value: number
): void => {
  updateDroppedTools(prev => {
    const newTools = prev.map(tool =>
      tool.id === toolId
        ? { ...tool, [property]: Math.max(0, Math.min(100, value)) }
        : tool
    );
    saveToHistory(newTools);
    return newTools;
  });
};