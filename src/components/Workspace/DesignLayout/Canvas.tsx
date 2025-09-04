import React from 'react';
import { DroppedTool, Tool } from './types';
import { RefreshCw, X } from 'lucide-react';
import { useCanvas } from './useCanvas';

interface CanvasProps {
  droppedTools: DroppedTool[];
  setDroppedTools: React.Dispatch<React.SetStateAction<DroppedTool[]>>;
  selectedTool: string | null;
  setSelectedTool: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTools: string[];
  setSelectedTools: React.Dispatch<React.SetStateAction<string[]>>;
  onSave?: (tools: DroppedTool[]) => void;
  defaultWidth: number;
  defaultLength: number;
  defaultThickness: number;
  unit: 'mm' | 'inches';
  onCanvasDimensionsChange?: (dimensions: { width: number; height: number; maxWidth: number; maxHeight: number; unit: 'mm' | 'inches' }) => void;
  activeTool: 'cursor' | 'hand' | 'box';
}

const Canvas: React.FC<CanvasProps> = (props) => {
  const {
    droppedTools,
    selectedTool,
    selectedTools,
  } = props;

  const {
    canvasRef,
    selectionBox,
    getToolDimensions,
    getShadowOffset,
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleDeleteTool,
    handleDeleteSelectedTools,
    getCanvasCursor,
    getToolCursor,
  } = useCanvas(props);

  // Render selection box
  const renderSelectionBox = () => {
    if (!selectionBox?.isSelecting) return null;

    const minX = Math.min(selectionBox.startX, selectionBox.currentX);
    const minY = Math.min(selectionBox.startY, selectionBox.currentY);
    const width = Math.abs(selectionBox.currentX - selectionBox.startX);
    const height = Math.abs(selectionBox.currentY - selectionBox.startY);

    return (
      <div
        className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none z-30"
        style={{
          left: minX,
          top: minY,
          width,
          height,
        }}
      />
    );
  };

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTools.length > 0) {
          e.preventDefault();
          handleDeleteSelectedTools();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTools, handleDeleteSelectedTools]);

  return (
    <div className="flex-1 p-6">
      <div
        ref={canvasRef}
        className="border-2 border-dashed border-gray-300 h-full relative bg-gray-50 rounded-lg"
        style={{ cursor: getCanvasCursor() }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onMouseDown={handleCanvasMouseDown}
      >
        {/* Dropped Tools */}
        {droppedTools.map(tool => {
          const { toolWidth, toolHeight } = getToolDimensions(tool);
          const shadowOffset = getShadowOffset(tool);
          const isSelected = selectedTools.includes(tool.id);
          const isPrimarySelection = selectedTool === tool.id;

          return (
            <div
              key={tool.id}
              className={`absolute select-none group ${
                isSelected 
                  ? isPrimarySelection 
                    ? 'ring-2 ring-blue-500' 
                    : 'ring-2 ring-blue-300'
                  : ''
              } ${isSelected ? 'z-20' : 'z-10'}`}
              style={{
                left: tool.x,
                top: tool.y,
                transform: `rotate(${tool.rotation}deg) scaleX(${tool.flipHorizontal ? -1 : 1}) scaleY(${tool.flipVertical ? -1 : 1})`,
                width: `${toolWidth}px`,
                height: `${toolHeight}px`,
                cursor: getToolCursor(tool.id),
              }}
              onMouseDown={(e) => handleToolMouseDown(e, tool.id)}
            >
              <div className="relative w-full h-full">
                {tool.image && (
                  <div className="relative w-full h-full">
                    {/* 3D Thickness Effect - More layers for thicker materials */}
                    {Array.from({ length: Math.max(2, Math.floor(shadowOffset / 4)) }, (_, i) => (
                      <img
                        key={`depth-${i}`}
                        src={tool.image}
                        alt=""
                        className="absolute w-full h-full object-cover rounded"
                        style={{
                          left: `${i * 2}px`,
                          top: `${i * 2}px`,
                          filter: `brightness(${0.6 - i * 0.08}) saturate(0.7)`,
                          zIndex: -i,
                          opacity: 0.9 - (i * 0.15)
                        }}
                        draggable={false}
                      />
                    ))}

                    {/* Main tool image on top */}
                    <img
                      src={tool.image}
                      alt={tool.name}
                      className={`relative w-full h-full object-cover rounded z-10 ${
                        isSelected ? 'brightness-110' : ''
                      }`}
                      style={{
                        boxSizing: 'border-box',
                        opacity: tool.opacity / 100
                      }}
                      draggable={false}
                    />
                  </div>
                )}

                {/* Delete button - only show when tool is selected */}
                {isSelected && (
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTool(tool.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Multi-select indicator */}
                {isSelected && selectedTools.length > 1 && (
                  <div className="absolute -top-1 -left-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold z-30">
                    {isPrimarySelection ? '1' : selectedTools.indexOf(tool.id) + 1}
                  </div>
                )}

                {/* Enhanced tool info with individual tool dimensions */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                  {tool.name}
                  <br />
                  <span className="text-gray-300">
                    {tool.width} × {tool.length} × <span className="text-yellow-300 font-semibold">{tool.thickness}</span> {tool.unit}
                  </span>
                  {isSelected && selectedTools.length > 1 && (
                    <>
                      <br />
                      <span className="text-blue-300 text-xs">
                        {selectedTools.length} tools selected
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Selection Box */}
        {renderSelectionBox()}

        {/* Center refresh icon */}
        {droppedTools.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Drag tools from the sidebar to start designing</p>
            <p className="text-gray-400 text-xs mt-1">
              Use <span className="font-semibold">Cursor</span> tool to select,
              <span className="font-semibold"> Hand</span> tool to move
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Hold <span className="font-semibold">Ctrl/Cmd</span> to multi-select,
              drag to create selection box
            </p>
          </div>
        )}

        {/* Multi-selection info */}
        {selectedTools.length > 1 && (
          <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-medium">
            {selectedTools.length} tools selected
            <button
              className="ml-2 text-blue-200 hover:text-white"
              onClick={handleDeleteSelectedTools}
              title="Delete selected tools"
            >
              <X className="w-4 h-4 inline" />
            </button>
          </div>
        )}

        <div className="absolute inset-4 border-2 border-transparent rounded-lg transition-colors duration-200 pointer-events-none" />
      </div>
    </div>
  );
};

export default Canvas;