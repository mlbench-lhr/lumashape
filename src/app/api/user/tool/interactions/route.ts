import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Tool from "@/lib/models/Tool";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const userEmail = decoded.email.toLowerCase().trim();
    
    const body = await req.json();
    const { toolId, action } = body;

    if (!toolId || !action) {
      return NextResponse.json(
        { error: "Missing toolId or action" },
        { status: 400 }
      );
    }

    const tool = await Tool.findById(toolId);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    let updateOperations = {};
    let message = "";

    switch (action) {
      case "like":
        // Check if user already liked this tool
        const hasLiked = tool.likedByUsers.includes(userEmail);
        // Check if user has disliked this tool
        const hasDisliked = tool.dislikedByUsers.includes(userEmail);

        if (hasLiked) {
          // User wants to unlike - remove like
          updateOperations = {
            $inc: { likes: -1 },
            $pull: { likedByUsers: userEmail }
          };
          message = "Tool unliked successfully";
        } else {
          // User wants to like
          if (hasDisliked) {
            // Remove from dislike and add to like
            updateOperations = {
              $inc: { likes: 1, dislikes: -1 },
              $pull: { dislikedByUsers: userEmail },
              $addToSet: { likedByUsers: userEmail }
            };
            message = "Changed from dislike to like";
          } else {
            // Simply add like
            updateOperations = {
              $inc: { likes: 1 },
              $addToSet: { likedByUsers: userEmail }
            };
            message = "Tool liked successfully";
          }
        }
        break;

      case "dislike":
        // Check if user already disliked this tool
        const hasDislikedAlready = tool.dislikedByUsers.includes(userEmail);
        // Check if user has liked this tool
        const hasLikedAlready = tool.likedByUsers.includes(userEmail);

        if (hasDislikedAlready) {
          // User wants to remove dislike
          updateOperations = {
            $inc: { dislikes: -1 },
            $pull: { dislikedByUsers: userEmail }
          };
          message = "Dislike removed successfully";
        } else {
          // User wants to dislike
          if (hasLikedAlready) {
            // Remove from like and add to dislike
            updateOperations = {
              $inc: { dislikes: 1, likes: -1 },
              $pull: { likedByUsers: userEmail },
              $addToSet: { dislikedByUsers: userEmail }
            };
            message = "Changed from like to dislike";
          } else {
            // Simply add dislike
            updateOperations = {
              $inc: { dislikes: 1 },
              $addToSet: { dislikedByUsers: userEmail }
            };
            message = "Tool disliked successfully";
          }
        }
        break;

      case "download":
        // NEW: Block counting downloads for owner
        if (tool.userEmail?.toLowerCase().trim() === userEmail) {
          return NextResponse.json(
            { error: "You cannot download your own tool" },
            { status: 403 }
          );
        }
        updateOperations = {
          $inc: { downloads: 1 },
          $addToSet: { downloadedByUsers: userEmail }
        };
        message = "Download count updated";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedTool = await Tool.findByIdAndUpdate(
      toolId,
      updateOperations,
      { new: true }
    );

    if (!updatedTool) {
      return NextResponse.json({ error: "Tool not found after update" }, { status: 404 });
    }

    // Return the user's current interaction state for UI updates
    const userInteraction = {
      hasLiked: updatedTool.likedByUsers.includes(userEmail),
      hasDisliked: updatedTool.dislikedByUsers.includes(userEmail),
      hasDownloaded: updatedTool.downloadedByUsers.includes(userEmail)
    };

    return NextResponse.json({
      success: true,
      message,
      tool: updatedTool,
      userInteraction
    });

  } catch (error) {
    console.error("Error updating tool interaction:", error);
    return NextResponse.json(
      { error: "Failed to update tool interaction" },
      { status: 500 }
    );
  }
}