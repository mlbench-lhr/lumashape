import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/utils/dbConnect";
import Layout from "@/lib/models/layout";
import User from "@/lib/models/User";

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

    // Reject if user no longer exists (deleted)
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { layoutId, action } = body;

    if (!layoutId || !action) {
      return NextResponse.json(
        { error: "Missing layoutId or action" },
        { status: 400 }
      );
    }

    const layout = await Layout.findById(layoutId);
    if (!layout) {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }

    let updateOperations = {};
    let message = "";

    switch (action) {
      case "like":
        // Check if user already liked this layout
        const hasLiked = layout.likedByUsers.includes(userEmail);
        // Check if user has disliked this layout
        const hasDisliked = layout.dislikedByUsers.includes(userEmail);

        if (hasLiked) {
          // User wants to unlike - remove like
          updateOperations = {
            $inc: { likes: -1 },
            $pull: { likedByUsers: userEmail }
          };
          message = "Layout unliked successfully";
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
            message = "Layout liked successfully";
          }
        }
        break;

      case "dislike":
        // Check if user already disliked this layout
        const hasDislikedAlready = layout.dislikedByUsers.includes(userEmail);
        // Check if user has liked this layout
        const hasLikedAlready = layout.likedByUsers.includes(userEmail);

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
            message = "Layout disliked successfully";
          }
        }
        break;

      case "download":
        // For downloads, we can allow multiple downloads by same user
        updateOperations = {
          $inc: { downloads: 1 },
          $addToSet: { downloadedByUsers: userEmail }
        };
        message = "Download count updated";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedLayout = await Layout.findByIdAndUpdate(
      layoutId,
      updateOperations,
      { new: true }
    );

    if (!updatedLayout) {
      return NextResponse.json({ error: "Layout not found after update" }, { status: 404 });
    }

    // Return the user's current interaction state for UI updates
    const userInteraction = {
      hasLiked: updatedLayout.likedByUsers.includes(userEmail),
      hasDisliked: updatedLayout.dislikedByUsers.includes(userEmail),
      hasDownloaded: updatedLayout.downloadedByUsers.includes(userEmail)
    };

    return NextResponse.json({
      success: true,
      message,
      layout: updatedLayout,
      userInteraction
    });

  } catch (error) {
    console.error("Error updating layout interaction:", error);
    return NextResponse.json(
      { error: "Failed to update layout interaction" },
      { status: 500 }
    );
  }
}