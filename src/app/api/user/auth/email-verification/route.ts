import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Generate 5-digit OTP
const generateOTP = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Send Email Verification OTP endpoint
export async function POST(req: NextRequest) {
  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}mailLogo.jpg`;
  const linkedinUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}linkedin.jpg`;
  const youtubeUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}youtube.jpg`;

  try {
    await dbConnect();

    const { email }: { email: string } = await req.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        {
          message: "User not found with this email address",
        },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.isVerified) {
      return NextResponse.json(
        {
          message: "Email is already verified",
        },
        { status: 400 }
      );
    }

    // Generate OTP and expiry time (10 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with email verification OTP details
    await User.findByIdAndUpdate(user._id, {
      resetPasswordOTP: otp,
      resetPasswordExpires: otpExpiry,
    });

    // Send email with OTP
    try {
      const from = `"Lumashape" <${process.env.EMAIL_FROM || "no-reply@lumashape.com"}>`;
      await resend.emails.send({
        from,
        to: email,
        subject: "Email Verification OTP - Lumashape",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="padding-left: 10px; max-width: 100%; color: black;">
        <div style="text-align: center;">
        <img src="${logoUrl}" alt="Company Logo" width="200" style="pointer-events: none; user-drag: none; -webkit-user-drag: none;" />
      </div>
      </div>

      <p style="font-size: 30.59px; font-weight: 600; text-align: center;">Welcome to <span style="color: #266CA8;">Lumashape!</span></p>

            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p>Hello ${user.username},</p>
            <p>Thank you for creating your Lumashape account. Please verify your email address to complete your registration.</p>
            <p>Your verification OTP code is:</p>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #2F65A7; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't create this account, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="margin-top: 30px; text-align: center;">
              <a href="https://www.lumashape.com" style="color: #000; text-decoration: none;">www.lumashape.com</a>
              <span style="color: #000;"> | </span>
              <a href="mailto:support@lumashape.com" style="color: #000;">support@lumashape.com</a>
            </p>
            <div style="text-align: center; margin-top: 10px;">
              <a href="https://www.linkedin.com/company/lumashape/" style="text-decoration: none;">
                <img src="${linkedinUrl}" alt="LinkedIn" width="20" />
              </a>
              <a href="https://www.youtube.com/@Lumashape?app=desktop" style="text-decoration: none; margin-left: 20px;">
                <img src="${youtubeUrl}" alt="YouTube" width="20" />
              </a>
            </div>
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 16px;">
              This is an automated message from Lumashape. Please do not reply to this email.
            </p>
          </div>
        `,
        text: `
          Hello ${user.username},
          
          Thank you for creating your Lumashape account. Please verify your email address to complete your registration.
          
          Your verification OTP code is: ${otp}
          
          This OTP will expire in 10 minutes.
          
          If you didn't create this account, please ignore this email.
        `,
      });
      console.log("Email verification OTP sent successfully to:", email);
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      return NextResponse.json(
        {
          message: "Failed to send verification email. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Verification OTP has been sent to your email address",
        otpSent: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
