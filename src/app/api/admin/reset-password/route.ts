import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Admin from "@/lib/models/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  await dbConnect();
  const { resetToken, newPassword } = await req.json();

  if (!resetToken || !newPassword) {
    return NextResponse.json({ message: "Reset token and new password are required" }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
  }

  const decoded = jwt.verify(resetToken, JWT_SECRET) as { adminId: string; purpose: string };
  if (!decoded || decoded.purpose !== "admin-password-reset") {
    return NextResponse.json({ message: "Invalid or expired reset token" }, { status: 400 });
  }

  const admin = await Admin.findById(decoded.adminId).select("+password");
  if (!admin) return NextResponse.json({ message: "Admin not found" }, { status: 404 });

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await Admin.findByIdAndUpdate(admin._id, { password: hashedPassword });

  return NextResponse.json({ message: "Password reset successful", success: true }, { status: 200 });
}