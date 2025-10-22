import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import User from "@/lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
}

interface UpdateFields {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  profilePic?: string;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Verify JWT
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { firstName, lastName, username, bio, profilePic } = await req.json();

    // Build type-safe update object
    const updateFields: UpdateFields = {};

    if (firstName && firstName.trim() !== "") updateFields.firstName = firstName.trim();
    if (lastName && lastName.trim() !== "") updateFields.lastName = lastName.trim();
    if (username && username.trim() !== "") updateFields.username = username.trim();
    if (profilePic && profilePic.trim() !== "") updateFields.profilePic = profilePic.trim();

    // bio can be empty (can overwrite existing bio)
    updateFields.bio = bio ?? "";

    // If nothing to update
    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(decoded.userId, updateFields, {
      new: true,
    });

    console.log(`ProfilePicture = ${profilePic}`);

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
