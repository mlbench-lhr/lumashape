// app/api/layouts/publishLayout/route.ts
import { NextResponse } from "next/server";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Layout from "@/lib/models/layout";

const JWT_SECRET = process.env.JWT_SECRET!;

// Define a clear type for Tool
interface ToolMetadata {
  SKUorPartNumber?: string;
  isFingerCut?: boolean;
  toolType?: string;
  toolBrand?: string;
  [key: string]: unknown;
}

interface Tool {
  toolBrand?: string;
  isCustomShape?: boolean;
  shapeType?: string;
  metadata?: ToolMetadata;
}

interface JwtPayload {
  email: string;
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();

    // Get and verify token
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get layout ID from request body
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "Layout ID is required" },
        { status: 400 }
      );
    }

    // Find the layout and verify ownership
    const layout = await Layout.findOne({
      _id: id,
      userEmail: decoded.email,
    });

    if (!layout) {
      return NextResponse.json(
        { error: "Layout not found or unauthorized" },
        { status: 404 }
      );
    }

    // Ensure type safety for tools
    const tools: Tool[] = Array.isArray(layout.tools) ? layout.tools : [];

    const isExcludedFromSku = (t: Tool): boolean => {
      const brand =
        (t.toolBrand ?? t.metadata?.toolBrand)?.toUpperCase() ?? "";
      const metaType = (t.metadata?.toolType || "").toString().toLowerCase();
      const shapeType = (t.shapeType || "").toString().toLowerCase();
      const meta = t.metadata;

      return (
        t.isCustomShape === true ||
        !!t.shapeType ||
        brand === "SHAPE" ||
        brand === "FINGERCUT" ||
        meta?.isFingerCut === true ||
        brand === "TEXT" ||
        metaType === "text" ||
        shapeType === "text"
      );
    };

    const hasMissingSku = tools.some((t: Tool) => {
      if (isExcludedFromSku(t)) return false;
      const sku = t.metadata?.SKUorPartNumber;
      return !sku || sku.trim().length === 0;
    });

    if (hasMissingSku) {
      return NextResponse.json(
        {
          error:
            "Cannot publish layout: all non-shape tools must include a SKU or Part Number.",
        },
        { status: 400 }
      );
    }

    // Update published status and date
    layout.published = true;
    layout.publishedDate = new Date();
    await layout.save();

    return NextResponse.json({
      success: true,
      message: "Layout published to profile successfully",
      id: layout._id,
      published: layout.published,
      publishedDate: layout.publishedDate,
    });
  } catch (err) {
    console.error("Error publishing layout:", err);

    if (err instanceof JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to publish layout" },
      { status: 500 }
    );
  }
}
