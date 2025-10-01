// src/app/api/user/auth/changePassword/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { oldPassword, newPassword } = await req.json();

        if (!oldPassword || !newPassword) {
            return NextResponse.json(
                { message: "Old and new passwords are required" },
                { status: 400 }
            );
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        // Extract token from headers
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { message: "Authorization token missing" },
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & {
            userId: string;
        };

        const user = await User.findById(decoded.userId).select("+password");

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Check old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: "Old password is incorrect" },
                { status: 400 }
            );
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = newPassword;  // plain text
        await user.save();

        return NextResponse.json(
            { success: true, message: "Password updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
