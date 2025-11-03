import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const { toolId } = await req.json();

    if (!toolId) {
      return NextResponse.json({ error: "Tool ID is required" }, { status: 400 });
    }

    const tool = await Tool.findOne({ _id: toolId, userEmail: decoded.email });
    if (!tool) {
      return NextResponse.json({ error: "Tool not found or unauthorized" }, { status: 404 });
    }

    tool.published = false;
    tool.publishedDate = null;
    await tool.save();

    return NextResponse.json({
      success: true,
      message: "Tool unpublished successfully",
      toolId: tool._id,
      published: tool.published,
      publishedDate: tool.publishedDate,
    });
  } catch (err) {
    console.error("Error unpublishing tool:", err);

    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to unpublish tool" }, { status: 500 });
  }
}