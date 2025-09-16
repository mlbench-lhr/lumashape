// /app/api/layouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/utils/dbConnect';
import Layout from '@/lib/models/layout';

const JWT_SECRET = process.env.JWT_SECRET!;

// Define interfaces for type safety
// Updated interfaces for the layout API
interface ToolData {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  thickness: number;
  unit: 'mm' | 'inches';
  opacity?: number;
  smooth?: number;
  image?: string;
  groupId?: string;
  // New fields for real sizing support
  metadata?: {
    userEmail?: string;
    paperType?: string;
    description?: string;
    purchaseLink?: string;
    backgroundImg?: string;
    outlinesImg?: string;
    processIngData?: string; // Contains the scale info
    createdAt?: string;
    updatedAt?: string;
    version?: number;
  };
  realWidth?: number;  // Calculated real width
  realHeight?: number; // Calculated real height
}

interface CanvasData {
  width: number;
  height: number;
  unit: 'mm' | 'inches';
  thickness: number;
}

interface LayoutStats {
  totalTools: number;
  validLayout: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface LayoutData {
  name: string;
  description?: string;
  canvas: CanvasData;
  tools: ToolData[];
  stats: LayoutStats;
}

// Extended interface for request body (may contain additional unknown fields)
interface LayoutRequestBody extends LayoutData {
  [key: string]: unknown;
}

// JWT payload interface
interface JWTPayload {
  email: string;
  [key: string]: unknown;
}

// Search query interface for MongoDB
interface SearchQuery {
  userEmail: string;
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
}

// Validation helper functions
const validateCanvas = (canvas: unknown): CanvasData => {
  if (!canvas || typeof canvas !== 'object' || canvas === null) {
    throw new Error('Canvas data is required');
  }

  const canvasObj = canvas as Record<string, unknown>;
  const { width, height, unit, thickness } = canvasObj;

  if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
    throw new Error('Canvas must have valid positive dimensions');
  }

  if (typeof unit !== 'string' || !(['mm', 'inches'] as const).includes(unit as 'mm' | 'inches')) {
    throw new Error('Canvas unit must be either "mm" or "inches"');
  }

  if (typeof thickness !== 'number' || thickness <= 0) {
    throw new Error('Canvas thickness must be positive');
  }

  return {
    width,
    height,
    unit: unit as 'mm' | 'inches',
    thickness
  };
};

// Updated validateTools function with real tool sizing support
const validateTools = (tools: unknown): ToolData[] => {
  if (!Array.isArray(tools)) {
    throw new Error('Tools must be an array');
  }

  if (tools.length === 0) {
    throw new Error('Layout must contain at least one tool');
  }

  // Parse scale info from processing data (same function as in frontend)
  const parseScaleInfo = (processingData: string) => {
    try {
      const data = JSON.parse(processingData);
      if (!data.scale_info) return null;

      const scaleInfoStr = data.scale_info;
      const scaleMatch = scaleInfoStr.match(/Scale:\s*([\d.e-]+)\s*mm\/px/);

      return {
        scale: scaleMatch ? parseFloat(scaleMatch[1]) : null,
        diagonal_inches: data.diagonal_inches || null,
        raw: data
      };
    } catch (error) {
      return null;
    }
  };

  // Calculate real tool dimensions (same logic as frontend)
  const calculateRealToolDimensions = (tool: ToolData): { width: number; height: number } => {
    // Check if tool has metadata with processing data
    const scaleInfo = tool.metadata?.processIngData
      ? parseScaleInfo(tool.metadata.processIngData)
      : null;

    if (!scaleInfo?.scale) {
      // Fallback to default size if no scale info available
      return { width: 80, height: 80 };
    }

    // If tool has pre-calculated real dimensions, use those
    if (tool.realWidth && tool.realHeight) {
      return { width: tool.realWidth, height: tool.realHeight };
    }

    // Calculate dimensions based on diagonal_inches from processing data
    if (scaleInfo.diagonal_inches) {
      const diagonalInches = scaleInfo.diagonal_inches;
      const diagonalMm = diagonalInches * 25.4;
      const diagonalPx = diagonalMm / scaleInfo.scale;

      // Tool-specific aspect ratios
      const aspectRatio =
        tool.name.toLowerCase().includes('screwdriver') ? 0.15 :
          tool.name.toLowerCase().includes('hammer') ? 0.8 :
            tool.name.toLowerCase().includes('pliers') ? 0.5 :
              0.7; // Default

      const width = diagonalPx * Math.cos(Math.atan(1 / aspectRatio));
      const height = width * aspectRatio;

      return {
        width: Math.max(20, width),
        height: Math.max(20, height),
      };
    }

    // Final fallback - estimate based on scale and tool type
    const baseSizeMm =
      tool.name.toLowerCase().includes('screwdriver') ? 150 :
        tool.name.toLowerCase().includes('hammer') ? 300 :
          tool.name.toLowerCase().includes('pliers') ? 200 :
            tool.name.toLowerCase().includes('wrench') ? 250 :
              100;

    const sizePx = baseSizeMm / scaleInfo.scale;
    const aspectRatio =
      tool.name.toLowerCase().includes('screwdriver') ? 0.15 :
        tool.name.toLowerCase().includes('hammer') ? 0.8 :
          tool.name.toLowerCase().includes('pliers') ? 0.5 :
            0.7;

    return {
      width: Math.max(20, sizePx),
      height: Math.max(20, sizePx * aspectRatio),
    };
  };

  // Check if two tools overlap using real dimensions
  const doToolsOverlap = (tool1: ToolData, tool2: ToolData): boolean => {
    const dims1 = calculateRealToolDimensions(tool1);
    const dims2 = calculateRealToolDimensions(tool2);

    const buffer = 2; // Small buffer to prevent touching tools from being considered overlapping

    return !(
      tool1.x + dims1.width <= tool2.x + buffer ||
      tool2.x + dims2.width <= tool1.x + buffer ||
      tool1.y + dims1.height <= tool2.y + buffer ||
      tool2.y + dims2.height <= tool1.y + buffer
    );
  };


  // Validate each tool and create typed array
  const validatedTools: ToolData[] = tools.map((tool, index) => {
    if (!tool || typeof tool !== 'object') {
      throw new Error(`Tool at index ${index} must be an object`);
    }

    const toolObj = tool as Record<string, unknown>;
    const { id, name, x, y, rotation, flipHorizontal, flipVertical, thickness, unit, opacity, smooth, image, groupId, metadata, realWidth, realHeight } = toolObj;

    if (typeof id !== 'string' || typeof name !== 'string' || !id || !name) {
      throw new Error(`Tool at index ${index} must have valid id and name`);
    }

    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error(`Tool "${name}" must have valid x,y coordinates`);
    }

    if (typeof rotation !== 'number') {
      throw new Error(`Tool "${name}" must have valid rotation`);
    }

    if (typeof flipHorizontal !== 'boolean' || typeof flipVertical !== 'boolean') {
      throw new Error(`Tool "${name}" must have valid flip properties`);
    }

    if (typeof unit !== 'string' || !(['mm', 'inches'] as const).includes(unit as 'mm' | 'inches')) {
      throw new Error(`Tool "${name}" must have valid unit`);
    }

    if (typeof thickness !== 'number' || thickness <= 0) {
      throw new Error(`Tool "${name}" must have positive thickness`);
    }

    const validatedTool: ToolData = {
      id,
      name,
      x,
      y,
      rotation,
      flipHorizontal,
      flipVertical,
      thickness,
      unit: unit as 'mm' | 'inches'
    };

    // Add optional properties if they exist and are valid
    if (typeof opacity === 'number') validatedTool.opacity = opacity;
    if (typeof smooth === 'number') validatedTool.smooth = smooth;
    if (typeof image === 'string') validatedTool.image = image;
    if (typeof groupId === 'string') validatedTool.groupId = groupId;

    // Store metadata and real dimensions for overlap calculation
    if (metadata && typeof metadata === 'object') {
      validatedTool.metadata = metadata as ToolData['metadata'];
    }
    if (typeof realWidth === 'number') validatedTool.realWidth = realWidth;
    if (typeof realHeight === 'number') validatedTool.realHeight = realHeight;

    return validatedTool;
  });

  // Check for overlaps using real tool dimensions
  for (let i = 0; i < validatedTools.length; i++) {
    for (let j = i + 1; j < validatedTools.length; j++) {
      const tool1 = validatedTools[i];
      const tool2 = validatedTools[j];

      if (doToolsOverlap(tool1, tool2)) {
        throw new Error(`Tools "${tool1.name}" and "${tool2.name}" are overlapping`);
      }
    }
  }

  return validatedTools;
};

const validateLayoutData = (data: unknown): LayoutData => {
  if (!data || typeof data !== 'object' || data === null) {
    throw new Error('Layout data is required');
  }

  const dataObj = data as Record<string, unknown>;
  const { name, description, canvas, tools, stats } = dataObj;

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Layout name is required');
  }

  const validatedCanvas = validateCanvas(canvas);
  const validatedTools = validateTools(tools);

  if (!stats || typeof stats !== 'object' || stats === null) {
    throw new Error('Layout stats are required');
  }

  const statsObj = stats as Record<string, unknown>;
  if (typeof statsObj.validLayout !== 'boolean' || !statsObj.validLayout) {
    throw new Error('Layout must be valid (no overlapping tools)');
  }

  if (typeof statsObj.totalTools !== 'number') {
    throw new Error('Layout stats must include totalTools');
  }

  const validatedStats: LayoutStats = {
    totalTools: statsObj.totalTools,
    validLayout: statsObj.validLayout,
    createdAt: typeof statsObj.createdAt === 'string' ? statsObj.createdAt : new Date(),
    updatedAt: typeof statsObj.updatedAt === 'string' ? statsObj.updatedAt : new Date()
  };

  return {
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : undefined,
    canvas: validatedCanvas,
    tools: validatedTools,
    stats: validatedStats
  };
};

// Type guard for JWT payload
const isValidJWTPayload = (decoded: unknown): decoded is JWTPayload => {
  return typeof decoded === 'object' &&
    decoded !== null &&
    'email' in decoded &&
    typeof (decoded as Record<string, unknown>).email === 'string';
};

// GET - Retrieve user's layouts
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("Authorization: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!isValidJWTPayload(decoded)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query - filter by user email
    const searchQuery: SearchQuery = { userEmail: decoded.email };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [layouts, total] = await Promise.all([
      Layout.find(searchQuery)
        .sort({ 'stats.updatedAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Layout.countDocuments(searchQuery)
    ]);

    return NextResponse.json({
      success: true,
      data: layouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching layouts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch layouts'
      },
      { status: 500 }
    );
  }
}

// POST - Create new layout
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("Authorization: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!isValidJWTPayload(decoded)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const body: unknown = await req.json();
    console.log("Layout data: ", body);

    // Validate the layout data
    const validatedData = validateLayoutData(body);

    // Extract additional metadata (excluding core layout fields)
    const bodyObj = body as LayoutRequestBody;
    const { name, description, canvas, tools, stats, ...metadata } = bodyObj;

    // Create new layout
    const layout = new Layout({
      userEmail: decoded.email,
      name: validatedData.name,
      description: validatedData.description || '',
      canvas: validatedData.canvas,
      tools: validatedData.tools,
      stats: {
        ...validatedData.stats,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Store any additional form data
      metadata
    });

    console.log("Layout to save: ", layout);
    await layout.save();

    return NextResponse.json({
      success: true,
      message: 'Layout saved successfully',
      id: layout._id
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving layout:', error);

    // Handle custom validation errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save layout'
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing layout
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!isValidJWTPayload(decoded)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const layoutId = searchParams.get('id');

    if (!layoutId) {
      return NextResponse.json(
        { success: false, error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    const body: unknown = await req.json();
    const validatedData = validateLayoutData(body);

    // Make sure user can only update their own layouts
    const existingLayout = await Layout.findOne({
      _id: layoutId,
      userEmail: decoded.email
    });

    if (!existingLayout) {
      return NextResponse.json(
        { success: false, error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    // Extract additional metadata
    const bodyObj = body as LayoutRequestBody;
    const { name, description, canvas, tools, stats, ...metadata } = bodyObj;

    const updatedLayout = await Layout.findByIdAndUpdate(
      layoutId,
      {
        name: validatedData.name,
        description: validatedData.description || '',
        canvas: validatedData.canvas,
        tools: validatedData.tools,
        stats: {
          ...validatedData.stats,
          updatedAt: new Date()
        },
        metadata
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Layout updated successfully',
      data: updatedLayout
    });

  } catch (error) {
    console.error('Error updating layout:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update layout' },
      { status: 500 }
    );
  }
}

// DELETE - Delete layout
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!isValidJWTPayload(decoded)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const layoutId = searchParams.get('id');

    if (!layoutId) {
      return NextResponse.json(
        { success: false, error: 'Layout ID is required' },
        { status: 400 }
      );
    }

    // Make sure user can only delete their own layouts
    const deletedLayout = await Layout.findOneAndDelete({
      _id: layoutId,
      userEmail: decoded.email
    });

    if (!deletedLayout) {
      return NextResponse.json(
        { success: false, error: 'Layout not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Layout deleted successfully',
      data: deletedLayout
    });

  } catch (error) {
    console.error('Error deleting layout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete layout' },
      { status: 500 }
    );
  }
}