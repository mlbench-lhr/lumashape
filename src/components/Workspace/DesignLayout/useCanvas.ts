import { useRef, useState, useEffect, useCallback } from 'react';
import { DroppedTool, Tool } from './types';

interface UseCanvasProps {
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
  activeTool: 'cursor' | 'hand' | 'box' | 'fingercut';
  setActiveTool: (tool: 'cursor' | 'hand' | 'box' | 'fingercut') => void;
  readOnly?: boolean;
  beginInteraction?: () => void;
  endInteraction?: () => void;
}

export const useCanvas = ({
  droppedTools,
  setDroppedTools,
  selectedTool,
  setSelectedTool,
  selectedTools,
  setSelectedTools,
  onSave,
  canvasWidth,
  canvasHeight,
  unit,
  activeTool,
  setActiveTool,
  readOnly,
  beginInteraction,
  endInteraction,
}: UseCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [initialPositions, setInitialPositions] = useState<Record<string, { x: number; y: number }>>({});

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizingToolId, setResizingToolId] = useState<string | null>(null);
  const [initialResizeData, setInitialResizeData] = useState<{
    toolWidth: number;
    toolHeight: number;
    toolX: number;
    toolY: number;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // Overlap detection state
  const [hasOverlaps, setHasOverlaps] = useState(false);
  const [overlappingTools, setOverlappingTools] = useState<string[]>([]);
  // Out-of-bounds detection state
  const [hasOutOfBounds, setHasOutOfBounds] = useState(false);
  const [outOfBoundsTools, setOutOfBoundsTools] = useState<string[]>([]);

  // Finger Cut: two-click drawing start point and endpoint-resize state
  const [fingerCutStart, setFingerCutStart] = useState<{ x: number; y: number } | null>(null);
  const [fingerCutDrag, setFingerCutDrag] = useState<{
    toolId: string;
    end: 'left' | 'right';
    anchorX: number;
    anchorY: number;
    heightPx: number;
    angleRad: number;
  } | null>(null);

  const [fingerCutPreviewEnd, setFingerCutPreviewEnd] = useState<{ x: number; y: number } | null>(null);

  // Add a version guard to prevent stale async results from overriding current state
  const detectionVersionRef = useRef(0);

  // Viewport state (Figma-style navigation)
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1
  });

  // Caches for loaded images
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const imageLoadPromisesRef = useRef<Map<string, Promise<HTMLImageElement>>>(new Map());
  // Offscreen canvases per image src for pixel hit-tests
  const imageCanvasCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const getImageUrl = useCallback((tool: DroppedTool): string | null => {
    const rawUrl = (tool as Tool).image || tool.metadata?.imageUrl || null;
    if (!rawUrl) return null;
    // Proxy only absolute external URLs; leave local or relative paths untouched
    if (/^https?:\/\//i.test(rawUrl)) {
      try {
        return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
      } catch {
        return rawUrl;
      }
    }
    return rawUrl;
  }, []);

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    if (imageCacheRef.current.has(url)) {
      return Promise.resolve(imageCacheRef.current.get(url)!);
    }
    if (imageLoadPromisesRef.current.has(url)) {
      return imageLoadPromisesRef.current.get(url)!;
    }
    const p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCacheRef.current.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
    imageLoadPromisesRef.current.set(url, p);
    return p;
  }, []);

  const DPI = 96;

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const mmToPx = useCallback((mm: number) => {
    // Use consistent DPI for all conversions
    const DPI = 96;
    return (mm / 25.4) * DPI;
  }, []);

  const inchesToPx = useCallback((inches: number) => {
    const DPI = 96;
    return inches * DPI;
  }, []);

  // Convert canvas dimensions to pixels for styling
  const getCanvasStyle = useCallback(() => {
    const widthPx = unit === 'mm' ? mmToPx(canvasWidth) : inchesToPx(canvasWidth);
    const heightPx = unit === 'mm' ? mmToPx(canvasHeight) : inchesToPx(canvasHeight);

    return {
      width: `${Math.max(100, widthPx)}px`,
      height: `${Math.max(100, heightPx)}px`,
    };
  }, [canvasWidth, canvasHeight, unit, mmToPx, inchesToPx]);

  // Get canvas boundaries in pixels
  const getCanvasBounds = useCallback(() => {
    const style = getCanvasStyle();
    return {
      width: parseFloat(style.width),   // precise width; no integer truncation
      height: parseFloat(style.height)  // precise height; no integer truncation
    };
  }, [getCanvasStyle]);

  // Get viewport transform for canvas and tools
  const getViewportTransform = useCallback(() => {
    return {
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      transformOrigin: '0 0'
    };
  }, [viewport]);

  // Tool-specific dimensions based on tool type
  const getToolDimensions = useCallback((tool: DroppedTool) => {
    // Use explicit width/length for shapes so resizing reflects visually
    if (tool.toolBrand === 'SHAPE') {
      const widthPx =
        tool.unit === 'mm'
          ? mmToPx(tool.width || 0)
          : inchesToPx(tool.width || 0);
      const heightPx =
        tool.unit === 'mm'
          ? mmToPx(tool.length || 0)
          : inchesToPx(tool.length || 0);

      return {
        toolWidth: Math.max(20, widthPx),
        toolHeight: Math.max(20, heightPx),
      };
    }

    // NEW: Text tool sizing from stored units
    const isText = tool.toolType === 'text' || tool.toolBrand === 'TEXT';
    if (isText) {
      const widthPx =
        typeof tool.width === 'number'
          ? (tool.unit === 'mm' ? mmToPx(tool.width) : inchesToPx(tool.width))
          : 200; // sensible default
      const heightPx =
        typeof tool.length === 'number'
          ? (tool.unit === 'mm' ? mmToPx(tool.length) : inchesToPx(tool.length))
          : 60; // sensible default

      return {
        toolWidth: Math.max(20, widthPx),
        toolHeight: Math.max(20, heightPx),
      };
    }

    if (tool.metadata?.isFingerCut) {
      // Legacy heuristic: if values look like px (huge in inches), treat them as px
      const looksLikePx =
        (tool.unit === 'inches' && ((tool.width ?? 0) > 50 || (tool.length ?? 0) > 2)) ||
        (tool.unit === 'mm' && ((tool.width ?? 0) > 1000 || (tool.length ?? 0) > 50));

      if (looksLikePx) {
        const widthPx = Math.max(10, typeof tool.width === 'number' ? tool.width : 50);
        const heightPx = Math.max(10, typeof tool.length === 'number' ? tool.length : inchesToPx(0.5));
        return { toolWidth: widthPx, toolHeight: heightPx };
      }

      // Normal path: convert stored physical units to px
      const widthPx =
        tool.unit === 'mm'
          ? mmToPx(tool.width || 0)
          : inchesToPx(tool.width || 0);
      const defaultThicknessInches = 0.5;
      const heightPx =
        tool.unit === 'mm'
          ? mmToPx((tool.length ?? defaultThicknessInches * 25.4))
          : inchesToPx((tool.length ?? defaultThicknessInches));

      return { toolWidth: Math.max(10, widthPx), toolHeight: Math.max(10, heightPx) };
    }

    // Prefer real physical dimensions only when no explicit image length is present
    if (
      !tool.metadata?.length &&
      typeof tool.realWidth === 'number' &&
      typeof tool.realHeight === 'number' &&
      tool.realWidth > 0 &&
      tool.realHeight > 0
    ) {
      const widthPx =
        tool.unit === 'mm' ? mmToPx(tool.realWidth) : inchesToPx(tool.realWidth);
      const heightPx =
        tool.unit === 'mm' ? mmToPx(tool.realHeight) : inchesToPx(tool.realHeight);

      return {
        toolWidth: Math.max(20, widthPx),
        toolHeight: Math.max(20, heightPx),
      };
    }

    // Image tools: use metadata length (physical height) + aspect ratio
    if (tool.metadata?.length) {
      const len = tool.metadata.length;
      const toolHeightPx =
        tool.unit === 'mm'
          ? mmToPx(len)
          : inchesToPx(len);

      // Default aspect ratio if natural dimensions are missing
      let aspectRatio = 1.6;

      if (
        tool.metadata?.naturalWidth &&
        tool.metadata?.naturalHeight &&
        tool.metadata.naturalWidth > 0 &&
        tool.metadata.naturalHeight > 0
      ) {
        aspectRatio = tool.metadata.naturalWidth / tool.metadata.naturalHeight;
      }

      const toolWidthPx = toolHeightPx * aspectRatio;

      return {
        toolWidth: Math.max(20, toolWidthPx),
        toolHeight: Math.max(20, toolHeightPx),
      };
    }

    // Fallback
    return {
      toolWidth: tool.width || 50,
      toolHeight: tool.length || 50,
    };
  }, [mmToPx, inchesToPx]);

  // NEW: Rotated axis-aligned bounding box for accurate overlap regions
  const getTransformedAABB = useCallback((tool: DroppedTool) => {
    const { toolWidth: w, toolHeight: h } = getToolDimensions(tool);
    const cx = tool.x + w / 2;
    const cy = tool.y + h / 2;
    const angle = ((tool.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotW = Math.abs(w * cos) + Math.abs(h * sin);
    const rotH = Math.abs(w * sin) + Math.abs(h * cos);
    return {
      left: cx - rotW / 2,
      top: cy - rotH / 2,
      right: cx + rotW / 2,
      bottom: cy + rotH / 2,
      width: rotW,
      height: rotH,
      cx,
      cy,
    };
  }, [getToolDimensions]);

  const getToolOverlapRect = useCallback((tool: DroppedTool) => {
    const { toolWidth: w, toolHeight: h } = getToolDimensions(tool);

    const isText = tool.toolType === 'text' || tool.toolBrand === 'TEXT';
    const isFingerCut = tool.id.startsWith('cylinder_') || tool.name === 'Finger Cut' || tool.metadata?.isFingerCut;
    const isShape = tool.toolBrand === 'SHAPE' && !tool.metadata?.isFingerCut;

    const shouldUseVisualImageSize = Boolean(tool.image) && !isShape && !isFingerCut && !isText;
    const padPx = shouldUseVisualImageSize ? 96 : 0;

    return {
      x: tool.x - padPx / 2,
      y: tool.y - padPx / 2,
      w: w + padPx,
      h: h + padPx,
      padPx,
    };
  }, [getToolDimensions]);

  const getOverlapTransformedAABB = useCallback((tool: DroppedTool) => {
    const { x, y, w, h } = getToolOverlapRect(tool);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const angle = ((tool.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rotW = Math.abs(w * cos) + Math.abs(h * sin);
    const rotH = Math.abs(w * sin) + Math.abs(h * cos);
    return {
      left: cx - rotW / 2,
      top: cy - rotH / 2,
      right: cx + rotW / 2,
      bottom: cy + rotH / 2,
      width: rotW,
      height: rotH,
      cx,
      cy,
    };
  }, [getToolOverlapRect]);



  // Constrain tool position to inner canvas using pixel-aware rotated half-extents of opaque content (opaquePoints/opaqueBounds), fallback to full rect
  const constrainToCanvas = useCallback((tool: DroppedTool, x: number, y: number) => {
    const { toolWidth: w, toolHeight: h } = getToolDimensions(tool);
    const { width: canvasWidthPx, height: canvasHeightPx } = getCanvasBounds();
    const GAP_INCHES = 0.25;
    const gapPx = unit === 'mm' ? mmToPx(GAP_INCHES * 25.4) : inchesToPx(GAP_INCHES);
    const innerWidth = Math.max(0, canvasWidthPx - 2 * gapPx);
    const innerHeight = Math.max(0, canvasHeightPx - 2 * gapPx);

    const angle = ((tool.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const wHalf = w / 2;
    const hHalf = h / 2;

    // Compute letterbox-aware drawing region (object-fit: contain) for images
    const nw = tool.metadata?.naturalWidth || 0;
    const nh = tool.metadata?.naturalHeight || 0;
    const ar = nw > 0 && nh > 0 ? nw / nh : w / h;
    let drawW: number, drawH: number;
    if (w / h >= ar) {
      drawH = h;
      drawW = drawH * ar;
    } else {
      drawW = w;
      drawH = drawW / ar;
    }
    const lbx = (w - drawW) / 2;
    const lby = (h - drawH) / 2;

    let halfX: number;
    let halfY: number;

    // Prefer precise edge points if available (normalized 0..1 in content rect)
    const pts = tool.metadata?.opaquePoints;
    if (pts && pts.length) {
      let maxX = 0, maxY = 0;
      for (let i = 0; i < pts.length; i++) {
        const px = lbx + pts[i].x * drawW - wHalf;
        const py = lby + pts[i].y * drawH - hHalf;
        const xr = px * cos - py * sin;
        const yr = px * sin + py * cos;
        const ax = Math.abs(xr);
        const ay = Math.abs(yr);
        if (ax > maxX) maxX = ax;
        if (ay > maxY) maxY = ay;
      }
      halfX = maxX;
      halfY = maxY;
    } else {
      const b = tool.metadata?.opaqueBounds;
      if (b) {
        // b is normalized [0..1] in content space; compute rotated half extents + offset from center
        const left = lbx + b.left * drawW;
        const right = lbx + b.right * drawW;
        const top = lby + b.top * drawH;
        const bottom = lby + b.bottom * drawH;
        const rectHalfW = Math.max(0, (right - left) / 2);
        const rectHalfH = Math.max(0, (bottom - top) / 2);
        const cxContent = (left + right) / 2;
        const cyContent = (top + bottom) / 2;
        const dx = cxContent - wHalf;
        const dy = cyContent - hHalf;
        const xOff = Math.abs(dx * cos - dy * sin);
        const yOff = Math.abs(dx * sin + dy * cos);
        halfX = xOff + (Math.abs(rectHalfW * cos) + Math.abs(rectHalfH * sin));
        halfY = yOff + (Math.abs(rectHalfW * sin) + Math.abs(rectHalfH * cos));
      } else {
        halfX = (Math.abs(w * cos) + Math.abs(h * sin)) / 2;
        halfY = (Math.abs(w * sin) + Math.abs(h * cos)) / 2;
      }
    }

    if (halfX > innerWidth / 2) {
      x = gapPx + innerWidth / 2 - wHalf;
    }
    if (halfY > innerHeight / 2) {
      y = gapPx + innerHeight / 2 - hHalf;
    }

    const cx = x + wHalf;
    const cy = y + hHalf;
    const minCx = gapPx + halfX;
    const maxCx = canvasWidthPx - gapPx - halfX;
    const minCy = gapPx + halfY;
    const maxCy = canvasHeightPx - gapPx - halfY;

    const constrainedCx = Math.max(minCx, Math.min(cx, maxCx));
    const constrainedCy = Math.max(minCy, Math.min(cy, maxCy));
    return { x: constrainedCx - wHalf, y: constrainedCy - hHalf };
  }, [getToolDimensions, getCanvasBounds, unit, mmToPx, inchesToPx]);

  // Check if two tools overlap (AABB sync, used elsewhere)
  const doToolsOverlap = useCallback((tool1: DroppedTool, tool2: DroppedTool) => {
    // Bypass overlap check if either tool is a cylinder
    const isTool1Cylinder = tool1.id.startsWith('cylinder_') || tool1.name === 'Finger Cut';
    const isTool2Cylinder = tool2.id.startsWith('cylinder_') || tool2.name === 'Finger Cut';
    // NEW: Bypass overlap check for text tools
    const isTool1Text = tool1.toolType === 'text' || tool1.toolBrand === 'TEXT';
    const isTool2Text = tool2.toolType === 'text' || tool2.toolBrand === 'TEXT';

    if (isTool1Cylinder || isTool2Cylinder || isTool1Text || isTool2Text) {
      return false; // No overlap for cylinders or text
    }

    const a1 = getOverlapTransformedAABB(tool1);
    const a2 = getOverlapTransformedAABB(tool2);

    const gapInchesRaw1 = typeof tool1.metadata?.gapInches === 'number' ? tool1.metadata.gapInches : undefined;
    const gapInchesRaw2 = typeof tool2.metadata?.gapInches === 'number' ? tool2.metadata.gapInches : undefined;
    const gapInches1 = gapInchesRaw1 === 0.5 ? 0.25 : (gapInchesRaw1 ?? 0.25);
    const gapInches2 = gapInchesRaw2 === 0.5 ? 0.25 : (gapInchesRaw2 ?? 0.25);
    const gapPx1 = tool1.toolBrand === 'SHAPE' ? (tool1.unit === 'mm' ? mmToPx(gapInches1 * 25.4) : inchesToPx(gapInches1)) : 0;
    const gapPx2 = tool2.toolBrand === 'SHAPE' ? (tool2.unit === 'mm' ? mmToPx(gapInches2 * 25.4) : inchesToPx(gapInches2)) : 0;

    const a1e = { left: a1.left - gapPx1, top: a1.top - gapPx1, right: a1.right + gapPx1, bottom: a1.bottom + gapPx1 };
    const a2e = { left: a2.left - gapPx2, top: a2.top - gapPx2, right: a2.right + gapPx2, bottom: a2.bottom + gapPx2 };

    const buffer = 2;

    return !(
      a1e.right <= a2e.left + buffer ||
      a2e.right <= a1e.left + buffer ||
      a1e.bottom <= a2e.top + buffer ||
      a2e.bottom <= a1e.top + buffer
    );
  }, [getOverlapTransformedAABB]);

  // Fast AABB pre-check (used for quick rejection and fallback)
  const doToolsAABBOverlap = useCallback((tool1: DroppedTool, tool2: DroppedTool) => {
    const isTool1Cylinder = tool1.id.startsWith('cylinder_') || tool1.name === 'Finger Cut';
    const isTool2Cylinder = tool2.id.startsWith('cylinder_') || tool2.name === 'Finger Cut';
    // NEW: Bypass for text tools
    const isTool1Text = tool1.toolType === 'text' || tool1.toolBrand === 'TEXT';
    const isTool2Text = tool2.toolType === 'text' || tool2.toolBrand === 'TEXT';
    if (isTool1Cylinder || isTool2Cylinder || isTool1Text || isTool2Text) return false;

    const a1 = getOverlapTransformedAABB(tool1);
    const a2 = getOverlapTransformedAABB(tool2);

    const gapInchesRaw1 = typeof tool1.metadata?.gapInches === 'number' ? tool1.metadata.gapInches : undefined;
    const gapInchesRaw2 = typeof tool2.metadata?.gapInches === 'number' ? tool2.metadata.gapInches : undefined;
    const gapInches1 = gapInchesRaw1 === 0.5 ? 0.25 : (gapInchesRaw1 ?? 0.25);
    const gapInches2 = gapInchesRaw2 === 0.5 ? 0.25 : (gapInchesRaw2 ?? 0.25);
    const gapPx1 = tool1.toolBrand === 'SHAPE' ? (tool1.unit === 'mm' ? mmToPx(gapInches1 * 25.4) : inchesToPx(gapInches1)) : 0;
    const gapPx2 = tool2.toolBrand === 'SHAPE' ? (tool2.unit === 'mm' ? mmToPx(gapInches2 * 25.4) : inchesToPx(gapInches2)) : 0;

    const a1e = { left: a1.left - gapPx1, top: a1.top - gapPx1, right: a1.right + gapPx1, bottom: a1.bottom + gapPx1 };
    const a2e = { left: a2.left - gapPx2, top: a2.top - gapPx2, right: a2.right + gapPx2, bottom: a2.bottom + gapPx2 };

    const buffer = 2;
    return !(
      a1e.right <= a2e.left + buffer ||
      a2e.right <= a1e.left + buffer ||
      a1e.bottom <= a2e.top + buffer ||
      a2e.bottom <= a1e.top + buffer
    );
  }, [getOverlapTransformedAABB]);

  // Pixel-perfect overlap using alpha masks and transforms
  const doToolsOverlapPixel = useCallback(async (tool1: DroppedTool, tool2: DroppedTool) => {
    // Skip cylinders (non-rectangular helper visual)
    const isTool1Cylinder = tool1.id.startsWith('cylinder_') || tool1.name === 'Finger Cut';
    const isTool2Cylinder = tool2.id.startsWith('cylinder_') || tool2.name === 'Finger Cut';
    // NEW: Bypass for text tools
    const isTool1Text = tool1.toolType === 'text' || tool1.toolBrand === 'TEXT';
    const isTool2Text = tool2.toolType === 'text' || tool2.toolBrand === 'TEXT';
    if (isTool1Cylinder || isTool2Cylinder || isTool1Text || isTool2Text) return false;

    // Quick reject using rotated AABBs
    if (!doToolsAABBOverlap(tool1, tool2)) return false;

    // Client-only guard
    if (typeof document === 'undefined') return doToolsAABBOverlap(tool1, tool2);

    const url1 = getImageUrl(tool1);
    const url2 = getImageUrl(tool2);
    if (!url1 || !url2) return doToolsAABBOverlap(tool1, tool2);

    // Load images
    let img1: HTMLImageElement, img2: HTMLImageElement;
    try {
      [img1, img2] = await Promise.all([loadImage(url1), loadImage(url2)]);
    } catch {
      return doToolsAABBOverlap(tool1, tool2);
    }

    const r1 = getToolOverlapRect(tool1);
    const r2 = getToolOverlapRect(tool2);

    const w1 = r1.w;
    const h1 = r1.h;
    const w2 = r2.w;
    const h2 = r2.h;

    // Compute bounding overlap region using rotated AABBs (expanded by shape gap)
    const a1o = getOverlapTransformedAABB(tool1);
    const a2o = getOverlapTransformedAABB(tool2);
    const gapInchesRaw1 = typeof tool1.metadata?.gapInches === 'number' ? tool1.metadata.gapInches : undefined;
    const gapInchesRaw2 = typeof tool2.metadata?.gapInches === 'number' ? tool2.metadata.gapInches : undefined;
    const gapInches1 = gapInchesRaw1 === 0.5 ? 0.25 : (gapInchesRaw1 ?? 0.25);
    const gapInches2 = gapInchesRaw2 === 0.5 ? 0.25 : (gapInchesRaw2 ?? 0.25);
    const gapPx1 = tool1.toolBrand === 'SHAPE' ? (tool1.unit === 'mm' ? mmToPx(gapInches1 * 25.4) : inchesToPx(gapInches1)) : 0;
    const gapPx2 = tool2.toolBrand === 'SHAPE' ? (tool2.unit === 'mm' ? mmToPx(gapInches2 * 25.4) : inchesToPx(gapInches2)) : 0;
    const a1 = { left: a1o.left - gapPx1, top: a1o.top - gapPx1, right: a1o.right + gapPx1, bottom: a1o.bottom + gapPx1 };
    const a2 = { left: a2o.left - gapPx2, top: a2o.top - gapPx2, right: a2o.right + gapPx2, bottom: a2o.bottom + gapPx2 };
    const left = Math.max(a1.left, a2.left);
    const top = Math.max(a1.top, a2.top);
    const right = Math.min(a1.right, a2.right);
    const bottom = Math.min(a1.bottom, a2.bottom);
    const ow = Math.floor(right - left);
    const oh = Math.floor(bottom - top);

    if (ow <= 0 || oh <= 0) return false;
    // Avoid extremely large processing
    if (ow * oh > 1_000_000) return doToolsAABBOverlap(tool1, tool2);

    const off = document.createElement('canvas');
    off.width = Math.max(1, ow);
    off.height = Math.max(1, oh);
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return doToolsAABBOverlap(tool1, tool2);

    const drawTool = (tool: DroppedTool, img: HTMLImageElement, tw: number, th: number) => {
      ctx.save();

      const { x, y } = getToolOverlapRect(tool);
      const cxTool = x + tw / 2;
      const cyTool = y + th / 2;

      ctx.translate(cxTool - left, cyTool - top);
      const angle = (tool.rotation || 0) * Math.PI / 180;
      ctx.rotate(angle);
      ctx.scale(tool.flipHorizontal ? -1 : 1, tool.flipVertical ? -1 : 1);
      ctx.translate(-tw / 2, -th / 2);

      const isShape = tool.toolBrand === 'SHAPE' && !tool.metadata?.isFingerCut;
      if (isShape) {
        const gapInchesRaw = typeof tool.metadata?.gapInches === 'number' ? tool.metadata.gapInches : undefined;
        const gapInches = gapInchesRaw === 0.5 ? 0.25 : (gapInchesRaw ?? 0.25);
        const gapPx = tool.unit === 'mm' ? mmToPx(gapInches * 25.4) : inchesToPx(gapInches);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        if (tool.toolType === 'circle') {
          const r = Math.min(tw, th) / 2 + gapPx;
          ctx.beginPath();
          ctx.arc(tw / 2, th / 2, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-gapPx, -gapPx, tw + 2 * gapPx, th + 2 * gapPx);
        }
        ctx.restore();
        return;
      }

      const ar = img.naturalWidth > 0 && img.naturalHeight > 0 ? (img.naturalWidth / img.naturalHeight) : (tw / th);
      let drawW: number, drawH: number;
      if (tw / th >= ar) {
        drawH = th;
        drawW = drawH * ar;
      } else {
        drawW = tw;
        drawH = drawW / ar;
      }
      const dx = (tw - drawW) / 2;
      const dy = (th - drawH) / 2;

      ctx.globalAlpha = (tool.opacity ?? 100) / 100;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();
    };

    try {
      // First: draw tool1
      drawTool(tool1, img1, w1, h1);
      // Composite to intersection with tool2
      ctx.globalCompositeOperation = 'source-in';
      drawTool(tool2, img2, w2, h2);

      const data = ctx.getImageData(0, 0, off.width, off.height).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 10) {
          return true; // any intersecting non-transparent pixels
        }
      }
      return false;
    } catch {
      // CORS-tainted canvas or other errors: fallback
      return doToolsAABBOverlap(tool1, tool2);
    }
  }, [getOverlapTransformedAABB, getToolOverlapRect, doToolsAABBOverlap, getImageUrl, loadImage, mmToPx, inchesToPx]);

  // Detect overlaps (async, pixel-perfect)
  const detectOverlaps = useCallback(async (): Promise<string[]> => {
    const overlaps = new Set<string>();

    for (let i = 0; i < droppedTools.length; i++) {
      for (let j = i + 1; j < droppedTools.length; j++) {
        const t1 = droppedTools[i];
        const t2 = droppedTools[j];
        const t1IsText = t1.toolType === 'text' || t1.toolBrand === 'TEXT';
        const t2IsText = t2.toolType === 'text' || t2.toolBrand === 'TEXT';
        if (t1IsText || t2IsText) continue;
        if (await doToolsOverlapPixel(t1, t2)) {
          overlaps.add(t1.id);
          overlaps.add(t2.id);
        }
      }
    }

    return Array.from(overlaps);
  }, [droppedTools, doToolsOverlapPixel]);

  // Detect tools touching gray boundary or outside inner canvas
  const detectOutOfBounds = useCallback((): string[] => {
    const { width: canvasWidthPx, height: canvasHeightPx } = getCanvasBounds();
    const GAP_INCHES = 0.25;
    const gapPx = unit === 'mm' ? mmToPx(GAP_INCHES * 25.4) : inchesToPx(GAP_INCHES);
    const innerLeft = gapPx;
    const innerTop = gapPx;
    const innerRight = canvasWidthPx - gapPx;
    const innerBottom = canvasHeightPx - gapPx;
    const buffer = 1;

    const ids: string[] = [];
    for (let i = 0; i < droppedTools.length; i++) {
      const tool = droppedTools[i];
      const r = getToolOverlapRect(tool);
      const w = r.w;
      const h = r.h;
      const wHalf = w / 2;
      const hHalf = h / 2;

      const nw = tool.metadata?.naturalWidth || 0;
      const nh = tool.metadata?.naturalHeight || 0;
      const ar = nw > 0 && nh > 0 ? nw / nh : w / h;
      let drawW: number, drawH: number;
      if (w / h >= ar) {
        drawH = h;
        drawW = drawH * ar;
      } else {
        drawW = w;
        drawH = drawW / ar;
      }
      const lbx = (w - drawW) / 2;
      const lby = (h - drawH) / 2;

      const angle = ((tool.rotation || 0) * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const mapToWorld = (localX: number, localY: number) => {
        const px = lbx + localX - wHalf;
        const py = lby + localY - hHalf;
        const xr = px * cos - py * sin;
        const yr = px * sin + py * cos;
        return { x: r.x + wHalf + xr, y: r.y + hHalf + yr };
      };

      let outside = false;
      const pts = tool.metadata?.opaquePoints;
      if (pts && pts.length) {
        const stride = Math.max(1, Math.floor(pts.length / 200));
        for (let k = 0; k < pts.length; k += stride) {
          const p = mapToWorld(pts[k].x * drawW, pts[k].y * drawH);
          if (
            p.x < innerLeft - buffer ||
            p.x > innerRight + buffer ||
            p.y < innerTop - buffer ||
            p.y > innerBottom + buffer
          ) { outside = true; break; }
        }
      } else if (tool.metadata?.opaqueBounds) {
        const b = tool.metadata.opaqueBounds;
        const corners = [
          { x: b.left * drawW, y: b.top * drawH },
          { x: b.right * drawW, y: b.top * drawH },
          { x: b.right * drawW, y: b.bottom * drawH },
          { x: b.left * drawW, y: b.bottom * drawH },
        ];
        for (let c = 0; c < corners.length; c++) {
          const p = mapToWorld(corners[c].x, corners[c].y);
          if (
            p.x < innerLeft - buffer ||
            p.x > innerRight + buffer ||
            p.y < innerTop - buffer ||
            p.y > innerBottom + buffer
          ) { outside = true; break; }
        }
      } else {
        const a0 = getOverlapTransformedAABB(tool);
        const gapInchesRaw = typeof tool.metadata?.gapInches === 'number' ? tool.metadata.gapInches : undefined;
        const gapInches = gapInchesRaw === 0.5 ? 0.25 : (gapInchesRaw ?? 0.25);
        const gapPxShape = tool.toolBrand === 'SHAPE' && !tool.metadata?.isFingerCut ? (unit === 'mm' ? mmToPx(gapInches * 25.4) : inchesToPx(gapInches)) : 0;
        const a = { left: a0.left - gapPxShape, top: a0.top - gapPxShape, right: a0.right + gapPxShape, bottom: a0.bottom + gapPxShape };
        if (
          a.left < innerLeft - buffer ||
          a.top < innerTop - buffer ||
          a.right > innerRight + buffer ||
          a.bottom > innerBottom + buffer
        ) outside = true;
      }

      if (outside) ids.push(tool.id);
    }
    return ids;
  }, [droppedTools, getToolOverlapRect, getOverlapTransformedAABB, getCanvasBounds, unit, mmToPx, inchesToPx]);

  // Run overlap detection when tools change (guard against stale results)
  useEffect(() => {
    const version = ++detectionVersionRef.current;
    (async () => {
      const overlaps = await detectOverlaps();
      if (version === detectionVersionRef.current) {
        setOverlappingTools(overlaps);
        setHasOverlaps(overlaps.length > 0);
      }
    })();
  }, [detectOverlaps]);

  // Run out-of-bounds detection when tools or canvas change
  useEffect(() => {
    const ids = detectOutOfBounds();
    setOutOfBoundsTools(ids);
    setHasOutOfBounds(ids.length > 0);
  }, [detectOutOfBounds]);

  // Find non-overlapping position for a tool
  const findNonOverlappingPosition = useCallback((
    tool: DroppedTool,
    existingTools: DroppedTool[],
    startX?: number,
    startY?: number
  ) => {
    const isTextTool = tool.toolType === 'text' || tool.toolBrand === 'TEXT';

    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const { width: canvasWidthPx, height: canvasHeightPx } = getCanvasBounds();
    const maxCanvasWidth = Math.max(0, canvasWidthPx - toolWidth);
    const maxCanvasHeight = Math.max(0, canvasHeightPx - toolHeight);

    let x = Math.max(0, Math.min(startX ?? tool.x, maxCanvasWidth));
    let y = Math.max(0, Math.min(startY ?? tool.y, maxCanvasHeight));

    if (isTextTool) {
      return { x, y };
    }

    const step = 20;
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const testTool = { ...tool, x, y };
      const hasOverlap = existingTools.some(existingTool =>
        existingTool.id !== tool.id && doToolsOverlap(testTool, existingTool)
      );

      if (!hasOverlap) {
        return { x, y };
      }

      const spiralIndex = Math.floor(attempts / 4);
      const direction = attempts % 4;

      switch (direction) {
        case 0:
          x = Math.min(x + step * (spiralIndex + 1), maxCanvasWidth);
          break;
        case 1:
          y = Math.min(y + step * (spiralIndex + 1), maxCanvasHeight);
          break;
        case 2:
          x = Math.max(x - step * (spiralIndex + 1), 0);
          break;
        case 3:
          y = Math.max(y - step * (spiralIndex + 1), 0);
          break;
      }

      attempts++;
    }

    return { x, y };
  }, [getToolDimensions, getCanvasBounds, doToolsOverlap]);

  // Enhanced thickness calculation for 3D effect
  const getShadowOffset = useCallback((tool: DroppedTool) => {
    const { depth, unit: toolUnit } = tool;

    if (toolUnit === 'mm') {
      if (depth <= 12.7) return 8;
      if (depth <= 25.4) return 16;
      return 24;
    } else {
      if (depth <= 0.5) return 8;
      if (depth <= 1.0) return 16;
      return 24;
    }
  }, []);

  // Convert screen coordinates to canvas coordinates (accounting for viewport)
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    // FIX: rect already includes the transform translate; only divide by zoom
    const canvasX = (screenX - rect.left) / viewport.zoom;
    const canvasY = (screenY - rect.top) / viewport.zoom;

    return { x: canvasX, y: canvasY };
  }, [viewport]);

  // Convert canvas coordinates to screen coordinates
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    // FIX: rect already includes translate; don’t add viewport.x/y again
    const screenX = canvasX * viewport.zoom + rect.left;
    const screenY = canvasY * viewport.zoom + rect.top;

    return { x: screenX, y: screenY };
  }, [viewport]);

  // Pixel-accurate hit test for images (only count opaque pixels)
  const isHitOnImagePixel = useCallback((e: React.MouseEvent, tool: DroppedTool) => {
    const targetEl = e.target as HTMLElement;
    if (!targetEl || targetEl.tagName !== 'IMG') return true;
    const imgEl = targetEl as HTMLImageElement;

    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const pos = screenToCanvas(e.clientX, e.clientY);

    const angleRad = (((tool.rotation || 0)) * Math.PI) / 180;
    const cx = tool.x + toolWidth / 2;
    const cy = tool.y + toolHeight / 2;

    // Undo rotation to get local coords inside the unrotated box
    const vx = pos.x - cx;
    const vy = pos.y - cy;
    const ux = Math.cos(-angleRad) * vx - Math.sin(-angleRad) * vy;
    const uy = Math.sin(-angleRad) * vx + Math.cos(-angleRad) * vy;
    const localX = ux + toolWidth / 2;
    const localY = uy + toolHeight / 2;

    const natW = imgEl.naturalWidth || tool.metadata?.naturalWidth || 0;
    const natH = imgEl.naturalHeight || tool.metadata?.naturalHeight || 0;
    if (!natW || !natH) return true;

    // object-fit: contain math
    const scale = Math.min(toolWidth / natW, toolHeight / natH);
    const contentW = natW * scale;
    const contentH = natH * scale;
    const offsetX = (toolWidth - contentW) / 2;
    const offsetY = (toolHeight - contentH) / 2;

    // Click landed in letterbox area → not a hit
    if (localX < offsetX || localX > offsetX + contentW || localY < offsetY || localY > offsetY + contentH) {
      return false;
    }

    const px = Math.floor((localX - offsetX) / scale);
    const py = Math.floor((localY - offsetY) / scale);

    // Offscreen canvas per image
    let offscreen = imageCanvasCacheRef.current.get(imgEl.src);
    if (!offscreen) {
      offscreen = document.createElement('canvas');
      offscreen.width = natW;
      offscreen.height = natH;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!ctx) return true;
      try {
        ctx.drawImage(imgEl, 0, 0);
        imageCanvasCacheRef.current.set(imgEl.src, offscreen);
      } catch {
        // Cross-origin taint fallback: treat as hit to avoid blocking
        return true;
      }
    }

    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) return true;
    try {
      const alpha = ctx.getImageData(px, py, 1, 1).data[3];
      return alpha > 10; // threshold; ignore almost-transparent pixels
    } catch {
      return true;
    }
  }, [getToolDimensions, screenToCanvas]);

  // Check if a tool is within the selection rectangle
  const isToolInSelectionBox = useCallback((tool: DroppedTool, selBox: typeof selectionBox) => {
    if (!selBox) return false;

    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const minX = Math.min(selBox.startX, selBox.currentX);
    const maxX = Math.max(selBox.startX, selBox.currentX);
    const minY = Math.min(selBox.startY, selBox.currentY);
    const maxY = Math.max(selBox.startY, selBox.currentY);

    return !(tool.x + toolWidth < minX ||
      tool.x > maxX ||
      tool.y + toolHeight < minY ||
      tool.y > maxY);
  }, [getToolDimensions]);

  // Zoom functionality
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const container = canvasContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor));

    // Zoom towards mouse position
    const zoomRatio = newZoom / viewport.zoom;
    const newX = mouseX - (mouseX - viewport.x) * zoomRatio;
    const newY = mouseY - (mouseY - viewport.y) * zoomRatio;

    setViewport({
      x: newX,
      y: newY,
      zoom: newZoom
    });
  }, [viewport]);

  // Attach wheel event listener
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Pan functionality
  const startPan = useCallback((e: MouseEvent | React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  }, [viewport]);

  const updatePan = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!isPanning) return;

    setViewport(prev => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    }));
  }, [isPanning, panStart]);

  const endPan = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (!onSave) return;
    const timeout = setTimeout(() => onSave([...droppedTools]), 300);
    return () => clearTimeout(timeout);
  }, [droppedTools, onSave]);

  // Event handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
  }, [readOnly]);

  // Updated handleDrop function in useCanvas.ts
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();

    const toolData = e.dataTransfer.getData('application/json');
    if (toolData && canvasRef.current) {
      const tool: Tool = JSON.parse(toolData);

      // Convert drop position to canvas coordinates
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      // Create new tool with complete metadata
      const newTool: DroppedTool = {
        ...tool,
        id: `${tool.id}-${Date.now()}`, // Keep the unique dropped ID
        x: 0, // Will be calculated below
        y: 0,
        rotation: 0,
        flipHorizontal: false,
        flipVertical: false,
        width: 50, // Legacy fallback
        length: 50, // Legacy fallback
        depth: tool.metadata?.depth || 0.25,
        SKUorPartNumber: tool.metadata?.SKUorPartNumber || '',
        unit: tool.unit ?? (typeof tool.metadata?.length === 'number' ? (tool.metadata.length > 45 ? 'mm' : 'inches') : unit),
        opacity: 100,
        smooth: 0,
        metadata: {
          ...tool.metadata, // Preserve all existing metadata including diagonalInches
          originalId: tool.id, // ✅ STORE THE ORIGINAL ID HERE
        },
      };

      // Calculate dimensions with the complete tool object
      const { toolWidth, toolHeight } = getToolDimensions(newTool);

      // Center the tool on the drop position
      const x = canvasPos.x - (toolWidth / 2);
      const y = canvasPos.y - (toolHeight / 2);

      const nonOverlappingPos = findNonOverlappingPosition(
        { ...newTool, x, y },
        droppedTools,
        x,
        y
      );

      newTool.x = nonOverlappingPos.x;
      newTool.y = nonOverlappingPos.y;

      setDroppedTools(prev => [...prev, newTool]);
    }
  }, [getToolDimensions, unit, setDroppedTools, screenToCanvas, constrainToCanvas, findNonOverlappingPosition, droppedTools, readOnly]);

  const handleResizeStart = useCallback((e: React.MouseEvent, toolId: string, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();

    const tool = droppedTools.find(t => t.id === toolId);
    if (!tool) return;

    const { toolWidth, toolHeight } = getToolDimensions(tool);

    setIsResizing(true);
    setResizeHandle(handle);
    setResizingToolId(toolId);
    setInitialResizeData({
      toolWidth,
      toolHeight,
      toolX: tool.x,
      toolY: tool.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
    beginInteraction?.();
  }, [droppedTools, getToolDimensions, readOnly, beginInteraction]);

  // Handle resize during mouse move
  const handleResize = useCallback((e: React.MouseEvent) => {
    if (readOnly) return;
    if (!isResizing || !resizeHandle || !resizingToolId || !initialResizeData) return;

    const deltaX = e.clientX - initialResizeData.mouseX;
    const deltaY = e.clientY - initialResizeData.mouseY;

    // Find the tool being resized to check if it's a perfect shape
    const currentTool = droppedTools.find(t => t.id === resizingToolId);
    const isPerfectShape = currentTool && currentTool.toolBrand === 'SHAPE' &&
      (currentTool.name.toLowerCase().includes('circle') ||
        currentTool.name.toLowerCase().includes('square'));

    // Calculate new dimensions based on handle
    let newWidth = initialResizeData.toolWidth;
    let newHeight = initialResizeData.toolHeight;
    let newX = initialResizeData.toolX;
    let newY = initialResizeData.toolY;

    // For perfect shapes (squares and circles), always maintain 1:1 aspect ratio
    // For other shapes, maintain their original aspect ratio
    const aspectRatio = isPerfectShape ? 1 : (initialResizeData.toolWidth / initialResizeData.toolHeight);

    switch (resizeHandle) {
      case 'se': // Bottom-right
        newWidth = Math.max(20, initialResizeData.toolWidth + deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        break;
      case 'sw': // Bottom-left
        newWidth = Math.max(20, initialResizeData.toolWidth - deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        newX = initialResizeData.toolX + (initialResizeData.toolWidth - newWidth);
        break;
      case 'ne': // Top-right
        newWidth = Math.max(20, initialResizeData.toolWidth + deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        newY = initialResizeData.toolY + (initialResizeData.toolHeight - newHeight);
        break;
      case 'nw': // Top-left
        newWidth = Math.max(20, initialResizeData.toolWidth - deltaX / viewport.zoom);
        newHeight = isPerfectShape ? newWidth : newWidth / aspectRatio;
        newX = initialResizeData.toolX + (initialResizeData.toolWidth - newWidth);
        newY = initialResizeData.toolY + (initialResizeData.toolHeight - newHeight);
        break;
    }

    // Update the tool dimensions
    setDroppedTools(prev => prev.map(tool => {
      if (tool.id === resizingToolId) {
        // Calculate new size in the tool's unit
        const DPI = 96;
        const canvasInchesX = unit === 'mm' ? (canvasWidth / 25.4) : canvasWidth;
        const canvasInchesY = unit === 'mm' ? (canvasHeight / 25.4) : canvasHeight;

        const el = canvasRef.current;
        let baseWidthPx = canvasInchesX * DPI;
        let baseHeightPx = canvasInchesY * DPI;

        if (el) {
          const rect = el.getBoundingClientRect();
          baseWidthPx = rect.width / viewport.zoom;
          baseHeightPx = rect.height / viewport.zoom;
        }

        const ppiX = baseWidthPx / canvasInchesX;
        const ppiY = baseHeightPx / canvasInchesY;

        // Convert pixel dimensions back to tool units
        const newWidthInInches = newWidth / ppiX;
        const newHeightInInches = newHeight / ppiY;

        const newWidthInUnits = tool.unit === 'mm' ? newWidthInInches * 25.4 : newWidthInInches;
        const newHeightInUnits = tool.unit === 'mm' ? newHeightInInches * 25.4 : newHeightInInches;

        // Round to 2 decimals for stable values
        const round2 = (n: number) => Number(n.toFixed(2));

        // For perfect shapes, ensure both dimensions are exactly equal
        const finalWidth = round2(isPerfectShape ? newWidthInUnits : newWidthInUnits);
        const finalHeight = round2(isPerfectShape ? newWidthInUnits : newHeightInUnits);

        return {
          ...tool,
          x: newX,
          y: newY,
          width: finalWidth,
          length: finalHeight,
          metadata: {
            ...tool.metadata,
            diagonalInches: Math.sqrt(newWidthInInches * newWidthInInches + newHeightInInches * newHeightInInches),
          }
        };
      }
      return tool;
    }));
  }, [isResizing, resizeHandle, resizingToolId, initialResizeData, setDroppedTools, viewport.zoom, unit, canvasWidth, canvasHeight, canvasRef, droppedTools, readOnly]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    setResizingToolId(null);
    setInitialResizeData(null);
    endInteraction?.();
  }, [endInteraction]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isResizing) {
        // Check if the mousedown is on a resize handle or the tool being resized
        const target = e.target as HTMLElement;
        const isOnResizeHandle = target.closest('.resize-handle') ||
          target.style.cursor?.includes('resize') ||
          (target.parentElement && target.parentElement.style.cursor?.includes('resize'));

        // If clicking outside resize handles, stop resizing
        if (!isOnResizeHandle) {
          e.preventDefault();
          handleResizeEnd();
        }
      }
    };

    if (isResizing) {
      document.addEventListener('mousedown', handleMouseDown, true);
      return () => {
        document.removeEventListener('mousedown', handleMouseDown, true);
      };
    }
  }, [isResizing, handleResizeEnd]);

  const handleToolMouseDown = useCallback((e: React.MouseEvent, toolId: string) => {
    // Allow finger cut placement to bubble up to canvas
    if (activeTool === 'fingercut') {
      return;
    }

    // If clicking an image, only accept if an opaque pixel was hit
    const clickedTool = droppedTools.find(t => t.id === toolId);
    const target = e.target as HTMLElement;
    if (clickedTool && target && target.tagName === 'IMG') {
      const isOpaqueHit = isHitOnImagePixel(e, clickedTool);
      if (!isOpaqueHit) {
        // Do not block the event; let it bubble to the canvas for selection/finger-cut
        return;
      }
    }

    e.preventDefault();
    e.stopPropagation();

    // Check for middle mouse button - enable panning
    if (e.button === 1) {
      startPan(e);
      return;
    }

    if (activeTool === 'cursor') {
      // Handle tool selection
      if (e.ctrlKey || e.metaKey) {
        if (selectedTools.includes(toolId)) {
          setSelectedTools(prev => prev.filter(id => id !== toolId));
          if (selectedTool === toolId) {
            setSelectedTool(selectedTools.find(id => id !== toolId) || null);
          }
        } else {
          setSelectedTools(prev => [...prev, toolId]);
          setSelectedTool(toolId);
        }
      } else {
        if (selectedTools.includes(toolId)) {
          setSelectedTool(toolId);
        } else {
          setSelectedTools([toolId]);
          setSelectedTool(toolId);
        }
      }

      if (readOnly) {
        // Do not start dragging in inspect mode.
        return;
      }

      // Setup drag for the tool(s)
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      if (clickedTool) {
        // Set drag offset relative to the tool's position
        setDragOffset({
          x: canvasPos.x - clickedTool.x,
          y: canvasPos.y - clickedTool.y
        });

        // Store initial positions of all selected tools
        const toolsToMove = selectedTools.includes(toolId) ? selectedTools : [toolId];
        const positions: Record<string, { x: number; y: number }> = {};

        droppedTools.forEach(tool => {
          if (toolsToMove.includes(tool.id)) {
            positions[tool.id] = { x: tool.x, y: tool.y };
          }
        });

        setInitialPositions(positions);
        setIsDraggingSelection(true);
        beginInteraction?.();
      }
    } else if (activeTool === 'hand') {
      // In hand mode, start panning the viewport
      startPan(e);
    }
  }, [activeTool, selectedTool, selectedTools, setSelectedTool, setSelectedTools, startPan, screenToCanvas, droppedTools, readOnly, beginInteraction, isHitOnImagePixel]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Check for middle mouse button - enable panning regardless of active tool
    if (e.button === 1) {
      e.preventDefault();
      startPan(e);
      return;
    }

    if (activeTool === 'hand') {
      // Hand tool: start panning
      startPan(e);
    } else if (activeTool === 'cursor' && e.target === canvasRef.current) {
      // Cursor tool: start selection box
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      if (!e.ctrlKey && !e.metaKey) {
        setSelectedTools([]);
        setSelectedTool(null);
      }

      setSelectionBox({
        startX: canvasPos.x,
        startY: canvasPos.y,
        currentX: canvasPos.x,
        currentY: canvasPos.y,
        isSelecting: true
      });
    }
  }, [activeTool, setSelectedTools, setSelectedTool, startPan, screenToCanvas]);

  // Start endpoint drag (left or right end of the pill)
  const handleFingerCutEndpointDown = useCallback((e: React.MouseEvent, toolId: string, end: 'left' | 'right') => {
    e.stopPropagation();
    if (readOnly) return;

    const tool = droppedTools.find(t => t.id === toolId);
    if (!tool) return;
    const { toolWidth, toolHeight } = getToolDimensions(tool);
    const angleRad = (tool.rotation * Math.PI) / 180;

    const cx = tool.x + toolWidth / 2;
    const cy = tool.y + toolHeight / 2;
    const ux = Math.cos(angleRad);
    const uy = Math.sin(angleRad);

    // Endpoints on the line
    const ax = cx - (toolWidth / 2) * ux;
    const ay = cy - (toolWidth / 2) * uy;
    const bx = cx + (toolWidth / 2) * ux;
    const by = cy + (toolWidth / 2) * uy;

    const anchorX = end === 'left' ? bx : ax;
    const anchorY = end === 'left' ? by : ay;

    setFingerCutDrag({
      toolId,
      end,
      anchorX,
      anchorY,
      heightPx: toolHeight,
      angleRad,
    });
    beginInteraction?.();
  }, [droppedTools, getToolDimensions, readOnly, beginInteraction]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle resizing first
    if (isResizing) {
      handleResize(e);
      return;
    }

    // Handle viewport panning (only when not dragging tools)
    if (isPanning && (activeTool === 'hand' || !isDraggingSelection)) {
      updatePan(e);
      return;
    }

    // Live preview for finger cut: update end point while dragging the mouse
    if (activeTool === 'fingercut' && fingerCutStart) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setFingerCutPreviewEnd(pos);
    }

    // Endpoint drag active
    if (fingerCutDrag) {
      const { toolId, end, anchorX, anchorY, heightPx, angleRad } = fingerCutDrag;
      const pos = screenToCanvas(e.clientX, e.clientY);

      const ux = Math.cos(angleRad);
      const uy = Math.sin(angleRad);
      const vx = pos.x - anchorX;
      const vy = pos.y - anchorY;

      // Projection along the axis
      const proj = vx * ux + vy * uy;
      const newWidthPx = Math.max(10, Math.abs(proj));

      // Use explicit direction per handle to avoid sign-flip jerks
      const dir = end === 'right' ? 1 : -1;
      const newCx = anchorX + dir * (newWidthPx / 2) * ux;
      const newCy = anchorY + dir * (newWidthPx / 2) * uy;

      // Convert px back to physical units for storage
      const pxToUnits = (px: number) => unit === 'mm' ? (px / 96) * 25.4 : (px / 96);
      const newWidthUnits = pxToUnits(newWidthPx);
      const heightUnits = pxToUnits(heightPx);

      setDroppedTools(prev =>
        prev.map(t => {
          if (t.id !== toolId) return t;
          return {
            ...t,
            x: newCx - newWidthPx / 2,
            y: newCy - heightPx / 2,
            width: newWidthUnits,    // store in units
            length: heightUnits,     // store in units
            metadata: {
              ...t.metadata,
              fingerCutWidth: newWidthUnits,
              fingerCutLength: heightUnits,
            },
          };
        })
      );
      return;
    }

    // Handle selection box
    if (selectionBox?.isSelecting && activeTool === 'cursor' && !isDraggingSelection) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);

      setSelectionBox(prev => prev ? {
        ...prev,
        currentX: canvasPos.x,
        currentY: canvasPos.y
      } : null);

      const newSelectionBox = { ...selectionBox, currentX: canvasPos.x, currentY: canvasPos.y };
      const toolsInBox = droppedTools.filter(tool =>
        isToolInSelectionBox(tool, newSelectionBox)
      ).map(tool => tool.id);

      if (e.ctrlKey || e.metaKey) {
        setSelectedTools(prev => {
          const combined = [...new Set([...prev, ...toolsInBox])];
          return combined;
        });
      } else {
        setSelectedTools(toolsInBox);
        setSelectedTool(toolsInBox[toolsInBox.length - 1] || null);
      }
    }

    // Dragging is disabled in read-only
    if (readOnly) return;

    // Handle tool dragging (only in cursor mode) - WITH BOUNDARY CONSTRAINTS
    if (dragOffset && isDraggingSelection && activeTool === 'cursor' && selectedTool) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const newX = canvasPos.x - dragOffset.x;
      const newY = canvasPos.y - dragOffset.y;

      const primaryTool = droppedTools.find(t => t.id === selectedTool);
      if (primaryTool && selectedTool && initialPositions[selectedTool]) {
        const deltaX = newX - initialPositions[selectedTool].x;
        const deltaY = newY - initialPositions[selectedTool].y;

        setDroppedTools(prev =>
          prev.map(tool => {
            if (selectedTools.includes(tool.id) && initialPositions[tool.id]) {
              const proposedX = initialPositions[tool.id].x + deltaX;
              const proposedY = initialPositions[tool.id].y + deltaY;

              return {
                ...tool,
                x: proposedX,
                y: proposedY
              };
            }
            return tool;
          })
        );
      }
    }
  }, [
    fingerCutDrag,
    screenToCanvas,
    setDroppedTools,
    fingerCutStart,
    isPanning,
    activeTool,
    updatePan,
    selectionBox,
    screenToCanvas,
    isToolInSelectionBox,
    droppedTools,
    setSelectedTools,
    setSelectedTool,
    dragOffset,
    isDraggingSelection,
    selectedTool,
    initialPositions,
    selectedTools,
    setDroppedTools,
    constrainToCanvas,
    readOnly
  ]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      handleResizeEnd();
      return;
    }
    // Finish endpoint drag, if any
    if (fingerCutDrag) {
      setFingerCutDrag(null);
    }
    endPan();
    setDragOffset(null);
    setIsDraggingSelection(false);
    setInitialPositions({});
    setSelectionBox(null);
    endInteraction?.();
  }, [isResizing, handleResizeEnd, endPan, fingerCutDrag, endInteraction]);

  // Handle finger cut tool click
  const handleFingerCutClick = useCallback((e: React.MouseEvent) => {
    if (readOnly) return;
    const pos = screenToCanvas(e.clientX, e.clientY);

    // First click: capture start point
    if (!fingerCutStart) {
      setFingerCutStart(pos);
      return;
    }

    // Second click: create the cut between start and current pos
    const dx = pos.x - fingerCutStart.x;
    const dy = pos.y - fingerCutStart.y;
    const lengthPx = Math.max(10, Math.hypot(dx, dy));
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Convert drawn pixel distance to physical units for storage
    const widthInches = lengthPx / 96;
    const widthUnits = unit === 'mm' ? widthInches * 25.4 : widthInches;

    const defaultThicknessInches = 1;
    const thicknessUnits = unit === 'mm' ? defaultThicknessInches * 25.4 : defaultThicknessInches;
    const thicknessPx = unit === 'mm' ? mmToPx(thicknessUnits) : inchesToPx(thicknessUnits);

    const centerX = fingerCutStart.x + dx / 2;
    const centerY = fingerCutStart.y + dy / 2;

    const newTool: DroppedTool = {
      id: `fingercut-${Date.now()}`,
      name: 'Finger Cut',
      icon: '⭕',
      toolBrand: 'FINGERCUT',
      toolType: 'fingerCut',
      SKUorPartNumber: '',
      x: centerX - lengthPx / 2,
      y: centerY - thicknessPx / 2,
      rotation: angleDeg,
      flipHorizontal: false,
      flipVertical: false,
      width: widthUnits,       // store in physical units
      length: thicknessUnits,  // store in physical units
      depth: 0.25,
      unit,                    // inches|mm
      opacity: 100,
      smooth: 0,
      metadata: {
        isFingerCut: true,
        fingerCutWidth: widthUnits,
        fingerCutLength: thicknessUnits,
      },
    };

    setFingerCutStart(null);
    setFingerCutPreviewEnd(null);
    setDroppedTools(prev => [...prev, newTool]);
    setSelectedTool(newTool.id);
    setSelectedTools([newTool.id]);
    setActiveTool('cursor');
  }, [fingerCutStart, screenToCanvas, setDroppedTools, setSelectedTool, setSelectedTools, unit, readOnly, setActiveTool]);



  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCanvasContainer = target === canvasContainerRef.current;
    const isCanvas = target === canvasRef.current;

    if ((isCanvasContainer || isCanvas) && !selectionBox?.isSelecting && activeTool === 'cursor') {
      if (!e.ctrlKey && !e.metaKey) {
        setSelectedTools([]);
        setSelectedTool(null);
      }
    }
    // Handle finger cut tool click
    else if (activeTool === 'fingercut') {
      if (readOnly) return;
      handleFingerCutClick(e);
    }
  }, [selectionBox, activeTool, setSelectedTool, setSelectedTools, handleFingerCutClick, readOnly]);

  const handleDeleteTool = useCallback((toolId: string) => {
    if (readOnly) return;
    setDroppedTools(prev => prev.filter(tool => tool.id !== toolId));
    setSelectedTools(prev => prev.filter(id => id !== toolId));
    if (selectedTool === toolId) {
      const remainingSelected = selectedTools.filter(id => id !== toolId);
      setSelectedTool(remainingSelected[0] || null);
    }
  }, [setDroppedTools, selectedTool, selectedTools, setSelectedTool, setSelectedTools, readOnly]);

  const handleDeleteSelectedTools = useCallback(() => {
    if (readOnly) return;
    if (selectedTools.length > 0) {
      setDroppedTools(prev => prev.filter(tool => !selectedTools.includes(tool.id)));
      setSelectedTools([]);
      setSelectedTool(null);
    }
  }, [selectedTools, setDroppedTools, setSelectedTools, setSelectedTool, readOnly]);

  // Auto-fix overlaps function
  const autoFixOverlaps = useCallback(() => {
    if (readOnly) return;
    const toolsToFix = droppedTools.filter(tool => overlappingTools.includes(tool.id));

    setDroppedTools(prev => {
      const newTools = [...prev];
      const processedIds = new Set<string>();

      toolsToFix.forEach(tool => {
        if (!processedIds.has(tool.id)) {
          const otherTools = newTools.filter(t => t.id !== tool.id);
          const nonOverlappingPos = findNonOverlappingPosition(tool, otherTools);

          const toolIndex = newTools.findIndex(t => t.id === tool.id);
          if (toolIndex !== -1) {
            newTools[toolIndex] = {
              ...newTools[toolIndex],
              x: nonOverlappingPos.x,
              y: nonOverlappingPos.y
            };
          }
          processedIds.add(tool.id);
        }
      });

      return newTools;
    });
  }, [droppedTools, overlappingTools, findNonOverlappingPosition, setDroppedTools, readOnly]);

  // Style helpers
  const getCanvasCursor = useCallback(() => {
    if (isPanning) return 'grabbing';
    if (isDraggingSelection) return 'grabbing';
    if (readOnly) {
      // Cursor acts passive in inspect mode unless hand tool is active
      switch (activeTool) {
        case 'hand': return 'grab';
        default: return 'default';
      }
    }
    switch (activeTool) {
      case 'cursor': return 'default';
      case 'hand': return 'grab';
      case 'fingercut': return 'crosshair';
      default: return 'default';
    }
  }, [activeTool, isPanning, isDraggingSelection, readOnly]);

  const getToolCursor = useCallback((toolId: string) => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (readOnly) return 'default';
    if (activeTool === 'cursor') {
      if (isDraggingSelection && selectedTools.includes(toolId)) return 'grabbing';
      return 'move';
    }
    if (activeTool === 'fingercut') return 'crosshair';
    return 'default';
  }, [activeTool, isDraggingSelection, selectedTools, isPanning, readOnly]);

  // Fit canvas to view
  const fitToView = useCallback(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const containerRect = container.getBoundingClientRect();
    const canvasStyle = getCanvasStyle();
    const canvasWidth = parseInt(canvasStyle.width);
    const canvasHeight = parseInt(canvasStyle.height);

    const scaleX = (containerRect.width - 100) / canvasWidth;
    const scaleY = (containerRect.height - 100) / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const centerX = (containerRect.width - canvasWidth * scale) / 2;
    const centerY = (containerRect.height - canvasHeight * scale) / 2;

    setViewport({
      x: centerX,
      y: centerY,
      zoom: scale
    });
  }, [getCanvasStyle]);

  // Center canvas
  const centerCanvas = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const canvasStyle = getCanvasStyle();
    const canvasWidth = parseInt(canvasStyle.width);
    const canvasHeight = parseInt(canvasStyle.height);

    const centerX = (containerRect.width - canvasWidth * viewport.zoom) / 2;
    const centerY = (containerRect.height - canvasHeight * viewport.zoom) / 2;

    setViewport(prev => ({
      ...prev,
      x: centerX,
      y: centerY
    }));
  }, [getCanvasStyle, viewport.zoom]);

  return {
    // Refs
    canvasRef,
    canvasContainerRef,
    fingerCutStart,
    fingerCutPreviewEnd,

    // State
    dragOffset,
    selectionBox,
    viewport,
    hasOverlaps,
    overlappingTools,
    hasOutOfBounds,
    outOfBoundsTools,

    // Utility functions
    getToolDimensions,
    getShadowOffset,
    getCanvasStyle,
    getViewportTransform,
    findNonOverlappingPosition,
    constrainToCanvas,

    
    // Event handlers
    handleDragOver,
    handleDrop,
    handleToolMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
    handleCanvasClick,
    handleCanvasMouseDown,
    handleDeleteTool,
    handleDeleteSelectedTools,
    handleFingerCutClick,
    autoFixOverlaps,
    handleFingerCutEndpointDown,


    // Style helpers
    getCanvasCursor,
    getToolCursor,

    // Viewport controls
    fitToView,
    centerCanvas,
  };
};