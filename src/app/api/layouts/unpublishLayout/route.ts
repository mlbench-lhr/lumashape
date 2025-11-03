import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Layout from "@/lib/models/layout";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Layout ID is required" }, { status: 400 });
    }

    const layout = await Layout.findOne({ _id: id, userEmail: decoded.email });
    if (!layout) {
      return NextResponse.json({ error: "Layout not found or unauthorized" }, { status: 404 });
    }

    layout.published = false;
    layout.publishedDate = null;
    await layout.save();

    return NextResponse.json({
      success: true,
      message: "Layout unpublished successfully",
      id: layout._id,
      published: layout.published,
      publishedDate: layout.publishedDate,
    });
  } catch (err) {
    console.error("Error unpublishing layout:", err);

    if (err instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to unpublish layout" }, { status: 500 });
  }
}