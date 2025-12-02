"use client";
import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-screen flex overflow-hidden bg-gray-50" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!formData.password.trim() || !formData.confirmPassword.trim()) { setError("Please fill in all fields"); setIsLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); setIsLoading(false); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters long"); setIsLoading(false); return; }
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: token, newPassword: formData.password }),
      });
      const data = await res.json();
      if (res.ok && data.success) router.push("/admin/login");
      else setError(data.message || "Failed to reset password");
    } catch { setError("Network error. Please try again."); } finally { setIsLoading(false); }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <div className="w-full flex flex-col justify-center items-center px-4 py-6 overflow-y-auto">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 lg:p-8">
          <div className="flex gap-[3px] h-[30px] w-[96px] items-center justify-center">
            <div className="relative w-[21.58px] h-[21.58px] sm:w-[30px] sm:h-[30px] flex items-center justify-center">
              <Image src="/images/icons/auth/BackTick.svg" alt="Go Back" fill className="cursor-pointer" onClick={() => router.push("/admin/forgot-password")} priority />
            </div>
            <span className="text-[#666666] font-semibold text-[12px] sm:text-[16px]">Go Back</span>
          </div>
          <div className="mb-6 relative mt-[35px]">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h1>
              <span className="text-[14px] text-gray-600">Set a new password to sign in</span>
              {error && <div className="mt-4 p-3 bg-red-50 border border-[#ededed] rounded-md"><p className="text-red-600 text-sm font-medium">{error}</p></div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-[16px] sm:text-[14px] font-semibold text-secondary mb-1 mt-5 text-left">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} placeholder="Enter your password" className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 disabled:opacity-50 text-sm" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50">
                    {showPassword ? <Image src="/images/icons/auth/Eye.svg" alt="" height={26} width={26} className="text-gray-400" /> : <Image src="/images/icons/auth/EyeClosed.svg" alt="" height={26} width={26} className="text-gray-400" />}
                  </button>
                </div>
                <div>
                  <label className="block text-secondary text-left text-[16px] sm:text-[14px] font-semibold mb-1">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Enter your Password" disabled={isLoading} className="text-secondary w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm disabled:opacity-50" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50">
                      {showConfirmPassword ? <Image src="/images/icons/auth/Eye.svg" alt="" height={26} width={26} className="text-gray-400" /> : <Image src="/images/icons/auth/EyeClosed.svg" alt="" height={26} width={26} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-2.5 cursor-pointer px-4 rounded-lg transition-colors font-medium mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? "Saving..." : "Continue"}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}