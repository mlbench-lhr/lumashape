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
    html: `<p>Your OTP is: <b>${otp}</b>. It expires in 10 minutes.</p>`,
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
  return NextResponse.json({ message: "OTP sent to your email", otpSent: true }, { status: 200 });
}