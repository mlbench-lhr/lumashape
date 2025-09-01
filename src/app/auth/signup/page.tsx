"use client";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signup = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all fields", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    // Clear any previous error messages
    toast.dismiss();

    // Send data to the API
    try {
      const response = await fetch("/api/user/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
      console.log("Response OK:", response.ok);
      console.log("Response Result:", result);

      if (response.ok) {
        localStorage.setItem("stelomic_signup_email", formData.email);
        toast.success("User created successfully!");

        handleSendOtp();

        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Optionally redirect to login or dashboard
        window.location.href = "/auth/email-verification";
      } else {
        toast.error(result.message || "An error occurred. Please try again.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error("An error occurred while connecting to the server.", {
        position: "top-center",
        autoClose: 5000,
      });
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoBack = () => {
    router.push("/");
  };

  const handleSendOtp = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
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
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

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
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Centered Sign-Up Form */}
      <div className="w-full flex flex-col justify-center items-center px-4 py-6 overflow-y-auto">
        <div
          className="w-full max-w-md mx-auto bg-white p-6 lg:p-8"
          style={{ border: "1px solid #e8e8e8" }}
        >
          {/* Header with Back Button and Centered Logo */}
          <div className="mb-6 relative">
            {/* Go Back Button - positioned absolutely on the left */}

            {/* Logo - centered */}
            <div className="flex items-center justify-center text-primary text-xl font-bold">
              <Image
                src="/images/logo/auth/LumaShape.svg"
                alt=""
                className="md:w-[304px] w-[200px]"
                width={304}
                height={69}
              />
            </div>
          </div>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              Get started with Lumashape
            </h1>
          </div>

          <div className="w-full">
            {/* Social Signup Buttons */}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-secondary text-[16px] sm:text-[14px] font-semibold mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  className="text-secondary w-full px-3 py-2 border rounded-[7.2px] placeholder:text-[14px] placeholder:font-medium"
                  style={{ borderColor: "#e8e8e8" }}
                />
              </div>

              <div>
                <label className="block text-secondary text-[16px] sm:text-[14px] font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                  className="text-secondary w-full px-3 py-2 border rounded-[7.2px] placeholder:text-[14px] placeholder:font-medium"
                  style={{ borderColor: "#e8e8e8" }}
                />
              </div>

              <div>
                <label className="block text-secondary text-[16px] sm:text-[14px] font-semibold mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your Password"
                    disabled={isLoading}
                    className="text-secondary w-full px-3 py-2 border pr-10 text-sm disabled:opacity-50 rounded-[7.2px] placeholder:text-[14px] placeholder:font-medium"
                    style={{ borderColor: "#e8e8e8" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50"
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
              </div>

              <div>
                <label className="block text-secondary text-[16px] sm:text-[14px] font-semibold mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your Password"
                    disabled={isLoading}
                    className="text-secondary w-full px-3 py-2 border pr-10 text-sm disabled:opacity-50 rounded-[7.2px] placeholder:text-[14px] placeholder:font-medium"
                    style={{ borderColor: "#e8e8e8" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50"
                  >
                    {showConfirmPassword ? (
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
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-2.5 cursor-pointer px-4 rounded-lg transition-colors font-medium mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center font-semibold text-gray-700 mt-3 text-xs">
              Already have an account?{" "}
              <a
                href="/auth/login"
                className="text-primary underline font-medium"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
