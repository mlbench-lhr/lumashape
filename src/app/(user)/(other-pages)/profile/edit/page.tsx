"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import EditProfile from "./EditProfile/page";
import ChangePassword from "./ChangePassword/page";
import AccountPrivacy from "./AccountPrivacy/page";
import LogoutTab from "./Logout/page";
import { X } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { UserContext } from "@/context/UserContext";

export default function ProfilePage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    avatar?: string;
    profilePic?: string;
  } | null>(null);

  const router = useRouter();
  const { logout } = useContext(UserContext);

  useEffect(() => {
    if (!localStorage.getItem("auth-token")) {
      router.push("/auth/login");
    }
  }, []);

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4 border-b border-gray-100">
        <ArrowLeft
          className="w-5 h-5 text-gray-600 cursor-pointer"
          onClick={() => {
            if (!showSidebar && window.innerWidth < 768) {
              setShowSidebar(true);
            } else {
              router.push("/profile");
            }
          }}
        />
        <h1 className="text-lg font-semibold text-gray-800">
          {showSidebar ? "Edit Profile" :
            activeTab === "edit" ? "Edit Profile" :
              activeTab === "password" ? "Change Password" :
                activeTab === "privacy" ? "Account Privacy" :
                  activeTab === "logout" ? "Logout" : "Edit Profile"}
        </h1>
      </div>

      <div className="flex flex-1">
        {/* Mobile View */}
        <div className="md:hidden bg-white w-full">
          {/* Show sidebar when showSidebar is true */}
          {showSidebar ? (
            <>
              <div className="p-4 flex flex-col items-center border-b border-gray-100">
                <div className="mb-3">
                  {renderProfileImage()}
                </div>
                <h2 className="text-sm font-medium text-gray-800">
                  {profileData?.name || "Alex Havaidai"}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  {profileData?.email || "alexhavaidai123@gmail.com"}
                </p>

                {/* Mobile Navigation */}
                <div className="w-full flex flex-col">
                  <button
                    onClick={() => {
                      setActiveTab("edit");
                      setShowSidebar(false);
                    }}
                    className="flex items-center font-semibold justify-between w-full p-3 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-3">
                      <img
                        src="/images/icons/profile/edit.svg"
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
                    onClick={() => {
                      setActiveTab("password");
                      setShowSidebar(false);
                    }}
                    className="flex items-center font-semibold justify-between w-full p-3 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-3">
                      <img
                        src="/images/icons/profile/password.svg"
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
                    onClick={() => {
                      setActiveTab("privacy");
                      setShowSidebar(false);
                    }}
                    className="flex items-center font-semibold justify-between w-full p-3 border-b border-gray-100"
                  >
                    <span className="flex items-center gap-3">
                      <img
                        src="/images/icons/profile/privacy.svg"
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
                    className="flex items-center font-semibold justify-between w-full p-3 border-b border-gray-100 text-red-500"
                  >
                    <span className="flex items-center gap-3">
                      <img
                        src="/images/icons/profile/delete.svg"
                        alt="Delete"
                        className="w-5 h-5"
                      />
                      Delete Account
                    </span>
                  </button>

                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center font-semibold justify-between w-full p-3 text-gray-600"
                  >
                    <span className="flex items-center gap-3">
                      <img
                        src="/images/icons/profile/logout.svg"
                        alt="Logout"
                        className="w-5 h-5"
                      />
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Show tab content as a full page when sidebar is hidden
            <div className="p-4">
              {renderTab()}
            </div>
          )}
        </div>

        {/* Desktop View - Sidebar + Content */}
        <div className="hidden md:flex w-full gap-6 px-4 sm:px-6 pb-6">
          {/* Sidebar */}
          <div className="w-1/3 max-w-xs bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="mb-3">
                {renderProfileImage()}
              </div>
              <h2 className="text-base font-medium text-gray-800">
                {profileData?.name || "Alex Havaidai"}
              </h2>
              <p className="text-sm text-gray-500">
                {profileData?.email || "alexhavaidai123@gmail.com"}
              </p>
            </div>

            {/* Sidebar Nav */}
            <nav className="flex flex-col gap-6 text-lg">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg ${activeTab === "edit"
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
                className={`flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg ${activeTab === "password"
                  ? "text-primary font-medium"
                  : "text-gray-600 hover:text-primary"
                  }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      activeTab === "password"
                        ? "/images/icons/profile/active/password.svg"
                        : "/images/icons/profile/password.svg"
                    }
                    alt="Password"
                    className="w-5 h-5 flex-shrink-0"
                  />
                  <span className="truncate">Change Password</span>
                </span>
                <img
                  src="/images/icons/profile/arrow.svg"
                  alt="Arrow"
                  className="w-4 h-4 text-primary flex-shrink-0"
                />
              </button>



              <button
                onClick={() => setActiveTab("privacy")}
                className={`flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg ${activeTab === "privacy"
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
                  <span className="truncate">Account Privacy</span>
                </span>
                <img
                  src="/images/icons/profile/arrow.svg"
                  alt="Arrow"
                  className="w-4 h-4 text-primary"
                />
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg text-red-500"
              >
                <span className="flex items-center gap-3">
                  <img
                    src="/images/icons/profile/delete.svg"
                    alt="Delete"
                    className="w-5 h-5"
                  />
                  Delete Account
                </span>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center justify-between font-semibold w-full text-sm sm:text-base md:text-lg text-gray-600 hover:text-primary"
              >
                <span className="flex items-center gap-3">
                  <img
                    src="/images/icons/profile/logout.svg"
                    alt="Logout"
                    className="w-5 h-5"
                  />
                  Logout
                </span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6">
            {renderTab()}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center p-6 pb-4">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center border-2 border-white">
                  <span className="text-white text-2xl font-bold">i</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Delete Account?</h2>
              <p className="text-gray-600 text-center mb-6">
                Deleting your account will erase all your saved tools, layouts, and settings. Do you want to continue?
              </p>
              <div className="flex w-full gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center p-6 pb-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white">
                  <span className="text-white text-2xl font-bold">!</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Logout?</h2>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to logout? You’ll need to log in again to access your account.
              </p>
              <div className="flex w-full gap-4">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout(); // 👈 Call actual logout
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
