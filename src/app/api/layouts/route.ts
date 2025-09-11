// /app/api/layouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/utils/dbConnect';
import Layout from '@/lib/models/layout'; // We'll create this model

const JWT_SECRET = process.env.JWT_SECRET!;

// Define interfaces for type safety
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
}

interface LayoutData {
  name: string;
  description?: string;
  canvas: {
    width: number;
    height: number;
    unit: 'mm' | 'inches';
    thickness: number;
  };
  tools: ToolData[];
  stats: {
    totalTools: number;
    validLayout: boolean;
    createdAt: string;
    updatedAt: string;
  };
  [key: string]: any;
}

// Validation helper functions
const validateCanvas = (canvas: any) => {
  if (!canvas || typeof canvas !== 'object') {
    throw new Error('Canvas data is required');
  }
  
  const { width, height, unit, thickness } = canvas;
  
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error('Canvas must have valid positive dimensions');
  }
  
  if (!unit || !['mm', 'inches'].includes(unit)) {
    throw new Error('Canvas unit must be either "mm" or "inches"');
  }
  
  if (!thickness || thickness <= 0) {
    throw new Error('Canvas thickness must be positive');
  }
};

const validateTools = (tools: any[]) => {
  if (!Array.isArray(tools)) {
    throw new Error('Tools must be an array');
  }
  
  if (tools.length === 0) {
    throw new Error('Layout must contain at least one tool');
  }
  
  // Check for overlaps (basic validation)
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const tool1 = tools[i];
      const tool2 = tools[j];
      
      // Simple overlap detection (assuming 80x80 tool size)
      const toolSize = 80;
      const dx = Math.abs(tool1.x - tool2.x);
      const dy = Math.abs(tool1.y - tool2.y);
      
      if (dx < toolSize && dy < toolSize) {
        throw new Error(`Tools "${tool1.name}" and "${tool2.name}" are overlapping`);
      }
    }
  }
  
  // Validate each tool
  tools.forEach((tool, index) => {
    if (!tool.id || !tool.name) {
      throw new Error(`Tool at index ${index} must have id and name`);
    }
    
    if (typeof tool.x !== 'number' || typeof tool.y !== 'number') {
      throw new Error(`Tool "${tool.name}" must have valid x,y coordinates`);
    }
    
    if (typeof tool.rotation !== 'number') {
      throw new Error(`Tool "${tool.name}" must have valid rotation`);
    }
    
    if (!tool.unit || !['mm', 'inches'].includes(tool.unit)) {
      throw new Error(`Tool "${tool.name}" must have valid unit`);
    }
    
    if (!tool.thickness || tool.thickness <= 0) {
      throw new Error(`Tool "${tool.name}" must have positive thickness`);
    }
  });
};

const validateLayoutData = (data: any): LayoutData => {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new Error('Layout name is required');
  }
  
  validateCanvas(data.canvas);
  validateTools(data.tools);
  
  if (!data.stats || !data.stats.validLayout) {
    throw new Error('Layout must be valid (no overlapping tools)');
  }
  
  return data as LayoutData;
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

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    // Build search query - filter by user email
    let searchQuery: any = { userEmail: decoded.email };
    
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

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    
    const body = await req.json();
    console.log("Layout data: ", body);
    
    // Validate the layout data
    const validatedData = validateLayoutData(body);
    
    // Create new layout
    const layout = new Layout({
      userEmail: decoded.email,
      name: validatedData.name.trim(),
      description: validatedData.description?.trim() || '',
      canvas: validatedData.canvas,
      tools: validatedData.tools,
      stats: {
        ...validatedData.stats,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Store any additional form data
      metadata: {
        ...body,
        name: undefined, // Don't duplicate these in metadata
        description: undefined,
        canvas: undefined,
        tools: undefined,
        stats: undefined
      }
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

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    
    const { searchParams } = new URL(req.url);
    const layoutId = searchParams.get('id');
    
    if (!layoutId) {
      return NextResponse.json(
        { success: false, error: 'Layout ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
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
    
    const updatedLayout = await Layout.findByIdAndUpdate(
      layoutId,
      {
        name: validatedData.name.trim(),
        description: validatedData.description?.trim() || '',
        canvas: validatedData.canvas,
        tools: validatedData.tools,
        stats: {
          ...validatedData.stats,
          updatedAt: new Date()
        },
        metadata: {
          ...body,
          name: undefined,
          description: undefined,
          canvas: undefined,
          tools: undefined,
          stats: undefined
        }
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

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    
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