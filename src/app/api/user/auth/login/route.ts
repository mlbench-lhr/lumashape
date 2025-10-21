import { NextRequest, NextResponse } from "next/server";
import User, { IUser } from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await dbConnect();

    const { email, password }: { email: string; password: string } =
      await req.json();
    console.log("Login attempt for email:", email);

    

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "User Not Found" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log("password: ", isPasswordValid);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id?.toString(),
        email: user.email,
        username: user.username,
      },
      JWT_SECRET as string,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Create response with user data (excluding password)
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // METHOD 1: Using HTTP-only cookies (Recommended for security)
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: userResponse,
        success: true,
        token, // Optional: include token in response for localStorage approach
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// Logout endpoint to clear the cookie
export async function DELETE(req: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}