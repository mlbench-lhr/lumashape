import Tool from '@/lib/models/Tool';
import User from '@/lib/models/User';
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";

const JWT_SECRET = process.env.JWT_SECRET!;

interface JwtDecoded {
  email: string;
  iat?: number;
  exp?: number;
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    console.log("token: ", token);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
    }

    let decoded: JwtDecoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtDecoded;
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Reject if user no longer exists (deleted)
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = decoded.email;
    console.log("Fetching tools for email: ", userEmail);

    // Fetch all tools for the user, sorted by creation date (newest first)
    const tools = await Tool.find({ userEmail: userEmail })
      .sort({ createdAt: -1 })
      .lean(); // Use .lean() for better performance with plain objects

    console.log(`Found ${tools.length} tools for user ${userEmail}`);

    // Transform tools to include all schema fields
    const formattedTools = tools.map(tool => ({
      _id: tool._id,
      userEmail: tool.userEmail,
      toolBrand: tool.toolBrand,
      toolType: tool.toolType,
      SKUorPartNumber: tool.SKUorPartNumber,
      length: tool.length,
      depth: tool.depth,
      unit: tool.unit,
      imageUrl: tool.imageUrl,
      processingStatus: tool.processingStatus,
      cvResponse: tool.cvResponse || null,
      processingError: tool.processingError || null,
      published: tool.published,
      likes: tool.likes,
      dislikes: tool.dislikes,
      downloads: tool.downloads,
      publishedDate: tool.publishedDate || null,
      likedByUsers: tool.likedByUsers || [],
      dislikedByUsers: tool.dislikedByUsers || [],
      downloadedByUsers: tool.downloadedByUsers || [],
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt,
    }));

    return NextResponse.json({ 
      success: true,
      count: formattedTools.length,
      tools: formattedTools 
    });

  } catch (err) {
    console.error("Error fetching tools:", err);
    
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch tools";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(err) : undefined
      },
      { status: 500 }
    );
  }
}