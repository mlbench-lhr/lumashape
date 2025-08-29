// /api/user/getTools.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("token: ", token);

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const userEmail = decoded.email;

    console.log("email: ", userEmail);

    const tools = await Tool.find({ userEmail: userEmail }).sort({
      createdAt: -1,
    });

    console.log("tools:", tools);

    return NextResponse.json({ tools });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 }
    );
  }
}
