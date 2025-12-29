// Updated Canvas.tsx - Clean tool rendering without borders
import React from "react";
import { useCallback } from "react";
import { DroppedTool, Tool } from "./types";
import {
  RefreshCw,
  X,
  Move,
  Maximize,
  AlertTriangle,
  Check,
  Hand,
} from "lucide-react";
import { useCanvas } from "./useCanvas";
import RotationWheel from "./RotationWheel";

// conversion helper
const mmToInches = (mm: number) => mm / 25.4;

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
  unit: "mm" | "inches";
  thickness: number;
  activeTool: "cursor" | "hand" | "box" | "fingercut";
  setActiveTool: (tool: "cursor" | "hand" | "box" | "fingercut") => void;
  onOverlapChange?: (hasOverlaps: boolean) => void;
  readOnly?: boolean;
  // NEW: mark gesture boundaries to batch history
  beginInteraction: () => void;
  endInteraction: () => void;
  // NEW: suppress selection overlays (e.g., rotation wheel) during snapshot
  suppressSelectionUI?: boolean;
}

const Canvas: React.FC<CanvasProps> = (props) => {
  const {
    droppedTools,
    selectedTool,
    selectedTools,
    canvasWidth,
    canvasHeight,
    unit,
    thickness,
    activeTool,
  } = props;

  const {
    canvasRef,
    canvasContainerRef,
    selectionBox,
    viewport,
    hasOverlaps,
    overlappingTools,
    hasOutOfBounds,
    outOfBoundsTools,
    getToolDimensions,
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
    handleFingerCutClick,
    handleFingerCutEndpointDown,
    fingerCutStart,
    fingerCutPreviewEnd,
    constrainToCanvas,
    handleResizeStart,
  } = useCanvas(props);

  // Auto-fit the canvas when workspace opens and when dimensions or unit change
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => fitToView());
    return () => cancelAnimationFrame(raf);
  }, [canvasWidth, canvasHeight, unit]);

  React.useEffect(() => {
    if (props.onOverlapChange) {
      props.onOverlapChange(hasOverlaps || hasOutOfBounds);
    }
  }, [hasOverlaps, hasOutOfBounds, props.onOverlapChange]);

  // Helper function to convert pixel position to inches with bottom-left origin
  const convertPositionToInches = (
    pixelPosition: number,
    canvasDimension: number,
    isX: boolean = true
  ): number => {
    // Choose logical canvas size in inches for axis
    const canvasInchesX =
      props.unit === "mm" ? mmToInches(props.canvasWidth) : props.canvasWidth;
    const canvasInchesY =
      props.unit === "mm" ? mmToInches(props.canvasHeight) : props.canvasHeight;

    // Read actual rendered canvas size and remove zoom to get base CSS pixels
    const el = canvasRef.current;
    const zoom = viewport?.zoom ?? 1;

    // Fallback DPI for non-DOM cases
    const DPI = 96;

    let baseWidthPx = canvasInchesX * DPI;
    let baseHeightPx = canvasInchesY * DPI;

    if (el) {
      const rect = el.getBoundingClientRect();
      baseWidthPx = rect.width / zoom;
      baseHeightPx = rect.height / zoom;
    }

    // Pixels per inch for each axis
    const ppiX = baseWidthPx / canvasInchesX;
    const ppiY = baseHeightPx / canvasInchesY;

    // Convert position
    let inches = isX ? pixelPosition / ppiX : pixelPosition / ppiY;

    // Bottom-left origin for Y
    if (!isX) inches = canvasInchesY - inches;

    return Number(inches.toFixed(2));
  };

  const thicknessInches = (() => {
    if (!(thickness > 0)) return 0;
    return thickness > 10 ? mmToInches(thickness) : thickness;
  })();
  const depthInchesFor = (t: DroppedTool) =>
    typeof t.depth === "number"
      ? t.unit === "mm"
        ? mmToInches(t.depth)
        : t.depth
      : 0;
  const allowedDepthInches = Math.max(0, thicknessInches - 0.25);
  const tooDeepCount = droppedTools.filter(
    (t) => depthInchesFor(t) > allowedDepthInches
  ).length;
  const isLayoutInvalid = hasOverlaps || hasOutOfBounds;

  // Rotation guard: block rotation if the rotated bounds would exceed the canvas
  const canRotateWithinCanvas = useCallback(
    (tool: DroppedTool, rotation: number) => {
      const { toolWidth, toolHeight } = getToolDimensions(tool);
      const style = getCanvasStyle();
      const canvasWidthPx = parseFloat(style.width);
      const canvasHeightPx = parseFloat(style.height);

      const angle = (rotation * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Conservative rectangle AABB extents for safety
      const rotW = Math.abs(toolWidth * cos) + Math.abs(toolHeight * sin);
      const rotH = Math.abs(toolWidth * sin) + Math.abs(toolHeight * cos);

      const cx = tool.x + toolWidth / 2;
      const cy = tool.y + toolHeight / 2;

      const inchesToPx = (inches: number) => inches * 96;
      const mmToPx = (mm: number) => (mm / 25.4) * 96;

      const GAP_INCHES = 0.25;
      const gapPx = unit === "mm" ? mmToPx(GAP_INCHES * 25.4) : inchesToPx(GAP_INCHES);

      const left = cx - rotW / 2;
      const top = cy - rotH / 2;
      const right = cx + rotW / 2;
      const bottom = cy + rotH / 2;

      return (
        left >= gapPx &&
        top >= gapPx &&
        right <= canvasWidthPx - gapPx &&
        bottom <= canvasHeightPx - gapPx
      );
    },
    [getToolDimensions, getCanvasStyle]
  );

  // handleResize function used by old resize handles (also round to 2 decimals)
  const handleResize = useCallback(
    (toolId: string, newWidth: number, newHeight: number) => {
      props.setDroppedTools((prevTools) =>
        prevTools.map((tool) =>
          tool.id === toolId
            ? {
                ...tool,
                width: Number(newWidth.toFixed(2)),
                length: Number(newHeight.toFixed(2)),
              }
            : tool
        )
      );
    },
    [props.setDroppedTools]
  );

  // Render selection box
  const renderSelectionBox = () => {
    if (!selectionBox?.isSelecting) return null;
    return null;
  };

  // Render overlap notification
  // const renderOverlapNotification = () => {
  //   if (!hasOverlaps) return null;

  //   return (
  //     <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
  //       <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 shadow-lg max-w-sm">
  //         <div className="flex items-start space-x-3">
  //           <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
  //           <div className="flex-1">
  //             <p className="text-sm font-medium text-red-800">
  //               Note: The layout that you have selected is invalid
  //             </p>
  //             <p className="text-xs text-red-600 mt-1">
  //               {overlappingTools.length} tool{overlappingTools.length > 1 ? 's are' : ' is'} overlapping
  //             </p>
  //             <button
  //               onClick={autoFixOverlaps}
  //               className="mt-2 inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-colors"
  //             >
  //               <Check className="w-3 h-3" />
  //               Auto-fix positions
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  React.useEffect(() => {
    if (props.onOverlapChange) {
      props.onOverlapChange(hasOverlaps || hasOutOfBounds);
    }
  }, [hasOverlaps, hasOutOfBounds, props.onOverlapChange]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (props.readOnly) return;

      // If an editable element is focused, don't run global shortcuts
      const target = e.target as HTMLElement | null;
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        (target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)) ||
        (active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.tagName === "SELECT" ||
            active.isContentEditable));

      if (isEditable) {
        // Let inputs handle all keys (typing stays continuous)
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.code === "KeyA") {
        e.preventDefault();
        props.setSelectedTools(droppedTools.map((tool) => tool.id));
      } else if (e.code === "Delete" || e.code === "Backspace") {
        e.preventDefault();
        if (selectedTools.length > 0) {
          handleDeleteSelectedTools();
        }
      }
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTools, handleDeleteSelectedTools, props.readOnly, droppedTools]);

  const [hoveredToolId, setHoveredToolId] = React.useState<string | null>(null);

  return (
    <div className="flex-1 relative bg-gray-100 overflow-hidden">
      {/* Overlap Notification */}
      {/* {renderOverlapNotification()} */}

      {/* Viewport Controls */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={fitToView}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Fit to view"
        >
          <Maximize className="w-4 h-4" />
        </button>
        {/* <button
          onClick={centerCanvas}
          className="p-2 rounded hover:bg-gray-100 transition-colors"
          title="Center canvas"
        >
          <Move className="w-4 h-4" />
        </button> */}
        <div className="text-xs text-center text-gray-500 px-2">
          {Math.round(viewport.zoom * 100)}%
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0"
        style={{
          cursor: getCanvasCursor(),
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleCanvasMouseDown}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Canvas with viewport transform */}
        <div
          ref={canvasRef}
          data-canvas="true"
          className="absolute bg-white rounded-lg shadow-lg"
          style={{
            ...getCanvasStyle(),
            ...getViewportTransform(),
            border: "4px solid #2E6C99",
            boxShadow: (() => {
              const inchesToPx = (inches: number) => inches * 96;
              const mmToPx = (mm: number) => (mm / 25.4) * 96;
              const GAP_INCHES = 0.25;
              const gapPx =
                unit === "mm"
                  ? mmToPx(GAP_INCHES * 25.4)
                  : inchesToPx(GAP_INCHES);
              return `inset 0 0 0 ${gapPx}px #c2c2c2`;
            })(),
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleCanvasClick}
        >
          {/* Preview line for finger cut: first click → live endpoint */}
          {activeTool === "fingercut" &&
            fingerCutStart &&
            fingerCutPreviewEnd &&
            (() => {
              const dx = fingerCutPreviewEnd.x - fingerCutStart.x;
              const dy = fingerCutPreviewEnd.y - fingerCutStart.y;
              const length = Math.max(1, Math.hypot(dx, dy));
              const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
              const cx = fingerCutStart.x + dx / 2;
              const cy = fingerCutStart.y + dy / 2;

              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: cx - length / 2,
                    top: cy,
                    width: length,
                    height: 0,
                    transform: `rotate(${angleDeg}deg)`,
                  }}
                >
                  <div
                    style={{
                      borderTop: "2px dashed var(--primary)",
                    }}
                  />
                  {/* Endpoints */}
                  <div
                    style={{
                      position: "absolute",
                      left: -4,
                      top: -4,
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: "var(--primary)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: -4,
                      top: -4,
                      width: 8,
                      height: 8,
                      borderRadius: 9999,
                      background: "var(--primary)",
                    }}
                  />
                </div>
              );
            })()}

          {/* Canvas dimensions indicator */}
          {!props.suppressSelectionUI && (
            <div className="absolute -top-8 left-0 text-sm text-gray-600 font-medium bg-white px-2 py-1 rounded shadow-sm">
              Canvas: {canvasWidth} × {canvasHeight} {unit}
            </div>
          )}

          {/* UPDATED: Clean Tool Rendering - No Borders */}
          {droppedTools.map((tool) => {
            const { toolWidth, toolHeight } = getToolDimensions(tool);
            const isSelected = selectedTools.includes(tool.id);
            const isPrimarySelection = selectedTool === tool.id;
            const isShape = tool.toolBrand === "SHAPE";
            const isFingerCut = tool.metadata?.isFingerCut;
            const isText =
              tool.toolType === "text" || tool.toolBrand === "TEXT";
            // NEW: Never treat text as overlapping in UI
            const isOverlapping = overlappingTools.includes(tool.id) && !isText;
            const isTooDeep = depthInchesFor(tool) > allowedDepthInches;

            // Helpers for physical → pixel conversion
            const inchesToPx = (inches: number) => inches * 96;
            const mmToPx = (mm: number) => (mm / 25.4) * 96;

            // Calculate opacity and blur values
            const opacity = (tool.opacity || 100) / 100;
            const blurAmount = (tool.smooth || 0) / 10;

            // Maintain a physical 0.25 inch gap between outer and inner vectors
            const GAP_INCHES =
              typeof tool.metadata?.gapInches === "number"
                ? tool.metadata.gapInches
                : 0.5;
            const gapPx =
              tool.unit === "mm"
                ? mmToPx(GAP_INCHES * 25.4)
                : inchesToPx(GAP_INCHES);

            const rawUrl =
              tool.metadata?.contour_image_url ||
              tool.metadata?.outlinesImg ||
              tool.metadata?.imageUrl ||
              tool.image;
            const imgSrc =
              rawUrl && /^https?:\/\//i.test(rawUrl)
                ? `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`
                : rawUrl || "";

            return (
              // Inside the Canvas component, in the map over tools
              <div
                key={tool.id}
                className="absolute select-none group"
                style={{
                  left: tool.x,
                  top: tool.y,
                  transform: `rotate(${tool.rotation}deg) scaleX(${
                    tool.flipHorizontal ? -1 : 1
                  }) scaleY(${tool.flipVertical ? -1 : 1})`,
                  width: `${toolWidth}px`,
                  height: `${toolHeight}px`,
                  cursor: getToolCursor(tool.id),
                  zIndex:
                    isText
                      ? 10000
                      : hoveredToolId === tool.id
                      ? 9999
                      : isFingerCut
                      ? 0
                      : isSelected
                      ? 20
                      : 10,
                }}
                // REMOVED: onMouseDown on wrapper so empty rectangle doesn't grab clicks
                onMouseEnter={() => setHoveredToolId(tool.id)}
                onMouseLeave={() =>
                  setHoveredToolId((prev) => (prev === tool.id ? null : prev))
                }
              >
                {/* Finger Cut Rendering */}
                {isFingerCut ? (
                  <div className="relative w-full h-full">
                    {/* Only the pill is clickable */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: "var(--primary)",
                        borderRadius: `${toolHeight / 2}px`,
                        opacity: (tool.opacity || 100) / 100,
                        filter: `blur(${(tool.smooth || 0) / 10}px)`,
                      }}
                      onMouseDown={(e) => handleToolMouseDown(e, tool.id)}
                    />
                    {/* Endpoint handles (visible when selected, not read-only) */}
                    {isSelected && !props.readOnly && (
                      <>
                        {/* Left end */}
                        <div
                          title="Drag to extend/shorten"
                          className="absolute bg-white border border-blue-500 rounded-full"
                          style={{
                            left: -6,
                            top: toolHeight / 2 - 6,
                            width: 12,
                            height: 12,
                            boxShadow: "0 0 2px rgba(0,0,0,0.3)",
                            cursor: "ew-resize",
                          }}
                          onMouseDown={(e) =>
                            handleFingerCutEndpointDown(e, tool.id, "left")
                          }
                        />
                        {/* Right end */}
                        <div
                          title="Drag to extend/shorten"
                          className="absolute bg-white border border-blue-500 rounded-full"
                          style={{
                            right: -6,
                            top: toolHeight / 2 - 6,
                            width: 12,
                            height: 12,
                            boxShadow: "0 0 2px rgba(0,0,0,0.3)",
                            cursor: "ew-resize",
                          }}
                          onMouseDown={(e) =>
                            handleFingerCutEndpointDown(e, tool.id, "right")
                          }
                        />
                      </>
                    )}
                  </div>
                ) : // Vector double-outline for shapes
                isShape ? (
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${toolWidth} ${toolHeight}`}
                    className="absolute inset-0"
                    style={{ opacity, filter: `blur(${blurAmount}px)`, overflow: 'visible' }}
                    onMouseDown={(e) => handleToolMouseDown(e, tool.id)}
                  >
                    {tool.toolType === "circle" ? (
                      <>
                        {/* Gray gap ring outside the inner circle */}
                        <circle
                          cx={toolWidth / 2}
                          cy={toolHeight / 2}
                          r={Math.max(0, Math.min(toolWidth, toolHeight) / 2 - 1)}
                          fill="none"
                          stroke="#c2c2c2"
                          strokeWidth={gapPx * 2}
                        />
                        {/* Inner circle (solid fill shape) */}
                        <circle
                          cx={toolWidth / 2}
                          cy={toolHeight / 2}
                          r={Math.max(0, Math.min(toolWidth, toolHeight) / 2 - 1)}
                          fill={isOverlapping ? "#f87171" : "#266ca8"}
                          stroke="none"
                        />
                      </>
                    ) : (
                      <>
                        {/* Gray gap ring outside the inner rectangle */}
                        <rect
                          x={1}
                          y={1}
                          width={Math.max(0, toolWidth - 2)}
                          height={Math.max(0, toolHeight - 2)}
                          fill="none"
                          stroke="#c2c2c2"
                          strokeWidth={gapPx * 2}
                        />
                        {/* Inner rectangle (solid fill) */}
                        <rect
                          x={1}
                          y={1}
                          width={Math.max(0, toolWidth - 2)}
                          height={Math.max(0, toolHeight - 2)}
                          fill={isOverlapping ? "#f87171" : "#266ca8"}
                          stroke="none"
                        />
                      </>
                    )}
                  </svg>
                ) : isText ? (
                  <div
                    className="relative w-full h-full border border-gray-300 rounded"
                    style={{ overflow: "hidden" }}
                  >
                    <div
                      className="absolute inset-0 flex items-center"
                      style={{
                        opacity,
                        filter: `blur(${blurAmount}px)`,
                        display: "flex",
                        justifyContent:
                          (tool.textAlign || "center") === "left"
                            ? "flex-start"
                            : (tool.textAlign || "center") === "right"
                            ? "flex-end"
                            : "center",
                      }}
                      onMouseDown={(e) => handleToolMouseDown(e, tool.id)}
                    >
                      <span
                        style={{
                          fontFamily:
                            tool.textFontFamily || "Raleway, sans-serif",
                          fontWeight: tool.textFontWeight || 500,
                          fontSize: `${tool.textFontSizePx ?? 18}px`,
                          color: tool.textColor || "#266ca8",
                          whiteSpace: "pre-wrap",
                          textAlign: tool.textAlign || "center",
                          wordBreak: "break-word",
                        }}
                      >
                        {tool.textContent || "Text"}
                      </span>
                    </div>

                    {/* Resize handles for text tools */}
                    {isSelected && !props.readOnly && (
                      <>
                        <div
                          className="resize-handle absolute bg-white border border-blue-500 rounded-sm"
                          style={{
                            top: -6,
                            left: -6,
                            width: 12,
                            height: 12,
                            cursor: "nw-resize",
                          }}
                          onMouseDown={(e) =>
                            handleResizeStart(e, tool.id, "nw")
                          }
                        />
                        <div
                          className="resize-handle absolute bg-white border border-blue-500 rounded-sm"
                          style={{
                            top: -6,
                            right: -6,
                            width: 12,
                            height: 12,
                            cursor: "ne-resize",
                          }}
                          onMouseDown={(e) =>
                            handleResizeStart(e, tool.id, "ne")
                          }
                        />
                        <div
                          className="resize-handle absolute bg-white border border-blue-500 rounded-sm"
                          style={{
                            bottom: -6,
                            left: -6,
                            width: 12,
                            height: 12,
                            cursor: "sw-resize",
                          }}
                          onMouseDown={(e) =>
                            handleResizeStart(e, tool.id, "sw")
                          }
                        />
                        <div
                          className="resize-handle absolute bg-white border border-blue-500 rounded-sm"
                          style={{
                            bottom: -6,
                            right: -6,
                            width: 12,
                            height: 12,
                            cursor: "se-resize",
                          }}
                          onMouseDown={(e) =>
                            handleResizeStart(e, tool.id, "se")
                          }
                        />
                      </>
                    )}
                  </div>
                ) : (
                  // Regular tool rendering (image)
                  tool.image && (
                    <div className="relative w-full h-full" style={{ overflow: "visible" }}>
                      <img
                        src={imgSrc}
                        crossOrigin="anonymous"
                        alt={tool.name}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          let opaqueBounds:
                            | {
                                left: number;
                                top: number;
                                right: number;
                                bottom: number;
                              }
                            | undefined;
                          let opaquePoints:
                            | { x: number; y: number }[]
                            | undefined;
                          try {
                            const c = document.createElement("canvas");
                            c.width = img.naturalWidth;
                            c.height = img.naturalHeight;
                            const ctx = c.getContext("2d", {
                              willReadFrequently: true,
                            });
                            if (ctx) {
                              ctx.drawImage(img, 0, 0);
                              const data = ctx.getImageData(
                                0,
                                0,
                                c.width,
                                c.height
                              ).data;
                              let minX = c.width,
                                minY = c.height,
                                maxX = -1,
                                maxY = -1;
                              for (let y = 0; y < c.height; y++) {
                                for (let x = 0; x < c.width; x++) {
                                  const a = data[(y * c.width + x) * 4 + 3];
                                  if (a > 64) {
                                    if (x < minX) minX = x;
                                    if (y < minY) minY = y;
                                    if (x > maxX) maxX = x;
                                    if (y > maxY) maxY = y;
                                  }
                                }
                              }
                              if (maxX >= 0 && maxY >= 0) {
                                opaqueBounds = {
                                  left: minX / c.width,
                                  top: minY / c.height,
                                  right: maxX / c.width,
                                  bottom: maxY / c.height,
                                };
                              }
                              const step = Math.max(
                                1,
                                Math.floor(Math.max(c.width, c.height) / 80)
                              );
                              const pts: { x: number; y: number }[] = [];
                              for (let y = 0; y < c.height; y += step) {
                                for (let x = 0; x < c.width; x += step) {
                                  const idx = (y * c.width + x) * 4;
                                  const a = data[idx + 3];
                                  if (a > 64) {
                                    let edge = false;
                                    for (let dy = -1; dy <= 1 && !edge; dy++) {
                                      for (
                                        let dx = -1;
                                        dx <= 1 && !edge;
                                        dx++
                                      ) {
                                        if (dx === 0 && dy === 0) continue;
                                        const nx = x + dx * step;
                                        const ny = y + dy * step;
                                        if (
                                          nx < 0 ||
                                          ny < 0 ||
                                          nx >= c.width ||
                                          ny >= c.height
                                        ) {
                                          edge = true;
                                          continue;
                                        }
                                        const nidx = (ny * c.width + nx) * 4;
                                        const na = data[nidx + 3];
                                        if (na <= 64) edge = true;
                                      }
                                    }
                                    if (edge) {
                                      pts.push({
                                        x: x / c.width,
                                        y: y / c.height,
                                      });
                                      if (pts.length >= 600) break;
                                    }
                                  }
                                }
                                if (pts.length >= 600) break;
                              }
                              if (pts.length > 0) {
                                opaquePoints = pts;
                              }
                            }
                          } catch {}
                          props.setDroppedTools((prev) =>
                            prev.map((t) =>
                              t.id === tool.id
                                ? {
                                    ...t,
                                    metadata: {
                                      ...t.metadata,
                                      naturalWidth: img.naturalWidth,
                                      naturalHeight: img.naturalHeight,
                                      opaqueBounds,
                                      opaquePoints,
                                    },
                                  }
                                : t
                            )
                          );
                        }}
                        className={`absolute left-1/2 top-1/2 object-contain transition-all duration-200 ${
                          isOverlapping ? "brightness-75 saturate-150" : ""
                        }`}
                        style={{
                          width: `${toolWidth + 96}px`,
                          height: `${toolHeight + 96}px`,
                          maxWidth: "none",
                          maxHeight: "none",
                          transform: "translate(-50%, -50%)",
                          opacity,
                          filter: `blur(${blurAmount}px)`,
                        }}
                        draggable={false}
                        onMouseDown={(e) => handleToolMouseDown(e, tool.id)}
                      />
                    </div>
                  )
                )}

                {/* CLEAN: Subtle selection indicator - tight border only */}
                {isSelected && null}

                {/* Minimal hazard indicator (overlap or too-deep) */}
                {isOverlapping && (
                  <div
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center z-30"
                    title={
                      isTooDeep
                        ? "Depth exceeds allowed cut depth (thickness - 0.25 in)"
                        : "Overlapping"
                    }
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                  </div>
                )}

                {/* Delete button - only when selected */}
                {/* {!props.readOnly && isSelected && (
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTool(tool.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )} */}

                {/* Rotation Wheel - show only for primary selected tool */}
                {!props.readOnly &&
                  !props.suppressSelectionUI &&
                  isPrimarySelection &&
                  tool.toolType !== "circle" && (
                    <RotationWheel
                      toolId={tool.id}
                      currentRotation={tool.rotation}
                      onRotationChange={(toolId, rotation) => {
                        props.setDroppedTools((prevTools) =>
                          prevTools.map((t) => (t.id === toolId ? { ...t, rotation } : t))
                        );
                      }}
                      toolWidth={toolWidth}
                      toolHeight={toolHeight}
                      viewportZoom={viewport.zoom}
                      flipHorizontal={tool.flipHorizontal}
                      flipVertical={tool.flipVertical}
                      // NEW: batch rotation updates into single history entry
                      onRotateStart={props.beginInteraction}
                      onRotateEnd={props.endInteraction}
                    />
                  )}

                {/* ENHANCED: Tool info tooltip */}
                {/* <div
                  className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-95 text-white text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm shadow-lg"
                  style={{ zIndex: 9999 }}
                >
                  <div className="text-center space-y-1">
                    {isFingerCut && (
                      <div className="text-gray-400">
                        {`Finger Grip`}
                      </div>
                    )}
                    <div className="text-gray-400">
                      {`Depth: ${Number(tool.depth).toFixed(2)} inches`}
                    </div>
                    {!isShape && tool.toolBrand !== "FINGERCUT" && (
                      <div className="text-gray-400">
                        {`Tool Brand: ${tool.toolBrand}`}
                      </div>
                    )}
                    {!isShape && tool.toolBrand !== "FINGERCUT" && (
                      <div className="text-gray-400">
                        {`Tool Type: ${tool.metadata?.toolType}`}
                      </div>
                    )}
                    {!isShape && tool.toolBrand !== "FINGERCUT" && (
                      <div className="text-gray-400">
                        {`SKU or Part Number: ${tool.metadata?.SKUorPartNumber}`}
                      </div>
                    )}
                    {isShape && !isFingerCut && (
                      <div className="text-yellow-300">
                        {`Size: ${tool.width?.toFixed(1)} × ${tool.length?.toFixed(1)} ${tool.unit}`}
                      </div>
                    )}
                    {isOverlapping && (
                      <div className="text-red-300 font-medium">
                        {`⚠ Overlapping`}
                      </div>
                    )}
                    {isSelected && selectedTools.length > 1 && (
                      <div className="text-blue-300">
                        {`${selectedTools.length} tools selected`}
                      </div>
                    )}
                  </div>
                </div> */}
              </div>
            );
          })}

          {/* Selection Box */}
          {renderSelectionBox()}

          {/* Empty canvas message */}
          {droppedTools.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {props.readOnly
                  ? "No tools to display in this layout"
                  : "Drag tools from the sidebar to start designing"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {`Canvas Size: ${canvasWidth} × ${canvasHeight} ${unit}`}
              </p>
              {!props.readOnly && (
                <>
                  <p className="text-gray-400 text-xs mt-1">
                    Use <span className="font-semibold">Cursor</span> to select
                    • <span className="font-semibold">Hand</span> to pan •{" "}
                    <span className="font-semibold">Middle Mouse</span> to pan
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Hold <span className="font-semibold">Ctrl/Cmd</span> to
                    multi-select • <span className="font-semibold">Scroll</span>{" "}
                    to zoom
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm text-gray-600 shadow-lg">
          {`Zoom: ${Math.round(viewport.zoom * 100)}%`}
          {activeTool === "hand" && (
            <div className="text-xs text-gray-500 mt-1">
              {`Drag to pan • Scroll to zoom`}
            </div>
          )}
        </div>

        {/* Layout Status Indicator */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm shadow-lg">
          <div
            className={`flex items-center space-x-2 ${
              isLayoutInvalid ? "text-red-600" : "text-green-600"
            }`}
          >
            {isLayoutInvalid ? (
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
          {(hasOverlaps || hasOutOfBounds) && (
            <div className="text-xs text-gray-600 mt-1">
              {overlappingTools.length} overlapping tool{overlappingTools.length > 1 ? "s" : ""}
              {hasOutOfBounds && (
                <> • {outOfBoundsTools.length} outside tool{outOfBoundsTools.length > 1 ? "s" : ""}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;