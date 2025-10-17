import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from '@/lib/models/Tool';
import { error } from "console";
import User from '@/lib/models/User';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    // Reject if user no longer exists (deleted)
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get("toolId");

    if (!toolId) {
      return NextResponse.json({ error: "Missing tool ID" }, { status: 400 });
    }

    // Delete only if the tool belongs to the user
    const deleted = await Tool.findOneAndDelete({
      _id: toolId,
      userEmail: decoded.email,
    });

    if (!deleted) {
      console.log("404 error")
      return NextResponse.json(
        { error: "Tool not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Tool deleted successfully", id: toolId });
  } catch (err) {
    console.error("Error deleting tool:", err);
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
