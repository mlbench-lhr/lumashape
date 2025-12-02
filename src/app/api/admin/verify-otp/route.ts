import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Admin from "@/lib/models/Admin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  await dbConnect();
  const { email, otp } = await req.json();

  if (!email || !otp) return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });

  const admin = await Admin.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!admin) return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });

  const adminId = String(admin._id);
  const resetToken = jwt.sign(
    { adminId, email: admin.email, purpose: "admin-password-reset" },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  await Admin.findByIdAndUpdate(admin._id, { $unset: { resetPasswordOTP: 1, resetPasswordExpires: 1 } });

  return NextResponse.json({ message: "OTP verified", resetToken, verified: true }, { status: 200 });
}