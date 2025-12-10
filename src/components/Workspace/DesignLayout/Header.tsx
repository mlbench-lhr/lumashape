"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  ShoppingCart,
  Info,
} from "lucide-react";
import Image from "next/image";
import { DroppedTool } from "./types";
import * as htmlToImage from "html-to-image";
import { useCart } from "@/context/CartContext";
import { toast } from "react-toastify";
import { calculatePriceFromLayoutData } from "@/utils/pricing";
import router from "next/router";

interface HeaderProps {
  droppedTools: DroppedTool[];
  canvasWidth: number;
  canvasHeight: number;
  thickness: number;
  unit: "mm" | "inches";
  hasOverlaps: boolean;
  onSaveLayout?: () => void;
  readOnly?: boolean;
  materialColor: string;
  setSuppressSelectionUI?: (value: boolean) => void;
}

interface LayoutFormData {
  layoutName?: string;
  width?: number;
  length?: number;
  units?: "mm" | "inches";
  canvasWidth?: number;
  canvasHeight?: number;
  thickness?: number;
  materialColor?: string;
}

interface ToolPayload {
  tool_id: string;
  name: string;
  brand: string;
  unit: "mm" | "inches";
  dxf_link?: string;
  position_inches: { x: number; y: number; z: number };
  rotation_degrees: number;
  height_diagonal_inches?: number;
  depth_inches?: number;
  cut_depth_inches: number;
  flip_horizontal?: boolean;
  flip_vertical?: boolean;
  opacity?: number;
  smooth?: number;
}

interface ShapePayload {
  tool_id: string;
  name: string;
  brand: string;
  unit: "mm" | "inches";
  is_custom_shape: true;
  shape_type: "rectangle" | "circle" | "polygon" | "fingercut" | "text";
  shape_data:
  | { width_inches: number; height_inches: number }
  | { radius_inches: number }
  | { points: { x: number; y: number }[] }
  | {
    width_inches: number;
    height_inches: number;
    content: string;
    font_size_px: number;
    align: "left" | "center" | "right";
    color?: string;
  };
  position_inches: { x: number; y: number; z: number };
  rotation_degrees: number;
  cut_depth_inches: number;
  flip_horizontal?: boolean;
  flip_vertical?: boolean;
}

type CVResponse = {
  dimensions?: {
    length_inches?: number;
    depth_inches?: number;
  };
};

type FetchedTool = {
  cvResponse?: CVResponse;
  length?: number;
  depth?: number;
  unit?: string;
};

// conversion helper
const mmToInches = (mm: number) => mm / 25.4;
const inchesToMm = (inches: number) => inches * 25.4;

function normalizeRotationDeg(deg?: number): number {
  const d = typeof deg === "number" ? deg : 0;
  return Math.round(((d % 360) + 360) % 360);
}

const Header: React.FC<HeaderProps> = ({
  droppedTools,
  canvasWidth,
  canvasHeight,
  thickness,
  unit,
  hasOverlaps,
  onSaveLayout,
  readOnly,
  materialColor,
  setSuppressSelectionUI,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDxfGenerating, setIsDxfGenerating] = useState(false);
const [isCartInfoOpen, setIsCartInfoOpen] = useState(false);
const [isAddingToCart, setIsAddingToCart] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
const [dxfFailed, setDxfFailed] = useState(false);
const { addToCart, cartItems } = useCart();

  const thicknessInches = unit === "mm" ? mmToInches(thickness) : thickness;
  const allowedDepthInches = Math.max(0, thicknessInches - 0.25);
  const floorViolationCount = droppedTools.filter((t) => {
    const depthInches = typeof t.depth === "number" ? (t.unit === "mm" ? mmToInches(t.depth) : t.depth) : 0;
    return depthInches > allowedDepthInches;
  }).length;
  const isLayoutInvalid = hasOverlaps;

  const handleAddToCart = async () => {
    if (hasOverlaps) {
      setSaveError(
        "Cannot add layout with overlapping tools to cart. Please fix overlaps first."
      );
      return;
    }
    if (droppedTools.length === 0) {
      setSaveError(
        "Cannot add empty layout to cart. Please add at least one tool."
      );
      return;
    }


    setIsSaving(true);
    setIsAddingToCart(true);
    setSaveError(null);

    try {
      let additionalData: LayoutFormData = {};
      const savedData = sessionStorage.getItem("layoutForm");
      if (savedData) {
        try {
          additionalData = JSON.parse(savedData) as LayoutFormData;
        } catch (error) {
          console.error("Error parsing stored data:", error);
        }
      }

      const effectiveMaterialColor =
        (materialColor && materialColor.trim()) ||
        (additionalData.materialColor && additionalData.materialColor.trim()) ||
        "";
      if (!effectiveMaterialColor) {
        const msg = "Please select a material color before adding to cart.";
        setSaveError(msg);
        toast.error(msg);
        setIsSaving(false);
        return;
      }

      const thicknessInches = unit === "mm" ? mmToInches(thickness) : thickness;
      const allowedDepthInches = Math.max(0, thicknessInches - 0.25);
      const depths = await Promise.all(droppedTools.map((t) => computeDepthInches(t)));
      const tooDeep = depths.some((d) => d > allowedDepthInches);
      // if (tooDeep) {
      //   const msg = "One or more tool pocket depths exceed the allowable depth for this material thickness.";
      //   setSaveError(msg);
      //   toast.error(msg);
      //   setIsSaving(false);
      //   return;
      // }

      const layoutName = await resolveLayoutName(additionalData);
      const containerSize = `${additionalData.canvasWidth ?? canvasWidth}" × ${additionalData.canvasHeight ?? canvasHeight}"`;
      const saveResult = await handleSaveAndExit({ skipRedirect: true });
      if (!saveResult || !saveResult.id) {
        throw new Error("Failed to save layout");
      }
      const savedLayoutId = saveResult.id;

      if (cartItems.some(i => i.id === savedLayoutId)) {
        const msg = "Layout already exists in cart";
        setSaveError(msg);
        toast.error(msg);
        setIsSaving(false);
        setIsAddingToCart(false);
        return;
      }

      const snapshotUrl = saveResult.snapshotUrl || undefined;
      const cartTools = await Promise.all(
        droppedTools.map(async (tool) => {
          const depthInches = await computeDepthInches(tool);
          const depthForCart =
            tool.unit === "mm" ? inchesToMm(depthInches) : depthInches;
          return {
            id: tool.id,
            name: tool.name,
            x: convertPositionToInches(tool.x, canvasWidth, true),
            y: convertPositionToInches(tool.y, canvasHeight, false),
            rotation: tool.rotation,
            flipHorizontal: tool.flipHorizontal,
            flipVertical: tool.flipVertical,
            depth: parseFloat(depthForCart.toFixed(3)),
            unit: tool.unit,
            opacity: tool.opacity ?? 100,
            smooth: tool.smooth ?? 0,
            image: tool.image || "/images/workspace/layout.svg",
            groupId: tool.groupId ?? null,
            isText: tool.toolType === "text" || tool.toolBrand === "TEXT",
          };
        })
      );
      const cartLayoutData = {
        canvas: {
          width: additionalData.canvasWidth ?? canvasWidth,
          height: additionalData.canvasHeight ?? canvasHeight,
          unit,
          thickness,
          materialColor: additionalData.materialColor || materialColor,
        },
        tools: cartTools,
      };
      const calculatedPrice = calculatePriceFromLayoutData(cartLayoutData);
      const dxfUrl = await composeDxfForLayout().catch(() => null);
      if (!dxfUrl) {
        const msg = "DXF generation failed. Try again.";
        setSaveError(msg);
        toast.error(msg);
        setIsSaving(false);
        setIsAddingToCart(false);
        setDxfFailed(true);
        return;
      }
      setDxfFailed(false);
      await addToCart({
        id: savedLayoutId,
        name: layoutName,
        containerSize,
        price: calculatedPrice,
        snapshotUrl,
        layoutData: cartLayoutData,
        dxfUrl,
      });
      toast.success("Layout saved and added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to add layout to cart"
      );
    } finally {
      setIsSaving(false);
      setIsAddingToCart(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper function to get auth token from localStorage
  const getAuthToken = (): string | null => {
    try {
      return localStorage.getItem("auth-token");
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  };

  // NEW: resolve the layout name without overwriting existing names on update
  const resolveLayoutName = async (additionalData: LayoutFormData): Promise<string> => {
    const fromSession = (additionalData.layoutName || "").trim();
    if (fromSession) return fromSession;

    let editingId: string | null = null;
    try {
      editingId = sessionStorage.getItem("editingLayoutId");
    } catch { }

    if (editingId) {
      // Prefer cached name if available
      try {
        const cached = sessionStorage.getItem("editingLayoutName");
        if (cached && cached.trim()) return cached.trim();
      } catch { }

      // Fallback: fetch existing layout name to avoid overwriting
      try {
        const token = getAuthToken();
        if (token) {
          const res = await fetch(`/api/layouts?id=${editingId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json().catch(() => ({}));
          const existingName = json?.data?.name;
          if (typeof existingName === "string" && existingName.trim()) {
            try {
              sessionStorage.setItem("editingLayoutName", existingName);
            } catch { }
            return existingName;
          }
        }
      } catch { }
    }

    // Final fallback for brand-new layouts
    return `Layout ${new Date().toLocaleDateString()}`;
  };

  // Helpers to compute inches for length/depth using fetched tool or dropped tool
  const toInches = (value: number | undefined, sourceUnit?: string) => {
    if (typeof value !== "number") return undefined;
    return sourceUnit === "mm" ? mmToInches(value) : value;
  };

  const computeLengthInches = (
    droppedTool: DroppedTool,
    fetchedTool: FetchedTool
  ) => {
    const cvLen = fetchedTool?.cvResponse?.dimensions?.length_inches;
    if (typeof cvLen === "number" && cvLen > 0)
      return parseFloat(cvLen.toFixed(3));

    const dbLen = toInches(fetchedTool?.length, fetchedTool?.unit);
    if (typeof dbLen === "number" && dbLen > 0)
      return parseFloat(dbLen.toFixed(3));

    const dtLen = toInches(droppedTool.length, droppedTool.unit);
    if (typeof dtLen === "number" && dtLen > 0)
      return parseFloat(dtLen.toFixed(3));

    return 5.0; // final fallback
  };

  const computeDepthInches = async (
    droppedTool: DroppedTool,
    fetchedTool?: FetchedTool
  ): Promise<number> => {
    let toolData = fetchedTool;

    const isShape = droppedTool.toolBrand === "SHAPE";
    const isFingerCut =
      droppedTool.toolBrand === "FINGERCUT" ||
      droppedTool.metadata?.isFingerCut;
    const isText = droppedTool.toolBrand === "TEXT" || droppedTool.toolType === "text";
    if (!toolData && !isShape && !isFingerCut && !isText) {
      const authToken = getAuthToken();
      if (authToken) {
        const toolId =
          droppedTool.id.split("-").slice(0, -1).join("-") ||
          droppedTool.id ||
          droppedTool.metadata?.originalId;
        try {
          if (toolId) {
            const res = await fetch(`/api/user/tool/getTool?toolId=${toolId}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (res.ok) {
              const json = await res.json();
              toolData = json.tool;
            }
          }
        } catch { }
      }
    }

    // Prefer CV depth if available
    const cvDepth = toolData?.cvResponse?.dimensions?.depth_inches;
    if (typeof cvDepth === "number" && cvDepth > 0)
      return parseFloat(cvDepth.toFixed(3));

    // Fall back to DB depth, converting from mm if necessary
    const dbDepthRaw = toolData?.depth;
    const dbDepthUnit = toolData?.unit;
    if (typeof dbDepthRaw === "number" && dbDepthRaw > 0) {
      const dbDepthInches =
        dbDepthUnit === "mm" ? mmToInches(dbDepthRaw) : dbDepthRaw;
      return parseFloat(dbDepthInches.toFixed(3));
    }

    const rawDepth = droppedTool.depth;
    if (typeof rawDepth === "number" && rawDepth > 0) {
      const inches = droppedTool.unit === "mm" ? mmToInches(rawDepth) : rawDepth;
      return parseFloat(inches.toFixed(3));
    }
    return 0.25;
  };

  const convertPositionToInches = (
    pixelPosition: number,
    canvasDimension: number,
    isX: boolean = true
  ): number => {
    const canvasInchesX = unit === "mm" ? mmToInches(canvasWidth) : canvasWidth;
    const canvasInchesY = unit === "mm" ? mmToInches(canvasHeight) : canvasHeight;

    const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLDivElement;
    const DPI = 96;

    let baseWidthPx = canvasInchesX * DPI;
    let baseHeightPx = canvasInchesY * DPI;

    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const transform = canvasElement.style.transform;
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      const zoom = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      baseWidthPx = rect.width / zoom;
      baseHeightPx = rect.height / zoom;
    }

    const ppiX = baseWidthPx / canvasInchesX;
    const ppiY = baseHeightPx / canvasInchesY;

    let inches = isX ? pixelPosition / ppiX : pixelPosition / ppiY;
    if (!isX) inches = canvasInchesY - inches;

    return Number(inches.toFixed(2));
  };

  // Helper function to get tool dimensions (aligned with Canvas.tsx)
  const getToolDimensions = (tool: DroppedTool) => {
    const DPI = 96;
    const mmToPx = (mm: number) => (mm / 25.4) * DPI;
    const inchesToPx = (inches: number) => inches * DPI;

    // Finger cuts: convert stored physical units to pixels
    if (tool.metadata?.isFingerCut) {
      const DPI = 96;
      const mmToPx = (mm: number) => (mm / 25.4) * DPI;
      const inchesToPx = (inches: number) => inches * DPI;

      // Legacy heuristic: treat obviously large values as px from older data
      const looksLikePx =
        (tool.unit === 'inches' && ((tool.width ?? 0) > 50 || (tool.length ?? 0) > 2)) ||
        (tool.unit === 'mm' && ((tool.width ?? 0) > 1000 || (tool.length ?? 0) > 50));

      if (looksLikePx) {
        const widthPx = Math.max(10, typeof tool.width === 'number' ? tool.width : 50);
        const heightPx = Math.max(10, typeof tool.length === 'number' ? tool.length : inchesToPx(0.2));
        return { toolWidth: widthPx, toolHeight: heightPx };
      }

      const defaultThicknessInches = 0.2;
      const widthPx =
        tool.unit === 'mm'
          ? mmToPx(tool.width || 0)
          : inchesToPx(tool.width || 0);
      const heightPx =
        tool.unit === 'mm'
          ? mmToPx((tool.length ?? defaultThicknessInches * 25.4))
          : inchesToPx((tool.length ?? defaultThicknessInches));

      return {
        toolWidth: Math.max(20, widthPx),
        toolHeight: Math.max(20, heightPx),
      };
    }

    // Shapes: convert stored width/length (mm/inches) to pixels
    if (tool.toolBrand === "SHAPE") {
      const widthPx =
        tool.unit === "mm"
          ? mmToPx(tool.width || 0)
          : inchesToPx(tool.width || 0);
      const heightPx =
        tool.unit === "mm"
          ? mmToPx(tool.length || 0)
          : inchesToPx(tool.length || 0);

      return {
        toolWidth: Math.max(20, widthPx),
        toolHeight: Math.max(20, heightPx),
      };
    }

    // Text: convert stored width/length (mm/inches) to pixels
    if (tool.toolBrand === "TEXT" || tool.toolType === "text") {
      const widthPx =
        tool.unit === "mm"
          ? mmToPx(tool.width || 0)
          : inchesToPx(tool.width || 0);
      const heightPx =
        tool.unit === "mm"
          ? mmToPx(tool.length || 0)
          : inchesToPx(tool.length || 0);

      return {
        toolWidth: Math.max(20, widthPx),
        toolHeight: Math.max(20, heightPx),
      };
    }

    // Image tools: use metadata.length (physical height) + aspect ratio
    if (tool.metadata?.length) {
      const len = tool.metadata.length;
      const toolHeightPx = tool.unit === 'mm' ? mmToPx(len) : inchesToPx(len);

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

    // Fallback for legacy cases
    return {
      toolWidth: tool.width || 50,
      toolHeight: tool.length || 50,
    };
  };

  // Generate DXF file using Gradio
  // Inside Header.tsx
  const generateDxfFile = async () => {
    if (droppedTools.length === 0) {
      setSaveError(
        "Cannot download DXF with no tools. Please add at least one tool."
      );
      return;
    }

    setIsDxfGenerating(true);
    setSaveError(null);

    try {
      // Get metadata
      let layoutName = "Tool Layout";
      const sessionData = sessionStorage.getItem("layoutForm");
      if (sessionData) {
        try {
          const layoutForm = JSON.parse(sessionData) as LayoutFormData;
          layoutName = layoutForm.layoutName || "Tool Layout";
        } catch (err) {
          console.error("Error parsing session data:", err);
        }
      }

      // Convert canvas dimensions to inches
      const canvasWidthInches =
        unit === "mm" ? mmToInches(canvasWidth) : canvasWidth;
      const canvasHeightInches =
        unit === "mm" ? mmToInches(canvasHeight) : canvasHeight;
      const canvasThicknessInches =
        unit === "mm" ? mmToInches(thickness) : thickness;

      const authToken = localStorage.getItem("auth-token");
      if (!authToken) throw new Error("Missing auth token");

      // Prepare arrays for tools and shapes
      const tools: ToolPayload[] = [];
      const shapes: ShapePayload[] = [];

      // Process all dropped items
      for (const droppedTool of droppedTools) {
        // Get tool dimensions to calculate bottom-left position
        const { toolHeight, toolWidth } = getToolDimensions(droppedTool);
        const DPI = 96;

        // Convert positions to inches with bottom-left origin for Y
        const xInches = convertPositionToInches(
          droppedTool.x,
          canvasWidth,
          true
        );
        const yInches = convertPositionToInches(
          droppedTool.y + toolHeight,
          canvasHeight,
          false
        );

        // Treat shapes, finger cuts, and text as custom shapes
        const isShape = droppedTool.toolBrand === "SHAPE";
        const isFingerCut =
          droppedTool.toolBrand === "FINGERCUT" ||
          droppedTool.metadata?.isFingerCut;
        const isTextTool =
          droppedTool.toolBrand === "TEXT" || droppedTool.toolType === "text";

        // NEW: Handle text tools as custom shapes with text-specific fields
        if (isTextTool) {
          const widthInches = Number((toolWidth / DPI).toFixed(3));
          const heightInches = Number((toolHeight / DPI).toFixed(3));

          shapes.push({
            tool_id: droppedTool.id,
            name: droppedTool.name || "Text",
            brand: "Text",
            unit: droppedTool.unit,
            is_custom_shape: true,
            shape_type: "text",
            shape_data: {
              width_inches: widthInches,
              height_inches: heightInches,
              content: droppedTool.textContent ?? "",
              font_size_px: droppedTool.textFontSizePx ?? 24,
              align: droppedTool.textAlign ?? "center",
              color: droppedTool.textColor || "#000000",
            },
            position_inches: { x: xInches, y: yInches, z: 0 },
            rotation_degrees: normalizeRotationDeg(droppedTool.rotation),
            cut_depth_inches: await computeDepthInches(droppedTool),
            flip_horizontal: droppedTool.flipHorizontal || false,
            flip_vertical: droppedTool.flipVertical || false,
          });

          continue;
        }

        if (isShape || isFingerCut) {
          let shapeType: "rectangle" | "circle" | "polygon" | "fingercut" = "rectangle";
          type ShapeData =
            | { width_inches: number; height_inches: number }
            | { radius_inches: number }
            | { points: { x: number; y: number }[] };

          let shapeData: ShapeData;

          if (
            isFingerCut ||
            droppedTool.name.toLowerCase().includes("finger")
          ) {
            // Finger Cut: use width × length, tag type as 'fingercut'
            const widthInches =
              unit === "mm" ? mmToInches(droppedTool.width) : droppedTool.width;
            const heightInches =
              unit === "mm"
                ? mmToInches(droppedTool.length)
                : droppedTool.length;
            shapeData = {
              width_inches: widthInches,
              height_inches: heightInches,
            };
            shapeType = "fingercut";
            // name = "Finger Cut Rectangle"; // optional: keep existing name
          } else if (
            droppedTool.name.toLowerCase().includes("circle") ||
            droppedTool.image?.includes("circle.svg")
          ) {
            // Circle: radius from diameter (max of width/length)
            shapeType = "circle";
            const diameter = Math.max(droppedTool.width, droppedTool.length);
            const radiusInches =
              unit === "mm" ? mmToInches(diameter / 2) : diameter / 2;
            shapeData = { radius_inches: radiusInches };
          } else if (droppedTool.name.toLowerCase().includes("polygon")) {
            // Polygon: simple rectangle path (extend as needed)
            shapeType = "polygon";
            const widthInches =
              unit === "mm" ? mmToInches(droppedTool.width) : droppedTool.width;
            const heightInches =
              unit === "mm"
                ? mmToInches(droppedTool.length)
                : droppedTool.length;
            shapeData = {
              points: [
                { x: 0, y: 0 },
                { x: widthInches, y: 0 },
                { x: widthInches, y: heightInches },
                { x: 0, y: heightInches },
              ],
            };
          } else {
            // Default rectangle
            const widthInches =
              unit === "mm" ? mmToInches(droppedTool.width) : droppedTool.width;
            const heightInches =
              unit === "mm"
                ? mmToInches(droppedTool.length)
                : droppedTool.length;
            shapeData = {
              width_inches: widthInches,
              height_inches: heightInches,
            };
            shapeType = "rectangle";
          }

          // Push shape entry in the payload
          shapes.push({
            tool_id: droppedTool.id,
            name: droppedTool.name,
            brand: "Custom",
            unit: droppedTool.unit,
            is_custom_shape: true,
            shape_type: shapeType,
            shape_data: shapeData,
            position_inches: { x: xInches, y: yInches, z: 0 },
            rotation_degrees: normalizeRotationDeg(droppedTool.rotation),
            cut_depth_inches: droppedTool.depth ?? 0.2,
            flip_horizontal: droppedTool.flipHorizontal || false,
            flip_vertical: droppedTool.flipVertical || false,
          });

          continue; // Skip the regular tool branch for shapes
        }

        // Regular tool: fetch dxf_link and include standard fields
        const toolId =
          droppedTool.metadata?.originalId ||
          droppedTool.id.split("-").slice(0, -1).join("-");
        const toolRes = await fetch(`/api/user/tool/getTool?toolId=${toolId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!toolRes.ok) {
          throw new Error(`Failed to fetch tool data for ID: ${toolId}`);
        }

        const { tool } = await toolRes.json();

        if (!tool?.cvResponse?.dxf_url) {
          throw new Error(`Tool ${toolId} has no DXF link`);
        }

        tools.push({
          tool_id: toolId,
          name: droppedTool.name,
          brand: tool.toolBrand || "Brand",
          unit: droppedTool.unit,
          dxf_link: (tool.cvResponse.dxf_url || "").trim(),
          position_inches: { x: xInches, y: yInches, z: 0 },
          rotation_degrees: normalizeRotationDeg(droppedTool.rotation),
          height_diagonal_inches: computeLengthInches(droppedTool, tool),
          depth_inches: await computeDepthInches(droppedTool, tool),
          cut_depth_inches: await computeDepthInches(droppedTool, tool),
          flip_horizontal: droppedTool.flipHorizontal || false,
          flip_vertical: droppedTool.flipVertical || false,
          opacity: droppedTool.opacity || 100,
          smooth: droppedTool.smooth || 0,
        });
      }

      // Prepare the request data (tools + shapes together)
      const requestData = {
        canvas_information: {
          width_inches: canvasWidthInches,
          height_inches: canvasHeightInches,
          thickness_inches: canvasThicknessInches,
          has_overlaps: hasOverlaps,
          canvas_color: materialColor,
        },
        layout_metadata: {
          layout_name: layoutName,
          brand: "CustomBrand", // TODO: wire to sessionForm if available
          container_type: "Drawer", // TODO: wire to sessionForm if available
        },
        tools: [...tools, ...shapes],
        output_filename: `${layoutName.replace(/\s+/g, "_")}-layout.dxf`,
        upload_to_s3: true,
      };

      console.log("Sending to Canvas DXF API:", requestData);

      // Update the fetch call to use our proxy API
      const response = await fetch("/api/dxf-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to download DXF file");
      }

      // Download the file
      if (data.s3_url) {
        const link = document.createElement("a");
        link.href = data.s3_url;
        link.download = data.output_filename || requestData.output_filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowDropdown(false);
        console.log("DXF file downloaded successfully");
      } else {
        throw new Error("No download URL provided in the response");
      }
    } catch (err) {
      console.error("Error downloading DXF:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to download DXF file"
      );
    } finally {
      setIsDxfGenerating(false);
    }
  };

  const composeDxfForLayout = async (): Promise<string | null> => {
    if (droppedTools.length === 0) return null;
    try {
      let layoutName = "Tool Layout";
      const sessionData = sessionStorage.getItem("layoutForm");
      if (sessionData) {
        try {
          const layoutForm = JSON.parse(sessionData) as LayoutFormData;
          layoutName = layoutForm.layoutName || layoutName;
        } catch {}
      }
      const canvasWidthInches = unit === "mm" ? mmToInches(canvasWidth) : canvasWidth;
      const canvasHeightInches = unit === "mm" ? mmToInches(canvasHeight) : canvasHeight;
      const canvasThicknessInches = unit === "mm" ? mmToInches(thickness) : thickness;
      const authToken = localStorage.getItem("auth-token");
      if (!authToken) return null;
      const tools: ToolPayload[] = [];
      const shapes: ShapePayload[] = [];
      for (const droppedTool of droppedTools) {
        const { toolHeight, toolWidth } = getToolDimensions(droppedTool);
        const xInches = convertPositionToInches(droppedTool.x, canvasWidth, true);
        const yInches = convertPositionToInches(droppedTool.y + toolHeight, canvasHeight, false);
        const isFingerCut = droppedTool.toolBrand === "FINGERCUT" || droppedTool.metadata?.isFingerCut;
        const isTextTool = droppedTool.toolBrand === "TEXT" || droppedTool.toolType === "text";
        if (isTextTool) {
          const DPI = 96;
          const widthInches = Number((toolWidth / DPI).toFixed(3));
          const heightInches = Number((toolHeight / DPI).toFixed(3));
          shapes.push({
            tool_id: droppedTool.id,
            name: droppedTool.name || "Text",
            brand: "Text",
            unit: droppedTool.unit,
            is_custom_shape: true,
            shape_type: "text",
            shape_data: {
              width_inches: widthInches,
              height_inches: heightInches,
              content: droppedTool.textContent ?? "",
              font_size_px: droppedTool.textFontSizePx ?? 24,
              align: droppedTool.textAlign ?? "center",
              color: droppedTool.textColor || "#000000",
            },
            position_inches: { x: xInches, y: yInches, z: 0 },
            rotation_degrees: normalizeRotationDeg(droppedTool.rotation),
            cut_depth_inches: await computeDepthInches(droppedTool),
            flip_horizontal: droppedTool.flipHorizontal || false,
            flip_vertical: droppedTool.flipVertical || false,
          });
          continue;
        }
        if (droppedTool.toolBrand === "SHAPE" || isFingerCut) {
          let shapeType: "rectangle" | "circle" | "polygon" | "fingercut" = "rectangle";
          let shapeData;
          if (isFingerCut || droppedTool.name.toLowerCase().includes("finger")) {
            const widthInches = unit === "mm" ? mmToInches(droppedTool.width) : droppedTool.width;
            const heightInches = unit === "mm" ? mmToInches(droppedTool.length) : droppedTool.length;
            shapeData = { width_inches: widthInches, height_inches: heightInches };
            shapeType = "fingercut";
          } else if (droppedTool.name.toLowerCase().includes("circle") || (droppedTool.image || "").includes("circle.svg")) {
            shapeType = "circle";
            const diameter = Math.max(droppedTool.width, droppedTool.length);
            const radiusInches = unit === "mm" ? mmToInches(diameter / 2) : diameter / 2;
            shapeData = { radius_inches: radiusInches };
          } else if (droppedTool.name.toLowerCase().includes("polygon")) {
            shapeType = "polygon";
            const widthInches = unit === "mm" ? mmToInches(droppedTool.width) : droppedTool.width;
            const heightInches = unit === "mm" ? mmToInches(droppedTool.length) : droppedTool.length;
            shapeData = { points: [ { x: 0, y: 0 }, { x: widthInches, y: 0 }, { x: widthInches, y: heightInches }, { x: 0, y: heightInches } ] };
          } else {
            const widthInches = unit === "mm" ? mmToInches(droppedTool.width) : droppedTool.width;
            const heightInches = unit === "mm" ? mmToInches(droppedTool.length) : droppedTool.length;
            shapeData = { width_inches: widthInches, height_inches: heightInches };
            shapeType = "rectangle";
          }
          shapes.push({
            tool_id: droppedTool.id,
            name: droppedTool.name,
            brand: "Custom",
            unit: droppedTool.unit,
            is_custom_shape: true,
            shape_type: shapeType,
            shape_data: shapeData,
            position_inches: { x: xInches, y: yInches, z: 0 },
            rotation_degrees: normalizeRotationDeg(droppedTool.rotation),
            cut_depth_inches: droppedTool.depth ?? 0.2,
            flip_horizontal: droppedTool.flipHorizontal || false,
            flip_vertical: droppedTool.flipVertical || false,
          });
          continue;
        }
        const toolId = droppedTool.metadata?.originalId || droppedTool.id.split("-").slice(0, -1).join("-");
        const toolRes = await fetch(`/api/user/tool/getTool?toolId=${toolId}`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (!toolRes.ok) continue;
        const { tool } = await toolRes.json();
        if (!tool?.cvResponse?.dxf_url) continue;
        tools.push({
          tool_id: toolId,
          name: droppedTool.name,
          brand: tool.toolBrand || "Brand",
          unit: droppedTool.unit,
          dxf_link: (tool.cvResponse.dxf_url || "").trim(),
          position_inches: { x: xInches, y: yInches, z: 0 },
          rotation_degrees: normalizeRotationDeg(droppedTool.rotation),
          height_diagonal_inches: computeLengthInches(droppedTool, tool),
          depth_inches: await computeDepthInches(droppedTool, tool),
          cut_depth_inches: await computeDepthInches(droppedTool, tool),
          flip_horizontal: droppedTool.flipHorizontal || false,
          flip_vertical: droppedTool.flipVertical || false,
          opacity: droppedTool.opacity || 100,
          smooth: droppedTool.smooth || 0,
        });
      }
      const requestData = {
        canvas_information: {
          width_inches: canvasWidthInches,
          height_inches: canvasHeightInches,
          thickness_inches: canvasThicknessInches,
          has_overlaps: hasOverlaps,
          canvas_color: materialColor,
        },
        layout_metadata: {
          layout_name: layoutName,
          brand: "CustomBrand",
          container_type: "Drawer",
        },
        tools: [...tools, ...shapes],
        output_filename: `${layoutName.replace(/\s+/g, "_")}-layout.dxf`,
        upload_to_s3: true,
      };
      const response = await fetch("/api/dxf-proxy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestData) });
      if (!response.ok) return null;
      const data = await response.json().catch(() => null);
      return (data && (data.s3_url || data.s3Url)) ? (data.s3_url || data.s3Url) : null;
    } catch {
      return null;
    }
  };

  // Generate comprehensive text file data (always in inches + diagonal height + position in inches)
  const generateTextFileData = (): string => {
    const timestamp = new Date().toISOString();

    let content = `Tool Layout Export\n`;
    content += `Generated: ${timestamp}\n`;
    content += `${"=".repeat(50)}\n\n`;

    // Canvas Information
    content += `CANVAS INFORMATION\n`;
    content += `${"-".repeat(20)}\n`;
    content += `Width: ${unit === "mm" ? mmToInches(canvasWidth).toFixed(2) : canvasWidth
      } inches\n`;
    content += `Height: ${unit === "mm" ? mmToInches(canvasHeight).toFixed(2) : canvasHeight
      } inches\n`;
    content += `Thickness: ${unit === "mm" ? mmToInches(thickness).toFixed(2) : thickness
      } inches\n`;
    content += `Has Overlaps: ${hasOverlaps ? "Yes" : "No"}\n`;
    content += `Total Tools: ${droppedTools.length}\n\n`;

    // Session Data
    const sessionData = sessionStorage.getItem("layoutForm");
    if (sessionData) {
      try {
        const layoutForm = JSON.parse(sessionData) as LayoutFormData;
        content += `LAYOUT METADATA\n`;
        content += `${"-".repeat(20)}\n`;
        content += `Layout Name: ${layoutForm.layoutName || "N/A"}\n`;
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    }

    // Tool Information
    content += `TOOLS DETAILS\n`;
    content += `${"-".repeat(20)}\n`;

    droppedTools.forEach((tool, index) => {
      content += `Tool ${index + 1}:\n`;
      content += `  ID: ${tool.id}\n`;
      content += `  Original ID: ${tool.metadata?.originalId || "N/A"}\n`;
      content += `  Name: ${tool.name}\n`;
      content += `  Brand: ${tool.toolBrand}\n`;

      // Convert position from pixels to inches
      const xInches = convertPositionToInches(tool.x, canvasWidth);
      const yInches = convertPositionToInches(tool.y, canvasHeight);
      content += `  Position (pixels): (${Math.round(tool.x)}, ${Math.round(
        tool.y
      )})\n`;
      content += `  Position (inches): (${xInches.toFixed(
        2
      )}, ${yInches.toFixed(2)})\n`;

      content += `  Rotation: ${tool.rotation}°\n`;

      // Use length instead of width × length
      if (tool.metadata?.length) {
        content += `  Height (Diagonal): ${tool.metadata.length} inches\n`;
      } else if (tool.width && tool.length) {
        const diagonal = Math.sqrt(tool.width ** 2 + tool.length ** 2);
        const diagInches =
          tool.unit === "mm"
            ? mmToInches(diagonal).toFixed(2)
            : diagonal.toFixed(2);
        content += `  Height (Diagonal): ${diagInches} inches (calculated)\n`;
      } else {
        content += `  Height (Diagonal): N/A\n`;
      }

      content += `  Depth: ${Number(tool.depth).toFixed(2)} inches\n`;
      content += `  Flip Horizontal: ${tool.flipHorizontal}\n`;
      content += `  Flip Vertical: ${tool.flipVertical}\n`;
      content += `  Opacity: ${tool.opacity}%\n`;
      content += `  Smooth: ${tool.smooth}\n`;

      if (tool.groupId) {
        content += `  Group ID: ${tool.groupId}\n`;
      }

      content += "\n";
    });

    // Summary Statistics
    content += `SUMMARY\n`;
    content += `${"-".repeat(20)}\n`;
    const brands = [...new Set(droppedTools.map((tool) => tool.toolBrand))];
    const toolTypes = [...new Set(droppedTools.map((tool) => tool.name))];

    content += `Unique Brands: ${brands.join(", ")}\n`;
    content += `Tool Types: ${toolTypes.join(", ")}\n`;
    content += `Layout Valid: ${!hasOverlaps ? "Yes" : "No"}\n`;

    return content;
  };

  // Download text file
  const downloadTextFile = () => {
    try {
      const content = generateTextFileData();
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `tool-layout-${timestamp}.txt`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowDropdown(false);
    } catch (error) {
      console.error("Error downloading text file:", error);
      setSaveError("Failed to generate text file");
    }
  };

  // Replace the uploadToDigitalOcean function in your Header.tsx with this:

  const uploadToDigitalOcean = async (blob: Blob): Promise<string> => {
    try {
      // Create form data with the image blob
      const formData = new FormData();
      formData.append("image", blob, "layout.png");

      // Upload through your own API endpoint (no CORS issues)
      const response = await fetch("/api/upload-url", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: Upload failed`
        );
      }

      const { success, fileUrl } = await response.json();

      if (!success || !fileUrl) {
        throw new Error("Invalid response from upload API");
      }

      console.log("Successfully uploaded image:", fileUrl);
      return fileUrl;
    } catch (error) {
      console.error("Error uploading to DigitalOcean:", error);
      throw new Error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Capture and download layout image

  const captureCanvasImage = async (): Promise<Blob> => {
    const layoutElement = document.querySelector(
      '[data-canvas="true"]'
    ) as HTMLElement;
    if (!layoutElement) {
      throw new Error(
        "Canvas element not found. Make sure the canvas has data-canvas='true' attribute."
      );
    }

    // Save original styles to restore later
    const originalTransform = layoutElement.style.transform;
    const originalPosition = layoutElement.style.position;
    const originalZIndex = layoutElement.style.zIndex;

    try {
      // Temporarily adjust styles for better screenshot
      layoutElement.style.transform = "none";
      layoutElement.style.position = "static";
      layoutElement.style.zIndex = "auto";

      // Wait a bit for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await htmlToImage.toPng(layoutElement, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        pixelRatio: 1,
        quality: 0.9
      });

      // Convert base64 to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      console.log(`Canvas image captured: ${blob.size} bytes`);
      return blob;
    } catch (error) {
      console.error("Error capturing canvas image:", error);
      throw new Error(
        `Failed to capture image: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Always restore original styles
      layoutElement.style.transform = originalTransform;
      layoutElement.style.position = originalPosition;
      layoutElement.style.zIndex = originalZIndex;
    }
  };

  const handleSaveAndExit = async (options?: { skipRedirect?: boolean }) => {
    if (droppedTools.length === 0) {
      setSaveError("Cannot save empty layout. Please add at least one tool.");
      return;
    }
    // Block save when layout is invalid
    if (hasOverlaps) {
      setSaveError("Cannot save layout with overlapping tools. Please fix overlaps first.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    let imageUrl: string | null = null;

    try {
      const authToken = getAuthToken();
      if (!authToken)
        throw new Error("Authentication required. Please log in again.");

      let additionalData: LayoutFormData = {};
      const sessionData = sessionStorage.getItem("layoutForm");
      if (sessionData) {
        try {
          additionalData = JSON.parse(sessionData) as LayoutFormData;
        } catch (error) {
          console.error("Error parsing session data:", error);
        }
      }



      // Step 1: Capture and upload image
      try {
        // NEW: temporarily hide selection UI (rotation wheel) before screenshot
        setSuppressSelectionUI?.(true);
        // Wait a moment for the UI to update
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("Capturing canvas image...");
        const canvasBlob = await captureCanvasImage();

        // After capture, restore selection UI
        setSuppressSelectionUI?.(false);

        console.log("Uploading image to DigitalOcean...");
        imageUrl = await uploadToDigitalOcean(canvasBlob);

        console.log("Image uploaded successfully:", imageUrl);
      } catch (imageError) {
        // Ensure UI is restored if capture fails
        setSuppressSelectionUI?.(false);
        console.warn("Failed to capture/upload image:", imageError);
        // Continue saving without image - don't fail the entire operation
        setSaveError(
          "Warning: Could not save layout image, but layout data will still be saved."
        );
      }

      // Step 2: Save layout data with image URL
      const nameToSave = await resolveLayoutName(additionalData);
      const layoutData = {
        name: nameToSave,
        canvas: {
          width: additionalData.canvasWidth ?? canvasWidth,
          height: additionalData.canvasHeight ?? canvasHeight,
          unit: additionalData.units ?? unit,
          thickness: additionalData.thickness ?? thickness,
          materialColor: additionalData.materialColor || undefined,
        },
        tools: droppedTools.map((tool) => {
          // Determine shape info
          const isShape = tool.toolBrand === "SHAPE";
          const isFingerCut =
            tool.toolBrand === "FINGERCUT" || tool.metadata?.isFingerCut;

          let shapeType: "rectangle" | "circle" | "polygon" | undefined;
          let shapeData: Record<string, unknown> | undefined;

          if (isShape || isFingerCut) {
            if (isFingerCut || tool.name.toLowerCase().includes("finger")) {
              // FIX: derive inches from tool.unit, not DOM PPI
              const widthInches =
                tool.unit === "mm"
                  ? mmToInches(tool.width || 0)
                  : (tool.width || 0);
              const heightInches =
                tool.unit === "mm"
                  ? mmToInches(tool.length || 0)
                  : (tool.length || 0);

              shapeType = "rectangle";
              shapeData = {
                width_inches: widthInches,
                height_inches: heightInches,
              };
            } else if (
              tool.name.toLowerCase().includes("circle") ||
              (tool.image || "").includes("circle.svg")
            ) {
              const diameter = Math.max(tool.width, tool.length);
              const radiusInches =
                unit === "mm" ? mmToInches(diameter / 2) : diameter / 2;
              shapeType = "circle";
              shapeData = { radius_inches: radiusInches };
            } else if (tool.name.toLowerCase().includes("polygon")) {
              const widthInches =
                unit === "mm" ? mmToInches(tool.width) : tool.width;
              const heightInches =
                unit === "mm" ? mmToInches(tool.length) : tool.length;
              shapeType = "polygon";
              shapeData = {
                points: [
                  { x: 0, y: 0 },
                  { x: widthInches, y: 0 },
                  { x: widthInches, y: heightInches },
                  { x: 0, y: heightInches },
                ],
              };
            } else {
              const widthInches =
                unit === "mm" ? mmToInches(tool.width) : tool.width;
              const heightInches =
                unit === "mm" ? mmToInches(tool.length) : tool.length;
              shapeType = "rectangle";
              shapeData = {
                width_inches: widthInches,
                height_inches: heightInches,
              };
            }
          }

          const base = {
            id: tool.id,
            originalId: tool.metadata?.originalId,
            name: tool.name,
            x: convertPositionToInches(tool.x, canvasWidth, true),
            y: convertPositionToInches(tool.y, canvasHeight, false),
            rotation: tool.rotation,
            flipHorizontal: tool.flipHorizontal,
            flipVertical: tool.flipVertical,
            depth: tool.depth,
            unit: tool.unit,
            opacity: tool.opacity || 100,
            smooth: tool.smooth || 0,
            image: tool.image,
            groupId: tool.groupId,
            // NEW: compute and persist real physical dimensions
            realWidth: (() => {
              if (tool.metadata?.length) {
                const heightInches = tool.metadata.length;
                let aspect = 1.6;
                if (
                  tool.metadata?.naturalWidth &&
                  tool.metadata?.naturalHeight &&
                  tool.metadata.naturalHeight > 0
                ) {
                  aspect =
                    tool.metadata.naturalWidth / tool.metadata.naturalHeight;
                }
                const widthInches = heightInches * aspect;
                return tool.unit === "mm" ? widthInches * 25.4 : widthInches;
              }
              // shapes and non-image tools: use current width/length (already in tool.unit)
              if (typeof tool.width === "number") return tool.width;
              return undefined;
            })(),
            realHeight: (() => {
              if (tool.metadata?.length) {
                const heightInches = tool.metadata.length;
                return tool.unit === "mm" ? heightInches * 25.4 : heightInches;
              }
              if (typeof tool.length === "number") return tool.length;
              return undefined;
            })(),
            // NEW: persist text metadata and identifiers so edit mode can rehydrate text tools
            metadata: {
              ...(tool.metadata || {}),
              toolBrand: tool.toolBrand,
              toolType: tool.toolType,
              textContent: tool.textContent,
              textFontFamily: tool.textFontFamily,
              textFontWeight: tool.textFontWeight,
              textFontSizePx: tool.textFontSizePx,
              textAlign: tool.textAlign,
              textColor: tool.textColor,
            },
          };

          return shapeType
            ? { ...base, isCustomShape: true, shapeType, shapeData }
            : base;
        }),
        stats: {
          totalTools: droppedTools.length,
          validLayout: !hasOverlaps,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        snapshotUrl: imageUrl, // Will be null if upload failed
        ...additionalData,
      };

      console.log("Saving layout data:", {
        ...layoutData,
        snapshotUrl: imageUrl ? "✅ Included" : "❌ Failed",
      });

      const editingLayoutId = (() => {
        try {
          return sessionStorage.getItem("editingLayoutId");
        } catch {
          return null;
        }
      })();

      // Always update when an editing id exists
      const endpoint = editingLayoutId
        ? `/api/layouts?id=${editingLayoutId}`
        : `/api/layouts`;

      const method = editingLayoutId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(layoutData),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save layout");
      }

      // Derive id + snapshotUrl from response
      const savedLayoutId =
        method === "POST"
          ? String(result.id)
          : String(editingLayoutId || result.data?._id);

      const savedSnapshotUrl: string | null =
        method === "POST"
          ? result.snapshotUrl ?? null
          : result.data?.snapshotUrl ?? null;

      // Persist editing id and name for subsequent updates (no duplicates)
      try {
        sessionStorage.setItem("editingLayoutId", savedLayoutId);
        sessionStorage.setItem("editingLayoutName", nameToSave);
      } catch { }

      setSaveError(null);
      setSaveSuccess(true);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

      // Only clear form data when redirecting; keep it for Add to Cart
      if (!options?.skipRedirect) {
        try {
          sessionStorage.removeItem("layoutForm");
        } catch { }
      }

      // Return for callers like Add to Cart
      return { id: savedLayoutId, snapshotUrl: savedSnapshotUrl };
    } catch (error) {
      console.error("Error saving layout:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save layout"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExit = () => {
    try {
      sessionStorage.removeItem("layoutForm");
    } catch { }
    window.location.href = "/workspace";
  };

  const exportOptions = [
    {
      icon: File,
      label: "Download DXF File",
      action: generateDxfFile,
      disabled: droppedTools.length === 0,
      loading: isDxfGenerating,
    },
    {
      icon: ShoppingCart,
      label: dxfFailed ? "Try again" : "Add to cart",
      action: handleAddToCart,
      disabled:
        isAddingToCart ||
        hasOverlaps ||
        droppedTools.length === 0 ||
        !(
          materialColor ||
          (typeof window !== "undefined" &&
            (() => {
              try {
                const s = sessionStorage.getItem("layoutForm");
                const p = s ? JSON.parse(s) : null;
                return typeof (p && p.materialColor) === "string" && p.materialColor;
              } catch {
                return "";
              }
            })())
        ) ||
        floorViolationCount > 0,
      loading: isAddingToCart,
    },
  ];

  return (
    <div className="bg-white px-4 py-4 border-gray-200 border-b">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Image
            className="cursor-pointer"
            onClick={() => window.history.back()}
            src={"/images/icons/workspace/Back.svg"}
            alt="Back"
            width={35}
            height={35}
          />
          <h1 className="ml-2 font-bold text-gray-900 text-2xl">
            {readOnly ? "Inspect Layout" : "Design Your Tool Layout"}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {!readOnly && (
            <div className="flex items-center space-x-2">
              <>
                <button
                  className={`flex items-center space-x-2 px-5 py-4 rounded-2xl text-sm font-medium transition-colors ${isSaving || hasOverlaps || droppedTools.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : saveSuccess
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-primary"
                    } text-white`}
                  onClick={() => handleSaveAndExit()}
                  disabled={
                    isSaving || hasOverlaps || droppedTools.length === 0
                  }
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </>

              <button
                className={`flex items-center space-x-2 px-5 py-4 rounded-2xl text-sm font-medium transition-colors bg-primary text-white`}
                onClick={() => handleExit()}
              >
                <span>Exit</span>
              </button>
            </div>
          )}

          {/* Export Options Dropdown */}
          {!readOnly && (
            <div className="relative" ref={dropdownRef}>
              <button
                className={`px-4 py-4 rounded-2xl transition-colors ${hasOverlaps || droppedTools.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                onClick={() => { if (hasOverlaps || droppedTools.length === 0) return; setShowDropdown(!showDropdown); }}
                disabled={hasOverlaps || droppedTools.length === 0}
              >
                <MoreHorizontal className="w-5 h-5 text-white" />
              </button>

              {showDropdown && (
                <div className="right-0 z-50 absolute bg-white shadow-lg mt-2 border border-gray-200 rounded-lg w-56">
                  <div className="py-2">
                    <div className="px-4 py-2 border-gray-100 border-b font-medium text-gray-700 text-sm">
                      Export Options
                    </div>
                    {exportOptions.map((option, index) => (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        aria-disabled={option.disabled}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center space-x-3 transition-colors ${option.disabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                          }`}
                        onClick={option.disabled ? undefined : option.action}
                      >
                        {option.loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <option.icon className="w-4 h-4" />
                        )}
                        <span>
                          {option.loading
                            ? (option.action === handleAddToCart ? "Adding to cart..." : "Downloading DXF...")
                            : option.label}
                        </span>
                        {option.action === handleAddToCart && option.disabled && floorViolationCount > 0 && (
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              className="ml-8 text-gray-400 hover:text-gray-600"
                              onClick={(e) => { e.stopPropagation(); setIsCartInfoOpen(!isCartInfoOpen); }}
                            >
                              <Info className="w-4 h-4" />
                            </button>

                            {isCartInfoOpen && (
                              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-3 w-80 z-50">
                                <p className="text-xs text-gray-700">
                                  {floorViolationCount === 1
                                    ? "This layout can’t be added to your cart because 1 tool pocket exceeds the allowable depth for this material thickness. Each pocket must maintain at least a 0.25-inch floor (e.g., with 1-inch material, the deepest pocket allowed is 0.75 inches)."
                                    : `This layout can’t be added to your cart because ${floorViolationCount} tool pockets exceed the allowable depth for this material thickness. Each pocket must maintain at least a 0.25-inch floor (e.g., with 1-inch material, the deepest pocket allowed is 0.75 inches).`}
                                </p>
                              </div>
                            )}
                          </div>

                        )}
                        {option.disabled &&
                          !option.loading &&
                          droppedTools.length === 0 && (
                            <span className="ml-auto text-gray-400 text-xs">
                              (Add tools first)
                            </span>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 mt-3 px-4 py-3 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircle className="flex-shrink-0 mt-0.5 w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-green-800 text-sm">
                Layout Saved Successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Saving Message */}
      {isSaving && !saveSuccess && (
        <div className="bg-blue-50 mt-3 px-4 py-3 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <RefreshCw className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <p className="font-medium text-blue-800 text-sm">
                Saving Layout...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DXF Generation Message */}
      {isDxfGenerating && (
        <div className="bg-blue-50 mt-3 px-4 py-3 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <RefreshCw className="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-500 animate-spin" />
            <div>
              <p className="font-medium text-blue-800 text-sm">
                Downloading DXF File...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="bg-red-50 mt-3 px-4 py-3 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="flex-shrink-0 mt-0.5 w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium text-red-800 text-sm">
                Operation Failed
              </p>
              <p className="mt-1 text-red-700 text-sm">{saveError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Layout Status */}
      <div className="flex justify-between items-center mt-3 text-sm">
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">
            Tools: <span className="font-medium">{droppedTools.length}</span>
          </span>
          <span className="text-gray-600">
            Canvas:{" "}
            <span className="font-medium">
              {canvasWidth} × {canvasHeight} {unit}
            </span>
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center space-x-2">
            {hasOverlaps ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Invalid Layout</span>
              </>
            ) : droppedTools.length === 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600">No Tools</span>
              </>
            ) : (
              <>
                <div className="bg-green-500 rounded-full w-2 h-2"></div>
                <span className="text-green-600">Ready to Save</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
