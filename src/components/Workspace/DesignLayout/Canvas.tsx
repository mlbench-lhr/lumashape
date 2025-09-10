import React from 'react';
import { DroppedTool, Tool } from './types';
import { RefreshCw, X, Move, ZoomIn, ZoomOut, Maximize, AlertTriangle, Check } from 'lucide-react';
import { useCanvas } from './useCanvas';

interface CanvasProps {
  droppedTools: DroppedTool[];
  setDroppedTools: React.Dispatch<React.SetStateAction<DroppedTool[]>>;
  selectedTool: string | null;
  setSelectedTool: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTools: string[];
  setSelectedTools: React.Dispatch<React.SetStateAction<string[]>>;
  onSave?: (tools: DroppedTool[]) => void;
  canvasWidth: number;
  canvasHeight: number;
  unit: 'mm' | 'inches';
  activeTool: 'cursor' | 'hand' | 'box';
}

const Canvas: React.FC<CanvasProps> = (props) => {
  const {
    droppedTools,
    selectedTool,
    selectedTools,
    canvasWidth,
    canvasHeight,
    unit,
    activeTool,
  } = props;

  const {
    canvasRef,
    canvasContainerRef,
    selectionBox,
    viewport,
    hasOverlaps,
    overlappingTools,
    getToolDimensions,
    getShadowOffset,
    getCanvasStyle,
    getViewportTransform,
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleDeleteTool,
    handleDeleteSelectedTools,
    autoFixOverlaps,
    getCanvasCursor,
    getToolCursor,
    fitToView,
    centerCanvas,
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

  // Render overlap notification
  const renderOverlapNotification = () => {
    if (!hasOverlaps) return null;

    return (
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Note: The layout that you have selected is invalid
              </p>
              <p className="text-xs text-red-600 mt-1">
                {overlappingTools.length} tool{overlappingTools.length > 1 ? 's are' : ' is'} overlapping
              </p>
              <button
                onClick={autoFixOverlaps}
                className="mt-2 inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-colors"
              >
                <Check className="w-3 h-3 mr-1" />
                Auto-fix positions
              </button>
            </div>
          </div>
        </div>
      </div>
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
      // Space key for hand tool toggle
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTools, handleDeleteSelectedTools]);

  return (
    <div className="flex-1 relative bg-gray-100 overflow-hidden">
      {/* Overlap Notification */}
      {renderOverlapNotification()}

      {/* Viewport Controls */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={fitToView}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Fit to view"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          onClick={centerCanvas}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Center canvas"
        >
          <Move className="w-4 h-4" />
        </button>
        <div className="text-xs text-center text-gray-500 px-2">
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>

      {/* Canvas Container - handles viewport and zoom */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          cursor: getCanvasCursor()
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleCanvasMouseDown}
        onMouseLeave={handleMouseUp}
      >
        {/* Canvas with viewport transform */}
        <div
          ref={canvasRef}
          className="absolute border-2 border-dashed border-gray-300 bg-white rounded-lg shadow-lg"
          style={{
            ...getCanvasStyle(),
            ...getViewportTransform(),
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
        >
          {/* Canvas dimensions indicator */}
          <div className="absolute -top-8 left-0 text-sm text-gray-600 font-medium bg-white px-2 py-1 rounded shadow-sm">
            Canvas: {canvasWidth} × {canvasHeight} {unit}
          </div>

          {/* Tool instructions */}
          <div className="absolute -top-8 right-0 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded flex items-center">
            {activeTool === 'hand' ? (
              <>
                <Move className="w-3 h-3 mr-1" />
                Drag to pan • Scroll to zoom
              </>
            ) : (
              <>
                <Move className="w-3 h-3 mr-1" />
                Click to select • Drag to select multiple
              </>
            )}
          </div>

          {/* Dropped Tools */}
          {droppedTools.map(tool => {
            const { toolWidth, toolHeight } = getToolDimensions(tool);
            const shadowOffset = getShadowOffset(tool);
            const isSelected = selectedTools.includes(tool.id);
            const isPrimarySelection = selectedTool === tool.id;
            const isOverlapping = overlappingTools.includes(tool.id);

            return (
              <div
                key={tool.id}
                className={`absolute select-none group ${isSelected
                  ? isPrimarySelection
                    ? 'ring-2 ring-blue-500'
                    : 'ring-2 ring-blue-300'
                  : ''
                  } ${isSelected ? 'z-20' : 'z-10'} ${isOverlapping ? 'ring-2 ring-red-500 ring-opacity-60' : ''
                  }`}
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
                      {/* 3D Thickness Effect */}
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
                        className={`relative w-full h-full object-cover rounded z-10 ${isSelected ? 'brightness-110' : ''
                          } ${isOverlapping ? 'brightness-75 saturate-150' : ''
                          }`}
                        style={{
                          boxSizing: 'border-box',
                          opacity: tool.opacity / 100
                        }}
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Overlap indicator */}
                  {isOverlapping && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-30">
                      <AlertTriangle className="w-3 h-3" />
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

                  {/* Tool info with individual tool dimensions */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                    {tool.name}
                    <br />
                    <span className="text-gray-300">
                      Size: {toolWidth}×{toolHeight}px
                    </span>
                    {isOverlapping && (
                      <>
                        <br />
                        <span className="text-red-300 text-xs">
                          ⚠ Overlapping
                        </span>
                      </>
                    )}
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
                Canvas Size: {canvasWidth} × {canvasHeight} {unit}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Use <span className="font-semibold">Cursor</span> to select • <span className="font-semibold">Hand</span> to pan
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Hold <span className="font-semibold">Ctrl/Cmd</span> to multi-select • <span className="font-semibold">Scroll</span> to zoom
              </p>
            </div>
          )}
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm text-gray-600 shadow-lg">
          Zoom: {Math.round(viewport.zoom * 100)}%
          {activeTool === 'hand' && (
            <div className="text-xs text-gray-500 mt-1">
              Drag to pan • Scroll to zoom
            </div>
          )}
        </div>

        {/* Layout Status Indicator */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm shadow-lg">
          <div className={`flex items-center space-x-2 ${hasOverlaps ? 'text-red-600' : 'text-green-600'}`}>
            {hasOverlaps ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Layout Invalid</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="font-medium">Layout Valid</span>
              </>
            )}
          </div>
          {hasOverlaps && (
            <div className="text-xs text-gray-600 mt-1">
              {overlappingTools.length} overlapping tool{overlappingTools.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;