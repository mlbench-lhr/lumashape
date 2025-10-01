"use client";
import React, { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserContext } from "@/context/UserContext";
import Image from "next/image";

interface LoginResponse {
  message: string;
  user: {
    _id: string;
    username: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  token?: string; // Optional for localStorage approach
}

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const router = useRouter();
  const { login } = useContext(UserContext);

  // Enforce back button always going to "/"
  useEffect(() => {
    // When back button is pressed from login, force redirect to "/"
    const handlePopState = () => {
      router.replace("/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  //   // Login function using HTTP-only cookies (recommended)
  const loginWithCookies = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await fetch("/api/user/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    const { token } = data;
    login(token);

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Please fill in all fields");
      }

      // Use cookies approach (recommended)
      const result = await loginWithCookies(email, password);

      // Alternative: Use localStorage approach
      // const result = await loginWithLocalStorage(email, password);

      setSuccess("Login successful! Redirecting...");

      // Redirect to dashboard or home page
      setTimeout(() => {
        router.push("/workspace"); // Change this to your desired redirect path
      }, 1500);
    } catch (err: unknown) {
      let message = "Invalid Credentials";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        typeof err.response
      ) {
        message = typeof err.response;
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoBack = () => {
    router.push("/");
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Centered Sign-In Form with Go Back */}
      <div className="w-full flex flex-col justify-center items-center px-4 py-6 overflow-y-auto">
        {/* Sign-In Form Card */}
        <div className="w-[323px] sm:w-[449px] min-h-[400px] mx-auto bg-white border border-[#ededed] p-6 lg:p-8">
          <div className="mx-auto flex flex-col items-center justify-center">
            <div className="mb-6 relative">
              {/* Go Back Button - positioned absolutely on the left */}

              {/* Logo - centered */}
              <div className="flex items-center justify-center text-primary text-xl font-bold">
                {/* <img src="/images/Stelomic.svg" alt="" /> */}
                <Image
                  src="/images/logo/auth/LumaShape.svg"
                  alt=""
                  className="md:w-[304px] w-[200px]"
                  width={304}
                  height={69}
                />
                {/* <span className='ml-2 text-2xl'>Stelomic</span> */}
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-[18px] sm:text-[24px] font-bold text-gray-900 mb-1">
                Sign in to Lumashape
              </h1>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-xs font-medium">{success}</p>
            </div>
          )}

          {/* Social Sign In Buttons */}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="block text-[16px] sm:text-[14px] font-semibold text-secondary mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 disabled:opacity-50 text-sm"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[16px] sm:text-[14px] font-semibold text-secondary mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 pr-10 disabled:opacity-50 text-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50 cursor-pointer"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <Image
                      src="/images/icons/auth/Eye.svg"
                      alt=""
                      height={26}
                      width={26}
                      className="text-gray-400"
                    />
                  ) : (
                    <Image
                      src="/images/icons/auth/EyeClosed.svg"
                      alt=""
                      height={26}
                      width={26}
                      className="text-gray-400"
                    />
                  )}
                </button>
              </div>
              <div className="text-left mt-1">
                <a
                  href="/auth/forgot-password"
                  className="text-xs font-bold underline text-primary hover:text-blue-500"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm mt-4 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <span className="text-xs text-secondary font-bold">
              Don&apos;t have an account?{" "}
              <a
                href="/auth/signup"
                className="text-primary underline font-semibold"
              >
                Sign Up
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
