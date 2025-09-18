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

    const {
      paper,
      brand,
      type,
      imageUrl,
      annotatedImageUrl,
      outlinesImageUrl,
      description,
      purchase_link,
      serverResponse
    } = body;

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
      dxfLink: serverResponse.dxf_link || "",
      backgroundImg: imageUrl,
      annotatedImg: annotatedImageUrl || "",
      outlinesImg: outlinesImageUrl || "",
      diagonalInches: serverResponse?.height_in_inches ?? undefined,
      scaleFactor: serverResponse?.scale_info ?? undefined,
    });

    console.log("Tool object before save:", tool);
    console.log(`Server Response while saving tool : `, serverResponse);

    await tool.save();

    return NextResponse.json({ success: true, id: tool._id });
  } catch (err) {
    console.error("Error saving tool:", err);
    return NextResponse.json({ error: "Failed to save tool" }, { status: 500 });
  }
}