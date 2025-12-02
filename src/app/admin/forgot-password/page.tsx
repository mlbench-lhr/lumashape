"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ForgotPasswordResponse { message: string; otpSent?: boolean }
interface VerifyOTPResponse { message: string; resetToken?: string; verified?: boolean }

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasSentOtp, setHasSentOtp] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleGoBack = () => router.push("/admin/login");
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const next = [...otp]; next[index] = value; setOtp(next);
      if (value && index < 4) document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleSendOtp = async () => {
    if (!email) { setError("Please enter your email address"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email address"); return; }
    setIsLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data: ForgotPasswordResponse = await response.json();
      if (response.ok && response.status === 200) { setSuccess("OTP sent successfully to your email!"); setIsOtpSent(true); setHasSentOtp(true); }
      else if (response.status === 350) { setError("Email does not exist."); }
      else { setError(data.message || "Failed to send OTP"); }
    } catch { setError("Network error. Please try again."); } finally { setIsLoading(false); }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 5) { setError("Please enter the complete 5-digit OTP"); return; }
    setIsLoading(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/admin/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp: otpValue }),
      });
      const data: VerifyOTPResponse = await response.json();
      if (response.ok && data.verified) { setSuccess("OTP verified successfully! Redirecting..."); setTimeout(() => router.push(`/admin/reset-password?token=${data.resetToken}`), 1000); }
      else { setError(data.message || "Invalid OTP"); }
    } catch { setError("Network error. Please try again."); } finally { setIsLoading(false); }
  };

  const isButtonDisabled = () => isLoading || !isOtpSent || otp.join("").length !== 5;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#ededed] p-8">
        <div className="flex items-center mb-8" onClick={handleGoBack}>
          <div className="relative w-[21.58px] h-[21.58px] sm:w-[30px] sm:h-[30px] flex items-center justify-center">
            <Image src="/images/icons/auth/BackTick.svg" alt="Go Back" fill className="cursor-pointer" priority />
          </div>
          <span className="text-[#666666] font-semibold text-[12px] sm:text-[16px]">Go Back</span>
        </div>
        <h1 className="text-2xl font-bold text-center text-secondary mb-[10px]">Forgot Password?</h1>
        <p className="text-center text-[#666666] mb-8 leading-relaxed">Enter the email address linked to your admin account to receive a verification code</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-[#ededed] rounded-md"><p className="text-red-600 text-sm font-medium">{error}</p></div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-[#ededed] rounded-md"><p className="text-green-600 text-sm font-medium">{success}</p></div>}
        <label className="block text-sm font-semibold text-gray-900 mb-[10px]">Email Address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" className="w-full px-4 py-3 border border-[#ededed] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 disabled:opacity-50 bg-[#fff]" disabled={isLoading} />
        <div className="text-left mt-[12px] mb-[45px]">
          <button onClick={handleSendOtp} disabled={isLoading} className="text-primary text-sm font-semibold underline hover:text-blue-700 transition-colors disabled:opacity-50">{hasSentOtp ? "Resend OTP" : "Send OTP"}</button>
        </div>
        <div className="mb-6">
          <div className="flex justify-center space-x-3 mb-4">
            {otp.map((digit, index) => (
              <input key={index} id={`otp-${index}`} type="text" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} className="w-12 h-12 text-secondary text-center border border-[#e7e7ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium disabled:opacity-50 bg-[#fff]" maxLength={1} disabled={isLoading || !isOtpSent} />
            ))}
          </div>
        </div>
        <button onClick={handleVerify} disabled={isButtonDisabled()} className="w-full bg-[#266ca8] text-white py-3 px-4 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center rounded-[8px]">{isLoading ? "Verifying..." : "Verify"}</button>
      </div>
    </div>
  );
}