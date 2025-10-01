import { DroppedTool, ToolGroup, ClipboardData } from './types';
import { useState, useCallback, useRef } from 'react';

// Clipboard data (can remain global as it's shared across sessions)
let clipboardData: ClipboardData | null = null;

// React hook for undo/redo functionality with fixed implementation
export const useUndoRedo = (initialState: DroppedTool[] = []) => {
  const [state, setState] = useState({
    history: [JSON.parse(JSON.stringify(initialState))],
    currentIndex: 0,
  });

  // Use refs to avoid stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  const canUndoHook = state.currentIndex > 0;
  const canRedoHook = state.currentIndex < state.history.length - 1;

  const pushState = useCallback((newState: DroppedTool[]) => {
    setState(prevState => {
      // Don't add if it's the same as current state
      const currentState = prevState.history[prevState.currentIndex];
      if (JSON.stringify(currentState) === JSON.stringify(newState)) {
        return prevState;
      }

      // Create new history array up to current index
      const newHistory = prevState.history.slice(0, prevState.currentIndex + 1);
      // Add the new state
      newHistory.push(JSON.parse(JSON.stringify(newState)));

      // Keep history limited to 50 states
      const limitedHistory = newHistory.slice(-50);

      const newStateObj = {
        history: limitedHistory,
        currentIndex: limitedHistory.length - 1,
      };

      return newStateObj;
    });
  }, []);

  const undoHook = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.currentIndex > 0) {
      const newIndex = currentState.currentIndex - 1;
      setState(prevState => ({
        ...prevState,
        currentIndex: newIndex,
      }));
      return JSON.parse(JSON.stringify(currentState.history[newIndex]));
    }
    return null;
  }, []);

  const redoHook = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.currentIndex < currentState.history.length - 1) {
      const newIndex = currentState.currentIndex + 1;
      setState(prevState => ({
        ...prevState,
        currentIndex: newIndex,
      }));
      return JSON.parse(JSON.stringify(currentState.history[newIndex]));
    }
    return null;
  }, []);

  // Get current state
  const getCurrentState = useCallback(() => {
    return JSON.parse(JSON.stringify(state.history[state.currentIndex]));
  }, [state.history, state.currentIndex]);

  return {
    pushState,
    undo: undoHook,
    redo: redoHook,
    canUndo: canUndoHook,
    canRedo: canRedoHook,
    getCurrentState,
  };
};

// Rotation functionality - no longer saves to global history
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

// Flip functionality - no longer saves to global history
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

// Group functionality - no longer saves to global history
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

  updateDroppedTools(prev =>
    prev.map(tool =>
      selectedTools.includes(tool.id)
        ? { ...tool, groupId }
        : tool
    )
  );

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

  updateDroppedTools(prev =>
    prev.map(tool =>
      groupIds.has(tool.groupId || '')
        ? { ...tool, groupId: undefined }
        : tool
    )
  );

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

// Paste functionality - no longer saves to global history
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

// Delete functionality - no longer saves to global history
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

  updateDroppedTools(prev => prev.filter(tool => !selectedTools.includes(tool.id)));

  if (setGroups && groupIds.size > 0) {
    setGroups(prev => prev.filter(group => !groupIds.has(group.id)));
  }
};

// Alignment functionality - no longer saves to global history
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

  updateDroppedTools(prev =>
    prev.map(tool => {
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
    })
  );
};

// Auto layout functionality - no longer saves to global history
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

    return newTools;
  });
};

// Shape creation functionality - no longer saves to global history
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

  updateDroppedTools(prev => [...prev, newShape]);
};

// Update tool appearance - no longer saves to global history
export const updateToolAppearance = (
  toolId: string,
  droppedTools: DroppedTool[],
  updateDroppedTools: (updater: React.SetStateAction<DroppedTool[]>) => void,
  property: 'opacity' | 'smooth',
  value: number
): void => {
  // Ensure the input is a valid number
  if (isNaN(value)) return;

  updateDroppedTools(prev =>
    prev.map(tool =>
      tool.id === toolId
        ? { ...tool, [property]: Math.max(0, Math.min(100, value)) }
        : tool
    )
  );
};
