import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Layout from "../../../../lib/models/layout";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await dbConnect();

    const layouts = await Layout.find({ published: true })
      .sort({ createdAt: -1 })
      .lean();

    // Attach user details for each layout
    const userEmails = [...new Set(layouts.map(l => l.userEmail))];
    const users = await User.find({ email: { $in: userEmails } })
      .select("email username")
      .lean();

    const userMap = Object.fromEntries(users.map(u => [u.email, u]));

    const layoutsWithUser = layouts.map(layout => ({
      ...layout,
      createdBy: userMap[layout.userEmail] || null,
    }));

    return NextResponse.json({ layouts: layoutsWithUser });
  } catch (err) {
    console.error("Error fetching published layouts:", err);
    return NextResponse.json(
      { error: "Failed to fetch published layouts" },
      { status: 500 }
    );
  }
}