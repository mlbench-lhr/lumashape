import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from '@/lib/models/Tool';
import User from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await dbConnect();
    // Ensure unique indexes are created before operating, even for API-only traffic
    await Tool.init();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const requesterEmail = decoded.email.toLowerCase().trim();
    // Reject if user no longer exists (deleted)
    const user = await User.findOne({ email: requesterEmail });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { toolId } = body;

    if (!toolId) {
      return NextResponse.json({ error: "Missing toolId" }, { status: 400 });
    }

    // Find the original published tool
    const originalTool = await Tool.findById(toolId);
    if (!originalTool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // NEW: Block adding your own published tool (already using normalized email above)
    const originalOwnerEmail = (originalTool.userEmail || "").toLowerCase().trim();
    if (originalOwnerEmail === requesterEmail) {
      return NextResponse.json(
        { error: "You cannot add your own tool to your inventory" },
        { status: 403 }
      );
    }

    // Check if user already has this tool in their inventory
    const existingTool = await Tool.findOne({
      userEmail: requesterEmail,
      originalToolId: toolId
    });

    if (existingTool) {
      return NextResponse.json(
        { error: "Tool already exists in tool inventory" },
        { status: 400 }
      );
    }

    // Create a copy of the tool for the user's inventory using new schema
    const newTool = new Tool({
      userEmail: requesterEmail,
      toolBrand: originalTool.toolBrand,
      toolType: originalTool.toolType,
      SKUorPartNumber: originalTool.SKUorPartNumber,
      length: originalTool.length,
      depth: originalTool.depth,
      unit: originalTool.unit,
      imageUrl: originalTool.imageUrl,
      processingStatus: originalTool.processingStatus,
      cvResponse: originalTool.cvResponse,
      processingError: originalTool.processingError,
      published: false,
      likes: 0,
      dislikes: 0,
      downloads: 0,
      publishedDate: null,
      originalToolId: toolId,
    });

    // Save with duplicate key handling for race conditions
    try {
      await newTool.save();
    } catch (error: unknown) {
      if (error && typeof error === "object") {
        return NextResponse.json(
          { error: "Tool already exists in tool inventory" },
          { status: 400 }
        );
      }
      throw error;
    }

    // Increment download count on the original published tool
    await Tool.findByIdAndUpdate(toolId, { 
      $inc: { downloads: 1 },
      $addToSet: { downloadedByUsers: requesterEmail }
    });

    return NextResponse.json({
      success: true,
      message: "Tool added to your inventory successfully",
      toolId: newTool._id
    });

  } catch (error) {
    console.error("Error adding tool to inventory:", error);
    return NextResponse.json(
      { error: "Failed to add tool to inventory" },
      { status: 500 }
    );
  }
}