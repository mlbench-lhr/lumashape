import User from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      firstName,
      lastName,
      username,
      email,
      password,
    }: { firstName: string; lastName: string; username: string; email: string; password: string } = await req.json();
    console.log(
      "Email->",
      email,
      " Username->",
      username,
      "Password->",
      password
    );

    // Basic validation for the incoming data
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the user already exists

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      profilePic: null,
    });

    // Save the new user to the database
    await newUser.save();

    // Shape response like login (exclude password and internal fields)
    const userResponse = {
      _id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      username: newUser.username,
      email: newUser.email,
      profilePic: newUser.profilePic,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      bio: newUser.bio,
    };

    return NextResponse.json(
      { message: "User created successfully", user: userResponse, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
