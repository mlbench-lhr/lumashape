// /api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";
import Layout from "@/lib/models/layout";
import User from "@/lib/models/User";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const userEmail = decoded.email;

    // Get user info
    const user = await User.findOne({ email: userEmail, isDeleted: false })
      .select("username email isPublic company avatar")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's published layouts
    const publishedLayouts = await Layout.find({
      userEmail,
      published: true
    })
      .select("name downloads downloadedByUsers createdAt updatedAt")
      .lean();

    // Get user's published tools
    const publishedTools = await Tool.find({
      userEmail,
      published: true
    })
      .select("brand toolType likes dislikes downloads likedByUsers dislikedByUsers downloadedByUsers createdAt updatedAt")
      .lean();

    // Calculate total stats
    const totalUpvotes = publishedTools.reduce((sum, tool) => sum + tool.likes, 0);
    const totalDownvotes = publishedTools.reduce((sum, tool) => sum + tool.dislikes, 0);
    const totalLayoutDownloads = publishedLayouts.reduce((sum, layout) => sum + layout.downloads, 0);
    const totalToolDownloads = publishedTools.reduce((sum, tool) => sum + tool.downloads, 0);
    const totalDownloads = totalLayoutDownloads + totalToolDownloads;

    // Prepare response data
    const profileData = {
      user: {
        name: user.username,
        email: user.email,
        status: user.isPublic ? "Public" : "Private",
        bio: user.company || "Workshop enthusiast and tool organization specialist",
        avatar: user.avatar,
        followers: 43, // Keep constant as requested
        following: 43, // Keep constant as requested
      },
      stats: {
        upvotes: totalUpvotes,
        downvotes: totalDownvotes,
        downloads: totalDownloads,
      },
      counts: {
        publishedLayouts: publishedLayouts.length,
        publishedTools: publishedTools.length,
      }
    };

    return NextResponse.json(profileData);

  } catch (err) {
    console.error("Error fetching profile data:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}