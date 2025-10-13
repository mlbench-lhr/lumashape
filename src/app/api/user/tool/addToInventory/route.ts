import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
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

    // Check if user already has this tool in their inventory
    const existingTool = await Tool.findOne({
      userEmail: decoded.email,
      originalToolId: toolId
    });

    if (existingTool) {
      return NextResponse.json(
        { error: "Tool already exists in your inventory" },
        { status: 400 }
      );
    }

    // Create a copy of the tool for the user's inventory using new schema
    const newTool = new Tool({
      userEmail: decoded.email,
      toolBrand: originalTool.toolBrand,
      toolType: originalTool.toolType,
      length: originalTool.length,
      depth: originalTool.depth,
      unit: originalTool.unit,
      imageUrl: originalTool.imageUrl,
      processingStatus: originalTool.processingStatus,
      cvResponse: originalTool.cvResponse,
      processingError: originalTool.processingError,
      published: false, // User's copy is not published
      likes: 0,
      dislikes: 0,
      downloads: 0,
      publishedDate: null,
      originalToolId: toolId, // Reference to the original tool
    });

    await newTool.save();

    // Increment download count on the original published tool
    await Tool.findByIdAndUpdate(toolId, { 
      $inc: { downloads: 1 },
      $addToSet: { downloadedByUsers: decoded.email }
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