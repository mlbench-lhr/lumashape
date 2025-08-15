"use client";

import DigitTabs from "@/components/ui/DigitTabs";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email) {
      toast.error("Please fill the email field", {
        position: 'top-center',
        autoClose: 5000,
      })
      setIsLoading(false);
      return;
    }

    toast.dismiss();

    router.push("/auth/reset-password");
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <div className="w-full flex flex-col justify-center items-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 lg:p-8">
          <div className="flex gap-[3px] h-[30px] w-[96px] items-center justify-center">
            <div className="flex w-[30px] h-full items-center justify-center">
              <img
                className="cursor-pointer"
                src="/images/icons/auth/BackTick.svg"
                width={7.5}
                height={15.5}
                onClick={() => {router.push("/auth/login")}}
              />
            </div>
            <span className="text-[#666666] font-semibold">Go Back</span>
          </div>
          <div className="mb-6 relative mt-[35px]">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Forgot Password?
              </h1>
              <span className="text-[14px] text-gray-600">
                Enter the email address linked to your account, and we&apos;ll send
                you a link to reset your password.
              </span>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-bold text-secondary mb-1 mt-5 text-left"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 disabled:opacity-50 text-sm"
                    required
                    // disabled={isLoading}
                  />
                </div>
                <div className="text-left mt-1">
                  <a
                    // href="/auth/reset-password"
                    className="text-xs font-bold underline text-primary hover:text-blue-500 cursor-pointer"
                    onClick={() => {
                      setTimeout(() => {
                        setOtp(true);
                      }, 5000);
                    }}
                  >
                    {otp ? "Resend OTP" : "Send OTP"}
                  </a>
                </div>
                <div className="mt-[45px]">
                  <div className="flex justify-center gap-[15px]">
                    {[...Array(5)].map((_, index) => (
                      <DigitTabs key={index} digit={index + 1} />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2.5 cursor-pointer px-4 rounded-lg transition-colors font-medium mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
