import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Admin from "@/lib/models/Admin";
import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const generateOTP = (): string => Math.floor(10000 + Math.random() * 90000).toString();

export async function POST(req: NextRequest) {
  await dbConnect();
  const { email } = await req.json();

  if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

  const admin = await Admin.findOne({ email });
  if (!admin) return NextResponse.json({ message: "If the email exists, an OTP has been sent" }, { status: 350 });

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await Admin.findByIdAndUpdate(admin._id, { resetPasswordOTP: otp, resetPasswordExpires: otpExpiry });

  const transporter = createTransporter();
  const mailOptions = {
    from: `"Lumashape" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Admin Password Reset OTP - Lumashape",
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #e5e5e5;">
      
      <h2 style="color: #333333; text-align: center; margin-bottom: 20px;">
        Lumashape – Password Reset Request
      </h2>

      <p style="font-size: 15px; color: #555555;">
        Hello,
      </p>

      <p style="font-size: 15px; color: #555555; line-height: 1.6;">
        We received a request to reset the password for your administrator account. 
        To complete the process, please use the One-Time Password (OTP) provided below.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: #f0f0f0; padding: 15px 25px; border-radius: 6px; border: 1px solid #dcdcdc;">
          <span style="font-size: 26px; letter-spacing: 4px; font-weight: bold; color: #333333;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #777777; margin-top: 10px;">
          This OTP will expire in <strong>10 minutes</strong>.
        </p>
      </div>

      <p style="font-size: 15px; color: #555555; line-height: 1.6;">
        If you did not request a password reset, you can safely ignore this email. 
        Your account will remain secure.
      </p>

      <p style="font-size: 15px; color: #555555; margin-top: 25px;">
        Regards,<br />
        <strong>Lumashape Admin Team</strong>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;" />

      <p style="font-size: 12px; color: #999999; text-align: center;">
        This is an automated message. Please do not reply to this email.
      </p>

    </div>
  </div>
`,
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  return NextResponse.json({ message: "OTP sent to your email", otpSent: true }, { status: 200 });
}