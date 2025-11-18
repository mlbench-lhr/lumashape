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

interface ShapePoint {
  x: number;
  y: number;
}

interface ShapeData {
  width_inches?: number;
  height_inches?: number;
  radius_inches?: number;
  points?: ShapePoint[];
  // NEW: text shape fields
  content?: string;
  font_size_px?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
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
  shapeType?: 'rectangle' | 'circle' | 'polygon' | 'text';
  shapeData?: ShapeData;
  metadata?: ToolMetadata;
  realWidth?: number;
  realHeight?: number;
  width?: number;
  length?: number;
  depth?: number;
}

interface LayoutData {
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
const convertUnits = (value: number, from: Unit, to: Unit) =>
  from === to ? value : from === 'mm' ? value / 25.4 : value * 25.4;
// px -> units helper
const pxToUnits = (px: number, unit: Unit) => unit === 'mm' ? (px / 96) * 25.4 : (px / 96);

function getAuthToken(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  } catch {
    return null;
  }
}

export default function InspectLayoutPage({
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
      const canvasUnit: Unit = layout.canvas.unit;
      const canvasHeightPx =
        canvasUnit === 'inches'
          ? inchesToPx(layout.canvas.height)
          : mmToPx(layout.canvas.height);

      const mapped: DroppedTool[] = (layout.tools ?? []).map((t) => {
        const toolUnit: Unit = t.unit || canvasUnit;

        const xPx = inchesToPx(t.x ?? 0);
        const yPxRaw = inchesToPx(t.y ?? 0);
        const yPx = canvasHeightPx - yPxRaw;

        let widthCanvasUnits = 0;
        let lengthCanvasUnits = 0;
        let widthPxFallback = 0;
        let heightPxFallback = 0;

        let toolBrand: string = t.metadata?.toolBrand || '';

        // NEW: text fields (optional, only for text shapes)
        let textContent: string | undefined;
        let textFontSizePx: number | undefined;
        let textAlign: 'left' | 'center' | 'right' | undefined;
        let textColor: string | undefined;

        const shapeToolType: 'circle' | 'square' | 'polygon' | '' =
          t.isCustomShape && t.shapeType
            ? t.shapeType === 'circle'
              ? 'circle'
              : t.shapeType === 'rectangle'
                ? 'square'
                : t.shapeType === 'polygon'
                  ? 'polygon'
                  : ''
            : '';

        if (t.isCustomShape && t.shapeType && t.shapeData) {
          const shapeData = t.shapeData;

          // NEW: handle text shape
          if (t.shapeType === 'text') {
            toolBrand = 'TEXT';
            const wInches = shapeData.width_inches ?? 0;
            const hInches = shapeData.height_inches ?? 0;
            widthCanvasUnits = canvasUnit === 'mm' ? wInches * 25.4 : wInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? hInches * 25.4 : hInches;

            textContent = shapeData.content ?? '';
            textFontSizePx = shapeData.font_size_px ?? 24;
            textAlign = (shapeData.align as 'left' | 'center' | 'right') ?? 'center';
            textColor = shapeData.color ?? '#000000';
          } else if (t.shapeType === 'rectangle' &&
            typeof shapeData.width_inches === 'number' &&
            typeof shapeData.height_inches === 'number') {
            const wInches = shapeData.width_inches;
            const hInches = shapeData.height_inches;
            widthCanvasUnits = canvasUnit === 'mm' ? wInches * 25.4 : wInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? hInches * 25.4 : hInches;
          } else if (t.shapeType === 'circle' &&
            typeof shapeData.radius_inches === 'number') {
            const diameterInches = shapeData.radius_inches * 2;
            widthCanvasUnits = canvasUnit === 'mm' ? diameterInches * 25.4 : diameterInches;
            lengthCanvasUnits = widthCanvasUnits;
          } else if (Array.isArray(shapeData.points)) {
            const points = shapeData.points;
            const minX = Math.min(...points.map((p) => p.x));
            const maxX = Math.max(...points.map((p) => p.x));
            const minY = Math.min(...points.map((p) => p.y));
            const maxY = Math.max(...points.map((p) => p.y));
            const widthInches = maxX - minX;
            const heightInches = maxY - minY;
            widthCanvasUnits = canvasUnit === 'mm' ? widthInches * 25.4 : widthInches;
            lengthCanvasUnits = canvasUnit === 'mm' ? heightInches * 25.4 : heightInches;
          }
        } else {
          const rw = typeof t.realWidth === 'number' ? t.realWidth : (typeof t.width === 'number' ? t.width : 0);
          const rh = typeof t.realHeight === 'number' ? t.realHeight : (typeof t.length === 'number' ? t.length : 0);
          if (rw > 0 || rh > 0) {
            widthCanvasUnits = convertUnits(rw, toolUnit, canvasUnit);
            lengthCanvasUnits = convertUnits(rh, toolUnit, canvasUnit);
          } else if (t.metadata?.length) {
            const heightPx = inchesToPx(t.metadata.length);
            const aspect =
              t.metadata.naturalWidth && t.metadata.naturalHeight
                ? t.metadata.naturalWidth / t.metadata.naturalHeight
                : 1.6;
            heightPxFallback = heightPx;
            widthPxFallback = heightPx * aspect;
          }
        }

        const isTextFromMeta =
          (t.metadata?.toolBrand === 'TEXT') || (t.metadata?.toolType === 'text');
        if (isTextFromMeta) {
          toolBrand = 'TEXT';
          textContent = String(t.metadata?.textContent ?? '');  
          textFontSizePx = (t.metadata?.textFontSizePx as number) ?? 24;
          textAlign = (t.metadata?.textAlign as 'left' | 'center' | 'right') ?? 'center';
          textColor = String(t.metadata?.textColor ?? '#000000');
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
          depth: t.metadata?.depth ?? 0.2,
          unit: toolUnit,
          opacity: t.opacity ?? 100,
          smooth: t.smooth ?? 0,
          groupId: t.groupId,
          isSelected: false,
          realWidth: (typeof t.realWidth === 'number' && t.realWidth > 0)
            ? t.realWidth
            : (widthPxFallback
                ? pxToUnits(widthPxFallback, toolUnit)
                : (widthCanvasUnits
                    ? convertUnits(widthCanvasUnits, canvasUnit, toolUnit)
                    : undefined)),
          realHeight: (typeof t.realHeight === 'number' && t.realHeight > 0)
            ? t.realHeight
            : (heightPxFallback
                ? pxToUnits(heightPxFallback, toolUnit)
                : (lengthCanvasUnits
                    ? convertUnits(lengthCanvasUnits, canvasUnit, toolUnit)
                    : undefined)),
          toolBrand,
          // NEW: set text tool type for Canvas/UI
          toolType: (t.shapeType === 'text' ? 'text' : (shapeToolType || (t.metadata?.toolType ?? ''))),
          // NEW: text fields for Canvas rendering
          textContent,
          textFontSizePx,
          textAlign,
          textColor,
        } as DroppedTool;
      });

      setInitialCanvas({
        width: layout.canvas.width,
        height: layout.canvas.height,
        unit: layout.canvas.unit,
        thickness: layout.canvas.thickness,
      });

      setInitialTools(mapped);

      try {
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
      } catch {
        // ignore storage errors
      }

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
      readOnly={true}
    />
  );
}
