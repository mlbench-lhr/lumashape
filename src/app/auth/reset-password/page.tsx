"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
  import { useRouter } from 'next/navigation';

const ResetPasswordPage = () => {
    const router = useRouter()

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
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

    if (!formData.password) {
      toast.error("Please fill in all fields", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsLoading(false);
      return;
    }

    // Clear any previous error messages
    toast.dismiss();

    router.push("/auth/login")
  };

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
                onClick={() => {router.push("/auth/forgot-password")}}
              />
            </div>
            <span className="text-[#666666] font-semibold">Go Back</span>
          </div>
          <div className="mb-6 relative mt-[35px]">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Reset Password
              </h1>
              <span className="text-[14px] text-gray-600">
                Enter your new password & confirm password to reset your
                password.
              </span>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-secondary mb-1 mt-5 text-left"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 border text-secondary border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 disabled:opacity-50 text-sm"
                    required
                    // disabled={isLoading}
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

                <div>
                  <label className="block text-secondary text-left text-xs font-bold mb-1">
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
                      className="text-secondary w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
                  className="w-full bg-primary text-white py-2.5 cursor-pointer px-4 rounded-lg transition-colors font-medium mt-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
