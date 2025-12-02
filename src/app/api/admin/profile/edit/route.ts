import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Admin from "@/lib/models/Admin";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: { adminId: string; email: string; role?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; email: string; role?: string };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { username, avatar, avatarPublicId, imgUrl }: { username?: string; avatar?: string; avatarPublicId?: string; imgUrl?: string } = await req.json();

    const update: Record<string, string> = {};
    if (typeof username === "string" && username.trim() !== "") update.username = username.trim();
    if (typeof avatar === "string" && avatar.trim() !== "") update.avatar = avatar.trim();
    if (typeof avatarPublicId === "string" && avatarPublicId.trim() !== "") update.avatarPublicId = avatarPublicId.trim();
    if (typeof imgUrl === "string" && imgUrl.trim() !== "") update.imgUrl = imgUrl.trim();

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await Admin.findByIdAndUpdate(decoded.adminId, update, { new: true });
    if (!updated) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({ success: true, admin: { _id: updated._id, username: updated.username, email: updated.email, avatar: updated.avatar, imgUrl: updated.imgUrl } });
  } catch (err) {
    console.error("Admin profile edit error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}