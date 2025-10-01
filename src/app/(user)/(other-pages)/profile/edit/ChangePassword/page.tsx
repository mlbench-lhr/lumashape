"use client";

import { useState } from "react";
import Image from "next/image";

export default function ChangePassword() {
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!oldPassword || !newPassword || !confirmPassword) {
            alert("All fields are required");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("New password and confirmation do not match");
            return;
        }

        try {
            const res = await fetch("/api/profile/changePassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to update password");
                return;
            }

            alert("Password updated successfully!");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    };


    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Change Password
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                {/* Grid Layout for all inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Old Password */}
                    <div>
                        <label className="block text-md font-bold text-gray-700 mb-1">
                            Old Password
                        </label>
                        <div className="relative">
                            <input
                                type={showOld ? "text" : "password"}
                                placeholder="Enter your Old Password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld(!showOld)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <Image
                                    className="cursor-pointer"
                                    src={
                                        showOld
                                            ? "/images/icons/auth/Eye.svg"
                                            : "/images/icons/auth/EyeClosed.svg"
                                    }
                                    alt=""
                                    height={20}
                                    width={20}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Empty spacer to keep grid even */}
                    <div></div>

                    {/* New Password */}
                    <div>
                        <label className="block text-md font-bold text-gray-700 mb-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                placeholder="Enter your Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <Image
                                    className="cursor-pointer"
                                    src={
                                        showNew
                                            ? "/images/icons/auth/Eye.svg"
                                            : "/images/icons/auth/EyeClosed.svg"
                                    }
                                    alt=""
                                    height={20}
                                    width={20}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className="block text-md font-bold text-gray-700 mb-1 truncate">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                placeholder="Enter your Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border rounded-md pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <Image
                                    className="cursor-pointer"
                                    src={
                                        showConfirm
                                            ? "/images/icons/auth/Eye.svg"
                                            : "/images/icons/auth/EyeClosed.svg"
                                    }
                                    alt=""
                                    height={20}
                                    width={20}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-md cursor-pointer"
                >
                    Update Password
                </button>
            </form>
        </div>
    );
}
