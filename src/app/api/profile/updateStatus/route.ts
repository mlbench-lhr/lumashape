import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import User from "@/lib/models/User";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      userId: string;
    };

    const { isPublic }: { isPublic: boolean } = await req.json();

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,   // ✅ fixed
      { isPublic },
      { new: true }
    ).select("username email isPublic");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Privacy updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating privacy:", error);
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}
