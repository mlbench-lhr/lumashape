import { NextRequest, NextResponse } from "next/server";
import User from "@/lib/models/User";
import dbConnect from "@/utils/dbConnect";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Generate 5-digit OTP
const generateOTP = (): string => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Send OTP endpoint
export async function POST(req: NextRequest) {
  const baseUrlRaw = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.VERCEL_URL ||
    "https://www.lumashape.com"
  ).trim();
  const baseUrl = new URL(baseUrlRaw.startsWith("http") ? baseUrlRaw : `https://${baseUrlRaw}`).origin;
  const assetUrl = (path: string) => new URL(path.startsWith("/") ? path : `/${path}`, baseUrl).toString();

  const logoUrl = assetUrl("/mailLogo.jpg");
  const linkedinUrl = assetUrl("/linkedin.jpg");
  const youtubeUrl = assetUrl("/youtube.jpg");

  try {
    await dbConnect();

    const { email }: { email: string } = await req.json();
    console.log("Forgot password request for email:", email);

    // Validate email
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email });

    console.log("USER: ", user)

    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        {
          message:
            "If the email exists, an OTP has been sent to your email address",
        },
        { status: 350 }
      );
    }

    // Generate OTP and expiry time (10 minutes)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with OTP details
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
        subject: "Password Reset OTP - Lumashape",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

<div style="padding-left: 10px; max-width: 100%; color: black;">
        <div style="text-align: center;">
        <img src="${logoUrl}" alt="Company Logo" width="200" style="pointer-events: none; user-drag: none; -webkit-user-drag: none;" />
      </div>
      </div>



            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p>Hello ${user.username},</p>
            <p>You have requested to reset your password for your Lumashape account.</p>
            <p>Your OTP code is:</p>
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
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
            
            You have requested to reset your password for your Lumashape account.
            
            Your OTP code is: ${otp}
            
            This OTP will expire in 10 minutes.
            
            If you didn't request this password reset, please ignore this email.
            `,
      });
      console.log("OTP email sent successfully to:", email);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        {
          message: "Failed to send OTP email. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "OTP has been sent to your email address",
        otpSent: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
