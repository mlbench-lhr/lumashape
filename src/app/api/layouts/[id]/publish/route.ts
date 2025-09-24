import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Layout from "../../../../../lib/models/layout";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    const layoutId = params.id;
    if (!layoutId) {
      return NextResponse.json({ error: "Layout ID required" }, { status: 400 });
    }

    const layout = await Layout.findOne({
      _id: layoutId,
      userEmail: decoded.email,
    });

    if (!layout) {
      return NextResponse.json(
        { error: "Layout not found or unauthorized" },
        { status: 404 }
      );
    }

    layout.published = true;
    layout.publishedDate = new Date();
    await layout.save();

    return NextResponse.json({
      success: true,
      message: "Layout published to profile successfully",
      layoutId: layout._id,
      published: layout.published,
      publishedDate: layout.publishedDate,
    });
  } catch (err) {
    console.error("Error publishing layout:", err);

    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to publish layout" },
      { status: 500 }
    );
  }
}
