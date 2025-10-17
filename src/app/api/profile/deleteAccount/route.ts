import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import User from "@/lib/models/User";
import Layout from "@/lib/models/layout";
import Tool from "@/lib/models/Tool";
import Cart from "@/lib/models/Cart";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // ✅ Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
      userId: string;
    };

    // Get user details first to get the email
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userEmail = user.email;

    // ✅ Hard delete - Delete all related data first, then the user
    
    // 1. Delete all layouts created by this user
    const layoutDeleteResult = await Layout.deleteMany({ userEmail: userEmail });
    console.log(`Deleted ${layoutDeleteResult.deletedCount} layouts for user: ${userEmail}`);

    // 2. Delete all tools created by this user
    const toolDeleteResult = await Tool.deleteMany({ userEmail: userEmail });
    console.log(`Deleted ${toolDeleteResult.deletedCount} tools for user: ${userEmail}`);

    // 3. Delete cart entries for this user
    const cartDeleteResult = await Cart.deleteMany({ userEmail: userEmail });
    console.log(`Deleted ${cartDeleteResult.deletedCount} cart entries for user: ${userEmail}`);

    // 4. Remove user from interaction arrays in other users' layouts and tools
    // Handle layout interactions separately for each type
    
    // Remove from liked layouts and decrement likes count
    await Layout.updateMany(
      { likedByUsers: userEmail },
      {
        $pull: { likedByUsers: userEmail },
        $inc: { likes: -1 }
      }
    );

    // Remove from disliked layouts and decrement dislikes count
    await Layout.updateMany(
      { dislikedByUsers: userEmail },
      {
        $pull: { dislikedByUsers: userEmail },
        $inc: { dislikes: -1 }
      }
    );

    // Remove from downloaded layouts and decrement downloads count
    await Layout.updateMany(
      { downloadedByUsers: userEmail },
      {
        $pull: { downloadedByUsers: userEmail },
        $inc: { downloads: -1 }
      }
    );

    // Handle tool interactions separately for each type
    
    // Remove from liked tools and decrement likes count
    await Tool.updateMany(
      { likedByUsers: userEmail },
      {
        $pull: { likedByUsers: userEmail },
        $inc: { likes: -1 }
      }
    );

    // Remove from disliked tools and decrement dislikes count
    await Tool.updateMany(
      { dislikedByUsers: userEmail },
      {
        $pull: { dislikedByUsers: userEmail },
        $inc: { dislikes: -1 }
      }
    );

    // Remove from downloaded tools and decrement downloads count
    await Tool.updateMany(
      { downloadedByUsers: userEmail },
      {
        $pull: { downloadedByUsers: userEmail },
        $inc: { downloads: -1 }
      }
    );

    // 5. Finally, delete the user account completely
    const deletedUser = await User.findByIdAndDelete(decoded.userId);

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log(`Successfully deleted user account and all associated data for: ${userEmail}`);

    const response = NextResponse.json(
      {
        message: "Account and all associated data deleted successfully",
        deletedData: {
          user: deletedUser.username,
          layouts: layoutDeleteResult.deletedCount,
          tools: toolDeleteResult.deletedCount,
          cartEntries: cartDeleteResult.deletedCount
        }
      },
      { status: 200 }
    );

    // Clear the auth cookie on server-side
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
