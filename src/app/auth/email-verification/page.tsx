"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface ForgotPasswordResponse {
  message: string;
  otpSent?: boolean;
}

interface VerifyOTPResponse {
  message: string;
  resetToken?: string;
  verified?: boolean;
}

interface ResetPasswordResponse {
  message: string;
  success?: boolean;
}

export default function EmailVerificationScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(true);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleGoBack = () => {
    if (isOtpVerified) {
      setIsOtpVerified(false);
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (isOtpSent) {
      setIsOtpSent(false);
      setOtp(["", "", "", "", ""]);
    } else {
      router.push("/auth/login");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/auth/email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: ForgotPasswordResponse = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setIsOtpSent(true);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const email = localStorage.getItem("stelomic_signup_email");
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpValue }),
      });

      const data: VerifyOTPResponse = await response.json();

      if (response.ok && data.verified) {
        setSuccess("OTP verified successfully!");
        // localStorage.setItem('stelomic_reset_email',  '');
        setResetToken(data.resetToken || "");
        setIsOtpVerified(true);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (error) {
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
      inputRefs.current[5]?.focus();
    }
  };

  const getTitle = () => {
    return "Email Verification?";
  };

  const getDescription = () => {
    // const email =localStorage.getItem('stelomic_signup_email');

    if (isOtpVerified) return "Enter your new password below.";
    if (isOtpSent)
      return `We've sent a 5-digit OTP to ${email}. Please enter it below.`;
    return "Enter the email address linked to your account, and we'll send you an OTP to reset your password.";
  };

  useEffect(() => {
    if (isOtpVerified) {
      router.push("/auth/login");
    }
  }, [isOtpVerified]);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg border-2 border-gray-300 p-8">
        {/* Header */}
        <div className="flex items-center mb-8" onClick={handleGoBack}>
          <ChevronLeft className="w-5 h-5 text-primary cursor-pointer" />
          <span className="ml-2 text-secondary cursor-pointer font-semibold">
            Go Back
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-secondary mb-4">
          {getTitle()}
        </h1>

        {/* Description */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          {getDescription()}
        </p>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Step 2: OTP Input Fields */}
        {isOtpSent && !isOtpVerified && (
          <>
            <div className="mb-8">
              <div className="flex justify-center space-x-4 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={digit}
                    onPaste={handlePaste}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-secondary text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium disabled:opacity-50"
                    maxLength={1}
                    disabled={isLoading}
                  />
                ))}
              </div>

              <div className="text-center mb-6">
                <button
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="text-primary font-medium underline  transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.join("").length !== 5}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium  disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
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
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
