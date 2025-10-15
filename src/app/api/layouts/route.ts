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
  // NEW: Shape-specific fields
  isCustomShape?: boolean;
  shapeType?: 'rectangle' | 'circle' | 'polygon';
  shapeData?: Record<string, unknown>;
  // NEW: Persist metadata and real sizes
  originalId?: string;
  metadata?: Record<string, unknown>;
  realWidth?: number;
  realHeight?: number;
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
  brand?: string;
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
    brand?: { $regex: string; $options: string };
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



  // Validate each tool and create typed array
  const validatedTools: ToolData[] = tools.map((tool, index) => {
    if (!tool || typeof tool !== 'object') {
      throw new Error(`Tool at index ${index} must be an object`);
    }

    const toolObj = tool as Record<string, unknown>;
    const { id, name, x, y, rotation, flipHorizontal, flipVertical, thickness, unit, opacity, smooth, image, groupId, metadata, realWidth, realHeight, originalId } = toolObj;

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

    // Optional properties
    if (typeof opacity === 'number') validatedTool.opacity = opacity;
    if (typeof smooth === 'number') validatedTool.smooth = smooth;
    if (typeof image === 'string') validatedTool.image = image;
    if (typeof groupId === 'string') validatedTool.groupId = groupId;

    function isShapeType(value: unknown): value is 'rectangle' | 'circle' | 'polygon' {
      return typeof value === 'string' && ['rectangle', 'circle', 'polygon'].includes(value);
    }


    if (typeof (toolObj as Record<string, unknown>).isCustomShape === 'boolean') {
      validatedTool.isCustomShape = (toolObj as Record<string, unknown>).isCustomShape as boolean;
    }

    const shapeTypeVal = (toolObj as Record<string, unknown>).shapeType;
    if (isShapeType(shapeTypeVal)) {
      validatedTool.shapeType = shapeTypeVal;
    }

    if ('shapeData' in toolObj && typeof toolObj.shapeData === 'object' && toolObj.shapeData !== null) {
      validatedTool.shapeData = toolObj.shapeData as Record<string, unknown>;
    }
    
    // Store metadata and real dimensions
    if (metadata && typeof metadata === 'object') {
      validatedTool.metadata = metadata as ToolData['metadata'];
    }
    if (typeof originalId === 'string') validatedTool.originalId = originalId;
    if (typeof realWidth === 'number') validatedTool.realWidth = realWidth;
    if (typeof realHeight === 'number') validatedTool.realHeight = realHeight;

    return validatedTool;
  });

  return validatedTools;
};

const validateLayoutData = (data: unknown): LayoutData => {
  if (!data || typeof data !== 'object' || data === null) {
    throw new Error('Layout data is required');
  }

  const dataObj = data as Record<string, unknown>;
  const { name, brand, canvas, tools, stats } = dataObj;

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
    brand: typeof brand === 'string' ? brand.trim() : undefined,
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
    const id = searchParams.get('id');

    if (id) {
      const layout = await Layout.findOne({ _id: id, userEmail: decoded.email }).lean();
      if (!layout) {
        return NextResponse.json(
          { success: false, error: 'Layout not found or access denied' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: layout });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build search query - filter by user email
    const searchQuery: SearchQuery = { userEmail: decoded.email };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
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
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isValidJWTPayload(decoded)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const body: unknown = await req.json();
    const validatedData = validateLayoutData(body);

    // Extract additional metadata + snapshotUrl
    const bodyObj = body as LayoutRequestBody & { snapshotUrl?: string };
    const { name, brand, canvas, tools, stats, snapshotUrl, ...metadata } = bodyObj;

    const layout = new Layout({
      userEmail: decoded.email,
      name: validatedData.name,
      brand: validatedData.brand || "",
      canvas: validatedData.canvas,
      tools: validatedData.tools,
      snapshotUrl: snapshotUrl || null, // ✅ store image URL
      stats: {
        ...validatedData.stats,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      metadata,
      published: false,
      likes: 0,
      dislikes: 0,
      downloads: 0,
      publishedDate: null,
    });

    console.log(`snapshort url = ${layout.snapshotUrl}`);

    await layout.save();

    return NextResponse.json(
      {
        success: true,
        message: "Layout saved successfully",
        id: layout._id,
        snapshotUrl: layout.snapshotUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving layout:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save layout",
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
    const layoutId = searchParams.get("id");

    if (!layoutId) {
      return NextResponse.json(
        { success: false, error: "Layout ID is required" },
        { status: 400 }
      );
    }

    const body: unknown = await req.json();
    const validatedData = validateLayoutData(body);

    // Extract additional metadata + snapshotUrl
    const bodyObj = body as LayoutRequestBody & { snapshotUrl?: string };
    const { name, brand, canvas, tools, stats, snapshotUrl, ...metadata } = bodyObj;

    const existingLayout = await Layout.findOne({
      _id: layoutId,
      userEmail: decoded.email,
    });

    if (!existingLayout) {
      return NextResponse.json(
        { success: false, error: "Layout not found or access denied" },
        { status: 404 }
      );
    }

    const updatedLayout = await Layout.findByIdAndUpdate(
      layoutId,
      {
        name: validatedData.name,
        brand: validatedData.brand || "",
        canvas: validatedData.canvas,
        tools: validatedData.tools,
        snapshotUrl: snapshotUrl || existingLayout.snapshotUrl, // ✅ update snapshot if provided
        stats: {
          ...validatedData.stats,
          updatedAt: new Date(),
        },
        metadata,
      },
      { new: true, runValidators: true }
    );

    console.log(updatedLayout);

    return NextResponse.json({
      success: true,
      message: "Layout updated successfully",
      data: updatedLayout,
    });
  } catch (error) {
    console.error("Error updating layout:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update layout",
      },
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