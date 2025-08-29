"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ForgotPasswordResponse {
  message: string;
  otpSent?: boolean;
}

interface VerifyOTPResponse {
  message: string;
  resetToken?: string;
  verified?: boolean;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasSentOtp, setHasSentOtp] = useState(false);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleGoBack = () => {
    router.push("/auth/login");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 4) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: ForgotPasswordResponse = await response.json();

      if (response.ok) {
        setSuccess("OTP sent successfully to your email!");
        setIsOtpSent(true);
        setHasSentOtp(true);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 5) {
      setError("Please enter the complete 5-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data: VerifyOTPResponse = await response.json();

      if (response.ok && data.verified) {
        setSuccess("OTP verified successfully! Redirecting...");
        setResetToken(data.resetToken || "");
        setTimeout(() => {
          router.push(`/auth/reset-password?token=${data.resetToken}`);
        }, 1500);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 5 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      inputRefs.current[4]?.focus();
    }
  };

  // Disable button until OTP fully entered
  const isButtonDisabled = () => {
    if (isLoading) return true;
    if (!isOtpSent) return true; // disabled until OTP is sent
    return otp.join("").length !== 5; // require all 5 digits
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#ededed] p-8">
        {/* Header */}
        <div className="flex items-center mb-8" onClick={handleGoBack}>
          <div className="relative w-[21.58px] h-[21.58px] sm:w-[30px] sm:h-[30px] flex items-center justify-center">
            <Image
              src="/images/icons/auth/BackTick.svg"
              alt="Go Back"
              fill
              className="cursor-pointer"
              onClick={() => router.push("/auth/forgot-password")}
              priority
            />
          </div>
          <span className="text-[#666666] font-semibold text-[12px] sm:text-[16px]">
            Go Back
          </span>
        </div>

        <h1 className="text-2xl font-bold text-center text-secondary mb-[10px]">
          Forgot Password?
        </h1>

        <p className="text-center text-[#666666] mb-8 leading-relaxed">
          Enter the email address linked to your account, and we&apos;ll send
          you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-[#ededed] rounded-md">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-[#ededed] rounded-md">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Email Input */}
        <label className="block text-sm font-semibold text-gray-900 mb-[10px]">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full px-4 py-3 border border-[#ededed] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400 disabled:opacity-50 bg-[#fff]"
          disabled={isLoading}
        />

        <div className="text-left mt-[12px] mb-[45px]">
          <button
            onClick={handleSendOtp}
            disabled={isLoading}
            className="text-primary text-sm font-semibold underline hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            {hasSentOtp ? "Resend OTP" : "Send OTP"}
          </button>
        </div>

        {/* OTP Inputs */}
        <div className="mb-6">
          <div className="flex justify-center space-x-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                onPaste={handlePaste}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 bg-[#868795] text-secondary text-center border border-[#e7e7ea] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium disabled:opacity-50 bg-[#fff]"
                maxLength={1}
                disabled={isLoading || !isOtpSent}
                placeholder="1"
              />
            ))}
          </div>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isButtonDisabled()}
          className="w-full bg-[#266ca8] text-white py-3 px-4 font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center rounded-[8px]"
        >
          {isLoading && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          Verify
        </button>
      </div>
    </div>
  );
}
