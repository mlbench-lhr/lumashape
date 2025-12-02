import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import User from "@/lib/models/User";
import Tool from "@/lib/models/Tool";
import Layout from "@/lib/models/layout";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface JwtAdminPayload extends JwtPayload {
  email: string;
  role: string;
}

export async function GET(req: NextRequest, context: unknown) {
  try {
    const { params } = context as { params: { id: string } };
    await dbConnect();

    const authHeader = req.headers.get("Authorization");
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies.get("admin-token")?.value;

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: JwtAdminPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === "string")
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });

      decoded = verified as JwtAdminPayload;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded || decoded.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const user = await User.findById(params.id).lean();
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const email = user.email;

    const tools = await Tool.find({ userEmail: email, published: true })
      .sort({ createdAt: -1 })
      .lean();
    const layouts = await Layout.find({ userEmail: email, published: true })
      .sort({ createdAt: -1 })
      .lean();

    const mappedTools = tools.map((t) => ({
      _id: String(t._id),
      toolType: t.toolType,
      toolBrand: t.toolBrand,
      SKUorPartNumber: t.SKUorPartNumber,
      imageUrl: t.imageUrl,
      likes: t.likes || 0,
      dislikes: t.dislikes || 0,
      downloads: t.downloads || 0,
      publishedDate: t.publishedDate || null,
    }));

    const mappedLayouts = layouts.map((l) => ({
      _id: String(l._id),
      name: l.name,
      canvas: l.canvas,
      snapshotUrl: l.snapshotUrl || null,
      likes: l.likes || 0,
      dislikes: l.dislikes || 0,
      downloads: l.downloads || 0,
      publishedDate: l.publishedDate || null,
    }));

    return NextResponse.json({
      success: true,
      user: {
        _id: String(user._id),
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        avatar: user.avatar || "",
        profilePic: user.profilePic || "",
        createdAt: user.createdAt,
      },
      publishedTools: mappedTools,
      publishedLayouts: mappedLayouts,
      counts: { publishedTools: mappedTools.length, publishedLayouts: mappedLayouts.length },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
