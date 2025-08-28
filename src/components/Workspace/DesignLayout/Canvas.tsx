import React from 'react';
import { DroppedTool, Tool } from './types';
import { RefreshCw, X } from 'lucide-react';
import { useCanvas } from './useCanvas';

// In Canvas.tsx - update the interface
interface CanvasProps {
  droppedTools: DroppedTool[];
  setDroppedTools: React.Dispatch<React.SetStateAction<DroppedTool[]>>;
  selectedTool: string | null;
  setSelectedTool: React.Dispatch<React.SetStateAction<string | null>>;
  onSave?: (tools: DroppedTool[]) => void;
  defaultWidth: number;
  defaultLength: number;
  defaultThickness: number;
  unit: 'mm' | 'inches';
  onCanvasDimensionsChange?: (dimensions: { width: number; height: number; maxWidth: number; maxHeight: number; unit: 'mm' | 'inches' }) => void;
  activeTool: 'cursor' | 'hand' | 'box';
  canvasWidth: number;    // Add these new props
  canvasLength: number;   // Add these new props
  availableSpace: { width: number; height: number };
}

const Canvas: React.FC<CanvasProps> = (props) => {
  const {
    droppedTools,
    selectedTool,
    availableSpace,
  } = props;

  const {
    canvasRef,
    getToolDimensions,
    getShadowOffset,
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleDeleteTool,
    getCanvasCursor,
    getToolCursor,
  } = useCanvas(props);

  // Convert canvas dimensions to pixels for display with proper scaling
  const getPixelSize = (value: number, unit: 'mm' | 'inches') => {
    if (unit === 'mm') {
      return value * 1.5; // 1mm = 1.5px for more reasonable display size
    } else {
      return value * 37.5; // 1 inch = 37.5px for more reasonable display size
    }
  };

  const canvasWidthPx = getPixelSize(props.canvasWidth, props.unit);
  const canvasHeightPx = getPixelSize(props.canvasLength, props.unit);

  // Use the availableSpace prop instead of calculating window dimensions
  const constrainedWidth = Math.min(canvasWidthPx, availableSpace.width - 20); // Small additional margin
  const constrainedHeight = Math.min(canvasHeightPx, availableSpace.height - 40); // Extra margin

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div
        ref={canvasRef}
        className="border-2 border-dashed border-gray-300 relative bg-gray-50 rounded-lg mx-auto"
        style={{
          cursor: getCanvasCursor(),
          width: `${constrainedWidth}px`,
          height: `${constrainedHeight}px`,
          minWidth: '200px',
          minHeight: '200px',
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Dropped Tools */}
        {droppedTools.map(tool => {
          const { toolWidth, toolHeight } = getToolDimensions(tool);
          const shadowOffset = getShadowOffset(tool);

          return (
            <div
              key={tool.id}
              className={`absolute select-none group ${selectedTool === tool.id ? 'ring-2 ring-blue-500' : ''}`}
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
                      className="relative w-full h-full object-cover rounded z-10"
                      style={{
                        boxSizing: 'border-box'
                      }}
                      draggable={false}
                    />
                  </div>
                )}

                {/* Delete button - only show when tool is selected */}
                {selectedTool === tool.id && (
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTool(tool.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Enhanced tool info with individual tool dimensions */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                  {tool.name}
                  <br />
                  <span className="text-gray-300">
                    {tool.width} × {tool.length} × <span className="text-yellow-300 font-semibold">{tool.thickness}</span> {tool.unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Center refresh icon */}
        {droppedTools.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Drag tools from the sidebar to start designing</p>
            <p className="text-gray-400 text-xs mt-1">
              Use <span className="font-semibold">Cursor</span> tool to select,
              <span className="font-semibold"> Hand</span> tool to move
            </p>
          </div>
        )}

        <div className="absolute inset-4 border-2 border-transparent rounded-lg transition-colors duration-200 pointer-events-none" />

        {/* Debug info - shows actual canvas pixel dimensions vs available space */}
        <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          Canvas: {constrainedWidth}×{constrainedHeight}px<br/>
          Available: {availableSpace.width}×{availableSpace.height}px<br/>
          Requested: {canvasWidthPx.toFixed(0)}×{canvasHeightPx.toFixed(0)}px
        </div>
      </div>
    </div>
  );
};

export default Canvas;