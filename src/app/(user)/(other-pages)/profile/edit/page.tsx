"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EditProfile from "./EditProfile/page";
import ChangePassword from "./ChangePassword/page";
import AccountPrivacy from "./AccountPrivacy/page";
import LogoutTab from "./Logout/page";
import { X } from "lucide-react";
import { ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("edit");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    avatar?: string;
    profilePic?: string;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const storedData = localStorage.getItem("edit-profile-data");
    if (storedData) {
      try {
        setProfileData(JSON.parse(storedData));
      } catch (err) {
        console.error("Error parsing profile data:", err);
      }
    }
  }, []);



  const renderTab = () => {
    switch (activeTab) {
      case "edit":
        return <EditProfile />;
      case "password":
        return <ChangePassword />;
      case "privacy":
        return <AccountPrivacy />;
      case "logout":
        return <LogoutTab />;
      default:
        return <EditProfile />;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/profile/deleteAccount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        console.log("✅ Account deletion confirmed:", data);

        // Optionally clear local storage & redirect to login
        localStorage.removeItem("auth-token");
        localStorage.removeItem("edit-profile-data");
        router.push("/auth/login");
      } else {
        console.error("❌ Delete failed:", data.message);
      }
    } catch (err) {
      console.error("Error deleting account:", err);
    } finally {
      setShowDeleteModal(false);
    }
  };


  const renderProfileImage = () => {
    if (profileData?.profilePic) {
      return (
        <img
          src={profileData.profilePic}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover"
        />
      );
    } else if (profileData?.avatar) {
      return (
        <img
          src={profileData.avatar}
          alt="Avatar"
          className="w-16 h-16 rounded-full object-cover"
        />
      );
    } else {
      return (
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
          {profileData?.email?.charAt(0).toUpperCase() ||
            profileData?.name?.charAt(0).toUpperCase() ||
            "M"}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4">
        <ArrowLeft
          className="w-5 h-5 text-gray-600 cursor-pointer"
          onClick={() => router.push("/profile")}
        />
        <h1 className="text-lg font-semibold text-gray-800">Edit Profile</h1>
      </div>

      <div className="flex flex-1 px-6 pb-6">
        <div className="bg-white w-full rounded-xl shadow-sm flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-gray-200 p-6 flex flex-col gap-8">
            <div className="flex flex-col items-center text-center">
              {renderProfileImage()}
              <h2 className="mt-3 text-sm font-medium text-gray-800">
                {profileData?.name || "Alex Havaidai"}
              </h2>
              <p className="text-xs text-gray-500">
                {profileData?.email || "alexhavaidai123@gmail.com"}
              </p>
            </div>

            {/* Sidebar Nav */}
            <nav className="flex flex-col gap-6 text-lg">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center justify-between w-full ${activeTab === "edit"
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <img
                    src={
                      activeTab === "edit"
                        ? "/images/icons/profile/active/edit.svg"
                        : "/images/icons/profile/edit.svg"
                    }
                    alt="Edit"
                    className="w-5 h-5"
                  />
                  Edit Profile
                </span>
                <img
                  src="/images/icons/profile/arrow.svg"
                  alt="Arrow"
                  className="w-4 h-4 text-primary"
                />
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`flex items-center justify-between w-full ${activeTab === "password"
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <img
                    src={
                      activeTab === "password"
                        ? "/images/icons/profile/active/password.svg"
                        : "/images/icons/profile/password.svg"
                    }
                    alt="Password"
                    className="w-5 h-5"
                  />
                  Change Password
                </span>
                <img
                  src="/images/icons/profile/arrow.svg"
                  alt="Arrow"
                  className="w-4 h-4 text-primary"
                />
              </button>

              <button
                onClick={() => setActiveTab("privacy")}
                className={`flex items-center justify-between w-full ${activeTab === "privacy"
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <img
                    src={
                      activeTab === "privacy"
                        ? "/images/icons/profile/active/privacy.svg"
                        : "/images/icons/profile/privacy.svg"
                    }
                    alt="Privacy"
                    className="w-5 h-5"
                  />
                  Account Privacy
                </span>
                <img
                  src="/images/icons/profile/arrow.svg"
                  alt="Arrow"
                  className="w-4 h-4 text-primary"
                />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-between w-full text-gray-600 hover:text-red-600"
              >
                <span className="flex items-center gap-3">
                  <img src="/images/icons/profile/delete.svg" alt="Delete" className="w-5 h-5" />
                  Delete Account
                </span>
              </button>

              <button
                onClick={() => setActiveTab("logout")}
                className={`flex items-center justify-between w-full ${activeTab === "logout"
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
                  }`}
              >
                <span className="flex items-center gap-3">
                  <img
                    src={"/images/icons/profile/logout.svg"
                    }
                    alt="Logout"
                    className="w-5 h-5"
                  />
                  Logout
                </span>
              </button>
            </nav>

          </aside>

          {/* Main Content */}
          <main className="flex-1 p-10">{renderTab()}</main>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          ></div>

          <div className="relative z-10 flex items-center justify-center min-h-full p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">!</span>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Delete Account?
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Deleting your account will erase all your saved tools, layouts,
                  and settings. Do you want to continue?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
