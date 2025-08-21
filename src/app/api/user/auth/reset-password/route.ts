import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      resetToken,
      newPassword,
    }: { resetToken: string; newPassword: string } = await req.json();

    // Validate inputs
    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { message: "Reset token and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Verify reset token
    // let decoded: any;
    const decoded = jwt.verify(resetToken, JWT_SECRET) as JwtPayload & {
      purpose: string;
    };

    try {
      if (decoded.purpose !== "password-reset") {
        throw new Error("Invalid token purpose");
      }
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: "Password reset successful",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// import { NextRequest, NextResponse } from "next/server"
// import User from "@/lib/models/User"
// import dbConnect from "@/utils/dbConnect"
// import jwt, { JwtPayload as JwtDefaultPayload } from "jsonwebtoken"
// import bcrypt from "bcryptjs"

// const JWT_SECRET = process.env.JWT_SECRET as string

// // Custom payload interface
// export interface JwtPayload extends JwtDefaultPayload {
//   userId: string
//   email: string
//   username: string
//   purpose: string
// }

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect()

//     const {
//       resetToken,
//       newPassword,
//     }: { resetToken: string; newPassword: string } = await req.json()

//     if (!resetToken || !newPassword) {
//       return NextResponse.json(
//         { message: "Reset token and new password are required" },
//         { status: 400 }
//       )
//     }

//     if (newPassword.length < 6) {
//       return NextResponse.json(
//         { message: "Password must be at least 6 characters long" },
//         { status: 400 }
//       )
//     }

//     // Safely decode JWT
//     const decoded = jwt.verify(resetToken, JWT_SECRET)

//     if (
//       typeof decoded !== "object" ||
//       !("userId" in decoded) ||
//       !("purpose" in decoded) ||
//       (decoded as JwtPayload).purpose !== "password-reset"
//     ) {
//       return NextResponse.json(
//         { message: "Invalid or expired reset token" },
//         { status: 400 }
//       )
//     }

//     const { userId } = decoded as JwtPayload

//     console.log("Userid: ", userId)

//     const user = await User.findById(userId).select("+password")
//     if (!user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 })
//     }

//     const salt = await bcrypt.genSalt(12)
//     const hashedPassword = await bcrypt.hash(newPassword, salt)

//     console.log("password: ", newPassword)
//     console.log("hashedpassword: ", hashedPassword)
//     user.password = hashedPassword
//     await user.save()

//     return NextResponse.json(
//       { message: "Password reset successful", success: true },
//       { status: 200 }
//     )
//   } catch (error) {
//     console.error("Password reset error:", error)
//     return NextResponse.json({ message: "Server error" }, { status: 500 })
//   }
// }
