"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LoginResponse {
  message: string;
  success: boolean;
  token?: string;
  admin?: { _id: string; username: string; email: string };
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const handlePopState = () => router.replace("/");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data: LoginResponse = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.token) localStorage.setItem("admin-token", data.token);
      if (data.admin) localStorage.setItem("admin-profile", JSON.stringify(data.admin));
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => router.push("/admin/dashboard"), 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid Credentials";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <div className="w-full flex flex-col justify-center items-center px-4 py-6 overflow-y-auto">
        <div className="w-[323px] sm:w-[449px] min-h-[400px] mx-auto bg-white border border-[#ededed] p-6 lg:p-8">
          <div className="mx-auto flex flex-col items-center justify-center">
            <div className="mb-6 relative">
              <div className="flex items-center justify-center text-primary text-xl font-bold">
                <Image src="/images/logo/auth/LumaShape.svg" alt="" className="md:w-[304px] w-[200px]" width={304} height={69} />
              </div>
            </div>
            <div className="text-center mb-4">
              <h1 className="text-[18px] sm:text-[24px] font-bold text-gray-900 mb-1">Admin Login</h1>
            </div>
          </div>

          {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md"><p className="text-red-600 text-xs font-medium">{error}</p></div>}
          {success && <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md"><p className="text-green-600 text-xs font-medium">{success}</p></div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-[16px] sm:text-[14px] font-semibold text-secondary mb-1">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 disabled:opacity-50 text-sm" required disabled={isLoading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-[16px] sm:text-[14px] font-semibold text-secondary mb-1">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your Password" className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 pr-10 disabled:opacity-50 text-sm" required disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 cursor-pointer" disabled={isLoading}>
                  {showPassword ? <Image src="/images/icons/auth/Eye.svg" alt="" height={26} width={26} className="text-gray-400" /> : <Image src="/images/icons/auth/EyeClosed.svg" alt="" height={26} width={26} className="text-gray-400" />}
                </button>
              </div>
              <div className="text-left mt-1">
                <a href="/admin/forgot-password" className="text-xs font-bold underline text-primary hover:text-blue-500">Forgot Password?</a>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm mt-4 cursor-pointer">
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}