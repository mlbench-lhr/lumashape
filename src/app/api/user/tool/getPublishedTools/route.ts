// Example: /api/user/tool/getPublishedTools.ts
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await dbConnect();

    const tools = await Tool.find({ published: true })
      .sort({ createdAt: -1 })
      .lean();

    // Attach user details for each tool
    const userEmails = [...new Set(tools.map(t => t.userEmail))];
    const users = await User.find({ email: { $in: userEmails } })
      .select("email username")
      .lean();

    const userMap = Object.fromEntries(users.map(u => [u.email, u]));

    const toolsWithUser = tools.map(tool => ({
      ...tool,
      createdBy: userMap[tool.userEmail] || null,
    }));

    return NextResponse.json({ tools: toolsWithUser });
  } catch (err) {
    console.error("Error fetching published tools:", err);
    return NextResponse.json(
      { error: "Failed to fetch published tools" },
      { status: 500 }
    );
  }
}
