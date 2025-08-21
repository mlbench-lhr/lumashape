import User from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      username,
      email,
      password,
    }: { username: string; email: string; password: string } = await req.json();
    console.log(
      "Email->",
      email,
      " Username->",
      username,
      "Password->",
      password
    );

    // Basic validation for the incoming data
    if (!username || !email || !password) {
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
      username,
      email,
      password,
    });

    // Save the new user to the database
    await newUser.save();

    // Send response
    return NextResponse.json(
      { message: "User created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
