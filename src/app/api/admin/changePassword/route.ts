import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Admin from "@/lib/models/Admin";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ message: "Old and new passwords are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Authorization token missing" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    let decoded: { adminId: string; email: string; role?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; email: string; role?: string };
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const admin = await Admin.findById(decoded.adminId).select("+password");
    if (!admin) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Old password is incorrect" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await Admin.findByIdAndUpdate(decoded.adminId, { password: hashedPassword });

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Admin change password error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}