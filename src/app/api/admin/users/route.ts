import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "@/lib/models/User";
import { FilterQuery } from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface JwtAdminPayload extends JwtPayload {
  email: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get("Authorization");
    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : req.cookies.get("admin-token")?.value;

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: JwtAdminPayload;
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      if (typeof verified === "string") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      decoded = verified as JwtAdminPayload;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded || decoded.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get("limit") || "10", 10))
    );
    const search = (searchParams.get("search") || "").trim();

    // Use Mongoose FilterQuery to allow MongoDB operators
    const query: FilterQuery<IUser> = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { firstName: rx },
        { lastName: rx },
        { username: rx },
        { email: rx },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("firstName lastName username email createdAt avatar profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean<IUser[]>();

    return NextResponse.json({ success: true, users, total, page, perPage });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
