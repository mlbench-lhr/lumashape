"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  KeyRound,
  Lock,
  Trash2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import EditProfile from "./EditProfile/page";
import ChangePassword from "./ChangePassword/page";
import AccountPrivacy from "./AccountPrivacy/page";
import DeleteAccount from "./DeleteAccount/page";
import LogoutTab from "./Logout/page";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("edit");
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
      case "delete":
        return <DeleteAccount />;
      case "logout":
        return <LogoutTab />;
      default:
        return <EditProfile />;
    }
  };

  // Profile circle rendering
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
          <aside className="w-64 border-r border-gray-200 p-6 flex flex-col gap-6">
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
            <nav className="flex flex-col gap-4 text-sm">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center justify-between w-full ${
                  activeTab === "edit"
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" /> Edit Profile
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab("password")}
                className={`flex items-center justify-between w-full ${
                  activeTab === "password"
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Change Password
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => setActiveTab("privacy")}
                className={`flex items-center justify-between w-full ${
                  activeTab === "privacy"
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Account Privacy
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Delete Account → modal */}
              <button
                onClick={() => setActiveTab("delete")}
                className={`flex items-center justify-between w-full ${
                  activeTab === "delete"
                    ? "text-red-600 font-medium"
                    : "text-gray-600 hover:text-red-600"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </span>
              </button>

              {/* Logout → modal */}
              <button
                onClick={() => setActiveTab("logout")}
                className={`flex items-center justify-between w-full ${
                  activeTab === "logout"
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-10">{renderTab()}</main>
        </div>
      </div>
    </div>
  );
}
