import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("Authorization: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    const body = await req.json();
    console.log("body: ", body);

    const { paper, brand, type, imageUrl, description, purchase_link } = body;

    if (!paper || !brand || !type || !imageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const tool = new Tool({
      userEmail: decoded.email,
      paperType: paper,
      brand,
      toolType: type,
      description: description || "",
      purchaseLink: purchase_link || "",
      backgroundImg: imageUrl,
    });

    console.log("tool: ", tool);

    await tool.save();

    return NextResponse.json({ success: true, id: tool._id });
  } catch (err) {
    console.error("Error saving tool:", err);
    return NextResponse.json({ error: "Failed to save tool" }, { status: 500 });
  }
}
