// app/api/user/tool/publishTool/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // Get and verify token
    const token = req.headers.get("Authorization")?.split(" ")[1];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    // Get tool ID from request body
    const { toolId } = await req.json();

    if (!toolId) {
      return NextResponse.json(
        { error: "Tool ID is required" }, 
        { status: 400 }
      );
    }

    // Find the tool and verify ownership
    const tool = await Tool.findOne({
      _id: toolId,
      userEmail: decoded.email
    });

    if (!tool) {
      return NextResponse.json(
        { error: "Tool not found or unauthorized" }, 
        { status: 404 }
      );
    }

    // Update published status and date
    tool.published = true;
    tool.publishedDate = new Date();

    await tool.save();

    return NextResponse.json({ 
      success: true, 
      message: "Tool published to profile successfully",
      toolId: tool._id,
      published: tool.published,
      publishedDate: tool.publishedDate
    });

  } catch (err) {
    console.error("Error publishing tool:", err);
    
    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to publish tool" }, 
      { status: 500 }
    );
  }
}
