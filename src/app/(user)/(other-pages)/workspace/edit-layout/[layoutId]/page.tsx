'use client';

import React, { useEffect, useState } from 'react';
import DesignLayout from '@/components/Workspace/DesignLayout/DesignLayout';
import { DroppedTool } from '@/components/Workspace/DesignLayout/types';

type Unit = 'mm' | 'inches';

interface CanvasInit {
  width: number;
  height: number;
  unit: Unit;
  thickness: number;
}

interface ShapeData {
  width_inches?: number;
  height_inches?: number;
  radius_inches?: number;
  points?: Array<{ x: number; y: number }>;
  depth?: number;
}

interface ToolMetadata {
  toolBrand?: string;
  toolType?: string;
  length?: number;
  depth?: number;
  naturalWidth?: number;
  naturalHeight?: number;
  textContent?: string;
  textFontFamily?: string;
  textFontWeight?: number | string;
  textFontSizePx?: number;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
}

interface LayoutTool {
  id: string;
  name: string;
  image?: string;
  unit?: Unit;
  x?: number;
  y?: number;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  opacity?: number;
  smooth?: number;
  groupId?: string;
  isCustomShape?: boolean;
  shapeType?: 'rectangle' | 'circle' | 'polygon';
  shapeData?: ShapeData;
  metadata?: ToolMetadata;
  realWidth?: number;
  realHeight?: number;
  width?: number;
  length?: number;
  depth?: number;
}

interface LayoutData {
  _id: string;
  name: string;
  canvas: {
    width: number;
    height: number;
    unit: Unit;
    thickness: number;
  };
  tools: LayoutTool[];
}

const inchesToPx = (inches: number) => inches * 96;
const mmToPx = (mm: number) => (mm / 25.4) * 96;

const convertUnits = (value: number, from: Unit, to: Unit) => {
  if (from === to) return value;
  return from === 'mm' ? value / 25.4 : value * 25.4;
};
// px -> units helper
const pxToUnits = (px: number, unit: Unit) => unit === 'mm' ? (px / 96) * 25.4 : (px / 96);

function getAuthToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  } catch {
    return null;
  }
}

export default function EditLayoutPage({
  params,
}: {
  params: Promise<{ layoutId: string }>;
}) {
  const [initialTools, setInitialTools] = useState<DroppedTool[]>([]);
  const [initialCanvas, setInitialCanvas] = useState<CanvasInit | null>(null);
  const [ready, setReady] = useState(false);
  const { layoutId } = React.use(params);

  useEffect(() => {
    async function loadLayout() {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/layouts?id=${layoutId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error(json.error || 'Failed to fetch layout');
        return;
      }

      const layout: LayoutData = json.data;
      const canvasUnit = layout.canvas.unit;
      const canvasHeightPx =
        canvasUnit === 'inches'
          ? inchesToPx(layout.canvas.height)
          : mmToPx(layout.canvas.height);

      const mapped: DroppedTool[] = layout.tools.map((t) => {
        const toolUnit: Unit = t.unit || canvasUnit;
      
        // DB stores bottom-left inches; convert to top-left canvas pixels
        const xPx = inchesToPx(t.x || 0);
        const yPxRaw = inchesToPx(t.y || 0);
        const yPx = canvasHeightPx - yPxRaw;
      
        // Prepare width/length rehydration
        let widthCanvasUnits = 0;
        let lengthCanvasUnits = 0;
        let widthPxFallback = 0;
        let heightPxFallback = 0;
      
        let toolBrand: string = t.metadata?.toolBrand || '';
        let shapeToolType: 'circle' | 'square' | 'polygon' | '' = '';
      
        if (t.isCustomShape && t.shapeType && t.shapeData) {
          toolBrand = 'SHAPE';
          const sd = t.shapeData;
      
          if (
            t.shapeType === 'rectangle' &&
            typeof sd.width_inches === 'number' &&
            typeof sd.height_inches === 'number'
          ) {
            const wInches = sd.width_inches;
            const hInches = sd.height_inches;
            widthCanvasUnits = canvasUnit === 'mm' ? wInches * 25.4 : wInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? hInches * 25.4 : hInches;
            // NEW: rectangle -> square
            shapeToolType = 'square';
          } else if (
            t.shapeType === 'circle' &&
            typeof sd.radius_inches === 'number'
          ) {
            const diameterInches = sd.radius_inches * 2;
            widthCanvasUnits = canvasUnit === 'mm' ? diameterInches * 25.4 : diameterInches;
            lengthCanvasUnits = widthCanvasUnits;
            // NEW: circle -> circle
            shapeToolType = 'circle';
          } else if (Array.isArray(sd.points)) {
            const points = sd.points;
            const minX = Math.min(...points.map((p) => p.x));
            const maxX = Math.max(...points.map((p) => p.x));
            const minY = Math.min(...points.map((p) => p.y));
            const maxY = Math.max(...points.map((p) => p.y));
            const widthInches = maxX - minX;
            const heightInches = maxY - minY;
            widthCanvasUnits = canvasUnit === 'mm' ? widthInches * 25.4 : widthInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? heightInches * 25.4 : heightInches;
            // NEW: polygon -> polygon
            shapeToolType = 'polygon';
          }
        } else {
          // Non-shape tools (images/text/tools)
          if (t.metadata?.length) {
            // Images: rendering uses metadata.length (inches) and aspect ratio
            // Keep a pixel fallback for initial visual sizing; Canvas will compute using metadata anyway
            const heightPx = inchesToPx(t.metadata.length);
            const aspect =
              t.metadata.naturalWidth && t.metadata.naturalHeight
                ? t.metadata.naturalWidth / t.metadata.naturalHeight
                : 1.6;
            heightPxFallback = heightPx;
            widthPxFallback = heightPx * aspect;
          } else {
            // Use saved realWidth/realHeight (stored in the tool’s unit)
            const rw = t.realWidth ?? t.width ?? 0;
            const rh = t.realHeight ?? t.length ?? 0;
            widthCanvasUnits = convertUnits(rw, toolUnit, canvasUnit);
            lengthCanvasUnits = convertUnits(rh, toolUnit, canvasUnit);
          }
        }
      
        return {
          id: t.id,
          name: t.name,
          icon: t.image || (t.isCustomShape ? '⬜' : ''),
          image: t.image,
          metadata: t.metadata,
          x: xPx,
          y: yPx,
          rotation: t.rotation ?? 0,
          flipHorizontal: !!t.flipHorizontal,
          flipVertical: !!t.flipVertical,
          width: widthCanvasUnits
            ? convertUnits(widthCanvasUnits, canvasUnit, toolUnit)
            : widthPxFallback
              ? pxToUnits(widthPxFallback, toolUnit)
              : 50,
          length: lengthCanvasUnits
            ? convertUnits(lengthCanvasUnits, canvasUnit, toolUnit)
            : heightPxFallback
              ? pxToUnits(heightPxFallback, toolUnit)
              : 50,
          depth:
            typeof t.depth === 'number'
              ? t.depth
              : typeof t.metadata?.depth === 'number'
                ? t.metadata.depth
                : 0.2,
          unit: toolUnit,
          opacity: t.opacity ?? 100,
          smooth: t.smooth ?? 0,
          groupId: t.groupId,
          isSelected: false,
          realWidth: t.realWidth,
          realHeight: t.realHeight,
          toolBrand,
          toolType: shapeToolType || (t.metadata?.toolType ?? ''),
          // Rehydrate text props so Canvas renders the exact saved text
          textContent: t.metadata?.textContent,
          textFontFamily: t.metadata?.textFontFamily,
          textFontWeight: t.metadata?.textFontWeight,
          textFontSizePx: t.metadata?.textFontSizePx,
          textAlign: t.metadata?.textAlign as 'left' | 'center' | 'right' | undefined,
          textColor: t.metadata?.textColor,
        } as DroppedTool;
      });

      setInitialCanvas({
        width: layout.canvas.width,
        height: layout.canvas.height,
        unit: layout.canvas.unit,
        thickness: layout.canvas.thickness,
      });

      setInitialTools(mapped);

      sessionStorage.setItem(
        'layoutForm',
        JSON.stringify({
          layoutName: layout.name,
          canvasWidth: layout.canvas.width,
          canvasHeight: layout.canvas.height,
          units: layout.canvas.unit,
          thickness: layout.canvas.thickness,
        })
      );
      sessionStorage.setItem('editingLayoutId', layoutId);
      setReady(true);
    }

    loadLayout();
  }, [layoutId]);

  if (!ready || !initialCanvas) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-600">
        Loading layout...
      </div>
    );
  }

  return (
    <DesignLayout
      initialDroppedTools={initialTools}
      initialCanvas={initialCanvas}
      editingLayoutId={layoutId}
    />
  );
}
