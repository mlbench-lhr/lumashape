// /api/user/getUserDetails/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import User from "@/lib/models/User"; // make sure this model exists

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("token:", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const userEmail = decoded.email;
    console.log("email:", userEmail);

    // Fetch user details by email
    const user = await User.findOne({ email: userEmail }).select(
      "-password -__v" // exclude sensitive fields
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Error fetching user details:", err);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
