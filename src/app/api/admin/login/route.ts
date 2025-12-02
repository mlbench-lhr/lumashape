import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Admin from "@/lib/models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export async function POST(req: NextRequest) {
  await dbConnect();
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
  }

  const admin = await Admin.findOne({ email }).select("+password");
  if (!admin) {
    return NextResponse.json({ message: "Admin Not Found" }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const adminId = String(admin._id);
  const token = jwt.sign(
    { adminId, email: admin.email, role: "admin" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const payload = {
    message: "Login successful",
    success: true,
    token,
    admin: {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      avatar: admin.avatar,
      imgUrl: admin.imgUrl,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
  };

  const response = NextResponse.json(payload, { status: 200 });
  response.cookies.set("admin-token", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  response.cookies.set("admin-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}